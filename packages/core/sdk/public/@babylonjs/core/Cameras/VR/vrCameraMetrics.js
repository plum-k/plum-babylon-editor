import { Matrix } from "../../Maths/math.vector.js";
/**
 * This represents all the required metrics to create a VR camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#device-orientation-camera
 */
export class VRCameraMetrics {
    constructor() {
        /**
         * Define if the current vr camera should compensate the distortion of the lens or not.
         */
        this.compensateDistortion = true;
        /**
         * Defines if multiview should be enabled when rendering (Default: false)
         */
        this.multiviewEnabled = false;
    }
    /**
     * Gets the rendering aspect ratio based on the provided resolutions.
     */
    get aspectRatio() {
        return this.hResolution / (2 * this.vResolution);
    }
    /**
     * Gets the aspect ratio based on the FOV, scale factors, and real screen sizes.
     */
    get aspectRatioFov() {
        return 2 * Math.atan((this.postProcessScaleFactor * this.vScreenSize) / (2 * this.eyeToScreenDistance));
    }
    /**
     * @internal
     */
    get leftHMatrix() {
        const meters = this.hScreenSize / 4 - this.lensSeparationDistance / 2;
        const h = (4 * meters) / this.hScreenSize;
        return Matrix.Translation(h, 0, 0);
    }
    /**
     * @internal
     */
    get rightHMatrix() {
        const meters = this.hScreenSize / 4 - this.lensSeparationDistance / 2;
        const h = (4 * meters) / this.hScreenSize;
        return Matrix.Translation(-h, 0, 0);
    }
    /**
     * @internal
     */
    get leftPreViewMatrix() {
        return Matrix.Translation(0.5 * this.interpupillaryDistance, 0, 0);
    }
    /**
     * @internal
     */
    get rightPreViewMatrix() {
        return Matrix.Translation(-0.5 * this.interpupillaryDistance, 0, 0);
    }
    /**
     * Get the default VRMetrics based on the most generic setup.
     * @returns the default vr metrics
     */
    static GetDefault() {
        const result = new VRCameraMetrics();
        result.hResolution = 1280;
        result.vResolution = 800;
        result.hScreenSize = 0.149759993;
        result.vScreenSize = 0.0935999975;
        result.vScreenCenter = 0.0467999987;
        result.eyeToScreenDistance = 0.0410000011;
        result.lensSeparationDistance = 0.063500002;
        result.interpupillaryDistance = 0.064000003;
        result.distortionK = [1.0, 0.219999999, 0.239999995, 0.0];
        result.chromaAbCorrection = [0.995999992, -0.00400000019, 1.01400006, 0.0];
        result.postProcessScaleFactor = 1.714605507808412;
        result.lensCenterOffset = 0.151976421;
        return result;
    }
}
//# sourceMappingURL=vrCameraMetrics.js.map