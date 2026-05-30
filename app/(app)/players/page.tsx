import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { avatarUrl, categoryColor, statusColor, cn } from "@/lib/utils"
import { UserPlus, Search, Filter } from "lucide-react"
import PlayersFilter from "@/components/players/PlayersFilter"

export default async function PlayersPage({
  searchParams
}: {
  searchParams: { q?: string; category?: string; status?: string; position?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  let query = supabase.from("players").select("*").order("last_name")
  if (searchParams.q)        query = query.or(`last_name.ilike.%${searchParams.q}%,first_name.ilike.%${searchParams.q}%`)
  if (searchParams.category) query = query.eq("category", searchParams.category)
  if (searchParams.status)   query = query.eq("status", searchParams.status)
  if (searchParams.position) query = query.eq("position", searchParams.position)

  const { data: players } = await query

  const canEdit = ["admin","staff"].includes(profile?.role ?? "")

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Joueurs</h1>
          <p className="text-surface-500 text-sm">{players?.length ?? 0} joueur(s) trouvé(s)</p>
        </div>
        {canEdit && (
          <Link href="/players/new" className="btn-primary">
            <UserPlus size={16} /> Nouveau joueur
          </Link>
        )}
      </div>

      <PlayersFilter />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {players?.map(p => (
          <Link key={p.id} href={`/players/${p.id}`}
            className="card-hover p-4 group flex flex-col gap-3">
            {/* Photo + infos */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src={avatarUrl(p.first_name, p.last_name, p.photo_url)}
                  alt={`${p.first_name} ${p.last_name}`}
                  width={48} height={48}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                {p.jersey_number && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {p.jersey_number}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-surface-900 text-sm truncate">
                  {p.last_name} {p.first_name}
                </p>
                <p className="text-xs text-surface-400">{p.position ?? "—"}</p>
              </div>
            </div>
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("badge text-xs", categoryColor(p.category))}>{p.category}</span>
              <span className={cn("badge text-xs", statusColor(p.status))}>{p.status}</span>
            </div>
            {/* Saisons */}
            <p className="text-xs text-surface-400">
              {p.seasons_at_club} saison{p.seasons_at_club > 1 ? "s" : ""} au club
            </p>
          </Link>
        ))}
        {players?.length === 0 && (
          <div className="col-span-full card p-12 text-center text-surface-400">
            <p className="text-lg mb-1">Aucun joueur trouvé</p>
            <p className="text-sm">Modifiez vos filtres ou ajoutez un joueur</p>
          </div>
        )}
      </div>
    </div>
  )
}
