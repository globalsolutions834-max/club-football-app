"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts"

export default function DashboardCharts({
  paymentData, attendanceData
}: {
  paymentData: { mois: string; collecté: number }[]
  attendanceData: { semaine: string; taux: number }[]
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-5">
        <h3 className="font-semibold text-surface-800 text-sm mb-4">Cotisations collectées par mois (FCFA)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={paymentData} barSize={24}>
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#6c757d" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6c757d" }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
            <Tooltip
              formatter={(v: number) => [new Intl.NumberFormat("fr-FR").format(v) + " FCFA", "Collecté"]}
              contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)", fontSize: 12 }}
            />
            <Bar dataKey="collecté" fill="#2e8b57" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-surface-800 text-sm mb-4">Taux de présence (8 dernières semaines)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
            <XAxis dataKey="semaine" tick={{ fontSize: 11, fill: "#6c757d" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6c757d" }} axisLine={false} tickLine={false}
              domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip
              formatter={(v: number) => [`${v}%`, "Présence"]}
              contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)", fontSize: 12 }}
            />
            <Line dataKey="taux" stroke="#2e8b57" strokeWidth={2.5} dot={{ fill: "#2e8b57", r: 4 }}
              activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
