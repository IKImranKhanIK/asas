import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import QRCodeDisplay from './QRCodeDisplay'

export default async function LocationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const { data: locations } = await supabase.from('locations').select('*').order('name')
  const canManage = ['admin', 'supervisor'].includes(profile?.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        {canManage && (
          <Link href="/locations/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + Add Location
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations && locations.length > 0 ? locations.map((loc: any) => (
          <div key={loc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{loc.name}</h3>
                {loc.address && <p className="text-xs text-gray-400 mt-0.5">{loc.address}</p>}
                {loc.description && <p className="text-sm text-gray-500 mt-1">{loc.description}</p>}
              </div>
            </div>
            <QRCodeDisplay qrCode={loc.qr_code} locationName={loc.name} />
          </div>
        )) : (
          <div className="col-span-3 p-10 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
            No locations added yet.
          </div>
        )}
      </div>
    </div>
  )
}
