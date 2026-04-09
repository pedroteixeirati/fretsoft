module.exports = {
  apps: [
    {
      name: 'fretsoft-api',
      cwd: '/var/www/fretsoft',
      script: 'npm',
      args: 'run start:api',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3001',
      },
    },
  ],
};
