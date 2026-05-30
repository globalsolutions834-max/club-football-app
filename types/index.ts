export type Role = "admin" | "staff" | "treasurer" | "parent"

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  player_id?: string
  avatar_url?: string
  created_at: string
}

export type Category = "Équipe 1ère" | "U17" | "U15" | "U12"
export type Position = "Gardien" | "Défenseur" | "Milieu" | "Attaquant"
export type PlayerStatus = "actif" | "inactif" | "suspendu"

export interface Player {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  position: Position
  category: Category
  status: PlayerStatus
  photo_url?: string
  phone?: string
  parent_phone?: string
  parent_name?: string
  address?: string
  seasons_at_club: number
  season_goal?: string
  staff_notes?: string
  jersey_number?: number
  created_at: string
}

export type AttendanceStatus = "P" | "A" | "E"
export type SessionType = "Entraînement" | "Match" | "Tournoi"

export interface Attendance {
  id: string
  player_id: string
  session_date: string
  session_type: SessionType
  status: AttendanceStatus
  note?: string
  created_by: string
  player?: Player
}

export interface Payment {
  id: string
  player_id: string
  month: number
  year: number
  amount: number
  paid_date?: string
  status: "paid" | "pending" | "late"
  note?: string
  created_by: string
  player?: Player
}

export interface Evaluation {
  id: string
  player_id: string
  quarter: number
  year: number
  passing: number
  ball_control: number
  shooting: number
  dribbling: number
  speed: number
  endurance: number
  strength: number
  discipline: number
  teamwork: number
  leadership: number
  global_score: number
  notes?: string
  created_by: string
  player?: Player
}

export type DocType = "autorisation_parentale" | "licence" | "certificat_medical" | "autre"

export interface Document {
  id: string
  player_id: string
  doc_type: DocType
  file_name: string
  file_url: string
  file_size: number
  uploaded_by: string
  validated: boolean
  created_at: string
  player?: Player
}

export interface Competition {
  id: string
  name: string
  date: string
  location?: string
  opponent?: string
  score_us?: number
  score_them?: number
  result?: "V" | "N" | "D"
  category: Category
  scorers?: string[]
  notes?: string
  photos?: string[]
  created_by: string
}

export interface DashboardStats {
  totalPlayers: number
  activePlayersThisMonth: number
  avgAttendanceRate: number
  totalCollected: number
  totalDue: number
  latePayments: number
  upcomingSession?: string
  recentAlerts: Alert[]
}

export interface Alert {
  type: "absence" | "payment" | "document" | "evaluation"
  message: string
  player_name?: string
  player_id?: string
  severity: "low" | "medium" | "high"
}
