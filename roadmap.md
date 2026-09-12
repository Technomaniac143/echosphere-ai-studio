# EchoSphere — Enhancement Roadmap

## Stage 1 — Database foundation
- [ ] Four category scores + overall on interview_threads
- [ ] Monitoring columns (turn_away_count, violations, termination_reason, device status)
- [ ] Evidence + lost-points + github_context columns
- [ ] Difficulty + started_at/ended_at
- [ ] Profile: phone, linkedin, experience, best project
- [ ] Organizations + org members + interview patterns
- [ ] Monitoring events log

## Stage 2 — Profile & forms
- [ ] Placeholders on every input
- [ ] Input types (tel/email/number/url)
- [ ] Frontend + backend validation (Gmail, 10-digit phone, URL formats)
- [ ] Existing-account detection: load stored profile, only ask for missing
- [ ] Photo/resume/github propagate app-wide

## Stage 3 — Permissions & system check
- [ ] Camera/mic/screen real verification, live preview
- [ ] Entire-screen-only enforcement (displaySurface check)
- [ ] Retry, revocation detection, no permission spam
- [ ] Block interview start until all pass

## Stage 4 — Interview intelligence
- [ ] AI-managed difficulty (persisted)
- [ ] GitHub project analysis + project-specific question
- [ ] "Hey Agora" wake word; filler-word acknowledgement filtering

## Stage 5 — Monitoring & termination
- [ ] Turn-away 3-warning counter (server-persisted)
- [ ] Abusive language detection -> terminate
- [ ] End Meeting -> confirm -> score 0
- [ ] Screen-share stop handling + event log
- [ ] Violation zero overrides calculated scores (server-side)

## Stage 6 — Report / portfolio
- [ ] Four category scores + overall
- [ ] Evidence-backed per-category reasoning
- [ ] "Where you lost points"
- [ ] Candidate photo + details
- [ ] Download PDF (real document)
- [ ] Return to Dashboard with fresh data

## Stage 7 — Dashboard
- [ ] Four category scores + overall, interview count, latest status/date
- [ ] No hardcoded values, refetch after report

## Stage 8 — Echo assistant (landing)
- [ ] Mic permission with explanation
- [ ] "Hey Echo" wake word -> navigation commands
- [ ] Separate from Agora interview agent

## Stage 9 — Organization flow
- [ ] Org signup/login
- [ ] Org dashboard with ranked candidates + sorting
- [ ] Interview pattern upload (optional)

## Stage 10 — Landing animation
- [ ] 2s looping AI interview animation, light theme

## Stage 11 — Testing
- [ ] End-to-end flows, console errors, DB reads/writes
