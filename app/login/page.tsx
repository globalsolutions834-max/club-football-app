"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) { 
      toast.error("Email ou mot de passe incorrect")
      setLoading(false)
      return 
    }
    
    toast.success("Connexion réussie !")
    
    // Correction : Forcer une redirection matérielle propre pour charger les cookies
    window.location.href = "/dashboard"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-brand-900 to-surface-950 flex items-center justify-center p-4">
      {/* Fond décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo / Club */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl shadow-glow mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Club de Football</h1>
          <p className="text-surface-400 text-sm mt-1">Espace de gestion — Accès sécurisé</p>
        </div>

        {/* Card login */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-modal">
          <h2 className="text-lg font-semibold text-white mb-6">Connexion</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Adresse email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com" required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                           placeholder-surface-500 text-sm focus:outline-none focus:ring-2
                           focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-surface-500 text-sm focus:outline-none focus:ring-2
                             focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl
                         transition-all duration-200 flex items-center justify-center gap-2
                         shadow-glow hover:shadow-lg active:scale-[0.98] mt-2 disabled:opacity-60">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-surface-500 text-center">
              Accès réservé aux membres autorisés du club.<br />
              Contactez l'administrateur pour obtenir vos accès.
            </p>
          </div>
        </div>

        {/* Rôles info */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {[
            { role: "Admin", color: "bg-red-500/20 text-red-300 border-red-500/20" },
            { role: "Staff", color: "bg-brand-600/20 text-brand-300 border-brand-500/20" },
            { role: "Trésorier", color: "bg-blue-500/20 text-blue-300 border-blue-500/20" },
            { role: "Parent", color: "bg-purple-500/20 text-purple-300 border-purple-500/20" },
          ].map(({ role, color }) => (
            <div key={role} className={`border rounded-xl px-2 py-1.5 text-center text-xs font-medium ${color}`}>
              {role}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
