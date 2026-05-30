"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { roleLabel, roleColor, formatDate, cn } from "@/lib/utils"
import { Shield, Plus, X, Save, Loader2, Eye, EyeOff } from "lucide-react"

type Profile = { id: string; email: string; full_name: string; role: string; created_at: string; player_id?: string }
type Player  = { id: string; first_name: string; last_name: string }

const ROLES = [
  { value: "admin",     label: "Admin",             desc: "Accès total" },
  { value: "staff",     label: "Staff / Coach",      desc: "Joueurs, présences, évals" },
  { value: "treasurer", label: "Trésorier",          desc: "Cotisations uniquement" },
  { value: "parent",    label: "Parent / Joueur",    desc: "Sa fiche uniquement" },
]

export default function UsersClient({
  profiles, players, currentUserId
}: { profiles: Profile[]; players: Player[]; currentUserId: string }) {
  const supabase = createClient()
  const router   = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [updatingId, setUpdatingId] = useState<string|null>(null)
  const [showPwd, setShowPwd]   = useState(false)
  const [form, setForm] = useState({
    email: "", password: "", full_name: "", role: "staff", player_id: ""
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function createUser() {
    if (!form.email || !form.password || !form.full_name) { toast.error("Remplissez tous les champs"); return }
    if (form.password.length < 6) { toast.error("Mot de passe min. 6 caractères"); return }
    setSaving(true)
    try {
      // Créer via API route pour contourner la limite RLS
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Compte créé avec succès !")
      setShowForm(false); setForm({ email:"", password:"", full_name:"", role:"staff", player_id:"" })
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function updateRole(profileId: string, newRole: string) {
    setUpdatingId(profileId)
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", profileId)
    if (error) toast.error(error.message)
    else { toast.success("Rôle mis à jour"); router.refresh() }
    setUpdatingId(null)
  }

  async function deleteUser(profileId: string, email: string) {
    if (!confirm(`Supprimer le compte de ${email} ?`)) return
    // Appel API route
    const res = await fetch(`/api/admin/delete-user`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profileId }),
    })
    if (res.ok) { toast.success("Compte supprimé"); router.refresh() }
    else toast.error("Erreur suppression")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Accès et comptes</h1>
          <p className="text-surface-500 text-sm">{profiles.length} compte(s)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nouveau compte
        </button>
      </div>

      {/* Légende rôles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className="card p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-surface-400" />
              <span className={cn("badge text-xs", roleColor(r.value))}>{r.label}</span>
            </div>
            <p className="text-xs text-surface-400">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="card p-5 border-brand-400 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-800">Créer un compte</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-surface-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Nom complet *</label>
              <input value={form.full_name} onChange={e => set("full_name", e.target.value)}
                placeholder="Mamadou Coulibaly" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="email@example.com" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Mot de passe *</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={form.password}
                  onChange={e => set("password", e.target.value)}
                  placeholder="Min. 6 caractères" className="input-field pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Rôle</label>
              <select value={form.role} onChange={e => set("role", e.target.value)} className="input-field">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {form.role === "parent" && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Lier à un joueur (optionnel)</label>
                <select value={form.player_id} onChange={e => set("player_id", e.target.value)} className="input-field">
                  <option value="">Aucun joueur lié</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
            <button onClick={createUser} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Créer le compte
            </button>
          </div>
        </div>
      )}

      {/* Table utilisateurs */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Utilisateur</th>
              <th className="th">Email</th>
              <th className="th text-center">Rôle</th>
              <th className="th">Créé le</th>
              {<th className="th text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} className={cn("hover:bg-surface-50", p.id === currentUserId && "bg-brand-50/50")}>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-xs flex-shrink-0">
                      {p.full_name?.slice(0,2).toUpperCase() || "??"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-800">{p.full_name || "—"}</p>
                      {p.id === currentUserId && <span className="text-[10px] text-brand-600">Vous</span>}
                    </div>
                  </div>
                </td>
                <td className="td text-sm text-surface-600">{p.email}</td>
                <td className="td text-center">
                  {p.id === currentUserId
                    ? <span className={cn("badge", roleColor(p.role))}>{roleLabel(p.role)}</span>
                    : (
                      <select
                        value={p.role}
                        onChange={e => updateRole(p.id, e.target.value)}
                        disabled={updatingId === p.id}
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer",
                          roleColor(p.role),
                          updatingId === p.id && "opacity-50"
                        )}
                      >
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    )
                  }
                </td>
                <td className="td text-sm text-surface-500">{formatDate(p.created_at)}</td>
                <td className="td text-center">
                  {p.id !== currentUserId && (
                    <button onClick={() => deleteUser(p.id, p.email)}
                      className="w-7 h-7 flex items-center justify-center text-surface-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mx-auto">
                      <X size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
