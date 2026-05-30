import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { avatarUrl, DOC_TYPES, formatDate, cn } from "@/lib/utils"
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react"

export default async function DocumentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!["admin","staff"].includes(profile?.role ?? "")) redirect("/dashboard")

  const { data: documents } = await supabase
    .from("documents")
    .select("*, player:players(id,first_name,last_name,category,photo_url)")
    .order("created_at", { ascending: false })

  const validated   = documents?.filter(d => d.validated).length ?? 0
  const pending     = documents?.filter(d => !d.validated).length ?? 0
  const withDoc     = new Set(documents?.map(d => d.player_id)).size
  const { count: totalPlayers } = await supabase.from("players").select("*", { count: "exact", head: true }).eq("status","actif")
  const withoutDoc  = (totalPlayers ?? 0) - withDoc

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Documents</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total documents",     val: documents?.length ?? 0, icon: FileText,    color: "text-surface-600", bg: "bg-surface-100" },
          { label: "Validés",             val: validated,              icon: CheckCircle,  color: "text-green-700",   bg: "bg-green-100"   },
          { label: "En attente",          val: pending,                icon: Clock,        color: "text-yellow-700",  bg: "bg-yellow-100"  },
          { label: "Joueurs sans doc",    val: withoutDoc,             icon: AlertCircle,  color: "text-red-700",     bg: "bg-red-100"     },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className={`card p-4 flex items-center gap-3 border-0 ${bg}`}>
            <Icon size={20} className={`flex-shrink-0 ${color}`} />
            <div>
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className={`text-xs ${color} opacity-70`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Joueur</th>
              <th className="th">Type</th>
              <th className="th">Fichier</th>
              <th className="th text-center">Statut</th>
              <th className="th">Date</th>
              <th className="th text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {documents?.map(doc => (
              <tr key={doc.id} className="hover:bg-surface-50">
                <td className="td">
                  <div className="flex items-center gap-2">
                    <Image
                      src={avatarUrl(doc.player?.first_name ?? "?", doc.player?.last_name ?? "?", doc.player?.photo_url)}
                      alt="" width={32} height={32}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                    <Link href={`/players/${doc.player_id}`}
                      className="text-sm font-medium text-surface-800 hover:text-brand-600 transition-colors">
                      {doc.player?.first_name} {doc.player?.last_name}
                    </Link>
                  </div>
                </td>
                <td className="td text-sm text-surface-600">
                  {DOC_TYPES.find(t => t.value === doc.doc_type)?.label ?? doc.doc_type}
                </td>
                <td className="td">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-brand-600 hover:underline truncate max-w-xs block">
                    {doc.file_name}
                  </a>
                </td>
                <td className="td text-center">
                  {doc.validated
                    ? <span className="badge bg-green-100 text-green-700 flex items-center gap-1 w-fit mx-auto">
                        <CheckCircle size={10} /> Validé
                      </span>
                    : <span className="badge bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit mx-auto">
                        <Clock size={10} /> En attente
                      </span>
                  }
                </td>
                <td className="td text-sm text-surface-500">{formatDate(doc.created_at)}</td>
                <td className="td text-center">
                  <Link href={`/players/${doc.player_id}`}
                    className="text-xs text-brand-600 hover:underline">
                    Voir joueur
                  </Link>
                </td>
              </tr>
            ))}
            {!documents?.length && (
              <tr>
                <td colSpan={6} className="td text-center text-surface-400 py-10">
                  Aucun document enregistré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
