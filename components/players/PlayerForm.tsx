"use client"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { CATEGORIES, POSITIONS, avatarUrl, cn } from "@/lib/utils"
import { Camera, Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PlayerForm({ player }: { player?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!player

  const [form, setForm] = useState({
    first_name:     player?.first_name     ?? "",
    last_name:      player?.last_name      ?? "",
    date_of_birth:  player?.date_of_birth  ?? "",
    position:       player?.position       ?? "Milieu",
    category:       player?.category       ?? "U17",
    status:         player?.status         ?? "actif",
    phone:          player?.phone          ?? "",
    parent_name:    player?.parent_name    ?? "",
    parent_phone:   player?.parent_phone   ?? "",
    address:        player?.address        ?? "",
    jersey_number:  player?.jersey_number  ?? "",
    seasons_at_club:player?.seasons_at_club?? 1,
    monthly_fee:    player?.monthly_fee    ?? 2000,
    season_goal:    player?.season_goal    ?? "",
    staff_notes:    player?.staff_notes    ?? "",
  })
  const [photoUrl, setPhotoUrl] = useState<string>(player?.photo_url ?? "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  // Photo upload
  const onDropPhoto = useCallback(async (files: File[]) => {
    const file = files[0]; if (!file) return
    setUploading(true)
    try {
      const path = `player-${Date.now()}.${file.name.split(".").pop()}`
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
      setPhotoUrl(publicUrl)
      toast.success("Photo uploadée")
    } catch (e: any) { toast.error(e.message) }
    finally { setUploading(false) }
  }, [supabase])

  const { getRootProps: getPhotoProps, getInputProps: getPhotoInput } = useDropzone({
    onDrop: onDropPhoto, accept: { "image/*": [] }, maxFiles: 1
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, photo_url: photoUrl || null,
        jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
        seasons_at_club: Number(form.seasons_at_club),
        monthly_fee: Number(form.monthly_fee),
      }
      if (isEdit) {
        const { error } = await supabase.from("players").update(payload).eq("id", player.id)
        if (error) throw error
        toast.success("Joueur mis à jour")
        router.push(`/players/${player.id}`)
      } else {
        const { data, error } = await supabase.from("players").insert(payload).select().single()
        if (error) throw error
        toast.success("Joueur ajouté avec succès !")
        router.push(`/players/${data.id}`)
      }
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const InputField = ({ label, name, type = "text", required = false, placeholder = "" }: any) => (
    <div>
      <label className="block text-xs font-medium text-surface-600 mb-1.5">{label}{required && " *"}</label>
      <input type={type} value={(form as any)[name]} onChange={e => set(name, e.target.value)}
        placeholder={placeholder} required={required} className="input-field" />
    </div>
  )

  const SelectField = ({ label, name, options }: any) => (
    <div>
      <label className="block text-xs font-medium text-surface-600 mb-1.5">{label}</label>
      <select value={(form as any)[name]} onChange={e => set(name, e.target.value)} className="input-field">
        {options.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={isEdit ? `/players/${player.id}` : "/players"} className="btn-secondary px-3 py-2">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="page-title">{isEdit ? "Modifier le joueur" : "Nouveau joueur"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo */}
        <div className="card p-5">
          <h2 className="font-semibold text-surface-800 text-sm mb-4">Photo du joueur</h2>
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <Image
                src={photoUrl || avatarUrl(form.first_name || "J", form.last_name || "J")}
                alt="Photo" width={80} height={80}
                className="w-20 h-20 rounded-2xl object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}
            </div>
            <div {...getPhotoProps()}
              className="flex-1 border-2 border-dashed border-surface-200 hover:border-brand-400 rounded-xl p-4 text-center cursor-pointer transition-colors">
              <input {...getPhotoInput()} />
              <Camera size={20} className="text-surface-400 mx-auto mb-1" />
              <p className="text-xs text-surface-500">Cliquez ou glissez une photo</p>
              <p className="text-xs text-surface-400">JPG, PNG recommandés</p>
            </div>
          </div>
        </div>

        {/* Infos principales */}
        <div className="card p-5">
          <h2 className="font-semibold text-surface-800 text-sm mb-4">Informations principales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Prénom" name="first_name" required placeholder="Mamadou" />
            <InputField label="Nom" name="last_name" required placeholder="Coulibaly" />
            <InputField label="Date de naissance" name="date_of_birth" type="date" />
            <InputField label="Numéro de maillot" name="jersey_number" type="number" placeholder="10" />
            <SelectField label="Poste" name="position" options={POSITIONS} />
            <SelectField label="Catégorie" name="category" options={CATEGORIES} />
            <SelectField label="Statut" name="status" options={[
              { value: "actif", label: "Actif" },
              { value: "inactif", label: "Inactif" },
              { value: "suspendu", label: "Suspendu" },
            ]} />
            <InputField label="Saisons au club" name="seasons_at_club" type="number" />
          </div>
        </div>

        {/* Contacts */}
        <div className="card p-5">
          <h2 className="font-semibold text-surface-800 text-sm mb-4">Contacts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Téléphone joueur" name="phone" placeholder="76 XX XX XX" />
            <InputField label="Adresse" name="address" placeholder="Quartier, commune…" />
            <InputField label="Nom tuteur / parent" name="parent_name" placeholder="Fatoumata Coulibaly" />
            <InputField label="Téléphone tuteur" name="parent_phone" placeholder="76 XX XX XX" />
          </div>
        </div>

        {/* Finance & objectifs */}
        <div className="card p-5">
          <h2 className="font-semibold text-surface-800 text-sm mb-4">Finance et objectifs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5">Cotisation mensuelle (FCFA)</label>
              <input type="number" value={form.monthly_fee} onChange={e => set("monthly_fee", e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5">Objectif de la saison</label>
              <input type="text" value={form.season_goal} onChange={e => set("season_goal", e.target.value)}
                placeholder="Ex : Intégrer l'équipe 1ère…" className="input-field" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-surface-600 mb-1.5">Notes du staff</label>
            <textarea value={form.staff_notes} onChange={e => set("staff_notes", e.target.value)}
              rows={3} placeholder="Observations, points forts, axes d'amélioration…"
              className="input-field resize-none" />
          </div>
        </div>

        {/* Boutons */}
        <div className="flex items-center justify-end gap-3">
          <Link href={isEdit ? `/players/${player.id}` : "/players"} className="btn-secondary">
            Annuler
          </Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le joueur"}
          </button>
        </div>
      </form>
    </div>
  )
}
