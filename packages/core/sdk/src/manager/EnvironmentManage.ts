import {Component, IComponentOptions,} from "../core/Component";
import {BaseTexture, Color3, CubeTexture, FilesInput, HDRCubeTexture, Mesh, Nullable, Scene} from "@babylonjs/core";

export interface IEnvironmentManageOptions extends IComponentOptions {
}

export interface IUpdateFogOptions {
    fogMode?: typeof Scene.FOGMODE_NONE | typeof Scene.FOGMODE_EXP | typeof Scene.FOGMODE_EXP2 | typeof Scene.FOGMODE_LINEAR;
    fogColor?: Color3;
    fogDensity?: number;
    fogStart?: number;
    fogEnd?: number;
}

export const presetsEnvironmentObj = {
    apartment: '/hdr/lebombo_1k.hdr',
    city: '/hdr/potsdamer_platz_1k.hdr',
    dawn: '/hdr/kiara_1_dawn_1k.hdr',
    forest: '/hdr/forest_slope_1k.hdr',
    lobby: '/hdr/st_fagans_interior_1k.hdr',
    night: '/hdr/dikhololo_night_1k.hdr',
    park: '/hdr/rooitou_park_1k.hdr',
    studio: '/hdr/studio_small_03_1k.hdr',
    sunset: '/hdr/venice_sunset_1k.hdr',
    warehouse: '/hdr/empty_warehouse_01_1k.hdr',
}

export type PresetsType = keyof typeof presetsEnvironmentObj

export class EnvironmentManage extends Component {
    hDRCubeTexture: Nullable<HDRCubeTexture> = null;
    skyboxMesh: Nullable<Mesh> = null;

    constructor(options: IEnvironmentManageOptions) {
        super(options);
    }

    /**
     * 创建默认环境
     * @param name
     * @param syncSkybox
     */
    createDefaultEnvironment(name: PresetsType | string = "city", syncSkybox: boolean = true) {
        if (this.scene.environmentTexture === null) {
            this.setEnvironment(name, syncSkybox)
        }
    }

    /**
     * 设置环境
     * @param name
     * @param syncSkybox
     */
    setEnvironment(name: string | PresetsType = "city", syncSkybox: boolean = true) {
        let path = ""
        if (name in presetsEnvironmentObj) {
            path = presetsEnvironmentObj[name as PresetsType]
        }
        this.hDRCubeTexture = new HDRCubeTexture(path, this.scene, 256, false, true, false, true);
        this.scene.environmentTexture = this.hDRCubeTexture;
        console.log(FilesInput.FilesToLoad)
        if (syncSkybox) {
            this.setSkybox(this.hDRCubeTexture)
        }

        // this.scene.createDefaultSkybox(hDRCubeTexture, true, 1000, 0.3, false)

        // const task = this.viewer.assetsManager.addHDRCubeTextureTask("defaultEnvironment", path, 256, false, true, false, true)
        // task.onSuccess = (task) => {
        //     this.scene.environmentTexture = task.texture.serialize()
        //     console.log(task)
        // }
        // this.viewer.assetsManager.load();
    }

    setSkybox(environmentTexture?: BaseTexture) {
        this.skyboxMesh = this.scene.createDefaultSkybox(environmentTexture, true, 100000, 0.3, false)
        if (this.skyboxMesh) {
            this.skyboxMesh.doNotSerialize = true;
        }
    }


    createDefaultLight() {
        if (this.scene.lights.length === 0) {
            this.scene.createDefaultLight();
        }
    }


    createFromPrefilteredData() {
        const hdrTexture = CubeTexture.CreateFromPrefilteredData("textures/environment.env", this.viewer.scene);
        if (hdrTexture) {
            this.viewer.scene.environmentTexture = hdrTexture;
        }
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