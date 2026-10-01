// Generated from the original single-file app (index.html). Curated, fixed content —
// per the content model these definitions and answer keys are never AI-generated.

export const DESIGN_CATEGORIES = [
  "KPIs & Metrics",
  "Product Design",
  "Product/PM",
  "Business",
  "Revenue",
  "Interview Frameworks"
] as const;
export type DesignCategory = (typeof DESIGN_CATEGORIES)[number];

export type DesignCard = { id: string; cat: DesignCategory; term: string; def: string };
export type DesignQuestion = { id: string; c: DesignCategory; q: string; a: string; d: [string, string, string]; e: string; h: string };

export const DECK: DesignCard[] = [
 {
  "id": "c0",
  "cat": "KPIs & Metrics",
  "term": "KPI vs Metric",
  "def": "A metric is any number you track. A KPI is a metric tied to a specific goal you are accountable for. All KPIs are metrics; only goal-critical metrics are KPIs."
 },
 {
  "id": "c1",
  "cat": "KPIs & Metrics",
  "term": "North Star Metric",
  "def": "The single metric that best captures the core value your product delivers (Airbnb = nights booked, Spotify = time spent listening)."
 },
 {
  "id": "c2",
  "cat": "KPIs & Metrics",
  "term": "Vanity metric",
  "def": "A number that looks impressive but does not drive decisions (raw pageviews, total signups)."
 },
 {
  "id": "c3",
  "cat": "KPIs & Metrics",
  "term": "CAC (Customer Acquisition Cost)",
  "def": "The cost to acquire one paying customer. Compared against LTV to judge business health."
 },
 {
  "id": "c4",
  "cat": "KPIs & Metrics",
  "term": "Conversion Rate",
  "def": "The percentage of users who complete a desired action (signup, purchase, upgrade)."
 },
 {
  "id": "c5",
  "cat": "KPIs & Metrics",
  "term": "Funnel",
  "def": "The step-by-step path users take toward a goal; you measure drop-off at each step."
 },
 {
  "id": "c6",
  "cat": "KPIs & Metrics",
  "term": "Bounce Rate",
  "def": "The percentage of users who leave after viewing one page with no action."
 },
 {
  "id": "c7",
  "cat": "KPIs & Metrics",
  "term": "Activation Rate",
  "def": "The percentage of new users who reach first real value (the aha moment)."
 },
 {
  "id": "c8",
  "cat": "KPIs & Metrics",
  "term": "Aha Moment",
  "def": "The point at which a new user first genuinely feels the product’s core value."
 },
 {
  "id": "c9",
  "cat": "KPIs & Metrics",
  "term": "Time to Value (TTV)",
  "def": "How long it takes a new user to reach that first value. Shorter is better."
 },
 {
  "id": "c10",
  "cat": "KPIs & Metrics",
  "term": "DAU / WAU / MAU",
  "def": "Daily / Weekly / Monthly Active Users."
 },
 {
  "id": "c11",
  "cat": "KPIs & Metrics",
  "term": "Stickiness (DAU/MAU)",
  "def": "How habitual usage is. A higher ratio means monthly users return daily."
 },
 {
  "id": "c12",
  "cat": "KPIs & Metrics",
  "term": "Feature Adoption Rate",
  "def": "The percentage of users who use a specific feature."
 },
 {
  "id": "c13",
  "cat": "KPIs & Metrics",
  "term": "Retention Rate",
  "def": "The percentage of users still active after a given period."
 },
 {
  "id": "c14",
  "cat": "KPIs & Metrics",
  "term": "Churn Rate",
  "def": "The percentage of users who stop using or paying in a period. The opposite of retention."
 },
 {
  "id": "c15",
  "cat": "KPIs & Metrics",
  "term": "Cohort",
  "def": "A group of users grouped by when they joined, tracked over time."
 },
 {
  "id": "c16",
  "cat": "KPIs & Metrics",
  "term": "LTV / CLV (Customer Lifetime Value)",
  "def": "Total revenue expected from a customer over their whole relationship. Often compared to CAC."
 },
 {
  "id": "c17",
  "cat": "KPIs & Metrics",
  "term": "MRR / ARR",
  "def": "Monthly / Annual Recurring Revenue."
 },
 {
  "id": "c18",
  "cat": "KPIs & Metrics",
  "term": "ARPU",
  "def": "Average Revenue Per User."
 },
 {
  "id": "c19",
  "cat": "KPIs & Metrics",
  "term": "Expansion Revenue",
  "def": "Extra revenue from existing customers via upsell and cross-sell. Cheaper than new acquisition."
 },
 {
  "id": "c20",
  "cat": "KPIs & Metrics",
  "term": "Gross Margin / Burn Rate / Runway",
  "def": "Revenue left after direct costs / cash spent per month / months of cash remaining."
 },
 {
  "id": "c21",
  "cat": "KPIs & Metrics",
  "term": "NPS (Net Promoter Score)",
  "def": "“How likely are you to recommend us?” on a 0-10 scale. Measures loyalty."
 },
 {
  "id": "c22",
  "cat": "KPIs & Metrics",
  "term": "CSAT (Customer Satisfaction Score)",
  "def": "Satisfaction with a specific interaction."
 },
 {
  "id": "c23",
  "cat": "KPIs & Metrics",
  "term": "CES (Customer Effort Score)",
  "def": "How easy it was for a user to accomplish a task."
 },
 {
  "id": "c24",
  "cat": "KPIs & Metrics",
  "term": "SUS (System Usability Scale)",
  "def": "A standardized 10-question usability questionnaire, scored 0-100."
 },
 {
  "id": "c25",
  "cat": "KPIs & Metrics",
  "term": "Task Success Rate / Time on Task / Error Rate",
  "def": "The core usability-testing trio."
 },
 {
  "id": "c26",
  "cat": "Product Design",
  "term": "JTBD (Jobs To Be Done)",
  "def": "Framing needs as the “job” a user hires a product to do, rather than by demographics."
 },
 {
  "id": "c27",
  "cat": "Product Design",
  "term": "Design Thinking / Double Diamond",
  "def": "Discover, Define, Develop, Deliver. Diverge then converge, twice."
 },
 {
  "id": "c28",
  "cat": "Product Design",
  "term": "Persona",
  "def": "A research-based archetype representing a key user type."
 },
 {
  "id": "c29",
  "cat": "Product Design",
  "term": "User Journey Map",
  "def": "The stages a user moves through to reach a goal, with actions and emotions at each."
 },
 {
  "id": "c30",
  "cat": "Product Design",
  "term": "Empathy Map",
  "def": "What a user says, thinks, does, and feels."
 },
 {
  "id": "c31",
  "cat": "Product Design",
  "term": "Usability Testing",
  "def": "Watching real users attempt tasks to find friction and failure points."
 },
 {
  "id": "c32",
  "cat": "Product Design",
  "term": "A/B Test",
  "def": "Showing two versions to different users to see which performs better on a metric."
 },
 {
  "id": "c33",
  "cat": "Product Design",
  "term": "Information Architecture (IA)",
  "def": "How content and navigation are structured and organized."
 },
 {
  "id": "c34",
  "cat": "Product Design",
  "term": "User Flow",
  "def": "The path a user takes through screens to complete a task."
 },
 {
  "id": "c35",
  "cat": "Product Design",
  "term": "Wireframe vs Prototype",
  "def": "A wireframe is a low-detail layout; a prototype is an interactive mockup you can click through."
 },
 {
  "id": "c36",
  "cat": "Product Design",
  "term": "Fidelity",
  "def": "How finished something looks or behaves, from lo-fi (sketchy) to hi-fi (polished)."
 },
 {
  "id": "c37",
  "cat": "Product Design",
  "term": "Progressive Disclosure",
  "def": "Revealing complexity only as the user needs it, to reduce overwhelm."
 },
 {
  "id": "c38",
  "cat": "Product Design",
  "term": "Affordance / Signifier",
  "def": "What an element lets you do / the visual cue that tells you so."
 },
 {
  "id": "c39",
  "cat": "Product Design",
  "term": "Information Scent",
  "def": "Cues that reassure users they are on the right path toward their goal."
 },
 {
  "id": "c40",
  "cat": "Product Design",
  "term": "Design System",
  "def": "Reusable components, patterns, and rules that keep a product consistent and speed up delivery."
 },
 {
  "id": "c41",
  "cat": "Product Design",
  "term": "Design Tokens",
  "def": "Named variables for color, spacing, and type. The atoms of a design system, shared between design and code."
 },
 {
  "id": "c42",
  "cat": "Product Design",
  "term": "Atomic Design",
  "def": "A method: atoms to molecules to organisms to templates to pages."
 },
 {
  "id": "c43",
  "cat": "Product Design",
  "term": "Component / Variant",
  "def": "A reusable UI element / its different states (default, hover, disabled)."
 },
 {
  "id": "c44",
  "cat": "Product Design",
  "term": "Heuristic Evaluation",
  "def": "Reviewing a UI against established usability principles to find problems fast."
 },
 {
  "id": "c45",
  "cat": "Product Design",
  "term": "Nielsen’s 10 Heuristics",
  "def": "The classic usability checklist (visibility of status, match to real world, user control, consistency, error prevention, and so on)."
 },
 {
  "id": "c46",
  "cat": "Product Design",
  "term": "Accessibility / WCAG",
  "def": "Designing for all abilities. WCAG is the standard: contrast, tap-target size, focus states, screen-reader support."
 },
 {
  "id": "c47",
  "cat": "Product Design",
  "term": "Dark Pattern",
  "def": "UI that manipulates users into actions they did not intend."
 },
 {
  "id": "c48",
  "cat": "Product Design",
  "term": "Design Debt",
  "def": "Accumulated inconsistency and shortcuts that slow down future design work."
 },
 {
  "id": "c49",
  "cat": "Product Design",
  "term": "Handoff / Dev Mode",
  "def": "Passing specs, tokens, and assets to engineers to build from."
 },
 {
  "id": "c50",
  "cat": "Product/PM",
  "term": "Roadmap",
  "def": "The plan of what ships when, often framed as Now / Next / Later."
 },
 {
  "id": "c51",
  "cat": "Product/PM",
  "term": "Backlog",
  "def": "The prioritized list of work not yet done."
 },
 {
  "id": "c52",
  "cat": "Product/PM",
  "term": "Epic / User Story / Acceptance Criteria",
  "def": "A large chunk of work / a small user-framed requirement / the conditions that define when it is done."
 },
 {
  "id": "c53",
  "cat": "Product/PM",
  "term": "Sprint",
  "def": "A fixed work cycle, usually one to two weeks, delivering a shippable increment."
 },
 {
  "id": "c54",
  "cat": "Product/PM",
  "term": "Agile / Scrum / Kanban",
  "def": "Iterative delivery. Scrum uses sprints and ceremonies; Kanban uses a continuous flow board."
 },
 {
  "id": "c55",
  "cat": "Product/PM",
  "term": "Velocity / Story Points",
  "def": "How much a team completes per sprint / relative effort estimates for tasks."
 },
 {
  "id": "c56",
  "cat": "Product/PM",
  "term": "Feature Flag",
  "def": "A switch to turn a feature on or off without redeploying code."
 },
 {
  "id": "c57",
  "cat": "Product/PM",
  "term": "Scope Creep",
  "def": "Uncontrolled growth of a project’s requirements beyond the original plan."
 },
 {
  "id": "c58",
  "cat": "Product/PM",
  "term": "OKRs (Objectives & Key Results)",
  "def": "A goal plus measurable outcomes that prove you achieved it."
 },
 {
  "id": "c59",
  "cat": "Product/PM",
  "term": "Prioritization (RICE / MoSCoW / Kano)",
  "def": "RICE = Reach, Impact, Confidence, Effort. MoSCoW = Must/Should/Could/Won’t. Kano = basic/performance/delight."
 },
 {
  "id": "c60",
  "cat": "Product/PM",
  "term": "Discovery vs Delivery (Dual-track)",
  "def": "Figuring out what to build vs building it, run in parallel."
 },
 {
  "id": "c61",
  "cat": "Product/PM",
  "term": "Product-Market Fit (PMF)",
  "def": "When a product genuinely satisfies a strong market demand."
 },
 {
  "id": "c62",
  "cat": "Product/PM",
  "term": "Go-to-Market (GTM)",
  "def": "The plan for how a product will launch and reach customers."
 },
 {
  "id": "c63",
  "cat": "Product/PM",
  "term": "PRD (Product Requirements Doc)",
  "def": "The document defining what to build and why."
 },
 {
  "id": "c64",
  "cat": "Product/PM",
  "term": "Stakeholder",
  "def": "Anyone with a stake in the outcome: founders, engineers, sales, users."
 },
 {
  "id": "c65",
  "cat": "Business",
  "term": "B2B / B2C / B2B2C / D2C",
  "def": "Selling to businesses / consumers / businesses who serve consumers / direct to consumer."
 },
 {
  "id": "c66",
  "cat": "Business",
  "term": "SaaS",
  "def": "Software as a Service. Subscription-based software delivered over the web."
 },
 {
  "id": "c67",
  "cat": "Business",
  "term": "PLG (Product-Led Growth)",
  "def": "The product itself drives acquisition and expansion (free trials, freemium, self-serve)."
 },
 {
  "id": "c68",
  "cat": "Business",
  "term": "Freemium",
  "def": "A free tier plus paid upgrades."
 },
 {
  "id": "c69",
  "cat": "Business",
  "term": "TAM / SAM / SOM",
  "def": "Total / Serviceable / Obtainable market size."
 },
 {
  "id": "c70",
  "cat": "Business",
  "term": "Value Proposition / Positioning",
  "def": "The core promise you make to users / how you are framed against alternatives."
 },
 {
  "id": "c71",
  "cat": "Business",
  "term": "Moat / Network Effect",
  "def": "A durable competitive advantage / a product that gets more valuable as more people use it."
 },
 {
  "id": "c72",
  "cat": "Business",
  "term": "Flywheel",
  "def": "A self-reinforcing growth loop where each part feeds the next."
 },
 {
  "id": "c73",
  "cat": "Business",
  "term": "AARRR (Pirate Metrics)",
  "def": "Acquisition, Activation, Retention, Revenue, Referral."
 },
 {
  "id": "c74",
  "cat": "Revenue",
  "term": "Three ways a product makes more money",
  "def": "1) more users convert and activate, 2) users stay longer (retention), 3) users pay more (monetization). Design touches all three."
 },
 {
  "id": "c75",
  "cat": "Revenue",
  "term": "CRO (Conversion Rate Optimization)",
  "def": "Improving the percentage of users who complete a desired action, usually by reducing funnel friction."
 },
 {
  "id": "c76",
  "cat": "Revenue",
  "term": "Upsell / Cross-sell",
  "def": "Selling a higher tier / a complementary product to an existing customer."
 },
 {
  "id": "c77",
  "cat": "Revenue",
  "term": "Churn reduction / Retention",
  "def": "Keeping users active and paying longer. Directly grows LTV."
 },
 {
  "id": "c78",
  "cat": "Revenue",
  "term": "ARPU growth",
  "def": "Increasing average revenue per user through pricing, packaging, or expansion."
 },
 {
  "id": "c79",
  "cat": "Revenue",
  "term": "Pricing & Packaging",
  "def": "How tiers, features, and prices are structured to maximize conversion and revenue."
 },
 {
  "id": "c80",
  "cat": "Interview Frameworks",
  "term": "CIRCLES",
  "def": "Comprehend the situation, Identify the user, Report needs, Cut through prioritization, List solutions, Evaluate trade-offs, Summarize. For design/product exercises."
 },
 {
  "id": "c81",
  "cat": "Interview Frameworks",
  "term": "STAR",
  "def": "Situation, Task, Action, Result. For behavioral answers. Always end on a Result with a number."
 },
 {
  "id": "c82",
  "cat": "Interview Frameworks",
  "term": "Double Diamond",
  "def": "Discover, Define, Develop, Deliver. Use it to narrate your design process."
 },
 {
  "id": "c83",
  "cat": "Interview Frameworks",
  "term": "App critique approach",
  "def": "Structure any critique with Nielsen’s heuristics: pick a flow, walk it, name what works and what violates a heuristic, suggest a fix."
 },
 {
  "id": "c84",
  "cat": "Interview Frameworks",
  "term": "Product sense round",
  "def": "“Improve product X” or “design a feature for Z.” Tests strategic thinking, not pixels."
 }
];

export const QUIZ: DesignQuestion[] = [
 {
  "id": "q0",
  "c": "KPIs & Metrics",
  "q": "What turns an ordinary metric into a KPI?",
  "a": "It is tied to a specific goal someone is accountable for",
  "d": [
   "It appears on the executive dashboard",
   "It is measured daily rather than monthly",
   "It is broken down by user segment"
  ],
  "e": "All KPIs are metrics, but only goal-critical, owned metrics are KPIs.",
  "h": "The difference is about accountability, not about how the number is displayed."
 },
 {
  "id": "q1",
  "c": "KPIs & Metrics",
  "q": "“Nights booked” for Airbnb and “time spent listening” for Spotify are textbook examples of a…",
  "a": "North Star Metric",
  "d": [
   "Vanity metric",
   "Activation rate",
   "Stickiness ratio"
  ],
  "e": "A North Star Metric is the single number that best captures the core value the product delivers.",
  "h": "Each company picks exactly one of these."
 },
 {
  "id": "q2",
  "c": "KPIs & Metrics",
  "q": "Leadership celebrates hitting 2M pageviews, but no roadmap decision changes as a result. What is that number?",
  "a": "A vanity metric",
  "d": [
   "A North Star Metric",
   "An activation metric",
   "An expansion revenue metric"
  ],
  "e": "A vanity metric looks impressive but does not drive decisions — raw pageviews and total signups are the classics.",
  "h": "Ask what decision the number would ever change."
 },
 {
  "id": "q3",
  "c": "KPIs & Metrics",
  "q": "Which comparison is the standard health check for a subscription business?",
  "a": "LTV against CAC",
  "d": [
   "ARPU against MRR",
   "Bounce rate against churn rate",
   "Burn rate against runway"
  ],
  "e": "Lifetime value is weighed against the cost to acquire that customer — if CAC approaches LTV, growth is unprofitable.",
  "h": "One side is what a customer is worth, the other is what they cost to win."
 },
 {
  "id": "q4",
  "c": "KPIs & Metrics",
  "q": "Churn rate is best described as…",
  "a": "The percentage of users who stop using or paying in a period",
  "d": [
   "The percentage of users still active after a period",
   "The percentage who leave after viewing one page",
   "The percentage who reach first real value"
  ],
  "e": "Churn is the mirror image of retention: retention counts who stayed, churn counts who left.",
  "h": "It is the exact opposite of one of the other options."
 },
 {
  "id": "q5",
  "c": "KPIs & Metrics",
  "q": "A DAU/MAU ratio of 0.6 tells you…",
  "a": "Usage is highly habitual — monthly users come back most days",
  "d": [
   "60% of new users reach the aha moment",
   "60% of trials convert to paid",
   "60% of revenue comes from existing customers"
  ],
  "e": "DAU/MAU is the stickiness ratio: the higher it is, the more monthly users return daily.",
  "h": "The metric is nicknamed “stickiness”."
 },
 {
  "id": "q6",
  "c": "KPIs & Metrics",
  "q": "A new user imports their contacts, sends a first message, and finally understands why the product exists. That specific point is the…",
  "a": "Aha moment",
  "d": [
   "Activation rate",
   "Time to value",
   "Conversion rate"
  ],
  "e": "The aha moment is the point of first felt value; activation rate is the percentage who reach it, and time to value is how long it takes.",
  "h": "Three of these are related — only one names the moment itself rather than measuring it."
 },
 {
  "id": "q7",
  "c": "KPIs & Metrics",
  "q": "A team cuts onboarding from six steps to two so people reach first value faster. Which metric are they directly optimizing?",
  "a": "Time to Value (TTV)",
  "d": [
   "Bounce rate",
   "Feature adoption rate",
   "Gross margin"
  ],
  "e": "TTV measures how long a new user takes to reach first value — shorter is better.",
  "h": "The word “faster” is the clue."
 },
 {
  "id": "q8",
  "c": "KPIs & Metrics",
  "q": "You group everyone who signed up in March and track their retention for six months. That group is a…",
  "a": "Cohort",
  "d": [
   "Persona",
   "Funnel",
   "Empathy map"
  ],
  "e": "A cohort is users grouped by when they joined, then tracked over time.",
  "h": "The grouping is by join date, not by attitude or behaviour type."
 },
 {
  "id": "q9",
  "c": "KPIs & Metrics",
  "q": "Which survey asks “How likely are you to recommend us?” on a 0–10 scale?",
  "a": "NPS",
  "d": [
   "CSAT",
   "CES",
   "SUS"
  ],
  "e": "NPS measures loyalty and advocacy with the recommendation question.",
  "h": "It sorts people into promoters and detractors."
 },
 {
  "id": "q10",
  "c": "KPIs & Metrics",
  "q": "A support chat ends and the user is asked to rate that conversation. Which metric fits best?",
  "a": "CSAT",
  "d": [
   "NPS",
   "SUS",
   "Retention rate"
  ],
  "e": "CSAT measures satisfaction with one specific interaction; NPS measures overall loyalty to the brand.",
  "h": "The scope is a single interaction, not the whole relationship."
 },
 {
  "id": "q11",
  "c": "KPIs & Metrics",
  "q": "Which metric asks how much effort it took a user to get something done?",
  "a": "CES (Customer Effort Score)",
  "d": [
   "CSAT",
   "NPS",
   "Task success rate"
  ],
  "e": "CES is specifically about how easy or hard it was to accomplish the task.",
  "h": "The name says it."
 },
 {
  "id": "q12",
  "c": "KPIs & Metrics",
  "q": "Which is a standardized 10-question questionnaire scored from 0 to 100?",
  "a": "SUS (System Usability Scale)",
  "d": [
   "NPS",
   "CES",
   "Heuristic evaluation"
  ],
  "e": "SUS is the standard usability questionnaire — fixed wording, fixed length, comparable scores.",
  "h": "It is a scale, and its score is out of 100."
 },
 {
  "id": "q13",
  "c": "KPIs & Metrics",
  "q": "Which trio is the core set of usability-testing measures?",
  "a": "Task success rate, time on task, error rate",
  "d": [
   "Acquisition, activation, retention",
   "Reach, impact, confidence",
   "Daily, weekly, monthly active users"
  ],
  "e": "Those three capture whether people succeeded, how long it took, and how often they slipped up.",
  "h": "They describe what happens while someone attempts a task."
 },
 {
  "id": "q14",
  "c": "KPIs & Metrics",
  "q": "Expansion revenue comes from…",
  "a": "Existing customers buying more through upsell and cross-sell",
  "d": [
   "New customers acquired during a launch",
   "Revenue left after direct costs",
   "Annualizing monthly recurring revenue"
  ],
  "e": "Expansion revenue grows accounts you already have, which is cheaper than new acquisition.",
  "h": "No new logos are involved."
 },
 {
  "id": "q15",
  "c": "KPIs & Metrics",
  "q": "Runway is…",
  "a": "The number of months of cash remaining at the current burn",
  "d": [
   "The cash spent per month",
   "Revenue left after direct costs",
   "Total revenue expected from a customer"
  ],
  "e": "Burn rate is the monthly spend; runway is how many months that cash buys you.",
  "h": "It is measured in time, not money."
 },
 {
  "id": "q16",
  "c": "KPIs & Metrics",
  "q": "Activation rate measures…",
  "a": "The percentage of new users who reach first real value",
  "d": [
   "The percentage of all users who use a specific feature",
   "The percentage of visitors who complete a purchase",
   "The percentage of users still active after 30 days"
  ],
  "e": "Activation is about new users crossing the first-value threshold, not about purchases or long-term retention.",
  "h": "It is scoped to new users only."
 },
 {
  "id": "q17",
  "c": "KPIs & Metrics",
  "q": "Bounce rate counts users who…",
  "a": "Leave after viewing one page without taking action",
  "d": [
   "Cancel their subscription within a period",
   "Sign up but never pay",
   "Complete a purchase then never return"
  ],
  "e": "A bounce is a single-page, no-action visit — it says nothing about paying or cancelling.",
  "h": "It is a single-page-session measure."
 },
 {
  "id": "q18",
  "c": "KPIs & Metrics",
  "q": "A funnel is most useful because it lets you…",
  "a": "See exactly which step users drop off at on the way to a goal",
  "d": [
   "Compare two design variants on one metric",
   "Group users by their signup date",
   "Score a UI against usability principles"
  ],
  "e": "A funnel breaks a goal into steps so you can measure drop-off at each one.",
  "h": "The value is in step-by-step comparison."
 },
 {
  "id": "q19",
  "c": "Product Design",
  "q": "Jobs To Be Done frames user needs by…",
  "a": "The job a user hires the product to do",
  "d": [
   "Demographic segments like age and income",
   "What a user says, thinks, does and feels",
   "The stages a user moves through toward a goal"
  ],
  "e": "JTBD deliberately replaces demographic framing with the underlying job the user is trying to get done.",
  "h": "The word “hires” is doing the work."
 },
 {
  "id": "q20",
  "c": "Product Design",
  "q": "What are the four stages of the Double Diamond, in order?",
  "a": "Discover, Define, Develop, Deliver",
  "d": [
   "Acquisition, Activation, Retention, Revenue",
   "Reach, Impact, Confidence, Effort",
   "Situation, Task, Action, Result"
  ],
  "e": "Two diamonds: diverge to Discover then converge to Define; diverge to Develop then converge to Deliver.",
  "h": "All four words start with the same letter."
 },
 {
  "id": "q21",
  "c": "Product Design",
  "q": "“Diverge, then converge — twice” describes which model?",
  "a": "The Double Diamond",
  "d": [
   "Atomic Design",
   "The AARRR funnel",
   "Dual-track agile"
  ],
  "e": "Each diamond is one widen-then-narrow cycle: problem space first, solution space second.",
  "h": "The shape of two diamonds side by side."
 },
 {
  "id": "q22",
  "c": "Product Design",
  "q": "An empathy map captures…",
  "a": "What a user says, thinks, does and feels",
  "d": [
   "The stages of a user’s journey with emotions at each",
   "A research-based archetype of a key user type",
   "The screens a user passes through to finish a task"
  ],
  "e": "Four quadrants — says, thinks, does, feels — to build shared understanding of one user.",
  "h": "It is four quadrants, not a timeline."
 },
 {
  "id": "q23",
  "c": "Product Design",
  "q": "The key difference between a wireframe and a prototype is that a prototype…",
  "a": "Is interactive and can be clicked through",
  "d": [
   "Uses final brand colors and real copy",
   "Is always drawn by hand",
   "Includes engineering specs and tokens"
  ],
  "e": "Wireframe = low-detail static layout; prototype = interactive mockup. Fidelity is a separate axis.",
  "h": "Do not confuse this with lo-fi versus hi-fi."
 },
 {
  "id": "q24",
  "c": "Product Design",
  "q": "In design, “fidelity” refers to…",
  "a": "How finished something looks or behaves, from sketchy to polished",
  "d": [
   "How closely a build matches the design file",
   "How accurate your user research sample is",
   "How consistent components are across a product"
  ],
  "e": "Fidelity runs lo-fi to hi-fi and applies to both visuals and behaviour.",
  "h": "It is a spectrum from sketch to polish."
 },
 {
  "id": "q25",
  "c": "Product Design",
  "q": "Hiding advanced settings behind an “Advanced” panel so first-time users are not overwhelmed is an example of…",
  "a": "Progressive disclosure",
  "d": [
   "Information scent",
   "A dark pattern",
   "Atomic design"
  ],
  "e": "Progressive disclosure reveals complexity only as the user needs it.",
  "h": "Complexity is revealed on demand rather than removed."
 },
 {
  "id": "q26",
  "c": "Product Design",
  "q": "A button looks pressable because of its raised styling. The raised styling itself is the…",
  "a": "Signifier",
  "d": [
   "Affordance",
   "Design token",
   "Heuristic"
  ],
  "e": "The affordance is what the element lets you do; the signifier is the visual cue that tells you so.",
  "h": "One is the possibility, the other is the clue."
 },
 {
  "id": "q27",
  "c": "Product Design",
  "q": "Breadcrumbs and clear link labels that reassure users they are heading the right way provide good…",
  "a": "Information scent",
  "d": [
   "Information architecture",
   "Progressive disclosure",
   "Affordance"
  ],
  "e": "Information scent is the cues that confirm a user is on the right path toward their goal.",
  "h": "The metaphor is following a trail."
 },
 {
  "id": "q28",
  "c": "Product Design",
  "q": "Design tokens are best described as…",
  "a": "Named variables for color, spacing and type, shared between design and code",
  "d": [
   "Reusable UI components and their states",
   "The rules for how a team hands off to engineering",
   "Atoms, molecules and organisms in a component hierarchy"
  ],
  "e": "Tokens are the atoms of a design system — one named value, used identically in Figma and in code.",
  "h": "They are values, not components."
 },
 {
  "id": "q29",
  "c": "Product Design",
  "q": "What is the correct order in Atomic Design?",
  "a": "Atoms → molecules → organisms → templates → pages",
  "d": [
   "Tokens → components → variants → screens",
   "Discover → define → develop → deliver",
   "Wireframe → prototype → handoff → build"
  ],
  "e": "Brad Frost’s hierarchy builds from the smallest element up to complete pages.",
  "h": "It borrows its vocabulary from chemistry and biology."
 },
 {
  "id": "q30",
  "c": "Product Design",
  "q": "Which method finds usability problems without involving any real users?",
  "a": "Heuristic evaluation",
  "d": [
   "Usability testing",
   "A/B testing",
   "A CES survey"
  ],
  "e": "Heuristic evaluation is an expert review against established principles — fast, cheap, and user-free.",
  "h": "An expert reviews the interface against a checklist."
 },
 {
  "id": "q31",
  "c": "Product Design",
  "q": "Nielsen’s 10 heuristics include “visibility of system status” and “match between the system and the real world.” They are used to…",
  "a": "Review an interface against established usability principles",
  "d": [
   "Measure how loyal customers are",
   "Estimate the effort of a backlog item",
   "Structure a behavioral interview answer"
  ],
  "e": "They are the classic checklist for spotting usability problems quickly — and the backbone of a good app critique.",
  "h": "Think of it as a usability checklist."
 },
 {
  "id": "q32",
  "c": "Product Design",
  "q": "A checkout flow that pre-ticks a paid add-on and hides the opt-out is an example of…",
  "a": "A dark pattern",
  "d": [
   "Progressive disclosure",
   "Design debt",
   "A conversion funnel"
  ],
  "e": "A dark pattern manipulates users into actions they did not intend.",
  "h": "It boosts conversion at the user’s expense."
 },
 {
  "id": "q33",
  "c": "Product Design",
  "q": "Four slightly different button styles have crept into the product, and every new screen takes longer to design. That is…",
  "a": "Design debt",
  "d": [
   "Scope creep",
   "A design system",
   "Design handoff"
  ],
  "e": "Design debt is accumulated inconsistency and shortcuts that slow future design work.",
  "h": "It is the design equivalent of technical debt."
 },
 {
  "id": "q34",
  "c": "Product Design",
  "q": "Information architecture is about…, while a user flow is about…",
  "a": "How content and navigation are structured / the path taken through screens to finish a task",
  "d": [
   "The path taken through screens / how content is structured",
   "Component reuse / component states",
   "Research archetypes / emotional highs and lows"
  ],
  "e": "IA is the structure of the content; a user flow is the route someone takes through it.",
  "h": "One is the map, the other is the journey across it."
 },
 {
  "id": "q35",
  "c": "Product Design",
  "q": "WCAG is the standard that covers things like…",
  "a": "Contrast ratios, tap-target size, focus states and screen-reader support",
  "d": [
   "Component naming and token structure",
   "Sprint ceremonies and story estimation",
   "Funnel drop-off and conversion tracking"
  ],
  "e": "WCAG is the accessibility standard: designing so people of all abilities can use the product.",
  "h": "It is about who can use the interface at all."
 },
 {
  "id": "q36",
  "c": "Product Design",
  "q": "You show half your users a new pricing page and half the old one, then compare upgrade rate. That is…",
  "a": "An A/B test",
  "d": [
   "A usability test",
   "A heuristic evaluation",
   "A cohort analysis"
  ],
  "e": "An A/B test compares two versions on a metric across different users.",
  "h": "Two versions, two groups, one metric."
 },
 {
  "id": "q37",
  "c": "Product Design",
  "q": "What is the main purpose of a design system?",
  "a": "Reusable components, patterns and rules that keep the product consistent and speed up delivery",
  "d": [
   "A prioritized list of design work not yet started",
   "A record of what users say, think, do and feel",
   "A document defining what to build and why"
  ],
  "e": "A design system is the shared library plus the rules for using it — consistency and speed, together.",
  "h": "It is a library plus its rules."
 },
 {
  "id": "q38",
  "c": "Product Design",
  "q": "A persona is…",
  "a": "A research-based archetype representing a key user type",
  "d": [
   "A single real customer you interviewed",
   "A group of users tracked by signup date",
   "A map of what a user says, thinks, does and feels"
  ],
  "e": "Personas are grounded in research and stand in for a whole user type, not one individual.",
  "h": "The word “archetype” matters, and so does “research-based”."
 },
 {
  "id": "q39",
  "c": "Product/PM",
  "q": "What does RICE stand for?",
  "a": "Reach, Impact, Confidence, Effort",
  "d": [
   "Reach, Investment, Cost, Execution",
   "Revenue, Impact, Conversion, Engagement",
   "Research, Ideate, Create, Evaluate"
  ],
  "e": "RICE scores each item on those four factors so priorities are comparable rather than argued.",
  "h": "The last letter is the one you divide by."
 },
 {
  "id": "q40",
  "c": "Product/PM",
  "q": "MoSCoW prioritization sorts work into…",
  "a": "Must, Should, Could, Won’t",
  "d": [
   "Basic, performance, delight",
   "Now, next, later",
   "Reach, impact, confidence, effort"
  ],
  "e": "MoSCoW is a commitment-level split; the capital letters are the categories.",
  "h": "The lowercase letters in the acronym are filler."
 },
 {
  "id": "q41",
  "c": "Product/PM",
  "q": "The Kano model classifies features as…",
  "a": "Basic, performance and delight",
  "d": [
   "Must, should, could and won’t",
   "Now, next and later",
   "Discovery and delivery"
  ],
  "e": "Kano separates what users take for granted, what they trade off, and what surprises them.",
  "h": "One of the three categories is about pleasant surprise."
 },
 {
  "id": "q42",
  "c": "Product/PM",
  "q": "A well-formed OKR consists of…",
  "a": "An objective plus measurable key results that prove it was achieved",
  "d": [
   "A prioritized list of features for the quarter",
   "A goal plus the tasks needed to reach it",
   "A metric plus the team accountable for it"
  ],
  "e": "The objective sets direction; the key results are the evidence, and they must be measurable.",
  "h": "The second half must be measurable outcomes, not activities."
 },
 {
  "id": "q43",
  "c": "Product/PM",
  "q": "Dual-track agile means…",
  "a": "Discovery and delivery run in parallel",
  "d": [
   "Design and engineering work in separate sprints",
   "Two teams ship to two platforms at once",
   "Scrum and Kanban are used side by side"
  ],
  "e": "One track figures out what to build while the other builds — continuously, not in sequence.",
  "h": "The two tracks are two different kinds of work, not two teams."
 },
 {
  "id": "q44",
  "c": "Product/PM",
  "q": "A feature flag lets a team…",
  "a": "Turn a feature on or off without redeploying code",
  "d": [
   "Estimate the relative effort of a task",
   "Mark a story as ready for release",
   "Track which users adopted a feature"
  ],
  "e": "Flags decouple deploying code from releasing a feature to users.",
  "h": "It is a runtime switch."
 },
 {
  "id": "q45",
  "c": "Product/PM",
  "q": "Halfway through the sprint the project has quietly grown three extra requirements nobody planned. That is…",
  "a": "Scope creep",
  "d": [
   "Design debt",
   "Velocity drift",
   "Backlog grooming"
  ],
  "e": "Scope creep is uncontrolled growth of requirements beyond the original plan.",
  "h": "The problem is the growth being uncontrolled, not the work being hard."
 },
 {
  "id": "q46",
  "c": "Product/PM",
  "q": "The main difference between Scrum and Kanban is that…",
  "a": "Scrum works in fixed sprints with ceremonies; Kanban uses continuous flow on a board",
  "d": [
   "Scrum is for engineers, Kanban is for designers",
   "Scrum estimates in hours, Kanban in story points",
   "Scrum has no backlog, Kanban does"
  ],
  "e": "Both are agile; the difference is fixed time-boxes and ceremonies versus continuous flow.",
  "h": "One is time-boxed, the other is not."
 },
 {
  "id": "q47",
  "c": "Product/PM",
  "q": "Acceptance criteria are…",
  "a": "The conditions that define when a story is done",
  "d": [
   "A large chunk of work spanning several sprints",
   "A small user-framed requirement",
   "The document defining what to build and why"
  ],
  "e": "Epic = the big chunk, user story = the small requirement, acceptance criteria = the done conditions.",
  "h": "They settle arguments about whether something is finished."
 },
 {
  "id": "q48",
  "c": "Product/PM",
  "q": "Velocity tells a team…",
  "a": "How much work they typically complete per sprint",
  "d": [
   "How much effort a single task will take",
   "How fast users move through a funnel",
   "How quickly new users reach first value"
  ],
  "e": "Velocity is a team throughput measure; story points are the per-task relative effort estimate.",
  "h": "It is measured per sprint, at the team level."
 },
 {
  "id": "q49",
  "c": "Product/PM",
  "q": "Product-market fit means…",
  "a": "The product genuinely satisfies a strong market demand",
  "d": [
   "The product is profitable on a per-customer basis",
   "The product has launched in every target market",
   "The product matches competitor feature parity"
  ],
  "e": "PMF is about real, strong demand — not profitability or feature parity.",
  "h": "It is about demand, not economics."
 },
 {
  "id": "q50",
  "c": "Product/PM",
  "q": "“Now / Next / Later” is a common way to frame a…",
  "a": "Roadmap",
  "d": [
   "Backlog",
   "Sprint",
   "PRD"
  ],
  "e": "Now/Next/Later expresses sequence and confidence without pretending to know exact dates.",
  "h": "It is about what ships when."
 },
 {
  "id": "q51",
  "c": "Product/PM",
  "q": "A go-to-market plan covers…",
  "a": "How a product will launch and reach its customers",
  "d": [
   "What to build and why",
   "Which work is prioritized this quarter",
   "How components and tokens are structured"
  ],
  "e": "GTM is the launch and distribution plan; the PRD is the build definition.",
  "h": "It starts where building ends."
 },
 {
  "id": "q52",
  "c": "Business",
  "q": "Product-led growth means…",
  "a": "The product itself drives acquisition and expansion, through free trials, freemium and self-serve",
  "d": [
   "Sales reps drive expansion inside existing accounts",
   "The product roadmap is set by the design team",
   "Growth comes mainly from paid marketing channels"
  ],
  "e": "In PLG the product is the primary go-to-market motion, not sales or marketing.",
  "h": "Ask what does the selling."
 },
 {
  "id": "q53",
  "c": "Business",
  "q": "TAM, SAM and SOM stand for…",
  "a": "Total, Serviceable and Obtainable market size",
  "d": [
   "Target, Segment and Optimal market size",
   "Total, Sales and Operating margin",
   "Trial, Subscription and Onboarding metrics"
  ],
  "e": "They narrow from everyone who could ever buy, to who you can serve, to who you can realistically win.",
  "h": "They get smaller in that order."
 },
 {
  "id": "q54",
  "c": "Business",
  "q": "A messaging app becomes more valuable to each user as more of their friends join. That is a…",
  "a": "Network effect",
  "d": [
   "Flywheel",
   "Moat",
   "Freemium model"
  ],
  "e": "A network effect is value that grows with the number of users; it can create a moat, but it is not the same thing.",
  "h": "One option is the general category of durable advantage; this is the specific mechanism."
 },
 {
  "id": "q55",
  "c": "Business",
  "q": "What does AARRR (Pirate Metrics) stand for?",
  "a": "Acquisition, Activation, Retention, Revenue, Referral",
  "d": [
   "Awareness, Adoption, Retention, Revenue, Renewal",
   "Acquisition, Activation, Referral, Renewal, Revenue",
   "Attention, Action, Retention, Revenue, Reach"
  ],
  "e": "It maps the whole customer lifecycle from first touch to bringing others in.",
  "h": "The last step is what a happy user does for you."
 },
 {
  "id": "q56",
  "c": "Business",
  "q": "A flywheel is…",
  "a": "A self-reinforcing loop where each part feeds the next",
  "d": [
   "A durable advantage competitors cannot copy",
   "A step-by-step path with drop-off at each stage",
   "A fixed work cycle that ships an increment"
  ],
  "e": "Unlike a funnel, which leaks at each step, a flywheel compounds — the output feeds the input.",
  "h": "Contrast it with a funnel."
 },
 {
  "id": "q57",
  "c": "Business",
  "q": "A value proposition is…, while positioning is…",
  "a": "The core promise you make to users / how you are framed against alternatives",
  "d": [
   "How you are framed against alternatives / the core promise you make",
   "Your pricing tiers / your target segment",
   "Your brand voice / your visual identity"
  ],
  "e": "The value prop stands alone; positioning is always relative to competitors and substitutes.",
  "h": "One of the two only makes sense in comparison to something else."
 },
 {
  "id": "q58",
  "c": "Business",
  "q": "A company sells software to clinics, which their patients then use. That model is…",
  "a": "B2B2C",
  "d": [
   "B2C",
   "D2C",
   "B2B"
  ],
  "e": "You sell to a business, but consumers are the end users — business to business to consumer.",
  "h": "Count the hops from you to the end user."
 },
 {
  "id": "q59",
  "c": "Business",
  "q": "Freemium means…",
  "a": "A permanently free tier alongside paid upgrades",
  "d": [
   "A time-limited free trial of the paid product",
   "Free for the first cohort of users only",
   "Free for consumers, paid for businesses"
  ],
  "e": "The free tier persists — that is what separates freemium from a trial.",
  "h": "The distinction is whether the free access expires."
 },
 {
  "id": "q60",
  "c": "Revenue",
  "q": "What are the three ways a product makes more money?",
  "a": "More users convert and activate, users stay longer, users pay more",
  "d": [
   "Raise prices, cut costs, expand to new markets",
   "More traffic, more features, more marketing spend",
   "Better design, better engineering, better support"
  ],
  "e": "Conversion, retention and monetization — and design work can move all three.",
  "h": "Think acquisition-side, time-side and price-side."
 },
 {
  "id": "q61",
  "c": "Revenue",
  "q": "CRO usually works by…",
  "a": "Reducing friction in the funnel so more users complete a desired action",
  "d": [
   "Raising prices on the highest-value tier",
   "Increasing traffic to the top of the funnel",
   "Reducing the cost of acquiring each customer"
  ],
  "e": "Conversion rate optimization improves the percentage who convert, typically by removing friction — not by adding traffic.",
  "h": "It changes the rate, not the volume coming in."
 },
 {
  "id": "q62",
  "c": "Revenue",
  "q": "Moving a customer from the Pro plan to Enterprise is…; selling them a companion product is…",
  "a": "Upsell / cross-sell",
  "d": [
   "Cross-sell / upsell",
   "Expansion / retention",
   "Activation / conversion"
  ],
  "e": "Upsell moves them up a tier; cross-sell adds something alongside.",
  "h": "“Up” means up the ladder of the same product."
 },
 {
  "id": "q63",
  "c": "Revenue",
  "q": "Reducing churn directly increases which metric?",
  "a": "LTV",
  "d": [
   "CAC",
   "Bounce rate",
   "Activation rate"
  ],
  "e": "Customers who stay longer keep paying longer, so lifetime value rises.",
  "h": "Longer relationships mean more total revenue per customer."
 },
 {
  "id": "q64",
  "c": "Revenue",
  "q": "ARPU growth is typically achieved through…",
  "a": "Pricing, packaging or expansion revenue",
  "d": [
   "Lowering acquisition cost per channel",
   "Improving onboarding completion",
   "Increasing daily active users"
  ],
  "e": "ARPU is revenue per user, so it moves when each user pays more — not when you simply add users.",
  "h": "Adding more users at the same price does not move this metric."
 },
 {
  "id": "q65",
  "c": "Interview Frameworks",
  "q": "In the CIRCLES framework, what does the first C stand for?",
  "a": "Comprehend the situation",
  "d": [
   "Clarify the constraints",
   "Cut through prioritization",
   "Critique the current product"
  ],
  "e": "CIRCLES opens by comprehending the situation before anything else; “Cut through prioritization” is the later C.",
  "h": "Two steps in CIRCLES start with C — this is the opening one."
 },
 {
  "id": "q66",
  "c": "Interview Frameworks",
  "q": "Which is the correct CIRCLES sequence?",
  "a": "Comprehend, Identify the user, Report needs, Cut through prioritization, List solutions, Evaluate trade-offs, Summarize",
  "d": [
   "Comprehend, Ideate, Refine, Critique, List, Evaluate, Ship",
   "Clarify, Investigate, Research, Create, Launch, Evaluate, Scale",
   "Context, Insight, Requirements, Concepts, Layout, Evaluate, Sell"
  ],
  "e": "It walks from understanding the situation, through user and needs, to solutions and trade-offs, ending in a summary.",
  "h": "Notice that it identifies the user before proposing anything."
 },
 {
  "id": "q67",
  "c": "Interview Frameworks",
  "q": "STAR stands for…",
  "a": "Situation, Task, Action, Result",
  "d": [
   "Situation, Tension, Approach, Reflection",
   "Story, Task, Analysis, Resolution",
   "Scope, Timeline, Action, Review"
  ],
  "e": "STAR structures behavioral answers — and the Result should carry a number.",
  "h": "The last step is the one interviewers actually remember."
 },
 {
  "id": "q68",
  "c": "Interview Frameworks",
  "q": "You are asked “Tell me about a time you disagreed with an engineer.” Which framework fits?",
  "a": "STAR",
  "d": [
   "CIRCLES",
   "Double Diamond",
   "AARRR"
  ],
  "e": "STAR is for behavioral answers; CIRCLES is for product and design exercises.",
  "h": "The question is about your past behaviour, not a product problem."
 },
 {
  "id": "q69",
  "c": "Interview Frameworks",
  "q": "The strongest way to structure an app critique is to…",
  "a": "Pick one flow, walk it, name what works and what violates a heuristic, then suggest a fix",
  "d": [
   "List everything you would visually redesign, screen by screen",
   "Compare the app against its three closest competitors",
   "Rank the app’s features by RICE score"
  ],
  "e": "Anchoring on a single flow and Nielsen’s heuristics keeps the critique specific and defensible rather than a matter of taste.",
  "h": "It should be grounded in principles, not preferences."
 },
 {
  "id": "q70",
  "c": "Interview Frameworks",
  "q": "A “product sense” round like “design a feature for Z” is mainly testing…",
  "a": "Strategic thinking — user, problem and trade-offs",
  "d": [
   "Visual craft and pixel precision",
   "Speed at producing hi-fi mockups",
   "Knowledge of the interviewer’s design system"
  ],
  "e": "These rounds test how you think about users and trade-offs, not how the screens look.",
  "h": "The interviewer barely looks at the pixels."
 },
 {
  "id": "q71",
  "c": "Interview Frameworks",
  "q": "Which framework would you use to narrate your design process end to end?",
  "a": "Double Diamond",
  "d": [
   "STAR",
   "AARRR",
   "RICE"
  ],
  "e": "Discover, Define, Develop, Deliver gives a clean spine for walking through how you worked.",
  "h": "It is the one built out of design phases."
 }
];
