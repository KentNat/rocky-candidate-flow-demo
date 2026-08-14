# Rocky — Candidate Flow Demo

Static, backend-less demo of the candidate-facing interview flow, styled to match
[rocky-revamp](https://github.com/KentNat/rocky-revamp) (the recruiter/HR side's design system).

No build step, no API calls — just `index.html` + plain CSS/JS, with a scripted
interview simulation so the whole flow works end-to-end for anyone opening the
deployed link.

## Flow

1. **Login** — invite card + password form
2. **Persiapan** — readiness checklist
3. **Interview** — live call screen with a scripted Q&A exchange (click the mic
   to advance)
4. **Selesai** — completion screen with recording placeholder + chat history

## Run locally

No build tooling needed — any static file server works, e.g.:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy

Static site, no build command, publish directory = repo root. Works as-is on
Netlify, Vercel, GitHub Pages, etc.
