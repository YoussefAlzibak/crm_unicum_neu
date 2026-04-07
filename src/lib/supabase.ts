import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials are missing! Dashboard and Auth will not function properly. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to enqueue an email to be sent via the automated workflow.
 */
export async function queueEmail(
  orgId: string,
  toEmail: string,
  subject: string,
  htmlBody: string,
  textBody?: string,
  campaignId?: string,
  contactId?: string
) {
  const { data, error } = await supabase.from('email_queue').insert({
    org_id: orgId,
    to_email: toEmail,
    subject,
    html_body: htmlBody,
    text_body: textBody || '',
    campaign_id: campaignId,
    contact_id: contactId
  }).select().single();

  if (error) {
    console.error('Error queueing email:', error);
    throw error;
  }

  return data;
}
