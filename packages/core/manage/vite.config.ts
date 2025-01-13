import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {viteStaticCopy} from 'vite-plugin-static-copy'

export default defineConfig({
    plugins: [react(),
        viteStaticCopy({
            targets: [
                {
                    src: '../sdk/public/**',
                    dest: '/'
                }
            ]
        })
    ],
    server: {
        host: '0.0.0.0',
        port: 6060,
    }
})
