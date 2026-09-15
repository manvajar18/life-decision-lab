"use client"

import { useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  CloudCheck,
  Compass,
  Database,
  Eye,
  EyeOff,
  FolderSync,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Mail,
  RefreshCw,
  Rocket,
  Route,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { calculateScores, formatLakh, paths, type Answers, type Assumptions, type PathId } from "@/lib/decision-model"

export interface AuthUser {
  id: string
  name: string
  email: string
}

interface AuthViewProps {
  user?: AuthUser | null
  initialMode?: "login" | "signup"
  onAuthSuccess: (user: AuthUser) => void
  onLogout?: () => void
  onForceSync?: () => Promise<void>
  onReloadData?: () => Promise<void>
  onCancel?: () => void
  answers?: Answers
  step?: number
  complete?: boolean
  selectedPath?: PathId
  assumptions?: Assumptions
  checked?: Record<string, boolean>
  lastSavedAt?: Date | null
  syncStatus?: "idle" | "saving" | "saved" | "error"
}

export function AuthView({
  user,
  initialMode = "login",
  onAuthSuccess,
  onLogout,
  onForceSync,
  onReloadData,
  onCancel,
  answers = {},
  selectedPath = "studies",
  assumptions,
  checked = {},
  lastSavedAt,
  syncStatus = "idle",
}: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [syncingManual, setSyncingManual] = useState(false)
  const [reloadingManual, setReloadingManual] = useState(false)

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<1 | 2>(1)
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)

  function maskEmail(val: string): string {
    if (!val || !val.includes("@")) return val
    const [userPart, domain] = val.split("@")
    if (userPart.length <= 3) return `${userPart[0]}***@${domain}`
    return `${userPart.slice(0, 2)}***${userPart.slice(-2)}@${domain}`
  }

  function fillDemo() {
    setMode("login")
    setEmail("demo@lifedecisionlab.com")
    setPassword("demo123456")
    setError(null)
  }

  async function handleSendResetCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError("Please enter your account email address.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Could not find an account with this email.")
        setLoading(false)
        return
      }

      setResetCode("")
      setForgotStep(2)
      setSuccess(`A 6-digit security code was sent to your email (${maskEmail(email)}). Please check your inbox.`)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!resetCode.trim()) {
      setError("Please enter the 6-digit verification code.")
      return
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: resetCode.trim(),
          newPassword,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to reset password.")
        setLoading(false)
        return
      }

      setSuccess("Password updated successfully! Please sign in with your new password.")
      setPassword(newPassword)
      setMode("login")
      setForgotStep(1)
      setResetCode("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleManualSync() {
    if (!onForceSync) return
    setSyncingManual(true)
    try {
      await onForceSync()
      setSuccess("All progress saved directly to backend database!")
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Failed to sync to database.")
    } finally {
      setSyncingManual(false)
    }
  }

  async function handleManualReload() {
    if (!onReloadData) return
    setReloadingManual(true)
    try {
      await onReloadData()
      setSuccess("Data reloaded freshly from backend database!")
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Failed to reload data from database.")
    } finally {
      setReloadingManual(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter your full name.")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.")
        return
      }
    }

    if (!email.trim() || !password) {
      setError("Please fill in all required fields.")
      return
    }

    setLoading(true)

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login"
      const payload =
        mode === "signup"
          ? { name: name.trim(), email: email.trim(), password }
          : { email: email.trim(), password }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please try again.")
        setLoading(false)
        return
      }

      setSuccess(mode === "signup" ? "Account created! Logging you in..." : "Welcome back! Redirecting...")
      setTimeout(() => {
        onAuthSuccess(data.user)
      }, 500)
    } catch {
      setError("A network error occurred. Please check your connection.")
      setLoading(false)
    }
  }

  // --- LOGGED IN USER DASHBOARD ---
  if (user) {
    const answeredCount = Object.keys(answers).length
    const scores = answeredCount === 8 ? calculateScores(answers) : null
    const currentPath = paths.find((p) => p.id === selectedPath)!
    const roadmapCompleted = currentPath.roadmap.reduce(
      (count, step, index) =>
        count + step.tasks.filter((_, task) => checked[`${selectedPath}-${index}-${task}`]).length,
      0
    )

    return (
      <div className="page-enter mx-auto flex max-w-4xl flex-col gap-6 py-4">
        <div className="page-heading mb-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow text-chart-2">
              <span className="size-2 rounded-full bg-chart-2 animate-pulse" />
              LIFETIME CLOUD DATA STORE ACTIVE
            </p>
            <Badge variant="outline" className="border-chart-2/40 text-chart-2 text-[10px]">
              Persistent 365-Day Session
            </Badge>
          </div>
          <h1 className="mt-2">Welcome back, {user.name}!</h1>
          <p>
            Your account is connected to the live backend database. Every assessment answer, roadmap
            checklist, and growth simulation model is saved permanently in real time.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 rounded-lg border border-chart-2/40 bg-chart-2/10 p-3 text-xs text-chart-2">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Live Stored Data Summary Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Assessment Card */}
          <Card className="[--card-spacing:--spacing(5)] border-primary/20 bg-primary/5">
            <CardHeader className="gap-2">
              <div className="flex items-center justify-between">
                <Compass className="size-4 text-primary" />
                <Badge variant="secondary" className="text-[10px]">
                  {answeredCount === 8 ? "Completed" : `${answeredCount}/8 Answered`}
                </Badge>
              </div>
              <CardTitle className="text-sm">Self Assessment</CardTitle>
              <CardDescription className="text-xs">
                {answeredCount === 8
                  ? `Strongest: ${currentPath.name}`
                  : `${8 - answeredCount} questions remaining`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={(answeredCount / 8) * 100} className="h-1.5" />
              {scores && (
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Studies: {scores.studies}</span>
                  <span>Corporate: {scores.corporate}</span>
                  <span>Startup: {scores.startup}</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <a href="#assessment" className="text-xs text-primary hover:underline flex items-center gap-1">
                Continue assessment <ArrowRight className="size-3" />
              </a>
            </CardFooter>
          </Card>

          {/* Roadmap Card */}
          <Card className="[--card-spacing:--spacing(5)] border-chart-2/20 bg-chart-2/5">
            <CardHeader className="gap-2">
              <div className="flex items-center justify-between">
                <Route className="size-4 text-chart-2" />
                <Badge variant="secondary" className="text-[10px]">
                  {roadmapCompleted}/12 Done
                </Badge>
              </div>
              <CardTitle className="text-sm">90-Day Roadmap</CardTitle>
              <CardDescription className="text-xs">
                Focus: {currentPath.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={(roadmapCompleted / 12) * 100} className="h-1.5" />
              <p className="mt-3 text-[11px] text-muted-foreground">
                All checkbox states are synced to database.
              </p>
            </CardContent>
            <CardFooter>
              <a href="#roadmap" className="text-xs text-chart-2 hover:underline flex items-center gap-1">
                Open my checklist <ArrowRight className="size-3" />
              </a>
            </CardFooter>
          </Card>

          {/* Growth Simulator Card */}
          <Card className="[--card-spacing:--spacing(5)] border-chart-3/20 bg-chart-3/5 sm:col-span-2 lg:col-span-1">
            <CardHeader className="gap-2">
              <div className="flex items-center justify-between">
                <Rocket className="size-4 text-chart-3" />
                <Badge variant="secondary" className="text-[10px]">
                  Custom
                </Badge>
              </div>
              <CardTitle className="text-sm">Financial Assumptions</CardTitle>
              <CardDescription className="text-xs">
                {assumptions ? `Base: ₹${assumptions.salary}L · ${assumptions.growth}% growth` : "Default model"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-[11px] text-muted-foreground flex flex-col gap-1">
                <span>Tuition: {assumptions ? formatLakh(assumptions.tuition) : "₹8L"}</span>
                <span>Startup: {assumptions ? formatLakh(assumptions.investment) : "₹5L"}</span>
              </div>
            </CardContent>
            <CardFooter>
              <a href="#simulator" className="text-xs text-chart-3 hover:underline flex items-center gap-1">
                Tweak assumptions <ArrowRight className="size-3" />
              </a>
            </CardFooter>
          </Card>
        </div>

        {/* Account Details & Storage Actions */}
        <Card className="[--card-spacing:--spacing(6)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Account & Database Sync Settings</CardTitle>
                <CardDescription className="text-xs">
                  Connected user profile and persistence status.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-chart-2" />
                <span className="text-xs font-medium text-chart-2">Database Connected</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-border bg-muted/20 p-4 text-xs">
              <div>
                <span className="text-muted-foreground">User Name:</span>
                <p className="font-medium text-foreground mt-0.5">{user.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email Address:</span>
                <p className="font-medium text-foreground mt-0.5">{user.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Storage Engine:</span>
                <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <Database className="size-3 text-primary" /> data/db.json (Atomic File DB)
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Cloud Sync:</span>
                <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <Clock className="size-3 text-muted-foreground" />
                  {lastSavedAt ? lastSavedAt.toLocaleTimeString() : "Just now"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={syncingManual}
                className="gap-2 text-xs"
              >
                <FolderSync className={`size-3.5 ${syncingManual ? "animate-spin" : ""}`} />
                {syncingManual ? "Saving..." : "Force Sync Now"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleManualReload}
                disabled={reloadingManual}
                className="gap-2 text-xs"
              >
                <RefreshCw className={`size-3.5 ${reloadingManual ? "animate-spin" : ""}`} />
                {reloadingManual ? "Reloading..." : "Reload from Database"}
              </Button>

              <a href="#reports" className="text-xs text-primary hover:underline ml-auto flex items-center gap-1">
                View & export full report <ArrowRight className="size-3" />
              </a>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-[11px] text-muted-foreground">
              Signed in as <strong className="text-foreground">{user.email}</strong>
            </p>
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-xs text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-3.5 mr-1.5" /> Sign Out
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  // --- SIGN IN & SIGN UP FORM ---
  return (
    <div className="page-enter mx-auto flex max-w-4xl flex-col gap-6 py-4">
      <div className="page-heading mb-0 text-center sm:text-left">
        <p className="eyebrow text-primary">
          <Sparkles className="size-4" /> LIFETIME PERSISTENT DATA STORAGE
        </p>
        <h1>
          {mode === "login"
            ? "Sign in for lifetime access."
            : mode === "signup"
            ? "Create your permanent account."
            : "Reset your account password."}
        </h1>
        <p>
          {mode === "login"
            ? "Sign in to access your saved assessments, customized growth models, and personalized roadmap checklist from any device."
            : mode === "signup"
            ? "Registering instantly attaches your answers, chosen path, and checklist to your lifetime account in our secure database."
            : "Enter your registered email address to receive a secure 6-digit verification code and reset your password."}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card className="[--card-spacing:--spacing(6)]">
          <CardHeader className="gap-2">
            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login")
                    setError(null)
                    setSuccess(null)
                  }}
                  className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                    mode === "login"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LogIn className="size-3.5" /> Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup")
                    setError(null)
                    setSuccess(null)
                  }}
                  className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                    mode === "signup"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="size-3.5" /> Create Account
                </button>
                {mode === "forgot" && (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-xs"
                  >
                    <KeyRound className="size-3.5" /> Reset Password
                  </button>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] text-chart-2 border-chart-2/30">
                Lifetime Storage
              </Badge>
            </div>
            <CardTitle className="mt-2 text-lg">
              {mode === "login"
                ? "Sign in to your account"
                : mode === "signup"
                ? "Create your free account"
                : forgotStep === 1
                ? "Request Password Reset Code"
                : "Set New Password"}
            </CardTitle>
            <CardDescription className="text-xs">
              {mode === "login"
                ? "Enter your email and password below."
                : mode === "signup"
                ? "Enter your details to create your secure profile. Any guest work is preserved!"
                : forgotStep === 1
                ? "Enter the email you registered with to receive your 6-digit code."
                : "Enter the 6-digit code and your new password to restore access."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-chart-2/40 bg-chart-2/10 p-3 text-xs text-chart-2">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* FORGOT PASSWORD: STEP 1 */}
            {mode === "forgot" && forgotStep === 1 && (
              <form onSubmit={handleSendResetCode} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="auth-forgot-email" className="text-xs">
                    Registered Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="auth-forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-xs"
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    A 6-digit security code will be generated and saved to your account in the database.
                  </p>
                </div>

                <Button type="submit" size="lg" className="mt-2 w-full gap-2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Generating Code...
                    </span>
                  ) : (
                    <>
                      Send 6-Digit Reset Code
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* FORGOT PASSWORD: STEP 2 */}
            {mode === "forgot" && forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-xs text-foreground">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Mail className="size-4" />
                    <span>Check Your Email Inbox</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    We sent a private 6-digit security code to{" "}
                    <strong className="font-semibold text-foreground">{maskEmail(email)}</strong>.
                    Please check your inbox (or spam/junk folder), and enter the code below to reset your password.
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3 text-muted-foreground" /> Code is valid for 15 minutes.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auth-reset-code" className="text-xs">
                      6-Digit Security Code
                    </Label>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Resend / Change Email
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="auth-reset-code"
                      type="text"
                      placeholder="e.g. 123456"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="pl-9 font-mono tracking-widest text-xs"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auth-new-password" className="text-xs">
                      New Password
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Min. 6 characters</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="auth-new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-9 pr-9 text-xs"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="auth-confirm-new-password" className="text-xs">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="auth-confirm-new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="pl-9 text-xs"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="mt-2 w-full gap-2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Updating Password...
                    </span>
                  ) : (
                    <>
                      Save New Password & Sign In
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* LOGIN & SIGNUP FORMS */}
            {mode !== "forgot" && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-name" className="text-xs">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="auth-name"
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9 text-xs"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="auth-email" className="text-xs">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="auth-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-xs"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auth-password" className="text-xs">
                      Password
                    </Label>
                    {mode === "login" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot")
                          setForgotStep(1)
                          setError(null)
                          setSuccess(null)
                        }}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Min. 6 characters</span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 text-xs"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-confirm-password" className="text-xs">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="auth-confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 text-xs"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" size="lg" className="mt-2 w-full gap-2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      {mode === "signup" ? "Creating account..." : "Signing in..."}
                    </span>
                  ) : (
                    <>
                      {mode === "signup" ? "Create Free Account" : "Sign In to Workspace"}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {mode !== "forgot" && (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Or Quick Demo</span>
                  <Separator className="flex-1" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillDemo}
                  className="mt-3 w-full border-dashed text-xs text-primary hover:bg-primary/5"
                >
                  Fill Demo Credentials (1-Click)
                </Button>
              </>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-[11px] text-muted-foreground">
              {mode === "login"
                ? "Don't have an account yet?"
                : mode === "signup"
                ? "Already have an account?"
                : "Remembered your password?"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login")
                setError(null)
                setSuccess(null)
              }}
              className="text-xs text-primary"
            >
              {mode === "login" ? "Create one here" : mode === "signup" ? "Sign in here" : "Back to Sign In"}
            </Button>
          </CardFooter>
        </Card>

        {/* Benefits Sidebar */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="mt-3 text-sm font-medium">Real-Time Lifetime Storage</h3>
            <ul className="mt-3 flex flex-col gap-3 text-xs leading-5 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-chart-2 mt-0.5" />
                <span><strong>Live auto-save:</strong> Every answer and checkbox is immediately stored in the database.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-chart-2 mt-0.5" />
                <span><strong>Zero progress lost:</strong> If you start as a guest, your answers carry over directly when you sign in.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-chart-2 mt-0.5" />
                <span><strong>Access anywhere:</strong> Sign in on your phone, tablet, or laptop and pick up right where you left off.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-dashed border-border p-4 text-[11px] leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Encrypted database</p>
            <p className="mt-1">
              Data is stored locally and securely in <code className="text-primary font-mono">data/db.json</code>. Passwords use PBKDF2 cryptography with 100,000 iterations.
            </p>
          </div>

          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="mt-auto text-xs">
              Continue exploring as guest
            </Button>
          )}
        </aside>
      </div>
    </div>
  )
}
