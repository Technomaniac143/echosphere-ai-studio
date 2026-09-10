# EchoSphere — Round 2 Feature Additions

Additive work on the existing screens. Same light theme, same routes, no restructuring of the current flow.

## 1. Landing page: animated AI panel visual
Add a hero animation above/behind the value-prop copy: a pulsing central orb with three orbiting satellite nodes and faint connecting lines, suggesting a panel of agents. CSS/SVG animation only, respects reduced-motion, no heavy library.

## 2. Device check: candidate photo capture
On the system-check page, once the camera check passes, add a "Capture photo" button that grabs a still frame from the live video. Show the still with "Retake" and "Use this photo". The confirmed photo is saved to shared candidate state.

## 3. Shared candidate state
A small app-level store (React context, persisted in the browser) holding: candidate photo, interview history (domain, date, cumulative score, per-competency snapshot). Used by home, report, and history cards so the photo and scores appear everywhere.

## 4. Home page as a portfolio
Same route, elevated design:
- Profile header: photo, name, email, headline cumulative score
- Interview history as visual cards: domain, date, cumulative score, mini per-competency bars, candidate photo on each record
- "Start Mock Interview" stays, as one CTA among several rather than the whole page

## 5. Interview page: four agent tiles with active speaker
Replace the placeholder persona text with four avatar tiles — Technical, Product, Hiring Manager, Behavioral. A scripted timer rotates the "currently speaking" state with a glow/ring and animated level bars. Purely visual for now.

## 6. Interview page: look-away voice alert
Use the live camera feed with an in-browser face detector. If the face is absent or clearly turned away for ~2.5 seconds continuously, speak "Pay attention." once. A cooldown (~15s) prevents repeat firing while still turned away. Everything stays in the browser.

## 7. Interview page: tab-switch voice alert
On losing window focus or tab visibility, speak "Please return to the interview window." once per switch-away event, plus a visible integrity flag on return. Alerts never overlap — a single speech queue shared with #6.

## 8. Interview page: tool panels (editor + whiteboard)
The workspace column becomes a flexible split view with tabs: Conversation / Code / Whiteboard, and the panel can be collapsed entirely so the video view is unobstructed.
- Code: real editor with syntax highlighting and a language picker (JS, Python, SQL, Java).
- Whiteboard: canvas with pen, rectangle, arrow, text, eraser, colour, undo, clear.

## 9. Report page: per-competency scores
Each competency (Communication, Technical Depth, Problem Solving, Product Thinking, Leadership, Adaptability) gets its own score card with a bar, numeric score, band label, and a one-line evidence note — clearly separated, not blended prose.

## 10. Report page: cumulative score
A large headline gauge at the top of the report showing the overall score, band, and delta vs the previous interview. The same number flows into the home page history cards.

## Technical notes
- New shared module `src/lib/candidate-store.tsx` (context + localStorage), provider mounted in `src/routes/__root.tsx`.
- New components split out of `src/components/echosphere.tsx` into `src/components/echosphere/` parts for the heavier pieces (agent tiles, code editor, whiteboard, proctoring hook), keeping existing exports intact.
- Voice alerts use the browser's built-in speech synthesis behind one `speakOnce(key)` helper enforcing cooldown and non-overlap; no AI backend.
- Face detection: `@mediapipe/tasks-vision` FaceLandmarker running client-side, loaded lazily and only on the interview page, with a graceful no-op if the model or camera is unavailable.
- Code editor: CodeMirror via `@uiw/react-codemirror` (light theme), loaded lazily; both new panels are client-only to avoid server rendering issues.
- Whiteboard: plain HTML canvas with a small shape/pen tool set — no extra heavy dependency.
- All scores, history entries, and agent hand-offs remain mock/local data.
