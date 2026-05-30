// One-off helper: runs a .sql file against the Supabase project via the
// Management API. Usage: node scripts/run-sql.mjs <path-to-sql>
import { readFileSync } from "node:fs";

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_REF;
const file = process.argv[2];

if (!PAT || !REF || !file) {
  console.error("Need SUPABASE_PAT, SUPABASE_REF env and a file arg.");
  process.exit(1);
}

const query = readFileSync(file, "utf8");

const res = await fetch(
  `https://api.supabase.com/v1/projects/${REF}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  }
);

const text = await res.text();
console.log("HTTP", res.status);
console.log(text.slice(0, 4000));
process.exit(res.ok ? 0 : 1);
