import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        'process.env': {
            NODE_ENV: 'production',
        },
    },
    build: {
        lib: {
            entry: './src/index.ts',
            name: 'json-viewer',
            fileName: (format) => `json-viewer.${format}.js`,
        },
        target: 'esnext',
    },
})
