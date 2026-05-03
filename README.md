# Pharmora Signal

**AI Cardiometabolic Strategy & Pipeline Copilot**

Pharmora Signal is a chatbot-first internal strategy prototype that supports Pharmora's cardiometabolic strategy and pipeline decision-making. It uses Groq's LLM API (Llama 3.3 70B) to provide conversational, structured strategic recommendations about pipeline prioritization, clinical trial planning, payer strategy, competitor threats, and compliance traceability.

## Important Disclaimers

- This is an **internal strategic decision support tool only**
- Uses **mock pipeline and competitor data** as context for AI-generated responses
- Does **not** provide medical advice, diagnosis, or prescription recommendations
- Does **not** claim FDA approval
- All recommendations **require human review** before action
- Does **not** replace executive, clinical, regulatory, financial, or scientific review

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set your Groq API key. Copy `.env.example` to `.env` and fill in your key:
```bash
cp .env.example .env
```

Edit `.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

3. Run in development (starts both Vite frontend and Express API server):
```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the API server on `http://localhost:3001`. Vite proxies `/api` requests to the backend automatically.

4. To build for production:
```bash
npm run build
```

5. To run only the backend server:
```bash
npm run server
```

## Architecture

- **Frontend**: React + TypeScript + Vite (single-page chatbot interface)
- **Backend**: Express server (`server/index.ts`) that proxies requests to Groq API
- **API key security**: The Groq API key is stored in `.env` and never shipped in the client bundle. The Express server reads it at runtime.
- **Model**: Llama 3.3 70B Versatile (via Groq)

## Chatbot Tools

The chatbot uses six internal modules (injected as context for the LLM):

1. **Pipeline Prioritizer** — Scores drug candidates by market opportunity, phase, approval probability, and strategic fit
2. **Clinical Trial Design Assistant** — Suggests trial design considerations, endpoints, and development risks
3. **Payer Strategy Simulator** — Estimates pricing pressure, coverage risk, and reimbursement strategy
4. **Competitor Monitor** — Compares Pharmora against Cardiva, BioNova, Firenza, and Ash & Co
5. **Recommendation Chatbot** — Generates structured strategic recommendations
6. **Compliance / Traceability Log** — Shows data used, assumptions, risk level, and human review requirements

## Interface Layout

- **Left sidebar**: Branding, role selector (visual chip grid), saved conversations, system guardrails
- **Center chat area**: Conversational AI chatbot with structured responses
- **Right evidence panel**: Supporting data, pipeline tables, competitor cards, and audit trail

## Role-Based Responses

The role selector adjusts LLM response emphasis:
- C-Suite: strategy, market share, growth, prioritization
- R&D: pipeline, clinical trial design, development risk
- Finance: ROI, R&D allocation, pricing risk
- Marketing: competitor positioning, prescriber strategy
- Regulatory/Compliance: compliance risk, audit trail, AI guardrails
- IT: data sources, access control, security

## Tech Stack

- React + TypeScript + Vite (frontend)
- Express + tsx (backend)
- Groq API (Llama 3.3 70B Versatile)
- concurrently (dev server orchestration)

## Known Limitations

- Pipeline and competitor data is mock/illustrative only
- Market opportunity and approval probability figures are fictional
- No authentication or real role-based access control is implemented
- Conversation history is stored in browser memory only (not persisted)
- Competitor data is fictional and for demonstration purposes only
- If the Groq API is unreachable, the chatbot will display an error message
