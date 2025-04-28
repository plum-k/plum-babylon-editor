import {defineConfig, PluginOption} from 'vite'

function myPlugin(): PluginOption {
    return {
        enforce: "pre",
        name: 'exclude-plugin',
        resolveId(source) {
            // console.log(source)
            if (source.includes('@babylonjs/loaders/glTF/index.js')
                || source.includes('@babylonjs/core/Debug/debugLayer')
                || source.includes('@babylonjs/inspector')
            ) {
                console.log("exclude-plugin", source)
                return {id: source, external: true}; // 将其标记为外部
            }
            return null; // 继续解析其他模块
        }
    }
}

export default defineConfig({
    plugins: [myPlugin()],
    build: {
        lib: {
            entry: './src/index.ts',
            fileName: "plum-render-babylon-sdk",
            formats: ["es"]
        },
        minify: "esbuild",
        rollupOptions: {
            plugins: [],
            external: [
                "@babylonjs/core",
                "@babylonjs/addons",
                "@babylonjs/loaders",
                "@babylonjs/materials",
                "@babylonjs/serializers",
                "@babylonjs/havok",
                "@babylonjs/inspector",
            ],
        }
    },
})
