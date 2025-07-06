module.exports = {
  apps: [
    {
      name: 'burroughs-alert-web',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      time: true,
    },
    {
      name: 'burroughs-alert-jobs',
      script: 'npx',
      args: 'tsx scripts/run-jobs.ts system-start',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/jobs-error.log',
      out_file: './logs/jobs-out.log',
      time: true,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
