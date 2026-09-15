import { NextResponse } from "next/server"
import { resetPasswordWithCode } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code, newPassword } = body

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      )
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "6-digit verification code is required." },
        { status: 400 }
      )
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      )
    }

    const { hash, salt } = hashPassword(newPassword)
    const result = await resetPasswordWithCode(email.trim(), code.trim(), hash, salt)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to reset password." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password has been successfully updated. You can now sign in with your new password.",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    )
  }
}
