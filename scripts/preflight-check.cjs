#!/usr/bin/env node
/**
 * Medivac.ai Pre-Publish Preflight Check
 * =======================================
 * Run this before EVERY publish to catch issues that cause blank screens.
 * Exits with code 1 (blocks publish) if any check fails.
 *
 * Checks:
 *   1. All required public assets exist in dist/public
 *   2. JS bundle exists and is valid JavaScript
 *   3. No TDZ (temporal dead zone) violations in the bundle
 *   4. No localStorage / fullscreen APIs that crash inside pplx.app iframe
 *   5. index.html references assets that actually exist
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DIST = path.resolve(__dirname, "../dist/public");
const ASSETS_DIR = path.join(DIST, "assets");

let failed = false;
function fail(msg) {
  console.error(`  ❌ FAIL: ${msg}`);
  failed = true;
}
function pass(msg) {
  console.log(`  ✅ ${msg}`);
}
function section(title) {
  console.log(`\n── ${title} ──────────────────────────────────`);
}

// ── 1. Required assets ────────────────────────────────────────────────────────
section("1. Required public assets");

const REQUIRED_ASSETS = [
  "index.html",
  "aeromedical_bg.png",
  "bg_01_welcome.png",
  "bg_02_dispatch.png",
  "bg_03_compliance.png",
  "bg_04_ferry.png",
  "bg_06_nets.png",
  "bg_07_iso.png",
  "bg_08_telehealth.png",
  "bg_09_isolation.png",
  "graham_bg_portrait.png",
  "graham_bg_professional.png",
  "lordhowe_bg.jpg",
  "medivac-logo.jpg",
  "medivac_comms_bg.jpg",
  "thumb_01_welcome.png",
  "thumb_02_dispatch.png",
  "thumb_03_compliance.png",
  "thumb_04_ferry.png",
  "thumb_05_lordhowe.png",
  "thumb_06_nets.png",
  "thumb_07_iso.png",
  "thumb_08_telehealth.png",
  "thumb_09_isolation.png",
  "thumb_10_nept.png",
  "thumb_11_optimiser.png",
  "thumb_12_analyst.png",
  "video/01_welcome.mp4",
  "video/02_dispatch.mp4",
  "video/03_compliance.mp4",
  "video/04_ferry.mp4",
  "video/05_lordhowe.mp4",
  "video/06_nets.mp4",
  "video/07_iso.mp4",
  "video/08_telehealth.mp4",
  "video/09_isolation.mp4",
  "video/10_nept.mp4",
  "video/11_optimiser.mp4",
  "video/12_analyst.mp4",
  "video/jennifer_intro.mp4",
];

for (const asset of REQUIRED_ASSETS) {
  const fullPath = path.join(DIST, asset);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing asset: ${asset}`);
  } else {
    const size = fs.statSync(fullPath).size;
    if (size === 0) fail(`Zero-byte file: ${asset}`);
    else pass(`${asset} (${(size / 1024).toFixed(0)} KB)`);
  }
}

// ── 2. JS bundle exists and is valid ─────────────────────────────────────────
section("2. JS bundle validation");

const bundles = fs.existsSync(ASSETS_DIR)
  ? fs.readdirSync(ASSETS_DIR).filter((f) => f.startsWith("index-") && f.endsWith(".js"))
  : [];

if (bundles.length === 0) {
  fail("No index-*.js bundle found in dist/public/assets/");
} else {
  const bundlePath = path.join(ASSETS_DIR, bundles[0]);
  const size = fs.statSync(bundlePath).size;
  pass(`Bundle found: ${bundles[0]} (${(size / 1024 / 1024).toFixed(2)} MB)`);

  try {
    execSync(`node --check "${bundlePath}"`, { stdio: "pipe" });
    pass("Bundle is valid JavaScript");
  } catch (e) {
    fail(`Bundle failed JS syntax check: ${e.stderr?.toString()?.substring(0, 200)}`);
  }

  // ── 3. TDZ check ────────────────────────────────────────────────────────────
  section("3. TDZ (temporal dead zone) check");

  const content = fs.readFileSync(bundlePath, "utf8");

  // Find all const/let declarations and their positions
  const declPattern = /(?:const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  const usagePattern = /(?<![a-zA-Z0-9_$.'"])([a-zA-Z_$][a-zA-Z0-9_$]*)(?![a-zA-Z0-9_$'":(])\s*(?:,|\}|\]|\))/g;

  // Specific known-dangerous patterns: short variable names used in array references
  // before their const declaration in minified code
  const knownRiskyPattern = /questions:\s*([a-zA-Z]{2,4})\b/g;
  const knownRiskyDecls = {};
  let m;

  // Collect all const/let declaration positions
  const declPositions = {};
  while ((m = declPattern.exec(content)) !== null) {
    const name = m[1];
    if (!declPositions[name]) declPositions[name] = [];
    declPositions[name].push(m.index);
  }

  // Check risky usages (questions: <var>) against declaration positions
  let tdzFound = false;
  while ((m = knownRiskyPattern.exec(content)) !== null) {
    const varName = m[1];
    const usagePos = m.index;
    const decls = declPositions[varName] || [];
    const firstDecl = Math.min(...decls);
    if (decls.length > 0 && firstDecl > usagePos) {
      fail(`TDZ violation: '${varName}' used at pos ${usagePos} but declared at pos ${firstDecl}`);
      tdzFound = true;
    }
  }
  if (!tdzFound) pass("No TDZ violations detected in question arrays");

  // ── 4. Forbidden browser APIs ────────────────────────────────────────────────
  section("4. Forbidden browser API check (localStorage / fullscreen)");

  const forbidden = [
    { pattern: /localStorage\.setItem/, label: "localStorage.setItem" },
    { pattern: /localStorage\.getItem/, label: "localStorage.getItem" },
    { pattern: /localStorage\.removeItem/, label: "localStorage.removeItem" },
    { pattern: /requestFullscreen\(\)/, label: "requestFullscreen()" },
    { pattern: /document\.fullscreenElement(?!\s*===\s*false)/, label: "document.fullscreenElement (unpatched)" },
  ];

  for (const { pattern, label } of forbidden) {
    if (pattern.test(content)) {
      fail(`Unpatched API found: ${label} — run bundle patch before publishing`);
    } else {
      pass(`${label} — not present / patched`);
    }
  }
}

// ── 5. index.html asset references ───────────────────────────────────────────
section("5. index.html → asset cross-check");

const indexPath = path.join(DIST, "index.html");
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, "utf8");
  const refs = [...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    const refPath = path.join(DIST, ref);
    if (!fs.existsSync(refPath)) {
      fail(`index.html references missing file: ${ref}`);
    } else {
      pass(`index.html ref OK: ${ref}`);
    }
  }
} else {
  fail("index.html not found");
}

// ── Result ────────────────────────────────────────────────────────────────────
console.log("\n══════════════════════════════════════════════");
if (failed) {
  console.error("❌ PREFLIGHT FAILED — fix all issues above before publishing");
  process.exit(1);
} else {
  console.log("✅ ALL CHECKS PASSED — safe to publish");
  process.exit(0);
}
