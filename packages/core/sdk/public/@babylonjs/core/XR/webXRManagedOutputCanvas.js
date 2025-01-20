import { Observable } from "../Misc/observable.js";
import { Tools } from "../Misc/tools.js";
import { WebXRWebGLLayerWrapper } from "./webXRWebGLLayer.js";
/**
 * Configuration object for WebXR output canvas
 */
export class WebXRManagedOutputCanvasOptions {
    /**
     * Get the default values of the configuration object
     * @param engine defines the engine to use (can be null)
     * @returns default values of this configuration object
     */
    static GetDefaults(engine) {
        const defaults = new WebXRManagedOutputCanvasOptions();
        defaults.canvasOptions = {
            antialias: true,
            depth: true,
            stencil: engine ? engine.isStencilEnable : true,
            alpha: true,
            framebufferScaleFactor: 1,
        };
        defaults.newCanvasCssStyle = "position:absolute; bottom:0px;right:0px;z-index:10;width:90%;height:100%;background-color: #000000;";
        return defaults;
    }
}
/**
 * Creates a canvas that is added/removed from the webpage when entering/exiting XR
 */
export class WebXRManagedOutputCanvas {
    /**
     * Initializes the canvas to be added/removed upon entering/exiting xr
     * @param _xrSessionManager The XR Session manager
     * @param _options optional configuration for this canvas output. defaults will be used if not provided
     */
    constructor(_xrSessionManager, _options = WebXRManagedOutputCanvasOptions.GetDefaults()) {
        this._options = _options;
        this._canvas = null;
        this._engine = null;
        /**
         * xr layer for the canvas
         */
        this.xrLayer = null;
        this._xrLayerWrapper = null;
        /**
         * Observers registered here will be triggered when the xr layer was initialized
         */
        this.onXRLayerInitObservable = new Observable();
        this._engine = _xrSessionManager.scene.getEngine();
        this._engine.onDisposeObservable.addOnce(() => {
            this._engine = null;
        });
        if (!_options.canvasElement) {
            const canvas = document.createElement("canvas");
            canvas.style.cssText = this._options.newCanvasCssStyle || "position:absolute; bottom:0px;right:0px;";
            this._setManagedOutputCanvas(canvas);
        }
        else {
            this._setManagedOutputCanvas(_options.canvasElement);
        }
        _xrSessionManager.onXRSessionInit.add(() => {
            this._addCanvas();
        });
        _xrSessionManager.onXRSessionEnded.add(() => {
            this._removeCanvas();
        });
        this._makeCanvasCompatibleAsync();
    }
    /**
     * Disposes of the object
     */
    dispose() {
        this._removeCanvas();
        this._setManagedOutputCanvas(null);
        this.onXRLayerInitObservable.clear();
    }
    _makeCanvasCompatibleAsync() {
        this._canvasCompatiblePromise = new Promise((resolve, reject) => {
            // stay safe - make sure the context has the function
            try {
                if (this.canvasContext && this.canvasContext.makeXRCompatible) {
                    this.canvasContext.makeXRCompatible().then(() => {
                        resolve();
                    }, () => {
                        // fail silently
                        Tools.Warn("Error executing makeXRCompatible. This does not mean that the session will work incorrectly.");
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            }
            catch (e) {
                // if this fails - the exception will be caught and the promise will be rejected
                reject(e);
            }
        });
    }
    /**
     * Initializes a XRWebGLLayer to be used as the session's baseLayer.
     * @param xrSession xr session
     * @returns a promise that will resolve once the XR Layer has been created
     */
    async initializeXRLayerAsync(xrSession) {
        const createLayer = () => {
            this.xrLayer = new XRWebGLLayer(xrSession, this.canvasContext, this._options.canvasOptions);
            this._xrLayerWrapper = new WebXRWebGLLayerWrapper(this.xrLayer);
            this.onXRLayerInitObservable.notifyObservers(this.xrLayer);
            return this.xrLayer;
        };
        return this._canvasCompatiblePromise
            .then(
        // catch any error and continue. When using the emulator is throws this error for no apparent reason.
        () => { }, () => { })
            .then(() => {
            return createLayer();
        });
    }
    _addCanvas() {
        if (this._canvas && this._engine && this._canvas !== this._engine.getRenderingCanvas()) {
            document.body.appendChild(this._canvas);
        }
        if (this.xrLayer) {
            this._setCanvasSize(true);
        }
        else {
            this.onXRLayerInitObservable.addOnce(() => {
                this._setCanvasSize(true);
            });
        }
    }
    _removeCanvas() {
        if (this._canvas && this._engine && document.body.contains(this._canvas) && this._canvas !== this._engine.getRenderingCanvas()) {
            document.body.removeChild(this._canvas);
        }
        this._setCanvasSize(false);
    }
    _setCanvasSize(init = true, xrLayer = this._xrLayerWrapper) {
        if (!this._canvas || !this._engine) {
            return;
        }
        if (init) {
            if (xrLayer) {
                if (this._canvas !== this._engine.getRenderingCanvas()) {
                    this._canvas.style.width = xrLayer.getWidth() + "px";
                    this._canvas.style.height = xrLayer.getHeight() + "px";
                }
                else {
                    this._engine.setSize(xrLayer.getWidth(), xrLayer.getHeight());
                }
            }
        }
        else {
            if (this._originalCanvasSize) {
                if (this._canvas !== this._engine.getRenderingCanvas()) {
                    this._canvas.style.width = this._originalCanvasSize.width + "px";
                    this._canvas.style.height = this._originalCanvasSize.height + "px";
                }
                else {
                    this._engine.setSize(this._originalCanvasSize.width, this._originalCanvasSize.height);
                }
            }
        }
    }
    _setManagedOutputCanvas(canvas) {
        this._removeCanvas();
        if (!canvas) {
            this._canvas = null;
            this.canvasContext = null;
        }
        else {
            this._originalCanvasSize = {
                width: canvas.offsetWidth,
                height: canvas.offsetHeight,
            };
            this._canvas = canvas;
            this.canvasContext = this._canvas.getContext("webgl2");
            if (!this.canvasContext) {
                this.canvasContext = this._canvas.getContext("webgl");
            }
        }
    }
}
//# sourceMappingURL=webXRManagedOutputCanvas.js.map