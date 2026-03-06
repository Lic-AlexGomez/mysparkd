import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    // Aquí Stripe enviará eventos como:
    // - checkout.session.completed (pago exitoso)
    // - customer.subscription.updated (cambio en suscripción)
    // - customer.subscription.deleted (cancelación)

    const event = JSON.parse(body)

    // Reenviar al backend para procesar
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    const response = await fetch(`${backendUrl}/api/subscription/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": signature,
      },
      body: body,
    })

    if (!response.ok) {
      throw new Error("Backend webhook failed")
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook error" },
      { status: 400 }
    )
  }
}
