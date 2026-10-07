# EchoSphere — Enhancement Roadmap

## Stage 1 — Database foundation

- [x] Four category scores + overall on interview_threads
- [x] Monitoring columns (turn_away_count, violations, termination_reason, device status)
- [x] Evidence + lost-points + github_context columns
- [x] Difficulty + started_at/ended_at
- [x] Profile: phone, linkedin, experience, best project
- [x] Organizations + org members + interview patterns
- [x] Monitoring events log

## Stage 2 — Profile & forms

- [x] Placeholders on every input
- [x] Input types (tel/email/number/url)
- [x] Frontend + backend validation (Gmail, 10-digit phone, URL formats)
- [x] Existing-account detection: load stored profile, only ask for missing
- [x] Photo/resume/github propagate app-wide

## Stage 3 — Permissions & system check

- [x] Camera/mic/screen real verification, live preview
- [x] Entire-screen-only enforcement (displaySurface check)
- [x] Retry, revocation detection, no permission spam
- [x] Block interview start until all pass

## Stage 4 — Interview intelligence

- [x] AI-managed difficulty (persisted)
- [x] GitHub project analysis + project-specific question
- [x] "Hey Agora" wake word; filler-word acknowledgement filtering

## Stage 5 — Monitoring & termination

- [x] Turn-away 3-warning counter (server-persisted)
- [x] Abusive language detection -> terminate
- [x] End Meeting -> confirm -> score 0
- [x] Screen-share stop handling + event log
- [x] Violation zero overrides calculated scores (server-side)

## Stage 6 — Report / portfolio

- [x] Four category scores + overall
- [x] Evidence-backed per-category reasoning
- [x] "Where you lost points"
- [x] Candidate photo + details
- [x] Download PDF (real document)
- [x] Return to Dashboard with fresh data

## Stage 7 — Dashboard

- [x] Four category scores + overall, interview count, latest status/date
- [x] No hardcoded values, refetch after report

## Stage 8 — Echo assistant (landing)

- [x] Mic permission with explanation
- [x] "Hey Echo" wake word -> navigation commands
- [x] Separate from Agora interview agent

## Stage 9 — Organization flow

- [x] Org signup/login
- [x] Org dashboard with ranked candidates + sorting
- [x] Interview pattern upload (optional)

## Stage 10 — Landing animation

- [x] 2s looping AI interview animation, light theme

## Stage 11 — Testing

- [x] End-to-end flows, console errors, DB reads/writes
