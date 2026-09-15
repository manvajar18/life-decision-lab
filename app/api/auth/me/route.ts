import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession, getUserById } from "@/lib/db"
import { SESSION_COOKIE_NAME } from "@/lib/auth"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const session = await getSession(token)
    if (!session) {
      return NextResponse.json({ user: null })
    }

    const user = await getUserById(session.userId)
    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
