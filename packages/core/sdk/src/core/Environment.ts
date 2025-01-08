import {BasePlum, IBasePlumOptions} from "./BasePlum";


export interface IEnvironmentOptions extends IBasePlumOptions, Partial<IEnvironmentHelperOptions> {
}

export interface IUpdateFogOptions {
    fogMode?: typeof Scene.FOGMODE_NONE | typeof Scene.FOGMODE_EXP | typeof Scene.FOGMODE_EXP2 | typeof Scene.FOGMODE_LINEAR;
    fogColor?: Color3;
    fogDensity?: number;
    fogStart?: number;
    fogEnd?: number;
}

export const presetsEnvironment = {
    apartment: './hdr/lebombo_1k.hdr',
    city: 'http://localhost:8086/hdr/potsdamer_platz_1k.hdr',
    dawn: './hdr/kiara_1_dawn_1k.hdr',
    forest: './hdr/forest_slope_1k.hdr',
    lobby: './hdr/st_fagans_interior_1k.hdr',
    night: './hdr/dikhololo_night_1k.hdr',
    park: './hdr/rooitou_park_1k.hdr',
    studio: './hdr/studio_small_03_1k.hdr',
    sunset: './hdr/venice_sunset_1k.hdr',
    warehouse: './hdr/empty_warehouse_01_1k.hdr',
}

export type PresetsEnvironmentType = keyof typeof presetsEnvironment

export class Environment extends BasePlum {

    constructor(options: IEnvironmentOptions) {
        super(options);
        const environmentUrl = presetsEnvironment["city"]
        const test = "http://localhost:8086/sky/default/"
        // const reflectionTexture = new HDRCubeTexture(environmentUrl, this.scene, 128);

        // this.scene.clearColor = new Color4(0, 0, 0, 0); // 黑色，透明
        // this.scene.clearColor = Color3.Blue();
        // this.scene.ambientColor = new Color3(0.3, 0.3, 0.3);
        // this.scene.createDefaultEnvironment({
        //     createGround: false,
        //     // createSkybox:false,
        //     skyboxTexture: test,
        //     environmentTexture: test,
        //     ...options,
        // });
    }

    updateFog(options: IUpdateFogOptions) {
        const {fogMode, fogColor, fogDensity, fogStart, fogEnd} = options;
        if (fogMode) {
            this.scene.fogMode = fogMode;
        }
        if (fogColor) {
            this.scene.fogColor = fogColor;
        }
        if (fogDensity) {
            this.scene.fogDensity = fogDensity;
        }
        if (fogStart) {
            this.scene.fogStart = fogStart;
        }
        if (fogEnd) {
            this.scene.fogEnd = fogEnd;
        }
    }
}
