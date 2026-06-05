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

export interface SOSAlert {
  id: string
  guard_id: string
  latitude?: number
  longitude?: number
  message?: string
  status: 'active' | 'resolved'
  resolved_by?: string
  resolved_at?: string
  created_at: string
  guard?: Profile
}

export interface GuardMessage {
  id: string
  sender_id: string
  recipient_id?: string
  subject?: string
  body: string
  is_read: boolean
  is_broadcast: boolean
  created_at: string
  sender?: Profile
  recipient?: Profile
}

export interface Shift {
  id: string
  guard_id: string
  location_id?: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'active' | 'completed' | 'missed'
  notes?: string
  created_by?: string
  created_at: string
  guard?: Profile
  location?: Location
}
