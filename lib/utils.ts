import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = "dd MMM yyyy") {
  return format(new Date(date), fmt, { locale: fr })
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA"
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}

export function avatarUrl(firstName: string, lastName: string, photoUrl?: string) {
  if (photoUrl) return photoUrl
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + " " + lastName)}&background=1b6b3a&color=fff&size=128&bold=true`
}

export const MONTHS = ["Janv","Févr","Mars","Avr","Mai","Juin","Juil","Août","Sept","Oct","Nov","Déc"]
export const MONTHS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]

export const CATEGORIES = ["Équipe 1ère","U17","U15","U12"] as const
export const POSITIONS  = ["Gardien","Défenseur","Milieu","Attaquant"] as const
export const DOC_TYPES  = [
  { value: "autorisation_parentale", label: "Autorisation parentale" },
  { value: "licence",                label: "Licence" },
  { value: "certificat_medical",     label: "Certificat médical" },
  { value: "autre",                  label: "Autre document" },
]

export function categoryColor(cat: string) {
  return {
    "Équipe 1ère": "bg-brand-600 text-white",
    "U17":         "bg-blue-600 text-white",
    "U15":         "bg-orange-500 text-white",
    "U12":         "bg-purple-600 text-white",
  }[cat] ?? "bg-surface-200 text-surface-700"
}

export function statusColor(status: string) {
  return {
    actif:    "bg-green-100 text-green-700",
    inactif:  "bg-surface-100 text-surface-600",
    suspendu: "bg-red-100 text-red-700",
  }[status] ?? ""
}

export function attendanceColor(status: string) {
  return { P: "bg-green-500", A: "bg-red-500", E: "bg-yellow-400" }[status] ?? "bg-surface-200"
}

export function paymentStatusLabel(status: string) {
  return { paid: "À jour", pending: "En attente", late: "En retard" }[status] ?? status
}

export function paymentStatusColor(status: string) {
  return {
    paid:    "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    late:    "bg-red-100 text-red-700 border-red-200",
  }[status] ?? ""
}

export function levelFromScore(score: number) {
  if (score >= 4.5) return { label: "Excellent",        color: "text-green-600 bg-green-50" }
  if (score >= 3.5) return { label: "Avancé",           color: "text-blue-600 bg-blue-50" }
  if (score >= 2.5) return { label: "Intermédiaire",    color: "text-yellow-600 bg-yellow-50" }
  if (score >= 1.5) return { label: "En progression",   color: "text-orange-600 bg-orange-50" }
  return                    { label: "Débutant",         color: "text-red-600 bg-red-50" }
}

export function roleLabel(role: string) {
  return { admin: "Admin", staff: "Staff / Coach", treasurer: "Trésorier", parent: "Parent / Joueur" }[role] ?? role
}

export function roleColor(role: string) {
  return {
    admin:     "bg-red-100 text-red-700",
    staff:     "bg-brand-100 text-brand-700",
    treasurer: "bg-blue-100 text-blue-700",
    parent:    "bg-purple-100 text-purple-700",
  }[role] ?? ""
}

export const ROLE_PERMISSIONS = {
  admin:     ["dashboard","players","attendance","payments","evaluations","competitions","documents","users"],
  staff:     ["dashboard","players","attendance","evaluations","competitions"],
  treasurer: ["dashboard","payments"],
  parent:    ["my-profile"],
}

export function canAccess(role: string, module: string) {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]?.includes(module) ?? false
}
