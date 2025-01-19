import {
    BaseParticleSystem,
    Color4,
    ConeParticleEmitter,
    Constants,
    NoiseProceduralTexture,
    ParticleSystem,
    Texture,
    Vector3
} from "@babylonjs/core";
import {Viewer} from "../core";
import {defaultsDeep} from "lodash-es";


// 定义 PlumParticle 实例的配置选项
export interface IPlumParticle {
    // 粒子系统的名称
    name: string;
    // 粒子系统的容量
    capacity: number;
    // 关联的 Viewer 实例
    viewer: Viewer;
}

// 定义粒子系统序列动画相关的配置选项
export interface ISetSprite {
    // 起始精灵单元 ID
    startSpriteCellID?: number;
    // 结束精灵单元 ID
    endSpriteCellID?: number;
    // 精灵单元变化速度
    spriteCellChangeSpeed?: number;
    // 精灵单元宽度
    spriteCellWidth?: number;
    // 精灵单元高度
    spriteCellHeight?: number;
    // 是否随机开始精灵单元
    spriteRandomStartCell?: boolean;
}


// 定义噪声纹理的配置选项
export interface INoiseTextureOptions {
    // 噪声纹理的名称
    name?: string;
    // 噪声纹理的尺寸
    size?: number;
    // 噪声纹理的亮度
    brightness?: number;
    // 噪声纹理的八度音阶数
    octaves?: number;
    // 噪声纹理的持久性
    persistence?: number;
    // 噪声纹理的动画速度因子
    animationSpeedFactor?: number;
}

// 定义粒子系统更新选项的配置选项
export interface IUpdateOptions {
    // 更新速度
    updateSpeed?: number;
    // 目标停止持续时间
    targetStopDuration?: number;
    disposeOnStop?: boolean;
}


/**
 * 把 babylon 粒子系统的配置 按相关性分类
 */
export class PlumParticle {
    particleSystem: ParticleSystem;
    noiseTexture?: NoiseProceduralTexture;


    constructor(options: IPlumParticle) {
        let scene = options.viewer.scene;
        this.particleSystem = new ParticleSystem(options.name, options.capacity, scene);
    }


    /**
     * 设置粒子系统是否阻止自动启动
     * @param preventAutoStart - 一个布尔值，指示是否阻止粒子系统自动启动，默认为 false
     */
    setPreventAutoStart(preventAutoStart = false) {
        // 将粒子系统的 preventAutoStart 属性设置为 true，意味着阻止粒子系统自动启动
        this.particleSystem.preventAutoStart = true;
    }


    /**
     * 序列动画相关设置
     */
    setSprite(options: ISetSprite) {
        const _options = defaultsDeep(options, {
            startSpriteCellID: 0,
            endSpriteCellID: 0,
            spriteCellChangeSpeed: 1,
            spriteCellWidth: 0,
            spriteCellHeight: 0,
            spriteRandomStartCell: false,
        });
        this.particleSystem.startSpriteCellID = _options.startSpriteCellID;
        this.particleSystem.endSpriteCellID = _options.endSpriteCellID;
        this.particleSystem.spriteCellChangeSpeed = _options.spriteCellChangeSpeed;
        this.particleSystem.spriteCellWidth = _options.spriteCellWidth;
        this.particleSystem.spriteCellHeight = _options.spriteCellHeight;
        this.particleSystem.spriteRandomStartCell = _options.spriteRandomStartCell;
        this.particleSystem.isAnimationSheetEnabled = true;
    }


    /**
     * 设置粒子系统的大小范围
     * @param minSize 最小尺寸，默认为 1
     * @param maxSize 最大尺寸，默认为 1
     */
    setSize(minSize: number = 1, maxSize: number = 1) {
        this.particleSystem.minSize = minSize;
        this.particleSystem.maxSize = maxSize;
    }

    /**
     * 设置粒子系统的 X 轴缩放范围
     * @param minScaleX X 轴最小缩放比例，默认为 1
     * @param maxScaleX X 轴最大缩放比例，默认为 1
     */
    setScaleX(minScaleX: number = 1, maxScaleX: number = 1) {
        this.particleSystem.minScaleX = minScaleX;
        this.particleSystem.maxScaleX = maxScaleX;
    }

    /**
     * 设置粒子系统的 Y 轴缩放范围
     * @param minScaleY Y 轴最小缩放比例，默认为 1
     * @param maxScaleY Y 轴最大缩放比例，默认为 1
     */
    setScaleY(minScaleY: number = 1, maxScaleY: number = 1) {
        this.particleSystem.minScaleY = minScaleY;
        this.particleSystem.maxScaleY = maxScaleY;
    }


    /**
     * 生命周期相关设置
     * @param minLifeTime 最小生命周期，默认为 1
     * @param maxLifeTime 最大生命周期，默认为 1
     */
    setLifeTime(minLifeTime: number = 1, maxLifeTime: number = 1) {
        this.particleSystem.minLifeTime = minLifeTime;
        this.particleSystem.maxLifeTime = maxLifeTime;
    }


    /**
     * 发射功率相关设置
     * @param minEmitPower 最小发射功率，默认为 1
     * @param maxEmitPower 最大发射功率，默认为 1
     */
    setEmitPower(minEmitPower: number = 1, maxEmitPower: number = 1) {
        this.particleSystem.minEmitPower = minEmitPower;
        this.particleSystem.maxEmitPower = maxEmitPower;
    }


    /**
     * 角速度相关设置
     * @param minAngularSpeed 最小角速度，默认为 0
     * @param maxAngularSpeed 最大角速度，默认为 0
     */
    setAngularSpeed(minAngularSpeed: number = 0, maxAngularSpeed: number = 0) {
        this.particleSystem.minAngularSpeed = minAngularSpeed;
        this.particleSystem.maxAngularSpeed = maxAngularSpeed;
    }

    /**
     * 初始旋转相关设置
     * @param minInitialRotation 最小初始旋转角度，默认为 0
     * @param maxInitialRotation 最大初始旋转角度，默认为 0
     */
    setInitialRotation(minInitialRotation: number = 0, maxInitialRotation: number = 0) {
        this.particleSystem.minInitialRotation = minInitialRotation;
        this.particleSystem.maxInitialRotation = maxInitialRotation;
    }


    /**
     * 预热相关设置
     * @param preWarmCycles 预热周期数，默认为 0
     * @param preWarmStepOffset 预热步长偏移量，默认为 0
     */
    setPreWarm(preWarmCycles: number = 0, preWarmStepOffset: number = 0) {
        this.particleSystem.preWarmCycles = preWarmCycles;
        this.particleSystem.preWarmStepOffset = preWarmStepOffset;
    }


    /**
     * 颜色相关设置
     * @param color1 起始颜色，可以是 Color4 对象或数组，默认为 [1, 1, 1, 1]
     * @param color2 中间颜色，可以是 Color4 对象或数组，默认为 [1, 1, 1, 1]
     * @param colorDead 消亡颜色，可以是 Color4 对象或数组，默认为 [0, 0, 0, 1]
     */
    setColor(color1: Color4 | number[] = Color4.FromArray([1, 1, 1, 1]), color2: Color4 | number[] = Color4.FromArray([1, 1, 1, 1]), colorDead: Color4 | number[] = Color4.FromArray([0, 0, 0, 1])) {
        if (Array.isArray(color1)) {
            this.particleSystem.color1 = Color4.FromArray(color1);
        } else {
            this.particleSystem.color1 = color1;
        }

        if (Array.isArray(color2)) {
            this.particleSystem.color2 = Color4.FromArray(color2);
        } else {
            this.particleSystem.color2 = color2;
        }

        if (Array.isArray(colorDead)) {
            this.particleSystem.colorDead = Color4.FromArray(colorDead);
        } else {
            this.particleSystem.colorDead = colorDead;
        }
    }


    /**
     * 创建并配置噪声纹理
     * @param options
     */
    createNoiseTexture(options: INoiseTextureOptions) {
        const _options = defaultsDeep(options, {
            name: "NoiseProceduralTexture",
            size: 256,
            brightness: 0.5,
            octaves: 4,
            persistence: 0.2,
            animationSpeedFactor: 5
        });
        let scene = this.particleSystem.getScene();
        this.noiseTexture = new NoiseProceduralTexture(_options.name, _options.size, scene, undefined, true);
        this.noiseTexture.brightness = _options.brightness;
        this.noiseTexture.octaves = _options.octaves;
        this.noiseTexture.persistence = _options.persistence;
        this.noiseTexture.animationSpeedFactor = _options.animationSpeedFactor;
    }

    /**
     * 设置广告牌选项
     * @param billboardMode 广告牌模式，默认为 1
     * @param isBillboardBased 是否基于广告牌，默认为 true
     */
    setBillboardOptions(billboardMode: number = Constants.PARTICLES_BILLBOARDMODE_ALL, isBillboardBased: boolean = true) {
        this.particleSystem.billboardMode = billboardMode;
        this.particleSystem.isBillboardBased = isBillboardBased;
    }

    /**
     * 设置圆锥发射器
     * @param radius 圆锥发射器的半径，默认为 0.1
     * @param angle 圆锥发射器的角度，默认为 0.6
     * @param directionRandomizer 圆锥发射器的方向随机化因子，默认为 0
     */
    setConeEmitter(
        radius: number = 1,
        angle: number = Math.PI,
        directionRandomizer: number = 0
    ) {
        this.particleSystem.particleEmitterType = new ConeParticleEmitter(
            radius,
            angle,
            directionRandomizer
        );
    }

    /**
     * 设置发射器位置
     * @param emitterPosition 发射器的位置，类型为 Vector3，默认为 Vector3.Zero()
     */
    setPosition(emitterPosition: Vector3 = Vector3.Zero()) {
        this.particleSystem.emitter = emitterPosition;
    }

    /**
     * 设置重力
     * @param gravity 重力，可以是 Vector3 对象或数组，默认为 Vector3.Zero()
     */
    setGravity(gravity: Vector3 | number[] = Vector3.Zero()) {
        if (Array.isArray(gravity)) {
            this.particleSystem.gravity = Vector3.FromArray(gravity);
        } else {
            this.particleSystem.gravity = gravity;
        }
    }


    /**
     * 设置噪声强度
     * @param noiseStrength 噪声强度，可以是 Vector3 对象或数组，默认为 new Vector3(10, 10, 10)
     */
    setNoiseStrength(noiseStrength: Vector3 | number[] = new Vector3(10, 10, 10)) {
        if (Array.isArray(noiseStrength)) {
            this.particleSystem.noiseStrength = Vector3.FromArray(noiseStrength);
        } else {
            this.particleSystem.noiseStrength = noiseStrength;
        }
    }


    /**
     * 设置更新选项
     * @param options
     */
    setUpdateOptions(options: IUpdateOptions) {
        const _options = defaultsDeep(options, {
            updateSpeed: 0.01,
            targetStopDuration: 0,
            disposeOnStop: false
        });
        this.particleSystem.updateSpeed = _options.updateSpeed;
        this.particleSystem.targetStopDuration = _options.targetStopDuration;
        this.particleSystem.disposeOnStop = _options.disposeOnStop;
    }


    /**
     * 设置混合模式和深度写入选项
     * @param blendMode 混合模式，默认为 BaseParticleSystem.BLENDMODE_ONEONE
     * @param forceDepthWrite 是否强制深度写入，默认为 false
     */
    setRender(blendMode: number = BaseParticleSystem.BLENDMODE_ONEONE, forceDepthWrite: boolean = false) {
        this.particleSystem.blendMode = blendMode;
        this.particleSystem.forceDepthWrite = forceDepthWrite;
    }


    /**
     * 设置粒子纹理
     * @param url
     */
    setTexture(url: string) {
        this.particleSystem.particleTexture = new Texture(url);
    }

    /**
     * 为粒子系统添加颜色渐变
     * @param gradients 颜色渐变数组，每个元素是一个包含两个元素的数组，第一个元素是渐变位置（0 - 1之间），第二个元素是 Color4 对象或颜色数组（RGBA）
     */
    addColorGradients(gradients: [number, Color4 | number[]][]) {
        for (const [gradientPosition, colorValue] of gradients) {
            let color: Color4;
            if (Array.isArray(colorValue)) {
                color = Color4.FromArray(colorValue);
            } else {
                color = colorValue;
            }
            this.particleSystem.addColorGradient(gradientPosition, color);
        }
    }

    addSizeGradients(gradients: [number, number, number?][]) {
        for (const [gradient, factor, factor2] of gradients) {
            this.particleSystem.addSizeGradient(gradient, factor, factor2);
        }
    }

    /**
     * 设置粒子的发射速率
     * @param emitRate - 每秒发射的粒子数量，默认为 10。
     * 如果不传递该参数，将使用默认值。
     */
    setEmitRate(emitRate: number = 10) {
        this.particleSystem.emitRate = emitRate;
    }


    /**
     * 组转粒子
     */
    build() {

    }

    /**
     * 开始发射粒子
     */
    start(delay: number = 0) {
        this.particleSystem.start(delay);
    }

}