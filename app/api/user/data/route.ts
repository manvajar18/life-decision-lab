import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession, getUserData, saveUserData } from "@/lib/db"
import { SESSION_COOKIE_NAME } from "@/lib/auth"

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const session = await getSession(token)
  if (!session) return null

  return session.userId
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await getUserData(userId)
    return NextResponse.json({ data: data ?? null })
  } catch (error) {
    console.error("Get user data error:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    const saved = await saveUserData(userId, {
      answers: payload.answers,
      step: payload.step,
      complete: payload.complete,
      selectedPath: payload.selectedPath,
      assumptions: payload.assumptions,
      checked: payload.checked,
    })

    return NextResponse.json({ data: saved, message: "Progress saved successfully." })
  } catch (error) {
    console.error("Save user data error:", error)
    return NextResponse.json({ error: "Failed to save user data" }, { status: 500 })
  }
}
