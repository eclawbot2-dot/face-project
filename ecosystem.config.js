module.exports = {
  apps: [
    {
      name: "face-project",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3100",
      cwd: "C:\\Users\\bot\\Projects\\face-project",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
        DATABASE_URL: "file:./prisma/dev.db",
        AUTH_SECRET: "holy-face-church-secret-key-change-in-production-2024",
        NEXTAUTH_SECRET: "holy-face-church-secret-key-change-in-production-2024",
        NEXTAUTH_URL: "https://face.jahdev.com",
        AUTH_TRUST_HOST: "true",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
