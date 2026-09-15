import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import type { Answers, Assumptions, PathId } from "@/lib/decision-model"

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  salt: string
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

const DATA_DIR = path.join(process.cwd(), "data")
const DB_FILE = path.join(DATA_DIR, "db.json")

let dbCache: DatabaseSchema | null = null
let writePromise: Promise<void> = Promise.resolve()

const defaultDatabase: DatabaseSchema = {
  users: [],
  sessions: [],
  userData: {},
}

/**
 * Ensures data directory and db.json exist, then loads database into memory.
 */
async function loadDatabase(): Promise<DatabaseSchema> {
  if (dbCache) return dbCache

  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const fileContent = await fs.readFile(DB_FILE, "utf-8")
    dbCache = JSON.parse(fileContent) as DatabaseSchema
  } catch {
    // If file does not exist or corrupted, initialize with default
    dbCache = { ...defaultDatabase }
    await seedDemoUser(dbCache)
    await persistDatabase(dbCache)
  }

  // Seed demo user if no users exist
  if (dbCache.users.length === 0) {
    await seedDemoUser(dbCache)
    await persistDatabase(dbCache)
  }

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
 * Atomically writes database to disk using a temporary file to avoid corruption.
 */
async function persistDatabase(data: DatabaseSchema): Promise<void> {
  writePromise = writePromise.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const tmpFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
    await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), "utf-8")
    await fs.rename(tmpFile, DB_FILE)
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
  return {
    totalUsers: db.users.length,
    totalSessions: db.sessions.length,
    totalUserDataEntries: Object.keys(db.userData).length,
    filePath: DB_FILE,
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
