import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
    plugins: [solidPlugin()],
    define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
    server: {
        host: "127.0.0.1",
        port: 3000,
        watch: {
            ignored: ['**/src-tauri/target/**'],
        },
    },
    preview: { host: "127.0.0.1", port: 3000, strictPort: true },
    build: {
        target: "esnext",
    },
});
