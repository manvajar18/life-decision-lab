"use client"

import { useEffect, useRef } from "react"
import { ArrowLeft, ArrowRight, Check, Compass, RotateCcw, ShieldCheck } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Field, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { pathIcons } from "@/components/lab/overview"
import { calculateScores, paths, questions, type Answers } from "@/lib/decision-model"
import { cn } from "@/lib/utils"

interface AssessmentProps {
  answers: Answers
  setAnswer: (question: number, option: number) => void
  step: number
  setStep: (step: number) => void
  complete: boolean
  setComplete: (value: boolean) => void
  onHelp: () => void
}

export function Assessment({ answers, setAnswer, step, setStep, complete, setComplete, onHelp }: AssessmentProps) {
  const question = questions[step]
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { titleRef.current?.focus({ preventScroll: true }) }, [step, complete])
  const scores = calculateScores(answers)
  const strongest = Math.max(...Object.values(scores))
  const matches = paths.filter(path => scores[path.id] === strongest)

  if (complete) return (
    <div className="page-enter flex flex-col gap-6">
      <div className="page-heading mb-0"><p className="eyebrow text-primary"><Check className="size-4" /> A LITTLE MORE CLARITY</p><h1 ref={titleRef} tabIndex={-1} className="outline-none">Your next chapter, in perspective.</h1><p>Your answers point toward {matches.map(path => path.name.toLowerCase()).join(" and ")}. Treat this as a starting point for exploration—not a verdict on your future.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">{paths.map(path => {
        const Icon = pathIcons[path.id]
        return <Card key={path.id} data-path={path.id} className="[--card-spacing:--spacing(5)]"><CardHeader className="gap-4"><div className="flex items-center justify-between gap-2"><span className="path-icon"><Icon className="size-5" /></span>{scores[path.id] === strongest && <Badge variant="secondary">Strongest alignment</Badge>}</div><CardTitle>{path.name}</CardTitle><CardDescription>{path.description}</CardDescription></CardHeader><CardContent><p className="mb-3 text-3xl font-medium tracking-tight" style={{ color: "var(--path-color)" }}>{scores[path.id]}<span className="text-sm text-muted-foreground"> / 100</span></p><Progress value={scores[path.id]} aria-label={`${path.name} alignment score`} /><p className="mt-4 text-xs leading-6 text-muted-foreground">{path.firstStep}</p></CardContent></Card>
      })}</div>
      <Card className="[--card-spacing:--spacing(6)]"><CardHeader><CardTitle>What these scores really mean</CardTitle><CardDescription>A reflection of your preferences, not a prediction of success.</CardDescription></CardHeader><CardContent><p className="text-xs leading-7 text-muted-foreground">Each answer adds 1–5 points to each path. The score is your total for that path out of 40, expressed out of 100. All eight questions are equally weighted. Scores are independent, so they do not need to add up to 100. This is an exploratory framework, not a validated psychological assessment.</p></CardContent><CardFooter className="flex-wrap gap-3"><a href="#compare" className={buttonVariants({ size: "lg" })}>Compare my possibilities <ArrowRight className="ml-2 size-4" /></a><a href="#reports" className={buttonVariants({ variant: "outline", size: "lg" })}>View my report</a><Button variant="ghost" onClick={() => { setStep(0); setComplete(false) }}><RotateCcw data-icon="inline-start" />Review answers</Button></CardFooter></Card>
    </div>
  )

  return (
    <div className="page-enter">
      <div className="page-heading"><p className="eyebrow text-primary"><Compass className="size-4" /> START WITH YOURSELF</p><h1>A little reflection. A clearer direction.</h1><p>Eight thoughtful questions about what matters to you. There are no right answers, and you can change your mind along the way.</p></div>
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_240px]">
        <Card className="[--card-spacing:--spacing(6)]">
          <CardHeader className="gap-5"><div className="flex items-center justify-between"><Badge variant="secondary">{question.category}</Badge><span className="text-xs text-muted-foreground">{step + 1} of {questions.length}</span></div><Progress value={Object.keys(answers).length / questions.length * 100} aria-label="Assessment completion" /></CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div><h2 ref={titleRef} tabIndex={-1} className="text-xl font-medium leading-snug tracking-tight outline-none">{question.title}</h2><p className="mt-3 text-xs leading-6 text-muted-foreground">{question.description}</p></div>
            <FieldSet><FieldLegend className="sr-only">{question.title}</FieldLegend><FieldGroup><Field><ToggleGroup className="assessment-options" orientation="vertical" spacing={3} value={answers[step] === undefined ? [] : [String(answers[step])]} onValueChange={value => { if (value.length) setAnswer(step, Number(value[0])) }} aria-label={question.title}>
              {question.options.map((option, index) => <ToggleGroupItem value={String(index)} key={option.label}><span className="option-letter">{answers[step] === index ? <Check className="size-4" /> : String.fromCharCode(65 + index)}</span><span className="text-xs leading-5">{option.label}<span className="option-hint">{option.hint}</span></span></ToggleGroupItem>)}
            </ToggleGroup></Field></FieldGroup></FieldSet>
          </CardContent>
          <CardFooter className="justify-between"><Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft data-icon="inline-start" />Back</Button><Button size="lg" disabled={answers[step] === undefined} onClick={() => step === questions.length - 1 ? setComplete(true) : setStep(step + 1)}>{step === questions.length - 1 ? "See my direction" : "Next question"}<ArrowRight data-icon="inline-end" /></Button></CardFooter>
        </Card>
        <aside className="flex flex-col gap-5 xl:pt-2"><div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary"><ShieldCheck className="size-5" /></div><h3 className="text-sm font-medium">This is your space.</h3><p className="text-xs leading-7 text-muted-foreground">Answer for who you are today, not who you feel you should be. You can revisit every answer before deciding what comes next.</p><Separator /><p className="text-[11px] leading-6 text-muted-foreground">Sign in to automatically sync your assessment and roadmap to the database, or explore freely in guest mode.</p><Button variant="link" className="justify-start p-0" onClick={onHelp}>How does the scoring work?<ArrowRight data-icon="inline-end" /></Button></aside>
      </div>
    </div>
  )
}
