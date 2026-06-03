import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const { email, password, full_name, role, player_id } = await req.json()

    // Correction : Ajout de await car cookies() est asynchrone dans Next.js 15
    const cookieStore = await cookies()
    
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const { data: profile } = await supabaseUser
      .from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin")
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: newUser, error } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await adminClient.from("profiles").update({
      role, full_name, player_id: player_id || null,
    }).eq("id", newUser.user.id)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}