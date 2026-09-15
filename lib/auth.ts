import crypto from "node:crypto"
import { cookies } from "next/headers"
import { getSession, getUserById, type User } from "@/lib/db"

export const SESSION_COOKIE_NAME = "ldl_session"
export const SESSION_DURATION_DAYS = 365

/**
 * Hash a plain text password with PBKDF2 (SHA-512) and a cryptographically secure random salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex")
  return { hash, salt }
}

/**
 * Verify a plain text password against a stored hash and salt using constant-time comparison.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derived = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex")
    const bufferA = Buffer.from(derived, "hex")
    const bufferB = Buffer.from(hash, "hex")
    if (bufferA.length !== bufferB.length) return false
    return crypto.timingSafeEqual(bufferA, bufferB)
  } catch {
    return false
  }
}

/**
 * Generate a cryptographically secure random session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Read the current session from incoming request cookies and return the authenticated user, or null if unauthenticated.
 */
export async function getCurrentUser(): Promise<Omit<User, "passwordHash" | "salt"> | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!sessionToken) return null

    const session = await getSession(sessionToken)
    if (!session) return null

    const user = await getUserById(session.userId)
    if (!user) return null

    const { passwordHash: _, salt: __, ...safeUser } = user
    return safeUser
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}
