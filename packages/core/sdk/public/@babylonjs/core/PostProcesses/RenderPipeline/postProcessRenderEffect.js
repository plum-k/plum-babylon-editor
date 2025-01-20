import { Tools } from "../../Misc/tools.js";
/**
 * This represents a set of one or more post processes in Babylon.
 * A post process can be used to apply a shader to a texture after it is rendered.
 * @example https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/postProcessRenderPipeline
 */
export class PostProcessRenderEffect {
    /**
     * Instantiates a post process render effect.
     * A post process can be used to apply a shader to a texture after it is rendered.
     * @param engine The engine the effect is tied to
     * @param name The name of the effect
     * @param getPostProcesses A function that returns a set of post processes which the effect will run in order to be run.
     * @param singleInstance False if this post process can be run on multiple cameras. (default: true)
     */
    constructor(engine, name, getPostProcesses, singleInstance) {
        this._name = name;
        this._singleInstance = singleInstance || true;
        this._getPostProcesses = getPostProcesses;
        this._cameras = {};
        this._indicesForCamera = {};
        this._postProcesses = {};
    }
    /**
     * Checks if all the post processes in the effect are supported.
     */
    get isSupported() {
        for (const index in this._postProcesses) {
            if (Object.prototype.hasOwnProperty.call(this._postProcesses, index)) {
                const pps = this._postProcesses[index];
                for (let ppIndex = 0; ppIndex < pps.length; ppIndex++) {
                    if (!pps[ppIndex].isSupported) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    /**
     * Updates the current state of the effect
     * @internal
     */
    _update() { }
    /**
     * Attaches the effect on cameras
     * @param cameras The camera to attach to.
     * @internal
     */
    _attachCameras(cameras) {
        let cameraKey;
        const cams = Tools.MakeArray(cameras || this._cameras);
        if (!cams) {
            return;
        }
        for (let i = 0; i < cams.length; i++) {
            const camera = cams[i];
            if (!camera) {
                continue;
            }
            const cameraName = camera.name;
            if (this._singleInstance) {
                cameraKey = 0;
            }
            else {
                cameraKey = cameraName;
            }
            if (!this._postProcesses[cameraKey]) {
                const postProcess = this._getPostProcesses();
                if (postProcess) {
                    this._postProcesses[cameraKey] = Array.isArray(postProcess) ? postProcess : [postProcess];
                }
            }
            if (!this._indicesForCamera[cameraName]) {
                this._indicesForCamera[cameraName] = [];
            }
            this._postProcesses[cameraKey].forEach((postProcess) => {
                const index = camera.attachPostProcess(postProcess);
                this._indicesForCamera[cameraName].push(index);
            });
            if (!this._cameras[cameraName]) {
                this._cameras[cameraName] = camera;
            }
        }
    }
    /**
     * Detaches the effect on cameras
     * @param cameras The camera to detach from.
     * @internal
     */
    _detachCameras(cameras) {
        const cams = Tools.MakeArray(cameras || this._cameras);
        if (!cams) {
            return;
        }
        for (let i = 0; i < cams.length; i++) {
            const camera = cams[i];
            const cameraName = camera.name;
            const postProcesses = this._postProcesses[this._singleInstance ? 0 : cameraName];
            if (postProcesses) {
                postProcesses.forEach((postProcess) => {
                    camera.detachPostProcess(postProcess);
                });
            }
            if (this._cameras[cameraName]) {
                this._cameras[cameraName] = null;
            }
            delete this._indicesForCamera[cameraName];
        }
    }
    /**
     * Enables the effect on given cameras
     * @param cameras The camera to enable.
     * @internal
     */
    _enable(cameras) {
        const cams = Tools.MakeArray(cameras || this._cameras);
        if (!cams) {
            return;
        }
        for (let i = 0; i < cams.length; i++) {
            const camera = cams[i];
            const cameraName = camera.name;
            const cameraKey = this._singleInstance ? 0 : cameraName;
            for (let j = 0; j < this._indicesForCamera[cameraName].length; j++) {
                const index = this._indicesForCamera[cameraName][j];
                const postProcess = camera._postProcesses[index];
                if (postProcess === undefined || postProcess === null) {
                    cams[i].attachPostProcess(this._postProcesses[cameraKey][j], index);
                }
            }
        }
    }
    /**
     * Disables the effect on the given cameras
     * @param cameras The camera to disable.
     * @internal
     */
    _disable(cameras) {
        const cams = Tools.MakeArray(cameras || this._cameras);
        if (!cams) {
            return;
        }
        for (let i = 0; i < cams.length; i++) {
            const camera = cams[i];
            const cameraName = camera.name;
            this._postProcesses[this._singleInstance ? 0 : cameraName].forEach((postProcess) => {
                camera.detachPostProcess(postProcess);
            });
        }
    }
    /**
     * Gets a list of the post processes contained in the effect.
     * @param camera The camera to get the post processes on.
     * @returns The list of the post processes in the effect.
     */
    getPostProcesses(camera) {
        if (this._singleInstance) {
            return this._postProcesses[0];
        }
        else {
            if (!camera) {
                return null;
            }
            return this._postProcesses[camera.name];
        }
    }
}
//# sourceMappingURL=postProcessRenderEffect.js.map