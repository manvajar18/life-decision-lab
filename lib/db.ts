import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import os from "node:os"
import initialSeedData from "@/data/db.json"
import type { Answers, Assumptions, PathId } from "@/lib/decision-model"

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  salt: string
  resetCode?: string
  resetExpiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  token: string
  userId: string
  expiresAt: string
  createdAt: string
}

export interface UserData {
  userId: string
  answers: Answers
  step: number
  complete: boolean
  selectedPath: PathId
  assumptions: Assumptions
  checked: Record<string, boolean>
  updatedAt: string
}

interface DatabaseSchema {
  users: User[]
  sessions: Session[]
  userData: Record<string, UserData>
  settings?: {
    adminPasskey?: string
    updatedAt?: string
  }
}

const BUNDLED_DATA_DIR = path.join(process.cwd(), "data")
const BUNDLED_DB_FILE = path.join(BUNDLED_DATA_DIR, "db.json")

// On Vercel / serverless lambda, the filesystem is read-only except /tmp
const TMP_DATA_DIR = path.join(os.tmpdir(), "ldl_data")
const TMP_DB_FILE = path.join(TMP_DATA_DIR, "db.json")

const isServerlessEnv = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
)

let isLocalDirectoryWritable: boolean | null = isServerlessEnv ? false : null

async function getWritableDbPath(): Promise<{ dataDir: string; dbFile: string }> {
  if (isServerlessEnv || isLocalDirectoryWritable === false) {
    return { dataDir: TMP_DATA_DIR, dbFile: TMP_DB_FILE }
  }
  if (isLocalDirectoryWritable === true) {
    return { dataDir: BUNDLED_DATA_DIR, dbFile: BUNDLED_DB_FILE }
  }

  // Probe whether local directory is writable (Windows / local dev)
  try {
    await fs.mkdir(BUNDLED_DATA_DIR, { recursive: true })
    const probeFile = path.join(BUNDLED_DATA_DIR, `.probe_${Date.now()}`)
    await fs.writeFile(probeFile, "ok", "utf-8")
    await fs.unlink(probeFile)
    isLocalDirectoryWritable = true
    return { dataDir: BUNDLED_DATA_DIR, dbFile: BUNDLED_DB_FILE }
  } catch {
    isLocalDirectoryWritable = false
    try {
      await fs.mkdir(TMP_DATA_DIR, { recursive: true })
    } catch {
      // ignore
    }
    return { dataDir: TMP_DATA_DIR, dbFile: TMP_DB_FILE }
  }
}

let dbCache: DatabaseSchema | null = null
let writePromise: Promise<void> = Promise.resolve()

const defaultDatabase: DatabaseSchema = {
  users: [],
  sessions: [],
  userData: {},
}

/**
 * Loads database into memory safely across both local and Vercel serverless environments.
 */
async function loadDatabase(): Promise<DatabaseSchema> {
  if (dbCache) return dbCache

  // 1. Check if temporary writable DB has newer state
  try {
    const tmpContent = await fs.readFile(TMP_DB_FILE, "utf-8")
    const parsed = JSON.parse(tmpContent) as DatabaseSchema
    if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
      dbCache = parsed
      return dbCache
    }
  } catch {
    // TMP file doesn't exist yet, continue to bundled
  }

  // 2. Read from static bundled import (bundled by Turbopack directly into Lambda, 100% reliable)
  if (initialSeedData && Array.isArray(initialSeedData.users) && initialSeedData.users.length > 0) {
    dbCache = JSON.parse(JSON.stringify(initialSeedData)) as DatabaseSchema
    return dbCache
  }

  // 3. Fallback: try reading bundled file from disk
  try {
    const bundledContent = await fs.readFile(BUNDLED_DB_FILE, "utf-8")
    const parsed = JSON.parse(bundledContent) as DatabaseSchema
    if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
      dbCache = parsed
      return dbCache
    }
  } catch {
    // ignore
  }

  // 4. Fallback to default schema if no file exists
  dbCache = { ...defaultDatabase }
  await seedDemoUser(dbCache)

  return dbCache
}

/**
 * Seed a demo user for instant testing without needing manual signup.
 */
async function seedDemoUser(db: DatabaseSchema) {
  const salt = crypto.randomBytes(16).toString("hex")
  const passwordHash = crypto.pbkdf2Sync("demo123456", salt, 100000, 64, "sha512").toString("hex")
  const demoUserId = "usr_demo_life_lab"

  const demoUser: User = {
    id: demoUserId,
    name: "Alex Morgan",
    email: "demo@lifedecisionlab.com",
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  db.users.push(demoUser)
  db.userData[demoUserId] = {
    userId: demoUserId,
    answers: { 0: 0, 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
    step: 7,
    complete: true,
    selectedPath: "studies",
    assumptions: {
      salary: 7.5,
      growth: 12,
      tuition: 9,
      investment: 5,
      startupGrowth: 50,
    },
    checked: {
      "studies-0-0": true,
      "studies-0-1": true,
    },
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Resilient atomic write that falls back to /tmp on serverless environments and never throws unhandled rejections.
 */
async function persistDatabase(data: DatabaseSchema): Promise<void> {
  // Always update in-memory cache synchronously
  dbCache = data

  writePromise = writePromise
    .catch(() => {}) // Never leave the queue poisoned
    .then(async () => {
      const { dataDir, dbFile } = await getWritableDbPath()
      try {
        await fs.mkdir(dataDir, { recursive: true })
        const tmpFile = `${dbFile}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
        await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), "utf-8")
        await fs.rename(tmpFile, dbFile)
      } catch (primaryErr) {
        console.warn("[Database] Primary write failed, trying /tmp fallback:", primaryErr)
        try {
          await fs.mkdir(TMP_DATA_DIR, { recursive: true })
          const fallbackTmp = `${TMP_DB_FILE}.${Date.now()}.tmp`
          await fs.writeFile(fallbackTmp, JSON.stringify(data, null, 2), "utf-8")
          await fs.rename(fallbackTmp, TMP_DB_FILE)
        } catch (fallbackErr) {
          console.error("[Database] All persistence writes failed. Memory state preserved:", fallbackErr)
        }
      }
    })

  return writePromise
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await loadDatabase()
  return db.users.find((user) => user.id === id) ?? null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await loadDatabase()
  const normalized = email.trim().toLowerCase()
  return db.users.find((user) => user.email.toLowerCase() === normalized) ?? null
}

export async function createUser(data: {
  name: string
  email: string
  passwordHash: string
  salt: string
}): Promise<User> {
  const db = await loadDatabase()
  const newUser: User = {
    id: `usr_${crypto.randomUUID()}`,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    passwordHash: data.passwordHash,
    salt: data.salt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.users.push(newUser)
  await persistDatabase(db)
  return newUser
}

export async function createSession(userId: string, durationDays = 365): Promise<Session> {
  const db = await loadDatabase()
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
  const newSession: Session = {
    id: `sess_${crypto.randomUUID()}`,
    token: crypto.randomBytes(32).toString("hex"),
    userId,
    expiresAt,
    createdAt: new Date().toISOString(),
  }
  db.sessions.push(newSession)
  await persistDatabase(db)
  return newSession
}

export async function getSession(token: string): Promise<Session | null> {
  const db = await loadDatabase()
  const session = db.sessions.find((s) => s.token === token)
  if (!session) return null

  // Check expiration
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await deleteSession(token)
    return null
  }

  return session
}

export async function deleteSession(token: string): Promise<boolean> {
  const db = await loadDatabase()
  const initialLength = db.sessions.length
  db.sessions = db.sessions.filter((s) => s.token !== token)
  if (db.sessions.length !== initialLength) {
    await persistDatabase(db)
    return true
  }
  return false
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const db = await loadDatabase()
  db.sessions = db.sessions.filter((s) => s.userId !== userId)
  await persistDatabase(db)
}

export async function getUserData(userId: string): Promise<UserData | null> {
  const db = await loadDatabase()
  return db.userData[userId] ?? null
}

export async function saveUserData(
  userId: string,
  data: Partial<Omit<UserData, "userId" | "updatedAt">>
): Promise<UserData> {
  const db = await loadDatabase()
  const existing = db.userData[userId] || {
    userId,
    answers: {},
    step: 0,
    complete: false,
    selectedPath: "studies",
    assumptions: {
      salary: 6,
      growth: 10,
      tuition: 8,
      investment: 5,
      startupGrowth: 50,
    },
    checked: {},
    updatedAt: new Date().toISOString(),
  }

  const updated: UserData = {
    ...existing,
    ...data,
    userId,
    updatedAt: new Date().toISOString(),
  }

  db.userData[userId] = updated
  await persistDatabase(db)
  return updated
}

export async function getAllUsersWithProgress() {
  const db = await loadDatabase()
  return db.users.map((u) => {
    const { passwordHash: _, salt: __, ...safeUser } = u
    const data = db.userData[u.id] ?? null
    return {
      ...safeUser,
      userData: data,
    }
  })
}

export async function deleteUser(userId: string): Promise<boolean> {
  const db = await loadDatabase()
  const initialUserCount = db.users.length
  db.users = db.users.filter((u) => u.id !== userId)
  db.sessions = db.sessions.filter((s) => s.userId !== userId)
  delete db.userData[userId]

  if (db.users.length !== initialUserCount) {
    await persistDatabase(db)
    return true
  }
  return false
}

export async function getDatabaseInfo() {
  const db = await loadDatabase()
  const { dbFile } = await getWritableDbPath()
  return {
    totalUsers: db.users.length,
    totalSessions: db.sessions.length,
    totalUserDataEntries: Object.keys(db.userData).length,
    filePath: dbFile,
  }
}

export async function getAdminPasskey(): Promise<string> {
  const db = await loadDatabase()
  return db.settings?.adminPasskey || process.env.ADMIN_PASSKEY || "admin123"
}

export async function setAdminPasskey(newPasskey: string): Promise<void> {
  const db = await loadDatabase()
  db.settings = {
    ...db.settings,
    adminPasskey: newPasskey.trim(),
    updatedAt: new Date().toISOString(),
  }
  await persistDatabase(db)
}

/**
 * Generate a 6-digit security code valid for 15 minutes for password recovery.
 */
export async function createPasswordResetCode(email: string): Promise<{ code: string; email: string } | null> {
  const db = await loadDatabase()
  const normalized = email.trim().toLowerCase()
  const user = db.users.find((u) => u.email.trim().toLowerCase() === normalized)
  if (!user) {
    console.warn(`[AUTH] createPasswordResetCode: User '${normalized}' not found among ${db.users.length} users:`, db.users.map(u => u.email))
    return null
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes

  user.resetCode = code
  user.resetExpiresAt = expiresAt
  user.updatedAt = new Date().toISOString()

  try {
    await persistDatabase(db)
  } catch (err) {
    console.warn("[AUTH] Failed to write reset code to disk, code kept in memory:", err)
  }

  return { code, email: user.email }
}

/**
 * Validate the reset code and update the user's password hash and salt.
 */
export async function resetPasswordWithCode(
  email: string,
  code: string,
  passwordHash: string,
  salt: string
): Promise<{ success: boolean; error?: string }> {
  const db = await loadDatabase()
  const normalized = email.trim().toLowerCase()
  const user = db.users.find((u) => u.email.toLowerCase() === normalized)

  if (!user) {
    return { success: false, error: "No account found with this email address." }
  }

  if (!user.resetCode || user.resetCode !== code.trim()) {
    return { success: false, error: "Invalid verification code. Please check and try again." }
  }

  if (!user.resetExpiresAt || new Date(user.resetExpiresAt).getTime() < Date.now()) {
    return { success: false, error: "Verification code has expired. Please request a new code." }
  }

  // Update password and clear reset code
  user.passwordHash = passwordHash
  user.salt = salt
  delete user.resetCode
  delete user.resetExpiresAt
  user.updatedAt = new Date().toISOString()

  // Invalidate any existing sessions for security
  db.sessions = db.sessions.filter((s) => s.userId !== user.id)

  await persistDatabase(db)
  return { success: true }
}
