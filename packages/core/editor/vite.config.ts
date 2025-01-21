import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {viteStaticCopy} from "vite-plugin-static-copy";

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 4010,
    },
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                {
                    src: '../sdk/public/**',
                    dest: '/'
                }
            ]
        })
    ],
})
