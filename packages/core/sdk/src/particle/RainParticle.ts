import {IPlumParticle, PlumParticle} from "./Particle";
import {BaseParticleSystem, Color4, Vector3} from "@babylonjs/core";
import {defaults} from "lodash-es";

export interface IRainParticle extends IPlumParticle {
}

/**
 * 下雨效果
 */
export class RainParticle extends PlumParticle {
    constructor(options: IRainParticle) {
        const _options = defaults(options, {
            capacity: 3000,
            rainDense: "rainDense"
        })
        super(_options);
    }

    build() {
        this.setTexture("particleTexture/Rain.png")

        this.setPosition(new Vector3(0, 30, 0));

        this.setBoxEmitter({
            minEmitBox: [
                -30,
                0,
                -30
            ],
            maxEmitBox:
                [
                    30,
                    0,
                    30
                ]
        })

        this.setBillboardOptions(2)

        this.setScaleX(0.25, 0.25)
        this.setScaleY(0., 0.3)
        this.setEmitPower(10, 12)
        this.setLifeTime(3, 3);
        this.setEmitRate(600)
        this.setColor(undefined, undefined, [1, 1, 1, 0])

        this.setUpdateOptions({
            updateSpeed: 0.03
        })
        this.setRender(BaseParticleSystem.BLENDMODE_STANDARD)
        this.setPreWarm(50, 1)

        this.setSprite({
            "startSpriteCellID": 0,
            "endSpriteCellID": 3,
            "spriteCellChangeSpeed": 0,
            "spriteCellWidth": 128,
            "spriteCellHeight": 512,
            "spriteRandomStartCell": true,
        });


        this.addColorGradients([
            [0, Color4.FromArray([1, 1, 1, 0.3])],
            [1, Color4.FromArray([1, 1, 1, 0.3])],
        ])
    }
}