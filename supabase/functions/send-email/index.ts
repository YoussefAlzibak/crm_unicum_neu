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

    // Send the email
    const mailOptions = {
      from: `"${smtpSettings.from_name}" <${smtpSettings.from_email}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log the event if campaign and contact are provided
    if (campaign_id && contact_id) {
      await supabase.from('email_events').insert({
        campaign_id,
        contact_id,
        event_type: 'sent',
        metadata: { messageId: info.messageId, to }
      });
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
