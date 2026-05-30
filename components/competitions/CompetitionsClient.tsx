"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { formatDate, CATEGORIES, cn } from "@/lib/utils"
import { Trophy, Plus, X, Save, Loader2, MapPin, Calendar } from "lucide-react"

type Competition = {
  id: string; name: string; date: string; location?: string; opponent?: string
  score_us?: number; score_them?: number; result?: string; category?: string
  scorers?: string[]; notes?: string
}

const empty = {
  name: "", date: new Date().toISOString().split("T")[0], location: "",
  opponent: "", score_us: "", score_them: "", result: "", category: "Équipe 1ère",
  scorers: "", notes: "",
}

export default function CompetitionsClient({
  competitions, canEdit, userId
}: {
  competitions: Competition[]; canEdit: boolean; userId: string
}) {
  const supabase = createClient()
  const router   = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ ...empty })
  const [saving, setSaving]     = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.name || !form.date) { toast.error("Nom et date obligatoires"); return }
    setSaving(true)
    try {
      const su = Number(form.score_us)
      const st = Number(form.score_them)
      const result = form.score_us !== "" && form.score_them !== ""
        ? (su > st ? "V" : su < st ? "D" : "N") : form.result || null
      const { error } = await supabase.from("competitions").insert({
        name: form.name, date: form.date, location: form.location || null,
        opponent: form.opponent || null,
        score_us: form.score_us !== "" ? su : null,
        score_them: form.score_them !== "" ? st : null,
        result, category: form.category,
        scorers: form.scorers ? form.scorers.split(",").map(s => s.trim()).filter(Boolean) : null,
        notes: form.notes || null, created_by: userId,
      })
      if (error) throw error
      toast.success("Match enregistré !")
      setShowForm(false); setForm({ ...empty }); router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function deleteComp(id: string) {
    if (!confirm("Supprimer ce match ?")) return
    await supabase.from("competitions").delete().eq("id", id)
    toast.success("Match supprimé"); router.refresh()
  }

  // Stats
  const wins   = competitions.filter(c => c.result === "V").length
  const draws  = competitions.filter(c => c.result === "N").length
  const losses = competitions.filter(c => c.result === "D").length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compétitions</h1>
          <p className="text-surface-500 text-sm">{competitions.length} match(s) enregistré(s)</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> Ajouter un match
          </button>
        )}
      </div>

      {/* Bilan */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Victoires", val: wins,   color: "text-green-700", bg: "bg-green-100" },
          { label: "Nuls",      val: draws,  color: "text-yellow-700",bg: "bg-yellow-100"},
          { label: "Défaites",  val: losses, color: "text-red-700",   bg: "bg-red-100"  },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className={`card p-4 text-center border-0 ${bg}`}>
            <p className={`text-3xl font-bold ${color}`}>{val}</p>
            <p className={`text-sm ${color} opacity-80`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="card p-5 border-brand-400 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-800">Nouveau match / tournoi</h3>
            <button onClick={() => setShowForm(false)} className="text-surface-400 hover:text-surface-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Nom du tournoi / match *", key: "name", placeholder: "Tournoi de Bamako" },
              { label: "Adversaire", key: "opponent", placeholder: "FC Adversaire" },
              { label: "Lieu", key: "location", placeholder: "Terrain municipal" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-surface-500 mb-1">{label}</label>
                <input value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                  placeholder={placeholder} className="input-field" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">Catégorie</label>
              <select value={form.category} onChange={e => set("category", e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-surface-500 mb-1">Score (nous)</label>
                <input type="number" min="0" value={form.score_us} onChange={e => set("score_us", e.target.value)}
                  placeholder="0" className="input-field" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-surface-500 mb-1">Score (eux)</label>
                <input type="number" min="0" value={form.score_them} onChange={e => set("score_them", e.target.value)}
                  placeholder="0" className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">Buteurs (séparés par ,)</label>
              <input value={form.scorers} onChange={e => set("scorers", e.target.value)}
                placeholder="Mamadou, Ibrahim…" className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-surface-500 mb-1">Notes</label>
              <input value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder="Observations sur le match…" className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Liste matchs */}
      <div className="space-y-3">
        {competitions.map(c => (
          <div key={c.id} className="card p-4 hover:shadow-card-hover transition-all">
            <div className="flex items-center gap-4">
              {/* Résultat */}
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0",
                c.result === "V" ? "bg-green-500" : c.result === "N" ? "bg-yellow-500" : c.result === "D" ? "bg-red-500" : "bg-surface-300"
              )}>
                {c.result ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-surface-900">{c.name}</p>
                  {c.category && (
                    <span className="badge text-[10px] bg-surface-100 text-surface-600">{c.category}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
                  {c.opponent && <span>vs {c.opponent}</span>}
                  {c.location && <span className="flex items-center gap-1"><MapPin size={10} />{c.location}</span>}
                  <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(c.date)}</span>
                </div>
                {c.scorers && c.scorers.length > 0 && (
                  <p className="text-xs text-brand-600 mt-1">
                    ⚽ {c.scorers.join(", ")}
                  </p>
                )}
              </div>
              {/* Score */}
              {(c.score_us !== undefined && c.score_us !== null) && (
                <div className="text-center flex-shrink-0">
                  <p className="text-2xl font-black text-surface-800">{c.score_us} – {c.score_them}</p>
                </div>
              )}
              {canEdit && (
                <button onClick={() => deleteComp(c.id)}
                  className="w-7 h-7 flex items-center justify-center text-surface-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
            {c.notes && <p className="text-xs text-surface-500 mt-2 ml-16">{c.notes}</p>}
          </div>
        ))}
        {competitions.length === 0 && (
          <div className="card p-12 text-center">
            <Trophy size={40} className="text-surface-300 mx-auto mb-3" />
            <p className="text-surface-400">Aucun match enregistré</p>
          </div>
        )}
      </div>
    </div>
  )
}
