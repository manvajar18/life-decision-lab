"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CloudCheck,
  CloudUpload,
  Compass,
  Database,
  FileText,
  GitCompareArrows,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Route,
  Shield,
  Sparkles,
  UserCheck,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Overview } from "@/components/lab/overview"
import { Assessment } from "@/components/lab/assessment"
import { Compare } from "@/components/lab/compare"
import { Simulator } from "@/components/lab/simulator"
import { Roadmap } from "@/components/lab/roadmap"
import { Reports } from "@/components/lab/reports"
import { AuthView, type AuthUser } from "@/components/lab/auth-view"
import { AdminView } from "@/components/lab/admin-view"
import {
  calculateScores,
  defaultAssumptions,
  modelExplanation,
  questions,
  type Answers,
  type PathId,
  type View,
} from "@/lib/decision-model"

const LOCAL_STORAGE_KEY = "ldl_guest_state_v1"

const navigation = [
  { id: "overview" as const, label: "Overview", icon: LayoutGrid },
  { id: "assessment" as const, label: "My assessment", icon: ClipboardList },
  { id: "compare" as const, label: "Compare paths", icon: GitCompareArrows },
  { id: "simulator" as const, label: "Growth simulator", icon: ChartNoAxesCombined },
  { id: "roadmap" as const, label: "My roadmap", icon: Route },
  { id: "reports" as const, label: "Reports", icon: FileText },
  { id: "auth" as const, label: "Account & Sync", icon: UserRound },
]

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback)
  return () => window.removeEventListener("hashchange", callback)
}

function getView(): View {
  const hash = window.location.hash.slice(1)
  if (hash === "login" || hash === "signup") return "auth"
  if (hash === "admin") return "admin"
  return navigation.find((item) => item.id === hash)?.id ?? "overview"
}

function Brand() {
  return (
    <a className="brand" href="#overview" aria-label="Life Decision Lab home">
      <span className="brand-mark">
        <Compass className="size-6" strokeWidth={1.4} />
      </span>
      <div>
        <p className="brand-name">
          life decision <span>lab</span>
        </p>
        <p className="brand-tagline">A CLEARER WAY FORWARD</p>
      </div>
    </a>
  )
}

function WorkspaceNav({
  view,
  onNavigate,
  onHelp,
  user,
}: {
  view: View
  onNavigate?: () => void
  onHelp: () => void
  user: AuthUser | null
}) {
  return (
    <>
      <p className="nav-label">YOUR WORKSPACE</p>
      <nav aria-label="Main navigation" className="sidebar-nav">
        {navigation.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="nav-item"
            data-active={view === item.id}
            aria-current={view === item.id ? "page" : undefined}
            onClick={onNavigate}
          >
            <item.icon />
            <span>{item.id === "auth" && user ? "My Account" : item.label}</span>
          </a>
        ))}
      </nav>
      <div className="sidebar-perspective">
        <p className="nav-label">A LITTLE PERSPECTIVE</p>
        <button className="nav-item w-full" onClick={onHelp}>
          <BookOpen />
          <span>How it works</span>
          <ArrowUpRight className="ml-auto" />
        </button>
        <a
          href="#admin"
          className="nav-item w-full"
          data-active={view === "admin"}
          aria-current={view === "admin" ? "page" : undefined}
          onClick={onNavigate}
        >
          <Shield />
          <span>Admin Panel</span>
        </a>
      </div>
    </>
  )
}

export function Workspace() {
  const [mounted, setMounted] = useState(false)
  const view = useSyncExternalStore(subscribeToHash, getView, () => "overview" as View)
  const activeView = mounted ? view : ("overview" as View)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [answers, setAnswers] = useState<Answers>({})
  const [step, setStep] = useState(0)
  const [complete, setComplete] = useState(false)
  const [assumptions, setAssumptions] = useState({ ...defaultAssumptions })
  const [selectedPath, setSelectedPath] = useState<PathId>("studies")
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [helpOpen, setHelpOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Authentication & Live Storage state
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const mainRef = useRef<HTMLElement>(null)
  const previousView = useRef(activeView)
  const current =
    activeView === "admin"
      ? { id: "admin" as const, label: "Admin Panel", icon: Shield }
      : (navigation.find((item) => item.id === activeView) ?? navigation[0])

  // Direct helper to save state to backend database
  const saveStateToDatabase = useCallback(
    async (overrideState?: {
      answers?: Answers
      step?: number
      complete?: boolean
      selectedPath?: PathId
      assumptions?: typeof defaultAssumptions
      checked?: Record<string, boolean>
    }) => {
      const payload = {
        answers: overrideState?.answers ?? answers,
        step: overrideState?.step ?? step,
        complete: overrideState?.complete ?? complete,
        selectedPath: overrideState?.selectedPath ?? selectedPath,
        assumptions: overrideState?.assumptions ?? assumptions,
        checked: overrideState?.checked ?? checked,
      }

      setSyncStatus("saving")
      const res = await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSyncStatus("saved")
        setLastSavedAt(new Date())
        setTimeout(() => setSyncStatus("idle"), 2500)
      } else {
        setSyncStatus("error")
        throw new Error("Failed to save")
      }
    },
    [answers, step, complete, selectedPath, assumptions, checked]
  )

  // Direct helper to reload state from backend database
  const loadStateFromDatabase = useCallback(async () => {
    const res = await fetch("/api/user/data")
    if (res.ok) {
      const result = await res.json()
      if (result.data) {
        if (result.data.answers) setAnswers(result.data.answers)
        if (typeof result.data.step === "number") setStep(result.data.step)
        if (typeof result.data.complete === "boolean") setComplete(result.data.complete)
        if (result.data.selectedPath) setSelectedPath(result.data.selectedPath)
        if (result.data.assumptions) setAssumptions(result.data.assumptions)
        if (result.data.checked) setChecked(result.data.checked)
        setLastSavedAt(new Date())
      }
    }
  }, [])

  // 1. Initial Mount: Verify Auth Session & Restore Saved Data
  useEffect(() => {
    async function initializeWorkspace() {
      try {
        const authRes = await fetch("/api/auth/me")
        if (authRes.ok) {
          const authData = await authRes.json()
          if (authData.user) {
            setUser(authData.user)

            // User is authenticated -> load their lifetime database progress
            const dbRes = await fetch("/api/user/data")
            if (dbRes.ok) {
              const dbData = await dbRes.json()
              if (dbData.data) {
                if (dbData.data.answers) setAnswers(dbData.data.answers)
                if (typeof dbData.data.step === "number") setStep(dbData.data.step)
                if (typeof dbData.data.complete === "boolean") setComplete(dbData.data.complete)
                if (dbData.data.selectedPath) setSelectedPath(dbData.data.selectedPath)
                if (dbData.data.assumptions) setAssumptions(dbData.data.assumptions)
                if (dbData.data.checked) setChecked(dbData.data.checked)
                setLastSavedAt(new Date(dbData.data.updatedAt || Date.now()))
              }
            }
            setIsDataLoaded(true)
            return
          }
        }

        // User is guest -> restore from localStorage cache if available
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
          if (cached) {
            try {
              const parsed = JSON.parse(cached)
              if (parsed.answers) setAnswers(parsed.answers)
              if (typeof parsed.step === "number") setStep(parsed.step)
              if (typeof parsed.complete === "boolean") setComplete(parsed.complete)
              if (parsed.selectedPath) setSelectedPath(parsed.selectedPath)
              if (parsed.assumptions) setAssumptions(parsed.assumptions)
              if (parsed.checked) setChecked(parsed.checked)
            } catch (err) {
              console.warn("Failed to parse cached guest state:", err)
            }
          }
        }
      } catch (err) {
        console.error("Workspace initialization error:", err)
      } finally {
        setIsDataLoaded(true)
      }
    }

    initializeWorkspace()
  }, [])

  // 2. Real-time Live Sync: Persist to backend database (when user) or localStorage (when guest)
  useEffect(() => {
    if (!isDataLoaded) return

    const currentState = { answers, step, complete, selectedPath, assumptions, checked }

    // Always mirror to localStorage as offline safety buffer
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentState))
      } catch (e) {
        console.warn("localStorage write failed:", e)
      }
    }

    // If authenticated, sync live to backend database
    if (user) {
      setSyncStatus("saving")
      const timer = setTimeout(async () => {
        try {
          const res = await fetch("/api/user/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentState),
          })

          if (res.ok) {
            setSyncStatus("saved")
            setLastSavedAt(new Date())
            setTimeout(() => setSyncStatus("idle"), 2500)
          } else {
            setSyncStatus("error")
          }
        } catch {
          setSyncStatus("error")
        }
      }, 600)

      return () => clearTimeout(timer)
    }
  }, [user, isDataLoaded, answers, step, complete, selectedPath, assumptions, checked])

  // 3. Before Unload: Flush any pending changes to database immediately
  useEffect(() => {
    function handleBeforeUnload() {
      if (!user) return
      const payload = JSON.stringify({ answers, step, complete, selectedPath, assumptions, checked })
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" })
        navigator.sendBeacon("/api/user/data", blob)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [user, answers, step, complete, selectedPath, assumptions, checked])

  useEffect(() => {
    if (previousView.current !== activeView) {
      window.scrollTo({ top: 0, behavior: "instant" })
      mainRef.current?.focus({ preventScroll: true })
      previousView.current = activeView
    }
    document.title = `${current.label} — Life Decision Lab`
  }, [activeView, current.label])

  function choosePath(path: PathId) {
    setSelectedPath(path)
    window.location.hash = "roadmap"
  }

  // Handle Login or Sign-Up Success
  async function handleAuthSuccess(authenticatedUser: AuthUser) {
    setUser(authenticatedUser)

    // Check if guest has active work to preserve and migrate
    const hasActiveGuestWork = Object.keys(answers).length > 0 || Object.keys(checked).length > 0

    if (hasActiveGuestWork) {
      // Migrate guest work to the user's permanent database store
      try {
        await saveStateToDatabase()
      } catch (e) {
        console.error("Migration to database failed:", e)
      }
    } else {
      // Load user's existing database progress
      try {
        await loadStateFromDatabase()
      } catch (e) {
        console.error("Loading existing user data failed:", e)
      }
    }

    window.location.hash = "overview"
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      // Clear localStorage cache on logout to ensure clean guest session
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      }
      setAnswers({})
      setStep(0)
      setComplete(false)
      setChecked({})
      setAssumptions({ ...defaultAssumptions })
      window.location.hash = "overview"
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  return (
    <div className="workspace" suppressHydrationWarning>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:p-3 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">
        <div className="sidebar">
          <Brand />
          <WorkspaceNav view={activeView} onHelp={() => setHelpOpen(true)} user={user} />
          <div className="sidebar-bottom">
            <div className="sidebar-tip">
              <Sparkles className="size-4 text-primary" />
              <h3>Your future isn&apos;t a formula.</h3>
              <p>
                It&apos;s a collection of possibilities.
                <br />
                Let&apos;s explore yours.
              </p>
              <a href="#assessment">
                Start with yourself <ArrowRight className="size-3" />
              </a>
            </div>

            {user ? (
              <div className="guest-profile">
                <span className="guest-avatar border-primary/30 bg-primary/10 text-xs font-medium text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium">{user.name}</p>
                  <p className="truncate text-[9px] text-chart-2">Lifetime Database Active</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign out of account"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="guest-profile">
                <span className="guest-avatar">
                  <UserRound className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px]">Guest session</p>
                  <a href="#auth" className="mt-0.5 block text-[9px] text-primary hover:underline">
                    Sign in for lifetime storage
                  </a>
                </div>
                <a
                  href="#auth"
                  className="rounded-md p-1 text-primary transition-colors hover:bg-primary/10"
                  title="Sign In / Create Account"
                >
                  <LogIn className="size-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Body */}
      <div className="workspace-body">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </Button>
            <div className="breadcrumb">
              <Compass className="hidden size-3.5 sm:block" />
              <span className="hidden sm:inline">Your workspace</span>
              <ChevronRight className="hidden size-3 sm:block" />
              <span className="text-foreground">{current.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="topbar-status">
                  <span
                    className={`status-dot ${
                      syncStatus === "saving" ? "animate-ping bg-chart-3" : "bg-chart-2"
                    }`}
                  />
                  {syncStatus === "saving" ? (
                    <span className="flex items-center gap-1 text-[10px] text-chart-3">
                      <CloudUpload className="size-3 animate-bounce text-chart-3" /> Saving...
                    </span>
                  ) : syncStatus === "saved" ? (
                    <span className="flex items-center gap-1 text-[10px] text-chart-2">
                      <Check className="size-3" /> Live synced
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground desktop-status flex items-center gap-1">
                      <Database className="size-3 text-chart-2" /> Live Database Store
                    </span>
                  )}
                </p>

                <a
                  href="#auth"
                  className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted"
                >
                  <UserCheck className="size-3 text-chart-2" />
                  <span className="max-w-[110px] truncate">{user.name.split(" ")[0]}</span>
                </a>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-7 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Sign Out"
                >
                  <LogOut className="size-3 mr-1" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="topbar-status">
                  <span className="status-dot" />
                  Guest session
                  <span className="desktop-status">· Local cache only</span>
                </p>
                <a
                  href="#auth"
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <LogIn className="size-3" />
                  <span>Log In / Sign Up</span>
                </a>
              </div>
            )}

            <Separator orientation="vertical" className="h-4" />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Help and methodology"
              onClick={() => setHelpOpen(true)}
            >
              <CircleHelp />
            </Button>
          </div>
        </header>

        <main id="main-content" className="main-content" ref={mainRef} tabIndex={-1}>
          {activeView === "overview" && <Overview onHelp={() => setHelpOpen(true)} />}
          {activeView === "assessment" && (
            <Assessment
              answers={answers}
              setAnswer={(question, option) =>
                setAnswers((previous) => ({ ...previous, [question]: option }))
              }
              step={step}
              setStep={setStep}
              complete={complete}
              setComplete={setComplete}
              onHelp={() => setHelpOpen(true)}
            />
          )}
          {activeView === "compare" && (
            <Compare
              assumptions={assumptions}
              scores={complete ? calculateScores(answers) : null}
              onChoose={choosePath}
            />
          )}
          {activeView === "simulator" && (
            <Simulator assumptions={assumptions} setAssumptions={setAssumptions} />
          )}
          {activeView === "roadmap" && (
            <Roadmap
              selected={selectedPath}
              setSelected={setSelectedPath}
              checked={checked}
              setChecked={(key, value) => setChecked((previous) => ({ ...previous, [key]: value }))}
            />
          )}
          {activeView === "reports" && (
            <Reports
              answers={answers}
              complete={complete}
              assumptions={assumptions}
              selected={selectedPath}
              checked={checked}
            />
          )}
          {activeView === "auth" && (
            <AuthView
              user={user}
              answers={answers}
              selectedPath={selectedPath}
              assumptions={assumptions}
              checked={checked}
              lastSavedAt={lastSavedAt}
              syncStatus={syncStatus}
              onForceSync={saveStateToDatabase}
              onReloadData={loadStateFromDatabase}
              onAuthSuccess={handleAuthSuccess}
              onLogout={handleLogout}
              onCancel={() => {
                window.location.hash = "overview"
              }}
            />
          )}
          {activeView === "admin" && (
            <AdminView
              onBack={() => {
                window.location.hash = "overview"
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Drawer Menu */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Life Decision Lab</DialogTitle>
            <DialogDescription>Your clearer way forward.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <WorkspaceNav
              view={activeView}
              onNavigate={() => setMenuOpen(false)}
              onHelp={() => {
                setMenuOpen(false)
                setHelpOpen(true)
              }}
              user={user}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>A little clarity about the lab.</DialogTitle>
            <DialogDescription>A thinking companion—not a decision maker.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <section>
              <h2 className="mb-2 text-sm font-medium">1. Reflect, compare, take a step</h2>
              <p className="text-xs leading-6 text-muted-foreground">
                Start with eight questions about your preferences. Compare higher studies, corporate work, and
                entrepreneurship. Adjust the financial assumptions, then explore a practical 90-day roadmap.
                You can use every tool independently.
              </p>
            </section>
            <Separator />
            <section>
              <h2 className="mb-2 text-sm font-medium">2. Transparent scoring, no hidden intelligence</h2>
              <p className="text-xs leading-6 text-muted-foreground">
                Every answer adds 1–5 points to each path. Your total out of 40 is scaled to 100, with all
                questions equally weighted. Scores are independent and do not add up to 100. This rule-based
                exercise is not AI advice or a validated psychological test.
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-primary">See every scoring weight</summary>
                <div className="mt-4 flex flex-col gap-4">
                  {questions.map((question, index) => (
                    <div key={question.title}>
                      <h3 className="text-xs font-medium">
                        {index + 1}. {question.title}
                      </h3>
                      <ul className="mt-2 flex flex-col gap-2">
                        {question.options.map((option) => (
                          <li key={option.label} className="text-[11px] leading-5 text-muted-foreground">
                            {option.label}
                            <br />
                            <span className="text-primary">
                              Studies {option.points[0]} · Corporate {option.points[1]} · Startup{" "}
                              {option.points[2]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            </section>
            <Separator />
            <section>
              <h2 className="mb-2 text-sm font-medium">3. Scenarios, not promises</h2>
              <p className="text-xs leading-6 text-muted-foreground">{modelExplanation}</p>
            </section>
            <Separator />
            <section>
              <h2 className="mb-2 text-sm font-medium">4. Lifetime data store & privacy</h2>
              <p className="text-xs leading-6 text-muted-foreground">
                Any user who signs up or logs in receives lifetime persistent cloud storage in our backend database.
                Your answers, roadmap checklist progress, and customized simulation numbers are automatically saved
                in real time. You can return anytime on any device to continue your exploration.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
