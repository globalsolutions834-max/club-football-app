"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { CATEGORIES, POSITIONS } from "@/lib/utils"
import { Search } from "lucide-react"
import { useCallback } from "react"

export default function PlayersFilter() {
  const router = useRouter()
  const params = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(params.toString())
    value ? p.set(key, value) : p.delete(key)
    router.push(`/players?${p.toString()}`)
  }, [params, router])

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          defaultValue={params.get("q") ?? ""}
          onChange={e => update("q", e.target.value)}
          placeholder="Rechercher un joueur…"
          className="input-field pl-9"
        />
      </div>
      <select defaultValue={params.get("category") ?? ""} onChange={e => update("category", e.target.value)}
        className="input-field w-auto">
        <option value="">Toutes catégories</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select defaultValue={params.get("position") ?? ""} onChange={e => update("position", e.target.value)}
        className="input-field w-auto">
        <option value="">Tous postes</option>
        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select defaultValue={params.get("status") ?? ""} onChange={e => update("status", e.target.value)}
        className="input-field w-auto">
        <option value="">Tous statuts</option>
        <option value="actif">Actif</option>
        <option value="inactif">Inactif</option>
        <option value="suspendu">Suspendu</option>
      </select>
    </div>
  )
}
