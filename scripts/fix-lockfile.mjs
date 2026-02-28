import { execSync } from "child_process";

try {
  console.log("Regenerating pnpm-lock.yaml...");
  execSync("pnpm install --no-frozen-lockfile", {
    cwd: "/vercel/share/v0-project",
    stdio: "inherit",
  });
  console.log("Lockfile updated successfully.");
} catch (e) {
  console.error("Failed:", e.message);
  process.exit(1);
}
