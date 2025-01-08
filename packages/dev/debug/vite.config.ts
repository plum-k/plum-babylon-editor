import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy'

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 4030,
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: '../../core/sdk/public/**',
                    dest: '/'
                }
            ]
        })
    ],
});