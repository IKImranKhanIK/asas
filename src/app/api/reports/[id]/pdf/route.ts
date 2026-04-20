import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('reports')
    .select('*, guard:profiles(full_name, badge_number, email), location:locations(name, address)')
    .eq('id', id)
    .single()

  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #111; }
  .header { background: #1e3a5f; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
  .header h1 { margin: 0 0 4px; font-size: 22px; }
  .header p { margin: 0; opacity: 0.8; font-size: 13px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-right: 6px; }
  .severity-low { background: #f3f4f6; color: #374151; }
  .severity-medium { background: #fef3c7; color: #92400e; }
  .severity-high { background: #fed7aa; color: #9a3412; }
  .severity-critical { background: #fee2e2; color: #991b1b; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
  .field label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
  .field p { margin: 4px 0 0; font-size: 14px; font-weight: 500; }
  .body-section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 20px; }
  .body-section label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
  .body-section p { margin: 8px 0 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
  .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
</style>
</head>
<body>
<div class="header">
  <h1>ASAS Security — Incident Report</h1>
  <p>Generated ${format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
</div>

<h2 style="margin:0 0 8px">${report.title}</h2>
<span class="badge severity-${report.severity}">${report.severity.toUpperCase()}</span>
<span class="badge" style="background:#e0f2fe;color:#0369a1">${report.type.toUpperCase()}</span>

<div class="grid">
  <div class="field"><label>Submitted By</label><p>${report.guard?.full_name ?? '—'}</p></div>
  <div class="field"><label>Badge Number</label><p>${report.guard?.badge_number ?? '—'}</p></div>
  <div class="field"><label>Date</label><p>${format(new Date(report.created_at), 'MMMM d, yyyy')}</p></div>
  <div class="field"><label>Time</label><p>${format(new Date(report.created_at), 'h:mm a')}</p></div>
  ${report.location ? `<div class="field" style="grid-column:span 2"><label>Location</label><p>${report.location.name}${report.location.address ? ` — ${report.location.address}` : ''}</p></div>` : ''}
</div>

<div class="body-section">
  <label>Details</label>
  <p>${report.body}</p>
</div>

<div class="footer">ASAS Security Platform — asastx.com — Report ID: ${report.id}</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="report-${id.slice(0, 8)}.html"`,
    },
  })
}
