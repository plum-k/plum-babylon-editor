import resolve from "@rollup/plugin-node-resolve";
import {defineConfig} from "rollup";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild"
import {readFileSync} from "node:fs"
import {visualizer} from "rollup-plugin-visualizer";

const pkg = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url)).toString(),
)
// import path from "path"
const year = new Date().getFullYear();

const time = new Date().toLocaleString()

export default defineConfig({
    input: "./src/index.ts",
    output: [
        {
            file: "public/plum-render-babylon-sdk.js",
            format: "module",
            // inlineDynamicImports: true,
        },
    ],
    plugins: [
        {
            name: 'exclude-plugin',
            resolveId(source) {
                // console.log(    source)
                if (source.includes('@babylonjs/loaders/glTF/index.js')) {
                    return { id: source, external: true }; // 将其标记为外部
                }
                return null; // 继续解析其他模块
            }
        },
        commonjs(),
        json(),
        resolve(),
        esbuild({
            // minify: true
            // tsconfig: path.resolve(__dirname, "./tsconfig.json"),
        }),
        // visualizer({
        //     open: false, // 自动打开生成的报告
        // })
    ],

    external: ["@babylonjs/havok", "@babylonjs/addons", "@babylonjs/core", "@babylonjs/inspector", "@babylonjs/loaders", "@babylonjs/materials", "@babylonjs/serializers"],
    watch: {
        include: "src/**", // 监听的文件
        clearScreen: false, // 设置为 false 以防止每次重建时清屏
    },
});


