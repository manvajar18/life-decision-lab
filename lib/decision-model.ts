export type PathId = "studies" | "corporate" | "startup"
export type View = "overview" | "assessment" | "compare" | "simulator" | "roadmap" | "reports" | "auth" | "admin"
export type Scores = Record<PathId, number>
export type Answers = Record<number, number>

export interface UserData {
  userId: string
  answers: Answers
  step: number
  complete: boolean
  selectedPath: PathId
  assumptions: Assumptions
  checked: Record<string, boolean>
  updatedAt: string
}

export const paths = [
  {
    id: "studies" as const,
    name: "Higher studies",
    short: "Studies",
    eyebrow: "INVEST IN YOURSELF",
    description: "Go deeper into what you love. Build expertise that opens new doors.",
    tags: ["Deep expertise", "Long-term growth"],
    commitment: "1–2 years of study",
    upside: "Specialist skills and a stronger professional network",
    tradeoff: "Tuition costs and time away from full-time earnings",
    firstStep: "Shortlist three programs and speak to two recent graduates.",
    roadmap: [
      { period: "WEEK 1–2", title: "Find your area of focus", tasks: ["Write down the skills you want to build", "Compare three programs and their entry requirements", "Talk to two recent graduates about real outcomes"] },
      { period: "WEEK 3–4", title: "Make the numbers work", tasks: ["Build a tuition and living-cost budget", "Research scholarships and funding options", "Set aside an emergency buffer"] },
      { period: "MONTH 2", title: "Build your application", tasks: ["Plan entrance exams and application dates", "Draft your statement of purpose", "Ask for references and gather transcripts"] },
      { period: "MONTH 3", title: "Choose with confidence", tasks: ["Compare offers against your goals", "Validate the placement data yourself", "Plan your transition and submit your application"] },
    ],
  },
  {
    id: "corporate" as const,
    name: "Corporate career",
    short: "Corporate",
    eyebrow: "GROW WITH A TEAM",
    description: "Put your strengths to work. Find stability, mentorship, and momentum.",
    tags: ["Steady income", "Structured growth"],
    commitment: "Start earning sooner",
    upside: "Predictable income, hands-on experience, and mentorship",
    tradeoff: "Less autonomy and growth that depends on your employer",
    firstStep: "Choose two target roles and audit your skills against five job listings.",
    roadmap: [
      { period: "WEEK 1–2", title: "Define your next role", tasks: ["Choose two roles that match your strengths", "Review five job descriptions for common skills", "List the companies and cultures you want to explore"] },
      { period: "WEEK 3–4", title: "Tell your story", tasks: ["Update your résumé with measurable achievements", "Create one project that demonstrates a key skill", "Ask a mentor to review your portfolio"] },
      { period: "MONTH 2", title: "Create opportunities", tasks: ["Send five thoughtful applications each week", "Arrange three informational conversations", "Practice role-specific interview questions"] },
      { period: "MONTH 3", title: "Find the right fit", tasks: ["Compare total compensation and learning opportunities", "Ask about management style and team expectations", "Plan your first 90 days in the role"] },
    ],
  },
  {
    id: "startup" as const,
    name: "Entrepreneurship",
    short: "Startup",
    eyebrow: "BUILD SOMETHING YOURS",
    description: "Turn your what-if into what’s next. Create your own kind of impact.",
    tags: ["More autonomy", "Higher uncertainty"],
    commitment: "An open-ended journey",
    upside: "Ownership, creative freedom, and the possibility of scale",
    tradeoff: "Uncertain income, business risk, and significant responsibility",
    firstStep: "Interview five potential customers before investing in a solution.",
    roadmap: [
      { period: "WEEK 1–2", title: "Start with a real problem", tasks: ["Write a one-sentence problem statement", "Interview five potential customers", "Document how people solve the problem today"] },
      { period: "WEEK 3–4", title: "Test your assumptions", tasks: ["Create a small prototype or manual service", "Ask customers to try it and give feedback", "Set a maximum budget you can afford to lose"] },
      { period: "MONTH 2", title: "Find your first customers", tasks: ["Test a clear offer and a simple price", "Choose one customer acquisition channel", "Track revenue, delivery costs, and repeat interest"] },
      { period: "MONTH 3", title: "Decide what comes next", tasks: ["Review customer demand and your cash runway", "Get advice on taxes and legal requirements", "Choose whether to continue, change direction, or pause"] },
    ],
  },
]

export const questions = [
  { category: "Your motivation", title: "What would make your next chapter meaningful?", description: "Think about what genuinely excites you, rather than what looks good on paper.", options: [
    { label: "Becoming an expert in something I care about", hint: "Depth, discovery, and a new perspective", points: [5, 2, 2] },
    { label: "Growing my skills with a great team", hint: "Progress, collaboration, and shared goals", points: [2, 5, 2] },
    { label: "Bringing an idea of my own to life", hint: "Ownership, creativity, and independence", points: [2, 2, 5] },
  ] },
  { category: "Financial priorities", title: "How important is a predictable income right now?", description: "Choose what fits your actual circumstances, not an ideal future.", options: [
    { label: "I can invest in learning before earning", hint: "I have a plan to cover a period of study", points: [5, 2, 3] },
    { label: "A reliable monthly income is essential", hint: "Stability matters most at this stage", points: [1, 5, 1] },
    { label: "I have a buffer and can handle uncertainty", hint: "I can try something without steady returns", points: [3, 2, 5] },
  ] },
  { category: "Your working style", title: "Where do you tend to do your best work?", description: "Picture a recent day when you felt focused and fulfilled.", options: [
    { label: "Exploring a subject in depth", hint: "Researching, questioning, and connecting ideas", points: [5, 2, 2] },
    { label: "Working toward a shared, clear goal", hint: "Defined expectations and people to learn from", points: [2, 5, 2] },
    { label: "Figuring things out from a blank page", hint: "Experimenting and setting my own direction", points: [2, 2, 5] },
  ] },
  { category: "Risk and uncertainty", title: "How do you feel when the next step is unclear?", description: "There is no better personality here—just different preferences.", options: [
    { label: "I want to research before committing", hint: "Evidence and understanding help me move forward", points: [5, 3, 2] },
    { label: "I prefer a proven path with milestones", hint: "Clarity helps me put my energy into doing good work", points: [3, 5, 1] },
    { label: "I am comfortable testing and adapting", hint: "I can act before I have all the answers", points: [2, 2, 5] },
  ] },
  { category: "Learning and growth", title: "How would you most like to build new skills?", description: "Choose the learning environment you would look forward to.", options: [
    { label: "Through focused study and expert teaching", hint: "A curriculum, research, and thoughtful practice", points: [5, 2, 1] },
    { label: "Through real projects and mentorship", hint: "Learning alongside experienced colleagues", points: [2, 5, 3] },
    { label: "Through making things and trying them out", hint: "Direct feedback from customers and experiments", points: [2, 3, 5] },
  ] },
  { category: "Your time horizon", title: "When do you want to see tangible progress?", description: "Think about the pace that suits your responsibilities and goals.", options: [
    { label: "I can commit a year or two to a foundation", hint: "I am comfortable with a longer learning investment", points: [5, 2, 3] },
    { label: "I want a clear next step in the coming months", hint: "A role, an income, and measurable development", points: [1, 5, 2] },
    { label: "I want to start small and follow the evidence", hint: "Short experiments rather than a fixed timeline", points: [2, 3, 5] },
  ] },
  { category: "Your support system", title: "Which kind of support appeals to you most?", description: "None of these paths need to be a solo journey.", options: [
    { label: "Professors, peers, and an alumni community", hint: "A space built around knowledge and discovery", points: [5, 2, 2] },
    { label: "A manager, teammates, and a professional network", hint: "A team invested in shared success", points: [2, 5, 2] },
    { label: "Other founders, customers, and independent mentors", hint: "People who challenge and validate my ideas", points: [2, 2, 5] },
  ] },
  { category: "Your bigger picture", title: "Five years from now, what would you be proud of?", description: "Go with the future that feels most like you today.", options: [
    { label: "Having deep expertise and meaningful opportunities", hint: "I have invested in who I can become", points: [5, 3, 2] },
    { label: "Building a rewarding, sustainable career", hint: "I have progressed while keeping a solid foundation", points: [2, 5, 2] },
    { label: "Creating something valuable on my own terms", hint: "I have tested an idea and learned by doing", points: [2, 2, 5] },
  ] },
]

export function calculateScores(answers: Answers): Scores {
  const total = [0, 0, 0]
  questions.forEach((question, index) => {
    const choice = question.options[answers[index]]
    if (choice) choice.points.forEach((points, path) => { total[path] += points })
  })
  return {
    studies: Math.round(total[0] / (questions.length * 5) * 100),
    corporate: Math.round(total[1] / (questions.length * 5) * 100),
    startup: Math.round(total[2] / (questions.length * 5) * 100),
  }
}

export type Assumptions = {
  salary: number
  growth: number
  tuition: number
  investment: number
  startupGrowth: number
}

export const defaultAssumptions: Assumptions = { salary: 6, growth: 10, tuition: 8, investment: 5, startupGrowth: 50 }
export type Projection = { year: string; studies: number; corporate: number; startup: number }

export function getProjections(assumptions: Assumptions): Projection[] {
  const { salary, growth, tuition, investment, startupGrowth } = assumptions
  return Array.from({ length: 5 }, (_, year) => ({
    year: `Year ${year + 1}`,
    studies: Number((year < 2 ? -tuition / 2 : salary * 1.5 * (1 + growth / 100) ** (year - 2)).toFixed(2)),
    corporate: Number((salary * (1 + growth / 100) ** year).toFixed(2)),
    startup: Number((year === 0 ? -investment : 4.5 * (1 + startupGrowth / 100) ** (year - 1)).toFixed(2)),
  }))
}

export function formatLakh(amount: number) {
  return `${amount < 0 ? "−" : ""}₹${Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: 1 })}L`
}

export function getTotals(projections: Projection[]): Scores {
  return projections.reduce((totals, year) => ({ studies: totals.studies + year.studies, corporate: totals.corporate + year.corporate, startup: totals.startup + year.startup }), { studies: 0, corporate: 0, startup: 0 })
}

export const modelExplanation = "Illustrative scenarios, not forecasts. All amounts are annual and in INR lakh. Corporate income compounds at your chosen growth rate. Studies assumes two years with no earnings, half the tuition cost each year, then a starting salary 1.5 times the corporate starting salary at the same growth rate. Startup assumes an initial investment in year one, ₹4.5L of owner income in year two, and your chosen growth rate thereafter. Startup survival and income are not guaranteed; losses can exceed the investment. Taxes, inflation, living costs, loan interest, scholarships, and opportunity costs are excluded."
