import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight, ArrowUpRight, Award, BarChart3, BookOpen, BriefcaseBusiness, Camera,
  Check, CheckCircle2, ChevronRight, CirclePause, Clock3, Download, FileText,
  Github, GraduationCap, Headphones, LayoutDashboard, LockKeyhole, Menu, MessageSquare,
  Mic, MicOff, MonitorUp, MoreHorizontal, Network, NotebookPen, Pause, Play, Plus,
  Radio, RefreshCw, Route, Send, ShieldCheck, Sparkles, Target, Upload, UserRound,
  Video, VideoOff, Volume2, WandSparkles, X, Zap,
  Aperture, Code2, PenTool, Eye, TrendingUp, PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import alexImage from "@/assets/interviewer-alex.jpg";
import candidateImage from "@/assets/candidate-arjun.jpg";
import { cn } from "@/lib/utils";
import { useCandidate, requiredProfileFields, type CandidateProfile } from "@/lib/candidate-store";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createInterview, getInterview, appendMessage, saveInterviewResults } from "@/lib/interview.functions";
import { scoreInterview } from "@/lib/scoring.functions";
import { getRoadmap } from "@/lib/roadmap.functions";
import { HeroPanelAnimation } from "@/components/echosphere/hero-animation";
import { AgentPanel, agents, useAgentRotation } from "@/components/echosphere/agent-panel";
import { LiveInterviewer, type LiveMessage } from "@/components/echosphere/live-interviewer";
import { useProctoring } from "@/components/echosphere/use-proctoring";
import { CameraRecorder } from "@/components/echosphere/camera-recorder";

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

function EchoOrb({ mode = "idle", onClick, small = false }: { mode?: EchoMode; onClick?: () => void; small?: boolean }) {
  return <button onClick={onClick} aria-label="Activate Echo voice assistant" className={cn("echo-pulse relative grid rounded-full bg-brand text-white transition-transform hover:scale-105", small ? "size-11" : "size-16")}>
    <span className="absolute inset-[5px] rounded-full border border-white/30" />
    <span className="flex h-full items-center justify-center gap-[3px]">
      {[.5, .85, 1, .65, .4].map((height, i) => <i key={i} className={cn("w-[2px] rounded-full bg-white", mode !== "idle" && "echo-wave")} style={{ height: `${height * (small ? 16 : 23)}px`, animationDelay: `${i * 90}ms` }} />)}
    </span>
  </button>;
}

function EchoAssistant({ dark = false, hint = "What would you like to work on?" }: { dark?: boolean; hint?: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<EchoMode>("idle");
  const [answer, setAnswer] = useState("");
  function activate() {
    setOpen(true); setMode("listening"); setAnswer("");
    window.setTimeout(() => setMode("thinking"), 1300);
    window.setTimeout(() => { setMode("speaking"); setAnswer("Your Product Thinking score has the most room to grow. I can start a focused 10-minute practice session."); }, 2400);
    window.setTimeout(() => setMode("idle"), 5200);
  }
  return <div className="fixed bottom-5 right-5 z-50 flex items-end gap-3">
    {open && <div className={cn("w-[min(360px,calc(100vw-90px))] border p-4 shadow-2xl", dark ? "border-white/15 bg-[#211b27] text-white" : "border-foreground/20 bg-white")}>
      <div className="mb-3 flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Echo assistant</p><p className="mt-1 text-sm font-semibold">{mode === "listening" ? "Listening…" : mode === "thinking" ? "Thinking…" : mode === "speaking" ? "Speaking" : hint}</p></div><button aria-label="Close Echo Assistant" onClick={() => setOpen(false)}><X className="size-4 opacity-60" /></button></div>
      {answer && <p className={cn("border-l-2 border-highlight pl-3 text-sm leading-6", dark ? "text-white/70" : "text-muted-foreground")}>{answer}</p>}
      <div className="mt-4 flex flex-wrap gap-2">{["Start interview", "Review report", "Practice weak skill"].map(x => <button onClick={activate} key={x} className={cn("border px-2.5 py-1.5 text-[11px]", dark ? "border-white/15 hover:bg-white/10" : "border-foreground/15 hover:bg-muted")}>{x}</button>)}</div>
    </div>}
    <div className="flex flex-col items-center gap-1.5"><EchoOrb small onClick={open ? activate : () => setOpen(true)} mode={mode} /><span className={cn("font-mono text-[9px] uppercase tracking-wider", dark ? "text-white/65" : "text-muted-foreground")}>Hey Echo</span></div>
  </div>;
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


export function DashboardPage() {
  const { candidate, profileComplete } = useCandidate();
  return <main className="min-h-screen bg-[#f5f1f8]"><Header/><div className="mx-auto max-w-5xl px-5 py-16 md:px-10">
    <Eyebrow>Candidate workspace</Eyebrow>
    <h1 className="text-4xl font-semibold tracking-[-.04em] md:text-6xl">Welcome back, {candidate.name.split(" ")[0]}.</h1>
    <p className="mt-3 text-muted-foreground">{candidate.email}</p>
    {!profileComplete && <div className={cn(panel,"mt-8 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-brand p-5")}>
      <p className="text-sm">Complete your profile details before starting an interview.</p>
      <Link to="/profile/edit"><Button size="sm" className={violetButton}>Edit profile</Button></Link>
    </div>}
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

export function EditProfilePage() {
  const navigate=useNavigate();
  const { candidate, setProfile }=useCandidate();
  const [form,setForm]=useState<CandidateProfile>(candidate.profile);
  const [saved,setSaved]=useState(false);
  const [touched,setTouched]=useState(false);
  useEffect(()=>{setForm(candidate.profile)},[candidate.profile]);
  const set=(k:keyof CandidateProfile)=>(v:string)=>{setForm(f=>({...f,[k]:v.slice(0,300)}));setSaved(false)};
  const missing=requiredProfileFields.filter(f=>!form[f].trim());
  const complete=missing.length===0;
  const filled=Object.values(form).filter(v=>v.trim()).length;
  const percent=Math.round((filled/Object.keys(form).length)*100);
  function submit(e:React.FormEvent){
    e.preventDefault(); setTouched(true);
    if(!complete) return;
    setProfile({...form,github:form.github.trim()}); setSaved(true);
    window.setTimeout(()=>navigate({to:"/profile"}),450);
  }
  const err=(k:keyof CandidateProfile)=>touched&&requiredProfileFields.includes(k)&&!form[k].trim();
  const field=(k:keyof CandidateProfile,label:string,placeholder="")=><label key={k} className="text-xs font-semibold">{label}{requiredProfileFields.includes(k)&&<span className="text-brand"> *</span>}
    <input value={form[k]} placeholder={placeholder} onChange={e=>set(k)(e.target.value)} className={cn("mt-2 h-11 w-full border px-3 outline-none focus:border-brand",err(k)?"border-destructive":"border-foreground/20")}/>
    {err(k)&&<span className="mt-1 block font-normal text-[11px] text-destructive">This field is required.</span>}
  </label>;
  return <main className="min-h-screen bg-[#f5f1f8]"><Header/><div className="mx-auto max-w-6xl px-5 py-12">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><Eyebrow>Context builder</Eyebrow><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Edit Profile</h1><p className="mt-3 max-w-2xl text-muted-foreground">Resume, project repository, education and certifications personalize your AI mock interviewer. Required fields must be filled before you can start an interview.</p></div>
      <div className="w-56"><p className="flex justify-between font-mono text-[10px] uppercase"><span>Context complete</span><b>{percent}%</b></p><div className="mt-2 h-2 bg-white"><div className="h-full bg-brand" style={{width:`${percent}%`}}/></div></div>
    </div>
    <form onSubmit={submit} className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <FormSection number="A" title="Candidate resume" icon={<FileText/>}>
        <label className={cn("grid min-h-40 cursor-pointer place-items-center border border-dashed bg-muted/50 text-center hover:border-brand",err("resumeName")?"border-destructive":"border-foreground/30")}>
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e=>set("resumeName")(e.target.files?.[0]?.name||"")}/>
          <div><Upload className="mx-auto mb-3 text-brand"/><b>{form.resumeName||"Drop your resume or browse"}</b><p className="mt-1 text-xs text-muted-foreground">PDF, DOC, DOCX · Maximum 10MB</p></div>
        </label>
        {err("resumeName")&&<p className="mt-2 text-[11px] text-destructive">A resume is required.</p>}
      </FormSection>
      <FormSection number="B" title="Best project GitHub link" icon={<Github/>}>
        {field("github","Repository URL","https://github.com/username/project")}
        <p className="mt-3 text-xs leading-5 text-muted-foreground">The interviewer will evaluate code structure and architecture from this project.</p>
      </FormSection>
      <FormSection number="C" title="Educational details" icon={<GraduationCap/>}><div className="grid gap-4 sm:grid-cols-2">{field("institution","Institution / College / University")}{field("degree","Degree")}{field("department","Department / Branch")}{field("graduationYear","Graduation Year")}</div></FormSection>
      <FormSection number="D" title="Certifications" icon={<Award/>}><div className="grid gap-3 sm:grid-cols-2">{field("certificationName","Certification Name")}{field("certificationOrg","Issuing Organization")}{field("certificationYear","Year / Issue Date")}{field("certificationUrl","Credential URL")}</div></FormSection>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-foreground/15 pt-6 lg:col-span-2">
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="size-4 text-brand"/> {saved?"Profile saved.":touched&&!complete?`${missing.length} required field(s) still missing.`:"EchoSphere is building your interview context…"}</p>
        <div className="flex gap-2"><Button type="button" variant="outline" className={outlineButton} onClick={()=>navigate({to:"/profile"})}>Cancel</Button><Button className={violetButton}>Save Profile <ArrowRight/></Button></div>
      </div>
    </form>
  </div><EchoAssistant/></main>;
}
function FormSection({number,title,icon,children}:{number:string;title:string;icon:ReactNode;children:ReactNode}) { return <section className={cn(panel,"p-6")}><div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-3"><span className="font-mono text-xs text-brand">{number}</span><h2 className="text-xl font-semibold">{title}</h2></div><span className="text-brand">{icon}</span></div>{children}</section> }

type CheckStatus="PASS"|"NOT ACTIVE"|"FAIL"|"CHECKING";
export function SystemCheckPage() {
  const navigate=useNavigate(); const [statuses,setStatuses]=useState<CheckStatus[]>(["PASS","NOT ACTIVE","NOT ACTIVE","PASS"]); const [camera,setCamera]=useState(false); const video=useRef<HTMLVideoElement>(null);
  const { candidate, setPhoto } = useCandidate();
  const [draftPhoto,setDraftPhoto]=useState<string|null>(null);
  function capturePhoto(){const v=video.current;if(!v)return;const c=document.createElement("canvas");c.width=v.videoWidth||640;c.height=v.videoHeight||480;const ctx=c.getContext("2d");if(!ctx)return;ctx.drawImage(v,0,0,c.width,c.height);setDraftPhoto(c.toDataURL("image/jpeg",0.85));}
  async function enableCamera(){try{const s=await navigator.mediaDevices.getUserMedia({video:true,audio:true});if(video.current)video.current.srcObject=s;setCamera(true);setStatuses(p=>["PASS","PASS",p[2]!,"PASS"])}catch{setStatuses(p=>["FAIL","FAIL",p[2]!,"PASS"])}}
  function screen(){setStatuses(p=>[p[0]!,p[1]!,"CHECKING",p[3]!]);navigator.mediaDevices?.getDisplayMedia?.({video:true}).then(()=>setStatuses(p=>[p[0]!,p[1]!,"PASS",p[3]!])).catch(()=>setStatuses(p=>[p[0]!,p[1]!,"NOT ACTIVE",p[3]!]))}
  const ready=statuses[0]==="PASS"&&statuses[1]==="PASS"&&statuses[3]==="PASS";

  return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><Header/><div className="mx-auto max-w-6xl px-5 py-10"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><Eyebrow>Pre-flight check</Eyebrow><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">System environment check</h1></div><div className={cn("border px-5 py-3 font-mono text-sm",ready?"border-success text-success":"border-highlight bg-highlight/10 text-highlight-foreground")}><span className="mr-3 inline-block size-2 rounded-full bg-current"/>{ready?"READY":"ACTION REQUIRED"}</div></div>
    <div className="mt-9 grid gap-4 md:grid-cols-2"><CheckCard icon={<Camera/>} n="01" title="Camera Access & Video Preview" status={statuses[0]!}><div className="relative aspect-video overflow-hidden bg-muted">{camera?<video ref={video} autoPlay muted className="size-full object-cover"/>:<div className="grid size-full place-items-center"><Button onClick={enableCamera} className={violetButton}><Camera/> Enable Camera & Microphone</Button></div>}</div></CheckCard>
    <CheckCard icon={<Mic/>} n="02" title="Microphone Access & Input Level" status={statuses[1]!}><div className="flex h-28 items-center gap-1 bg-muted px-8">{Array.from({length:28},(_,i)=><i key={i} className="w-1 bg-brand" style={{height:camera?`${18+(i*13)%62}%`:"8%"}}/>)}</div></CheckCard>
    <CheckCard icon={<MonitorUp/>} n="03" title="Screen Sharing Verification" status={statuses[2]!}><div className="flex h-28 items-center justify-between bg-muted px-5"><span className="text-sm text-muted-foreground">{statuses[2]==="PASS"?"Screen sharing verified":"Screen Sharing Not Started"}</span><Button onClick={screen} variant="outline" className={outlineButton}>Share Screen Now</Button></div></CheckCard>
    <CheckCard icon={<Network/>} n="04" title="Real Network & Backend Health" status={statuses[3]!}><div className="grid h-28 grid-cols-2 place-items-center bg-muted"><div><p className="text-xs text-muted-foreground">Backend Reachable</p><b className="text-success">Yes</b></div><div><p className="text-xs text-muted-foreground">Latency</p><b>42 ms</b></div></div><button className="mt-3 flex items-center gap-2 text-xs text-brand"><RefreshCw className="size-3"/> Re-check Connectivity</button></CheckCard>
    <div className="md:col-span-2"><CheckCard icon={<Aperture/>} n="05" title="Candidate Profile Photo" status={candidate.photo?"PASS":"NOT ACTIVE"}>
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
    <div className="mt-8 flex justify-end"><Button disabled={!ready} onClick={()=>navigate({to:"/video-test"})} className={cn(violetButton,"disabled:shadow-none")}>Continue to Sample Video <ArrowRight/></Button></div></div></main>;
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
  const [thread,setThread]=useState<{company:string;role:string;domain:string;status:string}|null>(null);
  const [saving,setSaving]=useState(false);
  const { candidate } = useCandidate();
  const activeAgent = useAgentRotation(!paused, 5000);
  const { videoRef, events, faceTracking, lookingAway } = useProctoring(!paused);
  const [tool,setTool]=useState<"none"|"Code"|"Whiteboard">("none");
  const getThread = useServerFn(getInterview);
  const append = useServerFn(appendMessage);
  const finish = useServerFn(saveInterviewResults);
  const score = useServerFn(scoreInterview);

  const [loadError,setLoadError]=useState<string|null>(null);
  useEffect(() => {
    if (!threadId) return;
    let attempts = 0;
    async function load() {
      try {
        const t = await getThread({ data: { threadId } });
        if (!t) { navigate({ to: "/setup" }); return; }
        setThread(t as any);
        const transcript = (t as any).transcript || "";
        const parsed = transcript.split("\n").filter(Boolean).map((line: string) => {
          const m = line.match(/^\[(assistant|user)\]\s*(.*)$/);
          return m ? { from: m[1] as "assistant"|"user", text: m[2] } : null;
        }).filter(Boolean) as {from:"assistant"|"user";text:string}[];
        setMessages(parsed);
        setLoadError(null);
      } catch (e: any) {
        attempts++;
        if (attempts < 3) {
          window.setTimeout(load, 800);
        } else {
          setLoadError(e?.message || "Could not load this interview.");
        }
      }
    }
    load();
  }, [threadId, getThread, navigate]);

  const onLiveTranscript = useCallback((live: LiveMessage[]) => {
    if (live.length === 0) return;
    setMessages(live);
    const last = live[live.length - 1];
    if (last) {
      append({ data: { threadId, role: last.from === "user" ? "user" : "assistant", content: last.text } }).catch(() => {});
    }
  }, [append, threadId]);

  async function command(text:string){
    const q=text.toLowerCase();
    const userMsg = { from: "user" as const, text };
    setMessages(m=>[...m,userMsg]);
    setSaving(true);
    try { await append({ data: { threadId, role: "user", content: text } }); } catch (e) { console.error(e); }
    setSaving(false);
    setEcho("thinking");
    window.setTimeout(async () => {
      let reply="I’m ready when you are.";
      if(q.includes("notes")){setWorkspace("Notes");reply="Opening your notes."}
      else if(q.includes("repeat")){reply="Repeating the current question: How would you design a globally distributed URL shortening service?"}
      else if(q.includes("pause")){setPaused(true);reply="Interview paused."}
      const assistantMsg = { from: "assistant" as const, text: reply };
      setMessages(m=>[...m,assistantMsg]);
      setSaving(true);
      try { await append({ data: { threadId, role: "assistant", content: reply } }); } catch (e) { console.error(e); }
      setSaving(false);
      setEcho("speaking");
      window.setTimeout(()=>setEcho("idle"),1800);
    }, 900);
  }

  async function endInterview() {
    const transcript = messages.map(m => `[${m.from}] ${m.text}`).join("\n");
    setSaving(true);
    try {
      await finish({ data: { threadId, transcript, notes: "" } });
      await score({ data: { threadId, transcript } });
    } catch (e) { console.error(e); }
    setSaving(false);
    navigate({ to: "/report", search: { threadId } });
  }

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
        {saving&&<span className="text-xs text-muted-foreground">Saving…</span>}
        <button aria-label="Exit interview" onClick={endInterview} className="grid size-9 place-items-center rounded-full border border-foreground/15 bg-card text-muted-foreground hover:bg-muted"><X className="size-4"/></button>
      </div>
    </header>

    <div className="grid gap-5 p-5 lg:grid-cols-[260px_1fr_360px]">
      <aside className="h-fit rounded-2xl border border-foreground/10 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-brand/10 text-lg font-bold text-brand">{candidate.photo?<img src={candidate.photo} alt="" className="size-full object-cover"/>:candidate.name[0]}</span>
          <div><p className="font-semibold">Candidate</p><span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"><CheckCircle2 className="size-3"/> Verified</span></div>
        </div>
        {[["ROLE",thread?.role||"Software Engineer",Clock3],["DOMAIN",thread?.domain||"General",Clock3],["TOTAL SESSIONS",`${candidate.history.length} completed`,Clock3]].map(([l,v]:any,i)=><div key={l} className={cn("border-t border-foreground/10 py-4",i===0&&"mt-5")}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{l}</p>
          <p className="mt-1 font-semibold">{v}</p>
        </div>)}
        <div className="border-t border-foreground/10 pt-4">
          <AgentPanel activeIndex={activeAgent}/>
        </div>
        <div className="mt-4 border-t border-foreground/10 pt-4">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Eye className="size-3"/> Integrity monitor</p>
          <p className="mt-2 text-xs text-muted-foreground">{faceTracking?"Face tracking active · local only":"Face tracking unavailable — camera or model not loaded"}</p>
          <div className="mt-3 space-y-1.5">
            {events.length===0
              ? <p className="text-xs text-success">No flags recorded.</p>
              : events.slice(0,4).map(e=><p key={e.id} className="flex justify-between text-[11px]"><span className="text-red-500">{e.kind==="look-away"?"Looked away":"Left the window"}</span><span className="text-muted-foreground">{e.at}</span></p>)}
          </div>
        </div>
      </aside>

      <section>
        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-[#0d1117] shadow-sm">
          <LiveInterviewer threadId={threadId} company={thread?.company??"EchoSphere"} role={thread?.role??"Software Engineer"} domain={thread?.domain??"General"} candidateName={candidate.name} muted={muted} paused={paused} onTranscript={onLiveTranscript}/>
          <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white"><i className="size-2 rounded-full bg-success"/> EchoSphere AI • LIVE</span>
          <div className={cn("absolute right-4 top-4 w-32 overflow-hidden rounded-2xl border-2 shadow-lg md:w-40",lookingAway?"border-red-500":"border-white/70")}>
            <video ref={videoRef} muted playsInline className={cn("aspect-square w-full bg-black object-cover",(!faceTracking||!video)&&"hidden")}/>
            {(!faceTracking||!video)&&<img src={candidate.photo??candidateImage} alt="Candidate video preview" className="aspect-square w-full object-cover"/>}
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">You</span>
            {lookingAway&&<span className="absolute inset-x-0 top-0 bg-red-500 py-0.5 text-center text-[10px] font-semibold text-white">Pay attention</span>}
          </div>
          <div className="absolute inset-x-0 bottom-6 flex justify-center">
            <div className="flex items-center gap-3 rounded-full bg-[#111827]/90 px-3 py-2.5 shadow-xl backdrop-blur">
              <button onClick={()=>setMuted(!muted)} aria-label="Toggle microphone" className={cn("grid size-11 place-items-center rounded-full text-white",muted?"bg-red-500":"bg-white/15 hover:bg-white/25")}>{muted?<MicOff className="size-5"/>:<Mic className="size-5"/>}</button>
              <button onClick={()=>setVideo(!video)} aria-label="Toggle camera" className="grid size-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">{video?<Video className="size-5"/>:<VideoOff className="size-5"/>}</button>
              <button onClick={endInterview} aria-label="End interview" className="grid size-11 place-items-center rounded-full bg-red-500 text-white hover:bg-red-600"><X className="size-5"/></button>
            </div>
          </div>
          {paused&&<div className="absolute inset-0 z-20 grid place-items-center bg-black/60 backdrop-blur-sm"><div className="text-center text-white"><CirclePause className="mx-auto size-12 text-highlight"/><h2 className="mt-3 text-3xl font-semibold">Interview paused</h2><Button onClick={()=>setPaused(false)} className={cn(violetButton,"mt-5 rounded-full")}><Play/> Resume interview</Button></div></div>}
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-foreground/10 bg-card py-5 text-lg font-medium shadow-sm">
          {agents[activeAgent]!.name} is {paused?"paused":"listening"}…
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
              <button onClick={()=>setMessages([])} className="text-xs font-medium text-red-500">Clear</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              {messages.length===0
                ? <div className="grid h-full min-h-48 place-items-center text-center text-muted-foreground"><div><MessageSquare className="mx-auto size-6 opacity-40"/><p className="mt-3 text-sm">Transcription will appear here</p></div></div>
                : <Conversation messages={messages}/>}
            </div>
            <div className="border-t border-foreground/10 p-3">
              <PromptInput onSubmit={({text})=>{ if(text) command(text); }}><PromptInputBody><PromptInputTextarea placeholder="Type or say ‘Hey Echo…’"/></PromptInputBody><PromptInputFooter><PromptInputTools><button onClick={()=>setEcho(echo==="listening"?"idle":"listening")} type="button" className="p-2"><Mic className="size-4"/></button></PromptInputTools><PromptInputSubmit/></PromptInputFooter></PromptInput>
            </div>
          </>:<textarea defaultValue="Ask about data consistency tradeoffs.&#10;&#10;Mention Kafka partition strategy." className="m-4 min-h-64 flex-1 resize-none rounded-xl border border-foreground/15 bg-muted/40 p-4 text-sm outline-none focus:border-brand"/>}
        </div>

        <div className="rounded-2xl border border-foreground/10 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold"><FileText className="size-4 text-brand"/> Interview Summary</span>
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">Updated</span>
          </div>
          <div className="mt-4 rounded-xl bg-muted/50 p-5 text-center">
            <p className="font-medium">Listening for key points…</p>
            <p className="mt-2 text-sm text-muted-foreground">I will summarize the detected technical concepts and behavioral traits here as we talk.</p>
          </div>
        </div>
      </aside>
    </div>
  </main>;
}
function Conversation({messages}:{messages:{from:"assistant"|"user";text:string}[]}) { return <div className="space-y-5 py-2">{messages.map((m,i)=><Message from={m.from} key={i}><p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{m.from==="assistant"?"Alex · AI Interviewer":"You"}</p><MessageContent className={cn("text-sm leading-6",m.from==="user"?"rounded-xl bg-brand px-3 py-2 text-white":"text-foreground/80")}><MessageResponse>{m.text}</MessageResponse></MessageContent></Message>)}</div> }

export function ReportPage() {
  const navigate=useNavigate();
  const { threadId } = useSearch({ from: "/_authenticated/report" });
  const getThread = useServerFn(getInterview);
  const [interview,setInterview]=useState<Record<string,any>|null>(null);
  const iv = interview as any;
  const { candidate, cumulative, previousCumulative } = useCandidate();
  const latest = candidate.history[0] as any;
  const targetId = threadId || latest?.id;

  useEffect(() => {
    if (!targetId) return;
    getThread({ data: { threadId: targetId } }).then(t => setInterview(t)).catch(console.error);
  }, [targetId, getThread]);

  const score = iv?.['overall_score'] ?? latest?.overall_score ?? cumulative ?? 0;
  const compScores = (iv?.['competency_scores'] as any[]) ?? (latest?.competency_scores as any[]) ?? [];
  const strengths = iv?.['strengths'] ?? latest?.strengths ?? [];
  const improvements = iv?.['improvements'] ?? latest?.improvements ?? [];
  const rawPanelScores = (iv?.['panel_scores'] as any[]) ?? (latest?.panel_scores as any[]) ?? [];
  const panelScores = rawPanelScores.length
    ? rawPanelScores.map((p: any) => [p.name ?? "Interviewer", p.role ?? "Panel", Math.round(p.score ?? 0)])
    : [];
  const recommendation = iv?.['recommendation'] ?? latest?.recommendation ?? "";
  const displayCompetencies = compScores.length
    ? compScores.map((c:any,i:number)=>({name:c.skill||c.name,score:Math.round(c.score),justification:c.justification}))
    : [];

  const hasData = interview || latest;
  const hasScores = hasData && (score > 0 || compScores.length > 0);
  return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><Header/><div className="mx-auto max-w-6xl px-5 py-12"><div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><Eyebrow>Evidence-backed assessment</Eyebrow><h1 className="text-5xl font-semibold tracking-[-.05em] md:text-7xl">Interview Report</h1><p className="mt-4 text-muted-foreground">{candidate.name} &middot; {iv?.['role']||latest?.role||"Interview"} &middot; {iv?.['company']||latest?.company||""} {iv?.['created_at'] ? new Date(iv?.['created_at']).toLocaleDateString() : ""}</p></div><div className="flex gap-2"><Button variant="outline" className={outlineButton}><Download/> Download Report</Button><Button onClick={()=>navigate({to:"/dashboard"})} className={violetButton}>Back to Dashboard</Button></div></div>
    {!hasData && <section className={cn(panel,"mt-12 p-8 text-center")}><p className="text-muted-foreground">No interview data yet. Complete a mock interview to generate your AI-powered report.</p><Link to="/setup"><Button className={cn(violetButton,"mt-4")}>Start an interview</Button></Link></section>}
    {hasData && <section className="mt-12 grid gap-px bg-foreground/10 lg:grid-cols-[260px_1fr_1fr]"><div className="bg-brand p-7 text-white"><p className="font-mono text-[10px] uppercase tracking-widest text-white/70">{interview ? "Interview score" : "Cumulative score"}</p><p className="mt-5 text-8xl font-semibold tracking-tight">{score}</p><p className="mt-2 text-sm">{recommendation}</p>{interview && previousCumulative!==null&&<p className="mt-2 flex items-center gap-1 text-xs text-white/80"><TrendingUp className="size-3"/> {score-previousCumulative>=0?"+":""}{score-previousCumulative} vs previous interview</p>}<div className="mt-10 border-t border-white/25 pt-4"><span className="text-xs text-white/70">Confidence</span><b className="float-right">{hasScores ? "AI-scored" : "Pending"}</b></div></div><div className="bg-card p-7"><h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-success"/> Key strengths</h2><ul className="mt-5 space-y-3 text-sm text-muted-foreground">{strengths.length ? strengths.map((x:string)=><li key={x} className="border-b border-foreground/10 pb-3">{x}</li>) : <li className="text-xs text-muted-foreground">Finish an interview to see AI-generated strengths.</li>}</ul></div><div className="bg-card p-7"><h2 className="flex items-center gap-2 font-semibold"><Target className="size-4 text-brand"/> Areas for improvement</h2><ul className="mt-5 space-y-3 text-sm text-muted-foreground">{improvements.length ? improvements.map((x:string)=><li key={x} className="border-b border-foreground/10 pb-3">{x}</li>) : <li className="text-xs text-muted-foreground">Finish an interview to see AI-generated improvements.</li>}</ul></div></section>}
    {hasData && <section className="mt-12"><div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Per-competency scoring</p><h2 className="mt-2 text-3xl font-semibold">Competency breakdown</h2></div><p className="text-xs text-muted-foreground">Each competency scored separately</p></div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {displayCompetencies.length ? displayCompetencies.map((c:any,i:number)=>
          <article key={c.name} className={cn(panel,"flex flex-col p-6")}>
            <div className="flex items-start justify-between">
              <div><h3 className="text-lg font-semibold">{c.name}</h3><p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Confidence AI</p></div>
              <strong className={cn("text-5xl leading-none",c.score<70?"text-highlight-foreground":"text-brand")}>{c.score}</strong>
            </div>
            <div className="mt-5 h-2 bg-muted"><div className={cn("h-full",c.score<70?"bg-highlight":"bg-brand")} style={{width:`${c.score}%`}}/></div>
            <p className="mt-3 flex-1 text-xs leading-5 text-muted-foreground">{c.justification}</p>
            <Button size="sm" variant="outline" className={cn(outlineButton,"mt-5 self-start")}>View Evidence</Button>
          </article>) : <p className="col-span-full text-sm text-muted-foreground">Complete and score an interview to see AI-generated competency breakdown.</p>}
      </div></section>}
    {hasData && panelScores.length > 0 && <section className="mt-12 grid gap-8 lg:grid-cols-2"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Distinct perspectives</p><h2 className="mt-2 text-3xl font-semibold">Panel scores</h2><div className="mt-5 grid gap-3">{panelScores.map(([n,r,s]:any)=><div key={n} className="flex items-center gap-4 border border-foreground/15 bg-card p-4"><span className="grid size-10 place-items-center bg-brand text-white">{n[0]}</span><div className="flex-1"><b>{n}</b><p className="text-xs text-muted-foreground">{r}</p></div><strong className="text-2xl">{s}</strong></div>)}</div></div><div className="border border-brand/30 bg-brand/5 p-6"><div className="flex items-center gap-3"><Zap className="text-brand"/><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Analytical signal</p><h2 className="mt-1 text-2xl font-semibold">Panel view summary</h2></div></div><p className="mt-5 text-sm leading-6 text-muted-foreground">Scores reflect each panel member’s perspective based on the transcript. Larger gaps between technical and product ratings highlight where to focus next.</p><div className="mt-7 grid grid-cols-2 gap-3"><div className="border border-foreground/15 bg-card p-4"><span className="text-xs text-muted-foreground">Technical view</span><b className="mt-2 block text-3xl">{panelScores[0]?.[2] ?? "—"}</b></div><div className="border border-foreground/15 bg-card p-4"><span className="text-xs text-muted-foreground">Product view</span><b className="mt-2 block text-3xl text-brand">{panelScores[1]?.[2] ?? "—"}</b></div></div></div></section>}
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
