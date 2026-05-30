"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  CalendarCheck, 
  Coins, 
  FileText, 
  Shield, 
  Menu, 
  X, 
  LogOut,
  ChevronRight,
  BarChart // Correction ici : BarChart au lieu de ChartBar
} from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  const menuItems = [
    { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    { name: "Joueurs & Staff", href: "/players", icon: Users },
    { name: "Compétitions", href: "/competitions", icon: Trophy },
    { name: "Calendrier & Présence", href: "/calendar", icon: CalendarCheck },
    { name: "Trésorerie", href: "/finance", icon: Coins },
    { name: "Rapports & Stats", href: "/stats", icon: BarChart }, // Mise à jour de l'icône ici
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Administration", href: "/admin", icon: Shield },
  ]

  return (
    <>
      <button 
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-emerald-600 text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col justify-between border-r border-slate-800`}>
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="p-2 bg-emerald-600 rounded-lg text-white font-bold text-xl">FC</div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Club Football</h1>
              <p className="text-xs text-slate-400">Gestion Hub</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                    isActive 
                      ? "bg-emerald-600 text-white" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white"} />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "text-white" : "text-slate-500"}`} />
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors">
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  )
}