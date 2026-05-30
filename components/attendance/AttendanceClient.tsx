"use client"
import { useState, useMemo } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { avatarUrl, categoryColor, cn, CATEGORIES } from "@/lib/utils"
import { CalendarCheck, Users, TrendingUp, Save, Loader2, Filter } from "lucide-react"

type Player = {
  id: string; first_name: string; last_name: string
  category: string; position?: string; photo_url?: string; rate: number | null
}
type Att = { id: string; player_id: string; status: string; session_date: string; session_type: string }

const STATUS_OPTS = [
  { val: "P", label: "Présent",  bg: "bg-green-500 hover:bg-green-600",  ring: "ring-green-400" },
  { val: "A", label: "Absent",   bg: "bg-red-400 hover:bg-red-500",      ring: "ring-red-400" },
  { val: "E", label: "Excusé",   bg: "bg-yellow-400 hover:bg-yellow-500",ring: "ring-yellow-400" },
]

export default function AttendanceClient({
  players, todayAttendances, today, userId
}: {
  players: Player[]
  todayAttendances: Att[]
  today: string
  userId: string
}) {
  const supabase = createClient()
  const [date, setDate]       = useState(today)
  const [type, setType]       = useState("Entraînement")
  const [filter, setFilter]   = useState("")
  const [catFilter, setCat]   = useState("")
  const [saving, setSaving]   = useState(false)

  // Initialise avec les présences existantes
  const initMap = () => {
    const m: Record<string, string> = {}
    todayAttendances.forEach(a => { m[a.player_id] = a.status })
    return m
  }
  const [statuses, setStatuses] = useState<Record<string, string>>(initMap)

  const filtered = useMemo(() =>
    players.filter(p =>
      (catFilter === "" || p.category === catFilter) &&
      (filter === "" || `${p.first_name} ${p.last_name}`.toLowerCase().includes(filter.toLowerCase()))
    ), [players, catFilter, filter]
  )

  const presentCount = Object.values(statuses).filter(s => s === "P").length
  const absentCount  = Object.values(statuses).filter(s => s === "A").length
  const excusedCount = Object.values(statuses).filter(s => s === "E").length
  const markedCount  = Object.values(statuses).length

  function toggle(playerId: string, val: string) {
    setStatuses(prev => ({ ...prev, [playerId]: prev[playerId] === val ? "" : val }))
  }

  function markAll(val: string) {
    const m: Record<string, string> = {}
    filtered.forEach(p => { m[p.id] = val })
    setStatuses(prev => ({ ...prev, ...m }))
  }

  async function handleSave() {
    const toSave = players.filter(p => statuses[p.id])
    if (!toSave.length) { toast.error("Aucune présence à enregistrer"); return }
    setSaving(true)
    try {
      const rows = toSave.map(p => ({
        player_id: p.id, session_date: date,
        session_type: type, status: statuses[p.id],
        created_by: userId,
      }))
      const { error } = await supabase.from("attendances").upsert(rows, {
        onConflict: "player_id,session_date,session_type"
      })
      if (error) throw error
      toast.success(`${toSave.length} présences enregistrées !`)
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Présences</h1>
          <p className="text-surface-500 text-sm">{players.length} joueur(s) actif(s)</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {/* Paramètres séance */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-auto" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Type de séance</label>
            <select value={type} onChange={e => setType(e.target.value)} className="input-field w-auto">
              {["Entraînement","Match","Tournoi"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Rechercher</label>
            <input value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Nom du joueur…" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Catégorie</label>
            <select value={catFilter} onChange={e => setCat(e.target.value)} className="input-field w-auto">
              <option value="">Toutes</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs rapides */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Marqués",  val: markedCount,  color: "text-surface-700", bg: "bg-surface-100" },
          { label: "Présents", val: presentCount, color: "text-green-700",   bg: "bg-green-100"   },
          { label: "Absents",  val: absentCount,  color: "text-red-700",     bg: "bg-red-100"     },
          { label: "Excusés",  val: excusedCount, color: "text-yellow-700",  bg: "bg-yellow-100"  },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className={`card p-3 text-center ${bg} border-0`}>
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
            <p className={`text-xs ${color} opacity-80`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-surface-500 font-medium">Tout marquer :</span>
        {STATUS_OPTS.map(s => (
          <button key={s.val} onClick={() => markAll(s.val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all ${s.bg}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Grille joueurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => {
          const current = statuses[p.id] ?? ""
          return (
            <div key={p.id} className={cn(
              "card p-4 transition-all duration-200",
              current === "P" ? "border-green-400 bg-green-50/50" :
              current === "A" ? "border-red-300 bg-red-50/50" :
              current === "E" ? "border-yellow-300 bg-yellow-50/50" :
              "hover:border-surface-300"
            )}>
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={avatarUrl(p.first_name, p.last_name, p.photo_url)}
                  alt={`${p.first_name} ${p.last_name}`}
                  width={40} height={40}
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-900 truncate">
                    {p.first_name} {p.last_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("badge text-[10px]", categoryColor(p.category))}>{p.category}</span>
                    {p.rate !== null && (
                      <span className={cn("text-[10px] font-medium",
                        p.rate >= 80 ? "text-green-600" : p.rate >= 60 ? "text-yellow-600" : "text-red-500"
                      )}>{p.rate}%</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Boutons P / A / E */}
              <div className="flex gap-2">
                {STATUS_OPTS.map(s => (
                  <button key={s.val} onClick={() => toggle(p.id, s.val)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-150",
                      current === s.val
                        ? `${s.bg} text-white shadow-sm ring-2 ${s.ring} scale-[0.97]`
                        : "bg-surface-100 text-surface-500 hover:bg-surface-200"
                    )}>
                    {s.val}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bouton save bas */}
      {filtered.length > 6 && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Enregistrement…" : `Enregistrer (${markedCount})`}
          </button>
        </div>
      )}
    </div>
  )
}
