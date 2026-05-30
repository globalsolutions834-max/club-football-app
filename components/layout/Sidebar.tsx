"use client"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn, roleLabel, roleColor, canAccess, avatarUrl } from "@/lib/utils"
import type { Profile } from "@/types"
import {
  LayoutDashboard, Users, CalendarCheck, Coins, BarChart2,
  Trophy, FileText, Shield, LogOut, Menu, X, ChevronRight,
} from "lucide-react"

const NAV = [
  { href: "/dashboard",    label: "Tableau de bord", icon: LayoutDashboard, module: "dashboard" },
  { href: "/players",      label: "Joueurs",          icon: Users,           module: "players" },
  { href: "/attendance",   label: "Présences",        icon: CalendarCheck,   module: "attendance" },
  { href: "/payments",     label: "Cotisations",      icon: Coins,           module: "payments" },
  { href: "/evaluations",  label: "Évaluations",      icon: BarChart2,       module: "evaluations" },
  { href: "/competitions", label: "Compétitions",     icon: Trophy,          module: "competitions" },
  { href: "/documents",    label: "Documents",        icon: FileText,        module: "documents" },
  { href: "/users",        label: "Accès & Comptes",  icon: Shield,          module: "users" },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const links = NAV.filter(n => canAccess(profile.role, n.module))

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-brand-600 text-white p-2 rounded-xl shadow-md">
        <Menu size={20} />
      </button>

      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full z-50 bg-surface-950 flex flex-col transition-transform duration-300",
        "w-64 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Club Football</p>
              <p className="text-surface-500 text-xs">Gestion</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-surface-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-3 mb-4">
          <div className="h-px bg-surface-800" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={cn("sidebar-link", active ? "sidebar-link-active" : "sidebar-link-inactive")}>
                <Icon size={18} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} className="opacity-60" />}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 mb-3">
          <div className="h-px bg-surface-800" />
        </div>

        {/* Profil */}
        <div className="px-3 pb-5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-900">
            <Image
              src={avatarUrl(profile.full_name.split(" ")[0] ?? "U", profile.full_name.split(" ")[1] ?? "", profile.avatar_url)}
              alt={profile.full_name} width={32} height={32}
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{profile.full_name}</p>
              <span className={cn("badge text-[10px] mt-0.5", roleColor(profile.role))}>
                {roleLabel(profile.role)}
              </span>
            </div>
            <button onClick={handleLogout} title="Déconnexion"
              className="text-surface-500 hover:text-red-400 transition-colors flex-shrink-0">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
