// Deno Edge Function: circle-invite
// Generates, validates, and processes Circle invitation codes (Base62 10-12 chars)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateBase62Code(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE62_CHARS[bytes[i] % 62];
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, inviteCode, circleId, userId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ACTION: GENERATE NEW CODE FOR CIRCLE
    if (action === "generate") {
      if (!circleId || !userId) {
        return new Response(JSON.stringify({ error: "Missing circleId or userId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check ownership
      const { data: circle, error: fetchErr } = await supabase
        .from("circles")
        .select("id, owner_id")
        .eq("id", circleId)
        .single();

      if (fetchErr || !circle || circle.owner_id !== userId) {
        return new Response(JSON.stringify({ error: "Only circle owner can generate invite link" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newCode = generateBase62Code(10);
      const { error: updateErr } = await supabase
        .from("circles")
        .update({ invite_code: newCode, updated_at: new Date().toISOString() })
        .eq("id", circleId);

      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ success: true, inviteCode: newCode }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: VALIDATE CODE
    if (action === "validate") {
      if (!inviteCode) {
        return new Response(JSON.stringify({ error: "Missing inviteCode" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: circle, error: circleErr } = await supabase
        .from("circles")
        .select("id, name, avatar_url, is_archived, owner_id")
        .eq("invite_code", inviteCode.trim())
        .maybeSingle();

      if (circleErr || !circle) {
        return new Response(JSON.stringify({ valid: false, error: "Код приглашения не найден" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { count } = await supabase
        .from("circle_members")
        .select("*", { count: "exact", head: true })
        .eq("circle_id", circle.id);

      return new Response(
        JSON.stringify({
          valid: true,
          circle: {
            id: circle.id,
            name: circle.name,
            avatarUrl: circle.avatar_url,
            isArchived: circle.is_archived,
            memberCount: count || 0,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ACTION: JOIN CIRCLE
    if (action === "join") {
      if (!inviteCode || !userId) {
        return new Response(JSON.stringify({ error: "Missing inviteCode or userId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: circle, error: circleErr } = await supabase
        .from("circles")
        .select("id, name, is_archived")
        .eq("invite_code", inviteCode.trim())
        .maybeSingle();

      if (circleErr || !circle) {
        return new Response(JSON.stringify({ error: "Недействительный код приглашения" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check archived status
      if (circle.is_archived) {
        return new Response(
          JSON.stringify({ error: "Круг архивирован. Вступление новых участников запрещено." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Upsert/Insert member
      const { error: joinErr } = await supabase
        .from("circle_members")
        .upsert(
          {
            circle_id: circle.id,
            user_id: userId,
            role: "MEMBER",
          },
          { onConflict: "circle_id, user_id" }
        );

      if (joinErr) throw joinErr;

      return new Response(
        JSON.stringify({
          success: true,
          circleId: circle.id,
          circleName: circle.name,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
