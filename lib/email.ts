const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
const baseUrl = process.env.NEXTAUTH_URL

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: "Kuberly", email: "nanvith2007@gmail.com" },
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
  const isOver = percent >= 100

  await sendEmail(
    email,
    `${isOver ? "🚨" : "⚠️"} Budget Alert: ${category}`,
    `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 20px auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
      <div style="margin-bottom: 24px; text-align: center;">
        <span style="font-weight: 800; font-size: 18px; color: #6366f1; letter-spacing: -0.02em;">Kuberly</span>
      </div>
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: ${isOver ? "#fef2f2" : "#fffbeb"}; color: ${isOver ? "#ef4444" : "#d97706"}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 6px; margin-bottom: 12px;">
          ${isOver ? "Budget Exceeded" : "Budget Warning"}
        </div>
        <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700;">${isOver ? "Over Limit Notice" : "Near Limit Warning"}</h2>
      </div>
      <p style="color: #475569; font-size: 15px; line-height: 1.5; text-align: center; margin-bottom: 24px;">
        You've used <strong style="color: ${isOver ? "#ef4444" : "#d97706"};">${percent}%</strong> of your monthly limit for the <strong style="text-transform: capitalize; color: #0f172a;">${category}</strong> category.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="font-size: 13px; color: #64748b; font-weight: 500; padding: 4px 0;">Spent</td>
            <td style="font-size: 15px; color: ${isOver ? "#ef4444" : "#0f172a"}; font-weight: 700; text-align: right; padding: 4px 0;">₹${spent.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #64748b; font-weight: 500; padding: 4px 0;">Monthly Limit</td>
            <td style="font-size: 15px; color: #0f172a; font-weight: 700; text-align: right; padding: 4px 0;">₹${limit.toLocaleString("en-IN")}</td>
          </tr>
        </table>
        <div style="background-color: #e2e8f0; height: 6px; border-radius: 99px; overflow: hidden;">
          <div style="background-color: ${isOver ? "#ef4444" : "#f59e0b"}; height: 100%; width: ${Math.min(percent, 100)}%;"></div>
        </div>
      </div>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${baseUrl}/budgets" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);">Manage Budgets</a>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin-bottom: 16px;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        Sent automatically by Kuberly · Track smart, save more.
      </p>
    </div>
    `
  )
}

export async function sendMonthlySummary(email: string, totalSpent: number, byCategory: Record<string, number>) {
  console.log("sending monthly summary to:", email)

  const categoryRows = Object.entries(byCategory)
    .map(([cat, amt]) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 14px; text-transform: capitalize;">${cat}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">₹${amt.toLocaleString("en-IN")}</td>
      </tr>`)
    .join("")

  await sendEmail(
    email,
    `📊 Your Monthly Expense Summary`,
    `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 20px auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
      <div style="margin-bottom: 24px; text-align: center;">
        <span style="font-weight: 800; font-size: 18px; color: #6366f1; letter-spacing: -0.02em;">Kuberly</span>
      </div>
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #e0e7ff; color: #6366f1; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 6px; margin-bottom: 12px;">
          Monthly Report
        </div>
        <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700;">Expense Summary</h2>
      </div>
      <div style="text-align: center; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
        <span style="font-size: 13px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Total Spent This Month</span>
        <h3 style="color: #0f172a; margin: 4px 0 0 0; font-size: 28px; font-weight: 800;">₹${totalSpent.toLocaleString("en-IN")}</h3>
      </div>
      
      <h4 style="color: #0f172a; font-size: 14px; font-weight: 700; margin: 0 0 12px 0;">Breakdown by Category</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tbody>${categoryRows}</tbody>
      </table>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${baseUrl}/dashboard" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);">Go to Dashboard</a>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin-bottom: 16px;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        Sent automatically by Kuberly · Track smart, save more.
      </p>
    </div>
    `
  )
}