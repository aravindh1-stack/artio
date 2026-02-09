import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("ARTIO_SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("ARTIO_SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("ARTIO_SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const storageBucket = Deno.env.get("ARTIO_STORAGE_BUCKET") ?? "";

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !storageBucket) {
    return new Response(JSON.stringify({ error: "Missing server configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const productId = body?.productId;

    if (!productId) {
      return new Response(JSON.stringify({ error: "Product ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: paidOrder, error: orderError } = await serviceClient
      .from("orders")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (orderError || !paidOrder) {
      return new Response(JSON.stringify({ error: "Payment not confirmed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: orderItem } = await serviceClient
      .from("order_items")
      .select("id")
      .eq("order_id", paidOrder.id)
      .eq("product_id", productId)
      .single();

    if (!orderItem) {
      return new Response(JSON.stringify({ error: "No paid order for this product" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: product, error: productError } = await serviceClient
      .from("products")
      .select("full_image_path")
      .eq("id", productId)
      .single();

    if (productError || !product?.full_image_path) {
      return new Response(JSON.stringify({ error: "File not available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signed, error: signError } = await serviceClient
      .storage
      .from(storageBucket)
      .createSignedUrl(product.full_image_path, 300);

    if (signError || !signed?.signedUrl) {
      return new Response(JSON.stringify({ error: "Unable to create signed URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: signed.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
