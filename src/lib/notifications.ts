import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNotification({
  title,
  body,
  type,
}: {
  title: string
  body: string
  type: 'missed_checkin' | 'missed_clockin' | 'general'
}) {
  // Get all admins and supervisors
  const { data: recipients } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .in('role', ['admin', 'supervisor'])
    .eq('is_active', true)

  if (!recipients || recipients.length === 0) return

  // Insert in-app notifications
  await admin.from('notifications').insert(
    recipients.map(r => ({
      recipient_id: r.id,
      title,
      body,
      type,
    }))
  )

  // Send emails if API key is configured
  if (process.env.RESEND_API_KEY) {
    await Promise.allSettled(
      recipients.map(r =>
        resend.emails.send({
          from: 'ASAS Security <alerts@asastx.com>',
          to: r.email,
          subject: `[ASAS Alert] ${title}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
              <div style="background:#1e3a5f;padding:20px;border-radius:8px 8px 0 0;">
                <h2 style="color:white;margin:0;">ASAS Security Alert</h2>
              </div>
              <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
                <h3 style="color:#111827;margin-top:0;">${title}</h3>
                <p style="color:#374151;">${body}</p>
                <a href="https://asastx.com/dashboard" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;font-weight:500;">
                  View Dashboard
                </a>
              </div>
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:12px;">
                ASAS Security Platform — asastx.com
              </p>
            </div>
          `,
        })
      )
    )
  }
}
