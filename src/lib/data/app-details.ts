import type { z } from "zod"
import { catalogApps } from "@/lib/data/apps"
import type { appDetailsSchema } from "@/lib/schemas/app"

/*
 * Per-app content for the App Details popup. Copy, product screens and EVI
 * scenes are adapted from evoq.one (ProductsGrid, ai-sections/product-configs).
 * Release notes and platforms are placeholders until a real release feed exists.
 */

type DetailsInput = z.input<typeof appDetailsSchema>

const SITE = "https://evoq.one/products"
const PLATFORMS = ["Web", "Windows", "macOS"]

const links = (slug: string, extra: ("features" | "pricing")[] = []) => [
  { label: "Website", href: `${SITE}/${slug}` },
  ...extra.map((e) => ({ label: e === "features" ? "Features" : "Pricing", href: `${SITE}/${slug}/${e}` })),
]

/** Deployed apps get a single link to the live app instead of the marketing site. */
const catalogById = new Map(catalogApps.map((a) => [a.id, a]))
const appLink = (id: string) => [{ label: "Open app", href: catalogById.get(id)!.productUrl }]

/** Standard three-slide gallery for apps without real screenshots. */
const drawn = (name: string, workspace: string) => [
  { kind: "window" as const, caption: workspace },
  { kind: "overview" as const, caption: `${name} at a glance` },
  { kind: "evi" as const, caption: `EVI and the ${name} agent at work` },
]

const release = (slug: string, changes: string[]) => ({
  platforms: PLATFORMS,
  changes,
  changelogUrl: `${SITE}/${slug}`,
})

export const appDetails: Record<string, DetailsInput> = {
  crm: {
    id: "crm",
    headline: "Every account, enquiry and deal, moving in one pipeline.",
    about: "Manage customer accounts, enquiries, opportunities and follow-ups throughout the sales process. EVI finds stalled deals and Ava, the follow-up agent, drafts the next step for your review.",
    features: [
      { title: "Pipeline you can see", body: "Kanban, list and grid views of every deal, grouped by stage, with owners, values and closing dates on each card." },
      { title: "Leads to deals", body: "Capture leads with their source and industry, then convert to a deal so the opportunity starts from the lead's details." },
      { title: "Accounts and contacts", body: "One record per customer with contacts, calls, meetings and tasks, so the whole history is in one place." },
      { title: "Follow-ups that happen", body: "Tasks, reminders and meeting notes tied to the deal. Nothing relies on someone remembering." },
      { title: "AI built in", body: "Ask EVI which deals have gone quiet. Ava drafts follow-ups and updates records, then returns them for approval." },
    ],
    links: appLink("crm"),
    gallery: [
      { kind: "image", src: "/screens/crm-pipeline.webp", caption: "Deals pipeline in Kanban view" },
      { kind: "image", src: "/screens/crm-leads.webp", caption: "Leads list with filters and views" },
      { kind: "image", src: "/screens/crm-dashboard.webp", caption: "Sales dashboard" },
      { kind: "evi", caption: "EVI and Ava, the follow-up agent" },
    ],
    window: { title: "Deals", subtitle: "Sales opportunities moving through the pipeline", action: "New deal", nav: ["Dashboard", "Leads", "Deals", "Accounts", "Tasks"], layout: "board", columns: [
      { name: "Lead", items: [{ title: "Acme Corp.", meta: "$24k" }, { title: "Summit Labs", meta: "$18k" }] },
      { name: "Qualified", items: [{ title: "Beta Inc.", meta: "$52k", tag: "9 days idle", flag: true }, { title: "Orion Foods", meta: "$31k" }] },
      { name: "Proposal", items: [{ title: "Northgate Logistics", meta: "$74k", tag: "12 days idle", flag: true }, { title: "Halo Health", meta: "$27k" }] },
      { name: "Negotiation", items: [{ title: "Vertex Retail", meta: "$41k", tag: "8 days idle", flag: true }, { title: "Kite Energy", meta: "$63k" }] },
    ] },
    stats: [{ label: "Open deals", value: "48" }, { label: "Pipeline value", value: "$1.2M" }, { label: "Won this month", value: "$186k" }, { label: "Follow-ups due", value: "12" }],
    scene: { question: "Which deals have gone quiet?", answer: "**3 deals** have had no activity for over a week, worth **$167k**. Northgate Logistics is the largest.", steps: [{ text: "48 deals reviewed", done: true }, { text: "3 follow-ups drafted", done: true }, { text: "Awaiting your approval", done: false }] },
    release: release("crm", ["Kanban cards show idle days for each deal", "Convert to deal keeps the lead's source and industry", "Faster filtering on large lead lists"]),
  },

  campaigns: {
    id: "campaigns",
    headline: "Plan, launch and measure campaigns that reach the right people.",
    about: "Plan and launch marketing campaigns to reach prospective customers and support demand generation. Audiences come straight from CRM, so every response lands back on the right record.",
    features: [
      { title: "Campaign planning", body: "Set goals, audiences, channels and dates in one plan, and see every campaign on a shared calendar." },
      { title: "Segments from CRM", body: "Build audiences from accounts, leads and past responses without exporting lists." },
      { title: "Email and outreach", body: "Design emails, schedule sends and follow up automatically when someone engages." },
      { title: "Results that tie to revenue", body: "Opens, clicks and replies roll up to the leads and deals each campaign created." },
    ],
    links: appLink("campaigns"),
    gallery: drawn("Campaigns", "Campaign list with audience and status"),
    window: { title: "Campaigns", subtitle: "6 active · 2 scheduled", action: "New campaign", nav: ["Overview", "Campaigns", "Audiences", "Templates", "Reports"], layout: "list", rows: [
      { title: "Autumn product launch", meta: "Email · 4,200 contacts", value: "38% open", tag: "Active" },
      { title: "Webinar: field service", meta: "Email + LinkedIn", value: "212 sign-ups", tag: "Active" },
      { title: "Win-back, lapsed accounts", meta: "Email · 860 contacts", value: "9% reply", tag: "Low reply", flag: true },
      { title: "Partner newsletter", meta: "Email · 1,150 contacts", value: "Nov 20", tag: "Scheduled" },
      { title: "Year-end offer", meta: "Email · 5,800 contacts", value: "Dec 2", tag: "Draft" },
    ] },
    stats: [{ label: "Active campaigns", value: "6" }, { label: "Contacts reached", value: "18.4k" }, { label: "Avg. open rate", value: "34%" }, { label: "Leads created", value: "327" }],
    scene: { question: "Which campaign is underperforming?", answer: "**Win-back, lapsed accounts** has a **9% reply rate**, half the usual. A shorter subject line tested better last quarter.", steps: [{ text: "6 campaigns compared", done: true }, { text: "New subject lines drafted", done: true }, { text: "Awaiting your approval", done: false }] },
    release: release("campaigns", ["Audience builder reads CRM segments directly", "Send-time suggestions per contact", "Campaign calendar export"]),
  },

  configx: {
    id: "configx",
    headline: "Configure products, show every option and quote with confidence.",
    about: "Configure products, visualise options, calculate pricing and prepare customer quotes. Rules keep every configuration buildable, and quotes flow on to CRM and Billing.",
    features: [
      { title: "Guided configuration", body: "Step customers or sales teams through options with rules that only allow valid combinations." },
      { title: "Visual configurators", body: "2D, 3D and AR views that update as options change, so customers see exactly what they order." },
      { title: "Pricing that adds up", body: "Option prices, discounts and margins calculated live, with approval rules for exceptions." },
      { title: "Quotes in minutes", body: "Generate branded quotes from the configuration and send them from the deal in CRM." },
    ],
    links: links("configx"),
    gallery: drawn("ConfigX", "Quote list with configured products"),
    window: { title: "Quotes", subtitle: "14 open · $412k quoted", action: "New quote", nav: ["Products", "Rules", "Quotes", "Price lists", "Reports"], layout: "list", rows: [
      { title: "Q-1084 Sliding door system", meta: "Harbor & Pine Clinics", value: "$18,400", tag: "Sent" },
      { title: "Q-1086 Steel enclosure, 3 bay", meta: "Northgate Logistics", value: "$42,900", tag: "Needs approval", flag: true },
      { title: "Q-1087 Automatic gate", meta: "Lakeview Hotel", value: "$9,750", tag: "Draft" },
      { title: "Q-1089 Modular sofa, 5 seat", meta: "Brightloom Retail", value: "$6,200", tag: "Accepted" },
      { title: "Q-1090 E-scooter fleet x20", meta: "Kite Energy", value: "$31,000", tag: "Sent" },
    ] },
    stats: [{ label: "Open quotes", value: "14" }, { label: "Quoted value", value: "$412k" }, { label: "Win rate", value: "41%" }, { label: "Avg. time to quote", value: "18 min" }],
    scene: { question: "Why does Q-1086 need approval?", answer: "The discount is **14%**, above the **10% limit** for this product line. Margin stays at **22%**.", steps: [{ text: "Pricing rules checked", done: true }, { text: "Approval note drafted", done: true }, { text: "Waiting for sales manager", done: false }] },
    release: release("configx", ["AR preview on mobile browsers", "Margin warnings on quote lines", "Faster rule evaluation for large catalogs"]),
  },

  serviceops: {
    id: "serviceops",
    headline: "Requests, dispatch and visits, from first call to completed job.",
    about: "Manage work orders, technician dispatch, maintenance activities and service visits. EVI spots jobs at risk and Kai, the dispatch agent, prepares the schedule for your review.",
    features: [
      { title: "Every request in one queue", body: "Web forms, the customer portal, email and phone requests land in one list with site, source and work type." },
      { title: "Dispatch board", body: "A day timeline per technician with zones, workload and a map, so you can schedule in a few clicks." },
      { title: "Work orders and visits", body: "Checklists, parts, photos and sign-off on every visit, with SLAs tracked from the first call." },
      { title: "Maintenance plans", body: "Recurring visits are generated automatically and placed on the schedule ahead of time." },
      { title: "AI built in", body: "Kai suggests dispatch, drafts customer updates and flags SLAs at risk, then waits for approval." },
    ],
    links: appLink("serviceops"),
    gallery: [
      { kind: "image", src: "/screens/serviceops-requests.png", caption: "Requests from every channel" },
      { kind: "image", src: "/screens/serviceops-dispatch.png", caption: "Dispatch timeline by technician" },
      { kind: "overview", caption: "ServiceOps at a glance" },
      { kind: "evi", caption: "EVI and Kai, the dispatch agent" },
    ],
    window: { title: "Work orders", subtitle: "Today · 18 visits · 7 of 8 technicians free", action: "New work order", nav: ["Requests", "Dispatch", "Work orders", "Sites", "Reports"], layout: "board", columns: [
      { name: "Open", items: [{ title: "WO-1042 HVAC", meta: "Northgate", tag: "No technician", flag: true }, { title: "WO-1043 Boiler", meta: "Halo Health" }] },
      { name: "Scheduled", items: [{ title: "WO-1038 Chiller", meta: "Tomorrow 9:00" }, { title: "WO-1039 Panel", meta: "Tomorrow 11:30" }] },
      { name: "In progress", items: [{ title: "WO-1031 Pump", meta: "Ravi K.", tag: "SLA in 2h", flag: true }, { title: "WO-1033 Fan", meta: "Maya S." }] },
      { name: "Completed", items: [{ title: "WO-1027 Valve", meta: "Today" }, { title: "WO-1024 Duct", meta: "Today" }] },
    ] },
    stats: [{ label: "Open requests", value: "23" }, { label: "Visits today", value: "18" }, { label: "SLA on time", value: "96%" }, { label: "First-time fix", value: "88%" }],
    scene: { question: "Which jobs are at risk today?", answer: "**2 work orders** are at risk: **WO-1042** has no technician and **WO-1031** is 2 hours from its SLA.", steps: [{ text: "18 visits checked", done: true }, { text: "Dispatch suggestion ready", done: true }, { text: "Awaiting your approval", done: false }] },
    release: release("serviceops", ["Optimize the day: one-click dispatch suggestions", "Map view on the dispatch board", "Customer portal requests show the site address"]),
  },

  projects: {
    id: "projects",
    headline: "Plan the work, share the load and deliver on time.",
    about: "Plan and coordinate project tasks, responsibilities and delivery-related work. Timesheets and milestones connect to HRMS and Billing, so effort turns into invoices.",
    features: [
      { title: "Plans and milestones", body: "Break projects into phases, tasks and milestones, with owners and dependencies." },
      { title: "Boards and timelines", body: "Switch between a Kanban board and a timeline to see what is moving and what is blocked." },
      { title: "Timesheets", body: "Log time against tasks and see budget versus actual for every project." },
      { title: "Status without chasing", body: "EVI summarises progress and the status agent sends owners a reminder before work slips." },
    ],
    links: appLink("projects"),
    gallery: drawn("Projects", "Project board by stage"),
    window: { title: "Website relaunch", subtitle: "Phase 2 of 3 · due Dec 15", action: "New task", nav: ["My work", "Projects", "Timeline", "Timesheets", "Reports"], layout: "board", columns: [
      { name: "To do", items: [{ title: "Vendor contract", meta: "Due Fri" }, { title: "Test plan", meta: "Due Mon" }] },
      { name: "In progress", items: [{ title: "API integration", meta: "Due yesterday", tag: "Overdue", flag: true }, { title: "Dashboard UI", meta: "Due Thu" }] },
      { name: "Review", items: [{ title: "Release notes", meta: "Due Wed" }, { title: "Data migration", meta: "3 days late", tag: "Overdue", flag: true }] },
      { name: "Done", items: [{ title: "Kickoff deck", meta: "Done" }, { title: "Scope sign-off", meta: "Done" }] },
    ] },
    stats: [{ label: "Active projects", value: "12" }, { label: "Tasks this week", value: "86" }, { label: "On schedule", value: "83%" }, { label: "Hours logged", value: "1,140" }],
    scene: { question: "What is blocking the relaunch?", answer: "**2 tasks are overdue**: API integration and Data migration. Both wait on the vendor contract.", steps: [{ text: "Project reviewed", done: true }, { text: "Owner reminders drafted", done: true }, { text: "Awaiting your approval", done: false }] },
    release: release("projects", ["Timeline view with dependencies", "Budget vs actual on every project", "Overdue tasks highlighted on boards"]),
  },

  desk: {
    id: "desk",
    headline: "Answer the right ticket first, and keep every customer in the loop.",
    about: "Track customer enquiries, product questions and service issues through resolution. EVI surfaces urgent tickets and related history, and agents draft replies for review.",
    features: [
      { title: "One inbox", body: "Email, portal and chat tickets in one queue, with priorities, SLAs and assignment rules." },
      { title: "Customer context", body: "See the account, recent orders and open work orders from CRM and ServiceOps next to the ticket." },
      { title: "Knowledge base", body: "Publish answers once and suggest them on tickets and in the customer portal." },
      { title: "AI triage and replies", body: "The triage agent sorts new tickets and the reply agent drafts answers for an agent to send." },
    ],
    links: appLink("desk"),
    gallery: drawn("Desk", "Ticket board by status"),
    window: { title: "Tickets", subtitle: "34 open · 2 near SLA", action: "New ticket", nav: ["Inbox", "Tickets", "Customers", "Knowledge", "Reports"], layout: "board", columns: [
      { name: "New", items: [{ title: "Login failure", meta: "Orion Foods", tag: "Urgent", flag: true }, { title: "Invoice question", meta: "Acme Corp." }] },
      { name: "Open", items: [{ title: "Report export", meta: "Beta Inc.", tag: "2h to SLA", flag: true }, { title: "User access", meta: "Summit Labs" }] },
      { name: "Pending", items: [{ title: "Data import", meta: "Kite Energy" }, { title: "API key", meta: "Vertex Retail" }] },
      { name: "Resolved", items: [{ title: "Password reset", meta: "Today" }, { title: "Billing address", meta: "Today" }] },
    ] },
    stats: [{ label: "Open tickets", value: "34" }, { label: "First response", value: "42 min" }, { label: "Resolved today", value: "27" }, { label: "CSAT", value: "4.7" }],
    scene: { question: "Which ticket should I answer first?", answer: "**Login failure** from Orion Foods is urgent and blocks **14 users**. A similar issue was fixed last week.", steps: [{ text: "34 tickets triaged", done: true }, { text: "Reply drafted from the fix", done: true }, { text: "Awaiting your review", done: false }] },
    release: release("desk", ["SLA timers on the ticket board", "Suggested articles while typing a reply", "Merge duplicate tickets"]),
  },

  bookings: {
    id: "bookings",
    headline: "Appointments, rooms and resources on one schedule.",
    about: "Let customers book appointments and teams reserve spaces, with rules for availability, buffers and approvals. Confirmations and reminders go out automatically.",
    features: [
      { title: "Online booking", body: "A booking page for every service, with live availability and instant confirmation." },
      { title: "Spaces and resources", body: "Rooms, desks and equipment on a floor plan, with capacity and booking rules." },
      { title: "Reminders that cut no-shows", body: "Email and SMS reminders, easy rescheduling and a waitlist for cancelled slots." },
      { title: "One calendar", body: "Staff, rooms and appointments on a single schedule that syncs with Google Calendar." },
    ],
    links: appLink("bookings"),
    gallery: drawn("Bookings", "Today's appointments"),
    window: { title: "Appointments", subtitle: "Today · 26 booked · 3 slots free", action: "New booking", nav: ["Calendar", "Appointments", "Spaces", "Services", "Reports"], layout: "list", rows: [
      { title: "09:00 Initial consultation", meta: "Dr. Hana Kim · Room 2", value: "45 min", tag: "Confirmed" },
      { title: "09:30 Hall A, team offsite", meta: "Marcus Bell · 18 people", value: "4 h", tag: "Clash on Friday", flag: true },
      { title: "10:15 Follow-up visit", meta: "Priya Nair · Room 1", value: "30 min", tag: "Confirmed" },
      { title: "11:00 Equipment demo", meta: "Lakeview Hotel", value: "60 min", tag: "Reminder sent" },
      { title: "13:30 Design review", meta: "Meeting room 4", value: "90 min", tag: "Pending approval", flag: true },
    ] },
    stats: [{ label: "Booked today", value: "26" }, { label: "Utilisation", value: "78%" }, { label: "No-show rate", value: "3%" }, { label: "Waitlist", value: "5" }],
    scene: { question: "Can Hall A take the Friday offsite?", answer: "**Hall A is blocked on Friday** by a maintenance booking. **Hall B** fits 20 people and is free all day.", steps: [{ text: "Availability checked", done: true }, { text: "Alternative held for 24h", done: true }, { text: "Awaiting your confirmation", done: false }] },
    release: release("bookings", ["Floor plan view for spaces", "Waitlist fills cancelled slots automatically", "Google Calendar two-way sync"]),
  },

  hrms: {
    id: "hrms",
    headline: "Employee records, leave and onboarding without the paperwork.",
    about: "Manage employee information and workforce administration. EVI answers policy questions and Sana, the onboarding agent, prepares every new joiner's checklist.",
    features: [
      { title: "Employee records", body: "One profile per person with role, team, documents and history." },
      { title: "Leave and attendance", body: "Requests, balances and approvals, with team coverage shown before anyone says yes." },
      { title: "Onboarding", body: "Checklists for IT, equipment and training so every joiner is ready on day one." },
      { title: "Reviews and probation", body: "Scheduled reviews, goals and probation dates with reminders for managers." },
    ],
    links: appLink("hrms"),
    gallery: drawn("HRMS", "People directory with open requests"),
    window: { title: "People", subtitle: "142 employees · 3 starting soon", action: "Add employee", nav: ["Home", "People", "Leave", "Onboarding", "Reports"], layout: "list", rows: [
      { title: "Sophia Hale", meta: "Starts Mon · Sales", tag: "Onboarding open", flag: true },
      { title: "Daniel Cruz", meta: "Starts Mon · Support", tag: "Laptop pending", flag: true },
      { title: "Priya Nair", meta: "Leave request · 3 days", tag: "Awaiting manager" },
      { title: "Noah Brooks", meta: "Review due Friday", tag: "Scheduled" },
      { title: "Emily Carter", meta: "Probation ends Oct 14", tag: "On track" },
    ] },
    stats: [{ label: "Employees", value: "142" }, { label: "On leave today", value: "6" }, { label: "Starting soon", value: "3" }, { label: "Open requests", value: "9" }],
    scene: { question: "Who starts next week?", answer: "**3 people** start on Monday. **2 have onboarding tasks open**, including a laptop that has not been ordered.", steps: [{ text: "3 joiners reviewed", done: true }, { text: "Checklists prepared", done: true }, { text: "1 order needs approval", done: false }] },
    release: release("hrms", ["Team coverage shown on leave requests", "Onboarding checklists per role", "Document expiry reminders"]),
  },

  skillberry: {
    id: "skillberry",
    headline: "Learning that keeps up with the work your people do.",
    about: "Support employee learning, training and skills development. Courses link to roles in HRMS, so everyone sees what to learn next and managers see where skills are thin.",
    features: [
      { title: "Courses and paths", body: "Build courses from video, documents and quizzes, and group them into learning paths by role." },
      { title: "Skills matrix", body: "See skills across teams and spot gaps before a project needs them." },
      { title: "Compliance training", body: "Assign required training, track completion and send reminders before certificates expire." },
      { title: "Learn anywhere", body: "Lessons work on any device, and progress picks up where people left off." },
    ],
    links: links("skillberry"),
    gallery: drawn("Skillberry", "Assigned courses and progress"),
    window: { title: "Learning", subtitle: "24 courses · 6 due this month", action: "New course", nav: ["My learning", "Courses", "Paths", "Skills", "Reports"], layout: "list", rows: [
      { title: "Workplace safety 2026", meta: "Required · all staff", value: "92%", tag: "On track" },
      { title: "Data protection basics", meta: "Required · 38 people", value: "61%", tag: "Due in 5 days", flag: true },
      { title: "Field service onboarding", meta: "Path · technicians", value: "74%", tag: "In progress" },
      { title: "Negotiation skills", meta: "Optional · sales", value: "40%", tag: "In progress" },
      { title: "First-aid refresher", meta: "Certificate · 12 people", value: "3 expiring", tag: "Expiring", flag: true },
    ] },
    stats: [{ label: "Active learners", value: "128" }, { label: "Completion", value: "81%" }, { label: "Courses", value: "24" }, { label: "Skills tracked", value: "56" }],
    scene: { question: "Who is behind on required training?", answer: "**15 people** have not finished **Data protection basics**, due in 5 days. Most are in the support team.", steps: [{ text: "Completion checked", done: true }, { text: "Reminders drafted", done: true }, { text: "Awaiting your approval", done: false }] },
    release: release("skillberry", ["Skills matrix by team", "Certificate expiry reminders", "Resume lessons on any device"]),
  },

  billing: {
    id: "billing",
    headline: "Invoices out on time, and payments in sooner.",
    about: "Manage invoicing, payments and revenue-related activity. EVI finds overdue invoices and Rohan, the collections agent, prepares reminders for your approval.",
    features: [
      { title: "Invoicing", body: "Create invoices from deals, work orders or timesheets, with taxes, discounts and recurring schedules." },
      { title: "Payments", body: "Card, bank and tap-to-pay, with payment links on every invoice and automatic reconciliation." },
      { title: "Receivables in view", body: "Aging, outstanding balances and cash forecasts on one dashboard." },
      { title: "Tax and compliance", body: "Tax rules per region, credit notes and an audit trail on every change." },
      { title: "Collections with AI", body: "Rohan drafts reminders that match each customer's history, then waits for approval." },
    ],
    links: appLink("billing"),
    gallery: drawn("Billing", "Invoices with outstanding balances"),
    window: { title: "Invoices", subtitle: "$214,300 outstanding", action: "New invoice", nav: ["Overview", "Invoices", "Payments", "Customers", "Reports"], layout: "list", rows: [
      { title: "INV-2041 Acme Corp.", meta: "Due Sept 12", value: "$12,400", tag: "14 days overdue", flag: true },
      { title: "INV-2044 Northgate Logistics", meta: "Due Sept 18", value: "$38,900", tag: "8 days overdue", flag: true },
      { title: "INV-2046 Beta Inc.", meta: "Due Sept 30", value: "$9,750", tag: "Due soon" },
      { title: "INV-2049 Halo Health", meta: "Due Oct 04", value: "$21,600", tag: "Sent" },
      { title: "INV-2052 Kite Energy", meta: "Due Oct 15", value: "$63,000", tag: "Draft" },
    ] },
    stats: [{ label: "Outstanding", value: "$214k" }, { label: "Overdue", value: "$96k" }, { label: "Paid this month", value: "$388k" }, { label: "Avg. days to pay", value: "24" }],
    scene: { question: "Which invoices are overdue?", answer: "**7 invoices** are overdue, worth **$96,350**. Northgate Logistics and Acme Corp. are the largest.", steps: [{ text: "7 invoices reviewed", done: true }, { text: "7 reminders drafted", done: true }, { text: "2 need your approval", done: false }] },
    release: release("billing", ["Tap-to-pay on mobile", "Payment links on every invoice", "Receivables aging by customer"]),
  },

  inventory: {
    id: "inventory",
    headline: "Know what is in stock, what is running low and what to reorder.",
    about: "Track stock and supply information relevant to product availability and fulfilment. EVI spots low stock early and the replenishment agent prepares the reorder.",
    features: [
      { title: "Stock across locations", body: "Live quantities per warehouse, van and site, with transfers between them." },
      { title: "Reorder points", body: "Set minimums per item and get purchase orders suggested before you run out." },
      { title: "Purchase orders", body: "Raise, approve and receive orders against suppliers, with partial deliveries handled." },
      { title: "Connected to the work", body: "Parts used on ServiceOps visits and items on Billing invoices update stock automatically." },
    ],
    links: appLink("inventory"),
    gallery: drawn("Inventory", "Stock levels against reorder points"),
    window: { title: "Stock levels", subtitle: "1,240 items · 8 below reorder", action: "Add item", nav: ["Overview", "Items", "Locations", "Purchase orders", "Suppliers"], layout: "list", rows: [
      { title: "SKU-1182 Hydraulic hose", meta: "Reorder at 40", value: "12 left", tag: "Low stock", flag: true },
      { title: "SKU-2204 Filter pack", meta: "Reorder at 60", value: "27 left", tag: "Low stock", flag: true },
      { title: "SKU-3317 Sensor kit", meta: "Reorder at 25", value: "88 left", tag: "In stock" },
      { title: "SKU-4120 Gasket set", meta: "Reorder at 50", value: "140 left", tag: "In stock" },
      { title: "SKU-5008 Cable reel", meta: "Reorder at 20", value: "9 left", tag: "Low stock", flag: true },
    ] },
    stats: [{ label: "Items", value: "1,240" }, { label: "Below reorder", value: "8" }, { label: "Stock value", value: "$642k" }, { label: "Open POs", value: "11" }],
    scene: { question: "What is below reorder level?", answer: "**8 items** are below reorder level. The **hydraulic hose** will run out in about 4 days.", steps: [{ text: "1,240 items scanned", done: true }, { text: "8 reorders prepared", done: true }, { text: "3 need your approval", done: false }] },
    release: release("inventory", ["Van and site stock locations", "Suggested purchase orders", "Partial receipts on purchase orders"]),
  },

  sync: {
    id: "sync",
    headline: "Keep EVOQ and the systems you already use in step.",
    about: "Synchronise data between EVOQ products and existing systems through supported integrations. Leo, the sync agent, finds why a sync broke and prepares the fix.",
    features: [
      { title: "Ready-made connectors", body: "Shopify, WooCommerce, Stripe, Google Calendar, WhatsApp and more, set up in minutes." },
      { title: "Field mapping", body: "Map fields between systems visually, with transforms for formats and units." },
      { title: "Health you can see", body: "Every connection shows its last run, record counts and errors, with alerts when something stops." },
      { title: "Fixes with AI", body: "Leo traces a failed sync to the record and field that broke it and drafts the correction." },
    ],
    links: appLink("sync"),
    gallery: drawn("Sync", "Connections and their health"),
    window: { title: "Connections", subtitle: "9 connected · 1 needs attention", action: "Add connection", nav: ["Overview", "Connections", "Mappings", "Logs", "Settings"], layout: "list", rows: [
      { title: "Shopify → Inventory", meta: "Every 5 min · 1,240 items", value: "2 min ago", tag: "Healthy" },
      { title: "Stripe → Billing", meta: "Real time · payments", value: "Just now", tag: "Healthy" },
      { title: "WooCommerce → CRM", meta: "Hourly · customers", value: "3 h ago", tag: "Failing", flag: true },
      { title: "Google Calendar ↔ Bookings", meta: "Real time · 4 calendars", value: "1 min ago", tag: "Healthy" },
      { title: "QuickBooks → Billing", meta: "Daily · invoices", value: "Today 02:00", tag: "Healthy" },
    ] },
    stats: [{ label: "Connections", value: "9" }, { label: "Records today", value: "48.2k" }, { label: "Success rate", value: "99.4%" }, { label: "Needs attention", value: "1" }],
    scene: { question: "Why did the WooCommerce sync fail?", answer: "**3 customer records** have a phone number in an unsupported format. The rest of the run succeeded.", steps: [{ text: "Run log traced", done: true }, { text: "Field fix prepared", done: true }, { text: "Awaiting your approval", done: false }] },
    release: release("sync", ["Visual field mapping", "Alerts when a connection stops", "WhatsApp connector"]),
  },

  ai: {
    id: "ai",
    headline: "Ask EVI, hand work to agents, and keep a person in charge.",
    about: "Ask EVI for help, assign work to AI agents, or let AI work automatically across your products. Every agent prepares the work and returns it for review before anything is sent.",
    features: [
      { title: "EVI, your assistant", body: "Ask about deals, tickets, stock or people in plain language and get answers from your own EVOQ data." },
      { title: "Agents for defined tasks", body: "Follow-ups, dispatch, collections, onboarding and sync fixes, each handled by its own agent." },
      { title: "A person approves", body: "Agents prepare the work and wait for approval. Nothing reaches a customer without a yes." },
      { title: "Across every product", body: "EVI works inside every installed EVOQ app, with context that crosses product lines." },
    ],
    links: appLink("ai"),
    gallery: drawn("EVOQ AI", "Agents and the work waiting for review"),
    window: { title: "Agent activity", subtitle: "5 agents · 7 items awaiting review", action: "Assign work", nav: ["Ask EVI", "Agents", "Reviews", "Automations", "Settings"], layout: "list", rows: [
      { title: "Ava · 3 follow-up drafts", meta: "CRM · Northgate, Beta, Vertex", value: "2 min ago", tag: "Awaiting review", flag: true },
      { title: "Kai · dispatch plan for tomorrow", meta: "ServiceOps · 18 visits", value: "10 min ago", tag: "Awaiting review", flag: true },
      { title: "Rohan · 7 payment reminders", meta: "Billing · $96,350 overdue", value: "25 min ago", tag: "2 approved" },
      { title: "Sana · 3 onboarding checklists", meta: "HRMS · starting Monday", value: "1 h ago", tag: "Approved" },
      { title: "Leo · WooCommerce field fix", meta: "Sync · 3 records", value: "3 h ago", tag: "Awaiting review" },
    ] },
    stats: [{ label: "Agents active", value: "5" }, { label: "Awaiting review", value: "7" }, { label: "Hours saved", value: "41" }, { label: "Approved this week", value: "126" }],
    scene: { question: "What needs my approval today?", answer: "**7 items** from **4 agents**: follow-ups from Ava, tomorrow's dispatch plan from Kai and two reminders from Rohan.", steps: [{ text: "Agent work collected", done: true }, { text: "Grouped by product", done: true }, { text: "Awaiting your review", done: false }] },
    release: release("ai", ["Review queue across all agents", "EVI answers with links to the source record", "Sana, the onboarding agent, for HRMS"]),
  },

  healthcare: {
    id: "healthcare",
    headline: "Patient care, scheduling and admissions, connected in one platform.",
    about: "The Unified Healthcare Platform brings patient records, scheduling, admissions and care coordination together, so clinical teams work from the same data. It shares patients with Healthcare PMS for billing and front-desk work.",
    features: [
      { title: "Patient records", body: "One record per patient with visit history, care plans and results, available across every care setting." },
      { title: "Scheduling & admissions", body: "Appointments, admissions and bed management on one calendar, with reminders that cut no-shows." },
      { title: "Care coordination", body: "Referrals, results and follow-ups routed to the right clinician, with nothing lost between departments." },
      { title: "AI built in", body: "Ask EVI about a patient's history or pending results, in plain language." },
    ],
    links: [
      { label: "Open app", href: "https://healthcare-unified-platform.vercel.app/" },
      { label: "Healthcare solution", href: "https://evoq.one/solutions/healthcare" },
    ],
    gallery: [
      { kind: "window", caption: "Patient schedule across departments" },
      { kind: "overview", caption: "Unified Healthcare Platform at a glance" },
      { kind: "evi", caption: "EVI inside the Unified Healthcare Platform" },
    ],
    window: { title: "Patients", subtitle: "Today · 46 visits · 3 admissions", action: "New patient", nav: ["Overview", "Patients", "Appointments", "Billing", "Reports"], layout: "list", rows: [
      { title: "Maria Lopez · Follow-up", meta: "Cardiology · Room 4", value: "09:30", tag: "Checked in" },
      { title: "James Carter · Admission", meta: "Orthopedics · Bed 12B", value: "Today", tag: "Pending bed", flag: true },
      { title: "Priya Nair · Lab results", meta: "Internal medicine", value: "Ready", tag: "Awaiting review", flag: true },
      { title: "Claim #30421", meta: "Healthcare PMS · Aetna", value: "$1,240", tag: "Submitted" },
      { title: "Noah Brooks · Check-up", meta: "Pediatrics · Room 2", value: "11:15", tag: "Confirmed" },
    ] },
    stats: [{ label: "Visits today", value: "46" }, { label: "Beds occupied", value: "82%" }, { label: "Claims this week", value: "128" }, { label: "Avg. wait time", value: "11 min" }],
    scene: { question: "Which patients are waiting on results?", answer: "**2 patients** have lab results ready for review, including **Priya Nair**'s panel from this morning.", steps: [{ text: "Results matched to charts", done: true }, { text: "Clinician notified", done: true }, { text: "Awaiting sign-off", done: false }] },
    release: { platforms: PLATFORMS, changes: ["Shared patient search with Healthcare PMS", "Bed management board for admissions", "Results routed to the ordering clinician"], changelogUrl: "https://healthcare-unified-platform.vercel.app/" },
  },

  "healthcare-pms": {
    id: "healthcare-pms",
    headline: "Front desk, appointments, billing and claims for every practice.",
    about: "Healthcare PMS runs the practice side of care: patient registration, appointments, billing and insurance claims. It shares patients with the Unified Healthcare Platform, so the front desk and clinicians see the same record.",
    features: [
      { title: "Front desk and registration", body: "Check patients in, capture insurance details and keep demographics up to date." },
      { title: "Appointments", body: "Book, reschedule and confirm visits across providers and rooms, with automatic reminders." },
      { title: "Billing and claims", body: "Charges captured from each visit, claims submitted to payers and their status tracked to payment." },
      { title: "Practice reporting", body: "Revenue, collections and appointment volumes by provider and location." },
    ],
    links: [
      { label: "Open app", href: "https://healthcare-pms.vercel.app/" },
      { label: "Healthcare solution", href: "https://evoq.one/solutions/healthcare" },
    ],
    gallery: [
      { kind: "window", caption: "Claims and billing queue" },
      { kind: "overview", caption: "Healthcare PMS at a glance" },
      { kind: "evi", caption: "EVI inside Healthcare PMS" },
    ],
    window: { title: "Claims", subtitle: "128 this week · 6 need attention", action: "New claim", nav: ["Front desk", "Appointments", "Claims", "Billing", "Reports"], layout: "list", rows: [
      { title: "Claim #30421 · Maria Lopez", meta: "Aetna · Cardiology follow-up", value: "$1,240", tag: "Submitted" },
      { title: "Claim #30418 · James Carter", meta: "Blue Cross · Orthopedic admission", value: "$8,650", tag: "Denied", flag: true },
      { title: "Claim #30415 · Priya Nair", meta: "Cigna · Lab panel", value: "$320", tag: "Paid" },
      { title: "Claim #30412 · Noah Brooks", meta: "UnitedHealthcare · Check-up", value: "$180", tag: "Missing code", flag: true },
      { title: "Claim #30409 · Emily Carter", meta: "Self-pay · Dermatology", value: "$95", tag: "Invoiced" },
    ] },
    stats: [{ label: "Appointments today", value: "62" }, { label: "Claims this week", value: "128" }, { label: "Collected this month", value: "$214k" }, { label: "Avg. days to pay", value: "18" }],
    scene: { question: "Which claims need attention?", answer: "**6 claims** need attention. **Claim #30418** was denied for a missing pre-authorisation, worth **$8,650**.", steps: [{ text: "128 claims reviewed", done: true }, { text: "Resubmission drafted", done: true }, { text: "Awaiting your approval", done: false }] },
    release: { platforms: PLATFORMS, changes: ["Claims status tracked to payment", "Insurance details captured at check-in", "Shared patient search with the Unified Healthcare Platform"], changelogUrl: "https://healthcare-pms.vercel.app/" },
  },

  manufacturing: {
    id: "manufacturing",
    headline: "Production orders, shop-floor tracking and quality, in one view.",
    about: "A manufacturing solution for production orders, shop-floor tracking and quality control. It is in development and will connect to Inventory and ServiceOps when it ships.",
    features: [
      { title: "Production orders", body: "Plan runs against a bill of materials, with routing steps and machine assignments." },
      { title: "Shop-floor tracking", body: "Operators log progress and downtime by work centre, in real time." },
      { title: "Quality control", body: "Inspection checkpoints and non-conformance records tied to each production order." },
      { title: "Connected to the work", body: "Consumed materials and finished goods will update Inventory automatically." },
    ],
    links: [{ label: "Website", href: "https://evoq.one/solutions/manufacturing" }],
    gallery: drawn("Manufacturing", "Production orders by work centre"),
    window: { title: "Production orders", subtitle: "18 open · 3 behind schedule", action: "New order", nav: ["Overview", "Orders", "Work centres", "Quality", "Reports"], layout: "board", columns: [
      { name: "Planned", items: [{ title: "PO-204 Bracket set", meta: "Line 2" }, { title: "PO-205 Enclosure", meta: "Line 1" }] },
      { name: "In progress", items: [{ title: "PO-198 Gearbox", meta: "Line 3", tag: "Behind schedule", flag: true }, { title: "PO-201 Housing", meta: "Line 2" }] },
      { name: "Quality check", items: [{ title: "PO-194 Valve body", meta: "QC station 1" }] },
      { name: "Complete", items: [{ title: "PO-188 Panel", meta: "Today" }] },
    ] },
    stats: [{ label: "Open orders", value: "18" }, { label: "Behind schedule", value: "3" }, { label: "On-time rate", value: "91%" }, { label: "Units this week", value: "4,120" }],
    scene: { question: "Which orders are behind schedule?", answer: "**3 production orders** are behind, led by **PO-198 Gearbox** on Line 3 due to a machine changeover.", steps: [{ text: "Schedule reviewed", done: true }, { text: "Catch-up plan drafted", done: true }, { text: "Awaiting your approval", done: false }] },
    release: { platforms: PLATFORMS, changes: ["In development — coming soon"], changelogUrl: "https://evoq.one/solutions/manufacturing" },
  },

  /* ---------- Industry solutions (headlines from the evoq.one industry pages) ---------- */

  construction: {
    id: "construction",
    headline: "Site progress, client commitments and billing milestones in one view.",
    about: "An industry solution for construction, engineering and real estate teams. It combines Projects, CRM, Inventory and Billing so site work, client commitments and milestone billing stay in step.",
    features: [
      { title: "Coordinate project work", body: "Phases, site tasks and owners in Projects, with progress visible to the office and the client." },
      { title: "Support commercial processes", body: "Enquiries, tenders and contracts tracked in CRM from first contact to signed agreement." },
      { title: "Materials on site", body: "Inventory tracks materials by site and location, with requests raised before work stalls." },
      { title: "Milestone billing", body: "Invoices raised in Billing as each milestone is signed off, so cash follows progress." },
    ],
    links: [{ label: "Website", href: "https://evoq.one/solutions/construction-engineering-real-estate" }],
    gallery: drawn("Construction", "Project milestones by site"),
    window: { title: "Projects", subtitle: "9 active sites · 2 milestones due", action: "New project", nav: ["Overview", "Projects", "Sites", "Contracts", "Billing"], layout: "board", columns: [
      { name: "Planning", items: [{ title: "Harbour View, Block C", meta: "Design review" }, { title: "Riverside offices", meta: "Permits" }] },
      { name: "On site", items: [{ title: "Northgate warehouse", meta: "Steel frame", tag: "Milestone due", flag: true }, { title: "Lakeview villas", meta: "Foundations" }] },
      { name: "Handover", items: [{ title: "Cedar Mall fit-out", meta: "Snagging" }] },
      { name: "Billed", items: [{ title: "Pine St. clinic", meta: "Final invoice" }] },
    ] },
    stats: [{ label: "Active sites", value: "9" }, { label: "Milestones due", value: "2" }, { label: "Billed this month", value: "$1.4M" }, { label: "On schedule", value: "78%" }],
    scene: { question: "Which milestones can we bill this week?", answer: "**2 milestones** are ready for sign-off, worth **$318k**. Northgate warehouse steel frame is the largest.", steps: [{ text: "9 projects reviewed", done: true }, { text: "Milestone invoices drafted", done: true }, { text: "Awaiting your approval", done: false }] },
    release: { platforms: PLATFORMS, changes: ["In development — coming soon"], changelogUrl: "https://evoq.one/solutions/construction-engineering-real-estate" },
  },

  "field-service": {
    id: "field-service",
    headline: "Every request logged, every visit tracked, every asset maintained.",
    about: "An industry solution for field service, facilities and maintenance teams. It brings together ServiceOps, Desk and Inventory so requests become scheduled visits and assets stay on their maintenance plans.",
    features: [
      { title: "Requests from every channel", body: "Calls, emails and portal requests land in one queue with the site and asset attached." },
      { title: "Dispatch and visits", body: "Technicians scheduled by skill and zone, with checklists and sign-off on every visit." },
      { title: "Assets and maintenance plans", body: "Recurring maintenance generated automatically for every asset, ahead of time." },
      { title: "Parts in the van", body: "Inventory tracks stock by van and site, updated as parts are used on each job." },
    ],
    links: [{ label: "Website", href: "https://evoq.one/solutions/field-service-facilities-maintenance" }],
    gallery: drawn("Field Service", "Today's visits and maintenance"),
    window: { title: "Visits", subtitle: "Today · 24 visits · 3 at risk", action: "New request", nav: ["Requests", "Dispatch", "Visits", "Assets", "Reports"], layout: "list", rows: [
      { title: "Chiller service, Harbor Dental", meta: "Planned maintenance · Ravi K.", value: "09:00", tag: "Scheduled" },
      { title: "Lift fault, Cedar Mall", meta: "Reactive · unassigned", value: "ASAP", tag: "No technician", flag: true },
      { title: "Fire panel test, Northgate Gym", meta: "Compliance · Maya S.", value: "11:30", tag: "Scheduled" },
      { title: "Boiler repair, Lakeview Hotel", meta: "Reactive · Chris W.", value: "13:00", tag: "SLA in 2h", flag: true },
      { title: "HVAC filter swap, Pine St. Clinic", meta: "Planned maintenance · Emily J.", value: "15:30", tag: "Scheduled" },
    ] },
    stats: [{ label: "Visits today", value: "24" }, { label: "Open requests", value: "31" }, { label: "PPM on time", value: "94%" }, { label: "First-time fix", value: "87%" }],
    scene: { question: "Which visits are at risk today?", answer: "**3 visits** are at risk. The **Cedar Mall lift fault** has no technician and **Lakeview Hotel** is 2 hours from its SLA.", steps: [{ text: "24 visits checked", done: true }, { text: "Dispatch suggestion ready", done: true }, { text: "Awaiting your approval", done: false }] },
    release: { platforms: PLATFORMS, changes: ["In development — coming soon"], changelogUrl: "https://evoq.one/solutions/field-service-facilities-maintenance" },
  },

  hospitality: {
    id: "hospitality",
    headline: "Reservations confirmed, guest requests tracked, every stay billed.",
    about: "An industry solution for hospitality, travel and food & beverage. It combines Bookings, CRM, Desk and Billing so reservations, guest requests and billing run from one place.",
    features: [
      { title: "Reservations", body: "Rooms, tables and experiences booked with live availability and instant confirmation." },
      { title: "Guest requests", body: "Requests from every channel tracked through to done, with the guest's history to hand." },
      { title: "Guest relationships", body: "Preferences and past stays in CRM, so returning guests are recognised." },
      { title: "Billing that adds up", body: "Stays, extras and F&B charges on one bill, with payments taken at checkout." },
    ],
    links: [{ label: "Website", href: "https://evoq.one/solutions/hospitality-travel-food-and-beverage" }],
    gallery: drawn("Hospitality", "Arrivals and guest requests"),
    window: { title: "Arrivals", subtitle: "Today · 38 arrivals · 4 requests open", action: "New reservation", nav: ["Overview", "Reservations", "Guests", "Requests", "Billing"], layout: "list", rows: [
      { title: "Sophia Hale · Room 204", meta: "2 nights · Deluxe king", value: "14:00", tag: "Confirmed" },
      { title: "Daniel Cruz · Room 118", meta: "Early check-in requested", value: "11:00", tag: "Request open", flag: true },
      { title: "Priya Nair · Table for 6", meta: "Restaurant · anniversary", value: "19:30", tag: "Confirmed" },
      { title: "Noah Brooks · Suite 501", meta: "3 nights · airport transfer", value: "16:00", tag: "Transfer pending", flag: true },
      { title: "Emily Carter · Room 310", meta: "1 night · returning guest", value: "18:00", tag: "Confirmed" },
    ] },
    stats: [{ label: "Arrivals today", value: "38" }, { label: "Occupancy", value: "86%" }, { label: "Open requests", value: "4" }, { label: "Guest rating", value: "4.8" }],
    scene: { question: "Which arrivals need attention?", answer: "**2 arrivals** need attention: an **early check-in** for Room 118 and an **airport transfer** for Suite 501.", steps: [{ text: "38 arrivals reviewed", done: true }, { text: "Guest messages drafted", done: true }, { text: "Awaiting your approval", done: false }] },
    release: { platforms: PLATFORMS, changes: ["In development — coming soon"], changelogUrl: "https://evoq.one/solutions/hospitality-travel-food-and-beverage" },
  },

  "financial-services": {
    id: "financial-services",
    headline: "Client enquiries answered, service requests tracked, relationships kept current.",
    about: "An industry solution for financial services firms. It combines CRM, Desk and Billing so client enquiries, service requests and follow-ups are handled on time and on record.",
    features: [
      { title: "Client relationships", body: "Every client, contact and conversation in CRM, with reviews and follow-ups scheduled." },
      { title: "Service requests", body: "Requests tracked through Desk with SLAs and a full audit trail." },
      { title: "Follow-ups that happen", body: "Reminders for reviews, renewals and outstanding documents, before they are late." },
      { title: "Fees and billing", body: "Fees and recurring charges invoiced in Billing, linked to each client." },
    ],
    links: [{ label: "Website", href: "https://evoq.one/solutions/financial-services" }],
    gallery: drawn("Financial Services", "Client service requests"),
    window: { title: "Service requests", subtitle: "27 open · 3 near SLA", action: "New request", nav: ["Clients", "Requests", "Reviews", "Documents", "Billing"], layout: "board", columns: [
      { name: "New", items: [{ title: "Address change", meta: "Acme Holdings" }, { title: "Statement copy", meta: "Halo Trust" }] },
      { name: "In progress", items: [{ title: "Account transfer", meta: "Vertex Capital", tag: "Near SLA", flag: true }, { title: "Beneficiary update", meta: "Kite Family Office" }] },
      { name: "Awaiting client", items: [{ title: "KYC documents", meta: "Orion Partners", tag: "Overdue", flag: true }] },
      { name: "Resolved", items: [{ title: "Fee query", meta: "Summit Advisors" }] },
    ] },
    stats: [{ label: "Active clients", value: "412" }, { label: "Open requests", value: "27" }, { label: "Reviews due", value: "18" }, { label: "Within SLA", value: "95%" }],
    scene: { question: "Which client reviews are due this month?", answer: "**18 reviews** are due. **6 clients** still have outstanding documents, led by **Orion Partners**.", steps: [{ text: "412 clients checked", done: true }, { text: "Reminders drafted", done: true }, { text: "Awaiting your approval", done: false }] },
    release: { platforms: PLATFORMS, changes: ["In development — coming soon"], changelogUrl: "https://evoq.one/solutions/financial-services" },
  },

  "all-industries": {
    id: "all-industries",
    headline: "Products that fit your industry's needs.",
    about: "Every EVOQ industry solution in one place. Each one combines the same connected EVOQ products with the workflows and terminology that industry expects.",
    features: [
      { title: "Healthcare", body: "Patient relationships, practice management and patient engagement." },
      { title: "Manufacturing", body: "From enquiry to the field: configure, quote, produce and service." },
      { title: "Construction, field service and hospitality", body: "Site progress, maintenance visits, reservations and guest requests." },
      { title: "Financial services", body: "Client enquiries, service requests and relationships kept current." },
      { title: "One connected suite", body: "Every industry runs on the same EVOQ products, so data stays in step across teams." },
    ],
    links: [{ label: "Website", href: "https://evoq.one/industries" }],
    gallery: drawn("All Industries", "EVOQ industry solutions"),
    window: { title: "Industries", subtitle: "6 industry solutions", action: "Explore", nav: ["Overview", "Healthcare", "Manufacturing", "Field service", "Hospitality"], layout: "list", rows: [
      { title: "Healthcare", meta: "CRM · Bookings · Billing", tag: "Available" },
      { title: "Manufacturing", meta: "ConfigX · Inventory · ServiceOps", tag: "Coming soon" },
      { title: "Construction, Engineering & Real Estate", meta: "Projects · Inventory · Billing", tag: "Coming soon" },
      { title: "Field Service, Facilities & Maintenance", meta: "ServiceOps · Desk · Inventory", tag: "Coming soon" },
      { title: "Hospitality, Travel & F&B", meta: "Bookings · CRM · Billing", tag: "Coming soon" },
      { title: "Financial Services", meta: "CRM · Desk · Billing", tag: "Coming soon" },
    ] },
    stats: [{ label: "Industries", value: "6" }, { label: "Available now", value: "1" }, { label: "Shared products", value: "13" }, { label: "Coming soon", value: "5" }],
    scene: { question: "Which industry solution fits a clinic group?", answer: "**Healthcare** fits best: it combines **CRM, Bookings and Billing** with patient relationship and practice management workflows.", steps: [{ text: "Industries compared", done: true }, { text: "Recommendation drafted", done: true }, { text: "Awaiting your review", done: false }] },
    release: { platforms: PLATFORMS, changes: ["Browse every EVOQ industry solution"], changelogUrl: "https://evoq.one/industries" },
  },
}
