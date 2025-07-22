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
**Traditional Flow:**
1. **Team Selection** (`/`) - Players choose from 5 Eastern Star point teams
2. **Landing Page** (`/landing`) - Welcome screen with team selection confirmation  
3. **Team Selection** (`/teams`) - Dedicated team picker
4. **Lobby** (`/lobby`) - Pre-game waiting area
5. **Game** (`/game`) - Main quiz gameplay with timer and scoring
6. **Results** (`/results`) - Final scores and rankings
7. **Admin** (`/admin`) - Game administration interface

**Dinner Table Flow (NEW):**
1. **QR Code Generation** (`/admin/qr-codes`) - Pre-generate printable team QR codes at home
2. **Team Join** (`/join?team=adah`) - Ladies scan table QR code during dinner
3. **Name Entry** - Enter first name, last initial
4. **Game Code Waiting** - Wait for host to announce 3-character code (e.g., "ABC")
5. **Join Game** - Enter code and automatically join assigned team
6. **Lobby** → **Game** → **Results** - Standard game flow continues

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
- **QR Code System** (`src/pages/PrintableQR.tsx`, `src/pages/TeamJoin.tsx`): Dinner table workflow with team-branded QR codes
- **Admin Tools** (`src/pages/Admin.tsx`): Game control dashboard with QR code generation

### Data Structure
- **Questions**: Stored in `src/utils/sampleData.ts` with Eastern Star knowledge
- **Game State**: Managed locally with React state (scores, current question, timer)
- **Game Codes**: 3-character alphanumeric codes (e.g., "ABC", "XYZ") for easy verbal announcement
- **Navigation**: React Router with state passing between routes

### Tech Stack Details
- **Vite**: Dev server on port 8080, SWC for fast React compilation
- **Styling**: Tailwind CSS with custom team colors and shadcn/ui components
- **State**: React hooks (no external state management)
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation (if needed)
- **Routing**: React Router DOM with programmatic navigation
- **QR Codes**: qrcode library for generating team-branded QR codes
- **Backend**: Supabase for game data storage and real-time updates

### Dinner Event Workflow
**Pre-Event (At Home):**
1. Visit `/admin/qr-codes` to generate printable QR codes
2. Print one page per team (5 total) with team colors and instructions
3. Place printed QR codes at corresponding colored tablecloth tables

**During Dinner:**
1. Ladies scan their table's QR code with smartphone camera
2. Enter name (first name, last initial) and wait
3. Host creates game in admin panel (generates 3-character code)
4. Host announces: "Game code is ABC"
5. Everyone enters code and joins their pre-assigned team
6. Game begins when host starts it

**Key Benefits:**
- No typing long URLs or game codes during setup
- Easy 3-character codes for verbal announcement  
- Team assignment by table seating (colored tablecloths)
- Ladies can set up during dinner at their own pace

### Configuration Notes
- Path alias `@` points to `src/` directory
- Development server runs on `::8080` (all interfaces)
- ESLint configured with React and TypeScript rules
- No test framework currently configured