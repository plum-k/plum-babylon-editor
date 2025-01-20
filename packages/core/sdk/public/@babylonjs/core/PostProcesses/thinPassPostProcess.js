import { EffectWrapper } from "../Materials/effectRenderer.js";
import { Engine } from "../Engines/engine.js";
/**
 * PassPostProcess which produces an output the same as it's input
 */
export class ThinPassPostProcess extends EffectWrapper {
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/pass.fragment.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/pass.fragment.js")]));
        }
        super._gatherImports(useWebGPU, list);
    }
    /**
     * Constructs a new pass post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name, engine = null, options) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinPassPostProcess.FragmentUrl,
        });
    }
}
/**
 * The fragment shader url
 */
ThinPassPostProcess.FragmentUrl = "pass";
/**
 * PassCubePostProcess which produces an output the same as it's input (which must be a cube texture)
 */
export class ThinPassCubePostProcess extends EffectWrapper {
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/passCube.fragment.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/passCube.fragment.js")]));
        }
        super._gatherImports(useWebGPU, list);
    }
    /**
     * Creates the PassCubePostProcess
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name, engine = null, options) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinPassCubePostProcess.FragmentUrl,
            defines: "#define POSITIVEX",
        });
        this._face = 0;
    }
    /**
     * Gets or sets the cube face to display.
     *  * 0 is +X
     *  * 1 is -X
     *  * 2 is +Y
     *  * 3 is -Y
     *  * 4 is +Z
     *  * 5 is -Z
     */
    get face() {
        return this._face;
    }
    set face(value) {
        if (value < 0 || value > 5) {
            return;
        }
        this._face = value;
        switch (this._face) {
            case 0:
                this.updateEffect("#define POSITIVEX");
                break;
            case 1:
                this.updateEffect("#define NEGATIVEX");
                break;
            case 2:
                this.updateEffect("#define POSITIVEY");
                break;
            case 3:
                this.updateEffect("#define NEGATIVEY");
                break;
            case 4:
                this.updateEffect("#define POSITIVEZ");
                break;
            case 5:
                this.updateEffect("#define NEGATIVEZ");
                break;
        }
    }
}
/**
 * The fragment shader url
 */
ThinPassCubePostProcess.FragmentUrl = "passCube";
//# sourceMappingURL=thinPassPostProcess.js.map