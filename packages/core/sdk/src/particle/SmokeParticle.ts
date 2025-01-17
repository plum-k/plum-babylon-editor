import {Color4, ConeParticleEmitter, NoiseProceduralTexture, ParticleSystem, Texture, Vector3} from "@babylonjs/core";

export interface ISmokeParticle {
    name: string;
}


/**
 * 烟雾粒子, 使用 houdini 或 ue5 导出的烟雾帧序列图
 */
export class SmokeParticle {
    constructor() {
        const particleSystem = new ParticleSystem("smoke", 500, scene);

        const texture = new Texture("particleTexture/Smoke_SpriteSheet_8x8.png");
        particleSystem.particleTexture = texture;
        particleSystem.startSpriteCellID = 0
        particleSystem.endSpriteCellID = 63
        particleSystem.spriteCellChangeSpeed = 2.5
        particleSystem.spriteCellWidth = 128
        particleSystem.spriteCellHeight = 128
        particleSystem.spriteRandomStartCell = true

        particleSystem.emitter = Vector3.Zero();
        particleSystem.particleEmitterType = new ConeParticleEmitter(0.1, 0.6, 0);
        particleSystem.startDelay = 0
        particleSystem.renderingGroupId = 0
        particleSystem.isBillboardBased = true
        particleSystem.minAngularSpeed = 0
        particleSystem.maxAngularSpeed = 0
        particleSystem.minSize = 3
        particleSystem.maxSize = 5
        particleSystem.minScaleX = 1
        particleSystem.maxScaleX = 1
        particleSystem.minScaleY = 1
        particleSystem.maxScaleY = 1
        particleSystem.minEmitPower = 1.2
        particleSystem.maxEmitPower = 1.4
        particleSystem.minLifeTime = 10
        particleSystem.maxLifeTime = 11
        particleSystem.emitRate = 30

        particleSystem.gravity = Vector3.FromArray([0.1, 0, 0.05]);
        particleSystem.noiseStrength = Vector3.FromArray([0.2, 0, 0.15]);
        particleSystem.color1 = Color4.FromArray([1, 1, 1, 1]);
        particleSystem.colorDead = Color4.FromArray([1, 1, 1, 0]);

        particleSystem.updateSpeed = 0.016666666666666666
        particleSystem.targetStopDuration = 0
        particleSystem.blendMode = 1
        particleSystem.preWarmCycles = 0
        particleSystem.preWarmStepOffset = 1
        particleSystem.minInitialRotation = -0.7
        particleSystem.maxInitialRotation = 0.7

        particleSystem.addColorGradient(0, Color4.FromArray([0.5, 0.5, 0.5, 0]));
        particleSystem.addColorGradient(0.3, Color4.FromArray([0.3, 0.3, 0.3, 0.5]));
        particleSystem.addColorGradient(0.7, Color4.FromArray([0.2, 0.2, 0.2, 0.3]));
        particleSystem.addColorGradient(1, Color4.FromArray([0.1, 0.1, 0.1, 0]));

        particleSystem.addSizeGradient(0, 1);
        particleSystem.addSizeGradient(1, 6);

        let noiseTexture = new NoiseProceduralTexture("NoiseProceduralTexture", 256, scene, undefined, true);
        noiseTexture.brightness = 0.5
        noiseTexture.octaves = 4
        noiseTexture.persistence = 0.2
        noiseTexture.animationSpeedFactor = 5
        particleSystem.noiseTexture = new NoiseProceduralTexture("NoiseProceduralTexture");

        particleSystem.preventAutoStart = true
        particleSystem.isAnimationSheetEnabled = true

// 开始发射粒子
        particleSystem.start();
    }


}