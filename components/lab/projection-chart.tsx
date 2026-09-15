"use client"

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { type Projection } from "@/lib/decision-model"
import { cn } from "@/lib/utils"

const chartConfig = {
  studies: { label: "Higher studies", color: "var(--chart-1)" },
  corporate: { label: "Corporate career", color: "var(--chart-2)" },
  startup: { label: "Entrepreneurship", color: "var(--chart-3)" },
} satisfies ChartConfig

export function ProjectionChart({ data, large = false }: { data: Projection[]; large?: boolean }) {
  return (
    <div className="min-w-0">
      <ChartContainer config={chartConfig} className={cn("w-full aspect-auto", large ? "h-80" : "h-44")} aria-label="Illustrative annual career cash flow over five years in Indian rupee lakh">
        <LineChart accessibilityLayer data={data} margin={{ top: 12, right: 14, bottom: 0, left: -22 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 5" stroke="var(--border)" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={13} fontSize={10} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={10} tickCount={5} />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="studies" stroke="var(--color-studies)" strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="corporate" stroke="var(--color-corporate)" strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="startup" stroke="var(--color-startup)" strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
      <div className="chart-legend" aria-hidden="true">
        <span><i className="bg-chart-1" />Studies</span>
        <span><i className="bg-chart-2" />Corporate</span>
        <span><i className="bg-chart-3" />Startup</span>
      </div>
    </div>
  )
}
