"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"

type Expense = {
  id: string
  amount: number
  category: string
  description: string
  date: string
  source: string
}

const ExpenseTable = forwardRef((_, ref) => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [search, setSearch] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  async function fetchExpenses() {
    const res = await fetch("/api/expenses")
    const data = await res.json()
    setExpenses(data)
  }

  useImperativeHandle(ref, () => ({ refresh: fetchExpenses }))

  useEffect(() => { fetchExpenses() }, [])

  async function handleDelete(id: string) {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" })
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const filtered = expenses.filter(e => {
    const matchSearch = e.description?.toLowerCase().includes(search.toLowerCase())
    const matchFrom = from ? e.date >= from : true
    const matchTo = to ? e.date <= to : true
    return matchSearch && matchFrom && matchTo
  })

  return (
    <div>
      <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
      <input type="date" value={to} onChange={e => setTo(e.target.value)} />
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Source</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(e => (
            <tr key={e.id}>
              <td>{e.date}</td>
              <td>{e.description}</td>
              <td>{e.category}</td>
              <td>₹{e.amount}</td>
              <td>{e.source}</td>
              <td>
                <button onClick={() => handleDelete(e.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

ExpenseTable.displayName = "ExpenseTable"
export default ExpenseTable