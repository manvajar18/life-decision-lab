"use client"

import { ArrowRight, Check, Route } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { pathIcons } from "@/components/lab/overview"
import { paths, type PathId } from "@/lib/decision-model"
import { cn } from "@/lib/utils"

export function Roadmap({ selected, setSelected, checked, setChecked }: { selected: PathId; setSelected: (path: PathId) => void; checked: Record<string, boolean>; setChecked: (key: string, value: boolean) => void }) {
  const path = paths.find(path => path.id === selected)!
  const completed = path.roadmap.reduce((count, step, index) => count + step.tasks.filter((_, task) => checked[`${selected}-${index}-${task}`]).length, 0)
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="page-heading mb-0"><p className="eyebrow text-primary"><Route className="size-4" /> SMALL STEPS. REAL MOMENTUM.</p><h1>A direction is just the beginning.</h1><p>Turn possibilities into something practical. Choose a path and use this flexible 90-day checklist to make your next move.</p></div>
      <ToggleGroup aria-label="Choose a roadmap" value={[selected]} onValueChange={value => { const path = paths.find(path => path.id === value[0]); if (path) setSelected(path.id) }} variant="outline" className="path-switch">{paths.map(path => { const Icon = pathIcons[path.id]; return <ToggleGroupItem key={path.id} value={path.id}><Icon data-icon="inline-start" />{path.name}</ToggleGroupItem> })}</ToggleGroup>
      <Card className="[--card-spacing:--spacing(6)]"><CardHeader><div className="flex flex-wrap items-center justify-between gap-4"><div><CardTitle>Your {path.name.toLowerCase()} roadmap</CardTitle><CardDescription>Make this a guide, not another deadline.</CardDescription></div><span className="text-xs text-primary">{completed} of 12 steps taken</span></div></CardHeader><CardContent><Progress value={completed / 12 * 100} aria-label="Roadmap progress" /></CardContent></Card>
      <div className="flex flex-col gap-5">{path.roadmap.map((step, index) => <Card key={`${selected}-${index}`} className="[--card-spacing:--spacing(6)]"><CardContent><div className="roadmap-step"><span className="roadmap-number">{step.tasks.every((_, task) => checked[`${selected}-${index}-${task}`]) ? <Check className="size-4" /> : String(index + 1).padStart(2, "0")}</span><FieldSet className="flex-1"><p className="eyebrow text-primary">{step.period}</p><FieldLegend>{step.title}</FieldLegend><FieldGroup className="gap-4">{step.tasks.map((task, taskIndex) => { const key = `${selected}-${index}-${taskIndex}`; return <Field key={key} orientation="horizontal"><Checkbox id={key} checked={!!checked[key]} onCheckedChange={value => setChecked(key, !!value)} /><FieldLabel htmlFor={key}><span className={cn("text-xs font-normal leading-6", checked[key] ? "text-muted-foreground line-through" : "text-foreground")}>{task}</span></FieldLabel></Field> })}</FieldGroup></FieldSet></div></CardContent></Card>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-4"><p className="max-w-lg text-xs leading-6 text-muted-foreground">Sign in to sync your 90-day checklist to the database across devices, or download your report to keep an offline copy.</p><a href="#reports" className={buttonVariants({ size: "lg" })}>Keep a copy of my plan<ArrowRight className="ml-2 size-4" /></a></div>
    </div>
  )
}
