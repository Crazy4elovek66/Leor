// Deno Edge Function: telegram-auth
// Validates Telegram WebApp initData HMAC signature & auth_date replay protection, upserts user & gift_profile

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

const MAX_AUTH_AGE_SECONDS = 86400; // 24 hours TTL for Telegram WebApp initData

async function validateTelegramInitData(
  initDataStr: string,
  botToken: string
): Promise<{ isValid: boolean; reason?: string; user?: TelegramUser }> {
  try {
    const cleanInitData = initDataStr.trim();
    const urlParams = new URLSearchParams(cleanInitData);
    const hash = urlParams.get("hash");
    if (!hash) return { isValid: false, reason: "Missing hash parameter" };

    // Replay attack prevention: check auth_date
    const authDateStr = urlParams.get("auth_date");
    if (!authDateStr) return { isValid: false, reason: "Missing auth_date" };
    
    const authDate = parseInt(authDateStr, 10);
    const now = Math.floor(Date.now() / 1000);
    
    if (isNaN(authDate)) return { isValid: false, reason: "Invalid auth_date format" };
    if (now - authDate > MAX_AUTH_AGE_SECONDS) {
      return { isValid: false, reason: "Session expired (replay attack protection)" };
    }
    if (authDate > now + 300) {
      return { isValid: false, reason: "auth_date is in the future" };
    }

    urlParams.delete("hash");

    // Sort keys alphabetically
    const dataCheckArr: string[] = [];
    urlParams.sort();
    for (const [key, value] of urlParams.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    const dataCheckString = dataCheckArr.join("\n");

    // Secret Key = HMAC_SHA256("WebAppData", botToken)
    const encoder = new TextEncoder();
    const secretKeyCrypto = await crypto.subtle.importKey(
      "raw",
      encoder.encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const secretKeyBuf = await crypto.subtle.sign(
      "HMAC",
      secretKeyCrypto,
      encoder.encode(botToken)
    );

    // Calculated Hash = HMAC_SHA256(secretKey, dataCheckString)
    const dataKeyCrypto = await crypto.subtle.importKey(
      "raw",
      secretKeyBuf,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const hashBuf = await crypto.subtle.sign(
      "HMAC",
      dataKeyCrypto,
      encoder.encode(dataCheckString)
    );

    const calculatedHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (calculatedHash !== hash) {
      return { isValid: false, reason: "HMAC signature mismatch" };
    }

    const userStr = urlParams.get("user");
    if (!userStr) return { isValid: false, reason: "Missing user payload" };
    const user: TelegramUser = JSON.parse(userStr);

    return { isValid: true, user };
  } catch (err: any) {
    console.error("HMAC Validation exception");
    return { isValid: false, reason: "Validation error" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    if (!initData || typeof initData !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid initData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    let telegramUser: TelegramUser | undefined;

    if (botToken) {
      const validation = await validateTelegramInitData(initData, botToken);
      if (!validation.isValid || !validation.user) {
        return new Response(
          JSON.stringify({ error: validation.reason || "Invalid Telegram signature" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      telegramUser = validation.user;
    } else {
      console.warn("TELEGRAM_BOT_TOKEN environment variable is not configured. Running fallback mode.");
      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get("user");
      if (userStr) {
        telegramUser = JSON.parse(userStr);
      }
    }

    if (!telegramUser) {
      return new Response(JSON.stringify({ error: "User payload not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Upsert User
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .upsert(
        {
          telegram_id: telegramUser.id,
          username: telegramUser.username ?? null,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name ?? null,
          avatar_url: telegramUser.photo_url ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "telegram_id" }
      )
      .select()
      .single();

    if (userError || !dbUser) {
      throw userError || new Error("Failed to upsert user");
    }

    // 2. Ensure GiftProfile exists
    const { data: existingProfile } = await supabase
      .from("gift_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .maybeSingle();

    let profileId = existingProfile?.id;

    if (!profileId) {
      const { data: newProfile, error: profileError } = await supabase
        .from("gift_profiles")
        .insert({ user_id: dbUser.id })
        .select("id")
        .single();
      if (profileError) throw profileError;
      profileId = newProfile.id;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: dbUser.id,
          telegramId: dbUser.telegram_id,
          username: dbUser.username,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          avatarUrl: dbUser.avatar_url,
          profileId: profileId,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
