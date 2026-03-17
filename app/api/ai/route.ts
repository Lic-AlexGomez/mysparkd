import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  console.log('=== AI API llamada ===')
  try {
    const body = await req.json()
    console.log('Body recibido:', body)
    const { type, otherUsername, lastMessages } = body

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 })

    let prompt = ""

    if (type === "suggestions") {
      const context = lastMessages?.filter((m: any) => m.content?.trim()).map((m: any) => m.content).join(" | ") || "inicio de conversación"
      prompt = `Eres un asistente de una app de citas llamada Sparkd. Sugiere 3 temas de conversación cortos y naturales en español para hablar con ${otherUsername || 'esta persona'}. Contexto: ${context}. Responde SOLO con un JSON array de strings. Ejemplo: ["¿Qué haces los fines de semana?", "¿Cuál es tu película favorita?", "¿Te gusta viajar?"]`
    } else if (type === "icebreaker") {
      prompt = `Eres un asistente de una app de citas llamada Sparkd. Genera UN mensaje de apertura creativo y natural en español para iniciar conversación con ${otherUsername || 'esta persona'}. Responde SOLO con el mensaje, sin comillas ni explicación.`
    } else if (type === "date") {
      prompt = `Eres un asistente de una app de citas llamada Sparkd. Sugiere 3 ideas de citas creativas y específicas en español. Responde SOLO con un JSON array de strings. Ejemplo: ["Ir a ver una película este sábado", "Visitar el mercado local el domingo"]`
    } else if (type === "game_trivia") {
      prompt = `Eres un asistente de una app de citas llamada Sparkd. Genera 8 preguntas de trivia divertidas y variadas en español (cultura general, entretenimiento, curiosidades). Responde SOLO con un JSON array de objetos con este formato exacto: [{"q":"pregunta","options":["A","B","C","D"],"answer":0}] donde answer es el índice (0-3) de la opción correcta. Varía los temas y dificultad.`
    } else if (type === "game_truth") {
      const context = lastMessages?.filter((m: any) => m.content?.trim()).map((m: any) => m.content).join(" | ") || ""
      prompt = `Eres un asistente de una app de citas llamada Sparkd. Genera 12 preguntas y retos divertidos para que ${otherUsername || 'dos personas'} se conozcan mejor. ${context ? `Contexto de su conversación: ${context}.` : ''} Mezcla preguntas personales, divertidas y románticas. Responde SOLO con un JSON array de objetos: [{"type":"truth","text":"pregunta"},{"type":"dare","text":"reto"}]. Alterna entre truth y dare.`
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.8
      })
    })

    const data = await response.json()
    console.log('Groq status:', response.status)
    console.log('Groq response:', JSON.stringify(data))

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "Error de IA" }, { status: 500 })
    }

    const content = data.choices?.[0]?.message?.content?.trim() || ""

    try {
      // Extraer JSON si viene con texto extra
      const jsonMatch = content.match(/\[.*\]/s)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json({ result: parsed })
        }
      }
    } catch { }

    if (content) {
      return NextResponse.json({ result: [content.replace(/^"|"$/g, '').trim()] })
    }

    return NextResponse.json({ result: ["No se pudo generar sugerencia"] })

  } catch (error) {
    console.error('Error en AI route:', error)
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 })
  }
}
