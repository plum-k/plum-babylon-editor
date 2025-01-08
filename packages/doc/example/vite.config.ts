import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {viteStaticCopy} from 'vite-plugin-static-copy'
// https://vite.dev/config/
export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 4020,
    },
    plugins: [vue(),
        viteStaticCopy({
            targets: [
                {
                    src: '../../sdk/public/**',
                    dest: '/'
                }
            ]
        })
    ],
    assetsInclude: ['src/**/*.html'], // 添加更多的文件类型
})
