import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {viteStaticCopy} from 'vite-plugin-static-copy'

export default defineConfig((env) => {
    console.log(env)
    const isBuild = env.command === 'build';
    console.log(isBuild)

    let buildTargets = [
        {
            src: '../../core/sdk/dist/@babylonjs',
            dest: './@babylonjs'
        },
        {
            src: '../../core/sdk/dist/hdr',
            dest: './hdr'
        },
        {
            src: '../../core/sdk/dist/particleTexture',
            dest: './particleTexture'
        },
        {
            src: '../../core/sdk/dist/texture',
            dest: './texture'
        },
        {
            src: '../../core/sdk/dist/wasm',
            dest: './wasm'
        },
        {
            src: '../../core/sdk/dist/plum-render-babylon-sdk.js',
            dest: './'
        }
    ]

    let serveTargets = [{
        src: '../../core/sdk/dist/**',
        dest: ''
    }]

    return {
        server: {
            host: '0.0.0.0',
            port: 4020,
        },
        plugins: [vue(),
            viteStaticCopy({
                targets: isBuild ? buildTargets : serveTargets,
            })
        ],
        assetsInclude: ['src/**/*.html']
    }
})


