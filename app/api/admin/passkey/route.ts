import { NextResponse } from "next/server"
import { getAdminPasskey, setAdminPasskey } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { currentPasskey, newPasskey } = body

    if (!currentPasskey || !newPasskey) {
      return NextResponse.json(
        { error: "Both current passkey and new passkey are required." },
        { status: 400 }
      )
    }

    const actualPasskey = await getAdminPasskey()
    if (currentPasskey !== actualPasskey) {
      return NextResponse.json(
        { error: "Current passkey is incorrect." },
        { status: 401 }
      )
    }

    if (typeof newPasskey !== "string" || newPasskey.trim().length < 4) {
      return NextResponse.json(
        { error: "New passkey must be at least 4 characters long." },
        { status: 400 }
      )
    }

    await setAdminPasskey(newPasskey.trim())

    return NextResponse.json({
      success: true,
      message: "Admin passkey updated successfully and saved to database.",
    })
  } catch (error) {
    console.error("Change passkey error:", error)
    return NextResponse.json(
      { error: "Failed to update admin passkey." },
      { status: 500 }
    )
  }
}
