const { execSync } = require("child_process");

console.log("Regenerating pnpm-lock.yaml...");
try {
  execSync("pnpm install --no-frozen-lockfile", {
    cwd: "/vercel/share/v0-project",
    stdio: "inherit",
  });
  console.log("Lockfile regenerated successfully.");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
