const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: "Dadu Expense", email: "nanvith2007@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  const result = await res.json()
  console.log("Brevo result:", JSON.stringify(result))
  return result
}

export async function sendBudgetAlert(email: string, category: string, spent: number, limit: number) {
  console.log("sending budget alert to:", email)
  const percent = Math.round((spent / limit) * 100)

  await sendEmail(
    email,
    `⚠️ Budget Alert: ${category}`,
    `
    <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #e53e3e;">⚠️ Budget Alert</h2>
      <p>You've used <strong>${percent}%</strong> of your <strong>${category}</strong> budget.</p>
      <div style="background: #fff5f5; border-left: 4px solid #e53e3e; padding: 12px; border-radius: 4px; margin: 16px 0;">
        <p style="margin:0;">Spent: <strong>₹${spent}</strong> / Limit: <strong>₹${limit}</strong></p>
      </div>
      <p style="color: #666; font-size: 14px;">Consider reducing your ${category} expenses for the rest of the month.</p>
      <p style="color: #aaa; font-size: 12px;">— Dadu Expense</p>
    </div>
    `
  )
}

export async function sendMonthlySummary(email: string, totalSpent: number, byCategory: Record<string, number>) {
  console.log("sending monthly summary to:", email)

  const categoryRows = Object.entries(byCategory)
    .map(([cat, amt]) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${cat}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">₹${amt}</td>
      </tr>`)
    .join("")

  await sendEmail(
    email,
    `📊 Your Monthly Expense Summary`,
    `
    <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #3182ce;">📊 Monthly Summary</h2>
      <p>Total spent this month: <strong>₹${totalSpent}</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr style="background: #f7fafc;">
            <th style="padding: 8px 12px; text-align: left;">Category</th>
            <th style="padding: 8px 12px; text-align: left;">Amount</th>
          </tr>
        </thead>
        <tbody>${categoryRows}</tbody>
      </table>
      <p style="color: #aaa; font-size: 12px; margin-top: 24px;">— Dadu Expense</p>
    </div>
    `
  )
}