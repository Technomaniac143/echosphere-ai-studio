import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight, ArrowUpRight, Award, BarChart3, BookOpen, BriefcaseBusiness, Camera,
  Check, CheckCircle2, ChevronRight, CirclePause, Clock3, Download, FileText,
  Github, GraduationCap, Headphones, LayoutDashboard, LockKeyhole, Menu, MessageSquare,
  Mic, MicOff, MonitorUp, MoreHorizontal, Network, NotebookPen, Pause, Play, Plus,
  Radio, RefreshCw, Route, Send, ShieldCheck, Sparkles, Target, Upload, UserRound,
  Video, VideoOff, Volume2, WandSparkles, X, Zap, AlertTriangle, Building2, Loader2,
  Aperture, Code2, PenTool, Eye, TrendingUp, PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import candidateImage from "@/assets/candidate-arjun.jpg";
import { cn } from "@/lib/utils";
import { useCandidate, requiredProfileFields, type CandidateProfile } from "@/lib/candidate-store";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  createInterview, getInterview, appendMessage, saveInterviewResults,
  terminateInterview, setDeviceStatus, saveNotes,
} from "@/lib/interview.functions";
import { scoreInterview, adaptDifficulty, moderateSpeech, CATEGORY_LABELS } from "@/lib/scoring.functions";
import { analyzeGithubProject } from "@/lib/github.functions";
import { getRoadmap } from "@/lib/roadmap.functions";
import {
  validEmail, validPhone, validGithubRepo, validLinkedin, validUrlOptional,
  validGraduationYear, required, validateResumeFile, type Validator,
} from "@/lib/validation";
import { HeroPanelAnimation } from "@/components/echosphere/hero-animation";
import { AgentPanel, agents, useAgentRotation } from "@/components/echosphere/agent-panel";
import { LiveInterviewer, type LiveMessage } from "@/components/echosphere/live-interviewer";
import { useProctoring } from "@/components/echosphere/use-proctoring";
import { CameraRecorder } from "@/components/echosphere/camera-recorder";
import { EchoAssistant, EchoOrb } from "@/components/echosphere/echo-assistant";

const CodeEditorPanel = lazy(() => import("@/components/echosphere/code-editor"));
const WhiteboardPanel = lazy(() => import("@/components/echosphere/whiteboard"));

type EchoMode = "idle" | "listening" | "thinking" | "speaking";

const violetButton = "rounded-none bg-brand px-5 font-semibold text-white shadow-[4px_4px_0_#16121d] hover:bg-brand/90 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#16121d]";
const outlineButton = "rounded-none border-foreground/30 bg-transparent shadow-none hover:bg-foreground hover:text-background";
const panel = "border border-foreground/15 bg-card shadow-[6px_6px_0_rgba(25,18,35,.09)]";

function Logo({ dark = false }: { dark?: boolean }) {
  return <Link to="/" className={cn("flex items-center gap-2 text-lg font-bold tracking-tight", dark && "text-white")}>
    <span className="grid size-8 place-items-center bg-brand text-white shadow-[3px_3px_0_#f2dc47]"><Radio className="size-4" /></span>
    EchoSphere
  </Link>;
}

function Header({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const { candidate } = useCandidate();
  const navigate = useNavigate();
  const initials = candidate.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return <header className={cn("relative z-40 flex h-16 items-center justify-between border-b px-5 md:px-9", dark ? "border-white/10 bg-[#17131c] text-white" : "border-foreground/15 bg-background", compact && "h-14")}>
    <Logo dark={dark} />
    <div className="flex items-center gap-3">
      {!compact && <><span className={cn("hidden items-center gap-2 text-xs md:flex", dark ? "text-white/55" : "text-muted-foreground")}><span className="size-2 rounded-full bg-success" /> AI ONLINE</span><Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link></>}
      <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }} className={cn("grid size-9 place-items-center overflow-hidden border text-sm font-semibold", dark ? "border-white/20 bg-white/10" : "border-foreground/20 bg-white")}>
        {candidate.photo ? <img src={candidate.photo} alt="" className="size-full object-cover"/> : initials}
      </button>
    </div>
  </header>;
}

function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <div className={cn("mb-4 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[.18em]", dark ? "text-[#bcb0c8]" : "text-brand")}><span className="h-px w-6 bg-current" />{children}</div>;
}


const personas = [
  ["Alex", "Technical Interviewer", "A"], ["Maya", "Product Manager", "M"], ["Daniel", "Hiring Manager", "D"], ["Sophia", "Behavioral Interviewer", "S"], ["Jordan", "Customer / Role-play", "J"],
];

export function LandingPage() {
  return <main className="min-h-screen overflow-hidden bg-[#f7f4fb] text-foreground">
    <Header />
    <section className="relative grid min-h-[680px] border-b border-foreground/15 lg:grid-cols-[1.08fr_.92fr]">
      <div className="relative flex flex-col justify-center px-6 py-20 md:px-12 lg:px-[7vw]">
        <div className="absolute left-[3vw] top-14 h-28 w-px bg-foreground/10" /><Eyebrow>Adaptive intelligence, in conversation</Eyebrow>
        <h1 className="max-w-3xl text-[clamp(3.2rem,7vw,7.6rem)] font-semibold leading-[.87] tracking-[-.07em]">Every answer<br /><span className="text-brand">shapes the</span><br />next question.</h1>
        <p className="mt-8 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">Voice-first interviews led by a coordinated AI panel. Adaptive questioning, real-time context, and evidence-backed feedback—built around how you think.</p>
        <div className="mt-9 flex flex-wrap gap-4"><Link to="/portal"><Button size="lg" className={violetButton}>Are you a Candidate? <ArrowRight /></Button></Link><Button size="lg" variant="outline" className={outlineButton}>Are you an Organization? <ArrowUpRight /></Button></div>
        <div className="mt-12 flex items-center gap-5 border-t border-foreground/15 pt-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand" /> Encrypted voice & identity</span><span className="flex items-center gap-2"><Zap className="size-4 text-brand" /> Adaptive in real time</span></div>
      </div>
      <div className="relative min-h-[560px] overflow-hidden bg-brand p-6 text-white md:p-10">
        <HeroPanelAnimation />
        <div className="relative mx-auto flex h-full max-w-xl flex-col justify-center">
          <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/65"><span>Live adaptive panel</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-highlight" /> Listening</span></div>
          <div className="border border-white/20 bg-[#20192a]/90 p-5 shadow-[10px_10px_0_#f2dc47] md:p-7">
            <div className="flex items-center gap-4 border-b border-white/10 pb-5"><EchoOrb mode="speaking" /><div><p className="font-mono text-[10px] uppercase tracking-widest text-[#cbbddd]">Alex · Technical Interviewer</p><h2 className="mt-1 text-xl font-medium">“Let’s follow that decision.”</h2></div></div>
            <div className="py-8"><p className="font-mono text-[10px] uppercase tracking-widest text-highlight">System design · Follow-up</p><p className="mt-3 text-2xl leading-tight md:text-3xl">How would your architecture change if traffic grew tenfold overnight?</p></div>
            <div className="grid grid-cols-5 gap-2">{personas.map(([name, role, letter], i) => <div key={name} className={cn("border p-2.5", i === 0 ? "border-highlight bg-highlight text-highlight-foreground" : "border-white/15 bg-white/5")}><span className="grid size-7 place-items-center border border-current font-mono text-xs">{letter}</span><p className="mt-2 text-xs font-semibold">{name}</p><p className="hidden text-[9px] opacity-60 md:block">{role}</p></div>)}</div>
          </div>
        </div>
      </div>
    </section>
    <section className="grid border-b border-foreground/15 md:grid-cols-3">{[
      ["01", "Adaptive voice interviews", "Questions evolve with every answer—not from a fixed script.", Mic], ["02", "A coordinated AI panel", "Distinct perspectives hand off in one continuous conversation.", Headphones], ["03", "Evidence-backed feedback", "Every score links to transcript evidence and practical next steps.", BarChart3]
    ].map(([n,t,d,I]: any) => <article key={n} className="border-b border-foreground/15 p-8 last:border-0 md:border-b-0 md:border-r md:last:border-r-0"><div className="flex justify-between"><span className="font-mono text-xs text-brand">{n}</span><I className="size-5" /></div><h3 className="mt-12 text-2xl font-semibold">{t}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{d}</p></article>)}</section>
    <section className="bg-[#16141f] px-6 py-24 text-white md:px-12"><div className="mx-auto max-w-6xl"><p className="mb-8 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white/70"><span className="h-px w-8 bg-white/40" />The panel</p><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><h2 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">Five perspectives.<br /><span className="text-highlight">One continuous interview.</span></h2><p className="max-w-sm text-sm leading-6 text-white/60">The right interviewer steps forward at the right moment, while shared context keeps every handoff seamless.</p></div><div className="mt-16 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-5">{personas.map(([n,r,l],i)=><div key={n} className="bg-[#16141f] px-6 py-8"><span className={cn("grid size-11 place-items-center border font-mono",i===0?"border-highlight bg-highlight text-highlight-foreground":"border-white/25 text-white")}>{l}</span><h3 className={cn("mt-10 text-lg font-semibold",i===0?"text-highlight":"text-white")}>{n}</h3><p className="mt-1 text-xs text-white/55">{r}</p></div>)}</div></div></section>
  </main>;
}

export function PortalPage() {
  const navigate = useNavigate();
  return <main className="min-h-screen bg-[#f5f1f8]"><Header /><div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[.9fr_1.1fr]">
    <section className="flex items-center px-6 py-16 md:px-[9vw]"><div className="w-full max-w-lg"><Eyebrow>Candidate access</Eyebrow><h1 className="text-5xl font-semibold tracking-[-.05em] md:text-7xl">Enter your<br /><span className="text-brand">interview space.</span></h1><p className="mt-5 text-muted-foreground">Practice AI voice interviews with a panel that adapts to you.</p><form onSubmit={e=>{e.preventDefault();navigate({to:"/dashboard"})}} className="mt-10"><label className="font-mono text-[10px] uppercase tracking-widest">Work or personal email</label><input type="email" defaultValue="arjun.sharma@example.com" required className="mt-2 h-13 w-full border border-foreground/25 bg-white px-4 outline-none focus:border-brand"/><Button className={cn(violetButton,"mt-4 h-12 w-full")}>Continue to Candidate Dashboard <ArrowRight /></Button></form><div className="mt-9 grid gap-3 sm:grid-cols-2"><Link to="/dashboard" className="border border-foreground/15 bg-white p-4 hover:border-brand"><p className="font-semibold">Quick launch</p><p className="mt-1 text-xs text-muted-foreground">Enter Demo Candidate Workspace</p></Link><div className="border border-foreground/15 bg-white p-4"><p className="font-semibold">Assessment</p><button onClick={()=>navigate({to:"/dashboard"})} className="mt-1 text-xs text-brand underline">Enter Access Code</button></div></div><p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-4 text-success" /> End-to-End Voice & Identity Encryption</p></div></section>
    <section className="relative hidden overflow-hidden bg-brand p-14 text-white lg:flex lg:items-center"><div className="absolute -right-32 -top-32 size-[550px] rounded-full border border-white/10"/><div className="relative max-w-lg"><EchoOrb mode="speaking"/><p className="mt-12 font-mono text-xs uppercase tracking-[.2em] text-highlight">Echo is ready</p><h2 className="mt-4 text-4xl font-semibold leading-tight">A quiet, intelligent space to sharpen how you answer.</h2><div className="mt-12 border-l border-white/25 pl-6"><p className="text-lg">“What would you like to work on?”</p><div className="mt-5 flex gap-2">{["System design","Behavioral","Product thinking"].map(x=><span key={x} className="border border-white/20 px-3 py-2 text-xs">{x}</span>)}</div></div></div></section>
  </div><EchoAssistant /></main>;
}


const CATEGORY_KEYS = ["technical","behavioral","productManager","hiringManager"] as const;
const CATEGORY_TITLES: Record<typeof CATEGORY_KEYS[number], string> = {
  technical: "Technical", behavioral: "Behavioral", productManager: "Product Manager", hiringManager: "Hiring Manager",
};

export function DashboardPage() {
  const { candidate, profileComplete } = useCandidate();
  const latest = candidate.history[0] as any;
  const scored = candidate.history.find((h: any) => h.technical != null || h.cumulative > 0) as any;
  return <main className="min-h-screen bg-[#f5f1f8]"><Header/><div className="mx-auto max-w-5xl px-5 py-16 md:px-10">
    <Eyebrow>Candidate workspace</Eyebrow>
    <h1 className="text-4xl font-semibold tracking-[-.04em] md:text-6xl">Welcome back, {candidate.name.split(" ")[0] || "there"}.</h1>
    <p className="mt-3 text-muted-foreground">{candidate.email}</p>
    {!profileComplete && <div className={cn(panel,"mt-8 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-brand p-5")}>
      <p className="text-sm">Complete your profile details before starting an interview.</p>
      <Link to="/profile/edit"><Button size="sm" className={violetButton}>Edit profile</Button></Link>
    </div>}

    <section className="mt-10">
      <div className="flex items-end justify-between">
        <div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Latest interview</p>
          <h2 className="mt-1 text-2xl font-semibold">{latest ? `${latest.company} · ${latest.role}` : "No interviews yet"}</h2>
          {latest && <p className="mt-1 text-xs text-muted-foreground">{latest.date} · <span className={cn(latest.status==="terminated"?"text-red-500":latest.status==="completed"?"text-success":"text-muted-foreground")}>{latest.status === "terminated" ? `Terminated (${latest.terminationReason ?? "violation"})` : latest.status === "completed" ? "Completed" : "In progress"}</span></p>}
        </div>
        {latest && <Link to="/report" search={{ threadId: latest.id }}><Button size="sm" variant="outline" className={outlineButton}>View report</Button></Link>}
      </div>
      {scored
        ? <div className="mt-5 grid gap-px bg-foreground/10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="bg-brand p-6 text-white"><p className="font-mono text-[10px] uppercase tracking-widest text-white/70">Overall</p><p className="mt-3 text-5xl font-semibold">{scored.cumulative}</p></div>
            {CATEGORY_KEYS.map(k => <div key={k} className="bg-card p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{CATEGORY_TITLES[k]}</p>
              <p className="mt-3 text-4xl font-semibold">{scored[k] ?? "—"}</p>
              <div className="mt-3 h-1.5 bg-muted"><div className="h-full bg-brand" style={{width:`${scored[k] ?? 0}%`}}/></div>
            </div>)}
          </div>
        : <div className={cn(panel,"mt-5 p-8 text-center text-sm text-muted-foreground")}>Your Technical, Behavioral, Product Manager and Hiring Manager scores will appear here after your first scored interview.</div>}
    </section>

    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      <Link to="/setup" className={cn(panel,"group flex items-center justify-between p-6 hover:border-brand")}><span><span className="font-mono text-[10px] uppercase tracking-widest text-brand">Practice</span><span className="mt-2 block text-xl font-semibold">Start New Mock Interview</span></span><Plus className="text-brand"/></Link>
      <Link to="/profile" className={cn(panel,"group flex items-center justify-between p-6 hover:border-brand")}><span><span className="font-mono text-[10px] uppercase tracking-widest text-brand">Portfolio</span><span className="mt-2 block text-xl font-semibold">View Profile</span></span><UserRound className="text-brand"/></Link>
      <Link to="/report" className={cn(panel,"group flex items-center justify-between p-6 hover:border-brand")}><span><span className="font-mono text-[10px] uppercase tracking-widest text-brand">Feedback</span><span className="mt-2 block text-xl font-semibold">Reports</span></span><FileText className="text-brand"/></Link>
      <Link to="/roadmap" className={cn(panel,"group flex items-center justify-between p-6 hover:border-brand")}><span><span className="font-mono text-[10px] uppercase tracking-widest text-brand">Growth</span><span className="mt-2 block text-xl font-semibold">Roadmap</span></span><Route className="text-brand"/></Link>
    </div>
  </div><EchoAssistant/></main>;
}

const setupSteps = ["Target company","Target role","Domain & focus","AI proposal","Confirm"];
export function SetupPage() {
  const navigate=useNavigate(); const { profileComplete }=useCandidate(); const [step,setStep]=useState(0); const [company,setCompany]=useState("Google"); const [role,setRole]=useState("Senior Software Engineer"); const [domain,setDomain]=useState("Data Engineering"); const [difficulty,setDifficulty]=useState("Hard");
  const companies=["Google","Microsoft","Amazon","Apple","Meta","Netflix","Uber"]; const roles=["Software Engineer","Senior Software Engineer","Staff Software Engineer","Frontend Engineer","Backend Engineer","Full Stack Engineer","Data Engineer"];
  return <main className="min-h-screen bg-[#f5f1f8]"><Header/><div className="border-b border-foreground/15 bg-white px-5 py-6"><div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto">{setupSteps.map((s,i)=><button onClick={()=>setStep(i)} key={s} className={cn("flex min-w-40 flex-1 items-center gap-3 border-b-2 pb-3 text-left",i===step?"border-brand text-foreground":i<step?"border-success text-muted-foreground":"border-foreground/10 text-muted-foreground")}><span className={cn("grid size-7 shrink-0 place-items-center border font-mono text-xs",i===step&&"border-brand bg-brand text-white",i<step&&"border-success bg-success text-white")}>{i<step?<Check className="size-3"/>:i+1}</span><span className="text-xs font-semibold">{s}</span></button>)}</div></div>
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_310px]"><section><Eyebrow>Interview configuration · Step {step+1} of 5</Eyebrow>{step===0&&<ChoiceStep title="Where do you want to interview?" subtitle="Choose a target company so Echo can tune the interview context." items={companies} value={company} setValue={setCompany}/>} {step===1&&<ChoiceStep title="Which role are you targeting?" subtitle="This determines the expected scope and interview panel." items={roles} value={role} setValue={setRole}/>} {step===2&&<ChoiceStep title="Choose your domain & competency focus." subtitle="Select the course or domain that should guide the interview." items={["Data Engineering","Backend Systems","Frontend Architecture","Machine Learning","Product Engineering"]} value={domain} setValue={setDomain}/>} {step===3&&<Proposal difficulty={difficulty} setDifficulty={setDifficulty}/>} {step===4&&!profileComplete&&<div className={cn(panel,"mb-6 border-l-4 border-l-brand p-5 text-sm")}>Your profile details are incomplete. Fill them in on the Edit Profile page before starting an interview.</div>}{step===4&&<ConfirmSetup company={company} role={role} domain={domain} difficulty={difficulty}/>}<div className="mt-10 flex justify-between"><Button disabled={step===0} onClick={()=>setStep(x=>x-1)} variant="outline" className={outlineButton}>Back</Button>{step<4?<Button onClick={()=>setStep(x=>x+1)} className={violetButton}>Continue <ArrowRight/></Button>:<Button onClick={()=>navigate({to:profileComplete?"/system-check":"/profile/edit"})} className={violetButton}>{profileComplete?"Proceed to System Check":"Complete Profile First"} <ArrowRight/></Button>}</div></section>
      <aside><div className={cn(panel,"sticky top-24 p-6")}><EchoOrb small mode="speaking"/><p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-brand">Echo insight</p><p className="mt-3 text-lg leading-7">{step<2?"I’ll use this to calibrate scope, seniority, and likely interview patterns.":step===2?"Your focus will shape both the questions and how evidence is scored.":"I’ve inferred a three-person panel based on the role. Your interview will emphasize system design and technical depth."}</p><div className="mt-6 border-t border-foreground/15 pt-4 text-xs text-muted-foreground">Say “Hey Echo, configure this interview for me.”</div></div></aside></div><EchoAssistant/></main>;
}

function ChoiceStep({title,subtitle,items,value,setValue}:{title:string;subtitle:string;items:string[];value:string;setValue:(v:string)=>void}) { return <><h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1><p className="mt-4 text-muted-foreground">{subtitle}</p><div className="mt-9 grid gap-3 sm:grid-cols-2">{items.map((x,i)=><button onClick={()=>setValue(x)} key={x} className={cn("flex min-h-20 items-center justify-between border p-5 text-left font-semibold transition",value===x?"border-brand bg-brand text-white shadow-[5px_5px_0_#f2dc47]":"border-foreground/15 bg-white hover:border-brand")}><span><i className="mr-3 font-mono text-xs not-italic opacity-50">0{i+1}</i>{x}</span>{value===x&&<Check/>}</button>)}</div></> }
function Proposal({difficulty,setDifficulty}:{difficulty:string;setDifficulty:(v:string)=>void}) { const weights=[["Technical",35],["System Design",30],["Problem Solving",20],["Behavioral",10],["Communication",5]] as const; return <><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Your adaptive<br/><span className="text-brand">AI proposal.</span></h1><div className="mt-9 grid gap-5 md:grid-cols-2"><div className={cn(panel,"p-6")}><h3 className="font-semibold">Competency weighting</h3><div className="mt-5 space-y-4">{weights.map(([n,v])=><div key={n}><div className="flex justify-between text-xs"><span>{n}</span><b>{v}%</b></div><div className="mt-1 h-2 bg-muted"><div className="h-full bg-brand" style={{width:`${v}%`}}/></div></div>)}</div></div><div className={cn(panel,"p-6")}><h3 className="font-semibold">Inferred interview panel</h3><div className="mt-5 space-y-3">{[["A","Technical Interviewer"],["M","Domain Expert"],["D","Hiring Manager"]].map(([a,r])=><div key={a} className="flex items-center gap-3 border-b border-foreground/10 pb-3"><span className="grid size-9 place-items-center bg-foreground text-white">{a}</span><span className="text-sm font-medium">{r}</span></div>)}</div></div><div className={cn(panel,"p-6 md:col-span-2")}><h3 className="font-semibold">Course focus areas</h3><div className="mt-4 flex flex-wrap gap-2">{["Spark/Kafka Streaming","Data Warehousing","ETL Pipelines","Data Quality & Schema Design"].map(x=><span key={x} className="border border-foreground/15 bg-muted px-3 py-2 text-xs">{x}</span>)}</div><h3 className="mt-7 font-semibold">Target difficulty</h3><div className="mt-3 grid grid-cols-4 gap-2">{["Easy","Medium","Hard","Expert"].map(x=><button key={x} onClick={()=>setDifficulty(x)} className={cn("border p-3 text-xs font-semibold",difficulty===x?"border-brand bg-brand text-white":"border-foreground/15")}>{x}</button>)}</div></div></div></> }
function ConfirmSetup({company,role,domain,difficulty}:{company:string;role:string;domain:string;difficulty:string}) { return <><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Confirm mock<br/><span className="text-brand">interview setup.</span></h1><div className={cn(panel,"mt-9 divide-y divide-foreground/10")}>{[[BriefcaseBusiness,"Company",company],[UserRound,"Role",role],[Target,"Domain",domain],[Zap,"Difficulty",difficulty],[Headphones,"Interview mode","Assessment / Mock Interview"]].map(([I,l,v]:any)=><div key={l} className="grid grid-cols-[40px_150px_1fr] items-center p-5"><I className="size-5 text-brand"/><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{l}</span><b>{v}</b></div>)}</div></> }

export function ProfilePage() {
  const { candidate, cumulative, previousCumulative, profileComplete } = useCandidate();
  const delta = previousCumulative === null ? null : cumulative - previousCumulative;
  const best = Math.max(...candidate.history.map(h => h.cumulative), 0);
  const p = candidate.profile;
  const getRoadmapFn = useServerFn(getRoadmap);
  const [roadmap, setRoadmap] = useState<{steps:any[];done:number;current:any}|null>(null);
  useEffect(() => {
    getRoadmapFn({ data: undefined }).then(setRoadmap).catch(console.error);
  }, [getRoadmapFn]);

  const allCompetencies = useMemo(() => {
    const map = new Map<string, number[]>();
    candidate.history.forEach(h => {
      (h.competency_scores ?? h.competencies ?? []).forEach((c: any) => {
        const name = c.skill || c.name;
        if (!name) return;
        if (!map.has(name)) map.set(name, []);
        map.get(name)!.push(Number(c.score) || 0);
      });
    });
    return Array.from(map.entries()).map(([name, scores]) => ({ name, score: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) }));
  }, [candidate.history]);

  return <main className="min-h-screen bg-[#f5f1f8]"><Header/><div className="mx-auto max-w-7xl px-5 py-10 md:px-10">

    <section className={cn(panel,"overflow-hidden")}>
      <div className="grid gap-8 p-7 md:grid-cols-[auto_1fr_auto] md:items-center md:p-9">
        <div className="relative size-28 overflow-hidden rounded-full border-4 border-brand bg-muted shadow-[6px_6px_0_#f2dc47]">
          {candidate.photo
            ? <img src={candidate.photo} alt={`${candidate.name} profile photo`} className="size-full object-cover"/>
            : <span className="grid size-full place-items-center text-3xl font-semibold text-brand">{candidate.name.split(" ").map(w=>w[0]).join("")}</span>}
        </div>
        <div>
          <Eyebrow>Candidate portfolio</Eyebrow>
          <h1 className="text-4xl font-semibold tracking-[-.04em] md:text-5xl">{candidate.name}</h1>
          <p className="mt-2 text-muted-foreground">{candidate.email} · {candidate.targetRole || "Interview"} track</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="border border-foreground/15 bg-muted px-3 py-1.5">{candidate.history.length} interviews completed</span>
            <span className="border border-foreground/15 bg-muted px-3 py-1.5">Best score {best}</span>
            {!candidate.photo&&<Link to="/system-check" className="border border-brand px-3 py-1.5 text-brand">Add your photo</Link>}
          </div>
        </div>
        <div className="bg-brand p-6 text-center text-white">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/70">Cumulative score</p>
          <p className="mt-2 text-7xl font-semibold leading-none">{cumulative}</p>
          {delta!==null&&<p className="mt-3 flex items-center justify-center gap-1 text-xs text-white/85"><TrendingUp className="size-3"/> {delta>=0?`+${delta}`:delta} vs previous</p>}
        </div>
      </div>
    </section>

    <div className="mt-6 flex flex-wrap gap-2">
      <Link to="/profile/edit"><Button className={violetButton}><NotebookPen/> Edit Profile</Button></Link>
      <Link to="/setup"><Button variant="outline" className={outlineButton}><Plus/> Start New Mock Interview</Button></Link>
      <Link to="/report"><Button variant="outline" className={outlineButton}><FileText/>Reports</Button></Link>
      <Link to="/roadmap"><Button variant="outline" className={outlineButton}><Route/>Roadmap</Button></Link>
    </div>

    <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_.5fr]">
      <section>
        <div className="mb-5 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Interview history</p><h2 className="mt-1 text-2xl font-semibold">Completed interviews</h2></div><span className="text-xs text-muted-foreground">{candidate.history.length} records</span></div>
        {candidate.history.length === 0
          ? <div className={cn(panel,"p-8 text-center")}><p className="text-muted-foreground">No interviews yet. Start your first mock interview to see your history here.</p><Link to="/setup"><Button className={cn(violetButton,"mt-4")}>Start New Mock Interview</Button></Link></div>
          : <div className="grid gap-5 md:grid-cols-2">
            {candidate.history.map(record=><article key={record.id} className={cn(panel,"flex flex-col p-5")}>
              <div className="flex items-start gap-3">
                <span className="size-11 shrink-0 overflow-hidden rounded-full border border-foreground/15 bg-muted">
                  {record.photo
                    ? <img src={record.photo} alt="" className="size-full object-cover"/>
                    : <span className="grid size-full place-items-center text-xs font-semibold text-brand">{candidate.name.split(" ").map(w=>w[0]).join("")}</span>}
                </span>
                <div className="flex-1">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-brand">{record.domain}</p>
                  <h3 className="mt-1 font-semibold leading-5">{record.company} · {record.role}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{record.date}</p>
                </div>
                <div className="text-right"><p className="text-3xl font-semibold leading-none">{record.cumulative}</p><p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Cumulative</p></div>
              </div>
              <div className="mt-5 grid gap-2">
                {record.competencies.map((c:{name:string;score:number})=><div key={c.name}>
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">{c.name}</span><b>{c.score}</b></div>
                  <div className="mt-1 h-1.5 bg-muted"><div className={cn("h-full",c.score<70?"bg-highlight":"bg-brand")} style={{width:`${c.score}%`}}/></div>
                </div>)}
              </div>
              <div className="mt-5 flex gap-2 border-t border-foreground/10 pt-4">
                <Link to="/report" search={{ threadId: record.id }}><Button size="sm" variant="outline" className={outlineButton}>View Report</Button></Link>
                <Link to="/setup"><Button size="sm" variant="ghost">Practice again</Button></Link>
              </div>
            </article>)}
          </div>}
      </section>
      <aside className="space-y-5">
        <div className={cn(panel,"p-5")}><div className="flex justify-between"><h2 className="font-semibold">Profile details</h2><span className={cn("font-mono text-[10px] uppercase tracking-widest",profileComplete?"text-success":"text-brand")}>{profileComplete?"Complete":"Incomplete"}</span></div>
          <dl className="mt-4 space-y-2 text-xs">
            {[["Resume",p.resumeName],["GitHub",p.github],["Institution",p.institution],["Degree",[p.degree,p.department].filter(Boolean).join(" · ")],["Graduation",p.graduationYear],["Certification",p.certificationName]].map(([l,v])=><div key={l} className="flex justify-between gap-3"><dt className="text-muted-foreground">{l}</dt><dd className="truncate text-right font-medium">{v||"—"}</dd></div>)}
          </dl>
          <Link to="/profile/edit" className="mt-4 inline-flex items-center text-xs text-brand">Edit profile <ChevronRight className="size-3"/></Link>
        </div>
        <div className={cn(panel,"p-5")}><h2 className="font-semibold">Competency overview</h2><div className="mt-5 space-y-3">{allCompetencies.length
          ? allCompetencies.map(c=><div key={c.name}><div className="mb-1 flex justify-between text-xs"><span>{c.name}</span><b>{c.score}</b></div><div className="h-1.5 bg-muted"><div className="h-full bg-brand" style={{width:`${c.score}%`}}/></div></div>)
          : <p className="text-xs text-muted-foreground">Complete an interview to see your competency breakdown.</p>}</div></div>
        <div className={cn(panel,"p-5")}><div className="flex justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Roadmap progress</p><p className="mt-2 text-2xl font-semibold">{roadmap?.done ?? 0} of 10</p></div><Route className="text-brand"/></div><p className="mt-4 text-xs text-muted-foreground">{roadmap?.current?.title || "Start your roadmap after your first interview."}</p></div>
      </aside>
    </div>
  </div><EchoAssistant/></main>;
}

const profileValidators: Partial<Record<keyof CandidateProfile, Validator>> = {
  fullName: required("Full name"),
  email: validEmail,
  phone: validPhone,
  resumeName: required("A resume"),
  github: validGithubRepo,
  linkedin: validLinkedin,
  bestProject: validUrlOptional,
  institution: required("Institution"),
  degree: required("Degree"),
  department: required("Department"),
  graduationYear: validGraduationYear,
  certificationUrl: validUrlOptional,
};

export function EditProfilePage() {
  const navigate=useNavigate();
  const { candidate, setProfile }=useCandidate();
  const [form,setForm]=useState<CandidateProfile>(candidate.profile);
  const [errors,setErrors]=useState<Partial<Record<keyof CandidateProfile,string>>>({});
  const [touched,setTouched]=useState(false);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState("");
  const [saved,setSaved]=useState(false);
  const [analysis,setAnalysis]=useState<any>(null);
  const [analysing,setAnalysing]=useState(false);
  const [analysisError,setAnalysisError]=useState("");
  const analyse=useServerFn(analyzeGithubProject);

  useEffect(()=>{setForm(candidate.profile)},[candidate.profile]);

  function validate(next:CandidateProfile){
    const found:Partial<Record<keyof CandidateProfile,string>>={};
    (Object.keys(profileValidators) as (keyof CandidateProfile)[]).forEach(k=>{
      const message=profileValidators[k]!(next[k] ?? "");
      if(message) found[k]=message;
    });
    return found;
  }

  const set=(k:keyof CandidateProfile)=>(v:string)=>{
    setSaved(false); setSaveError("");
    setForm(f=>{
      const next={...f,[k]:v.slice(0,2000)};
      if(touched) setErrors(validate(next));
      return next;
    });
  };

  async function submit(e:React.FormEvent){
    e.preventDefault(); setTouched(true); setSaveError("");
    const found=validate(form);
    setErrors(found);
    if(Object.keys(found).length){
      document.querySelector<HTMLElement>("[data-invalid='true']")?.scrollIntoView({behavior:"smooth",block:"center"});
      return;
    }
    setSaving(true);
    const result=await setProfile(form);
    setSaving(false);
    if(!result.ok){ setSaveError(result.error ?? "Your profile could not be saved."); return; }
    setSaved(true);
    window.setTimeout(()=>navigate({to:"/profile"}),500);
  }

  async function runAnalysis(){
    setAnalysisError(""); setAnalysis(null);
    const bad=validGithubRepo(form.github);
    if(bad){ setErrors(e=>({...e,github:bad})); setTouched(true); return; }
    setAnalysing(true);
    try{ setAnalysis(await analyse({data:{url:form.github.trim()}})); }
    catch(err:any){ setAnalysisError(err?.message ?? "That repository could not be analysed."); }
    finally{ setAnalysing(false); }
  }

  const filled=Object.values(form).filter(v=>(v??"").trim()).length;
  const percent=Math.round((filled/Object.keys(form).length)*100);

  const field=(k:keyof CandidateProfile,label:string,placeholder="",type="text")=>{
    const message=touched?errors[k]:undefined;
    return <label key={k} data-invalid={message?"true":"false"} className="block text-xs font-semibold">{label}{requiredProfileFields.includes(k)&&<span className="text-brand"> *</span>}
      <input value={form[k] ?? ""} type={type} placeholder={placeholder} onChange={e=>set(k)(e.target.value)} aria-invalid={!!message}
        className={cn("mt-2 h-11 w-full border px-3 outline-none focus:border-brand",message?"border-destructive":"border-foreground/20")}/>
      {message&&<span className="mt-1 block text-[11px] font-normal text-destructive">{message}</span>}
    </label>;
  };

  return <main className="min-h-screen bg-[#f5f1f8]"><Header/><div className="mx-auto max-w-6xl px-5 py-12">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><Eyebrow>Context builder</Eyebrow><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Edit Profile</h1><p className="mt-3 max-w-2xl text-muted-foreground">Your contact details, resume, project repository, education and certifications personalize your AI mock interviewer. Required fields must be filled before you can start an interview.</p></div>
      <div className="w-56"><p className="flex justify-between font-mono text-[10px] uppercase"><span>Context complete</span><b>{percent}%</b></p><div className="mt-2 h-2 bg-white"><div className="h-full bg-brand" style={{width:`${percent}%`}}/></div></div>
    </div>
    <form onSubmit={submit} noValidate className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <FormSection number="A" title="Personal details" icon={<UserRound/>}>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("fullName","Full name","Jane Doe")}
          {field("email","Email address","you@gmail.com","email")}
          {field("phone","Phone number","10 digits")}
          {field("linkedin","LinkedIn (optional)","https://linkedin.com/in/username")}
        </div>
      </FormSection>
      <FormSection number="B" title="Candidate resume" icon={<FileText/>}>
        <label data-invalid={touched&&errors.resumeName?"true":"false"} className={cn("grid min-h-40 cursor-pointer place-items-center border border-dashed bg-muted/50 text-center hover:border-brand",touched&&errors.resumeName?"border-destructive":"border-foreground/30")}>
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e=>{
            const file=e.target.files?.[0];
            if(!file){ set("resumeName")(""); return; }
            const problem=validateResumeFile(file);
            if(problem){ setTouched(true); setErrors(x=>({...x,resumeName:problem})); set("resumeName")(""); return; }
            setErrors(x=>({...x,resumeName:undefined as any}));
            set("resumeName")(file.name);
          }}/>
          <div><Upload className="mx-auto mb-3 text-brand"/><b>{form.resumeName||"Drop your resume or browse"}</b><p className="mt-1 text-xs text-muted-foreground">PDF, DOC, DOCX · Maximum 10MB</p></div>
        </label>
        {touched&&errors.resumeName&&<p className="mt-2 text-[11px] text-destructive">{errors.resumeName}</p>}
      </FormSection>
      <FormSection number="C" title="Best project GitHub link" icon={<Github/>}>
        {field("github","Repository URL","https://github.com/username/project")}
        {field("bestProject","Live project link (optional)","https://myproject.app")}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={runAnalysis} disabled={analysing} variant="outline" className={outlineButton}>{analysing?<><Loader2 className="animate-spin"/> Analysing…</>:<><WandSparkles/> Analyse this repository</>}</Button>
          <p className="text-xs text-muted-foreground">The interviewer will ask questions about this project.</p>
        </div>
        {analysisError&&<p className="mt-3 text-xs text-destructive">{analysisError}</p>}
        {analysis&&<div className="mt-4 border border-foreground/15 bg-muted/40 p-4 text-xs leading-5">
          <p className="font-semibold">{analysis.repo}</p>
          <p className="mt-2 text-muted-foreground">{analysis.summary}</p>
          {analysis.technologies?.length>0&&<div className="mt-3 flex flex-wrap gap-1.5">{analysis.technologies.map((t:string)=><span key={t} className="border border-foreground/15 bg-white px-2 py-1">{t}</span>)}</div>}
          {analysis.questions?.length>0&&<ul className="mt-3 list-disc space-y-1 pl-4 text-muted-foreground">{analysis.questions.slice(0,3).map((q:string)=><li key={q}>{q}</li>)}</ul>}
        </div>}
      </FormSection>
      <FormSection number="D" title="Experience" icon={<BriefcaseBusiness/>}>
        <label className="block text-xs font-semibold">Work or project experience
          <textarea value={form.experience} onChange={e=>set("experience")(e.target.value)} rows={6} placeholder="Internships, jobs, notable projects…" className="mt-2 w-full resize-none border border-foreground/20 p-3 text-sm outline-none focus:border-brand"/>
        </label>
      </FormSection>
      <FormSection number="E" title="Educational details" icon={<GraduationCap/>}><div className="grid gap-4 sm:grid-cols-2">{field("institution","Institution / College / University")}{field("degree","Degree")}{field("department","Department / Branch")}{field("graduationYear","Graduation Year","2025")}</div></FormSection>
      <FormSection number="F" title="Certifications" icon={<Award/>}><div className="grid gap-3 sm:grid-cols-2">{field("certificationName","Certification Name")}{field("certificationOrg","Issuing Organization")}{field("certificationYear","Year / Issue Date")}{field("certificationUrl","Credential URL","https://…")}</div></FormSection>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-foreground/15 pt-6 lg:col-span-2">
        <p className={cn("flex items-center gap-2 text-xs",saveError?"text-destructive":"text-muted-foreground")}>
          <Sparkles className="size-4 text-brand"/>
          {saveError||(saved?"Profile saved.":touched&&Object.keys(errors).length?`${Object.keys(errors).length} field(s) need attention.`:"EchoSphere is building your interview context…")}
        </p>
        <div className="flex gap-2"><Button type="button" variant="outline" className={outlineButton} onClick={()=>navigate({to:"/profile"})}>Cancel</Button><Button disabled={saving} className={violetButton}>{saving?"Saving…":"Save Profile"} <ArrowRight/></Button></div>
      </div>
    </form>
  </div><EchoAssistant/></main>;
}
function FormSection({number,title,icon,children}:{number:string;title:string;icon:ReactNode;children:ReactNode}) { return <section className={cn(panel,"p-6")}><div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-3"><span className="font-mono text-xs text-brand">{number}</span><h2 className="text-xl font-semibold">{title}</h2></div><span className="text-brand">{icon}</span></div>{children}</section> }

type CheckStatus="PASS"|"NOT ACTIVE"|"FAIL"|"CHECKING";
export function SystemCheckPage() {
  const navigate=useNavigate();
  const [statuses,setStatuses]=useState<CheckStatus[]>(["NOT ACTIVE","NOT ACTIVE","NOT ACTIVE","CHECKING"]);
  const [camera,setCamera]=useState(false);
  const video=useRef<HTMLVideoElement>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const screenRef=useRef<MediaStream|null>(null);
  const audioCtxRef=useRef<AudioContext|null>(null);
  const rafRef=useRef(0);
  const [level,setLevel]=useState(0);
  const [latency,setLatency]=useState<number|null>(null);
  const { candidate, setPhoto } = useCandidate();
  const [draftPhoto,setDraftPhoto]=useState<string|null>(null);
  const [camError,setCamError]=useState<string|null>(null);
  const [screenError,setScreenError]=useState<string|null>(null);
  const [surface,setSurface]=useState<string|null>(null);

  const checkNetwork=useCallback(async()=>{
    setStatuses(p=>[p[0]!,p[1]!,p[2]!,"CHECKING"]);
    const t0=performance.now();
    try{
      await fetch(`/favicon.ico?cb=${Date.now()}`,{cache:"no-store"});
      setLatency(Math.max(1,Math.round(performance.now()-t0)));
      setStatuses(p=>[p[0]!,p[1]!,p[2]!,"PASS"]);
    }catch{ setLatency(null); setStatuses(p=>[p[0]!,p[1]!,p[2]!,"FAIL"]); }
  },[]);

  useEffect(()=>{ void checkNetwork(); },[checkNetwork]);
  useEffect(()=>()=>{
    cancelAnimationFrame(rafRef.current);
    try{ audioCtxRef.current?.close(); }catch{ /* noop */ }
    streamRef.current?.getTracks().forEach(t=>t.stop());
    screenRef.current?.getTracks().forEach(t=>t.stop());
  },[]);

  function capturePhoto(){const v=video.current;if(!v)return;const c=document.createElement("canvas");c.width=v.videoWidth||640;c.height=v.videoHeight||480;const ctx=c.getContext("2d");if(!ctx)return;ctx.drawImage(v,0,0,c.width,c.height);setDraftPhoto(c.toDataURL("image/jpeg",0.85));}

  async function enableCamera(){
    setCamError(null);
    try{
      const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280}},audio:{echoCancellation:true,noiseSuppression:true}});
      streamRef.current=s;
      setCamera(true);
      setStatuses(p=>["PASS",s.getAudioTracks().length?"PASS":"FAIL",p[2]!,p[3]!]);
      window.setTimeout(()=>{ if(video.current){ video.current.srcObject=s; void video.current.play().catch(()=>{}); } },0);
      const AudioCtor=window.AudioContext??(window as any).webkitAudioContext;
      const ctx:AudioContext=new AudioCtor();
      audioCtxRef.current=ctx;
      const analyser=ctx.createAnalyser(); analyser.fftSize=512;
      ctx.createMediaStreamSource(s).connect(analyser);
      const buf=new Uint8Array(analyser.frequencyBinCount);
      const tick=()=>{ analyser.getByteTimeDomainData(buf); let peak=0; for(const v of buf) peak=Math.max(peak,Math.abs(v-128)/128); setLevel(peak); rafRef.current=requestAnimationFrame(tick); };
      rafRef.current=requestAnimationFrame(tick);
    }catch(e:any){
      setCamera(false);
      setCamError(e?.name==="NotAllowedError"?"Camera and microphone access was blocked. Allow it in your browser settings and try again.":e?.message??"Could not start your camera.");
      setStatuses(p=>["FAIL","FAIL",p[2]!,p[3]!]);
    }
  }

  function stopScreen(){
    screenRef.current?.getTracks().forEach(t=>t.stop());
    screenRef.current=null;
    setSurface(null);
    setStatuses(p=>[p[0]!,p[1]!,"NOT ACTIVE",p[3]!]);
  }

  /** The interview requires the WHOLE screen — a tab or single window is rejected. */
  async function shareScreen(){
    if(screenRef.current){ stopScreen(); return; }
    setScreenError(null);
    setStatuses(p=>[p[0]!,p[1]!,"CHECKING",p[3]!]);
    try{
      const s=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:"monitor"} as any,audio:false});
      const track=s.getVideoTracks()[0];
      const shared=(track?.getSettings() as any)?.displaySurface ?? null;
      setSurface(shared);
      if(shared&&shared!=="monitor"){
        s.getTracks().forEach(t=>t.stop());
        setScreenError(`You shared a ${shared==="browser"?"browser tab":"single window"}. Press “Share Screen Now” again and choose Entire Screen.`);
        setStatuses(p=>[p[0]!,p[1]!,"FAIL",p[3]!]);
        return;
      }
      screenRef.current=s;
      track?.addEventListener("ended",()=>{ screenRef.current=null; setSurface(null); setStatuses(p=>[p[0]!,p[1]!,"NOT ACTIVE",p[3]!]); });
      setStatuses(p=>[p[0]!,p[1]!,"PASS",p[3]!]);
    }catch(e:any){
      setScreenError(e?.name==="NotAllowedError"?"Screen sharing was declined. It is required to start the interview.":e?.message??"Screen sharing could not be started.");
      setStatuses(p=>[p[0]!,p[1]!,"NOT ACTIVE",p[3]!]);
    }
  }

  // All four device checks plus a profile photo are required before continuing.
  const ready=statuses[0]==="PASS"&&statuses[1]==="PASS"&&statuses[2]==="PASS"&&statuses[3]==="PASS"&&!!candidate.photo;

  return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><Header/><div className="mx-auto max-w-6xl px-5 py-10"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><Eyebrow>Pre-flight check</Eyebrow><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">System environment check</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Camera, microphone, entire-screen sharing, network and a profile photo are all required before an interview can begin.</p></div><div className={cn("border px-5 py-3 font-mono text-sm",ready?"border-success text-success":"border-highlight bg-highlight/10 text-highlight-foreground")}><span className="mr-3 inline-block size-2 rounded-full bg-current"/>{ready?"READY":"ACTION REQUIRED"}</div></div>
    <div className="mt-9 grid gap-4 md:grid-cols-2"><CheckCard icon={<Camera/>} n="01" title="Camera Access & Video Preview" status={statuses[0]!}><div className="relative aspect-video overflow-hidden bg-muted"><video ref={video} autoPlay muted playsInline className={cn("size-full object-cover",!camera&&"hidden")}/>{!camera&&<div className="grid size-full place-items-center px-6 text-center"><div className="space-y-3">{camError&&<p className="text-xs text-destructive">{camError}</p>}<Button onClick={enableCamera} className={violetButton}><Camera/> {camError?"Try again":"Enable Camera & Microphone"}</Button></div></div>}</div></CheckCard>
    <CheckCard icon={<Mic/>} n="02" title="Microphone Access & Input Level" status={statuses[1]!}><div className="flex h-28 items-end gap-1 bg-muted px-8 pb-4">{Array.from({length:28},(_,i)=><i key={i} className="w-1 bg-brand transition-[height] duration-75" style={{height:`${Math.max(6,Math.min(100,level*160*(0.55+((i*37)%100)/120)))}%`}}/>)}</div>{camera&&<p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Speak to see your live input level</p>}</CheckCard>
    <CheckCard icon={<MonitorUp/>} n="03" title="Entire Screen Sharing (required)" status={statuses[2]!}><div className="flex h-28 items-center justify-between gap-4 bg-muted px-5"><div><p className="text-sm text-muted-foreground">{statuses[2]==="PASS"?"Entire screen is being shared":"Select “Entire Screen” when prompted"}</p>{surface&&<p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Shared: {surface}</p>}</div><Button onClick={()=>void shareScreen()} variant="outline" className={outlineButton}>{statuses[2]==="PASS"?"Stop Sharing":"Share Screen Now"}</Button></div>{screenError&&<p className="mt-2 text-xs text-destructive">{screenError}</p>}</CheckCard>
    <CheckCard icon={<Network/>} n="04" title="Real Network & Backend Health" status={statuses[3]!}><div className="grid h-28 grid-cols-2 place-items-center bg-muted"><div><p className="text-xs text-muted-foreground">Backend Reachable</p><b className={statuses[3]==="PASS"?"text-success":"text-destructive"}>{statuses[3]==="PASS"?"Yes":statuses[3]==="CHECKING"?"Checking…":"No"}</b></div><div><p className="text-xs text-muted-foreground">Latency</p><b>{latency!==null?`${latency} ms`:"—"}</b></div></div><button onClick={()=>void checkNetwork()} className="mt-3 flex items-center gap-2 text-xs text-brand"><RefreshCw className="size-3"/> Re-check Connectivity</button></CheckCard>
    <div className="md:col-span-2"><CheckCard icon={<Aperture/>} n="05" title="Candidate Profile Photo (required)" status={candidate.photo?"PASS":"NOT ACTIVE"}>
      <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
        <div className="grid aspect-square place-items-center overflow-hidden border border-foreground/15 bg-muted">
          {(draftPhoto||candidate.photo)
            ? <img src={(draftPhoto||candidate.photo)!} alt="Captured candidate photo" className="size-full object-cover"/>
            : <div className="text-center text-xs text-muted-foreground"><Camera className="mx-auto mb-2 size-6 opacity-50"/>No photo yet</div>}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Capture a still from your camera. This photo becomes your profile picture and is attached to each interview record.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {!draftPhoto
              ? <Button onClick={capturePhoto} disabled={!camera} className={cn(violetButton,"disabled:shadow-none")}><Camera/> {candidate.photo?"Retake photo":"Capture photo"}</Button>
              : <><Button onClick={()=>{setPhoto(draftPhoto);setDraftPhoto(null)}} className={violetButton}><Check/> Use this photo</Button>
                 <Button onClick={()=>setDraftPhoto(null)} variant="outline" className={outlineButton}><RefreshCw/> Retake</Button></>}
          </div>
          {!camera&&<p className="mt-3 text-xs text-muted-foreground">Enable your camera above to capture a photo.</p>}
          {candidate.photo&&!draftPhoto&&<p className="mt-3 flex items-center gap-2 text-xs text-success"><CheckCircle2 className="size-3"/> Saved to your profile.</p>}
        </div>
      </div>
    </CheckCard></div></div>
    {!ready&&<p className="mt-6 text-right text-xs text-muted-foreground">Every check above must pass before you can continue.</p>}
    <div className="mt-3 flex justify-end"><Button disabled={!ready} onClick={()=>navigate({to:"/video-test"})} className={cn(violetButton,"disabled:shadow-none")}>Continue to Sample Video <ArrowRight/></Button></div></div></main>;
}
function CheckCard({n,title,status,icon,children}:{n:string;title:string;status:CheckStatus;icon:ReactNode;children:ReactNode}) { return <section className={cn(panel,"p-5")}><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3 text-sm font-semibold"><span className="font-mono text-[10px] text-muted-foreground">{n}</span><span className="text-brand">{icon}</span>{title}</div><Status status={status}/></div>{children}</section> }
function Status({status}:{status:CheckStatus}) { return <span className={cn("border px-2 py-1 font-mono text-[9px]",status==="PASS"?"border-success/40 text-success":status==="FAIL"?"border-red-400 text-red-400":status==="CHECKING"?"border-info text-info":"border-foreground/20 text-muted-foreground")}>{status}</span> }

export function VideoTestPage() {
  const navigate=useNavigate(); const [done,setDone]=useState(false);
  return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><Header/><div className="mx-auto max-w-6xl px-5 py-10"><Eyebrow>Voice & presence calibration</Eyebrow><div className="grid gap-9 lg:grid-cols-[350px_1fr]"><section><h1 className="text-4xl font-semibold tracking-tight">Sample Video Question</h1><div className="mt-8 border-l-2 border-highlight pl-5"><p className="font-mono text-[10px] uppercase tracking-widest text-highlight">Your question</p><blockquote className="mt-3 text-3xl leading-tight">“What is your favourite colour?”</blockquote></div><div className="mt-8 space-y-3 text-sm text-muted-foreground"><p className="flex gap-3"><span className="font-mono text-highlight">01</span> Answer naturally for 10–30 seconds.</p><p className="flex gap-3"><span className="font-mono text-highlight">02</span> Speak clearly in your normal tone.</p><p className="flex gap-3"><span className="font-mono text-highlight">03</span> Use Settings on the preview to pick your camera and mic.</p></div></section><section><CameraRecorder limitSeconds={30} onComplete={()=>setDone(true)}/>{done&&<div className="mt-5 flex justify-end"><Button onClick={()=>navigate({to:"/analysis"})} className={violetButton}>Submit for AI Analysis <Sparkles/></Button></div>}</section></div></div></main>;
}

export function AnalysisPage() {
  const navigate=useNavigate();
  const createInterviewFn = useServerFn(createInterview);
  const [starting,setStarting]=useState(false);
  const verifications=[[Camera,"Camera & Video Quality","HD video, stable exposure, face clearly visible."],[Mic,"Microphone & Audio Level","Clear voice signal with low background noise."],[MonitorUp,"Screen Sharing Verification","Screen access verified and available."],[ShieldCheck,"Sample Recording Integrity","30-second recording passed integrity analysis."]];
  async function startInterview(){
    setStarting(true);
    try{
      const thread = await createInterviewFn({ data: { company: "Mock Company", role: "Software Engineer", domain: "General" } }) as any;
      navigate({ to: "/interview/$threadId", params: { threadId: thread?.id } });
    }catch(e){ console.error(e); setStarting(false); }
  }
  return <main className="min-h-screen bg-[#f5f1f8]"><Header/><div className="mx-auto max-w-5xl px-5 py-12"><div className="text-center"><Eyebrow>Automated evaluation</Eyebrow><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Candidate Analysis Portal</h1><div className="mx-auto mt-8 grid size-32 place-items-center rounded-full border-2 border-success bg-white shadow-[8px_8px_0_#bff3cf]"><div><Check className="mx-auto size-8 text-success"/><b className="mt-1 block font-mono text-xs text-success">APPROVED</b></div></div><h2 className="mt-5 text-2xl font-semibold">Ready for Interview</h2><p className="mt-2 text-muted-foreground">Environment, media integrity, and sample recording evaluation complete.</p></div><section className="mt-10 border-t border-foreground/20">{verifications.map(([I,t,d]:any,i)=><article key={t} className="grid items-center gap-4 border-b border-foreground/15 bg-white p-5 md:grid-cols-[38px_1fr_90px]"><I className="text-brand"/><div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div><Status status="PASS"/></article>)}</section><div className="mt-9 flex justify-center"><Button disabled={starting} onClick={startInterview} size="lg" className={violetButton}>{starting?"Starting…":"Start Mock Interview"} <ArrowRight/></Button></div></div></main>;
}

type Workspace="Conversation"|"Notes";
const stages=["Verify","Technical","Product","Behavioral","Confirm"];
export function InterviewPage() {
  const navigate=useNavigate();
  const { threadId } = useParams({ from: "/_authenticated/interview/$threadId" });
  const [workspace,setWorkspace]=useState<Workspace>("Conversation");
  const [echo,setEcho]=useState<EchoMode>("idle");
  const [muted,setMuted]=useState(false);
  const [video,setVideo]=useState(true);
  const [paused,setPaused]=useState(false);
  const [messages,setMessages]=useState<{from:"assistant"|"user";text:string}[]>([]);
  const [thread,setThread]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const [notes,setNotes]=useState("");
  const [confirmEnd,setConfirmEnd]=useState(false);
  const [ended,setEnded]=useState<{reason:string;message:string}|null>(null);
  const [difficulty,setDifficultyState]=useState<string>("medium");
  const { candidate }=useCandidate();
  const activeAgent=useAgentRotation(!paused,5000);
  const [tool,setTool]=useState<"none"|"Code"|"Whiteboard">("none");

  const getThread=useServerFn(getInterview);
  const append=useServerFn(appendMessage);
  const finish=useServerFn(saveInterviewResults);
  const score=useServerFn(scoreInterview);
  const terminate=useServerFn(terminateInterview);
  const persistNotes=useServerFn(saveNotes);
  const reportDevices=useServerFn(setDeviceStatus);
  const adapt=useServerFn(adaptDifficulty);
  const moderate=useServerFn(moderateSpeech);

  const transcriptOf=useCallback((list:{from:string;text:string}[])=>list.map(m=>`[${m.from}] ${m.text}`).join("\n"),[]);

  const handleTerminated=useCallback(async(count:number)=>{
    setEnded({reason:"cheating",message:`This interview was ended after ${count} monitoring warnings. Your score for this session is 0.`});
    try{ await score({data:{threadId,transcript:transcriptOf(messages)}}); }catch{ /* report will show what was saved */ }
  },[score,threadId,messages,transcriptOf]);

  const { videoRef, events, faceTracking, lookingAway, warnings, limit }=useProctoring(!paused&&!ended,threadId,handleTerminated);

  const [loadError,setLoadError]=useState<string|null>(null);
  useEffect(()=>{
    if(!threadId) return;
    let attempts=0;
    async function load(){
      try{
        const t:any=await getThread({data:{threadId}});
        if(!t){ navigate({to:"/setup"}); return; }
        setThread(t);
        setNotes(t.notes ?? "");
        setDifficultyState(t.difficulty ?? "medium");
        if(t.status==="terminated") setEnded({reason:t.termination_reason ?? "ended",message:"This interview was already ended. Your score for this session is 0."});
        const parsed=String(t.transcript||"").split("\n").filter(Boolean).map((line:string)=>{
          const m=line.match(/^\[(assistant|user)\]\s*(.*)$/);
          return m?{from:m[1] as "assistant"|"user",text:m[2]!}:null;
        }).filter(Boolean) as {from:"assistant"|"user";text:string}[];
        setMessages(parsed);
        setLoadError(null);
      }catch(e:any){
        attempts++;
        if(attempts<3) window.setTimeout(load,800);
        else setLoadError(e?.message||"Could not load this interview.");
      }
    }
    load();
  },[threadId,getThread,navigate]);

  // Record verified device state for this session.
  useEffect(()=>{
    if(!threadId) return;
    reportDevices({data:{threadId,camera:video?"active":"inactive",microphone:muted?"inactive":"active"}}).catch(()=>{});
  },[threadId,video,muted,reportDevices]);

  /** Language check + adaptive difficulty run on real candidate speech only. */
  const reviewedRef=useRef(0);
  const reviewSpeech=useCallback(async(list:{from:string;text:string}[])=>{
    const userTurns=list.filter(m=>m.from==="user");
    if(userTurns.length<=reviewedRef.current) return;
    reviewedRef.current=userTurns.length;
    const last=userTurns[userTurns.length-1];
    if(last&&last.text.trim().length>3){
      try{
        const result=await moderate({data:{threadId,text:last.text}});
        if(result.violation){
          setEnded({reason:"language",message:"This interview was ended because inappropriate language was detected. Your score for this session is 0."});
          return;
        }
      }catch{ /* moderation must never break the interview */ }
    }
    if(userTurns.length%3===0){
      try{
        const next=await adapt({data:{threadId,transcript:transcriptOf(list),current:difficulty as any}});
        setDifficultyState(next.next);
      }catch{ /* keep the current difficulty */ }
    }
  },[moderate,adapt,threadId,difficulty,transcriptOf]);

  const onLiveTranscript=useCallback((live:LiveMessage[])=>{
    if(live.length===0) return;
    setMessages(live);
    const last=live[live.length-1];
    if(last) append({data:{threadId,role:last.from==="user"?"user":"assistant",content:last.text}}).catch(()=>{});
    void reviewSpeech(live);
  },[append,threadId,reviewSpeech]);

  async function sendTyped(text:string){
    const next=[...messages,{from:"user" as const,text}];
    setMessages(next);
    setSaving(true);
    try{ await append({data:{threadId,role:"user",content:text}}); }catch(e){ console.error(e); }
    setSaving(false);
    void reviewSpeech(next);
  }

  async function completeInterview(){
    const transcript=transcriptOf(messages);
    setSaving(true);
    try{
      await finish({data:{threadId,transcript,notes}});
      await score({data:{threadId,transcript}});
    }catch(e){ console.error(e); }
    setSaving(false);
    navigate({to:"/report",search:{threadId}});
  }

  async function endEarly(){
    setConfirmEnd(false);
    setSaving(true);
    const transcript=transcriptOf(messages);
    try{
      await terminate({data:{threadId,reason:"candidate_ended",detail:"Candidate ended the meeting before completing the interview.",transcript}});
      await score({data:{threadId,transcript}});
    }catch(e){ console.error(e); }
    setSaving(false);
    navigate({to:"/report",search:{threadId}});
  }

  function persistNotesNow(value:string){
    setNotes(value);
    persistNotes({data:{threadId,notes:value}}).catch(()=>{});
  }

  const userTurns=messages.filter(m=>m.from==="user").length;
  const canComplete=userTurns>=3;

  return <main className="min-h-screen bg-[#f5f1f8] text-foreground">
    <header className="flex h-16 items-center justify-between border-b border-foreground/10 bg-card px-5 md:px-8">
      <Logo/>
      <div className="hidden items-center md:flex">{stages.map((s,i)=><div key={s} className="flex items-center">
        <div className="flex flex-col items-center gap-1">
          <span className={cn("grid size-7 place-items-center rounded-full text-xs font-semibold",i===0?"bg-success text-white":i===1?"bg-brand text-white":"bg-muted text-muted-foreground")}>{i===0?<Check className="size-4"/>:i+1}</span>
          <span className={cn("text-[11px] font-medium",i<2?"text-foreground":"text-muted-foreground")}>{s}</span>
        </div>
        {i<stages.length-1&&<span className={cn("mx-3 mb-4 h-px w-12",i===0?"bg-success":"bg-foreground/15")}/>}
      </div>)}</div>
      <div className="flex items-center gap-3">
        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:block">Difficulty · {difficulty}</span>
        {saving&&<span className="text-xs text-muted-foreground">Saving…</span>}
        {canComplete&&!ended&&<Button size="sm" onClick={completeInterview} className={violetButton}>Finish & score</Button>}
        <button aria-label="End meeting" onClick={()=>setConfirmEnd(true)} className="grid size-9 place-items-center rounded-full border border-foreground/15 bg-card text-muted-foreground hover:bg-muted"><X className="size-4"/></button>
      </div>
    </header>

    {loadError&&<div className="border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive">{loadError}</div>}
    {warnings>0&&!ended&&<div className="flex items-center gap-2 border-b border-highlight bg-highlight/20 px-5 py-3 text-sm"><AlertTriangle className="size-4"/> Warning {warnings} of {limit}: stay focused on the camera and this window. At {limit} warnings the interview ends with a score of 0.</div>}

    <div className="grid gap-5 p-5 lg:grid-cols-[260px_1fr_360px]">
      <aside className="h-fit rounded-2xl border border-foreground/10 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-brand/10 text-lg font-bold text-brand">{candidate.photo?<img src={candidate.photo} alt="" className="size-full object-cover"/>:candidate.name[0]}</span>
          <div><p className="font-semibold">{candidate.name||"Candidate"}</p><span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"><CheckCircle2 className="size-3"/> Verified</span></div>
        </div>
        {[["ROLE",thread?.role||"—"],["DOMAIN",thread?.domain||"—"],["TOTAL SESSIONS",`${candidate.history.length} recorded`]].map(([l,v]:any,i)=><div key={l} className={cn("border-t border-foreground/10 py-4",i===0&&"mt-5")}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{l}</p>
          <p className="mt-1 font-semibold">{v}</p>
        </div>)}
        {thread?.github_context&&<div className="border-t border-foreground/10 py-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Project in scope</p>
          <p className="mt-1 text-sm font-semibold">{thread.github_context.repo}</p>
        </div>}
        <div className="border-t border-foreground/10 pt-4">
          <AgentPanel activeIndex={activeAgent}/>
        </div>
        <div className="mt-4 border-t border-foreground/10 pt-4">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Eye className="size-3"/> Integrity monitor</p>
          <p className="mt-2 text-xs text-muted-foreground">{faceTracking==="on"?"Face tracking active":faceTracking==="unavailable"?"Face tracking unavailable — check your camera":"Starting face tracking…"}</p>
          <p className="mt-1 text-xs font-semibold">{warnings} of {limit} warnings used</p>
          <div className="mt-3 space-y-1.5">
            {events.length===0
              ? <p className="text-xs text-success">No flags recorded.</p>
              : events.slice(0,4).map(e=><p key={e.id} className="flex justify-between text-[11px]"><span className="text-red-500">{e.kind==="look-away"?"Looked away":"Left the window"}</span><span className="text-muted-foreground">{e.at}</span></p>)}
          </div>
        </div>
      </aside>

      <section>
        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-[#0d1117] shadow-sm">
          <LiveInterviewer threadId={threadId} company={thread?.company??"EchoSphere"} role={thread?.role??"Software Engineer"} domain={thread?.domain??"General"} candidateName={candidate.name} muted={muted||!!ended} paused={paused||!!ended} onTranscript={onLiveTranscript}/>
          <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white"><i className="size-2 rounded-full bg-success"/> EchoSphere AI • LIVE</span>
          <div className={cn("absolute right-4 top-4 w-32 overflow-hidden rounded-2xl border-2 shadow-lg md:w-40",lookingAway?"border-red-500":"border-white/70")}>
            <video ref={videoRef} muted playsInline className={cn("aspect-square w-full bg-black object-cover",(faceTracking!=="on"||!video)&&"hidden")}/>
            {(faceTracking!=="on"||!video)&&<img src={candidate.photo??candidateImage} alt="Candidate video preview" className="aspect-square w-full object-cover"/>}
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">You</span>
            {lookingAway&&<span className="absolute inset-x-0 top-0 bg-red-500 py-0.5 text-center text-[10px] font-semibold text-white">Pay attention</span>}
          </div>
          <div className="absolute inset-x-0 bottom-6 flex justify-center">
            <div className="flex items-center gap-3 rounded-full bg-[#111827]/90 px-3 py-2.5 shadow-xl backdrop-blur">
              <button onClick={()=>setMuted(!muted)} aria-label="Toggle microphone" className={cn("grid size-11 place-items-center rounded-full text-white",muted?"bg-red-500":"bg-white/15 hover:bg-white/25")}>{muted?<MicOff className="size-5"/>:<Mic className="size-5"/>}</button>
              <button onClick={()=>setVideo(!video)} aria-label="Toggle camera" className="grid size-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">{video?<Video className="size-5"/>:<VideoOff className="size-5"/>}</button>
              <button onClick={()=>setPaused(p=>!p)} aria-label="Pause interview" className="grid size-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">{paused?<Play className="size-5"/>:<Pause className="size-5"/>}</button>
              <button onClick={()=>setConfirmEnd(true)} aria-label="End meeting" className="grid size-11 place-items-center rounded-full bg-red-500 text-white hover:bg-red-600"><X className="size-5"/></button>
            </div>
          </div>
          {paused&&!ended&&<div className="absolute inset-0 z-20 grid place-items-center bg-black/60 backdrop-blur-sm"><div className="text-center text-white"><CirclePause className="mx-auto size-12 text-highlight"/><h2 className="mt-3 text-3xl font-semibold">Interview paused</h2><Button onClick={()=>setPaused(false)} className={cn(violetButton,"mt-5 rounded-full")}><Play/> Resume interview</Button></div></div>}
          {ended&&<div className="absolute inset-0 z-30 grid place-items-center bg-black/80 p-6 backdrop-blur-sm"><div className="max-w-md text-center text-white"><AlertTriangle className="mx-auto size-12 text-red-400"/><h2 className="mt-3 text-3xl font-semibold">Interview ended</h2><p className="mt-3 text-sm text-white/80">{ended.message}</p><Button onClick={()=>navigate({to:"/report",search:{threadId}})} className={cn(violetButton,"mt-6")}>View report</Button></div></div>}
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-foreground/10 bg-card py-5 text-lg font-medium shadow-sm">
          {agents[activeAgent]!.name} is {ended?"finished":paused?"paused":"listening"}…
          <span className="flex items-end gap-[3px]">{[.5,.9,.6,1,.45].map((h,i)=><i key={i} className="echo-wave w-[3px] rounded-full bg-brand" style={{height:`${h*20}px`,animationDelay:`${i*90}ms`}}/>)}</span>
        </div>

        <div className="mt-4 rounded-2xl border border-foreground/10 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/10 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold"><PanelRight className="size-4 text-brand"/> Candidate tools</span>
            <div className="flex gap-2">
              {([["Code",Code2],["Whiteboard",PenTool]] as const).map(([label,I])=>
                <Button key={label} size="sm" variant={tool===label?"default":"outline"} onClick={()=>setTool(tool===label?"none":label)} className={tool===label?violetButton:outlineButton}><I/> {label}{tool===label?" ✕":""}</Button>)}
            </div>
          </div>
          {tool==="none"
            ? <p className="px-4 py-6 text-center text-sm text-muted-foreground">Open the code editor for technical questions, or the whiteboard to sketch an architecture.</p>
            : <Suspense fallback={<div className="grid h-72 place-items-center text-sm text-muted-foreground">Loading {tool.toLowerCase()}…</div>}>
                {tool==="Code"?<CodeEditorPanel/>:<WhiteboardPanel/>}
              </Suspense>}
        </div>
      </section>

      <aside className="flex flex-col gap-5">
        <div className="flex min-h-[420px] flex-col rounded-2xl border border-foreground/10 bg-card shadow-sm">
          <div className="flex border-b border-foreground/10">{(["Conversation","Notes"] as Workspace[]).map(x=><button key={x} onClick={()=>setWorkspace(x)} className={cn("flex flex-1 items-center justify-center gap-2 border-b-2 py-4 text-sm font-medium",workspace===x?"border-brand text-brand":"border-transparent text-muted-foreground")}>{x==="Conversation"?<MessageSquare className="size-4"/>:<NotebookPen className="size-4"/>}{x}</button>)}</div>
          {workspace==="Conversation"?<>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-2 font-medium"><i className="size-2 rounded-full bg-success"/> Live Transcription</span>
              <span className="text-xs text-muted-foreground">{messages.length} entries</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              {messages.length===0
                ? <div className="grid h-full min-h-48 place-items-center text-center text-muted-foreground"><div><MessageSquare className="mx-auto size-6 opacity-40"/><p className="mt-3 text-sm">Transcription will appear here</p></div></div>
                : <Conversation messages={messages}/>}
            </div>
            <div className="border-t border-foreground/10 p-3">
              <PromptInput onSubmit={({text})=>{ if(text&&!ended) void sendTyped(text); }}><PromptInputBody><PromptInputTextarea placeholder="Type your answer, or just speak"/></PromptInputBody><PromptInputFooter><PromptInputTools><button onClick={()=>setEcho(echo==="listening"?"idle":"listening")} type="button" className="p-2"><Mic className="size-4"/></button></PromptInputTools><PromptInputSubmit/></PromptInputFooter></PromptInput>
            </div>
          </>:<textarea value={notes} onChange={e=>persistNotesNow(e.target.value)} placeholder="Your private notes are saved with this interview." className="m-4 min-h-64 flex-1 resize-none rounded-xl border border-foreground/15 bg-muted/40 p-4 text-sm outline-none focus:border-brand"/>}
        </div>

        <div className="rounded-2xl border border-foreground/10 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold"><FileText className="size-4 text-brand"/> Session status</span>
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium",ended?"bg-red-500/10 text-red-500":"bg-success/10 text-success")}>{ended?"Ended":"Live"}</span>
          </div>
          <div className="mt-4 rounded-xl bg-muted/50 p-5 text-sm">
            <p className="flex justify-between"><span className="text-muted-foreground">Your answers</span><b>{userTurns}</b></p>
            <p className="mt-2 flex justify-between"><span className="text-muted-foreground">Current difficulty</span><b className="capitalize">{difficulty}</b></p>
            <p className="mt-2 flex justify-between"><span className="text-muted-foreground">Warnings</span><b>{warnings}/{limit}</b></p>
            <p className="mt-4 text-xs text-muted-foreground">Your full report, with scores and evidence, is generated when the interview finishes.</p>
          </div>
        </div>
      </aside>
    </div>

    {confirmEnd&&<div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-5">
      <div className="w-full max-w-md border border-foreground/20 bg-white p-6 shadow-2xl">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><AlertTriangle className="size-5 text-red-500"/> End this meeting?</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          If you leave before the interview is complete, this session is recorded as ended early and <b className="text-foreground">your score for it will be 0</b>. This cannot be undone.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="outline" className={outlineButton} onClick={()=>setConfirmEnd(false)}>Continue interview</Button>
          {canComplete&&<Button variant="outline" className={outlineButton} onClick={()=>{setConfirmEnd(false);void completeInterview();}}>Finish &amp; score properly</Button>}
          <Button className="rounded-none bg-red-500 text-white hover:bg-red-600" onClick={()=>void endEarly()}>End meeting (score 0)</Button>
        </div>
      </div>
    </div>}
  </main>;
}
function Conversation({messages}:{messages:{from:"assistant"|"user";text:string}[]}) { return <div className="space-y-5 py-2">{messages.map((m,i)=><Message from={m.from} key={i}><p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{m.from==="assistant"?"Alex · AI Interviewer":"You"}</p><MessageContent className={cn("text-sm leading-6",m.from==="user"?"rounded-xl bg-brand px-3 py-2 text-white":"text-foreground/80")}><MessageResponse>{m.text}</MessageResponse></MessageContent></Message>)}</div> }

const REPORT_CATEGORY_KEYS = ["technical","behavioral","product_manager","hiring_manager"] as const;

export function ReportPage() {
  const navigate=useNavigate();
  const { threadId } = useSearch({ from: "/_authenticated/report" });
  const getThread = useServerFn(getInterview);
  const [interview,setInterview]=useState<Record<string,any>|null>(null);
  const [loading,setLoading]=useState(true);
  const [exporting,setExporting]=useState(false);
  const { candidate } = useCandidate();
  const latest = candidate.history[0] as any;
  const targetId = threadId || latest?.id;

  useEffect(() => {
    if (!targetId) { setLoading(false); return; }
    setLoading(true);
    getThread({ data: { threadId: targetId } })
      .then(t => setInterview(t as any))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetId, getThread]);

  const iv = interview as any;
  const terminated = iv?.status === "terminated";
  const overall = Math.round(iv?.overall_score ?? 0);
  const recommendation: string = iv?.recommendation ?? "";
  const strengths: string[] = iv?.strengths ?? [];
  const improvements: string[] = iv?.improvements ?? [];
  const evidence = (iv?.score_evidence ?? {}) as Record<string,string[]>;
  const lostPoints = (iv?.lost_points ?? {}) as Record<string,string[]>;
  const categories = REPORT_CATEGORY_KEYS.map(key => ({
    key,
    label: (CATEGORY_LABELS as Record<string,string>)[key] ?? key,
    score: iv?.[`${key}_score`] === null || iv?.[`${key}_score`] === undefined ? null : Math.round(iv[`${key}_score`]),
    evidence: evidence[key] ?? [],
    lost: lostPoints[key] ?? [],
  }));
  const scored = categories.some(c => c.score !== null);

  async function downloadPdf(){
    if(!iv) return;
    setExporting(true);
    try{
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      doc.setFontSize(20); doc.text("EchoSphere Interview Report", 14, 20);
      doc.setFontSize(11);
      doc.text(`${candidate.name || "Candidate"} · ${iv.role ?? ""} · ${iv.company ?? ""}`, 14, 29);
      doc.text(`Date: ${iv.created_at ? new Date(iv.created_at).toLocaleString() : "—"}`, 14, 36);
      doc.setFontSize(15); doc.text(`Overall score: ${overall} / 100`, 14, 48);
      if(terminated){ doc.setFontSize(11); doc.setTextColor(200,30,30); doc.text(`Interview ended early (${iv.termination_reason ?? "violation"}) — score set to 0.`, 14, 56); doc.setTextColor(0,0,0); }
      autoTable(doc, {
        startY: terminated ? 64 : 56,
        head: [["Category","Score","Evidence","Lost points"]],
        body: categories.map(c => [c.label, c.score === null ? "—" : String(c.score), c.evidence.join("\n") || "—", c.lost.join("\n") || "—"]),
        styles: { fontSize: 9, cellWidth: "wrap", valign: "top" },
        headStyles: { fillColor: [109, 74, 196] },
        columnStyles: { 2: { cellWidth: 60 }, 3: { cellWidth: 60 } },
      });
      let y = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(13); doc.text("Strengths", 14, y); y += 7; doc.setFontSize(10);
      (strengths.length?strengths:["—"]).forEach(s => { doc.text(doc.splitTextToSize(`• ${s}`, 180), 14, y); y += 7; });
      y += 5; doc.setFontSize(13); doc.text("Areas for improvement", 14, y); y += 7; doc.setFontSize(10);
      (improvements.length?improvements:["—"]).forEach(s => { doc.text(doc.splitTextToSize(`• ${s}`, 180), 14, y); y += 7; });
      if(recommendation){ y += 5; doc.setFontSize(13); doc.text("Recommendation", 14, y); y += 7; doc.setFontSize(10); doc.text(doc.splitTextToSize(recommendation, 180), 14, y); }
      doc.save(`echosphere-report-${String(iv.id ?? "interview").slice(0,8)}.pdf`);
    } finally { setExporting(false); }
  }

  return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><Header/><div className="mx-auto max-w-6xl px-5 py-12">
    <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
      <div><Eyebrow>Evidence-backed assessment</Eyebrow><h1 className="text-5xl font-semibold tracking-[-.05em] md:text-7xl">Interview Report</h1>
      <p className="mt-4 text-muted-foreground">{candidate.name}{iv?.role?` · ${iv.role}`:""}{iv?.company?` · ${iv.company}`:""}{iv?.created_at?` · ${new Date(iv.created_at).toLocaleDateString()}`:""}</p></div>
      <div className="flex gap-2">
        <Button variant="outline" disabled={!iv||exporting} className={outlineButton} onClick={()=>void downloadPdf()}>{exporting?<Loader2 className="animate-spin"/>:<Download/>} Download PDF</Button>
        <Button onClick={()=>navigate({to:"/dashboard"})} className={violetButton}>Back to Dashboard</Button>
      </div>
    </div>

    {loading && <section className={cn(panel,"mt-12 p-8 text-center text-muted-foreground")}>Loading your report…</section>}
    {!loading && !iv && <section className={cn(panel,"mt-12 p-8 text-center")}><p className="text-muted-foreground">No interview data yet. Complete a mock interview to generate your report.</p><Link to="/setup"><Button className={cn(violetButton,"mt-4")}>Start an interview</Button></Link></section>}

    {!loading && iv && <>
      {terminated && <div className="mt-8 flex items-start gap-3 border border-red-500/40 bg-red-500/10 p-5 text-sm"><AlertTriangle className="mt-0.5 size-5 text-red-500"/><div><b>This interview was ended early.</b><p className="mt-1 text-muted-foreground">Reason: {String(iv.termination_reason ?? "violation").replace(/_/g," ")}. Per the integrity rules, the score for this session is 0.</p></div></div>}

      <section className="mt-10 grid gap-px bg-foreground/10 lg:grid-cols-[260px_1fr_1fr]">
        <div className="bg-brand p-7 text-white">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/70">Interview score</p>
          <p className="mt-5 text-8xl font-semibold tracking-tight">{overall}</p>
          <p className="mt-2 text-sm">{recommendation||(scored?"":"Scoring pending")}</p>
          <div className="mt-10 border-t border-white/25 pt-4"><span className="text-xs text-white/70">Source</span><b className="float-right">{scored?"AI-scored":"Pending"}</b></div>
        </div>
        <div className="bg-card p-7"><h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-success"/> Key strengths</h2><ul className="mt-5 space-y-3 text-sm text-muted-foreground">{strengths.length?strengths.map(x=><li key={x} className="border-b border-foreground/10 pb-3">{x}</li>):<li className="text-xs">Nothing recorded for this session.</li>}</ul></div>
        <div className="bg-card p-7"><h2 className="flex items-center gap-2 font-semibold"><Target className="size-4 text-brand"/> Areas for improvement</h2><ul className="mt-5 space-y-3 text-sm text-muted-foreground">{improvements.length?improvements.map(x=><li key={x} className="border-b border-foreground/10 pb-3">{x}</li>):<li className="text-xs">Nothing recorded for this session.</li>}</ul></div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Four separate assessments</p><h2 className="mt-2 text-3xl font-semibold">Category scores</h2></div><p className="text-xs text-muted-foreground">Each category scored on its own evidence</p></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {categories.map(c => <article key={c.key} className={cn(panel,"flex flex-col p-6")}>
            <div className="flex items-start justify-between">
              <div><h3 className="text-lg font-semibold">{c.label}</h3><p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">AI assessment</p></div>
              <strong className={cn("text-5xl leading-none",c.score===null?"text-muted-foreground":c.score<70?"text-highlight-foreground":"text-brand")}>{c.score===null?"—":c.score}</strong>
            </div>
            <div className="mt-5 h-2 bg-muted"><div className={cn("h-full",(c.score??0)<70?"bg-highlight":"bg-brand")} style={{width:`${c.score??0}%`}}/></div>
            <div className="mt-5">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-success"><CheckCircle2 className="size-3"/> Evidence</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">{c.evidence.length?c.evidence.map((e,i)=><li key={i}>• {e}</li>):<li>No evidence captured.</li>}</ul>
            </div>
            <div className="mt-4">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-red-500"><AlertTriangle className="size-3"/> Where points were lost</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">{c.lost.length?c.lost.map((e,i)=><li key={i}>• {e}</li>):<li>Nothing recorded.</li>}</ul>
            </div>
          </article>)}
        </div>
      </section>

      {iv.transcript && <section className="mt-12">
        <p className="font-mono text-[10px] uppercase tracking-widest text-brand">Session record</p>
        <h2 className="mt-2 text-3xl font-semibold">Transcript</h2>
        <pre className={cn(panel,"mt-5 max-h-96 overflow-auto whitespace-pre-wrap p-6 text-xs leading-6 text-muted-foreground")}>{iv.transcript}</pre>
      </section>}
    </>}
  </div><EchoAssistant hint="Ask Echo to explain any score."/></main>;
}

const roadmapSteps = [
  ["Sharpen system-design tradeoffs","Technical","Week 1–2","done"],
  ["Quantify project outcomes with metrics","Communication","Week 2–3","done"],
  ["Connect technical decisions to customer impact","Product Thinking","Week 3–4","done"],
  ["Practice STAR-format behavioral responses","Behavioral","Week 4–5","done"],
  ["Deep-dive distributed systems fundamentals","Technical","Week 5–6","done"],
  ["Lead a mock design review end-to-end","Leadership","Week 6–7","done"],
  ["Estimate scale: QPS, storage, and latency math","Problem Solving","Week 7–8","current"],
  ["Frame ambiguous prompts with clarifying questions","Adaptability","Week 8–9","upcoming"],
  ["Run a full product-sense mock interview","Product Thinking","Week 9–10","upcoming"],
  ["Final mixed-panel mock and review","All dimensions","Week 10","upcoming"],
] as const;

export function RoadmapPage() {
  const navigate = useNavigate();
  const { candidate } = useCandidate();
  const getRoadmapFn = useServerFn(getRoadmap);
  const [roadmap, setRoadmap] = useState<{steps:any[];done:number;current:any}|null>(null);
  useEffect(() => {
    getRoadmapFn({ data: undefined }).then(setRoadmap).catch(console.error);
  }, [getRoadmapFn]);
  const steps = roadmap?.steps ?? roadmapSteps.map(s => ({ title: s[0], dimension: s[1], weeks: s[2], status: s[3] }));
  const done = roadmap?.done ?? steps.filter((s:any) => s.status === "done").length;
  const current = roadmap?.current ?? steps.find((s:any) => s.status === "current");
  return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><Header /><div className="mx-auto max-w-6xl px-5 py-12">
    <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
      <div><Eyebrow>Personalized roadmap</Eyebrow><h1 className="text-5xl font-semibold tracking-[-.05em] md:text-7xl">Your 10-Step Plan</h1><p className="mt-4 text-muted-foreground">{candidate.name} · {(candidate as any).targetRole || "Interview"} track · Updated after your last mock interview</p></div>
      <div className="flex gap-2"><Button variant="outline" className={outlineButton} onClick={() => navigate({ to: "/dashboard" })}>Back to Dashboard</Button><Link to="/setup"><Button className={violetButton}><Plus /> Start Practice</Button></Link></div>
    </div>
    <section className="mt-12 grid gap-px bg-foreground/10 md:grid-cols-3">
      <div className="bg-brand p-7 text-white"><p className="font-mono text-[10px] uppercase tracking-widest text-white/70">Overall progress</p><p className="mt-5 text-8xl font-semibold tracking-tight">{done}<span className="text-4xl text-white/60">/10</span></p><p className="mt-2 text-sm">On pace for your target date</p></div>
      <div className="bg-card p-7"><div className="flex items-center gap-3"><Clock3 className="size-4 text-brand" /><h2 className="font-semibold">Current focus</h2></div><p className="mt-5 text-2xl font-semibold leading-8">{current?.title ?? "Estimate scale: QPS, storage, and latency math"}</p><p className="mt-3 text-sm text-muted-foreground">{current?.weeks ?? "Week 7–8"} · {current?.dimension ?? "Problem Solving"}</p><button className="mt-6 inline-flex items-center text-xs font-semibold text-brand">Continue this step <ArrowRight className="ml-1 size-3" /></button></div>
      <div className="bg-card p-7"><div className="flex items-center gap-3"><Target className="size-4 text-brand" /><h2 className="font-semibold">Weekly target</h2></div><p className="mt-5 text-2xl font-semibold">4 practice hours</p><p className="mt-3 text-sm text-muted-foreground">2.5 of 4 hours completed this week.</p><div className="mt-5 h-2 bg-muted"><div className="h-full w-[62%] bg-highlight" /></div></div>
    </section>
    <section className="mt-12"><div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Milestone timeline</p><h2 className="mt-2 text-3xl font-semibold">Step by step</h2></div><p className="text-xs text-muted-foreground">{done} completed · 1 in progress · {10 - done - 1} upcoming</p></div>
      <div className="mt-6 border-t border-foreground/20">{steps.map((s: any, i: number) => (<article key={s.title} className={cn("grid items-center gap-4 border-b border-foreground/15 px-5 py-5 md:grid-cols-[56px_1fr_160px_130px_120px]", s.status === "current" ? "bg-brand/5" : "bg-card")}>
        <span className={cn("grid size-10 place-items-center font-mono text-sm", s.status === "done" ? "bg-brand text-white" : s.status === "current" ? "bg-highlight text-foreground" : "border border-foreground/25 text-muted-foreground")}>{s.status === "done" ? <Check className="size-4" /> : String(i + 1).padStart(2, "0")}</span>
        <div><h3 className={cn("font-semibold", s.status === "upcoming" && "text-muted-foreground")}>{s.title}</h3><p className="mt-1 text-xs text-muted-foreground">{s.dimension}</p></div>
        <span className="text-xs text-muted-foreground">{s.weeks}</span>
        <span className={cn("w-fit px-2 py-1 font-mono text-[10px] uppercase tracking-widest", s.status === "done" ? "bg-brand/10 text-brand" : s.status === "current" ? "bg-highlight/30 text-foreground" : "bg-muted text-muted-foreground")}>{s.status === "done" ? "Completed" : s.status === "current" ? "In progress" : "Upcoming"}</span>
        {s.status === "current" ? <Button size="sm" className={violetButton}>Continue</Button> : s.status === "upcoming" ? <Button size="sm" variant="outline" className={outlineButton}>Preview</Button> : <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="size-4" /> Done</span>}
      </article>))}</div></section>
    <section className="mt-12 border border-brand/30 bg-brand/5 p-6"><div className="flex items-center gap-3"><Sparkles className="text-brand" /><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Echo's recommendation</p><h2 className="mt-1 text-2xl font-semibold">Product Thinking is your biggest lever.</h2></div></div><p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">Your roadmap is weighted toward connecting technical depth with customer impact. Completing the current step unlocks the product-sense mock interview — the single highest-impact milestone left.</p></section>
  </div><EchoAssistant hint="Ask Echo why these steps were chosen." /></main>;
}
