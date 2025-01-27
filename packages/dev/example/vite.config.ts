import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {viteStaticCopy} from 'vite-plugin-static-copy'
import { copy } from 'copy-vite-plugin'

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 4020,
    },
    plugins: [vue(),
        copy({
            pattern: [
                { from: '../../core/sdk/dist', to: '' },
            ]
        }),
        viteStaticCopy({
            targets: [
                {
                    src: '../../core/sdk/public/**',
                    dest: '/'
                }
            ]
        })
    ],
    assetsInclude: ['src/**/*.html']
})
