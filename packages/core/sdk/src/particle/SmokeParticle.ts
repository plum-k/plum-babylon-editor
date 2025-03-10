import {IPlumParticle, PlumParticle} from "./Particle";
import {Color4, Vector3} from "@babylonjs/core";
import {defaults} from "lodash-es";

export interface ISmokeParticle extends IPlumParticle {
}


/**
 * 烟雾粒子, 使用 houdini 或 ue5 导出的烟雾帧序列图
 */
export class SmokeParticle extends PlumParticle {
    constructor(options: IPlumParticle) {
        const _options = defaults(options, {
            capacity: 1000,
            name: "SmokeParticle"
        })
        super(_options);
    }

    build() {
        this.setSprite({
            startSpriteCellID: 0,
            endSpriteCellID: 63,
            spriteCellChangeSpeed: 2.5,
            spriteCellWidth: 128,
            spriteCellHeight: 128,
            spriteRandomStartCell: true,
        });

        this.setTexture("particleTexture/Smoke_SpriteSheet_8x8.png")

        this.setConeEmitter(0.1, 0.6)

        this.setBillboardOptions(1)

        this.setSize(3, 5);

        this.setEmitPower(1.2, 1.4,);

        this.setLifeTime(10, 11,);

        this.setEmitRate(30);

        this.setGravity(Vector3.FromArray([0.1, 0, 0.05]));

        this.setNoiseStrength(Vector3.FromArray([0.2, 0, 0.15]));

        this.setColor(
            Color4.FromArray([1, 1, 1, 1]),
            undefined,
            Color4.FromArray([1, 1, 1, 0])
        );

        this.setUpdateOptions({
            updateSpeed: 0.016666666666666666,
        });

        this.setRender(1);

        this.setInitialRotation(-0.7, 0.7);

        this.addColorGradients([
            [0, Color4.FromArray([0.5, 0.5, 0.5, 0])],
            [0.3, Color4.FromArray([0.3, 0.3, 0.3, 0.5])],
            [0.7, Color4.FromArray([0.2, 0.2, 0.2, 0.3])],
            [1, Color4.FromArray([0.1, 0.1, 0.1, 0])],
        ])

        this.addSizeGradients([[0, 1,2], [1, 6,7]])

        this.createNoiseTexture({
            name: "NoiseProceduralTexture",
            size: 256,
            brightness: 0.5,
            octaves: 4,
            persistence: 0.2,
            animationSpeedFactor: 5,
        })

        return this;
    }
}