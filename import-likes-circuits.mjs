#!/usr/bin/env node
/**
 * kilter-import: Import likes and populate circuits from Aurora export data.
 *
 * Likes are added to the built-in "Liked Climbs" circuit.
 * Circuits must be created manually in the app first, then this script
 * populates them with climbs (circuit creation via API is broken server-side).
 *
 * Usage:
 *   node import-likes-circuits.mjs <export-file.json> [options]
 *
 * Options:
 *   --dry-run           Show what would be imported without sending
 *   --likes-only        Only import likes, skip circuits
 *   --circuits-only     Only import circuits, skip likes
 */

import { PowerSyncDatabase, column, Schema, Table } from "@powersync/node";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const AUTH_URL = "https://idp.kiltergrips.com/realms/kilter/protocol/openid-connect/token";
const SYNC_URL = "https://sync1.kiltergrips.com";
const API = "https://portal.kiltergrips.com/api";
const CACHE_FILE = "climb_uuid_cache.json";
const DB_PATH = path.join(os.tmpdir(), "kilter-import-circuits.db");

const schema = new Schema({
  circuits: new Table({ circuit_uuid: column.text, name: column.text, color: column.text }),
  users: new Table({ username: column.text }),
  gyms: new Table({ name: column.text }),
  walls: new Table({ name: column.text }),
  products: new Table({ name: column.text }),
});

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
  if (!r.ok) throw new Error(`Authentication failed (${r.status})`);
  return await r.json();
}

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")); } catch { return {}; }
}

async function resolveClimbs(names, headers) {
  const cache = loadCache();
  const toResolve = names.filter(n => !cache[n]);
  if (toResolve.length > 0) {
    console.log(`Resolving ${toResolve.length} climb names...`);
    for (const name of toResolve) {
      try {
        const r = await fetch(`${API}/climbs?name=${encodeURIComponent(name)}`, { headers });
        if (r.ok) { const d = await r.json(); if (d.items?.length) cache[name] = d.items[0].climbUuid; }
      } catch {}
      await new Promise(r => setTimeout(r, 80));
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  }
  return cache;
}

async function main() {
  const args = process.argv.slice(2);
  const exportFile = args.find(a => !a.startsWith("-"));
  const dryRun = args.includes("--dry-run");
  const likesOnly = args.includes("--likes-only");
  const circuitsOnly = args.includes("--circuits-only");

  if (!exportFile) {
    console.log("Usage: node import-likes-circuits.mjs <export-file.json> [--dry-run] [--likes-only] [--circuits-only]");
    process.exit(1);
  }

  const email = process.env.KILTER_USER || await prompt("Kilter Board email: ");
  const password = process.env.KILTER_PASS || await prompt("Kilter Board password: ");

  console.log("\nAuthenticating...");
  const authData = await auth(email, password);
  const token = authData.access_token;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const data = JSON.parse(fs.readFileSync(exportFile, "utf-8"));

  // Resolve all climb names
  const allNames = [...new Set([
    ...(data.likes || []).map(l => l.climb),
    ...(data.circuits || []).flatMap(c => c.climbs),
  ])];
  const climbMap = await resolveClimbs(allNames, headers);

  // Connect to PowerSync to discover circuits
  console.log("Syncing circuit data...");
  try { fs.unlinkSync(DB_PATH); } catch {}
  const db = new PowerSyncDatabase({ schema, database: { dbFilename: DB_PATH } });
  await db.connect({
    fetchCredentials: async () => ({
      endpoint: SYNC_URL, token,
      expiresAt: new Date(Date.now() + authData.expires_in * 1000),
    }),
    uploadData: async () => {},
  });
  await db.waitForFirstSync({ signal: AbortSignal.timeout(120000) });

  // Get all circuits from PowerSync
  const psCircuits = await db.getAll("SELECT * FROM ps_data__circuits");
  const circuitsByName = {};
  let likedCircuitUuid = null;

  console.log(`\nCircuits in your account:`);
  for (const c of psCircuits) {
    const d = JSON.parse(c.data);
    circuitsByName[d.name] = d.circuit_uuid;
    console.log(`  ${d.name} -> ${d.circuit_uuid}`);
    if (d.name === "Liked Climbs") likedCircuitUuid = d.circuit_uuid;
  }

  // Get existing circuit-climb links
  const existingLinks = new Set();
  const ccRows = await db.getAll("SELECT * FROM ps_untyped WHERE type = 'circuit_climbs'");
  for (const row of ccRows) {
    const d = JSON.parse(row.data);
    existingLinks.add(`${d.circuit_uuid}-${d.climb_uuid}`);
  }

  await db.close();

  // === Import Likes ===
  if (!circuitsOnly && likedCircuitUuid) {
    const likes = data.likes || [];
    console.log(`\n${dryRun ? "[DRY RUN] " : ""}Importing ${likes.length} likes...`);
    let ok = 0, fail = 0, skip = 0;

    for (const like of likes) {
      const uuid = climbMap[like.climb];
      if (!uuid) { fail++; continue; }
      if (existingLinks.has(`${likedCircuitUuid}-${uuid}`)) { skip++; continue; }

      if (dryRun) { ok++; console.log(`  [DRY] ${like.climb}`); continue; }

      const r = await fetch(`${API}/circuit-climbs`, {
        method: "POST", headers,
        body: JSON.stringify({ circuitUuid: likedCircuitUuid, climbUuid: uuid, position: 0 }),
      });
      if (r.ok) { ok++; existingLinks.add(`${likedCircuitUuid}-${uuid}`); } else { fail++; }
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`  Likes: ${ok} imported, ${fail} failed, ${skip} skipped`);
  } else if (!circuitsOnly) {
    console.log("\nNo 'Liked Climbs' circuit found. Like any climb in the app first.");
  }

  // === Import Circuit Climbs ===
  if (!likesOnly) {
    const circuits = data.circuits || [];
    const unmatched = [];

    console.log(`\n${dryRun ? "[DRY RUN] " : ""}Populating ${circuits.length} circuits...`);
    for (const circuit of circuits) {
      const circuitUuid = circuitsByName[circuit.name];
      if (!circuitUuid) {
        unmatched.push(circuit.name);
        continue;
      }

      let ok = 0, fail = 0, notFound = 0;
      for (let i = 0; i < circuit.climbs.length; i++) {
        const uuid = climbMap[circuit.climbs[i]];
        if (!uuid) { notFound++; continue; }
        if (existingLinks.has(`${circuitUuid}-${uuid}`)) continue;

        if (dryRun) { ok++; continue; }

        try {
          const r = await fetch(`${API}/circuit-climbs`, {
            method: "POST", headers,
            body: JSON.stringify({ circuitUuid, climbUuid: uuid, position: i }),
          });
          if (r.ok) { ok++; existingLinks.add(`${circuitUuid}-${uuid}`); } else fail++;
        } catch { fail++; }
        await new Promise(r => setTimeout(r, 150));
      }
      console.log(`  ${circuit.name}: ${ok} added, ${fail} failed, ${notFound} not found`);
    }

    if (unmatched.length > 0) {
      console.log(`\n  Circuits not found in new app (create them manually first):`);
      for (const name of unmatched) console.log(`    - ${name}`);
      console.log(`  Then re-run this script to populate them.`);
    }
  }

  console.log("\nDone!");
}

main().catch(e => { console.error(e.message); process.exit(1); });
