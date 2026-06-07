/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  BarChart, Bar, Legend, ResponsiveContainer
} from "recharts"

type Expense = {
  id: string
  amount: number
  category: string
  created_at: string
  description: string
}

type Props = { expenses: Expense[] }

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#ec4899"]

export default function Charts({ expenses }: Props) {
  if (expenses.length === 0) {
    return (
      <div className="empty-state card" style={{ padding: "3rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem", opacity: 0.5 }}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <p>No data available for charts.</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>Add your first expense to see spending analysis.</p>
      </div>
    )
  }

  const byDate = expenses.reduce((acc: Record<string, number>, e) => {
    const dateKey = new Date(e.created_at).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    const d = new Date(dateKey)
    const yyyymmdd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    acc[yyyymmdd] = (acc[yyyymmdd] || 0) + e.amount
    return acc
  }, {})

  const lineData = Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, total]) => {
      const [year, month, day] = date.split("-")
      return { date: `${day}/${month}/${year}`, total }
    })

  const byCategory = expenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  const now = new Date()
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  const thisMonth = `${istNow.getFullYear()}-${String(istNow.getMonth() + 1).padStart(2, "0")}`
  const lastMonthDate = new Date(istNow.getFullYear(), istNow.getMonth() - 1)
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`

  const thisTotal = expenses.filter(e => {
    const ist = new Date(new Date(e.created_at).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}` === thisMonth
  }).reduce((s, e) => s + e.amount, 0)

  const lastTotal = expenses.filter(e => {
    const ist = new Date(new Date(e.created_at).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}` === lastMonth
  }).reduce((s, e) => s + e.amount, 0)

  const barData = [
    { month: "Last Month", total: lastTotal },
    { month: "This Month", total: thisTotal }
  ]

  const heatmapData: Record<string, number> = {}
  const localToday = istNow

  for (let i = 29; i >= 0; i--) {
    const d = new Date(localToday)
    d.setDate(localToday.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    heatmapData[key] = 0
  }
  expenses.forEach(e => {
    const localD = new Date(new Date(e.created_at).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    const key = `${localD.getFullYear()}-${String(localD.getMonth() + 1).padStart(2, "0")}-${String(localD.getDate()).padStart(2, "0")}`
    if (key in heatmapData) heatmapData[key] += e.amount
  })
  const heatmapDays = Object.entries(heatmapData)
  const maxAmount = Math.max(...heatmapDays.map(([, v]) => v), 1)

  function heatColor(amount: number) {
    if (amount === 0) return "var(--bg-elevated)"
    const intensity = amount / maxAmount
    const opacity = Math.max(0.1, Math.min(1, Math.ceil(intensity * 10) / 10))
    return `rgba(99, 102, 241, ${opacity})`
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>
        ₹{value}
      </text>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 className="section-title" style={{ marginBottom: "1rem" }}>Spending Heatmap (Last 30 Days)</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(30, minmax(0, 1fr))",
          gap: 6,
          marginBottom: "0.5rem",
          maxWidth: "100%"
        }}>
          {heatmapDays.map(([date, amount]) => {
            const [year, month, day] = date.split("-")
            const indianDate = `${day}/${month}/${year}`
            return (
              <div
                key={date}
                title={`${indianDate}: ₹${Math.round(amount)}`}
                style={{
                  aspectRatio: "1",
                  borderRadius: 4,
                  background: heatColor(amount),
                  cursor: "default"
                }}
              />
            )
          })}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-3)" }}>Hover over a cell to see the amount</p>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 className="section-title" style={{ marginBottom: "1rem" }}>Spending Over Time</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={lineData}>
            <XAxis dataKey="date" stroke="var(--text-3)" fontSize={11} />
            <YAxis stroke="var(--text-3)" fontSize={11} />
            <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-1)" }} formatter={(v) => `₹${v}`} />
            <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>Spending by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderCustomLabel}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-1)" }} formatter={(v) => `₹${v}`} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-2)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>This Month vs Last Month</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <XAxis dataKey="month" stroke="var(--text-3)" fontSize={11} />
              <YAxis stroke="var(--text-3)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-1)" }} formatter={(v) => `₹${v}`} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-2)" }} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}