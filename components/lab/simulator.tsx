"use client"

import { ArrowRight, ChartNoAxesCombined, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { ProjectionChart } from "@/components/lab/projection-chart"
import { defaultAssumptions, formatLakh, getProjections, getTotals, modelExplanation, paths, type Assumptions } from "@/lib/decision-model"

const controls: { key: keyof Assumptions; label: string; min: number; max: number; step: number; unit: string; description: string }[] = [
  { key: "salary", label: "Starting corporate salary", min: 3, max: 20, step: 0.5, unit: "lakh", description: "Annual income in the first year" },
  { key: "growth", label: "Annual salary growth", min: 0, max: 25, step: 1, unit: "%", description: "Used for corporate and post-study salaries" },
  { key: "tuition", label: "Total cost of studies", min: 2, max: 30, step: 1, unit: "lakh", description: "Split equally over two years" },
  { key: "investment", label: "Initial startup investment", min: 1, max: 20, step: 1, unit: "lakh", description: "Modeled as a year-one outflow" },
  { key: "startupGrowth", label: "Startup income growth", min: 0, max: 80, step: 5, unit: "%", description: "After assumed ₹4.5L owner income in year two" },
]

export function Simulator({ assumptions, setAssumptions }: { assumptions: Assumptions; setAssumptions: (value: Assumptions) => void }) {
  const projections = getProjections(assumptions)
  const totals = getTotals(projections)
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="page-heading mb-0"><p className="eyebrow text-primary"><ChartNoAxesCombined className="size-4" /> THE FIVE-YEAR PERSPECTIVE</p><h1>Change the what-ifs. See what changes.</h1><p>A simple space to test assumptions—not predict the future. Adjust the inputs to explore a range of possible financial paths.</p></div>
      <div className="grid items-start gap-5 xl:grid-cols-[280px_1fr]">
        <Card className="[--card-spacing:--spacing(5)]"><CardHeader><CardTitle>Your assumptions</CardTitle><CardDescription>All amounts in INR lakh.</CardDescription></CardHeader><CardContent><FieldGroup className="gap-7">{controls.map(control => <Field key={control.key}><div className="mb-1 flex items-center justify-between gap-2"><FieldLabel id={`${control.key}-label`} htmlFor={control.key}>{control.label}</FieldLabel><output className="shrink-0 text-xs font-medium text-primary" aria-live="off">{control.unit === "%" ? `${assumptions[control.key]}%` : formatLakh(assumptions[control.key])}</output></div><Slider id={control.key} aria-labelledby={`${control.key}-label`} value={[assumptions[control.key]]} min={control.min} max={control.max} step={control.step} onValueChange={value => setAssumptions({ ...assumptions, [control.key]: Array.isArray(value) ? value[0] : value })} /><FieldDescription>{control.description}</FieldDescription></Field>)}</FieldGroup></CardContent><CardFooter><Button variant="ghost" onClick={() => setAssumptions({ ...defaultAssumptions })}><RotateCcw data-icon="inline-start" />Reset assumptions</Button></CardFooter></Card>
        <div className="flex min-w-0 flex-col gap-5"><Card className="[--card-spacing:--spacing(5)]"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Five years. Three possibilities.</CardTitle><Badge variant="outline">Illustrative</Badge></div><CardDescription>Annual cash flow · ₹ lakh · before tax and living costs</CardDescription></CardHeader><CardContent><ProjectionChart data={projections} large /></CardContent></Card><div className="grid grid-cols-3 gap-3">{paths.map(path => <Card key={path.id} data-path={path.id} size="sm"><CardHeader><CardDescription>{path.short}</CardDescription><CardTitle><span style={{ color: "var(--path-color)" }}>{formatLakh(totals[path.id])}</span></CardTitle></CardHeader><CardContent><p className="text-[10px] text-muted-foreground">5-year net cash flow</p></CardContent></Card>)}</div></div>
      </div>
      <Card className="[--card-spacing:--spacing(5)]"><CardHeader><CardTitle>A closer look at the numbers</CardTitle><CardDescription>Negative values represent modeled costs, not earnings.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="data-table min-w-[430px]"><caption className="sr-only">Annual illustrative cash flow in INR lakh by career path</caption><thead><tr><th scope="col">Year</th>{paths.map(path => <th scope="col" key={path.id}>{path.name}</th>)}</tr></thead><tbody>{projections.map(row => <tr key={row.year}><th scope="row">{row.year}</th>{paths.map(path => <td key={path.id}>{formatLakh(row[path.id])}</td>)}</tr>)}</tbody></table></CardContent></Card>
      <div className="flex flex-col gap-3"><h2 className="text-sm font-medium">A model is only as useful as its assumptions.</h2><p className="assumptions-copy">{modelExplanation}</p><a href="#reports" className={`${buttonVariants({ variant: "outline" })} mt-2 self-start`}>Download these scenarios<ArrowRight className="ml-2 size-4" /></a></div>
    </div>
  )
}
