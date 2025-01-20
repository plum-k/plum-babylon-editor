import { Logger } from "../Misc/logger.js";
import { Scene } from "../scene.js";
import { Vector3 } from "../Maths/math.vector.js";
import { Texture } from "../Materials/Textures/texture.js";
import { StandardMaterial } from "../Materials/standardMaterial.js";
import { PBRMaterial } from "../Materials/PBR/pbrMaterial.js";
import { HemisphericLight } from "../Lights/hemisphericLight.js";
import { EnvironmentHelper } from "./environmentHelper.js";
import { FreeCamera } from "../Cameras/freeCamera.js";
import { ArcRotateCamera } from "../Cameras/arcRotateCamera.js";
import { VRExperienceHelper } from "../Cameras/VR/vrExperienceHelper.js";
import "../Materials/Textures/Loaders/ddsTextureLoader.js";
import "../Materials/Textures/Loaders/envTextureLoader.js";
import "../Materials/Textures/Loaders/ktxTextureLoader.js";
import { CreateBox } from "../Meshes/Builders/boxBuilder.js";
import { WebXRDefaultExperience } from "../XR/webXRDefaultExperience.js";
/** @internal */
// eslint-disable-next-line no-var
export var _forceSceneHelpersToBundle = true;
Scene.prototype.createDefaultLight = function (replace = false) {
    // Dispose existing light in replace mode.
    if (replace) {
        if (this.lights) {
            for (let i = 0; i < this.lights.length; i++) {
                this.lights[i].dispose();
            }
        }
    }
    // Light
    if (this.lights.length === 0) {
        new HemisphericLight("default light", Vector3.Up(), this);
    }
};
Scene.prototype.createDefaultCamera = function (createArcRotateCamera = false, replace = false, attachCameraControls = false) {
    // Dispose existing camera in replace mode.
    if (replace) {
        if (this.activeCamera) {
            this.activeCamera.dispose();
            this.activeCamera = null;
        }
    }
    // Camera
    if (!this.activeCamera) {
        const worldExtends = this.getWorldExtends((mesh) => mesh.isVisible && mesh.isEnabled());
        const worldSize = worldExtends.max.subtract(worldExtends.min);
        const worldCenter = worldExtends.min.add(worldSize.scale(0.5));
        let camera;
        let radius = worldSize.length() * 1.5;
        // empty scene scenario!
        if (!isFinite(radius)) {
            radius = 1;
            worldCenter.copyFromFloats(0, 0, 0);
        }
        if (createArcRotateCamera) {
            const arcRotateCamera = new ArcRotateCamera("default camera", -(Math.PI / 2), Math.PI / 2, radius, worldCenter, this);
            arcRotateCamera.lowerRadiusLimit = radius * 0.01;
            arcRotateCamera.wheelPrecision = 100 / radius;
            camera = arcRotateCamera;
        }
        else {
            const freeCamera = new FreeCamera("default camera", new Vector3(worldCenter.x, worldCenter.y, -radius), this);
            freeCamera.setTarget(worldCenter);
            camera = freeCamera;
        }
        camera.minZ = radius * 0.01;
        camera.maxZ = radius * 1000;
        camera.speed = radius * 0.2;
        this.activeCamera = camera;
        if (attachCameraControls) {
            camera.attachControl();
        }
    }
};
Scene.prototype.createDefaultCameraOrLight = function (createArcRotateCamera = false, replace = false, attachCameraControls = false) {
    this.createDefaultLight(replace);
    this.createDefaultCamera(createArcRotateCamera, replace, attachCameraControls);
};
Scene.prototype.createDefaultSkybox = function (environmentTexture, pbr = false, scale = 1000, blur = 0, setGlobalEnvTexture = true) {
    if (!environmentTexture) {
        Logger.Warn("Can not create default skybox without environment texture.");
        return null;
    }
    if (setGlobalEnvTexture) {
        if (environmentTexture) {
            this.environmentTexture = environmentTexture;
        }
    }
    // Skybox
    const hdrSkybox = CreateBox("hdrSkyBox", { size: scale }, this);
    if (pbr) {
        const hdrSkyboxMaterial = new PBRMaterial("skyBox", this);
        hdrSkyboxMaterial.backFaceCulling = false;
        hdrSkyboxMaterial.reflectionTexture = environmentTexture.clone();
        if (hdrSkyboxMaterial.reflectionTexture) {
            hdrSkyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        }
        hdrSkyboxMaterial.microSurface = 1.0 - blur;
        hdrSkyboxMaterial.disableLighting = true;
        hdrSkyboxMaterial.twoSidedLighting = true;
        hdrSkybox.material = hdrSkyboxMaterial;
    }
    else {
        const skyboxMaterial = new StandardMaterial("skyBox", this);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = environmentTexture.clone();
        if (skyboxMaterial.reflectionTexture) {
            skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        }
        skyboxMaterial.disableLighting = true;
        hdrSkybox.material = skyboxMaterial;
    }
    hdrSkybox.isPickable = false;
    hdrSkybox.infiniteDistance = true;
    hdrSkybox.ignoreCameraMaxZ = true;
    return hdrSkybox;
};
Scene.prototype.createDefaultEnvironment = function (options) {
    if (EnvironmentHelper) {
        return new EnvironmentHelper(options, this);
    }
    return null;
};
Scene.prototype.createDefaultVRExperience = function (webVROptions = {}) {
    return new VRExperienceHelper(this, webVROptions);
};
Scene.prototype.createDefaultXRExperienceAsync = function (options = {}) {
    return WebXRDefaultExperience.CreateAsync(this, options).then((helper) => {
        return helper;
    });
};
//# sourceMappingURL=sceneHelpers.js.map