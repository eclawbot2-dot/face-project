// PM2 process config.
// Run from the project root: `pm2 start ecosystem.config.js`.
// Secrets (AUTH_SECRET, NEXTAUTH_SECRET, DATABASE_URL) are loaded by Next.js
// from .env.local — see .env.example for the required keys. Do NOT add secrets
// to this file; it is committed to source control.

const path = require("path");

module.exports = {
  apps: [
    {
      name: "face-project",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3100",
      cwd: __dirname,
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
        NEXTAUTH_URL: "https://face.jahdev.com",
        AUTH_TRUST_HOST: "true",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      out_file: path.join(__dirname, "logs", "out.log"),
      error_file: path.join(__dirname, "logs", "err.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
