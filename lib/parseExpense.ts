import { GoogleGenerativeAI } from "@google/generative-ai"

export async function parseExpense(text: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const prompt = `Extract expense details from this text and return ONLY a JSON object with no markdown or extra text:
{"amount": number, "category": string, "description": string}
Categories must be one of: food, travel, health, shopping, entertainment, other
Text: "${text}"`

  const result = await model.generateContent(prompt)
  const response = result.response.text().trim()
  return JSON.parse(response)
}