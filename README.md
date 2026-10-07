# EchoSphere

## AI Interview Operating Environment

> **Tagline:** _Where Every Answer Shapes the Next Question_
> **Core Architecture:** Voice-First Intelligent Interview System with Dynamic Multi-Persona Orchestration

---

## 1. System Overview

EchoSphere is an adaptive AI interview platform where specialized interviewer personas coordinate throughout a single interview session.

Voice is the primary interaction layer. An ambient AI assistant provides:

- Interface navigation
- Contextual workspace control
- Interview assistance
- Real-time evidence capture
- Adaptive persona orchestration

The system continuously transforms candidate responses into interview context, selects the appropriate interviewer persona, generates the next question, and captures evidence for assessment.

---

## 2. Runtime State Flow

```mermaid
stateDiagram-v2
    [*] --> ContextSynthesis: Candidate Voice Input

    ContextSynthesis --> PersonaRouter: Update Context

    state PersonaRouter {
        [*] --> EvaluateDomain

        EvaluateDomain --> Alex_Tech: Systems / Scalability / Depth
        EvaluateDomain --> Maya_Product: Tradeoffs / User Empathy
        EvaluateDomain --> Daniel_Hiring: Leadership / Ownership
        EvaluateDomain --> Sophia_Behavioral: Situations / Conflict
        EvaluateDomain --> Jordan_Roleplay: Ambiguity / Stakeholders
    }

    Alex_Tech --> QuestionGeneration: Context Tokens
    Maya_Product --> QuestionGeneration: Context Tokens
    Daniel_Hiring --> QuestionGeneration: Context Tokens
    Sophia_Behavioral --> QuestionGeneration: Context Tokens
    Jordan_Roleplay --> QuestionGeneration: Context Tokens

    QuestionGeneration --> ActiveVoiceSession: Generate + Stream Audio

    ActiveVoiceSession --> ContextSynthesis: Candidate Audio
    ActiveVoiceSession --> EvidenceLedger: Diagnostic Artifacts

    EvidenceLedger --> FinalReport: Session Completed

    FinalReport --> [*]
```

### Runtime loop

```text
Candidate Answer
       ↓
Context Synthesis
       ↓
Persona Routing
       ↓
Question Generation
       ↓
AI Voice Response
       ↓
Evidence Capture
       ↓
Candidate Answer
       ↺
```

The loop continues until the interview session is complete.

---

# 3. Complete Product Architecture

The complete experience is divided into three major stages.

```mermaid
flowchart TD
    subgraph Intake["Stage 1 — Pre-Flight & Intake"]
        A[Candidate Portal]
        B[5-Step Interview Setup]
        C[Candidate Dossier]
        D[Hardware & Network Diagnostics]
        E[Acoustic Calibration]
        F[Readiness Verification]

        A --> B
        B --> C
        C --> D
        D --> E
        E --> F
    end

    subgraph Runtime["Stage 2 — Live Interview Environment"]
        G[Live Interview Workspace]
        H[Central AI Persona]
        I[Floating Candidate PiP]
        J[Echo Voice Controller]
        K[Context Drawer]

        G <--> H
        G <--> I
        G <--> J
        G <--> K
    end

    subgraph Evaluation["Stage 3 — Evidence & Assessment"]
        L[Evidence-Backed Report]
        M[Panel Disagreement Matrix]
        N[Competency Roadmap]

        L --> M
        L --> N
    end

    F --> G
    G --> L
    N --> B
```

---

# 4. Candidate Setup Pipeline

The setup process remains a mandatory five-step configuration flow.

```mermaid
flowchart LR
    S1["01<br/>Company"]
    S2["02<br/>Role"]
    S3["03<br/>Domain Focus"]
    S4["04<br/>AI Panel Plan"]
    S5["05<br/>Confirm"]

    S1 --> S2
    S2 --> S3
    S3 --> S4
    S4 --> S5
```

## Step 1 — Company

The candidate selects the target company.

## Step 2 — Role

The candidate selects the target role.

## Step 3 — Domain Focus

The candidate selects the relevant domain and competency focus.

## Step 4 — AI Panel Plan

EchoSphere dynamically proposes:

- Competency weighting
- Interviewer personas
- Focus areas
- Difficulty
- Interview mode

## Step 5 — Confirm

The candidate reviews the generated configuration before proceeding.

---

# 5. Environment Verification Gate

Before entering the live interview, EchoSphere performs a readiness check.

```mermaid
flowchart TD
    A["Camera + Microphone Handshake"]
    B["Network Diagnostics"]
    C["15s Acoustic Test"]
    D{"Automated Evaluation"}

    A --> B
    B --> C
    C --> D

    D -->|PASS| E["READY"]
    D -->|FAIL| F["ACTION REQUIRED"]

    F --> A
```

### Verification areas

| Check         | Purpose                               |
| ------------- | ------------------------------------- |
| Camera        | Access and video quality              |
| Microphone    | Access and input level                |
| Screen Share  | Sharing capability                    |
| Network       | Backend reachability and latency      |
| Acoustic Test | Voice quality and recording integrity |

---

# 6. Live Interview Environment

The live room is the central experience of EchoSphere.

```mermaid
flowchart TB
    State["Interview State + Persona Timeline"]

    State --> AI["Central AI Persona Surface"]

    AI --> Question["Current Interview Question"]

    Candidate["Floating Candidate PiP"] --> AI

    Echo["Echo Ambient Voice Controller"] --> AI

    AI <--> Workspace["Contextual Workspace"]

    Workspace --> Conversation
    Workspace --> Transcript
    Workspace --> Notes
    Workspace --> Whiteboard
    Workspace --> Summary

    Controls["Mic / Camera / Screen Share / End"] --> AI

    Status["Connection / Recording / AI State / Timer"] --> AI
```

### Primary visual hierarchy

```text
┌─────────────────────────────────────────────────────────────┐
│ Persona Timeline                              Live Status   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                  AI INTERVIEWER                             │
│                                                             │
│                    Alex                                     │
│              Technical Interviewer                          │
│                                                             │
│                                                             │
│          Current interview question                         │
│                                                             │
│                                     ┌───────────────────┐   │
│                                     │ Candidate PiP     │   │
│                                     └───────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                 Echo Voice Controller                       │
│                     Hey Echo                                │
├─────────────────────────────────────────────────────────────┤
│ Mic     Camera     Screen Share                  End        │
└─────────────────────────────────────────────────────────────┘
```

The contextual workspace should remain hidden or minimized until needed.

---

# 7. Persona Orchestration

Only one AI persona should actively speak at a time.

```mermaid
flowchart LR
    Context["Interview Context"]

    Context --> Router{"Persona Router"}

    Router --> Alex["Alex<br/>Technical"]
    Router --> Maya["Maya<br/>Product"]
    Router --> Daniel["Daniel<br/>Hiring"]
    Router --> Sophia["Sophia<br/>Behavioral"]
    Router --> Jordan["Jordan<br/>Role-play"]

    Alex --> Next["Next Question"]
    Maya --> Next
    Daniel --> Next
    Sophia --> Next
    Jordan --> Next
```

### Persona transition

A persona handoff should feel like a continuous conversation.

```text
Alex
Technical Interviewer

        ↓
   Context Handoff
        ↓

Maya
Product Manager
```

Avoid hard screen transitions or abrupt persona changes.

---

# 8. Echo Voice Interaction

Echo is an ambient voice controller rather than a conventional chatbot.

## State machine

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Listening: "Hey Echo"
    Listening --> Thinking: Intent Captured
    Thinking --> Speaking: Action / Response Ready
    Speaking --> Idle: Complete

    Listening --> Idle: Cancel
    Thinking --> Idle: Cancel
```

## Voice states

| State     | UI                                     |
| --------- | -------------------------------------- |
| Idle      | Small Echo Orb + "Hey Echo"            |
| Listening | Animated waveform + "Listening..."     |
| Thinking  | Pulsing orb + "Thinking..."            |
| Speaking  | AI waveform + "EchoSphere is speaking" |

---

# 9. Voice-Controlled Interface

Echo can control relevant interface surfaces.

```mermaid
sequenceDiagram
    autonumber

    actor C as Candidate
    participant E as Echo Voice Runtime
    participant O as Orchestration Layer
    participant W as Context Workspace

    C->>E: "Hey Echo, open the whiteboard."
    E->>E: Detect wake word
    E->>E: Extract intent

    E->>O: OPEN_WHITEBOARD
    O->>W: Expand Whiteboard
    W-->>C: Whiteboard visible

    C->>E: "Hey Echo, repeat the last constraint."
    E->>O: REPEAT_QUESTION
    O->>W: Retrieve active question context
    E-->>C: Repeat specific constraint
```

### Supported actions

```text
OPEN_PANEL
CLOSE_PANEL
NAVIGATE

OPEN_TRANSCRIPT
OPEN_NOTES
OPEN_WHITEBOARD

REPEAT_QUESTION
SHOW_PREVIOUS_QUESTION

PAUSE_INTERVIEW
RESUME_INTERVIEW

START_INTERVIEW
END_INTERVIEW

SHOW_REPORT
SHOW_ROADMAP
START_PRACTICE
```

---

# 10. Contextual Workspace

The workspace provides secondary interview context without permanently dominating the screen.

```mermaid
flowchart TD
    Workspace["Context Workspace"]

    Workspace --> Conversation["Conversation"]
    Workspace --> Transcript["Transcript"]
    Workspace --> Notes["Notes"]
    Workspace --> Whiteboard["Whiteboard"]
    Workspace --> Summary["Summary"]
```

### Conversation

Live conversational context.

### Transcript

Full interview transcript.

### Notes

Candidate-created notes.

### Whiteboard

Supports:

- Architecture diagrams
- Claims
- Open threads
- Competencies

### Summary

Current interview observations.

---

# 11. Evidence Capture

EchoSphere continuously captures diagnostic artifacts throughout the session.

```mermaid
flowchart TD
    subgraph Evidence["Captured Session Evidence"]
        E1["Prosody / Cadence / Pitch"]
        E2["Diarized Speech Transcript"]
        E3["Whiteboard Architecture"]
        E4["Interview Responses"]
        E5["Interaction Context"]
    end

    Evidence --> Engine["Echo Inference Engine"]

    Engine --> Scores["Persona Evaluation"]

    Scores --> Alex["Alex<br/>88 / 100"]
    Scores --> Maya["Maya<br/>61 / 100"]
    Scores --> Daniel["Daniel<br/>79 / 100"]

    Alex --> Analysis["Cross-Persona Analysis"]
    Maya --> Analysis
    Daniel --> Analysis
```

---

# 12. Cross-Persona Assessment

Different personas evaluate different dimensions.

```mermaid
flowchart TD
    Alex["Alex<br/>88 / 100<br/>Strong Scalability Logic"]
    Maya["Maya<br/>61 / 100<br/>User Edge Cases Missed"]
    Daniel["Daniel<br/>79 / 100<br/>Direct Communication"]

    Alex --> Delta{"Discrepancy Analysis"}
    Maya --> Delta
    Daniel --> Delta

    Delta -->|Delta > 20%| Disagreement["Panel Disagreement"]
    Delta -->|Delta <= 20%| Consensus["Unified Evaluation"]

    Disagreement --> Report["Comprehensive Interview Report"]
    Consensus --> Report
```

### Example evaluation

| Persona | Score | Primary observation        |
| ------- | ----: | -------------------------- |
| Alex    |    88 | Strong scalability logic   |
| Maya    |    61 | Overlooked user edge cases |
| Daniel  |    79 | Direct communication       |

The discrepancy between these perspectives becomes useful assessment evidence rather than being averaged away.

---

# 13. Assessment Pipeline

```mermaid
flowchart LR
    Evidence["Session Evidence"]
    Evidence --> Inference["AI Inference"]

    Inference --> Competencies["Competency Scores"]
    Inference --> PersonaScores["Persona Scores"]
    Inference --> Confidence["Confidence"]

    PersonaScores --> Disagreement["Panel Disagreement"]
    Competencies --> Report["Evidence-Backed Report"]
    Confidence --> Report
    Disagreement --> Report

    Report --> Roadmap["Targeted Improvement Roadmap"]
```

---

# 14. End-to-End System

```mermaid
flowchart TD
    Start([Candidate Starts])

    Start --> Intake["Candidate Intake"]
    Intake --> Setup["Interview Configuration"]
    Setup --> Dossier["Candidate Dossier"]
    Dossier --> Diagnostics["Environment Diagnostics"]
    Diagnostics --> Calibration["Voice Calibration"]
    Calibration --> Gate{"Ready?"}

    Gate -->|No| Fix["Resolve Issues"]
    Fix --> Diagnostics

    Gate -->|Yes| Room["Live Interview Room"]

    Room --> Voice["Candidate Voice"]
    Voice --> Context["Context Synthesis"]

    Context --> Router["Persona Router"]
    Router --> Persona["Active AI Persona"]
    Persona --> Question["Adaptive Question"]

    Question --> Voice

    Room --> Evidence["Evidence Ledger"]
    Voice --> Evidence
    Room --> Workspace["Context Workspace"]

    Evidence --> Inference["Inference Engine"]
    Inference --> Assessment["Assessment"]

    Assessment --> Report["Interview Report"]
    Report --> Roadmap["Improvement Roadmap"]

    Roadmap --> Setup

    Report --> End([Session Complete])
```

---

# 15. Architecture Principles

## Voice First

Voice is the primary interaction method.

Traditional controls remain available but secondary.

## Context First

Every question should be informed by:

- Candidate context
- Previous answers
- Competency state
- Persona perspective
- Interview progress

## Persona Specialization

Each interviewer persona should have a clear evaluation responsibility.

## Evidence First

Scores should be backed by observable interview evidence.

## Contextual UI

The interface should reveal tools when needed instead of permanently exposing every surface.

## Continuous Experience

Moving between personas, questions, workspaces, and assessment states should feel like moving through one intelligent environment.

---

# 16. Design North Star

> ## EchoSphere should feel like one continuous intelligent interview.

The candidate should always feel that:

**EchoSphere is listening.**

**EchoSphere understands the interview context.**

**EchoSphere adapts to the candidate's answers.**

**EchoSphere can navigate the environment.**

**Every answer changes what happens next.**

---

## Final System Model

```mermaid
mindmap
    root((EchoSphere))
        Voice
            Wake Word
            Listening
            Thinking
            Speaking
            Voice Commands
        Intelligence
            Context Synthesis
            Persona Router
            Question Generation
            Evidence Inference
        Personas
            Alex
            Maya
            Daniel
            Sophia
            Jordan
        Workspace
            Conversation
            Transcript
            Notes
            Whiteboard
            Summary
        Evidence
            Voice
            Transcript
            Whiteboard
            Responses
        Assessment
            Competencies
            Persona Scores
            Confidence
            Disagreement
        Outcomes
            Report
            Improvement Plan
            Roadmap
```

> **EchoSphere is not a dashboard with an AI assistant attached.**
>
> **It is an AI interview environment in which the assistant, interviewers, evidence, workspace, and assessment operate as one system.**
