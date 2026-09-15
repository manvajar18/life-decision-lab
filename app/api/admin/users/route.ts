import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import { deleteUser, getAllUsersWithProgress, getDatabaseInfo, getAdminPasskey } from "@/lib/db"

async function checkAdminAuth(request: Request): Promise<boolean> {
  const currentPasskey = await getAdminPasskey()
  const headerKey = request.headers.get("x-admin-passkey")
  const url = new URL(request.url)
  const queryKey = url.searchParams.get("passkey")
  return headerKey === currentPasskey || queryKey === currentPasskey
}

export async function GET(request: Request) {
  if (!(await checkAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized. Invalid admin passkey." }, { status: 401 })
  }

  try {
    const users = await getAllUsersWithProgress()
    const dbInfo = await getDatabaseInfo()

    // Get database file size
    let fileSizeBytes = 0
    try {
      const stats = await fs.stat(dbInfo.filePath)
      fileSizeBytes = stats.size
    } catch {
      // file stat failed
    }

    let completedAssessments = 0
    let totalRoadmapTasksChecked = 0

    users.forEach((u) => {
      if (u.userData) {
        if (u.userData.complete) completedAssessments++
        if (u.userData.checked) {
          totalRoadmapTasksChecked += Object.values(u.userData.checked).filter(Boolean).length
        }
      }
    })

    return NextResponse.json({
      users,
      stats: {
        totalUsers: users.length,
        totalSessions: dbInfo.totalSessions,
        completedAssessments,
        totalRoadmapTasksChecked,
        databaseSizeBytes: fileSizeBytes,
        databasePath: dbInfo.filePath,
      },
    })
  } catch (error) {
    console.error("Admin fetch users error:", error)
    return NextResponse.json({ error: "Failed to retrieve admin data." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await checkAdminAuth(request))) {
    return NextResponse.json({ error: "Unauthorized. Invalid admin passkey." }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID parameter." }, { status: 400 })
    }

    const success = await deleteUser(userId)
    if (!success) {
      return NextResponse.json({ error: "User not found or could not be deleted." }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: `User ${userId} deleted successfully.` })
  } catch (error) {
    console.error("Admin delete user error:", error)
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 })
  }
}
