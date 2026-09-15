"use client"

import { ArrowRight, ArrowUpRight, Building2, Check, ChevronRight, CirclePlay, Compass, GraduationCap, GitCompareArrows, Lightbulb, LockKeyhole, Rocket, Route, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProjectionChart } from "@/components/lab/projection-chart"
import { defaultAssumptions, getProjections, paths } from "@/lib/decision-model"
import { cn } from "@/lib/utils"

export const pathIcons = { studies: GraduationCap, corporate: Building2, startup: Rocket }

export function Overview({ onHelp }: { onHelp: () => void }) {
  return (
    <div className="page-enter flex flex-col gap-8">
      <section className="overview-hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow text-primary"><Sparkles className="size-3.5" /> YOUR NEXT CHAPTER STARTS HERE</p>
            <h1 id="hero-title">Big decisions.<br /><span>Clearer futures.</span></h1>
            <p className="hero-description">Higher studies, a corporate career, or your own startup? Explore what each path could look like—and find the one that feels like you.</p>
            <div className="hero-actions">
              <a href="#assessment" className={cn(buttonVariants({ size: "lg" }), "h-11 gap-3 px-5")}>Find my direction <ArrowRight className="size-4" /></a>
              <a href="#simulator" className="text-link"><CirclePlay className="size-4" /> Explore the simulator</a>
            </div>
            <p className="hero-reassurance"><Check className="size-3.5 text-chart-2" /> 8 thoughtful questions <span>·</span> No right or wrong answers</p>
          </div>
          <div className="hero-chart-panel">
            <div className="flex items-center justify-between gap-3"><p className="mini-eyebrow">THE FIVE-YEAR PERSPECTIVE</p><Badge variant="outline">Illustrative</Badge></div>
            <div className="mb-3 mt-5"><h2 className="text-base font-medium tracking-tight">Different paths. New possibilities.</h2><p className="mt-1 text-[11px] text-muted-foreground">Annual career cash flow · ₹ lakh</p></div>
            <ProjectionChart data={getProjections(defaultAssumptions)} />
            <Separator className="my-4" />
            <a href="#simulator" className="chart-footer">Change the assumptions. See what changes.<ArrowUpRight className="size-3.5" /></a>
          </div>
        </div>
        <div className="hero-benefits">
          <div><Compass /><span>A little self-discovery</span></div>
          <div><GitCompareArrows /><span>A clearer comparison</span></div>
          <div><Route /><span>A plan to move forward</span></div>
        </div>
      </section>

      <section aria-labelledby="paths-heading">
        <div className="section-heading"><div><p className="eyebrow mb-2">THERE IS NO ONE RIGHT PATH</p><h2 id="paths-heading">Three paths. A world of possibilities.</h2></div><a href="#compare" className="text-link">Compare paths <ArrowUpRight className="size-4" /></a></div>
        <div className="grid gap-4 lg:grid-cols-3">
          {paths.map((path) => {
            const Icon = pathIcons[path.id]
            return (
              <Card key={path.id} className="path-card [--card-spacing:--spacing(5)]" data-path={path.id}>
                <CardHeader className="gap-4"><div className="flex items-center justify-between"><span className="path-icon"><Icon className="size-5" /></span><ArrowUpRight className="size-4 text-muted-foreground" /></div><div className="flex flex-col gap-2"><p className="mini-eyebrow">{path.eyebrow}</p><CardTitle>{path.name}</CardTitle></div><CardDescription>{path.description}</CardDescription></CardHeader>
                <CardContent><div className="flex flex-wrap gap-2">{path.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div></CardContent>
                <CardFooter><a href="#compare" className="path-card-link">Explore this path <ChevronRight className="size-4" /></a></CardFooter>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="journey-section" aria-labelledby="journey-heading">
        <div className="section-heading"><div><p className="eyebrow mb-2">FROM WHAT IF TO WHAT&apos;S NEXT</p><h2 id="journey-heading">Clarity starts with a small step.</h2></div><Button variant="ghost" onClick={onHelp}>How it works <ArrowUpRight data-icon="inline-end" /></Button></div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "01", title: "Understand yourself", copy: "Reflect on what matters—your interests, priorities, and comfort with uncertainty.", href: "#assessment" },
            { n: "02", title: "Explore your possibilities", copy: "Compare the trade-offs and see how different choices might play out.", href: "#compare" },
            { n: "03", title: "Take your next step", copy: "Turn a direction into action with a practical, personal roadmap.", href: "#roadmap" },
          ].map(step => <a key={step.n} href={step.href} className="journey-step"><span>{step.n}</span><div><h3>{step.title}</h3><p>{step.copy}</p></div></a>)}
        </div>
      </section>
      <div className="perspective-note"><Lightbulb className="size-5 shrink-0 text-primary" /><p>You don&apos;t need to have it all figured out.<span> You just need a clearer next step.</span></p><Compass className="ml-auto hidden size-8 text-primary/30 sm:block" /></div>
      <footer className="workspace-footer"><p>Built for possibilities. Not predictions.</p><span><LockKeyhole className="size-3" />Private by design · Guest session</span></footer>
    </div>
  )
}
