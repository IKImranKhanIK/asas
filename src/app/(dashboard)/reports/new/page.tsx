import { createClient } from '@/lib/supabase/server'
import NewReportForm from './NewReportForm'

export default async function NewReportPage() {
  const supabase = await createClient()
  const { data: locations } = await supabase.from('locations').select('id, name').order('name')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Report</h1>
      <NewReportForm locations={locations ?? []} />
    </div>
  )
}
