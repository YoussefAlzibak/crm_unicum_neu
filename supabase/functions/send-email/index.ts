import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js"
import nodemailer from "npm:nodemailer"

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { org_id, to, subject, html, text, campaign_id, contact_id } = await req.json();

    if (!org_id || !to || !subject) {
      throw new Error("Missing required fields: org_id, to, subject");
    }

    // Fetch SMTP settings for the organization
    const { data: smtpSettings, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('org_id', org_id)
      .single();

    if (smtpError || !smtpSettings) {
      throw new Error("Failed to fetch SMTP settings for this organization: " + (smtpError?.message || "Not found"));
    }

    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      auth: {
        user: smtpSettings.user_name,
        pass: smtpSettings.password_encrypted,
      },
    });

    // 1. Generate Tracking Token & Base URL
    const trackingToken = crypto.randomUUID();
    const trackingBaseUrl = coalesce(Deno.env.get("TRACKING_BASE_URL"), "http://localhost:54321/functions/v1/track-email");
    
    let processedHtml = html || text;

    if (campaign_id && contact_id) {
      // 2. Inject Tracking Pixel
      const pixelUrl = `${trackingBaseUrl}?type=open&token=${trackingToken}`;
      processedHtml = processedHtml.replace('</body>', `<img src="${pixelUrl}" width="1" height="1" style="display:none !important;" /></body>`);
      if (!processedHtml.includes('</body>')) {
        processedHtml += `<img src="${pixelUrl}" width="1" height="1" style="display:none !important;" />`;
      }

      // 3. Rewrite Links for Click Tracking
      processedHtml = processedHtml.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi, (match, p1, p2) => {
        // Skip unsubscribe or empty links
        if (p1.startsWith('#') || p1.includes('unsubscribe')) return match;
        const clickUrl = `${trackingBaseUrl}?type=click&token=${trackingToken}&target=${encodeURIComponent(p1)}`;
        return `<a href="${clickUrl}"${p2}>`;
      });

      // 4. Add Unsubscribe Footer
      const unsubscribeUrl = `${trackingBaseUrl}?type=unsubscribe&token=${trackingToken}`;
      processedHtml += `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center;">
          Sie erhalten diese E-Mail, weil Sie in unserem Verteiler sind. 
          <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Abmelden</a>
        </div>
      `;
    }

    // Send the email
    const mailOptions = {
      from: `"${smtpSettings.from_name}" <${smtpSettings.from_email}>`,
      to,
      subject,
      text,
      html: processedHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log the event with tracking token
    if (campaign_id && contact_id) {
      await supabase.from('email_events').insert({
        campaign_id,
        contact_id,
        event_type: 'sent',
        tracking_token: trackingToken,
        metadata: { messageId: info.messageId, to }
      });
    }

    function coalesce(val: any, fallback: string): string {
      return val && val !== "" ? val : fallback;
    }

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
