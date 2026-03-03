import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        host: true,
        port: 3000,
        open: false
    },
    build: {
        assetsInlineLimit: 0,
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    }
});
