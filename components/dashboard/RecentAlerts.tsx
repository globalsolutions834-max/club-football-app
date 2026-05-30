"use client"
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function RecentAlerts({ lateCount, role }: { lateCount: number; role?: string }) {
  const alerts = [
    lateCount > 0 && { type: "payment", severity: "high", message: `${lateCount} joueur(s) en retard de cotisation`, href: "/payments" },
  ].filter(Boolean) as { type: string; severity: string; message: string; href: string }[]

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={16} className="text-orange-500" />
        <h3 className="font-semibold text-surface-800 text-sm">Alertes actives</h3>
        {alerts.length > 0 && (
          <span className="ml-auto badge bg-red-100 text-red-700">{alerts.length}</span>
        )}
      </div>
      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 py-3">
          <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
            <CheckCircle size={16} className="text-green-600" />
          </div>
          <p className="text-sm text-surface-500">Tout est en ordre — aucune alerte</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <Link key={i} href={a.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-colors group">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{a.message}</p>
              <ArrowRight size={14} className="text-red-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
