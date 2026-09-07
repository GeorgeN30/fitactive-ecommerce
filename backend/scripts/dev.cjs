const path = require("path");
const { spawnSync, spawn } = require("child_process");
const net = require("net");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(rootDir, ".env") });

const binDir = path.join(__dirname, "..", "node_modules", ".bin");
const prismaBin = path.join(binDir, process.platform === "win32" ? "prisma.cmd" : "prisma");
const tsNodeDevBin = path.join(
  binDir,
  process.platform === "win32" ? "ts-node-dev.cmd" : "ts-node-dev"
);

const backendDir = path.join(rootDir, "backend");
const port = Number(process.env.PORT || 4000);

function isPortInUse(portNumber, callback) {
  const socket = net.createConnection({ host: "127.0.0.1", port: portNumber });
  let handled = false;

  const finish = (inUse) => {
    if (handled) return;
    handled = true;
    socket.destroy();
    callback(inUse);
  };

  socket.once("connect", () => finish(true));
  socket.once("error", () => finish(false));
}

function startDevelopment() {
  const resetOnStart = process.argv.includes("--reset") || process.env.RESET_DB_ON_START === "true";
  const migrationArgs = resetOnStart
    ? ["migrate", "reset", "--force", "--skip-generate"]
    : ["migrate", "deploy"];

  console.log(resetOnStart ? "Resetting development database..." : "Running pending database migrations...");
  const migration = spawnSync(prismaBin, migrationArgs, {
    cwd: backendDir,
    env: process.env,
    stdio: "inherit",
    shell: true,
  });

  if (migration.error || migration.status !== 0) {
    console.error("Database migration failed. Server was not started.");
    process.exit(migration.status || 1);
  }

  console.log("Synchronizing development accounts...");
  const seed = spawnSync(tsNodeDevBin, ["--transpile-only", "prisma/seed.ts"], {
    cwd: backendDir,
    env: process.env,
    stdio: "inherit",
    shell: true,
  });

  if (seed.error || seed.status !== 0) {
    console.error("Development seed failed. Server was not started.");
    process.exit(seed.status || 1);
  }

  const server = spawn(tsNodeDevBin, ["--respawn", "--transpile-only", "src/index.ts"], {
    cwd: backendDir,
    env: process.env,
    stdio: "inherit",
    shell: true,
  });

  process.on("SIGINT", () => server.kill("SIGINT"));
  process.on("SIGTERM", () => server.kill("SIGTERM"));
  server.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}

isPortInUse(port, (inUse) => {
  if (inUse) {
    console.error(`Port ${port} is already in use. Stop the previous backend process and run this command again.`);
    process.exit(1);
  }

  startDevelopment();
});
