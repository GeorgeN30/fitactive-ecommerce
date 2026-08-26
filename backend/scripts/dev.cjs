const path = require("path");
const { spawnSync, spawn } = require("child_process");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(rootDir, ".env") });

const binDir = path.join(__dirname, "..", "node_modules", ".bin");
const prismaBin = path.join(binDir, process.platform === "win32" ? "prisma.cmd" : "prisma");
const tsNodeDevBin = path.join(
  binDir,
  process.platform === "win32" ? "ts-node-dev.cmd" : "ts-node-dev"
);

console.log("Running pending database migrations...");
const migration = spawnSync(prismaBin, ["db", "push", "--accept-data-loss", "--skip-generate"], {
  cwd: path.join(rootDir, "backend"),
  env: process.env,
  stdio: "inherit",
  shell: true,
});

if (migration.error || migration.status !== 0) {
  console.error("Database migration failed. Server was not started.");
  process.exit(migration.status || 1);
}

const server = spawn(tsNodeDevBin, ["--respawn", "--transpile-only", "src/index.ts"], {
  cwd: path.join(rootDir, "backend"),
  env: process.env,
  stdio: "inherit",
  shell: true,
});

process.on("SIGINT", () => server.kill("SIGINT"));
process.on("SIGTERM", () => server.kill("SIGTERM"));
server.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
