import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {viteStaticCopy} from "vite-plugin-static-copy";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig((env) => {
    const isBuild = env.command === 'build';

    let buildTargets = [
        // {
        //     src: '..//sdk/dist/@babylonjs',
        //     dest: './'
        // },
        {
            src: '../sdk/public/hdr',
            dest: './'
        },
        {
            src: '../sdk/public/particleTexture',
            dest: './'
        },
        {
            src: '../sdk/public/texture',
            dest: './'
        },
        {
            src: '../sdk/public/wasm',
            dest: './'
        },
    ]

    let serveTargets = [     {
        src: '../sdk/public/**',
        dest: '/'
    }]

    return {
        server: {
            host: '0.0.0.0',
            port: 4020,
        },
        plugins: [
            react(),
            tailwindcss(),
            viteStaticCopy({
                targets: isBuild ? buildTargets : serveTargets,
            })
        ],
    }
})
