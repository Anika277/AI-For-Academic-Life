# Curriculum Desk — Frontend

React + Vite frontend for the OBE new-course syllabus review tool.

## Run it

```bash
npm install
npm run dev
```

The dev server runs on the default Vite port (5173) and proxies any request
to `/api/*` through to the Express backend at `http://localhost:5000`
(see `vite.config.js`). **Change that port if the backend teammate's
`server.js` listens somewhere else.**

## What's here

- `src/App.jsx` — top-level state, the "Analyze draft" flow, layout.
- `src/components/CourseForm.jsx` — course metadata form; assembles the
  CLO table, weekly plan table, and assessment breakdown.
- `src/components/CLOTable.jsx` / `WeeklyPlanTable.jsx` / `AssessmentBreakdown.jsx`
  — the three dynamic, add/remove-row sections of the form.
- `src/components/ProgressTracker.jsx` — UI-only, derived live from the
  completeness result. No backend call of its own.
- `src/components/CompletenessPanel.jsx` / `OverlapPanel.jsx` / `CLOQualityPanel.jsx`
  — render the three API responses.
- `src/api/client.js` — the three fetch calls, matching the API contract.
- `src/utils/course.js` — schema helpers, Bloom's level labels, and a
  `sampleCourse()` you can load with the "Load sample draft" button for
  demoing without typing the whole form live.

## API contract this expects

```
POST /api/check-completeness  -> { checklist: [{ label, passed, detail? }], percent }
POST /api/check-overlap       -> { results: [{ course_code, overlap_percent, overlapping_topics }] }
POST /api/check-clo           -> { feedback: [{ clo_id, bloom_valid, suggestion }] }
```

Each request body is `{ course }` where `course` matches the shared schema
in the hackathon spec. **Confirm the `checklist` item shape (`label`/`passed`/
optional `detail`) with the backend dev before the demo** — if their field
names differ, update the two spots in `CompletenessPanel.jsx` and
`ProgressTracker.jsx` that read `item.label` / `item.passed`.

## Demo flow

1. Click **Load sample draft** to fill the form instantly (or type a real one).
2. Click **Analyze draft** — completeness runs first and shows immediately;
   overlap + CLO checks fire in parallel right after and show their own
   loading state independently, so one failing doesn't block the other.
