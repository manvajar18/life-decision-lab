"use client"

import { ArrowRight, GitCompareArrows } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { pathIcons } from "@/components/lab/overview"
import { formatLakh, getProjections, getTotals, paths, type Assumptions, type PathId, type Scores } from "@/lib/decision-model"

export function Compare({ assumptions, scores, onChoose }: { assumptions: Assumptions; scores: Scores | null; onChoose: (path: PathId) => void }) {
  const projections = getProjections(assumptions)
  const totals = getTotals(projections)
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="page-heading mb-0"><p className="eyebrow text-primary"><GitCompareArrows className="size-4" /> SEE THE WHOLE PICTURE</p><h1>Different paths. Different possibilities.</h1><p>Look beyond a job title or a salary. Compare the investment, the trade-offs, and the life you want to build.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">{paths.map(path => {
        const Icon = pathIcons[path.id]
        return <Card data-path={path.id} key={path.id} className="[--card-spacing:--spacing(5)]"><CardHeader className="gap-3"><div className="flex items-center justify-between"><span className="path-icon"><Icon className="size-5" /></span>{scores && <Badge variant="secondary">{scores[path.id]}/100 alignment</Badge>}</div><CardTitle>{path.name}</CardTitle><CardDescription>{path.description}</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div><p className="text-[10px] text-muted-foreground">Illustrative five-year net cash flow</p><p className="mt-2 text-3xl font-medium tracking-tight" style={{ color: "var(--path-color)" }}>{formatLakh(totals[path.id])}</p></div><p className="text-xs text-muted-foreground">{path.commitment}</p></CardContent><CardFooter><Button variant="outline" className="w-full" onClick={() => onChoose(path.id)}>Explore my roadmap<ArrowRight data-icon="inline-end" /></Button></CardFooter></Card>
      })}</div>
      <Card className="[--card-spacing:--spacing(5)]"><CardHeader><CardTitle>The trade-offs, side by side</CardTitle><CardDescription>There is no universal winner. The right balance depends on your circumstances.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="data-table min-w-[580px]"><caption className="sr-only">Comparison of three career paths and illustrative annual income</caption><thead><tr><th scope="col">What matters</th>{paths.map(path => <th key={path.id} scope="col">{path.name}</th>)}</tr></thead><tbody><tr><th scope="row">Upfront investment</th><td>{formatLakh(assumptions.tuition)} tuition over 2 years</td><td>No investment included</td><td>{formatLakh(assumptions.investment)} initial capital</td></tr><tr><th scope="row">Income in year one</th>{paths.map(path => <td key={path.id}>{formatLakh(projections[0][path.id])}</td>)}</tr><tr><th scope="row">Income in year five</th>{paths.map(path => <td key={path.id}>{formatLakh(projections[4][path.id])}</td>)}</tr><tr><th scope="row">What you gain</th>{paths.map(path => <td key={path.id}>{path.upside}</td>)}</tr><tr><th scope="row">What to consider</th>{paths.map(path => <td key={path.id} className="text-muted-foreground">{path.tradeoff}</td>)}</tr></tbody></table></CardContent><CardFooter className="flex-wrap justify-between gap-4"><p className="max-w-lg text-[11px] leading-6 text-muted-foreground">Numbers use your simulator assumptions, not market data. Living costs, taxes, interest, and the possibility of business failure are not modeled.</p><a href="#simulator" className={buttonVariants({ variant: "outline" })}>Adjust assumptions<ArrowRight className="ml-2 size-4" /></a></CardFooter></Card>
      {!scores && <p className="text-center text-xs text-muted-foreground">Want to add your personal perspective? <a href="#assessment" className="text-primary underline-offset-4 hover:underline">Take the eight-question assessment.</a></p>}
    </div>
  )
}
