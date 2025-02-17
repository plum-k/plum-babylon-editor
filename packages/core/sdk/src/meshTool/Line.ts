import {defaults} from "lodash-es";
import {
    Color3,
    CreateGreasedLine,
    Engine,
    GreasedLineBaseMesh,
    GreasedLineMesh,
    GreasedLineMeshColorDistributionType,
    GreasedLineMeshColorMode,
    GreasedLineMeshWidthDistribution,
    GreasedLinePoints,
    GreasedLineRibbonMesh,
    GreasedLineTools,
    Mesh,
    Observer,
    PBRMaterial,
    RawTexture,
    Vector3
} from "@babylonjs/core";
import {Viewer} from "../core/Viewer";
import {PScene} from "../core/PScene";
import {GreasedLineRibbonOptions} from "@babylonjs/core/Meshes/GreasedLine/greasedLineBaseMesh";

// 定义线段的选项接口
export interface ILine {
    name: string;       // 线段的名称
    viewer: Viewer;     // 视图实例的引用
}

// 主要的 Line 类定义
export  class Line {
    options: ILine;                       // 线段的选项
    viewer!: Viewer;                      // 视图实例
    scene!: PScene;                       // 渲染线段的场景
    line: GreasedLineBaseMesh | GreasedLineMesh | GreasedLineRibbonMesh; // 线段网格实例

    // 构造函数，初始化线段选项和视图
    constructor(options: ILine) {
        this.options = defaults(options, {}); // 使用 lodash 设置默认选项
        this.viewer = options.viewer;          // 设置视图属性
        this.scene = this.viewer.scene;        // 设置场景属性
    }

    // ----------------------- 线段可见性动画 ----------------------

    visibility = 0;                             // 当前可见性值（0 到 1）
    visibilityBeforeRenderObserver: Observer<any> | null = null; // 可见性更新的观察者

    // 动画可见性从 0 到 100
    visibilityAnimation(speed: number = 0.005) {
        // 移除任何现有的观察者以防止多重动画
        if (this.visibilityBeforeRenderObserver) {
            this.visibilityBeforeRenderObserver.remove();
        }
        // 添加新的观察者，在每次渲染之前更新可见性
        this.visibilityBeforeRenderObserver = this.scene.onBeforeRenderObservable.add(() => {
            this.visibility += speed * this.scene.getAnimationRatio(); // 增加可见性
            this.line.greasedLineMaterial.visibility = this.visibility; // 更新线段材料的可见性
        });
    }

    // 停止可见性动画
    stopVisibilityAnimation() {
        this.visibilityBeforeRenderObserver?.remove(); // 安全地移除观察者
    }

    // 设置可见性为特定值（默认为 0）
    setVisibility(value: number = 0) {
        this.visibility = value; // 设置可见性为给定值
    }

    // -------------------- UV 动画设置 --------------------

    // UV 动画更新的观察者
    uvAnimationBeforeRenderObserver: Observer<any> | null = null;

    // 动画 UV 坐标
    uvAnimation(speed: number = 0.005) {
        // 创建特定颜色的纹理
        const textureColors = new Uint8Array([255, 255, 255, 0, 0, 255]);
        const texture = new RawTexture(
            textureColors,
            textureColors.length / 3,
            1,
            Engine.TEXTUREFORMAT_RGB,
            this.scene,
            false,
            true,
            Engine.TEXTURE_NEAREST_NEAREST
        );
        texture.wrapU = RawTexture.WRAP_ADDRESSMODE; // 设置纹理的包裹方式
        texture.name = 'blue-white-texture'; // 命名纹理

        // 获取线段的材质并设置发光纹理
        let material = this.line.material as PBRMaterial;
        material.emissiveTexture = texture; // 将纹理分配给材质
        texture.uScale = 5; // 缩放纹理

        // 添加观察者，在每次渲染之前更新 UV 偏移
        this.uvAnimationBeforeRenderObserver = this.scene.onBeforeRenderObservable.add(() => {
            texture.uOffset += 0.01 * this.scene.getAnimationRatio(); // 增加 UV 偏移
        });
    }

    // 停止 UV 动画
    stopUvAnimation() {
        this.uvAnimationBeforeRenderObserver?.remove(); // 安全地移除观察者
    }

    //---------------- 虚线动画 --------------
    dashOffset = 0;
    dashOffsetBeforeRenderObserver: Observer<any> | null = null; // 可见性更新的观察者

    dashOffsetAnimation(speed: number = 0.001) {
        if (this.dashOffset !== 0) {
            this.dashOffset = 0;
        }
        const material = this.line.greasedLineMaterial
        this.dashOffsetBeforeRenderObserver = this.scene.onBeforeRenderObservable.add(() => {
            material.dashOffset = this.dashOffset
            this.dashOffset += speed;
        })
    }

    stopDashOffsetAnimation() {
        this.dashOffsetBeforeRenderObserver?.remove(); // 安全地移除观察者
    }

    // -------------------- 创建箭头帽 --------------------
    setGetArrowCap() {
        // 在线段的起始位置创建一个箭头帽
        const cap1 = GreasedLineTools.GetArrowCap(
            this.sourcePoints[1] as Vector3, // 箭头的位置
            Vector3.Right(),                 // 箭头的方向
            0.4,                             // 箭头的大小
            4, 4                             // 箭头的段数
        );
        this.points = cap1.points; // 设置线段的点
        this.widths = cap1.widths; // 设置线段的宽度
    }

    //---------------------- 线段相关属性 -----------------------

    sourcePoints: GreasedLinePoints = []; // 线段的原始点
    points: GreasedLinePoints = []; // 当前点
    instance?: GreasedLineBaseMesh; // 可选的线段实例
    widths?: number[]; // 可选的线段宽度
    widthDistribution?: GreasedLineMeshWidthDistribution; // 宽度分布
    ribbonOptions?: GreasedLineRibbonOptions; // 带状渲染的选项

    // 设置线段的点
    setPoints(points: GreasedLinePoints) {
        this.points = points; // 更新点
        this.sourcePoints = points; // 存储原始点
    }

    // 设置线段的实例
    setInstance(instance: GreasedLineBaseMesh) {
        this.instance = instance; // 更新实例
    }

    // 设置线段的宽度及其分布
    setWidths(widths?: number[], widthDistribution?: GreasedLineMeshWidthDistribution) {
        this.widths = widths; // 更新宽度
        this.widthDistribution = widthDistribution; // 更新宽度分布
    }

    /**
     * 设置为不面向摄像机的带状选项
     * @param options 带状渲染的选项
     */
    setRibbonOptions(options: GreasedLineRibbonOptions) {
        this.ribbonOptions = options; // 更新带状选项
    }

    // 基于网格设置点
    setPointsByMesh(mesh: Mesh) {
        const points = GreasedLineTools.MeshesToLines([mesh], GreasedLineTools.OmitDuplicatesPredicate); // 将网格转换为点
        this.setPoints(points); // 更新线段的点
    }

    //--------------------- 材质相关属性 ----------------------
    color: Color3 = Color3.White(); // 线段的默认颜色
    colors: Color3[] = []; // 线段的颜色数组
    useColors: boolean; // 是否使用多种颜色的标志
    colorMode: GreasedLineMeshColorMode = GreasedLineMeshColorMode.COLOR_MODE_SET; // 颜色应用模式
    colorDistributionType: GreasedLineMeshColorDistributionType = GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT; // 颜色分布类型

    width: number = 1; // 线段的默认宽度
    createAndAssignMaterial: boolean = true; // 是否创建并分配材质的标志
    sizeAttenuation: boolean = false; // 是否启用尺寸衰减的标志

    useDash: boolean = false; // 是否使用虚线的标志
    dashCount: number = 1; // 虚线的段数
    dashRatio: number = 0.5; // 虚线段长度与间隙长度的比率

    // 设置单一颜色
    setColor(color: Color3, colorMode: GreasedLineMeshColorMode.COLOR_MODE_SET, colorDistributionType: GreasedLineMeshColorDistributionType = GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT) {
        this.color = color; // 设置颜色
        this.useColors = false; // 禁用多颜色使用
        this.colorMode = colorMode; // 设置颜色模式
        this.colorDistributionType = colorDistributionType; // 设置颜色分布类型
    }

    // 设置多种颜色
    serColors(colors: Color3[], colorMode: GreasedLineMeshColorMode.COLOR_MODE_SET, colorDistributionType: GreasedLineMeshColorDistributionType = GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT) {
        this.colors = colors; // 更新颜色
        this.useColors = true; // 启用多颜色使用
        this.colorMode = colorMode; // 设置颜色模式
        this.colorDistributionType = colorDistributionType; // 设置颜色分布类型
    }

    // 设置线段的宽度
    setWidth(width: number = 1) {
        this.width = width; // 更新宽度
    }

    // 设置是否创建并分配材质
    setCreateAndAssignMaterial(createAndAssignMaterial = true) {
        this.createAndAssignMaterial = createAndAssignMaterial; // 更新标志
    }

    // 设置是否启用尺寸衰减
    setSizeAttenuation(sizeAttenuation = false) {
        this.sizeAttenuation = sizeAttenuation; // 更新标志
    }

    // 设置虚线的属性
    setUseDash(useDash: boolean = true, dashCount: number = 1, dashRatio: number = 0.5) {
        this.useDash = useDash; // 更新标志
        this.dashCount = dashCount; // 设置虚线段数
        this.dashRatio = dashRatio; // 设置虚线比率
    }

    // 构建线段并应用指定的选项
    build() {
        this.line = CreateGreasedLine(this.options.name,
            {
                points: this.points, // 创建线段的点
                instance: this.instance, // 可选的实例
                widths: this.widths, // 线段的宽度
                widthDistribution: this.widthDistribution, // 宽度分布
                ribbonOptions: this.ribbonOptions // 带状选项
            },
            {
                color: this.color, // 线段颜色
                colorMode: this.colorMode, // 颜色模式
                colors: this.colors, // 颜色数组
                useColors: this.useColors, // 颜色使用标志
                colorDistributionType: this.colorDistributionType, // 颜色分布类型
                width: this.width, // 线段宽度
                createAndAssignMaterial: this.createAndAssignMaterial, // 材质创建标志
                sizeAttenuation: this.sizeAttenuation, // 尺寸衰减标志
                useDash: this.useDash, // 虚线标志
                dashCount: this.dashCount, // 虚线段数
                dashRatio: this.dashRatio, // 虚线比率
            }
        );
        return this.line;
    }
}