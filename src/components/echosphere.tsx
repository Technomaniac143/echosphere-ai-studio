import { Link, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
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
import { useCandidate } from "@/lib/candidate-store";
import { HeroPanelAnimation } from "@/components/echosphere/hero-animation";
import { AgentPanel, useAgentRotation } from "@/components/echosphere/agent-panel";
import { useProctoring } from "@/components/echosphere/use-proctoring";

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
  return <header className={cn("relative z-40 flex h-16 items-center justify-between border-b px-5 md:px-9", dark ? "border-white/10 bg-[#17131c] text-white" : "border-foreground/15 bg-background", compact && "h-14")}>
    <Logo dark={dark} />
    <div className="flex items-center gap-3">
      {!compact && <><span className={cn("hidden items-center gap-2 text-xs md:flex", dark ? "text-white/55" : "text-muted-foreground")}><span className="size-2 rounded-full bg-success" /> AI ONLINE</span><Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link></>}
      <button className={cn("grid size-9 place-items-center border text-sm font-semibold", dark ? "border-white/20 bg-white/10" : "border-foreground/20 bg-white")}>AS</button>
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
    <section className="bg-[#efe9f6] px-6 py-20 md:px-12"><div className="mx-auto max-w-6xl"><Eyebrow>The panel</Eyebrow><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><h2 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-6xl">Five perspectives.<br /><span className="text-brand">One continuous interview.</span></h2><p className="max-w-sm text-sm leading-6 text-muted-foreground">The right interviewer steps forward at the right moment, while shared context keeps every handoff seamless.</p></div><div className="mt-12 grid gap-px bg-foreground/10 sm:grid-cols-2 lg:grid-cols-5">{personas.map(([n,r,l],i)=><div key={n} className="bg-card p-5"><span className={cn("grid size-11 place-items-center border font-mono",i===0?"border-brand bg-brand text-white":"border-foreground/20")}>{l}</span><h3 className="mt-8 text-lg font-semibold">{n}</h3><p className="mt-1 text-xs text-muted-foreground">{r}</p></div>)}</div></div></section>
  </main>;
}

export function PortalPage() {
  const navigate = useNavigate();
  return <main className="min-h-screen bg-[#f5f1f8]"><Header /><div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[.9fr_1.1fr]">
    <section className="flex items-center px-6 py-16 md:px-[9vw]"><div className="w-full max-w-lg"><Eyebrow>Candidate access</Eyebrow><h1 className="text-5xl font-semibold tracking-[-.05em] md:text-7xl">Enter your<br /><span className="text-brand">interview space.</span></h1><p className="mt-5 text-muted-foreground">Practice AI voice interviews with a panel that adapts to you.</p><form onSubmit={e=>{e.preventDefault();navigate({to:"/dashboard"})}} className="mt-10"><label className="font-mono text-[10px] uppercase tracking-widest">Work or personal email</label><input type="email" defaultValue="arjun.sharma@example.com" required className="mt-2 h-13 w-full border border-foreground/25 bg-white px-4 outline-none focus:border-brand"/><Button className={cn(violetButton,"mt-4 h-12 w-full")}>Continue to Candidate Dashboard <ArrowRight /></Button></form><div className="mt-9 grid gap-3 sm:grid-cols-2"><Link to="/dashboard" className="border border-foreground/15 bg-white p-4 hover:border-brand"><p className="font-semibold">Quick launch</p><p className="mt-1 text-xs text-muted-foreground">Enter Demo Candidate Workspace</p></Link><div className="border border-foreground/15 bg-white p-4"><p className="font-semibold">Assessment</p><button onClick={()=>navigate({to:"/dashboard"})} className="mt-1 text-xs text-brand underline">Enter Access Code</button></div></div><p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-4 text-success" /> End-to-End Voice & Identity Encryption</p></div></section>
    <section className="relative hidden overflow-hidden bg-brand p-14 text-white lg:flex lg:items-center"><div className="absolute -right-32 -top-32 size-[550px] rounded-full border border-white/10"/><div className="relative max-w-lg"><EchoOrb mode="speaking"/><p className="mt-12 font-mono text-xs uppercase tracking-[.2em] text-highlight">Echo is ready</p><h2 className="mt-4 text-4xl font-semibold leading-tight">A quiet, intelligent space to sharpen how you answer.</h2><div className="mt-12 border-l border-white/25 pl-6"><p className="text-lg">“What would you like to work on?”</p><div className="mt-5 flex gap-2">{["System design","Behavioral","Product thinking"].map(x=><span key={x} className="border border-white/20 px-3 py-2 text-xs">{x}</span>)}</div></div></div></section>
  </div><EchoAssistant /></main>;
}

const competencies = [["Technical",84],["Problem Solving",78],["Communication",86],["Product Thinking",61],["Leadership",75],["Behavioral",82],["Adaptability",79]] as const;
export function DashboardPage() {
  const { candidate, cumulative, previousCumulative } = useCandidate();
  const delta = previousCumulative === null ? null : cumulative - previousCumulative;
  const best = Math.max(...candidate.history.map(h => h.cumulative));
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
          <p className="mt-2 text-muted-foreground">{candidate.email} · Backend Engineer track</p>
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
      <Link to="/setup"><Button className={violetButton}><Plus/> Start New Mock Interview</Button></Link>
      {[[UserRound,"View Profile","/profile"],[FileText,"Reports","/report"],[Route,"Roadmap","/roadmap"]].map(([I,t,to]:any)=><Link key={t} to={to}><Button variant="outline" className={outlineButton}><I/>{t}</Button></Link>)}
    </div>

    <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_.5fr]">
      <section>
        <div className="mb-5 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Interview history</p><h2 className="mt-1 text-2xl font-semibold">Completed interviews</h2></div><span className="text-xs text-muted-foreground">{candidate.history.length} records</span></div>
        <div className="grid gap-5 md:grid-cols-2">
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
              {record.competencies.map(c=><div key={c.name}>
                <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">{c.name}</span><b>{c.score}</b></div>
                <div className="mt-1 h-1.5 bg-muted"><div className={cn("h-full",c.score<70?"bg-highlight":"bg-brand")} style={{width:`${c.score}%`}}/></div>
              </div>)}
            </div>
            <div className="mt-5 flex gap-2 border-t border-foreground/10 pt-4">
              <Link to="/report"><Button size="sm" variant="outline" className={outlineButton}>View Report</Button></Link>
              <Link to="/setup"><Button size="sm" variant="ghost">Practice again</Button></Link>
            </div>
          </article>)}
        </div>
      </section>
      <aside className="space-y-5">
        <div className={cn(panel,"p-5")}><div className="flex justify-between"><h2 className="font-semibold">Profile completion</h2><span className="font-mono text-sm text-brand">{candidate.photo?"96%":"88%"}</span></div><div className="mt-4 h-2 bg-muted"><div className="h-full bg-highlight" style={{width:candidate.photo?"96%":"88%"}}/></div><Link to="/profile" className="mt-3 inline-flex items-center text-xs text-brand">Complete profile <ChevronRight className="size-3"/></Link></div>
        <div className={cn(panel,"p-5")}><h2 className="font-semibold">Competency overview</h2><div className="mt-5 space-y-3">{competencies.map(([c,v])=><div key={c}><div className="mb-1 flex justify-between text-xs"><span>{c}</span><b>{v}</b></div><div className="h-1.5 bg-muted"><div className="h-full bg-brand" style={{width:`${v}%`}}/></div></div>)}</div></div>
        <div className={cn(panel,"p-5")}><div className="flex justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Roadmap progress</p><p className="mt-2 text-2xl font-semibold">6 of 10</p></div><Route className="text-brand"/></div><p className="mt-4 text-xs text-muted-foreground">Next: connect technical decisions to customer impact.</p></div>
      </aside>
    </div>
  </div><EchoAssistant/></main>;
}

const setupSteps = ["Target company","Target role","Domain & focus","AI proposal","Confirm"];
export function SetupPage() {
  const navigate=useNavigate(); const [step,setStep]=useState(0); const [company,setCompany]=useState("Google"); const [role,setRole]=useState("Senior Software Engineer"); const [domain,setDomain]=useState("Data Engineering"); const [difficulty,setDifficulty]=useState("Hard");
  const companies=["Google","Microsoft","Amazon","Apple","Meta","Netflix","Uber"]; const roles=["Software Engineer","Senior Software Engineer","Staff Software Engineer","Frontend Engineer","Backend Engineer","Full Stack Engineer","Data Engineer"];
  return <main className="min-h-screen bg-[#f5f1f8]"><Header/><div className="border-b border-foreground/15 bg-white px-5 py-6"><div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto">{setupSteps.map((s,i)=><button onClick={()=>setStep(i)} key={s} className={cn("flex min-w-40 flex-1 items-center gap-3 border-b-2 pb-3 text-left",i===step?"border-brand text-foreground":i<step?"border-success text-muted-foreground":"border-foreground/10 text-muted-foreground")}><span className={cn("grid size-7 shrink-0 place-items-center border font-mono text-xs",i===step&&"border-brand bg-brand text-white",i<step&&"border-success bg-success text-white")}>{i<step?<Check className="size-3"/>:i+1}</span><span className="text-xs font-semibold">{s}</span></button>)}</div></div>
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_310px]"><section><Eyebrow>Interview configuration · Step {step+1} of 5</Eyebrow>{step===0&&<ChoiceStep title="Where do you want to interview?" subtitle="Choose a target company so Echo can tune the interview context." items={companies} value={company} setValue={setCompany}/>} {step===1&&<ChoiceStep title="Which role are you targeting?" subtitle="This determines the expected scope and interview panel." items={roles} value={role} setValue={setRole}/>} {step===2&&<ChoiceStep title="Choose your domain & competency focus." subtitle="Select the course or domain that should guide the interview." items={["Data Engineering","Backend Systems","Frontend Architecture","Machine Learning","Product Engineering"]} value={domain} setValue={setDomain}/>} {step===3&&<Proposal difficulty={difficulty} setDifficulty={setDifficulty}/>} {step===4&&<ConfirmSetup company={company} role={role} domain={domain} difficulty={difficulty}/>}<div className="mt-10 flex justify-between"><Button disabled={step===0} onClick={()=>setStep(x=>x-1)} variant="outline" className={outlineButton}>Back</Button>{step<4?<Button onClick={()=>setStep(x=>x+1)} className={violetButton}>Continue <ArrowRight/></Button>:<Button onClick={()=>navigate({to:"/profile"})} className={violetButton}>Proceed to Candidate Information <ArrowRight/></Button>}</div></section>
      <aside><div className={cn(panel,"sticky top-24 p-6")}><EchoOrb small mode="speaking"/><p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-brand">Echo insight</p><p className="mt-3 text-lg leading-7">{step<2?"I’ll use this to calibrate scope, seniority, and likely interview patterns.":step===2?"Your focus will shape both the questions and how evidence is scored.":"I’ve inferred a three-person panel based on the role. Your interview will emphasize system design and technical depth."}</p><div className="mt-6 border-t border-foreground/15 pt-4 text-xs text-muted-foreground">Say “Hey Echo, configure this interview for me.”</div></div></aside></div><EchoAssistant/></main>;
}

function ChoiceStep({title,subtitle,items,value,setValue}:{title:string;subtitle:string;items:string[];value:string;setValue:(v:string)=>void}) { return <><h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1><p className="mt-4 text-muted-foreground">{subtitle}</p><div className="mt-9 grid gap-3 sm:grid-cols-2">{items.map((x,i)=><button onClick={()=>setValue(x)} key={x} className={cn("flex min-h-20 items-center justify-between border p-5 text-left font-semibold transition",value===x?"border-brand bg-brand text-white shadow-[5px_5px_0_#f2dc47]":"border-foreground/15 bg-white hover:border-brand")}><span><i className="mr-3 font-mono text-xs not-italic opacity-50">0{i+1}</i>{x}</span>{value===x&&<Check/>}</button>)}</div></> }
function Proposal({difficulty,setDifficulty}:{difficulty:string;setDifficulty:(v:string)=>void}) { const weights=[["Technical",35],["System Design",30],["Problem Solving",20],["Behavioral",10],["Communication",5]] as const; return <><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Your adaptive<br/><span className="text-brand">AI proposal.</span></h1><div className="mt-9 grid gap-5 md:grid-cols-2"><div className={cn(panel,"p-6")}><h3 className="font-semibold">Competency weighting</h3><div className="mt-5 space-y-4">{weights.map(([n,v])=><div key={n}><div className="flex justify-between text-xs"><span>{n}</span><b>{v}%</b></div><div className="mt-1 h-2 bg-muted"><div className="h-full bg-brand" style={{width:`${v}%`}}/></div></div>)}</div></div><div className={cn(panel,"p-6")}><h3 className="font-semibold">Inferred interview panel</h3><div className="mt-5 space-y-3">{[["A","Technical Interviewer"],["M","Domain Expert"],["D","Hiring Manager"]].map(([a,r])=><div key={a} className="flex items-center gap-3 border-b border-foreground/10 pb-3"><span className="grid size-9 place-items-center bg-foreground text-white">{a}</span><span className="text-sm font-medium">{r}</span></div>)}</div></div><div className={cn(panel,"p-6 md:col-span-2")}><h3 className="font-semibold">Course focus areas</h3><div className="mt-4 flex flex-wrap gap-2">{["Spark/Kafka Streaming","Data Warehousing","ETL Pipelines","Data Quality & Schema Design"].map(x=><span key={x} className="border border-foreground/15 bg-muted px-3 py-2 text-xs">{x}</span>)}</div><h3 className="mt-7 font-semibold">Target difficulty</h3><div className="mt-3 grid grid-cols-4 gap-2">{["Easy","Medium","Hard","Expert"].map(x=><button key={x} onClick={()=>setDifficulty(x)} className={cn("border p-3 text-xs font-semibold",difficulty===x?"border-brand bg-brand text-white":"border-foreground/15")}>{x}</button>)}</div></div></div></> }
function ConfirmSetup({company,role,domain,difficulty}:{company:string;role:string;domain:string;difficulty:string}) { return <><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Confirm mock<br/><span className="text-brand">interview setup.</span></h1><div className={cn(panel,"mt-9 divide-y divide-foreground/10")}>{[[BriefcaseBusiness,"Company",company],[UserRound,"Role",role],[Target,"Domain",domain],[Zap,"Difficulty",difficulty],[Headphones,"Interview mode","Assessment / Mock Interview"]].map(([I,l,v]:any)=><div key={l} className="grid grid-cols-[40px_150px_1fr] items-center p-5"><I className="size-5 text-brand"/><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{l}</span><b>{v}</b></div>)}</div></> }

export function ProfilePage() {
  const navigate=useNavigate(); const [file,setFile]=useState("");
  return <main className="min-h-screen bg-[#f5f1f8]"><Header/><div className="mx-auto max-w-6xl px-5 py-12"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Eyebrow>Context builder</Eyebrow><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Personal Information Portal</h1><p className="mt-3 max-w-2xl text-muted-foreground">Provide your resume, project repository, education and certifications to personalize the AI mock interviewer.</p></div><div className="w-56"><p className="flex justify-between font-mono text-[10px] uppercase"><span>Context complete</span><b>72%</b></p><div className="mt-2 h-2 bg-white"><div className="h-full w-[72%] bg-brand"/></div></div></div>
    <form onSubmit={e=>{e.preventDefault();navigate({to:"/system-check"})}} className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <FormSection number="A" title="Candidate resume" icon={<FileText/>}><label className="grid min-h-40 cursor-pointer place-items-center border border-dashed border-foreground/30 bg-muted/50 text-center hover:border-brand"><input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e=>setFile(e.target.files?.[0]?.name||"")}/><div><Upload className="mx-auto mb-3 text-brand"/><b>{file||"Drop your resume or browse"}</b><p className="mt-1 text-xs text-muted-foreground">PDF, DOC, DOCX · Maximum 10MB</p></div></label></FormSection>
      <FormSection number="B" title="Best project GitHub link" icon={<Github/>}><label className="text-xs font-semibold">Repository URL<input type="url" defaultValue="https://github.com/arjunsharma/distributed-cache" className="mt-2 h-11 w-full border border-foreground/20 px-3 outline-none focus:border-brand"/></label><p className="mt-3 text-xs leading-5 text-muted-foreground">The interviewer will evaluate code structure and architecture from this project.</p></FormSection>
      <FormSection number="C" title="Educational details" icon={<GraduationCap/>}><div className="grid gap-4 sm:grid-cols-2">{[["Institution / College / University","Indian Institute of Technology"],["Degree","B.Tech"],["Department / Branch","Computer Science"],["Graduation Year","2021"]].map(([l,v])=><label key={l} className="text-xs font-semibold">{l}<input defaultValue={v} className="mt-2 h-11 w-full border border-foreground/20 px-3 outline-none focus:border-brand"/></label>)}</div></FormSection>
      <FormSection number="D" title="Certifications" icon={<Award/>}><div className="grid gap-3 sm:grid-cols-2">{[["Certification Name","AWS Solutions Architect"],["Issuing Organization","Amazon Web Services"],["Year / Issue Date","2024"],["Credential URL","https://credential.example"]].map(([l,v])=><label key={l} className="text-xs font-semibold">{l}<input defaultValue={v} className="mt-2 h-11 w-full border border-foreground/20 px-3 outline-none focus:border-brand"/></label>)}</div><Button type="button" variant="outline" size="sm" className={cn(outlineButton,"mt-4")}><Plus/> Add certification</Button></FormSection>
      <div className="flex items-center justify-between border-t border-foreground/15 pt-6 lg:col-span-2"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="size-4 text-brand"/> EchoSphere is building your interview context…</p><Button className={violetButton}>Save & Continue to System Check <ArrowRight/></Button></div>
    </form></div><EchoAssistant/></main>;
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
  const navigate=useNavigate(); const [recording,setRecording]=useState(false); const [done,setDone]=useState(false); const [seconds,setSeconds]=useState(0);
  useEffect(()=>{if(!recording)return;const id=window.setInterval(()=>setSeconds(s=>{if(s>=29){setRecording(false);setDone(true);return 30}return s+1}),1000);return()=>clearInterval(id)},[recording]);
  return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><Header/><div className="mx-auto max-w-6xl px-5 py-10"><Eyebrow>Voice & presence calibration</Eyebrow><div className="grid gap-9 lg:grid-cols-[350px_1fr]"><section><h1 className="text-4xl font-semibold tracking-tight">Sample Video Question</h1><div className="mt-8 border-l-2 border-highlight pl-5"><p className="font-mono text-[10px] uppercase tracking-widest text-highlight">Your question</p><blockquote className="mt-3 text-3xl leading-tight">“What is your favourite colour?”</blockquote></div><div className="mt-8 space-y-3 text-sm text-muted-foreground"><p className="flex gap-3"><span className="font-mono text-highlight">01</span> Answer naturally for 10–30 seconds.</p><p className="flex gap-3"><span className="font-mono text-highlight">02</span> Speak clearly in your normal tone.</p></div></section><section><div className="relative aspect-video overflow-hidden border border-foreground/15 bg-black"><img src={candidateImage} alt="Candidate video preview" width={640} height={640} className="size-full object-cover"/>{recording&&<><span className="absolute left-4 top-4 flex items-center gap-2 bg-red-500 px-3 py-1.5 font-mono text-[10px]"><i className="size-2 rounded-full bg-white"/> RECORDING</span><div className="absolute inset-x-0 bottom-0 flex h-16 items-center justify-center gap-1 bg-gradient-to-t from-black/80">{Array.from({length:44},(_,i)=><i key={i} className="echo-wave w-1 bg-highlight" style={{height:`${10+(i*17)%35}px`,animationDelay:`${i*25}ms`}}/>)}</div></>}</div><div className="mt-4 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Live Camera Recorder</p><p className="mt-1 text-2xl font-semibold">{seconds}s <span className="text-muted-foreground">/ 30s</span></p></div><div className="flex gap-3">{!done?<Button onClick={()=>{setRecording(!recording);setSeconds(0)}} className={recording?"rounded-none bg-red-500 text-white":violetButton}>{recording?<><Pause/> Stop Recording</>:<><Radio/> Start Recording</>}</Button>:<Button onClick={()=>navigate({to:"/analysis"})} className={violetButton}>Submit for AI Analysis <Sparkles/></Button>}</div></div>{done&&<div className="mt-5 border border-success/30 bg-success/5 p-4 text-sm text-success"><CheckCircle2 className="mr-2 inline size-4"/> Recording complete · {seconds} seconds · Ready for review</div>}</section></div></div></main>;
}

export function AnalysisPage() {
  const navigate=useNavigate(); const verifications=[[Camera,"Camera & Video Quality","HD video, stable exposure, face clearly visible."],[Mic,"Microphone & Audio Level","Clear voice signal with low background noise."],[MonitorUp,"Screen Sharing Verification","Screen access verified and available."],[ShieldCheck,"Sample Recording Integrity","30-second recording passed integrity analysis."]];
  return <main className="min-h-screen bg-[#f5f1f8]"><Header/><div className="mx-auto max-w-5xl px-5 py-12"><div className="text-center"><Eyebrow>Automated evaluation</Eyebrow><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Candidate Analysis Portal</h1><div className="mx-auto mt-8 grid size-32 place-items-center rounded-full border-2 border-success bg-white shadow-[8px_8px_0_#bff3cf]"><div><Check className="mx-auto size-8 text-success"/><b className="mt-1 block font-mono text-xs text-success">APPROVED</b></div></div><h2 className="mt-5 text-2xl font-semibold">Ready for Interview</h2><p className="mt-2 text-muted-foreground">Environment, media integrity, and sample recording evaluation complete.</p></div><section className="mt-10 border-t border-foreground/20">{verifications.map(([I,t,d]:any,i)=><article key={t} className="grid items-center gap-4 border-b border-foreground/15 bg-white p-5 md:grid-cols-[38px_1fr_90px]"><I className="text-brand"/><div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div><Status status="PASS"/></article>)}</section><div className="mt-9 flex justify-center"><Button onClick={()=>navigate({to:"/interview/$threadId", params:{threadId:"demo"}})} size="lg" className={violetButton}>Start Mock Interview <ArrowRight/></Button></div></div></main>;
}

type Workspace="Conversation"|"Notes";
const stages=["Verify","Technical","Product","Behavioral","Confirm"];
export function InterviewPage() {
  const navigate=useNavigate();
  const [workspace,setWorkspace]=useState<Workspace>("Conversation");
  const [echo,setEcho]=useState<EchoMode>("idle");
  const [muted,setMuted]=useState(false);
  const [video,setVideo]=useState(true);
  const [paused,setPaused]=useState(false);
  const [messages,setMessages]=useState<{from:"assistant"|"user";text:string}[]>([]);
  const { candidate } = useCandidate();
  const activeAgent = useAgentRotation(!paused, 5000);
  const { videoRef, events, faceTracking, lookingAway } = useProctoring(!paused);
  const [tool,setTool]=useState<"none"|"Code"|"Whiteboard">("none");
  function command(text:string){const q=text.toLowerCase();setMessages(m=>[...m,{from:"user",text}]);setEcho("thinking");window.setTimeout(()=>{let reply="I’m ready when you are.";if(q.includes("notes")){setWorkspace("Notes");reply="Opening your notes."}else if(q.includes("repeat")){reply="Repeating the current question: How would you design a globally distributed URL shortening service?"}else if(q.includes("pause")){setPaused(true);reply="Interview paused."}setMessages(m=>[...m,{from:"assistant",text:reply}]);setEcho("speaking");window.setTimeout(()=>setEcho("idle"),1800)},900)}

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
      <button aria-label="Exit interview" onClick={()=>navigate({to:"/report"})} className="grid size-9 place-items-center rounded-full border border-foreground/15 bg-card text-muted-foreground hover:bg-muted"><X className="size-4"/></button>
    </header>

    <div className="grid gap-5 p-5 lg:grid-cols-[260px_1fr_360px]">
      <aside className="h-fit rounded-2xl border border-foreground/10 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-brand/10 text-lg font-bold text-brand">C</span>
          <div><p className="font-semibold">Candidate</p><span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"><CheckCircle2 className="size-3"/> Verified</span></div>
        </div>
        {[["ROLE","Software Engineer",Clock3],["LAST INTERVIEW","14 Mar 2026",Clock3],["TOTAL SESSIONS","5 completed",Clock3]].map(([l,v]:any,i)=><div key={l} className={cn("border-t border-foreground/10 py-4",i===0&&"mt-5")}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{l}</p>
          <p className="mt-1 font-semibold">{v}</p>
        </div>)}
      </aside>

      <section>
        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-[#0d1117] shadow-sm">
          <img src={alexImage} alt="Alex, AI technical interviewer" width={1280} height={720} className="aspect-video w-full object-cover"/>
          <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white"><i className="size-2 rounded-full bg-success"/> EchoSphere AI • LIVE</span>
          <div className="absolute right-4 top-4 w-32 overflow-hidden rounded-2xl border-2 border-white/70 shadow-lg md:w-40">
            <img src={candidateImage} alt="Candidate video preview" width={640} height={640} className="aspect-square w-full object-cover"/>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">You</span>
          </div>
          <div className="absolute inset-x-0 bottom-6 flex justify-center">
            <div className="flex items-center gap-3 rounded-full bg-[#111827]/90 px-3 py-2.5 shadow-xl backdrop-blur">
              <button onClick={()=>setMuted(!muted)} aria-label="Toggle microphone" className={cn("grid size-11 place-items-center rounded-full text-white",muted?"bg-red-500":"bg-white/15 hover:bg-white/25")}>{muted?<MicOff className="size-5"/>:<Mic className="size-5"/>}</button>
              <button onClick={()=>setVideo(!video)} aria-label="Toggle camera" className="grid size-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">{video?<Video className="size-5"/>:<VideoOff className="size-5"/>}</button>
              <button onClick={()=>navigate({to:"/report"})} aria-label="End interview" className="grid size-11 place-items-center rounded-full bg-red-500 text-white hover:bg-red-600"><X className="size-5"/></button>
            </div>
          </div>
          {paused&&<div className="absolute inset-0 z-20 grid place-items-center bg-black/60 backdrop-blur-sm"><div className="text-center text-white"><CirclePause className="mx-auto size-12 text-highlight"/><h2 className="mt-3 text-3xl font-semibold">Interview paused</h2><Button onClick={()=>setPaused(false)} className={cn(violetButton,"mt-5 rounded-full")}><Play/> Resume interview</Button></div></div>}
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-foreground/10 bg-card py-5 text-lg font-medium shadow-sm">
          EchoSphere AI is listening…
          <span className="flex items-end gap-[3px]">{[.5,.9,.6,1,.45].map((h,i)=><i key={i} className="echo-wave w-[3px] rounded-full bg-brand" style={{height:`${h*20}px`,animationDelay:`${i*90}ms`}}/>)}</span>
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
  const navigate=useNavigate(); const panelScores=[["Alex","Technical Interviewer",84],["Maya","Product Manager",68],["Daniel","Hiring Manager",81]];
  return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><Header/><div className="mx-auto max-w-6xl px-5 py-12"><div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><Eyebrow>Evidence-backed assessment</Eyebrow><h1 className="text-5xl font-semibold tracking-[-.05em] md:text-7xl">Interview Report</h1><p className="mt-4 text-muted-foreground">Arjun Sharma · Backend Engineer at Amazon · May 18, 2025 · 52 min</p></div><div className="flex gap-2"><Button variant="outline" className={outlineButton}><Download/> Download Report</Button><Button onClick={()=>navigate({to:"/dashboard"})} className={violetButton}>Back to Dashboard</Button></div></div>
    <section className="mt-12 grid gap-px bg-foreground/10 lg:grid-cols-[260px_1fr_1fr]"><div className="bg-brand p-7 text-white"><p className="font-mono text-[10px] uppercase tracking-widest text-white/70">Overall score</p><p className="mt-5 text-8xl font-semibold tracking-tight">82</p><p className="mt-2 text-sm">Strong Hire</p><div className="mt-12 border-t border-white/25 pt-4"><span className="text-xs text-white/70">Confidence</span><b className="float-right">91%</b></div></div><div className="bg-card p-7"><h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-success"/> Key strengths</h2><ul className="mt-5 space-y-3 text-sm text-muted-foreground">{["Strong debugging ability","Good backend fundamentals","Clear logical communication","Ownership and teamwork examples"].map(x=><li key={x} className="border-b border-foreground/10 pb-3">{x}</li>)}</ul></div><div className="bg-card p-7"><h2 className="flex items-center gap-2 font-semibold"><Target className="size-4 text-brand"/> Areas for improvement</h2><ul className="mt-5 space-y-3 text-sm text-muted-foreground">{["Develop advanced technical depth","Connect implementation decisions to user impact","Quantify outcomes with clearer metrics"].map(x=><li key={x} className="border-b border-foreground/10 pb-3">{x}</li>)}</ul></div></section>
    <section className="mt-12"><div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Seven dimensions</p><h2 className="mt-2 text-3xl font-semibold">Competency profile</h2></div><p className="text-xs text-muted-foreground">Score / confidence / evidence</p></div><div className="mt-6 border-t border-foreground/20">{competencies.map(([n,v],i)=><article key={n} className="grid items-center gap-4 border-b border-foreground/15 bg-card px-5 py-5 md:grid-cols-[180px_1fr_70px_100px]"><div><h3 className="font-semibold">{n}</h3><p className="mt-1 text-[10px] text-muted-foreground">Confidence {87-i}%</p></div><div><div className="h-2 bg-muted"><div className={cn("h-full",v<70?"bg-highlight":"bg-brand")} style={{width:`${v}%`}}/></div><p className="mt-2 text-xs text-muted-foreground">{v>80?"Demonstrated clear structure and relevant depth.":v>70?"Consistent evidence with room for more precision.":"Needs stronger links between decisions and user outcomes."}</p></div><strong className="text-2xl">{v}</strong><Button size="sm" variant="outline" className={outlineButton}>View Evidence</Button></article>)}</div></section>
    <section className="mt-12 grid gap-8 lg:grid-cols-2"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Distinct perspectives</p><h2 className="mt-2 text-3xl font-semibold">Panel scores</h2><div className="mt-5 grid gap-3">{panelScores.map(([n,r,s]:any)=><div key={n} className="flex items-center gap-4 border border-foreground/15 bg-card p-4"><span className="grid size-10 place-items-center bg-brand text-white">{n[0]}</span><div className="flex-1"><b>{n}</b><p className="text-xs text-muted-foreground">{r}</p></div><strong className="text-2xl">{s}</strong></div>)}</div></div><div className="border border-brand/30 bg-brand/5 p-6"><div className="flex items-center gap-3"><Zap className="text-brand"/><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Analytical signal</p><h2 className="mt-1 text-2xl font-semibold">Panel disagreement detected.</h2></div></div><p className="mt-5 text-sm leading-6 text-muted-foreground">Alex rated technical depth highly, while Maya found weaker evidence connecting implementation choices to customer impact. This is not inconsistency—it reveals distinct assessment dimensions.</p><div className="mt-7 grid grid-cols-2 gap-3"><div className="border border-foreground/15 bg-card p-4"><span className="text-xs text-muted-foreground">Technical view</span><b className="mt-2 block text-3xl">84</b></div><div className="border border-foreground/15 bg-card p-4"><span className="text-xs text-muted-foreground">Product view</span><b className="mt-2 block text-3xl text-brand">68</b></div></div></div></section>
    <section className="mt-12 border-t border-foreground/15 pt-9"><Eyebrow>Personalized roadmap</Eyebrow><h2 className="text-3xl font-semibold">Your improvement plan</h2><div className="mt-6 grid gap-px bg-foreground/10 md:grid-cols-4">{["Practice system-design tradeoffs.","Quantify project outcomes with metrics.","Connect technical decisions to customer impact.","Practice STAR-format behavioral responses."].map((x,i)=><div key={x} className="bg-card p-5"><span className="font-mono text-xs text-brand">0{i+1}</span><p className="mt-12 font-semibold leading-6">{x}</p><button className="mt-5 text-xs text-muted-foreground">Start practice <ArrowRight className="ml-1 inline size-3"/></button></div>)}</div></section>
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
  const done = roadmapSteps.filter(s => s[3] === "done").length;
  return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><Header /><div className="mx-auto max-w-6xl px-5 py-12">
    <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
      <div><Eyebrow>Personalized roadmap</Eyebrow><h1 className="text-5xl font-semibold tracking-[-.05em] md:text-7xl">Your 10-Step Plan</h1><p className="mt-4 text-muted-foreground">Arjun Sharma · Backend Engineer track · Updated after your last mock interview</p></div>
      <div className="flex gap-2"><Button variant="outline" className={outlineButton} onClick={() => navigate({ to: "/dashboard" })}>Back to Dashboard</Button><Link to="/setup"><Button className={violetButton}><Plus /> Start Practice</Button></Link></div>
    </div>
    <section className="mt-12 grid gap-px bg-foreground/10 md:grid-cols-3">
      <div className="bg-brand p-7 text-white"><p className="font-mono text-[10px] uppercase tracking-widest text-white/70">Overall progress</p><p className="mt-5 text-8xl font-semibold tracking-tight">{done}<span className="text-4xl text-white/60">/10</span></p><p className="mt-2 text-sm">On pace for your target date</p></div>
      <div className="bg-card p-7"><div className="flex items-center gap-3"><Clock3 className="size-4 text-brand" /><h2 className="font-semibold">Current focus</h2></div><p className="mt-5 text-2xl font-semibold leading-8">Estimate scale: QPS, storage, and latency math</p><p className="mt-3 text-sm text-muted-foreground">Week 7–8 · Problem Solving</p><button className="mt-6 inline-flex items-center text-xs font-semibold text-brand">Continue this step <ArrowRight className="ml-1 size-3" /></button></div>
      <div className="bg-card p-7"><div className="flex items-center gap-3"><Target className="size-4 text-brand" /><h2 className="font-semibold">Weekly target</h2></div><p className="mt-5 text-2xl font-semibold">4 practice hours</p><p className="mt-3 text-sm text-muted-foreground">2.5 of 4 hours completed this week.</p><div className="mt-5 h-2 bg-muted"><div className="h-full w-[62%] bg-highlight" /></div></div>
    </section>
    <section className="mt-12"><div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Milestone timeline</p><h2 className="mt-2 text-3xl font-semibold">Step by step</h2></div><p className="text-xs text-muted-foreground">{done} completed · 1 in progress · {10 - done - 1} upcoming</p></div>
      <div className="mt-6 border-t border-foreground/20">{roadmapSteps.map(([title, dim, weeks, status], i) => <article key={title} className={cn("grid items-center gap-4 border-b border-foreground/15 px-5 py-5 md:grid-cols-[56px_1fr_160px_130px_120px]", status === "current" ? "bg-brand/5" : "bg-card")}>
        <span className={cn("grid size-10 place-items-center font-mono text-sm", status === "done" ? "bg-brand text-white" : status === "current" ? "bg-highlight text-foreground" : "border border-foreground/25 text-muted-foreground")}>{status === "done" ? <Check className="size-4" /> : String(i + 1).padStart(2, "0")}</span>
        <div><h3 className={cn("font-semibold", status === "upcoming" && "text-muted-foreground")}>{title}</h3><p className="mt-1 text-xs text-muted-foreground">{dim}</p></div>
        <span className="text-xs text-muted-foreground">{weeks}</span>
        <span className={cn("w-fit px-2 py-1 font-mono text-[10px] uppercase tracking-widest", status === "done" ? "bg-brand/10 text-brand" : status === "current" ? "bg-highlight/30 text-foreground" : "bg-muted text-muted-foreground")}>{status === "done" ? "Completed" : status === "current" ? "In progress" : "Upcoming"}</span>
        {status === "current" ? <Button size="sm" className={violetButton}>Continue</Button> : status === "upcoming" ? <Button size="sm" variant="outline" className={outlineButton}>Preview</Button> : <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="size-4" /> Done</span>}
      </article>)}</div></section>
    <section className="mt-12 border border-brand/30 bg-brand/5 p-6"><div className="flex items-center gap-3"><Sparkles className="text-brand" /><div><p className="font-mono text-[10px] uppercase tracking-widest text-brand">Echo's recommendation</p><h2 className="mt-1 text-2xl font-semibold">Product Thinking is your biggest lever.</h2></div></div><p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">Your roadmap is weighted toward connecting technical depth with customer impact. Completing the current step unlocks the product-sense mock interview — the single highest-impact milestone left.</p></section>
  </div><EchoAssistant hint="Ask Echo why these steps were chosen." /></main>;
}
