"use client"
import Link from "next/link"
import { UserPlus, CalendarPlus, Plus } from "lucide-react"

export default function QuickActions({ role }: { role?: string }) {
  if (!role || !["admin","staff"].includes(role)) return null
  return (
    <div className="flex items-center gap-2">
      <Link href="/players/new" className="btn-secondary text-xs">
        <UserPlus size={14} /> Nouveau joueur
      </Link>
      <Link href="/attendance/new" className="btn-primary text-xs">
        <CalendarPlus size={14} /> Saisir présences
      </Link>
    </div>
  )
}
