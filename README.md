# I built a tool to import your old Aurora logbook into the new Kilter Board app

**Warning! Proceed at your own risk. The program is provided as-is.**

My Aurora data export has been sitting in limbo after uploading to kilterboard.io/claim. After weeks of waiting, I decided to reverse engineer the new Kilter Board API and build an import tool myself.

**What it imports:**

- Ascents (completed sends with flash/attempt count)
- Attempts (incomplete sends)
- Likes (added to your "Liked Climbs" playlist)
- Circuit/playlist climbs (circuits need to be created manually in the app first, then the tool populates them)

**What you need:**

- Your Aurora JSON export file (the .json you got from Aurora support or downloaded from the old app)
- A new Kilter Board account with at least one climb logged
- Node.js v18+

## Setup

```bash
git clone https://github.com/nauynix/kilter-import.git && cd kilter-aurora-import
npm install
```

## Step 1: Import logbook (ascents + attempts)

```bash
# Dry run first — see what would be imported
node import-logbook.mjs your-export.json --dry-run

# Import everything
node import-logbook.mjs your-export.json

# Import just the first 10 to test
node import-logbook.mjs your-export.json --limit 10
```

You'll be prompted for your new Kilter Board email and password. Alternatively, set environment variables:

```bash
KILTER_USER="you@email.com" KILTER_PASS="yourpass" node import-logbook.mjs your-export.json
```

### What gets imported

| Old field | New field | Notes |
|-----------|-----------|-------|
| climb (name) | climbUuid | Resolved via API lookup |
| angle | angle | Direct mapping |
| attempts ("Flash"/"4 tries") | flashed, topped, attempts | Parsed automatically |
| climbed_at | createdAt | Converted to ISO-8601 |

- Ascents are imported as `topped: 1` (completed sends)
- Attempts are imported as `topped: 0` (incomplete sends)
- "Flash" is imported as `flashed: 1, attempts: 1`
- Duplicate climb+angle combinations are skipped by default
- Climb name resolution is cached in `climb_uuid_cache.json` for faster re-runs

## Step 2: Import likes and circuit climbs

```bash
# Dry run
node import-likes-circuits.mjs your-export.json --dry-run

# Import likes only
node import-likes-circuits.mjs your-export.json --likes-only

# Import everything
node import-likes-circuits.mjs your-export.json
```

### Circuit setup

Circuit creation via the API is currently broken on Kilter's backend (returns 500). You need to **create your circuits manually in the app first**, matching the names from your export. Then run this script to populate them with climbs.

The script will tell you which circuit names it couldn't find so you can create them.

### What gets imported

- **Likes** — added to your built-in "Liked Climbs" circuit
- **Circuit climbs** — added to circuits that match by name

## Caveats

- The grade/difficulty and star rating from the old app don't have equivalent fields in the new app's log format — only flash/topped/attempt count are stored
- The gym/wall/layout defaults are pulled from your most recent log in the new app, so make sure you've logged at least one climb at your usual gym first
- Your password is only used to get an auth token and is never stored

## How it works

The new Kilter Board app uses:
- **Keycloak** (`idp.kiltergrips.com`) for authentication
- **PowerSync** (`sync1.kiltergrips.com`) for data sync
- **Portal API** (`portal.kiltergrips.com/api`) for REST operations

This tool authenticates via Keycloak, resolves climb names to UUIDs via the Portal API, and writes log entries via `POST /api/logs`. Likes and circuit climbs use `POST /api/circuit-climbs`.
