# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server (use tmux for non-blocking):**
```bash
tmux new-session -d -s dev "npm run dev"
# or use slash command: /user:dev npm run dev
```

**Build commands:**
```bash
npm run build          # Production build
npm run build:dev       # Development build
npm run preview         # Preview production build
npm run lint           # ESLint code checking
```

**Project setup:**
```bash
npm i                  # Install dependencies
```

## Application Architecture

This is an **Eastern Star trivia quiz game** built with Vite + React + TypeScript + shadcn/ui + Tailwind CSS.

### Core Game Flow
1. **Team Selection** (`/`) - Players choose from 5 Eastern Star point teams
2. **Landing Page** (`/landing`) - Welcome screen with team selection confirmation  
3. **Team Selection** (`/teams`) - Dedicated team picker
4. **Lobby** (`/lobby`) - Pre-game waiting area
5. **Game** (`/game`) - Main quiz gameplay with timer and scoring
6. **Results** (`/results`) - Final scores and rankings
7. **Admin** (`/admin`) - Game administration interface

### Team System
The game centers around 5 Eastern Star point teams defined in `src/utils/constants.ts`:
- **Adah** (Blue) - Fidelity
- **Ruth** (Orange) - Constancy  
- **Esther** (Purple) - Loyalty
- **Martha** (Teal) - Faith
- **Electa** (Red) - Love

Each team has specific colors, heroines, and meanings that are used throughout the UI.

### Key Components
- **Game Components** (`src/components/game/`): QuestionCard, Timer, ScoreBoard, ConfidenceSelector, FinalWager
- **UI Components** (`src/components/ui/`): Full shadcn/ui component library
- **Pages** (`src/pages/`): Route-based page components with React Router
- **Game Logic**: Question handling, scoring, timer management in `Game.tsx`

### Data Structure
- **Questions**: Stored in `src/utils/sampleData.ts` with Eastern Star knowledge
- **Game State**: Managed locally with React state (scores, current question, timer)
- **Navigation**: React Router with state passing between routes

### Tech Stack Details
- **Vite**: Dev server on port 8080, SWC for fast React compilation
- **Styling**: Tailwind CSS with custom team colors and shadcn/ui components
- **State**: React hooks (no external state management)
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation (if needed)
- **Routing**: React Router DOM with programmatic navigation

### Configuration Notes
- Path alias `@` points to `src/` directory
- Development server runs on `::8080` (all interfaces)
- ESLint configured with React and TypeScript rules
- No test framework currently configured