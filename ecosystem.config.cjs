module.exports = {
    apps: [
        {
            name: "dokumentasi-rohis",
            script: "./dist/server/entry.mjs",
            interpreter: "node",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "512M",
            env: {
                NODE_ENV: "production",
                HOST: "0.0.0.0",
                PORT: 4321,
            },
        },
    ],
};