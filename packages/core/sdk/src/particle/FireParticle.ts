import {IPlumParticle, PlumParticle} from "./Particle";
import {Color4, Vector3} from "@babylonjs/core";
import {defaults} from "lodash-es";

export interface IFireParticle extends IPlumParticle {
}


/**
 * 火焰粒子, 使用 houdini 或 ue5 导出的烟雾帧序列图
 */
export class FireParticle extends PlumParticle {
    constructor(options: IFireParticle) {
        const _options = defaults(options, {
            capacity: 5,
            name: "FireParticle"
        })
        super(_options);
    }

    build() {
        this.setPosition(new Vector3(0, 3.25, 0));

        this.setBoxEmitter({
            direction1: [0, 1, 0],
            direction2: [0, 1, 0],
            minEmitBox: [-0.5, 0, -0.5],
            maxEmitBox: [0.5, 0, 0.5]
        })
        this.setTexture("particleTexture/fire/Fire_SpriteSheet1_8x8.png")

        this.setSprite({
            startSpriteCellID: 0,
            endSpriteCellID: 63,
            spriteCellChangeSpeed: 1,
            spriteCellWidth: 128,
            spriteCellHeight: 128,
            spriteRandomStartCell: true,
        });

        this.setBillboardOptions(2,true)

        this.setSize(6, 8)

        this.setEmitPower(0, 0)

        this.setLifeTime(2, 3)

        this.setEmitRate(2)

        this.setNoiseStrength()

        this.setColor([1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 0])

        this.setGravity([0,0,0])

        this.setUpdateOptions({
            updateSpeed: 0.016666666666666666,
        });

        this.setRender(4)

        this.setPreWarm(100, 10)

        this.setInitialRotation(-0.1, 0.1)

        this.addColorGradients([
            [0, [1, 1, 1, 0]],
            [0.1, [1, 1, 1, 0.6]],
            [0.9, [1, 1, 1, 0.6]],
            [1, [1, 1, 1, 0]],
        ])

        this.addRampGradients([[0, [1, 1, 1]], [1, [0.7968, 0.3685, 0.1105]]])

        this.addColorRemapGradients([[0, 0.2, 1], [1, 0.2, 1]])

        this.setPreventAutoStart(false)

        this.setAnimation();

        return this;
    }
}