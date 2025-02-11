# plum-babylon-editor

## 项目概述

`plum-babylon-editor` 是一个基于 `babylon` 的三维编辑器项目, 可快速的搭建和开发三维项目。

## 在线访问

|       |                                  |
|-------|----------------------------------|
| 编辑器   | https://babylon.plumk.cn/        |
| 文档    | https://docbabylon.plumk.cn/     |
| sdk示例 | https://examplebabylon.plumk.cn/ |

## 项目结构

### [核心](./packages/core)(`core`)

#### [编辑器](./packages/core/editor/README.md)(`packages/core/editor`)

基于 `sdk` 的开发三维编辑器，为三维场景的创建和编辑提供基础支持。

#### [sdk](./packages/core/sdk/README.md) (`packages/core/sdk`)

对 babylon.js 进行了二次封装，提供了一系列工具和组件，方便开发。

#### [服务端](./packages/core/server/README.md) (`packages/core/server`)

编辑器的服务端，只提供最基础的应用管理功能，为编辑器的运行提供后端支持。

### 相关包(`dev`)

#### [调试工具](./packages/dev/debug/README.md) (`packages/dev/debug`)

通过 module 引用的方式，直接在页面调试 `@plum-render/babylon-sdk`，方便开发者进行调试和测试。

#### [文档](./packages/dev/document/README.md) (`packages/dev/document`)

基于 docusaurus 编写的编辑器和sdk的文档网站。

#### [示例工程](./packages/dev/example/README.md) (`packages/dev/example`)

sdk 使用的相关示例工程。

#### [存储api](./packages/dev/oss-api/README.md) (`packages/core/oss-api`)

对阿里云 oss 存储的封装。

### 第三方库(`packages/third`)

#### [@babylonjs/addons](./packages/third/addons/README.md)(`packages/third/addons`)

修改了 `index.js` 的导出内容

## 快速开始

```shell
git clone https://github.com/plum-k/plum-babylon-editor.git
cd plum-babylon-editor
bun install
```

## 为什么要做 plum-babylon-editor

创建 Plum-Babylon-Editor 的目的是为了解决当前使用 Unreal Engine（UE）或 OSG 开发项目的高成本问题，同时 WebGPU 技术已经成熟，许多项目需要向 Web 端迁移。

在过去，桌面端三维项目通常通过 UE 或 Unity 直接打包成可执行文件发布。然而，随着国产化和三维仿真的需求增加，UE 和 Unity 当时并没有提供 Cesium for Unreal 和 Cesium for Unity 这两个插件，而国产化适配也相对复杂。因此，我选择将项目转为 Qt 中嵌入 OSGEarth，并使用 QML 开发界面，利用 OSG 构建三维场景。

随着需求的发展，浏览器端的展示变得必要，于是再次回到 UE，使用其像素流推流插件将 WebRTC 视频流推送到前端。

在经历了多种三维应用后，并深入了解各种业务需求，我意识到对三维构建工具的要求主要包括：

- **快速开发**:
    - 使用 UE 的 UMG 或 Qt 的 QML 开发界面以还原设计图的速度较慢，尤其在制作统计图表时，过程十分繁琐。
    - C++ 开发大型项目时，每次运行和构建都需要较长时间，尽管 UE5 引入了热重载。
- **多端访问**:
    - 只需安装一个浏览器即可访问三维系统，无需额外安装软件。
    - 虽然 UE 支持云渲染推流以实现浏览器访问，但成本较高，通常一张显卡只能支持三路视频流。
    - qt 可以通过 emcc 编译成 wasm 浏览器运行, 但是坑太多了。
- **国产化**:
    - UE 和 OSG 同时打包发布到 Windows 或 Linux 时，需要处理各类兼容性问题。
    - WebGPU 只需浏览器支持，无需适配多种操作系统。
- **系统集成**:
    - Qt 可以使用 QtWebEngine 进行集成，其他 Web 系统可直接使用 iframe。
    - 还可以使用 Electron 将其打包为桌面程序。

明确了这些要求后，我决定使用 Web 端三维技术，仿照之前用 UE 或 Qt + OSG 开发的项目，来构建 Web 版本的三维构建工具。

## plum-babylon-editor 当前的状态

现在版本的 `plum-babylon-editor` 是在2022年6月 babylon.js 发布 5.0 刚支持 webGpu 时写的预研项目基础上开发的, 目前正在重构和添加新的功能。

预计到今年6月初发布第一个版本。

## 为什么选取 babylon.js 作为基础框架

在流行的 Web 端三维框架中，Three.js 和 Babylon.js 是最常用的两个。然而，Babylon.js 更类似于 Unreal Engine（UE），并且自带粒子系统和物理系统。

Babylon.js 的粒子系统能够直接使用 UE 或 Houdini 导出的特效帧序列图，而其物理系统也非常易于使用，无需像 Three.js 一样依赖第三方库。

最重要的一点是，Babylon.js 在浏览器不支持 WebGPU 时，能够自动降级到 WebGL2 渲染，而 Three.js 则需要编写额外的兼容代码

