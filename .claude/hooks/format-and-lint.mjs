// Hook PostToolUse: formatea con Prettier y corrige con ESLint cada archivo
// que Claude crea o edita dentro de este proyecto.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const projectDir = path.resolve(
  process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
);
const IGNORED_DIRS = ["node_modules", ".next", "out", "build", ".git"];
const ESLINT_EXTS = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
]);

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

const filePath = JSON.parse(raw || "{}").tool_input?.file_path;
if (!filePath) process.exit(0);

const absPath = path.resolve(projectDir, filePath);
const relPath = path.relative(projectDir, absPath);
// Solo archivos del proyecto, fuera de carpetas generadas.
if (
  relPath.startsWith("..") ||
  path.isAbsolute(relPath) ||
  !existsSync(absPath)
)
  process.exit(0);
if (relPath.split(path.sep).some((part) => IGNORED_DIRS.includes(part)))
  process.exit(0);

const run = (bin, args) =>
  spawnSync(process.execPath, [path.join(projectDir, bin), ...args], {
    cwd: projectDir,
    encoding: "utf8",
  });

const problems = [];

// Limpia espacios en blanco en cualquier archivo de texto (binarios excluidos):
// espacios al final de línea, líneas en blanco repetidas y al inicio/fin.
const content = readFileSync(absPath);
if (!content.includes(0)) {
  const text = content.toString("utf8");
  // En Markdown, dos espacios al final de línea son un salto de línea.
  const isMarkdown = /\.mdx?$/i.test(absPath);
  const cleaned =
    text
      .replace(/\r\n/g, "\n")
      .replace(isMarkdown ? /[ \t]+(?= {2}$)|^[ \t]+$/gm : /[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\n+|\n+$/g, "") + "\n";
  if (cleaned !== text) writeFileSync(absPath, cleaned);
}

const prettier = run("node_modules/prettier/bin/prettier.cjs", [
  "--write",
  "--ignore-unknown",
  absPath,
]);
if (prettier.status !== 0)
  problems.push(`Prettier:\n${prettier.stderr || prettier.stdout}`);

if (ESLINT_EXTS.has(path.extname(absPath).toLowerCase())) {
  const eslint = run("node_modules/eslint/bin/eslint.js", [
    "--cache",
    "--cache-location",
    ".next/cache/eslint/",
    "--fix",
    "--no-warn-ignored",
    absPath,
  ]);
  if (eslint.status !== 0)
    problems.push(`ESLint:\n${eslint.stdout || eslint.stderr}`);
}

if (problems.length) {
  // Exit 2: el stderr se le devuelve a Claude para que corrija los errores.
  console.error(`Problemas en ${relPath}:\n\n${problems.join("\n\n")}`);
  process.exit(2);
}
