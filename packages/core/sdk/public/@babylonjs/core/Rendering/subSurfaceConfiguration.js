import { Logger } from "../Misc/logger.js";
import { Color3 } from "../Maths/math.color.js";
import { SubSurfaceScatteringPostProcess } from "../PostProcesses/subSurfaceScatteringPostProcess.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { _WarnImport } from "../Misc/devTools.js";

/**
 * Contains all parameters needed for the prepass to perform
 * screen space subsurface scattering
 */
export class SubSurfaceConfiguration {
    /**
     * Diffusion profile color for subsurface scattering
     */
    get ssDiffusionS() {
        return this._ssDiffusionS;
    }
    /**
     * Diffusion profile max color channel value for subsurface scattering
     */
    get ssDiffusionD() {
        return this._ssDiffusionD;
    }
    /**
     * Diffusion profile filter radius for subsurface scattering
     */
    get ssFilterRadii() {
        return this._ssFilterRadii;
    }
    /**
     * Builds a subsurface configuration object
     * @param scene The scene
     */
    constructor(scene) {
        this._ssDiffusionS = [];
        this._ssFilterRadii = [];
        this._ssDiffusionD = [];
        /**
         * Is subsurface enabled
         */
        this.enabled = false;
        /**
         * Does the output of this prepass need to go through imageprocessing
         */
        this.needsImageProcessing = true;
        /**
         * Name of the configuration
         */
        this.name = SceneComponentConstants.NAME_SUBSURFACE;
        /**
         * Diffusion profile colors for subsurface scattering
         * You can add one diffusion color using `addDiffusionProfile` on `scene.prePassRenderer`
         * See ...
         * Note that you can only store up to 5 of them
         */
        this.ssDiffusionProfileColors = [];
        /**
         * Defines the ratio real world => scene units.
         * Used for subsurface scattering
         */
        this.metersPerUnit = 1;
        /**
         * Textures that should be present in the MRT for this effect to work
         */
        this.texturesRequired = [
            5,
            7,
            4,
            0,
        ];
        // Adding default diffusion profile
        this.addDiffusionProfile(new Color3(1, 1, 1));
        this._scene = scene;
        SubSurfaceConfiguration._SceneComponentInitialization(this._scene);
    }
    /**
     * Adds a new diffusion profile.
     * Useful for more realistic subsurface scattering on diverse materials.
     * @param color The color of the diffusion profile. Should be the average color of the material.
     * @returns The index of the diffusion profile for the material subsurface configuration
     */
    addDiffusionProfile(color) {
        if (this.ssDiffusionD.length >= 5) {
            // We only suppport 5 diffusion profiles
            Logger.Error("You already reached the maximum number of diffusion profiles.");
            return 0; // default profile
        }
        // Do not add doubles
        for (let i = 0; i < this._ssDiffusionS.length / 3; i++) {
            if (this._ssDiffusionS[i * 3] === color.r && this._ssDiffusionS[i * 3 + 1] === color.g && this._ssDiffusionS[i * 3 + 2] === color.b) {
                return i;
            }
        }
        this._ssDiffusionS.push(color.r, color.b, color.g);
        this._ssDiffusionD.push(Math.max(Math.max(color.r, color.b), color.g));
        this._ssFilterRadii.push(this.getDiffusionProfileParameters(color));
        this.ssDiffusionProfileColors.push(color);
        return this._ssDiffusionD.length - 1;
    }
    /**
     * Creates the sss post process
     * @returns The created post process
     */
    createPostProcess() {
        this.postProcess = new SubSurfaceScatteringPostProcess("subSurfaceScattering", this._scene, 1, null, undefined, this._scene.getEngine());
        this.postProcess.autoClear = false;
        return this.postProcess;
    }
    /**
     * Deletes all diffusion profiles.
     * Note that in order to render subsurface scattering, you should have at least 1 diffusion profile.
     */
    clearAllDiffusionProfiles() {
        this._ssDiffusionD = [];
        this._ssDiffusionS = [];
        this._ssFilterRadii = [];
        this.ssDiffusionProfileColors = [];
    }
    /**
     * Disposes this object
     */
    dispose() {
        this.clearAllDiffusionProfiles();
        if (this.postProcess) {
            this.postProcess.dispose();
        }
    }
    /**
     * @internal
     * https://zero-radiance.github.io/post/sampling-diffusion/
     *
     * Importance sample the normalized diffuse reflectance profile for the computed value of 's'.
     * ------------------------------------------------------------------------------------
     * R[r, phi, s]   = s * (Exp[-r * s] + Exp[-r * s / 3]) / (8 * Pi * r)
     * PDF[r, phi, s] = r * R[r, phi, s]
     * CDF[r, s]      = 1 - 1/4 * Exp[-r * s] - 3/4 * Exp[-r * s / 3]
     * ------------------------------------------------------------------------------------
     * We importance sample the color channel with the widest scattering distance.
     */
    getDiffusionProfileParameters(color) {
        const cdf = 0.997;
        const maxScatteringDistance = Math.max(color.r, color.g, color.b);
        return this._sampleBurleyDiffusionProfile(cdf, maxScatteringDistance);
    }
    /**
     * Performs sampling of a Normalized Burley diffusion profile in polar coordinates.
     * 'u' is the random number (the value of the CDF): [0, 1).
     * rcp(s) = 1 / ShapeParam = ScatteringDistance.
     * Returns the sampled radial distance, s.t. (u = 0 -> r = 0) and (u = 1 -> r = Inf).
     * @param u
     * @param rcpS
     * @returns The sampled radial distance
     */
    _sampleBurleyDiffusionProfile(u, rcpS) {
        u = 1 - u; // Convert CDF to CCDF
        const g = 1 + 4 * u * (2 * u + Math.sqrt(1 + 4 * u * u));
        const n = Math.pow(g, -1.0 / 3.0); // g^(-1/3)
        const p = g * n * n; // g^(+1/3)
        const c = 1 + p + n; // 1 + g^(+1/3) + g^(-1/3)
        const x = 3 * Math.log(c / (4 * u));
        return x * rcpS;
    }
}
/**
 * @internal
 */
SubSurfaceConfiguration._SceneComponentInitialization = (_) => {
    throw _WarnImport("SubSurfaceSceneComponent");
};
//# sourceMappingURL=subSurfaceConfiguration.js.map