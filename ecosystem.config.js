module.exports = {
  apps: [
    {
      name: 'face-project',
      script: 'node_modules/.bin/next',
      args: 'start -p 3100',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
        DATABASE_URL: 'file:./prisma/dev.db',
        NEXTAUTH_SECRET: 'holy-face-church-secret-key-change-in-production-2024',
        NEXTAUTH_URL: 'https://face.jahdev.com',
      },
    },
  ],
};
