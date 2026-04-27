#!/usr/bin/env node
/**
 * kilter-import: Import Aurora export logbook data into the new Kilter Board app.
 *
 * Imports ascents (completed sends) and attempts (incomplete sends) from
 * your Aurora JSON export into the new Kilter Board app at kiltergrips.com.
 *
 * Usage:
 *   node import-logbook.mjs <export-file.json> [options]
 *
 * Options:
 *   --dry-run     Show what would be imported without sending
 *   --limit N     Only import the first N ascents
 *   --no-skip     Don't skip climbs already in your logbook
 */

import fs from "node:fs";
import readline from "node:readline";

const AUTH_URL = "https://idp.kiltergrips.com/realms/kilter/protocol/openid-connect/token";
const API = "https://portal.kiltergrips.com/api";
const CACHE_FILE = "climb_uuid_cache.json";

function prompt(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(q, a => { rl.close(); r(a); }));
}

async function auth(email, password) {
  const r = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password", client_id: "kilter",
      username: email, password, scope: "openid offline_access",
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Authentication failed (${r.status}). Check your email/password.\n${err}`);
  }
  return (await r.json()).access_token;
}

function parseAttempts(str) {
  if (!str) return { attempts: 1, flashed: 0, topped: 1 };
  if (str.toLowerCase() === "flash") return { attempts: 1, flashed: 1, topped: 1 };
  const m = str.match(/(\d+)/);
  return { attempts: m ? parseInt(m[1]) : 1, flashed: 0, topped: 1 };
}

function toISO(ts) {
  if (!ts) return new Date().toISOString();
  return ts.replace(" ", "T") + (ts.includes("Z") ? "" : "Z");
}

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")); } catch { return {}; }
}

async function resolveClimbs(names, headers) {
  const cache = loadCache();
  let resolved = 0, failed = 0;
  const missing = [];

  for (const name of names) {
    if (cache[name]) { resolved++; continue; }
    try {
      const r = await fetch(`${API}/climbs?name=${encodeURIComponent(name)}`, { headers });
      if (r.ok) {
        const d = await r.json();
        if (d.items?.length > 0) { cache[name] = d.items[0].climbUuid; resolved++; }
        else { failed++; missing.push(name); }
      }
    } catch { failed++; missing.push(name); }
    await new Promise(r => setTimeout(r, 80));
    if ((resolved + failed) % 100 === 0) {
      process.stdout.write(`\r  Resolving climbs: ${resolved + failed}/${names.length}`);
    }
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  console.log(`\r  Resolved ${resolved}/${names.length} climbs` + " ".repeat(20));
  if (missing.length) console.log(`  Unresolved: ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? "..." : ""}`);
  return cache;
}

async function main() {
  const args = process.argv.slice(2);
  const exportFile = args.find(a => !a.startsWith("-"));
  const dryRun = args.includes("--dry-run");
  const limit = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : null;
  const skipExisting = !args.includes("--no-skip");

  if (!exportFile) {
    console.log("Usage: node import-logbook.mjs <export-file.json> [--dry-run] [--limit N]");
    process.exit(1);
  }
  if (!fs.existsSync(exportFile)) {
    console.log(`File not found: ${exportFile}`);
    process.exit(1);
  }

  const email = process.env.KILTER_USER || await prompt("Kilter Board email: ");
  const password = process.env.KILTER_PASS || await prompt("Kilter Board password: ");

  console.log("\nAuthenticating...");
  const token = await auth(email, password);
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  // Get user info
  const user = await (await fetch(`${API}/users`, { headers })).json();
  console.log(`Logged in as: ${user.username}`);

  // Get existing logs
  const existingLogs = await (await fetch(`${API}/logs`, { headers })).json();
  const existing = new Set(existingLogs.map(l => `${l.climbUuid}-${l.angle}`));
  console.log(`Existing logs in new app: ${existingLogs.length}`);

  // Need at least one existing log to get gym/wall defaults
  if (existingLogs.length === 0) {
    console.log("\nError: You need at least one logged climb in the new Kilter Board app.");
    console.log("Log any climb on your board first, then re-run this script.");
    process.exit(1);
  }

  const defaults = {
    gymUuid: existingLogs[0].gymUuid,
    wallUuid: existingLogs[0].wallUuid,
    productLayoutUuid: existingLogs[0].productLayoutUuid,
  };

  // Load export
  const data = JSON.parse(fs.readFileSync(exportFile, "utf-8"));
  console.log(`\nExport file: ${data.ascents?.length || 0} ascents, ${data.attempts?.length || 0} attempts`);

  // Resolve climb names
  const allNames = [...new Set([
    ...(data.ascents || []).map(a => a.climb),
    ...(data.attempts || []).map(a => a.climb),
  ])];
  console.log("");
  const climbMap = await resolveClimbs(allNames, headers);

  // Import ascents
  const ascents = (data.ascents || []).filter(a => climbMap[a.climb]);
  const count = limit ? Math.min(limit, ascents.length) : ascents.length;
  let ok = 0, fail = 0, skip = 0;

  console.log(`\n${dryRun ? "[DRY RUN] " : ""}Importing ${count} ascents...`);
  for (let i = 0; i < count; i++) {
    const a = ascents[i];
    const climbUuid = climbMap[a.climb];
    if (skipExisting && existing.has(`${climbUuid}-${a.angle}`)) { skip++; continue; }

    const { attempts, flashed, topped } = parseAttempts(a.attempts);
    const entry = {
      logUuid: crypto.randomUUID(), climbUuid, userUuid: user.userUuid,
      ...defaults, angle: a.angle, flashed, topped, attempts,
      createdAt: toISO(a.climbed_at || a.created_at),
    };

    if (dryRun) { ok++; continue; }

    try {
      const r = await fetch(`${API}/logs`, { method: "POST", headers, body: JSON.stringify(entry) });
      if (r.ok) { ok++; existing.add(`${climbUuid}-${a.angle}`); }
      else { fail++; }
    } catch { fail++; }

    await new Promise(r => setTimeout(r, 200));
    if ((ok + fail + skip) % 50 === 0) process.stdout.write(`\r  ${ok} ok, ${fail} failed, ${skip} skipped`);
  }
  console.log(`\r  Ascents: ${ok} imported, ${fail} failed, ${skip} skipped` + " ".repeat(20));

  // Import attempts (incomplete sends)
  const bids = (data.attempts || []).filter(a => climbMap[a.climb]);
  if (bids.length > 0 && (!limit || count >= ascents.length)) {
    let bidOk = 0, bidFail = 0;
    console.log(`\n${dryRun ? "[DRY RUN] " : ""}Importing ${bids.length} attempts...`);

    for (const b of bids) {
      const entry = {
        logUuid: crypto.randomUUID(), climbUuid: climbMap[b.climb], userUuid: user.userUuid,
        ...defaults, angle: b.angle, flashed: 0, topped: 0, attempts: b.count || 1,
        createdAt: toISO(b.climbed_at || b.created_at),
      };

      if (dryRun) { bidOk++; continue; }

      try {
        const r = await fetch(`${API}/logs`, { method: "POST", headers, body: JSON.stringify(entry) });
        if (r.ok) bidOk++; else bidFail++;
      } catch { bidFail++; }
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`  Attempts: ${bidOk} imported, ${bidFail} failed`);
  }

  console.log("\nDone!");
}

main().catch(e => { console.error(e.message); process.exit(1); });
