const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

const SKIP = new Set(["dist", "node_modules", ".git", ".github"]);

const VIEWPORT =
  '<meta name="viewport" content="width=device-width, initial-scale=1">';

function shouldSkip(name) {
  return SKIP.has(name) || name === "build.js";
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function injectViewport(html) {
  if (/name=["']viewport["']/i.test(html)) return html;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (tag) => `${tag}\n  ${VIEWPORT}`);
  }

  if (/<html[^>]*>/i.test(html)) {
    return html.replace(
      /<html[^>]*>/i,
      (tag) => `${tag}\n<head>\n  ${VIEWPORT}\n</head>`
    );
  }

  return `<!DOCTYPE html>\n<html>\n<head>\n  ${VIEWPORT}\n</head>\n${html}`;
}

function processHtml(srcPath, destPath) {
  const html = fs.readFileSync(srcPath, "utf8");
  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, injectViewport(html));
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