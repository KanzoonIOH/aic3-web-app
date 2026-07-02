// Dummy HR analytics data for the HR dashboard, ported from the
// `hraas reference/` prototype (data/dummy-data.js -> dashboard).
// Only the sections that have no live backend yet use this. The Traffic tab
// mixes these with real /logs data; the Employee tab is entirely dummy.

export interface BarItem {
    label: string;
    value: number;
}

// ---------- Traffic (HR-specific bits without a live source yet) ----------

export const trafficDummy = {
    tokenUsage: { value: "12.8M", helper: "+18% this week" },
    employeesAsking: { value: "846", helper: "unique employee chats" },
    topQuestions: [
        "How many annual leave days do I have?",
        "When is payroll processed?",
        "How do I update my bank account?",
        "What benefits can my family use?",
        "How do I request internal mutation?",
    ],
    intents: [
        { label: "Leave", value: 31 },
        { label: "Payroll", value: 24 },
        { label: "Benefits", value: 18 },
        { label: "Performance", value: 14 },
        { label: "Mutation", value: 13 },
    ] as BarItem[],
    agents: [
        { name: "HR General Assistant", success: "98.8%", tokens: "4.2M", avgLatency: "3.1s", throughput: "18 rpm", ttft: "620 ms", fallback: "1.2%", csat: "4.8/5" },
        { name: "Payroll Specialist Agent", success: "97.4%", tokens: "2.6M", avgLatency: "4.9s", throughput: "9 rpm", ttft: "910 ms", fallback: "2.8%", csat: "4.5/5" },
        { name: "Talent Gap LLM Agent", success: "96.1%", tokens: "3.1M", avgLatency: "6.2s", throughput: "7 rpm", ttft: "1.1s", fallback: "3.4%", csat: "4.4/5" },
        { name: "APQC Process LLM Agent", success: "98.2%", tokens: "2.9M", avgLatency: "5.7s", throughput: "8 rpm", ttft: "980 ms", fallback: "1.6%", csat: "4.7/5" },
    ],
    tokenMix: [
        { label: "Prompt tokens", value: 54 },
        { label: "Completion tokens", value: 31 },
        { label: "RAG context tokens", value: 15 },
    ] as BarItem[],
    channels: [
        { label: "Web app", value: 64 },
        { label: "Teams", value: 21 },
        { label: "Mobile", value: 10 },
        { label: "API", value: 5 },
    ] as BarItem[],
    costMetrics: [
        { label: "Estimated LLM Cost", value: 63 },
        { label: "RAG Retrieval Cost", value: 24 },
        { label: "Tool Invocation Cost", value: 13 },
    ] as BarItem[],
    safetyMetrics: [
        { label: "PII redaction", value: 98 },
        { label: "Policy citation coverage", value: 91 },
        { label: "Human handoff rate", value: 7 },
        { label: "Blocked sensitive actions", value: 4 },
    ] as BarItem[],
    alerts: [
        "Payroll Agent latency naik pada jam payroll cutoff.",
        "Leave-policy questions melonjak setelah policy update.",
        "Talent Gap Agent memakai RAG context paling besar per request.",
        "All Agents orchestration perlu token budget guardrail.",
    ],
};

// ---------- Employee analytics (fully dummy) ----------

export const employeeDummy = {
    kpis: [
        { label: "Total Employees", value: "1,284", helper: "active workforce" },
        { label: "Churn Risk", value: "87", helper: "predicted high risk" },
        { label: "Revenue/FTE", value: "Rp1.9B", helper: "weighted by division" },
        { label: "Reorg Impact", value: "142", helper: "roles affected" },
    ],
    headcountTrend: [
        { label: "Apr", value: 71 },
        { label: "May", value: 78 },
        { label: "Jun", value: 83 },
        { label: "Jul Plan", value: 88 },
    ] as BarItem[],
    revenueByDivision: [
        { label: "Sales", value: 42 },
        { label: "Enterprise Solutions", value: 28 },
        { label: "Digital Product", value: 17 },
        { label: "Operations", value: 9 },
        { label: "Shared Services", value: 4 },
    ] as BarItem[],
    churnByDivision: [
        { label: "Engineering", value: 32 },
        { label: "Sales", value: 26 },
        { label: "Operations", value: 19 },
        { label: "Finance", value: 12 },
        { label: "HR", value: 11 },
    ] as BarItem[],
    performanceMix: [
        { label: "High", value: 41 },
        { label: "Stable", value: 37 },
        { label: "Declining", value: 14 },
        { label: "Watchlist", value: 8 },
    ] as BarItem[],
    skillGaps: [
        { label: "AI literacy", value: 36 },
        { label: "Data storytelling", value: 28 },
        { label: "Process excellence", value: 22 },
        { label: "Leadership bench", value: 14 },
    ] as BarItem[],
    talentSegments: [
        { label: "Critical talent", value: 18 },
        { label: "Successor ready", value: 24 },
        { label: "Retention focus", value: 21 },
        { label: "Upskill target", value: 37 },
    ] as BarItem[],
    mutationReadiness: [
        { label: "Ready now", value: 23 },
        { label: "Ready in 3 months", value: 34 },
        { label: "Needs upskilling", value: 31 },
        { label: "Not recommended", value: 12 },
    ] as BarItem[],
    reorgImpact: [
        { label: "Role redesign", value: 42 },
        { label: "Manager change", value: 28 },
        { label: "Location move", value: 18 },
        { label: "Skill reskilling", value: 12 },
    ] as BarItem[],
    riskMatrix: [
        { division: "Sales", churn: "High", performance: "Declining", revenue: "Rp4.8T", action: "Retention + manager intervention" },
        { division: "Engineering", churn: "Medium", performance: "High", revenue: "Rp2.9T", action: "Career path + AI upskilling" },
        { division: "Operations", churn: "Medium", performance: "Stable", revenue: "Rp1.1T", action: "Reorg communication + workload redesign" },
        { division: "Finance Ops", churn: "Low", performance: "Stable", revenue: "Rp620B", action: "Automation support" },
    ],
    profiles: [
        { name: "Ayu Prameswari", role: "HR Manager", division: "HR", churn: "Low", performance: "High", revenueImpact: "Medium", mutation: "Ready for HR Strategy" },
        { name: "Dimas Saputra", role: "Senior Data Analyst", division: "Engineering", churn: "Medium", performance: "High", revenueImpact: "High", mutation: "AI Analytics track" },
        { name: "Maya Lestari", role: "Payroll Specialist", division: "Finance Ops", churn: "High", performance: "Stable", revenueImpact: "Medium", mutation: "Needs retention action" },
        { name: "Jonathan Wijaya", role: "Sales Lead", division: "Sales", churn: "High", performance: "Declining", revenueImpact: "High", mutation: "Review org fit" },
        { name: "Nadia Kirana", role: "Customer Ops Lead", division: "Operations", churn: "Medium", performance: "Stable", revenueImpact: "Medium", mutation: "Candidate for process excellence" },
    ],
    insights: [
        "Engineering has elevated churn risk after reorganization signal.",
        "Sales Ops has high mutation readiness into revenue operations.",
        "Revenue/FTE risk concentrated in Sales and Engineering high-performer churn.",
        "Payroll Ops needs workload balancing before next cutoff.",
        "HRBP team can use talent gap agent for succession planning.",
    ],
};

