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
    input: "../../../node_modules/@babylonjs/core/index.js",
    output: [
        {
            // dir: "dist",
            // name: "plum-render-babylon-sdk",
            file: "dist/aaa.js",

            format: "module",
            // inlineDynamicImports:true,
            // plugins: [
            // terser()
            // ]
            // banner
        },
        // {
        //     // globals: {
        //     //   "class-validator": "class-validator" // 指明 global.vue 即是外部依赖 vue
        //     // },
        //     format: "module",
        //     file: `lib/plum-render-api-babylon.${pkg.version}.min.js`,
        //     plugins: [
        //         // terser()
        //     ]
        // },
    ],
    plugins: [
        commonjs(),
        json(),
        resolve(),
        esbuild({
            // minify: true
            // tsconfig: path.resolve(__dirname, "./tsconfig.json"),
        }),
        visualizer({
            open: false, // 自动打开生成的报告
        })
    ],
    // external: ["@babylonjs/havok", "babylon-htmlmesh", "@babylonjs/core", "@babylonjs/inspector", "@babylonjs/loaders", "@babylonjs/materials", "@babylonjs/serializers"],
    // watch: {
    //     include: "src/**", // 监听的文件
    //     clearScreen: false, // 设置为 false 以防止每次重建时清屏
    // },
});


