import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getPriceId(plan: string): string | null {
  if (plan === "starter") return Deno.env.get("STRIPE_PRICE_ID_STARTER") || null;
  if (plan === "pro") return Deno.env.get("STRIPE_PRICE_ID_PRO") || null;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { workspace_id, plan } = await req.json();

    if (!workspace_id || !plan) {
      return new Response(JSON.stringify({ error: "Missing workspace_id or plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceId = getPriceId(plan);
    if (!priceId) {
      return new Response(JSON.stringify({ error: "No Stripe price configured for this plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";

    const params = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${appUrl}/billing?checkout=success&plan=${encodeURIComponent(plan)}`,
      cancel_url: `${appUrl}/billing?checkout=cancelled`,
      "metadata[workspace_id]": workspace_id,
      "metadata[plan]": plan,
      "subscription_data[metadata][workspace_id]": workspace_id,
      "subscription_data[metadata][plan]": plan,
    });

    const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const stripeData = await stripeResp.json();
    if (!stripeResp.ok) {
      return new Response(JSON.stringify({ error: stripeData?.error?.message || "Stripe checkout session failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: ws } = await supabase.from("workspaces").select("onboarding_config").eq("id", workspace_id).single();
    const onboarding = (ws?.onboarding_config && typeof ws.onboarding_config === "object") ? ws.onboarding_config as Record<string, unknown> : {};
    const billing = {
      ...(typeof onboarding.billing === "object" ? onboarding.billing as Record<string, unknown> : {}),
      selected_plan: plan,
      stripe_checkout_session_id: stripeData.id,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("workspaces").update({ onboarding_config: { ...onboarding, billing } as any }).eq("id", workspace_id);

    return new Response(JSON.stringify({ url: stripeData.url, id: stripeData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
