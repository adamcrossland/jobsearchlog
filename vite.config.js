import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default {
    build: {
        rollupOptions: {
            output: {
                //entryFileNames: 'RobotoSlab-Regular.ttf'
            }
        }
    },
    plugins: [
        VitePWA({
            manifest: {
                name: 'Job Search Log',
                short_name: 'Job Search Log',
                start_url: '/',
                background_color: '#ffffff',
                theme_color: '#000000',
                display: 'standalone',
                icons: [
                    { src: 'jsl_192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'jsl_512x512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'android-chrome-192x192.png', size: '192x192', type: 'image/png' },
                    { src: 'android-chrome-512x512.png', size: '512x512', type: 'image/png' },
                    { src: 'apple-touch-icon.png', size: '180x180', type: 'image/png' },
                    { src: 'favicon-16x16.png', size: '16x16', type: 'image/png' },
                    { src: 'favicon-32x32.png', size: '32x32', type: 'image/png' },
                    { src: 'favicon.ico', size: '48x48', type: 'image/ico' },
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
                runtimeCaching: [
                    {
                        urlPattern: ({ request }) =>
                            request.destination === 'font',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
    ]
}