module.exports = {
  apps: [
    {
      name: "face-id-front",
      script: "npx",
      args: "serve -s dist -l 8567",
      cwd: "/var/www/workers/face_data_admin_front",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
    },
  ],
};
