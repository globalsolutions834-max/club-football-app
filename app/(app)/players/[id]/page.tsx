import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  avatarUrl, categoryColor, statusColor, cn, formatDate,
  levelFromScore, MONTHS, paymentStatusColor, paymentStatusLabel
} from "@/lib/utils"
import { ArrowLeft, Pencil, Phone, Calendar, Shield, Star } from "lucide-react"
import PlayerDocuments from "@/components/players/PlayerDocuments"

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const { data: player } = await supabase.from("players").select("*").eq("id", params.id).single()
  if (!player) notFound()

  const [
    { data: payments },
    { data: evaluations },
    { data: attendances },
    { data: documents },
  ] = await Promise.all([
    supabase.from("payments").select("*").eq("player_id", params.id).order("year,month"),
    supabase.from("evaluations").select("*").eq("player_id", params.id).order("year,quarter"),
    supabase.from("attendances").select("*").eq("player_id", params.id).order("session_date", { ascending: false }).limit(20),
    supabase.from("documents").select("*").eq("player_id", params.id),
  ])

  const canEdit = ["admin","staff"].includes(profile?.role ?? "")
  const canSeePayments = ["admin","treasurer"].includes(profile?.role ?? "")
  const canSeeDocs = ["admin","staff"].includes(profile?.role ?? "")

  const presentCount = attendances?.filter(a => a.status === "P").length ?? 0
  const totalSessions = attendances?.length ?? 0
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

  const lastEval = evaluations?.[evaluations.length - 1]
  const level = lastEval ? levelFromScore(lastEval.global_score) : null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/players" className="btn-secondary px-3 py-2">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1" />
        {canEdit && (
          <Link href={`/players/${params.id}/edit`} className="btn-primary">
            <Pencil size={14} /> Modifier
          </Link>
        )}
      </div>

      {/* Carte profil */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative">
            <Image
              src={avatarUrl(player.first_name, player.last_name, player.photo_url)}
              alt={`${player.first_name} ${player.last_name}`}
              width={96} height={96}
              className="w-24 h-24 rounded-2xl object-cover"
            />
            {player.jersey_number && (
              <span className="absolute -bottom-2 -right-2 w-7 h-7 bg-brand-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                {player.jersey_number}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-surface-900">
                {player.first_name} {player.last_name}
              </h1>
              <span className={cn("badge", categoryColor(player.category))}>{player.category}</span>
              <span className={cn("badge", statusColor(player.status))}>{player.status}</span>
              {level && <span className={cn("badge", level.color)}>{level.label}</span>}
            </div>
            <p className="text-surface-500 text-sm mb-3">{player.position ?? "Poste non défini"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Présence", value: `${attendanceRate}%` },
                { label: "Saisons", value: player.seasons_at_club },
                { label: "Docs", value: documents?.length ?? 0 },
                { label: "Évals.", value: evaluations?.length ?? 0 },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-surface-400">{label}</p>
                  <p className="text-lg font-semibold text-surface-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infos personnelles */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-surface-800 text-sm border-b border-surface-100 pb-2">Informations</h3>
          {[
            { label: "Date de naissance", value: player.date_of_birth ? formatDate(player.date_of_birth) : "—" },
            { label: "Téléphone", value: player.phone ?? "—" },
            { label: "Adresse", value: player.address ?? "—" },
            { label: "Tuteur", value: player.parent_name ?? "—" },
            { label: "Tél. tuteur", value: player.parent_phone ?? "—" },
            { label: "Cotisation", value: `${(player.monthly_fee ?? 0).toLocaleString("fr-FR")} FCFA/mois` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-surface-400">{label}</p>
              <p className="text-sm font-medium text-surface-700">{value}</p>
            </div>
          ))}
          {player.season_goal && (
            <div className="mt-3 p-3 bg-brand-50 rounded-xl border border-brand-100">
              <p className="text-xs text-brand-600 font-medium mb-1">Objectif saison</p>
              <p className="text-sm text-brand-800">{player.season_goal}</p>
            </div>
          )}
          {player.staff_notes && (
            <div className="mt-2 p-3 bg-surface-50 rounded-xl">
              <p className="text-xs text-surface-400 font-medium mb-1">Notes du staff</p>
              <p className="text-sm text-surface-600">{player.staff_notes}</p>
            </div>
          )}
        </div>

        {/* Présences récentes */}
        <div className="card p-5">
          <h3 className="font-semibold text-surface-800 text-sm border-b border-surface-100 pb-2 mb-3">Présences récentes</h3>
          <div className="space-y-2">
            {attendances?.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center gap-3">
                <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                  a.status === "P" ? "bg-green-500" : a.status === "A" ? "bg-red-400" : "bg-yellow-400"
                )}>
                  {a.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-700">{a.session_type}</p>
                  <p className="text-xs text-surface-400">{formatDate(a.session_date, "dd MMM yyyy")}</p>
                </div>
              </div>
            ))}
            {!attendances?.length && <p className="text-sm text-surface-400 py-4 text-center">Aucune présence enregistrée</p>}
          </div>
        </div>

        {/* Cotisations */}
        {canSeePayments && (
          <div className="card p-5">
            <h3 className="font-semibold text-surface-800 text-sm border-b border-surface-100 pb-2 mb-3">Cotisations</h3>
            <div className="space-y-2">
              {payments?.map(pay => (
                <div key={pay.id} className="flex items-center justify-between">
                  <p className="text-xs text-surface-600">{MONTHS[pay.month - 1]} {pay.year}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-surface-700">{pay.amount.toLocaleString("fr-FR")} F</p>
                    <span className={cn("badge text-[10px]", paymentStatusColor(pay.status))}>
                      {paymentStatusLabel(pay.status)}
                    </span>
                  </div>
                </div>
              ))}
              {!payments?.length && <p className="text-sm text-surface-400 py-4 text-center">Aucun paiement enregistré</p>}
            </div>
          </div>
        )}
      </div>

      {/* Documents */}
      {canSeeDocs && (
        <PlayerDocuments
          documents={documents ?? []}
          playerId={params.id}
          isAdmin={profile?.role === "admin"}
        />
      )}

      {/* Évaluations */}
      {evaluations && evaluations.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-surface-800 text-sm border-b border-surface-100 pb-3 mb-4">Évaluations techniques</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {["Période","Passe","Contrôle","Tir","Dribble","Vitesse","Endurance","Discipline","Équipe","Score"].map(h => (
                    <th key={h} className="th text-center">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evaluations.map(ev => (
                  <tr key={ev.id}>
                    <td className="td font-medium">T{ev.quarter} {ev.year}</td>
                    {[ev.passing,ev.ball_control,ev.shooting,ev.dribbling,ev.speed,ev.endurance,ev.discipline,ev.teamwork].map((v,i) => (
                      <td key={i} className="td text-center">
                        <span className={cn("inline-flex w-6 h-6 rounded items-center justify-center font-semibold text-white text-[10px]",
                          v >= 4 ? "bg-green-500" : v >= 3 ? "bg-blue-500" : v >= 2 ? "bg-yellow-500" : "bg-red-400"
                        )}>{v ?? "—"}</span>
                      </td>
                    ))}
                    <td className="td text-center font-bold text-brand-600">{ev.global_score}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
