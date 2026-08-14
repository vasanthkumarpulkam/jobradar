# Job Radar

**An edge-deployed job aggregator that pulls analyst and data roles from Greenhouse and Lever boards across ~200 companies.**

[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Edge Runtime](https://img.shields.io/badge/Vercel-Edge_Runtime-000000?logo=vercel&logoColor=white)](https://vercel.com/docs/functions/edge-functions)

> **Status: superseded.** This project has been succeeded by [**ATS Pulse**](https://github.com/vasanthkumarpulkam/atspluse), which adds MongoDB persistence, job lifecycle tracking, a pluggable adapter architecture and a management UI, and by [**Workday Radar**](https://github.com/vasanthkumarpulkam/Workdayradar) for Workday-specific coverage. Job Radar is kept as a reference implementation of the edge-runtime approach.

---

## Overview

Job Radar queries the public job-board APIs of Greenhouse and Lever directly, filters for analyst and data-engineering titles, restricts results to the US, and returns everything from a single edge function.

The design constraint was latency: the whole aggregation runs on Vercel's Edge Runtime rather than in a Node serverless function, so responses come from the nearest region.

## Features

- **Two ATS providers** — Greenhouse and Lever, ~200 company slugs combined
- **Keyword filtering** across 21 analyst, BI, data-engineering and compliance title patterns
- **US-only filtering** by state name, major city, or explicit "remote"/"United States" markers, with an exclusion list for obviously non-US locations
- **Time-window filtering** — postings within the last N minutes
- **Edge runtime** with a 45-second maximum duration
- **Zero runtime dependencies** beyond React and Next.js

## How it works

```
GET /api/jobs?minutes=60
        │
        ├── Greenhouse   boards-api.greenhouse.io/v1/boards/{slug}/jobs
        ├── Lever        api.lever.co/v0/postings/{slug}
        │
        ▼
  isRelevant(title)   →  21 keyword patterns
  isUS(location)      →  50 states + DC, 60+ major cities,
                         non-US exclusion list, default-include when ambiguous
  isWithin(date, n)   →  posting recency window
        │
        ▼
  Normalised Job[] { id, title, company, location, url, posted, source, remote }
```

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Runtime | Vercel Edge Runtime |
| Language | TypeScript |
| Dependencies | `next`, `react`, `react-dom` only |

## Getting started

```bash
git clone https://github.com/vasanthkumarpulkam/jobradar.git
cd jobradar
npm install
npm run dev              # http://localhost:3000
```

No environment variables required.

### Deploy

```bash
vercel
```

## API reference

| Method | Endpoint | Query parameters |
|---|---|---|
| `GET` | `/api/jobs` | `minutes` — recency window in minutes |

```bash
curl "http://localhost:3000/api/jobs?minutes=120"
```

## Project structure

```
jobradar/
├── app/
│   ├── page.tsx              Job list UI
│   ├── layout.tsx
│   └── api/jobs/route.ts     Edge aggregation endpoint
├── next.config.js
└── vercel.json
```

## Adding a company

Append the board slug to the relevant array in `app/api/jobs/route.ts`:

```ts
const GH_SLUGS = [ ..., "your-greenhouse-slug" ];
const LV_SLUGS = [ ..., "your-lever-slug" ];
```

The slug is the identifier in the company's job board URL — `boards.greenhouse.io/**stripe**` or `jobs.lever.co/**netflix**`.

## Responsible use

This project reads publicly documented job-board APIs — the same endpoints Greenhouse and Lever serve to any visitor of a company's careers page. It does not bypass authentication or bot protection. Keep polling conservative and respect each provider's terms of service.

## Known limitations

- Company slugs are hardcoded and unvalidated; invalid slugs fail silently on every request
- No persistence — every request re-fetches everything, so "new since last check" isn't possible
- No de-duplication across providers
- The 45-second edge limit caps how many boards can be queried per request

## Migration path

If you're looking at this project, look at [ATS Pulse](https://github.com/vasanthkumarpulkam/atspluse) instead. It solves the same problem with a proper adapter architecture, MongoDB persistence, and `first_seen_at` / `last_seen_at` lifecycle tracking — which is what makes "genuinely new posting" a meaningful concept.

## Author

**Vasanth Kumar Pulkam** — [GitHub](https://github.com/vasanthkumarpulkam)
