// glTF导入
import "@babylonjs/loaders/glTF";
// 调试模式
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
// import {HtmlMeshRenderer} from "@babylonjs/addons/htmlMesh/htmlMeshRenderer.js";
//--------
import {defaultsDeep, isNil, isString, uniqueId} from "lodash-es";
import {Editor} from "../editor";
import {PlumAssetsManager, PlumAssetContainer, EventManager, PostProcessManager} from "../manager";
import {CameraControls} from "./CameraControls";
import {LightManager} from "./LightManager";
import {Subject} from "rxjs";
import {EffectLayer} from "./EffectLayer";
import {DrawLine} from "./DrawLine";
import {Statistics} from "./Statistics";
import COSApi, {ICOSApiOptions} from "cos-api";
import {
    AbstractEngine,
    AbstractMesh, AssetContainer,
    EngineFactory,
    EngineOptions,
    IInspectorOptions,
    Node,
    Nullable,
    PBRMaterial,
    SceneLoader,
    WebGPUEngine,
    WebGPUEngineOptions
} from "@babylonjs/core";
import {isCamera, isLight, isMesh} from "babylon-is";
import {PScene} from "./PScene";
import {GridTool} from "../tool/GridTool";
import {EnvironmentManage} from "../manager/EnvironmentManage";
import {getPackage, Package} from "../serializeManage";
import {HtmlMeshRenderer} from "babylon-htmlmesh";
import {Physics} from "../manager/Physics";

export interface ISceneLoadProgressEvent {
    type: "unZip";
    total: number;
    progress: number;
}

export interface IViewerOptions {
    /**
     * 应用程序的唯一标识符。
     */
    appId?: string;

    /**
     * 资源包的路径，用于加载相关资源。
     */
    packagePath?: string;
    /**
     * 包的类型
     * - "part": 渐进式加载
     * - "chunk": 切片包
     * - "native": 原生包
     */
    packageType?: "part" | "chunk" | "native";

    /**
     * 引擎的配置选项，支持 WebGPUEngineOptions 或 EngineOptions。
     */
    engineOptions?: WebGPUEngineOptions | EngineOptions;

    /**
     * 是否创建默认光源，默认为 false。
     */
    isCreateDefaultLight?: boolean;

    /**
     * 是否创建默认环境，默认为 false。
     */
    isCreateDefaultEnvironment?: boolean;
    /**
     * cos 配置
     */
    cosApiOptions?: ICOSApiOptions;
}

export class Viewer {
    //---------- 配置
    options: IViewerOptions;

    //---------- HTML 容器
    container!: HTMLElement; // 用于渲染的容器
    canvas!: HTMLCanvasElement; // 渲染画布

    //---------- 原生对象
    engine!: AbstractEngine; // BabylonJS 引擎
    scene!: PScene; // 当前场景
    htmlMeshRenderer: Nullable<HtmlMeshRenderer> = null; // 用于渲染 HTML 网格的渲染器

    //----------- 扩展原生对象
    assetsManager!: PlumAssetsManager; // 资源管理器
    assetContainer!: PlumAssetContainer; // 资产容器

    //---------- 对象
    eventManager!: EventManager; // 事件管理器
    cameraControls!: CameraControls; // 相机控制
    lightManager!: LightManager; // 光源管理
    postProcessManager!: PostProcessManager; // 后处理管理
    effectLayer!: EffectLayer; // 特效层
    editor!: Editor; // 编辑器
    drawLine!: DrawLine; // 绘制线条的工具
    statistics!: Statistics; // 性能统计

    environmentManage!: EnvironmentManage;

    //---------- 事件
    // 场景初始化完成
    initSubject = new Subject();
    // 场景加载进度
    sceneLoadProgressSubject = new Subject<ISceneLoadProgressEvent>();
    initComponentSubject = new Subject();

    isWebGPU = false; // 标识是否使用 WebGPU 渲染

    // 是否初始化完成
    isLoad = false;

    // 腾讯cos存储
    cosApi: Nullable<COSApi> = null;

    //----------------

    physics = new Physics({viewer: this});

    gridTool: GridTool = new GridTool()
    serializer: Package | null = null;

    constructor(container: string | HTMLDivElement, options ?: IViewerOptions) {
        this.options = defaultsDeep({}, options);
        this.initContainer(container);
        this.initCanvas();

        const {engineOptions} = this.options;

        // 根据不同环境创建不同的引擎
        EngineFactory.CreateAsync(this.canvas, engineOptions).then((engine) => {
            this.engine = engine;
            if (this.engine instanceof WebGPUEngine) {
                this.isWebGPU = true;
            }
            this.initComponent();
        });
    }

    /**
     * 启用/禁用 HTML 网格渲染器
     * @param value 是否启用
     */
    set htmlMeshRendererEnabled(value: boolean) {
        if (this.htmlMeshRenderer) {
            if (!value) {
                this.htmlMeshRenderer.dispose();
                this.htmlMeshRenderer = null;
            }
        } else {
            if (value) {
                this.htmlMeshRenderer = new HtmlMeshRenderer(this.scene, {
                    parentContainerId: this.container.id
                });
                // htmlMesh 必须渲染是清除颜色是透明是才可以看到
                this.scene.clearColor.a = 0;
            }
        }
    }

    /**
     * 创建 Viewer
     * @param container 容器
     * @param options 配置项
     */
    static async create(container: string | HTMLDivElement, options ?: IViewerOptions): Promise<Viewer> {
        return new Promise<Viewer>((resolve) => {
            const viewer = new Viewer(container, options); // 创建 Viewer 实例
            viewer.initComponentSubject.subscribe(() => {
                resolve(viewer);
            });
        });
    }

    /**
     * 初始化容器
     * @param container 容器
     */
    initContainer(container: string | HTMLDivElement) {
        if (isString(container)) {
            const divDom = document.getElementById(container); // 根据 ID 获取 DOM 元素
            if (isNil(divDom)) {
                throw new Error(`当前没有找到 id 为 ${container} 的 div 标签`); // 抛出错误
            } else {
                this.container = divDom; // 赋值给容器
            }
        } else {
            if (!container.id) {
                container.id = "viewer"
            }
            this.container = container; // 直接赋值
        }
    }

    /**
     * 初始化画布
     */
    initCanvas() {
        // 初始化画布
        this.canvas = document.createElement('canvas'); // 创建 canvas 元素
        this.canvas.width = this.container.clientWidth; // 设置宽度
        this.canvas.height = this.container.clientHeight; // 设置高度

        this.canvas.style.height = "100%"; // 设置样式
        this.canvas.style.width = "100%";
        this.canvas.style.display = "block"; // 显示为块级元素
        this.container.append(this.canvas); // 将画布添加到容器中
    }

    /**
     * 初始化组件
     */
    initComponent() {
        SceneLoader.ShowLoadingScreen = false; // 不显示加载屏幕
        this.engine.hideLoadingUI(); // 隐藏加载 UI

        if (this.options.cosApiOptions) {
            this.cosApi = new COSApi(this.options.cosApiOptions);
        }

        this.scene = new PScene(this.engine);

        // this.physics = new Physics({viewer: this});


        this.eventManager = new EventManager({viewer: this});
        this.assetsManager = new PlumAssetsManager(this);
        this.assetContainer = new PlumAssetContainer(this);

        this.cameraControls = new CameraControls({viewer: this});
        this.lightManager = new LightManager({viewer: this});
        this.postProcessManager = new PostProcessManager({viewer: this});


        this.environmentManage = new EnvironmentManage({viewer: this})


        this.resize();

        // 监听窗口大小变化
        this.eventManager.resizeSubject.subscribe(size => {
            this.resize();
        });

        this.drawLine = new DrawLine({viewer: this});
        this.effectLayer = new EffectLayer({viewer: this});
        this.statistics = new Statistics({viewer: this});

        this.initComponentSubject.next(true);

        this.initSubject.subscribe(() => {
            if (this.options.isCreateDefaultLight) {
                this.environmentManage.createDefaultLight();
            }
            if (this.options.isCreateDefaultEnvironment) {
                this.environmentManage.createDefaultEnvironment();
            }
            if (this.editor) {
                this.editor.editorEventManager.sceneGraphChanged.next(true);
            }
        })

        this.loadScene();

        this.run();

        // 监听新增网格, 如果网格没有材质, 设置默认材质
        this.scene.onNewMeshAddedObservable.add((mesh) => {
            this.setDefaultMaterial(mesh);
        });
    }
    /**
     * 设置默认材质
     */
    setDefaultMaterial(mesh: AbstractMesh) {
        const material = mesh.material;
        if (material === null) {
            let material  = new PBRMaterial(uniqueId("default"), mesh.getScene());
            material.metallic = 1;
            material.roughness = 1;
        }
    }

    setInitState() {
        this.isLoad = true;
        this.initSubject.next(true);
    }

    /**
     * 启用编辑器
     */
    enableEditor() {
        if (isNil(this.editor)) {
            this.editor = new Editor({viewer: this});
        }
    }


    /**
     * 开启调试模式
     * @param debugOn
     * @param config
     */
    async debug(debugOn: boolean = true, config: IInspectorOptions = {overlay: true}) {
        if (debugOn) {
            const debugLayer = await this.scene.debugLayer.show(config);
        } else {
            this.scene.debugLayer.hide();
        }
    }

    /**
     * 开始渲染
     */
    run() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }


    /**
     * 获取容器大小
     */
    getSize() {
        const container = this.container;
        const width = container.offsetWidth; // 获取宽度
        const height = container.offsetHeight; // 获取高度
        return {width, height}; // 返回大小对象
    }

    /**
     * 重置画布大小
     */
    resize() {
        this.engine.resize();
    }

    /**
     * 初始化场景
     */
    loadScene() {
        const serializer = getPackage(this);
        if (serializer) {
            this.serializer = serializer;
            serializer.loadScene();
        } else {
            this.setInitState();
        }
    }


    //----------------------- 工具函数

    /**
     * 根据唯一 ID 获取节点。
     * @param uniqueId 节点的唯一 ID。
     * @returns 具有指定唯一 ID 的节点，如果未找到则返回 null。
     */
    getNodeByUniqueId(uniqueId: number): Nullable<Node> {
        const mesh = this.scene.getMeshByUniqueId(uniqueId);
        if (mesh) {
            return mesh;
        }
        const light = this.scene.getLightByUniqueId(uniqueId);
        if (light) {
            return light;
        }

        const camera = this.scene.getCameraByUniqueId(uniqueId);
        if (camera) {
            return camera;
        }
        const transformNode = this.scene.getTransformNodeByUniqueId(uniqueId);
        if (transformNode) {
            return transformNode;
        }
        return null;
    }

    /**
     * 根据名称获取节点。
     * @param name 节点的名称。
     * @returns 具有指定名称的节点，如果未找到则返回 null。
     */
    getNodeByName(name: string): Nullable<Node> {
        // 根据名称获取节点
        const mesh = this.scene.getMeshByName(name); // 获取网格
        if (mesh) {
            return mesh; // 返回网格
        }

        const transformNode = this.scene.getTransformNodeByName(name); // 获取变换节点
        if (transformNode) {
            return transformNode; // 返回变换节点
        }

        const light = this.scene.getLightByName(name); // 获取光源
        if (light) {
            return light; // 返回光源
        }

        const camera = this.scene.getCameraByName(name); // 获取相机
        if (camera) {
            return camera; // 返回相机
        }

        return null; // 未找到返回 null
    }

    /**
     * 添加节点。
     * @param node 节点。
     * @param recursive 是否递归添加子节点。
     */
    addNode(node: Node, recursive = true) {
        if (isMesh(node)) {
            this.scene.addMesh(node, false);
        } else if (isLight(node)) {
            this.scene.addLight(node);
        } else if (isCamera(node)) {
            this.scene.addCamera(node);
        }
    }


    /**
     * 移除节点。
     * @param node 节点。
     * @param recursive 是否递归移除子节点。
     */
    removeNode(node: Node, recursive = true) {
        if (isMesh(node)) {
            this.scene.removeMesh(node, recursive);
        } else if (isLight(node)) {
            this.scene.removeLight(node);
        } else if (isCamera(node)) {
            this.scene.removeCamera(node);
        }
    }
}