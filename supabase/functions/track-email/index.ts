import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js"

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TRANSPARENT_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
  0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B
]);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // 'open' or 'click'
  const token = url.searchParams.get("token"); // tracking_token
  const target = url.searchParams.get("target"); // target redirect URL

  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  try {
    // 1. Find the event
    const { data: event, error: eventError } = await supabase
      .from('email_events')
      .select('id, campaign_id, contact_id')
      .eq('tracking_token', token)
      .single();

    if (event && !eventError) {
      // 2. Log the specific tracking event
      await supabase.from('email_events').insert({
        campaign_id: event.campaign_id,
        contact_id: event.contact_id,
        event_type: type === 'click' ? 'clicked' : 'opened',
        metadata: { 
          target_url: target,
          user_agent: req.headers.get("user-agent"),
          ip: req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")
        }
      });
    }

    // 3. Response based on type
    if (type === 'click' && target) {
      return Response.redirect(target, 302);
    }

    // Default to pixel for opens or fallback
    return new Response(TRANSPARENT_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

  } catch (error) {
    console.error("Tracking error:", error);
    // Silent fail for user, return pixel or target anyway
    if (type === 'click' && target) return Response.redirect(target, 302);
    return new Response(TRANSPARENT_PIXEL, { headers: { "Content-Type": "image/gif" } });
  }
})
