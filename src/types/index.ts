export type Role = 'admin' | 'supervisor' | 'guard'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  phone?: string
  badge_number?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
}

export interface ClockEvent {
  id: string
  guard_id: string
  type: 'clock_in' | 'clock_out'
  timestamp: string
  latitude?: number
  longitude?: number
  notes?: string
  guard?: Profile
}

export interface Location {
  id: string
  name: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  qr_code?: string
  created_by: string
  created_at: string
}

export interface LocationCheck {
  id: string
  guard_id: string
  location_id: string
  timestamp: string
  latitude?: number
  longitude?: number
  guard?: Profile
  location?: Location
}

export interface Report {
  id: string
  guard_id: string
  title: string
  body: string
  type: 'incident' | 'patrol' | 'maintenance' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  location_id?: string
  created_at: string
  updated_at: string
  guard?: Profile
  location?: Location
}
