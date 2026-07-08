# DC-Sentinel

**The Project Intelligence Brain for Data Centre EPC Delivery**

Built for the ET AI Hackathon 2026, Problem Statement 4 (AI Intelligence Platform for Data Centre EPC Project Delivery).

DC-Sentinel unifies a data centre project's fragmented documents — specifications, vendor submittals, RFIs, schedules and commissioning test records — into a single living intelligence layer, so that specification deviations are caught **before they reach site**, schedule risk is flagged **weeks ahead**, and project knowledge is answered **in seconds with citations**.

---

## What's in the box (four working agents)

| Agent | What it does | Type |
|-------|--------------|------|
| **Spec & Quality Compliance** | Extracts parameters from a vendor submittal, retrieves the governing spec clause, flags Compliant / Deviation / Needs Review with a cited clause | RAG + structured extraction |
| **Project Knowledge & RFI** | Answers project questions grounded only in the documents, cited, and surfaces prior resolved RFIs | Conversational RAG |
| **Predictive Schedule Risk** | Scores each activity's critical-path risk from procurement, lead time, float and workforce — explainable and rule-based | Deterministic rules |
| **Commissioning QA Copilot** | Walks TIA-942 test steps, validates measured values against acceptance criteria, builds the test record | Deterministic rules |

A fifth agent, **Supply Chain Visibility**, is architected on the roadmap (it needs live vessel AIS / port-congestion feeds and is deliberately not simulated).

---

## Architecture

Four layers, bottom to top:

1. **Ingestion** — parse, chunk, embed and tag documents (doc type, source, clause).
2. **Intelligence** — Pinecone vector index (namespaced per project) + Gemini 2.5 Flash, under a **strict-mode retrieval contract**: a verdict is asserted only when the similarity score clears **0.65** and at least **two strong chunks** support it; otherwise the answer is routed to **human review**. This is what makes the output admissible into a formal quality audit trail.
3. **Agents** — the four bounded agent workflows above.
4. **Experience** — this Next.js web app.

### Stack

- **Next.js 14** (App Router) on **Vercel**
- **Gemini 2.5 Flash** for generation + `gemini-embedding-001` (pinned to 768-dim) for embeddings, with 1–8 key rotation
- **Pinecone** for vector retrieval

---

## Setup

### 1. Create a Pinecone index

- Name: `dc-sentinel` (or set `PINECONE_INDEX`)
- Dimensions: **768** (gemini-embedding-001 pinned to 768 via outputDimensionality)
- Metric: cosine

### 2. Set environment variables (in Vercel → Project → Settings → Environment Variables)

```
GEMINI_API_KEY_1 ... GEMINI_API_KEY_8   (or a single GEMINI_API_KEY)
PINECONE_API_KEY
PINECONE_INDEX=dc-sentinel
```

### 3. Deploy

Import this repo into Vercel; it builds and deploys automatically.

### 4. Seed the demo project

Open `/health` on the deployed site → **Run health check** (confirm all green) → **Seed demo data**. This embeds the sample specs, submittals and RFIs into the index.

### 5. Demo

- `/compliance` — load the "UPS-01 (contains a deviation)" sample → **Check compliance** → see the 94% efficiency flagged against the 96% spec, with the cited clause.
- `/rfi` — ask "What is the required minimum UPS efficiency?"
- `/schedule` — view risk-ranked activities.
- `/commissioning` — **Prefill demo values** → **Build test record**.

---

## Local development (optional)

```
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

---

## Why the design choices (for reviewers)

- **Strict-mode retrieval** keeps the compliance verdict trustworthy: no hallucinated spec clauses, and honest "Needs Review" when confidence is low.
- **Rule-based schedule and commissioning agents** are explainable on purpose — a project manager must be able to justify a flag; a black-box score they cannot interrogate is worse than a transparent one they can.
- **Namespaced-per-project index** means onboarding a new build is a data operation, not an engineering one — the platform scales by project, not by rebuild.
