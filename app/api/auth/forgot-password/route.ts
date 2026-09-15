import { NextResponse } from "next/server"
import { createPasswordResetCode } from "@/lib/db"

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

    console.log(`[AUTH] Password reset code for ${result.email}: ${result.code}`)

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent successfully. Use this code to set your new password.",
        code: result.code,
        email: result.email,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Failed to generate password reset code. Please try again." },
      { status: 500 }
    )
  }
}
