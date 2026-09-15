import { NextResponse } from "next/server"
import { createPasswordResetCode } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      )
    }

    const result = await createPasswordResetCode(email.trim())
    if (!result) {
      return NextResponse.json(
        { error: "No account was found with this email address. Please check your spelling or create a new account." },
        { status: 404 }
      )
    }

    // Send code to user's real email address
    const emailResult = await sendPasswordResetEmail({
      to: result.email,
      code: result.code,
    })

    return NextResponse.json(
      {
        success: true,
        message: "A 6-digit verification code has been sent to your email address.",
        email: result.email,
        emailProvider: emailResult.provider,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error"
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: `Failed to generate password reset code: ${message}. Please try again.` },
      { status: 500 }
    )
  }
}
