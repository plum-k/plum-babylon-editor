import {Component, IComponentOptions} from "./Component";
import {EngineInstrumentation, SceneInstrumentation} from "@babylonjs/core";

export interface IStatisticsOptions extends IComponentOptions {
}

export interface SceneStatistics {
    // 总数量统计
    totalMeshes: number; // 总网格数量
    activeMeshes: number; // 活动网格数量
    activeIndices: number; // 活动索引数量
    activeFaces: number; // 活动面数量
    activeBones: number; // 活动骨骼数量
    activeParticles: number; // 活动粒子数量
    drawCalls: number; // 绘制调用次数
    totalLights: number; // 总灯光数量
    totalVertices: number; // 总顶点数量
    totalMaterials: number; // 总材质数量
    totalTextures: number; // 总纹理数量

    // 时间相关 都是 ms
    absoluteFPS: number; // 绝对 FPS
    meshesSelectionTime: number; // 网格选择时间
    renderTargetsTime: number; // 渲染目标时间
    particlesTime: number; // 粒子时间
    spritesTime: number; // 精灵时间
    animationsTime: number; // 动画时间
    physicsTime: number; // 物理时间
    renderTime: number; // 渲染时间
    frameTotalTime: number; // 帧总时间
    interFrameTime: number; // 帧间时间
    gpuFrameTime: number; // GPU 帧时间
    gpuFrameTimeAverage: number; // GPU 帧时间 (平均)

    // 系统
    resolution: string; // 分辨率
    hardwareScalingLevel: number; // 硬件缩放级别
    engineDescription: string; // 引擎描述
    stdDerivatives: boolean; // 标准导数
    compressedTextures: boolean; // 压缩纹理
    hardwareInstances: boolean; // 硬件实例
    textureFloat: boolean; // 纹理浮点
    textureHalfFloat: boolean; // 纹理半浮点
    renderToTextureFloat: boolean; // 渲染到纹理浮点
    renderToTextureHalfFloat: boolean; // 渲染到纹理半浮点
    uintIndices: boolean; // 32 位索引
    fragmentDepthSupported: boolean; // 片段深度
    highPrecisionShaderSupported: boolean; // 高精度着色器
    drawBuffersExtension: boolean; // 绘制缓冲区扩展
    vertexArrayObject: boolean; // 顶点数组对象
    timerQuery: boolean; // 定时器查询
    stencilEnable: boolean; // 模板
    parallelShaderCompile: boolean; // 并行着色器编译
    maxTexturesImageUnits: number; // 最大纹理单元
    maxTextureSize: number; // 最大纹理尺寸
    maxAnisotropy: number; // 最大各向异性
    driverInfo: string; // 驱动信息
}

export class Statistics extends Component {
    // 总数量统计
    totalMeshes = 0; // 总网格数量
    activeMeshes = 0; // 活动网格数量
    activeIndices = 0; // 活动索引数量
    activeFaces = 0; // 活动面数量
    activeBones = 0; // 活动骨骼数量
    activeParticles = 0; // 活动粒子数量
    drawCalls = 0; // 绘制调用次数
    totalLights = 0; // 总灯光数量
    totalVertices = 0; // 总顶点数量
    totalMaterials = 0; // 总材质数量
    totalTextures = 0; // 总纹理数量

    // 时间相关 都是 ms
    absoluteFPS = 0; // 绝对 FPS
    meshesSelectionTime = 0; // 网格选择时间
    renderTargetsTime = 0; // 渲染目标时间
    particlesTime = 0; // 粒子时间
    spritesTime = 0; // 精灵时间
    animationsTime = 0; // 动画时间
    physicsTime = 0; // 物理时间
    renderTime = 0; // 渲染时间
    frameTotalTime = 0; // 帧总时间
    interFrameTime = 0; // 帧间时间
    gpuFrameTime = 0; // GPU 帧时间
    gpuFrameTimeAverage = 0; // GPU 帧时间 (平均)

    // 系统
    resolution = ""; // 分辨率
    hardwareScalingLevel = 0; // 硬件缩放级别
    engineDescription = ""; // 引擎描述
    stdDerivatives = false; // 标准导数
    compressedTextures = false; // 压缩纹理
    hardwareInstances = false; // 硬件实例
    textureFloat = false; // 纹理浮点
    textureHalfFloat = false; // 纹理半浮点
    renderToTextureFloat = false; // 渲染到纹理浮点
    renderToTextureHalfFloat = false; // 渲染到纹理半浮点
    uintIndices = false; // 32 位索引
    fragmentDepthSupported = false; // 片段深度
    highPrecisionShaderSupported = false; // 高精度着色器
    drawBuffersExtension = false; // 绘制缓冲区扩展
    vertexArrayObject = false; // 顶点数组对象
    timerQuery = false; // 定时器查询
    stencilEnable = false; // 模板
    parallelShaderCompile = false; // 并行着色器编译
    maxTexturesImageUnits = 0; // 最大纹理单元
    maxTextureSize = 0; // 最大纹理尺寸
    maxAnisotropy = 0; // 最大各向异性
    driverInfo = ""; // 驱动信息

    sceneInstrumentation!: SceneInstrumentation;
    engineInstrumentation!: EngineInstrumentation;


    constructor(options: IStatisticsOptions) {
        super(options);
    }

    init() {
        if (this.sceneInstrumentation && this.engineInstrumentation) {
            return;
        }
        this.sceneInstrumentation = new SceneInstrumentation(this.scene);
        this.sceneInstrumentation.captureActiveMeshesEvaluationTime = true;
        this.sceneInstrumentation.captureRenderTargetsRenderTime = true;
        this.sceneInstrumentation.captureFrameTime = true;
        this.sceneInstrumentation.captureRenderTime = true;
        this.sceneInstrumentation.captureInterFrameTime = true;
        this.sceneInstrumentation.captureParticlesRenderTime = true;
        this.sceneInstrumentation.captureSpritesRenderTime = true;
        this.sceneInstrumentation.capturePhysicsTime = true;
        this.sceneInstrumentation.captureAnimationsTime = true;

        this.engineInstrumentation = new EngineInstrumentation(this.scene.getEngine());
        this.engineInstrumentation.captureGPUFrameTime = true;
    }

    getInfo(): SceneStatistics {
        return {
            totalMeshes: this.totalMeshes, // 总网格数量
            activeMeshes: this.activeMeshes, // 活动网格数量
            activeIndices: this.activeIndices, // 活动索引数量
            activeFaces: this.activeFaces, // 活动面数量
            activeBones: this.activeBones, // 活动骨骼数量
            activeParticles: this.activeParticles, // 活动粒子数量
            drawCalls: this.drawCalls, // 绘制调用次数
            totalLights: this.totalLights, // 总灯光数量
            totalVertices: this.totalVertices, // 总顶点数量
            totalMaterials: this.totalMaterials, // 总材质数量
            totalTextures: this.totalTextures, // 总纹理数量
//
            absoluteFPS: this.absoluteFPS, // 绝对 FPS
            meshesSelectionTime: this.meshesSelectionTime, // 网格选择时间
            renderTargetsTime: this.renderTargetsTime, // 渲染目标时间
            particlesTime: this.particlesTime, // 粒子时间
            spritesTime: this.spritesTime, // 精灵时间
            animationsTime: this.animationsTime, // 动画时间
            physicsTime: this.physicsTime, // 物理时间
            renderTime: this.renderTime, // 渲染时间
            frameTotalTime: this.frameTotalTime, // 帧总时间
            interFrameTime: this.interFrameTime, // 帧间时间
            gpuFrameTime: this.gpuFrameTime, // GPU 帧时间
            gpuFrameTimeAverage: this.gpuFrameTimeAverage, // GPU 帧时间 (平均)
//
            resolution: this.resolution, // 分辨率
            hardwareScalingLevel: this.hardwareScalingLevel, // 硬件缩放级别
            engineDescription: this.engineDescription, // 引擎描述
            stdDerivatives: this.stdDerivatives, // 标准导数
            compressedTextures: this.compressedTextures, // 压缩纹理
            hardwareInstances: this.hardwareInstances, // 硬件实例
            textureFloat: this.textureFloat, // 纹理浮点
            textureHalfFloat: this.textureHalfFloat, // 纹理半浮点
            renderToTextureFloat: this.renderToTextureFloat, // 渲染到纹理浮点
            renderToTextureHalfFloat: this.renderToTextureHalfFloat, // 渲染到纹理半浮点
            uintIndices: this.uintIndices, // 32 位索引
            fragmentDepthSupported: this.fragmentDepthSupported, // 片段深度
            highPrecisionShaderSupported: this.highPrecisionShaderSupported, // 高精度着色器
            drawBuffersExtension: this.drawBuffersExtension, // 绘制缓冲区扩展
            vertexArrayObject: this.vertexArrayObject, // 顶点数组对象
            timerQuery: this.timerQuery, // 定时器查询
            stencilEnable: this.stencilEnable, // 模板
            parallelShaderCompile: this.parallelShaderCompile, // 并行着色器编译
            maxTexturesImageUnits: this.maxTexturesImageUnits, // 最大纹理单元
            maxTextureSize: this.maxTextureSize, // 最大纹理尺寸
            maxAnisotropy: this.maxAnisotropy, // 最大各向异性
            driverInfo: this.driverInfo, // 驱动信息
        }

    }

    update() {
        this.updateSceneStats();
        this.updatePerformanceStats();
        this.updateEngineInfo();
    }

    updateSceneStats() {
        this.totalMeshes = this.scene.meshes.length;
        this.activeMeshes = this.scene.getActiveMeshes().length;
        this.activeIndices = this.scene.getActiveIndices();
        this.activeFaces = this.scene.getActiveIndices() / 3;
        this.activeBones = this.scene.getActiveBones();
        this.activeParticles = this.scene.getActiveParticles();
        this.drawCalls = this.sceneInstrumentation.drawCallsCounter.current;
        this.totalLights = this.scene.lights.length;
        this.totalVertices = this.scene.getTotalVertices();
        this.totalMaterials = this.scene.materials.length;
        this.totalTextures = this.scene.textures.length;
    }

    updatePerformanceStats() {
        this.absoluteFPS = 1000.0 / this.sceneInstrumentation!.frameTimeCounter.lastSecAverage;
        this.meshesSelectionTime = this.sceneInstrumentation.activeMeshesEvaluationTimeCounter.lastSecAverage;
        this.renderTargetsTime = this.sceneInstrumentation.renderTargetsRenderTimeCounter.lastSecAverage;
        this.particlesTime = this.sceneInstrumentation.particlesRenderTimeCounter.lastSecAverage;
        this.spritesTime = this.sceneInstrumentation.spritesRenderTimeCounter.lastSecAverage;
        this.animationsTime = this.sceneInstrumentation.animationsTimeCounter.lastSecAverage;
        this.physicsTime = this.sceneInstrumentation.physicsTimeCounter.lastSecAverage;
        this.renderTime = this.sceneInstrumentation.renderTimeCounter.lastSecAverage;
        this.frameTotalTime = this.sceneInstrumentation.frameTimeCounter.lastSecAverage;
        this.interFrameTime = this.sceneInstrumentation.interFrameTimeCounter.lastSecAverage;
        this.gpuFrameTime = this.engineInstrumentation.gpuFrameTimeCounter!.lastSecAverage * 0.000001;
        this.gpuFrameTimeAverage = this.engineInstrumentation.gpuFrameTimeCounter!.average * 0.000001;
    }

    updateEngineInfo() {
        const caps = this.engine.getCaps();

        this.resolution = this.engine.getRenderWidth() + "x" + this.engine.getRenderHeight();
        this.hardwareScalingLevel = this.engine.getHardwareScalingLevel();
        this.engineDescription = this.engine.description;
        this.stdDerivatives = caps.standardDerivatives;
        this.compressedTextures = caps.s3tc !== undefined;
        this.hardwareInstances = caps.instancedArrays;
        this.textureFloat = caps.textureFloat;
        this.textureHalfFloat = caps.textureHalfFloat;
        this.renderToTextureFloat = caps.textureFloatRender;
        this.renderToTextureHalfFloat = caps.textureHalfFloatRender;
        this.uintIndices = caps.uintIndices;
        this.fragmentDepthSupported = caps.fragmentDepthSupported;
        this.highPrecisionShaderSupported = caps.highPrecisionShaderSupported;
        this.drawBuffersExtension = caps.drawBuffersExtension;
        this.vertexArrayObject = caps.vertexArrayObject;
        this.timerQuery = caps.timerQuery !== undefined;
        this.stencilEnable = this.engine.isStencilEnable;
        this.parallelShaderCompile = caps.parallelShaderCompile != null;
        this.maxTexturesImageUnits = caps.maxTexturesImageUnits;
        this.maxTextureSize = caps.maxTextureSize;
        this.maxAnisotropy = caps.maxAnisotropy;
        this.driverInfo = this.engine.extractDriverInfo();
    }

    dispose() {
        if (this.sceneInstrumentation) {
            this.sceneInstrumentation.dispose();
            Reflect.set(this, "sceneInstrumentation", null);
        }

        if (this.engineInstrumentation) {
            this.engineInstrumentation.dispose();
            Reflect.set(this, "engineInstrumentation", null);
        }
    }
}
