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
  date: string
  created_at: string
}

type Props = { expenses: Expense[] }

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#ec4899"]

export default function Charts({ expenses }: Props) {
  const byDate = expenses.reduce((acc: Record<string, number>, e) => {
    const date = new Date(e.created_at).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
    })
    acc[date] = (acc[date] || 0) + e.amount
    return acc
  }, {})
  const lineData = Object.entries(byDate)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))

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
    const d = new Date(e.created_at).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    const ist = new Date(d)
    return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}` === thisMonth
  }).reduce((s, e) => s + e.amount, 0)

  const lastTotal = expenses.filter(e => {
    const d = new Date(e.created_at).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    const ist = new Date(d)
    return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}` === lastMonth
  }).reduce((s, e) => s + e.amount, 0)

  const barData = [
    { month: "Last Month", total: lastTotal },
    { month: "This Month", total: thisTotal }
  ]

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
        ₹{value}
      </text>
    )
  }

  return (
    <div>
      <h2>Spending Over Time</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={lineData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(v) => `₹${v}`} />
          <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>

      <h2>Spending by Category</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            labelLine={false}
            label={renderCustomLabel}
          >
            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => `₹${v}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <h2>This Month vs Last Month</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={barData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(v) => `₹${v}`} />
          <Legend />
          <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}