"use client"

import { useState } from "react"
import { Check, Download, FileChartColumn, FileText, Printer } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { calculateScores, formatLakh, getProjections, getTotals, modelExplanation, paths, questions, type Answers, type Assumptions, type PathId } from "@/lib/decision-model"

export function Reports({ answers, complete, assumptions, selected, checked }: { answers: Answers; complete: boolean; assumptions: Assumptions; selected: PathId; checked: Record<string, boolean> }) {
  const [downloaded, setDownloaded] = useState("")
  const scores = complete ? calculateScores(answers) : null
  const projections = getProjections(assumptions)
  const totals = getTotals(projections)
  const path = paths.find(path => path.id === selected)!
  const count = Object.keys(answers).length

  function download(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDownloaded(filename)
  }

  function downloadReport() {
    const text = [
      "LIFE DECISION LAB — YOUR EXPLORATION REPORT",
      `Created ${new Date().toLocaleDateString("en-IN")}`,
      "A starting point for reflection. Not a prediction or professional advice.",
      "\nYOUR ASSESSMENT",
      scores ? paths.map(path => `${path.name}: ${scores[path.id]}/100 alignment`).join("\n") : `Assessment incomplete (${count}/8 answered). Complete it to calculate alignment scores.`,
      "Each answer contributes 1–5 points per path. All 8 questions have equal weight. Path total / 40 × 100 gives its independent alignment score. This is not a validated psychological assessment.",
      ...questions.map((question, index) => `${index + 1}. ${question.title}\n   ${question.options[answers[index]]?.label ?? "Not answered"}`),
      "\nYOUR SIMULATION ASSUMPTIONS",
      `Starting corporate salary: ${formatLakh(assumptions.salary)} per year; salary growth: ${assumptions.growth}% per year; tuition: ${formatLakh(assumptions.tuition)} over two years; startup investment: ${formatLakh(assumptions.investment)}; startup income growth: ${assumptions.startupGrowth}% per year.`,
      "\nILLUSTRATIVE CASH FLOW (INR LAKH)",
      "Year | Higher studies | Corporate career | Entrepreneurship",
      ...projections.map(row => `${row.year} | ${formatLakh(row.studies)} | ${formatLakh(row.corporate)} | ${formatLakh(row.startup)}`),
      `5-year total | ${formatLakh(totals.studies)} | ${formatLakh(totals.corporate)} | ${formatLakh(totals.startup)}`,
      "\nHOW THE MODEL WORKS", modelExplanation,
      `\nYOUR ROADMAP: ${path.name.toUpperCase()}`,
      ...path.roadmap.flatMap((step, index) => [step.period + " — " + step.title, ...step.tasks.map((task, taskIndex) => `${checked[`${selected}-${index}-${taskIndex}`] ? "[done]" : "[ ]"} ${task}`)]),
      "\nBuilt for possibilities. Not predictions. — Life Decision Lab",
    ].join("\n\n")
    download(text, "life-decision-lab-report.txt", "text/plain;charset=utf-8")
  }

  function downloadCsv() {
    const content = ["Year,Higher studies (INR lakh),Corporate career (INR lakh),Entrepreneurship (INR lakh)", ...projections.map(row => `${row.year},${row.studies},${row.corporate},${row.startup}`), `5-year total,${totals.studies.toFixed(2)},${totals.corporate.toFixed(2)},${totals.startup.toFixed(2)}`, "", '"Illustrative only. Excludes tax, inflation, living costs, interest, and failure risk."', `"Starting salary (lakh)",${assumptions.salary}`, `"Salary growth (%)",${assumptions.growth}`, `"Tuition (lakh)",${assumptions.tuition}`, `"Startup investment (lakh)",${assumptions.investment}`, `"Startup growth (%)",${assumptions.startupGrowth}`, `"Model assumptions","${modelExplanation.replaceAll('"', '""')}"`].join("\r\n")
    download(content, "life-decision-lab-scenarios.csv", "text/csv;charset=utf-8")
  }

  return (
    <div className="page-enter print-report flex flex-col gap-6">
      <div className="page-heading mb-0"><p className="eyebrow text-primary"><FileText className="size-4" /> TAKE YOUR CLARITY WITH YOU</p><h1>Your possibilities, on one page.</h1><p>Keep a copy of your reflections, scenarios, and next steps. A useful starting point for a conversation with a mentor—or your future self.</p></div>
      <div className="no-print grid gap-5 md:grid-cols-2"><Card className="[--card-spacing:--spacing(6)]"><CardHeader className="gap-3"><FileText className="size-7 text-primary" /><CardTitle>Your exploration report</CardTitle><CardDescription>Your answers, alignment scores, financial assumptions, and current roadmap with completed steps.</CardDescription></CardHeader><CardContent><Badge variant="outline">Plain text · No account needed</Badge></CardContent><CardFooter><Button size="lg" onClick={downloadReport}><Download data-icon="inline-start" />Download my report</Button></CardFooter></Card><Card className="[--card-spacing:--spacing(6)]"><CardHeader className="gap-3"><FileChartColumn className="size-7 text-chart-2" /><CardTitle>Your five-year scenarios</CardTitle><CardDescription>The numbers behind your comparison, ready to open in a spreadsheet and explore further.</CardDescription></CardHeader><CardContent><Badge variant="outline">CSV · Includes model assumptions</Badge></CardContent><CardFooter><Button variant="outline" size="lg" onClick={downloadCsv}><Download data-icon="inline-start" />Download scenarios</Button></CardFooter></Card></div>
      <p role="status" aria-live="polite" className="no-print flex min-h-5 items-center gap-2 text-xs text-chart-2">{downloaded && <><Check className="size-4" />Download requested: {downloaded}</>}</p>
      <Card className="[--card-spacing:--spacing(6)]"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Your current snapshot</CardTitle><Button variant="ghost" className="no-print" onClick={() => window.print()}><Printer data-icon="inline-start" />Print snapshot</Button></div><CardDescription>Guest session · Not stored on a server</CardDescription></CardHeader><CardContent className="flex flex-col gap-6"><section><h2 className="mb-3 text-sm font-medium">Your assessment</h2>{scores ? <div className="grid grid-cols-3 gap-3">{paths.map(path => <div key={path.id}><p className="text-xs text-muted-foreground">{path.name}</p><p className="mt-2 text-xl font-medium">{scores[path.id]}<span className="text-xs text-muted-foreground"> / 100</span></p></div>)}</div> : <p className="text-xs leading-6 text-muted-foreground">{count} of 8 questions answered. <a href="#assessment" className="text-primary">Finish your assessment</a> to include your alignment scores.</p>}</section><Separator /><section><h2 className="mb-3 text-sm font-medium">Your five-year scenarios</h2><div className="grid grid-cols-3 gap-3">{paths.map(path => <div key={path.id} data-path={path.id}><p className="text-xs text-muted-foreground">{path.short}</p><p className="mt-2 text-xl font-medium" style={{ color: "var(--path-color)" }}>{formatLakh(totals[path.id])}</p><p className="mt-1 text-[10px] text-muted-foreground">Illustrative total cash flow</p></div>)}</div></section><Separator /><section><h2 className="mb-2 text-sm font-medium">Your next step · {path.name}</h2><p className="text-xs leading-6 text-muted-foreground">{path.firstStep}</p></section><Separator /><section><h2 className="mb-2 text-sm font-medium">Important context</h2><p className="assumptions-copy">{modelExplanation}</p></section></CardContent></Card>
      <p className="no-print text-center text-[11px] text-muted-foreground">Nothing is saved automatically. Download your report before refreshing or closing this tab.</p>
    </div>
  )
}
