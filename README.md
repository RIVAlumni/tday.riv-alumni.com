# RIVAlumni Teachers' Day

Reception system for checking in and out former students visiting their alma mater during Teachers' Day.

## Access Levels

| Level | Role | `/events/{eventId}` | `/events/{eventId}/registrations/{registrationId}` |
|---|---|---|---|
| 0 | None | — | — |
| 1 | Operator | `get` | `get`, update reception state (check-in / reject / conflict) |
| 2 | Mediator | `get` | `get`, `list`, edit profile fields |
| 3 | Administrator | `get` | `get`, `list`, edit profile fields, reception actions, `delete` |

### Operation details

**Reception actions (Operator+)** — allowed on events >= 2026 only:

| Action | Fields written | Constraints |
|---|---|---|
| Check-in | `status`, `arrived_at`, `updated_at`, `updates` | `status = CHECKED_IN`, `arrived_at = request.time` |
| Reject | `status`, `updated_at`, `updates` | `status = REJECTED`, `arrived_at` unchanged |
| Flag conflict | `status`, `updated_at`, `updates` | `status = CONFLICT`, `arrived_at` unchanged |

Every reception action appends exactly one audit entry to `updates`, authenticated against the operator's verified email.

**Profile edits (Mediator+)** — allowed on events >= 2026 only:

| Editable fields | Constraints |
|---|---|
| `full_name`, `comments`, `email`, `contact_number`, `graduating_year` | Validated individually (see `firestore.rules`) |
| `search_ngrams` | Required whenever `full_name`, `contact_number`, or `email` changes |
| `status`, `arrived_at` | Same validators as Operator path |

Every mediator update appends exactly one audit entry to `updates`.

**Legacy events** (2024, 2025): `get` and `list` are allowed at the same access levels. All writes are denied.

## Tech Stack

- SvelteKit + Svelte 5 + TypeScript
- Tailwind CSS
- Firebase Authentication, Firestore, Functions (2nd gen), Admin SDK
- Cloud Run deployment
- pnpm

## Developing

```sh
pnpm install
pnpm run dev
```

## Firestore Rules Tests

Requires the Firestore emulator running on `127.0.0.1:8180`:

```sh
FIRESTORE_RULES_TESTS=1 pnpm run test
```
