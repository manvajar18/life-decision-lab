"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Database,
  Download,
  Eye,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Route,
  Shield,
  ShieldCheck,
  Trash2,
  Unlock,
  User,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { paths, questions, type UserData } from "@/lib/decision-model"

interface AdminUser {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
  userData: UserData | null
}

interface AdminStats {
  totalUsers: number
  totalSessions: number
  completedAssessments: number
  totalRoadmapTasksChecked: number
  databaseSizeBytes: number
  databasePath: string
}

export function AdminView({ onBack }: { onBack: () => void }) {
  const [passkey, setPasskey] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Passkey change state
  const [changePasskeyOpen, setChangePasskeyOpen] = useState(false)
  const [currentPasskeyInput, setCurrentPasskeyInput] = useState("")
  const [newPasskeyInput, setNewPasskeyInput] = useState("")
  const [confirmNewPasskeyInput, setConfirmNewPasskeyInput] = useState("")
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [passkeySuccess, setPasskeySuccess] = useState<string | null>(null)
  const [passkeyUpdating, setPasskeyUpdating] = useState(false)

  // Check sessionStorage for previous unlock in this tab
  useEffect(() => {
    const savedPasskey = sessionStorage.getItem("ldl_admin_passkey")
    if (savedPasskey) {
      setPasskey(savedPasskey)
      fetchAdminData(savedPasskey)
    }
  }, [])

  async function fetchAdminData(keyToUse: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "x-admin-passkey": keyToUse },
      })

      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid admin passkey. Please try again.")
          setAuthenticated(false)
          sessionStorage.removeItem("ldl_admin_passkey")
        } else {
          setError("Failed to fetch admin data.")
        }
        setLoading(false)
        return
      }

      const data = await res.json()
      setUsers(data.users || [])
      setStats(data.stats || null)
      setAuthenticated(true)
      sessionStorage.setItem("ldl_admin_passkey", keyToUse)
    } catch {
      setError("Network error while connecting to database API.")
    } finally {
      setLoading(false)
    }
  }

  function handlePasskeySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passkey.trim()) {
      setError("Please enter the admin passkey.")
      return
    }
    fetchAdminData(passkey.trim())
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm(`Are you sure you want to permanently delete user ${userId}? This cannot be undone.`)) {
      return
    }

    setDeletingId(userId)
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers: { "x-admin-passkey": passkey },
      })

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        if (stats) {
          setStats({ ...stats, totalUsers: Math.max(0, stats.totalUsers - 1) })
        }
        if (selectedUser?.id === userId) setSelectedUser(null)
      } else {
        alert("Failed to delete user.")
      }
    } catch {
      alert("Error deleting user.")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleChangePasskeySubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasskeyError(null)
    setPasskeySuccess(null)

    if (!currentPasskeyInput.trim() || !newPasskeyInput.trim()) {
      setPasskeyError("Please fill out all passkey fields.")
      return
    }

    if (newPasskeyInput !== confirmNewPasskeyInput) {
      setPasskeyError("New passkeys do not match.")
      return
    }

    if (newPasskeyInput.length < 4) {
      setPasskeyError("New passkey must be at least 4 characters long.")
      return
    }

    setPasskeyUpdating(true)
    try {
      const res = await fetch("/api/admin/passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPasskey: currentPasskeyInput.trim(),
          newPasskey: newPasskeyInput.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setPasskeyError(data.error || "Failed to update passkey.")
        setPasskeyUpdating(false)
        return
      }

      const updatedKey = newPasskeyInput.trim()
      setPasskey(updatedKey)
      sessionStorage.setItem("ldl_admin_passkey", updatedKey)
      setPasskeySuccess("Admin passkey successfully updated in data/db.json!")
      setCurrentPasskeyInput("")
      setNewPasskeyInput("")
      setConfirmNewPasskeyInput("")
      setTimeout(() => {
        setChangePasskeyOpen(false)
        setPasskeySuccess(null)
      }, 1500)
    } catch {
      setPasskeyError("Network error while updating passkey.")
    } finally {
      setPasskeyUpdating(false)
    }
  }

  function downloadBackup() {
    const jsonStr = JSON.stringify({ users, stats, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `database-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // PASSKEY LOCK SCREEN
  if (!authenticated) {
    return (
      <div className="page-enter mx-auto flex max-w-md flex-col items-center justify-center py-12">
        <Card className="w-full [--card-spacing:--spacing(6)]">
          <CardHeader className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              <Shield className="size-6" />
            </div>
            <CardTitle className="mt-3 text-lg">Admin Database Panel</CardTitle>
            <CardDescription className="text-xs">
              Enter your admin passkey to inspect and manage all stored database records.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handlePasskeySubmit} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="admin-passkey" className="text-xs">
                  Passkey
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="admin-passkey"
                    type="password"
                    placeholder="Enter passkey (default: admin123)"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    className="pl-9 text-xs"
                    autoFocus
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 text-xs" disabled={loading}>
                <Unlock className="size-3.5" />
                {loading ? "Verifying..." : "Unlock Admin Dashboard"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPasskey("admin123")
                  fetchAdminData("admin123")
                }}
                className="w-full border-dashed text-xs text-primary"
              >
                Use Default Passkey (admin123)
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-border pt-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-xs text-muted-foreground">
              <ArrowLeft className="size-3.5 mr-1.5" /> Return to Workspace
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="page-enter flex flex-col gap-6 py-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="eyebrow text-primary">
              <Database className="size-3.5" /> LIVE DATABASE ADMIN PANEL
            </p>
            <Badge variant="outline" className="text-[10px] text-chart-2 border-chart-2/40">
              Connected to data/db.json
            </Badge>
          </div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Database & User Management</h1>
          <p className="text-xs text-muted-foreground">
            Directly inspect, analyze, and manage all records stored in your persistent JSON/ACID database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChangePasskeyOpen(true)}
            className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
          >
            <KeyRound className="size-3.5" /> Change Passkey
          </Button>

          <Button variant="outline" size="sm" onClick={() => fetchAdminData(passkey)} disabled={loading} className="text-xs gap-1.5">
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={downloadBackup} className="text-xs gap-1.5">
            <Download className="size-3.5" /> Download Backup
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAuthenticated(false)
              sessionStorage.removeItem("ldl_admin_passkey")
            }}
            className="text-xs text-muted-foreground gap-1.5"
          >
            <Lock className="size-3.5" /> Lock
          </Button>

          <Button variant="ghost" size="sm" onClick={onBack} className="text-xs gap-1">
            <ArrowLeft className="size-3.5" /> Exit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="[--card-spacing:--spacing(4)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers ?? users.length}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Stored in data/db.json</p>
          </CardContent>
        </Card>

        <Card className="[--card-spacing:--spacing(4)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Sessions</CardTitle>
            <KeyRound className="size-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{stats?.totalSessions ?? 0}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">365-day persistent tokens</p>
          </CardContent>
        </Card>

        <Card className="[--card-spacing:--spacing(4)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Assessments Completed</CardTitle>
            <CheckCircle2 className="size-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{stats?.completedAssessments ?? 0}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">All 8 questions answered</p>
          </CardContent>
        </Card>

        <Card className="[--card-spacing:--spacing(4)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Roadmap Tasks Checked</CardTitle>
            <Route className="size-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{stats?.totalRoadmapTasksChecked ?? 0}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Actionable steps taken</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Management Table */}
      <Card className="[--card-spacing:--spacing(5)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Registered Users Directory</CardTitle>
              <CardDescription className="text-xs">
                Real-time snapshot of user accounts and their linked assessment/roadmap states.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {users.length} {users.length === 1 ? "User" : "Users"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Joined Date</th>
                  <th>Assessment Progress</th>
                  <th>Roadmap</th>
                  <th>Last Sync</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                      No users registered in the database yet.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const answered = u.userData?.answers ? Object.keys(u.userData.answers).length : 0
                    const isComplete = u.userData?.complete
                    const tasksDone = u.userData?.checked
                      ? Object.values(u.userData.checked).filter(Boolean).length
                      : 0

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-medium">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <p className="font-medium text-xs text-foreground">{u.name}</p>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Mail className="size-3" /> {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={isComplete ? "default" : "outline"}
                                className="text-[10px] py-0 h-5"
                              >
                                {isComplete ? "Complete" : `${answered}/8 Answered`}
                              </Badge>
                              {u.userData?.selectedPath && (
                                <span className="text-[10px] text-muted-foreground capitalize">
                                  Path: {u.userData.selectedPath}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="text-xs text-muted-foreground">
                            {tasksDone}/12 tasks
                          </span>
                        </td>

                        <td className="text-xs text-muted-foreground">
                          {u.userData?.updatedAt
                            ? new Date(u.userData.updatedAt).toLocaleTimeString()
                            : "N/A"}
                        </td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(u)}
                              className="h-7 px-2 text-xs gap-1"
                            >
                              <Eye className="size-3" /> Inspect
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={deletingId === u.id}
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                              title="Delete user"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Change Passkey Modal */}
      <Dialog open={changePasskeyOpen} onOpenChange={setChangePasskeyOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <DialogTitle className="text-base">Change Admin Passkey</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Update the master passkey used to unlock this database admin panel. The new passkey will be saved in data/db.json.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePasskeySubmit} className="flex flex-col gap-4 py-2">
            {passkeyError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{passkeyError}</span>
              </div>
            )}

            {passkeySuccess && (
              <div className="flex items-start gap-2 rounded-lg border border-chart-2/40 bg-chart-2/10 p-2.5 text-xs text-chart-2">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{passkeySuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="current-passkey" className="text-xs">
                Current Passkey
              </Label>
              <Input
                id="current-passkey"
                type="password"
                placeholder="Enter current passkey"
                value={currentPasskeyInput}
                onChange={(e) => setCurrentPasskeyInput(e.target.value)}
                className="text-xs"
                required
                disabled={passkeyUpdating}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-passkey" className="text-xs">
                New Passkey (Min. 4 characters)
              </Label>
              <Input
                id="new-passkey"
                type="password"
                placeholder="Enter new passkey"
                value={newPasskeyInput}
                onChange={(e) => setNewPasskeyInput(e.target.value)}
                className="text-xs"
                required
                disabled={passkeyUpdating}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-new-passkey" className="text-xs">
                Confirm New Passkey
              </Label>
              <Input
                id="confirm-new-passkey"
                type="password"
                placeholder="Re-type new passkey"
                value={confirmNewPasskeyInput}
                onChange={(e) => setConfirmNewPasskeyInput(e.target.value)}
                className="text-xs"
                required
                disabled={passkeyUpdating}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setChangePasskeyOpen(false)}
                disabled={passkeyUpdating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={passkeyUpdating} className="text-xs gap-1.5">
                {passkeyUpdating ? "Updating..." : "Save New Passkey"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Inspector Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base">User Details: {selectedUser.name}</DialogTitle>
                  <Badge variant="outline" className="text-[10px]">
                    ID: {selectedUser.id}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  Email: {selectedUser.email} · Registered:{" "}
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-2">
                {/* Answers Section */}
                <section>
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    Assessment Answers ({Object.keys(selectedUser.userData?.answers || {}).length}/8)
                  </h3>
                  {selectedUser.userData?.answers && Object.keys(selectedUser.userData.answers).length > 0 ? (
                    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs">
                      {questions.map((q, idx) => {
                        const answerIdx = selectedUser.userData?.answers[idx]
                        const chosenOption = answerIdx !== undefined ? q.options[answerIdx] : null
                        return (
                          <div key={q.title} className="flex flex-col gap-0.5 border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
                            <span className="font-medium text-[11px] text-muted-foreground">
                              {idx + 1}. {q.title}
                            </span>
                            <span className={chosenOption ? "text-foreground" : "text-muted-foreground italic"}>
                              {chosenOption ? `→ ${chosenOption.label}` : "Not answered"}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No assessment answers recorded yet.</p>
                  )}
                </section>

                <Separator />

                {/* Selected Path & Assumptions */}
                <section>
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    Roadmap & Financial Assumptions
                  </h3>
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Selected Path:</span>
                      <p className="font-medium capitalize text-foreground">
                        {selectedUser.userData?.selectedPath || "studies"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tasks Checked:</span>
                      <p className="font-medium text-foreground">
                        {selectedUser.userData?.checked
                          ? Object.values(selectedUser.userData.checked).filter(Boolean).length
                          : 0}{" "}
                        of 12
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Starting Corporate Salary:</span>
                      <p className="font-medium text-foreground">
                        ₹{selectedUser.userData?.assumptions?.salary ?? 6}L / yr
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Salary Growth:</span>
                      <p className="font-medium text-foreground">
                        {selectedUser.userData?.assumptions?.growth ?? 10}% / yr
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
