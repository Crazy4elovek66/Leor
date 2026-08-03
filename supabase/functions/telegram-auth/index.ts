// Deno Edge Function: telegram-auth
// Validates Telegram WebApp initData HMAC signature & auth_date replay protection,
// creates/retrieves Supabase Auth user & public tables via Service Role (supabaseAdmin),
// and returns access_token + refresh_token.

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

declare const Deno: any;

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
  } catch (_err: any) {
    console.error("HMAC Validation exception");
    return { isValid: false, reason: "Validation error" };
  }
}

serve(async (req: any) => {
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
      console.warn("TELEGRAM_BOT_TOKEN environment variable is not configured. Running fallback validation mode.");
      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get("user");
      if (userStr) {
        telegramUser = JSON.parse(userStr);
      }
    }

    if (!telegramUser) {
      return new Response(JSON.stringify({ error: "User payload not found in initData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Supabase Service Role configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create a dedicated service role client
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 2. Supabase Auth User setup via Admin API
    const email = `telegram_${telegramUser.id}@leor.local`;
    const password = `Leor_TgAuth_${telegramUser.id}_${supabaseServiceKey.slice(0, 16)}`;

    let session = null;
    let authUser = null;

    // Try signing in
    const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session && signInData?.user) {
      session = signInData.session;
      authUser = signInData.user;
    } else {
      // Create user via Admin API
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramUser.id,
          first_name: telegramUser.first_name,
        },
      });

      if (createError || !createData.user) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = listData?.users?.find((u: any) => u.email === email);
        
        if (existingAuthUser) {
          await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, { password });
          const { data: reSignInData, error: reSignInErr } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
          });

          if (reSignInErr || !reSignInData.session || !reSignInData.user) {
            throw reSignInErr || new Error("Failed to sign in existing auth user");
          }
          session = reSignInData.session;
          authUser = reSignInData.user;
        } else {
          throw createError || new Error("Failed to create Supabase Auth user");
        }
      } else {
        authUser = createData.user;
        const { data: newSignInData, error: newSignInErr } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

        if (newSignInErr || !newSignInData.session) {
          throw newSignInErr || new Error("Failed to sign in newly created Supabase Auth user");
        }
        session = newSignInData.session;
      }
    }

    // 3. Upsert public.users record via supabaseAdmin
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: authUser.id,
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

    if (userError || !user) {
      console.error("User upsert error:", userError);
      throw userError || new Error("Failed to upsert user record");
    }

    // 4. Ensure GiftProfile exists for public.users via supabaseAdmin
    const { data: existingProfile } = await supabaseAdmin
      .from("gift_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let profile = existingProfile;

    if (!profile) {
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from("gift_profiles")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (profileError) {
        console.error("Gift profile creation error:", profileError);
        throw profileError;
      }
      profile = newProfile;
    }

    // 5. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: {
          id: user.id,
          telegramId: Number(user.telegram_id),
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          avatarUrl: user.avatar_url,
          profileId: profile.id,
        },
        profileId: profile.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Auth function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
