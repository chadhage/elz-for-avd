# AVD on GCC High — Enterprise-Scale Landing Zone Assessment Workshop

A self-contained **L400 workshop microsite** that guides a Cloud Solution Architect (CSA) and customer through an **Azure Enterprise-Scale Landing Zone Assessment** for an **Azure Virtual Desktop (AVD)** workload running in **GCC High (Azure Government)** with **multi-tenant** considerations.

The site is designed to **minimize context switching**: intro content, authoritative Microsoft sources, current-state capture, and target-state design all live on one screen per module. Everything you type is captured to a portable **`assessment.json`**.

---

## Run it

No build, no server, no internet required.

```text
Double-click index.html  →  opens in your browser
```

Optional (nicer for multi-user demos), serve locally:

```powershell
# From the project folder
python -m http.server 8080
# then browse to http://localhost:8080
```

> Works fully offline from `file://`. Module content is loaded via a plain `<script>` (no `fetch`), so there are no CORS issues.

---

## Workshop structure

Nine 30-minute modules, each aligned to a **CAF Enterprise-Scale design area** and the **Well-Architected Framework** pillars:

| # | Module | Focus |
|---|--------|-------|
| 0 | Introduction & Assessment Framing | Scope, sovereignty target, decision-makers |
| 1 | Identity & Access | Entra ID Government, join model, Conditional Access, PIM, cross-tenant |
| 2 | Network Topology & Connectivity | Hub-spoke vs vWAN, egress control, private endpoints, RDP Shortpath |
| 3 | Information Security & Compliance | NIST 800-171 / CMMC / IL, Defender, CMK, hardening, DLP |
| 4 | Platform Automation & DevOps | IaC, image factory, MG hierarchy, Gov-aware pipelines |
| 5 | FinOps & Cost | Pooled vs personal, autoscale, commitments, chargeback |
| 6 | Monitoring & Reliability | AVD Insights, SLOs, availability zones, BCDR |
| 7 | Migration Readiness | App discovery, boundary data migration, pilots, cutover |
| 8 | Planning & Execution | Roadmap, RACI, risks, ATO alignment |

Each module contains:

1. **Overview & Sources** — L400 intro with links to first-party Microsoft docs (shown in the right-hand reference dock).
2. **Current State (as-is)** — structured questions to capture today's environment.
3. **Target State (to-be)** — questions and discussion points to capture design decisions.

---

## Capturing & sharing inputs

- **Autosave** — every field persists to this browser's `localStorage` as you type.
- **Save** — force a save (also stores your place).
- **Export JSON** — downloads `assessment.json` (conforms to [`data/assessment.schema.json`](data/assessment.schema.json)).
- **Import** — reload a previously exported `assessment.json` to resume or review.

The exported JSON is a **machine-readable design backlog** — feed it into your SSP, work-item backlog, or IaC parameterization.

### Keyboard shortcuts
- `Alt + →` / `Alt + ←` — next / previous module.

---

## File layout

```text
index.html                     Shell (top bar, rail, workspace, reference dock)
css/styles.css                 Focus-first workshop UI (dark/light)
js/app.js                      Navigation, mini-markdown, state, JSON import/export
data/modules.js                All module content & questions (L400) — edit here
data/assessment.schema.json    JSON Schema for the exported assessment
README.md                      This file
```

## Customizing content

All intro copy, references, and questions live in [`data/modules.js`](data/modules.js).
Add or edit modules by following the documented question schema at the top of that file:

```js
{ id, type, label, help?, options?, placeholder? }
// type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox'
```

Intro text uses a small Markdown subset (headings, bold/italic, lists, links, `code`, blockquotes) rendered client-side.

---

## Notes on GCC High accuracy

Content is written to **L400** and is anchored to Microsoft first-party documentation, but Azure Government service parity, region availability, and SKU/feature support change over time. **Validate every service, SKU, and feature against current Azure Government product availability** before committing design decisions. Each module's reference dock links the authoritative source.
