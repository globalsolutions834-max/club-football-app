"use client"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { FileText, Upload, Download, Trash2, CheckCircle, Clock, Loader2 } from "lucide-react"
import { cn, DOC_TYPES, formatDate } from "@/lib/utils"
import type { Document } from "@/types"

export default function PlayerDocuments({
  documents, playerId, isAdmin
}: {
  documents: Document[]
  playerId: string
  isAdmin: boolean
}) {
  const [docs, setDocs]       = useState<Document[]>(documents)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState("autorisation_parentale")
  const supabase = createClient()

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const ext      = file.name.split(".").pop()
      const path     = `${playerId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file)
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(path)

      const { data: doc, error: dbErr } = await supabase.from("documents").insert({
        player_id: playerId, doc_type: docType,
        file_name: file.name, file_url: publicUrl,
        file_size: file.size,
      }).select().single()

      if (dbErr) throw dbErr
      setDocs(prev => [...prev, doc])
      toast.success("Document uploadé avec succès")
    } catch (e: any) {
      toast.error("Erreur upload : " + e.message)
    } finally {
      setUploading(false)
    }
  }, [playerId, docType, supabase])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [], "image/*": [] }, maxFiles: 1
  })

  async function deleteDoc(doc: Document) {
    if (!confirm("Supprimer ce document ?")) return
    const path = doc.file_url.split("/documents/")[1]
    await supabase.storage.from("documents").remove([path])
    await supabase.from("documents").delete().eq("id", doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
    toast.success("Document supprimé")
  }

  async function toggleValidate(doc: Document) {
    const { data } = await supabase.from("documents")
      .update({ validated: !doc.validated }).eq("id", doc.id).select().single()
    if (data) setDocs(prev => prev.map(d => d.id === doc.id ? data : d))
    toast.success(data?.validated ? "Document validé" : "Validation retirée")
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-surface-800 text-sm border-b border-surface-100 pb-2 mb-4">
        Documents ({docs.length})
      </h3>

      {/* Upload zone */}
      {isAdmin && (
        <div className="mb-5 space-y-3">
          <select value={docType} onChange={e => setDocType(e.target.value)} className="input-field w-auto">
            {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all",
              isDragActive
                ? "border-brand-500 bg-brand-50"
                : "border-surface-200 hover:border-brand-400 hover:bg-surface-50"
            )}
          >
            <input {...getInputProps()} />
            {uploading
              ? <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="text-brand-600 animate-spin" />
                  <p className="text-sm text-surface-500">Upload en cours…</p>
                </div>
              : <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-surface-400" />
                  <p className="text-sm text-surface-500">
                    {isDragActive ? "Déposez le fichier ici" : "Glissez un PDF ou image, ou cliquez pour sélectionner"}
                  </p>
                  <p className="text-xs text-surface-400">PDF, JPG, PNG acceptés</p>
                </div>
            }
          </div>
        </div>
      )}

      {/* Liste documents */}
      {docs.length === 0
        ? <p className="text-sm text-surface-400 py-4 text-center">Aucun document enregistré</p>
        : <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.id}
                className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-100">
                <div className="w-9 h-9 bg-white border border-surface-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-surface-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{doc.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-surface-400">
                      {DOC_TYPES.find(t => t.value === doc.doc_type)?.label}
                    </span>
                    <span className="text-xs text-surface-300">·</span>
                    <span className="text-xs text-surface-400">{formatDate(doc.created_at)}</span>
                    {doc.file_size && (
                      <span className="text-xs text-surface-400">
                        · {(doc.file_size / 1024).toFixed(0)} Ko
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Statut validé */}
                  {doc.validated
                    ? <span className="badge bg-green-100 text-green-700 text-[10px] flex items-center gap-1">
                        <CheckCircle size={10} /> Validé
                      </span>
                    : <span className="badge bg-yellow-100 text-yellow-700 text-[10px] flex items-center gap-1">
                        <Clock size={10} /> En attente
                      </span>
                  }
                  {/* Actions */}
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-200 transition-colors text-surface-500">
                    <Download size={13} />
                  </a>
                  {isAdmin && <>
                    <button onClick={() => toggleValidate(doc)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-100 transition-colors text-surface-500 hover:text-green-600">
                      <CheckCircle size={13} />
                    </button>
                    <button onClick={() => deleteDoc(doc)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors text-surface-500 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </>}
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}
