module.exports = {
  apps: [{
    name: 'atlas-platform',
    script: 'npm',
    args: 'run dev -- --hostname 0.0.0.0 --port 3000',
    cwd: '/var/www/atlas-platform',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    }
  }]
};