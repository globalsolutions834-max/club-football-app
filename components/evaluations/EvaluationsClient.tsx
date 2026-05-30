"use client"
import { useState, useMemo } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { avatarUrl, categoryColor, levelFromScore, cn, CATEGORIES } from "@/lib/utils"
import { Star, Save, Loader2, ChevronDown, ChevronUp, X } from "lucide-react"
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"

type Player = { id: string; first_name: string; last_name: string; category: string; position?: string; photo_url?: string }
type Evaluation = { id?: string; player_id: string; quarter: number; year: number;
  passing: number; ball_control: number; shooting: number; dribbling: number;
  speed: number; endurance: number; strength: number; discipline: number; teamwork: number; leadership: number;
  global_score: number; notes?: string }

const CRITERIA = [
  { key: "passing",      label: "Passe",      group: "technique" },
  { key: "ball_control", label: "Contrôle",   group: "technique" },
  { key: "shooting",     label: "Tir",        group: "technique" },
  { key: "dribbling",    label: "Dribble",    group: "technique" },
  { key: "speed",        label: "Vitesse",    group: "physique" },
  { key: "endurance",    label: "Endurance",  group: "physique" },
  { key: "strength",     label: "Puissance",  group: "physique" },
  { key: "discipline",   label: "Discipline", group: "mental" },
  { key: "teamwork",     label: "Équipe",     group: "mental" },
  { key: "leadership",   label: "Leadership", group: "mental" },
]

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={cn("transition-colors", n <= value ? "text-yellow-400" : "text-surface-200 hover:text-yellow-200")}>
          <Star size={18} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  )
}

function calcGlobal(ev: Partial<Evaluation>) {
  const vals = CRITERIA.map(c => (ev as any)[c.key]).filter(Boolean)
  if (!vals.length) return 0
  return Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10
}

export default function EvaluationsClient({
  players, evaluations, currentQuarter, currentYear, userId
}: {
  players: Player[]; evaluations: Evaluation[]
  currentQuarter: number; currentYear: number; userId: string
}) {
  const supabase = createClient()
  const [quarter, setQuarter] = useState(currentQuarter)
  const [year, setYear]       = useState(currentYear)
  const [catFilter, setCat]   = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [forms, setForms]     = useState<Record<string, Partial<Evaluation>>>({})
  const [saving, setSaving]   = useState<string | null>(null)

  const filtered = useMemo(() =>
    players.filter(p => catFilter === "" || p.category === catFilter), [players, catFilter])

  function getEval(playerId: string): Partial<Evaluation> {
    if (forms[playerId]) return forms[playerId]
    const existing = evaluations.find(e => e.player_id === playerId && e.quarter === quarter && e.year === year)
    if (existing) return existing
    return { player_id: playerId, quarter, year }
  }

  function updateField(playerId: string, key: string, val: number) {
    const current = getEval(playerId)
    const updated = { ...current, [key]: val }
    updated.global_score = calcGlobal(updated)
    setForms(prev => ({ ...prev, [playerId]: updated }))
  }

  async function saveEval(playerId: string) {
    const data = getEval(playerId)
    if (!CRITERIA.some(c => (data as any)[c.key])) { toast.error("Évaluez au moins un critère"); return }
    setSaving(playerId)
    try {
      const payload = { ...data, player_id: playerId, quarter, year,
        global_score: calcGlobal(data), created_by: userId }
      const { error } = data.id
        ? await supabase.from("evaluations").update(payload).eq("id", data.id)
        : await supabase.from("evaluations").insert(payload)
      if (error) throw error
      toast.success("Évaluation enregistrée !")
      setForms(prev => { const n = {...prev}; delete n[playerId]; return n })
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(null) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Évaluations</h1>
          <p className="text-surface-500 text-sm">Notation trimestrielle des joueurs</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-surface-500 mb-1">Trimestre</label>
          <select value={quarter} onChange={e => setQuarter(Number(e.target.value))} className="input-field w-auto">
            {[1,2,3,4].map(q => <option key={q} value={q}>T{q}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-surface-500 mb-1">Année</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input-field w-auto">
            {[currentYear-1, currentYear, currentYear+1].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-surface-500 mb-1">Catégorie</label>
          <select value={catFilter} onChange={e => setCat(e.target.value)} className="input-field w-auto">
            <option value="">Toutes</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Cartes joueurs */}
      <div className="space-y-3">
        {filtered.map(p => {
          const ev      = getEval(p.id)
          const isOpen  = expanded === p.id
          const score   = ev.global_score ?? 0
          const level   = score > 0 ? levelFromScore(score) : null
          const isDirty = !!forms[p.id]

          return (
            <div key={p.id} className={cn("card overflow-hidden transition-all", isDirty && "border-brand-400")}>
              {/* En-tête joueur */}
              <button className="w-full flex items-center gap-4 p-4 hover:bg-surface-50 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : p.id)}>
                <Image
                  src={avatarUrl(p.first_name, p.last_name, p.photo_url)}
                  alt="" width={40} height={40}
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-surface-900">{p.first_name} {p.last_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("badge text-[10px]", categoryColor(p.category))}>{p.category}</span>
                    {level && <span className={cn("badge text-[10px]", level.color)}>{level.label}</span>}
                    {isDirty && <span className="badge text-[10px] bg-brand-100 text-brand-700">● Modifié</span>}
                  </div>
                </div>
                {score > 0 && (
                  <div className="text-center mr-2">
                    <p className="text-xl font-bold text-brand-600">{score}</p>
                    <p className="text-xs text-surface-400">/5</p>
                  </div>
                )}
                {isOpen ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
              </button>

              {/* Grille notation expandée */}
              {isOpen && (
                <div className="px-4 pb-5 border-t border-surface-100 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                    {/* Critères */}
                    <div className="lg:col-span-2 space-y-5">
                      {["technique","physique","mental"].map(group => (
                        <div key={group}>
                          <p className="section-title capitalize">{group}</p>
                          <div className="space-y-3">
                            {CRITERIA.filter(c => c.group === group).map(c => (
                              <div key={c.key} className="flex items-center justify-between gap-4">
                                <span className="text-sm text-surface-700 w-24 flex-shrink-0">{c.label}</span>
                                <StarRating
                                  value={(ev as any)[c.key] ?? 0}
                                  onChange={v => updateField(p.id, c.key, v)}
                                />
                                <span className="text-sm font-semibold text-surface-600 w-6 text-right">
                                  {(ev as any)[c.key] ?? "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div>
                        <label className="section-title">Notes</label>
                        <textarea
                          value={ev.notes ?? ""}
                          onChange={e => setForms(prev => ({ ...prev, [p.id]: { ...getEval(p.id), notes: e.target.value }}))}
                          rows={2} placeholder="Observations…" className="input-field resize-none" />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-surface-500">Score global :</span>
                          <span className="text-lg font-bold text-brand-600">{score > 0 ? `${score}/5` : "—"}</span>
                          {level && <span className={cn("badge", level.color)}>{level.label}</span>}
                        </div>
                        <button onClick={() => saveEval(p.id)} disabled={saving === p.id} className="btn-primary">
                          {saving === p.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Enregistrer
                        </button>
                      </div>
                    </div>

                    {/* Radar chart */}
                    {score > 0 && (
                      <div>
                        <p className="section-title">Profil</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={CRITERIA.map(c => ({ subject: c.label, value: (ev as any)[c.key] ?? 0 }))}>
                            <PolarGrid stroke="#e9ecef" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6c757d" }} />
                            <Radar dataKey="value" stroke="#2e8b57" fill="#2e8b57" fillOpacity={0.25} strokeWidth={2} />
                            <Tooltip contentStyle={{ borderRadius: 10, border: "none", fontSize: 12 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
