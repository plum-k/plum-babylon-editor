import { BaseTexture } from "../../Materials/Textures/baseTexture.js";

import { Matrix } from "../../Maths/math.vector.js";
import { Observable } from "../../Misc/observable.js";
import "../../Engines/Extensions/engine.dynamicTexture.js";
import "../../Engines/Extensions/engine.videoTexture.js";
/**
 * This represents the smallest workload to use an already existing element (Canvas or Video) as a texture.
 * To be as efficient as possible depending on your constraints nothing aside the first upload
 * is automatically managed.
 * It is a cheap VideoTexture or DynamicTexture if you prefer to keep full control of the elements
 * in your application.
 *
 * As the update is not automatic, you need to call them manually.
 */
export class HtmlElementTexture extends BaseTexture {
    /**
     * Instantiates a HtmlElementTexture from the following parameters.
     *
     * @param name Defines the name of the texture
     * @param element Defines the video or canvas the texture is filled with
     * @param options Defines the other none mandatory texture creation options
     */
    constructor(name, element, options) {
        super(options.scene || options.engine);
        /**
         * Observable triggered once the texture has been loaded.
         */
        this.onLoadObservable = new Observable();
        if (!element || (!options.engine && !options.scene)) {
            return;
        }
        options = {
            ...HtmlElementTexture._DefaultOptions,
            ...options,
        };
        this._generateMipMaps = options.generateMipMaps;
        this._samplingMode = options.samplingMode;
        this._textureMatrix = Matrix.Identity();
        this._format = options.format;
        this.name = name;
        this.element = element;
        this._isVideo = !!element.getVideoPlaybackQuality;
        if (this._isVideo) {
            const engineWebGPU = this._engine;
            const createExternalTexture = engineWebGPU?.createExternalTexture;
            if (createExternalTexture) {
                this._externalTexture = createExternalTexture.call(engineWebGPU, element);
            }
        }
        this.anisotropicFilteringLevel = 1;
        this._createInternalTexture();
    }
    _createInternalTexture() {
        let width = 0;
        let height = 0;
        if (this._isVideo) {
            width = this.element.videoWidth;
            height = this.element.videoHeight;
        }
        else {
            width = this.element.width;
            height = this.element.height;
        }
        const engine = this._getEngine();
        if (engine) {
            this._texture = engine.createDynamicTexture(width, height, this._generateMipMaps, this._samplingMode);
            this._texture.format = this._format;
        }
        this.update();
    }
    /**
     * @returns the texture matrix used in most of the material.
     */
    getTextureMatrix() {
        return this._textureMatrix;
    }
    /**
     * Updates the content of the texture.
     * @param invertY Defines whether the texture should be inverted on Y (false by default on video and true on canvas)
     */
    update(invertY = null) {
        const engine = this._getEngine();
        if (this._texture == null || engine == null) {
            return;
        }
        const wasReady = this.isReady();
        if (this._isVideo) {
            const videoElement = this.element;
            if (videoElement.readyState < videoElement.HAVE_CURRENT_DATA) {
                return;
            }
            engine.updateVideoTexture(this._texture, this._externalTexture ? this._externalTexture : videoElement, invertY === null ? true : invertY);
        }
        else {
            const canvasElement = this.element;
            engine.updateDynamicTexture(this._texture, canvasElement, invertY === null ? true : invertY, false, this._format);
        }
        if (!wasReady && this.isReady()) {
            this.onLoadObservable.notifyObservers(this);
        }
    }
    /**
     * Dispose the texture and release its associated resources.
     */
    dispose() {
        this.onLoadObservable.clear();
        super.dispose();
    }
}
HtmlElementTexture._DefaultOptions = {
    generateMipMaps: false,
    samplingMode: 2,
    format: 5,
    engine: null,
    scene: null,
};
//# sourceMappingURL=htmlElementTexture.js.map