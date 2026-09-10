const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

const SKIP = new Set(["dist", "node_modules", ".git", ".github"]);

const VIEWPORT =
  '<meta name="viewport" content="width=device-width, initial-scale=1">';

const MOBILE_CSS = `
<style data-mobile-fix="1">
* { box-sizing: border-box; }
img, video { max-width: 100%; height: auto; }

@media (max-width: 700px), (max-height: 500px) {
  html, body {
    height: auto !important;
    min-height: 100svh;
    overflow: auto !important;
    overflow-x: hidden !important;
    background-position: center top !important;
  }

  .layout,
  .play-section,
  .matrix-link {
    position: static !important;
    transform: none !important;
    top: auto !important;
    left: auto !important;
  }

  .layout {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 20px !important;
    width: 100% !important;
    margin-top: 40vh;
    padding: 16px 12px 28px !important;
  }

  .col {
    width: auto !important;
    min-width: 220px;
  }

  .title { white-space: normal !important; font-size: 1.2rem !important; }
}
</style>
`.trim();

function shouldSkip(name) {
  return SKIP.has(name) || name === "build.js";
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function inject(html) {
  if (!/name=["']viewport["']/i.test(html)) {
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (tag) => `${tag}\n  ${VIEWPORT}`);
    }
  }

  if (!/data-mobile-fix="1"/.test(html)) {
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `  ${MOBILE_CSS}\n</head>`);
    } else {
      html = MOBILE_CSS + html;
    }
  }

  return html;
}

function processHtml(srcPath, destPath) {
  const html = fs.readFileSync(srcPath, "utf8");
  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, inject(html));
  console.log("built", path.relative(ROOT, destPath));
}

function copyFile(srcPath, destPath) {
  ensureDir(path.dirname(destPath));
  fs.copyFileSync(srcPath, destPath);
}

function walk(srcDir, destDir) {
  for (const name of fs.readdirSync(srcDir)) {
    if (shouldSkip(name)) continue;

    const srcPath = path.join(srcDir, name);
    const destPath = path.join(destDir, name);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      walk(srcPath, destPath);
    } else if (name.toLowerCase().endsWith(".html")) {
      processHtml(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
ensureDir(DIST);
walk(ROOT, DIST);
console.log("Done. Output is in /dist");