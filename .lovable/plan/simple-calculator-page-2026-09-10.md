# Simple Calculator Page

## What we're building
Replace the placeholder `src/routes/index.tsx` with a functional, responsive calculator page at `/`.

## Features
- Numeric keypad (0–9)
- Decimal point
- Basic operations: add, subtract, multiply, divide
- Equals button
- Clear / all-clear button
- Backspace / delete last entry
- Keyboard support for number and operator keys
- Display showing current input and running calculation

## Design approach
- Clean, centered card layout
- Large, readable display
- Grid-based button pad
- Uses existing Tailwind v4 design tokens (no hardcoded colors)
- Light/dark mode aware via CSS variables

## Technical notes
- Keep all logic client-side in the route component
- No backend or database needed
- Update route `head()` with calculator-specific title and description
- Ensure responsive sizing for mobile and desktop

## Acceptance
- `/` renders a working calculator
- All basic arithmetic operations produce correct results
- Page has proper metadata and no placeholder remains
