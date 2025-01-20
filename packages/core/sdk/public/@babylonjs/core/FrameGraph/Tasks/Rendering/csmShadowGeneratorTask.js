import { CascadedShadowGenerator } from "../../../Lights/Shadows/cascadedShadowGenerator.js";
import { FrameGraphShadowGeneratorTask } from "./shadowGeneratorTask.js";
import { DirectionalLight } from "../../../Lights/directionalLight.js";
/**
 * Task used to generate a cascaded shadow map from a list of objects.
 */
export class FrameGraphCascadedShadowGeneratorTask extends FrameGraphShadowGeneratorTask {
    constructor() {
        super(...arguments);
        this._numCascades = CascadedShadowGenerator.DEFAULT_CASCADES_COUNT;
        this._debug = false;
        this._stabilizeCascades = false;
        this._lambda = 0.5;
        this._cascadeBlendPercentage = 0.1;
        this._depthClamp = true;
        this._autoCalcDepthBounds = false;
        this._shadowMaxZ = 10000;
    }
    /**
     * Checks if a shadow generator task is a cascaded shadow generator task.
     * @param task The task to check.
     * @returns True if the task is a cascaded shadow generator task, else false.
     */
    static IsCascadedShadowGenerator(task) {
        return task.numCascades !== undefined;
    }
    /**
     * The number of cascades.
     */
    get numCascades() {
        return this._numCascades;
    }
    set numCascades(value) {
        if (value === this._numCascades) {
            return;
        }
        this._numCascades = value;
        this._setupShadowGenerator();
    }
    /**
     * Gets or sets a value indicating whether the shadow generator should display the cascades.
     */
    get debug() {
        return this._debug;
    }
    set debug(value) {
        if (value === this._debug) {
            return;
        }
        this._debug = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.debug = value;
        }
    }
    /**
     * Gets or sets a value indicating whether the shadow generator should stabilize the cascades.
     */
    get stabilizeCascades() {
        return this._stabilizeCascades;
    }
    set stabilizeCascades(value) {
        if (value === this._stabilizeCascades) {
            return;
        }
        this._stabilizeCascades = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.stabilizeCascades = value;
        }
    }
    /**
     * Gets or sets the lambda parameter of the shadow generator.
     */
    get lambda() {
        return this._lambda;
    }
    set lambda(value) {
        if (value === this._lambda) {
            return;
        }
        this._lambda = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.lambda = value;
        }
    }
    /**
     * Gets or sets the cascade blend percentage.
     */
    get cascadeBlendPercentage() {
        return this._cascadeBlendPercentage;
    }
    set cascadeBlendPercentage(value) {
        if (value === this._cascadeBlendPercentage) {
            return;
        }
        this._cascadeBlendPercentage = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.cascadeBlendPercentage = value;
        }
    }
    /**
     * Gets or sets a value indicating whether the shadow generator should use depth clamping.
     */
    get depthClamp() {
        return this._depthClamp;
    }
    set depthClamp(value) {
        if (value === this._depthClamp) {
            return;
        }
        this._depthClamp = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.depthClamp = value;
        }
    }
    /**
     * Gets or sets a value indicating whether the shadow generator should automatically calculate the depth bounds.
     */
    get autoCalcDepthBounds() {
        return this._autoCalcDepthBounds;
    }
    set autoCalcDepthBounds(value) {
        if (value === this._autoCalcDepthBounds) {
            return;
        }
        this._autoCalcDepthBounds = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.autoCalcDepthBounds = value;
        }
    }
    /**
     * Gets or sets the maximum shadow Z value.
     */
    get shadowMaxZ() {
        return this._shadowMaxZ;
    }
    set shadowMaxZ(value) {
        if (value === this._shadowMaxZ) {
            return;
        }
        this._shadowMaxZ = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.shadowMaxZ = value;
        }
    }
    _createShadowGenerator() {
        if (!(this.light instanceof DirectionalLight)) {
            throw new Error(`FrameGraphCascadedShadowGeneratorTask ${this.name}: the CSM shadow generator only supports directional lights.`);
        }
        this._shadowGenerator = new CascadedShadowGenerator(this.mapSize, this.light, this.useFloat32TextureType, this.camera, this.useRedTextureFormat);
        this._shadowGenerator.numCascades = this._numCascades;
    }
    _setupShadowGenerator() {
        super._setupShadowGenerator();
        const shadowGenerator = this._shadowGenerator;
        if (shadowGenerator === undefined) {
            return;
        }
        shadowGenerator.debug = this._debug;
        shadowGenerator.stabilizeCascades = this._stabilizeCascades;
        shadowGenerator.lambda = this._lambda;
        shadowGenerator.cascadeBlendPercentage = this._cascadeBlendPercentage;
        shadowGenerator.depthClamp = this._depthClamp;
        shadowGenerator.autoCalcDepthBounds = this._autoCalcDepthBounds;
        shadowGenerator.shadowMaxZ = this._shadowMaxZ;
    }
}
//# sourceMappingURL=csmShadowGeneratorTask.js.map