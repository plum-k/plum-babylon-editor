import { TransformNode } from "../Meshes/transformNode.js";
import { Mesh } from "../Meshes/mesh.js";
import { Texture } from "../Materials/Textures/texture.js";
import { BackgroundMaterial } from "../Materials/Background/backgroundMaterial.js";
import { CreateSphere } from "../Meshes/Builders/sphereBuilder.js";
import { Observable } from "../Misc/observable.js";
import { Vector3 } from "../Maths/math.vector.js";
import { Axis } from "../Maths/math.js";
/**
 * Display a 360/180 degree texture on an approximately spherical surface, useful for VR applications or skyboxes.
 * As a subclass of TransformNode, this allow parenting to the camera or multiple textures with different locations in the scene.
 * This class achieves its effect with a Texture and a correctly configured BackgroundMaterial on an inverted sphere.
 * Potential additions to this helper include zoom and and non-infinite distance rendering effects.
 */
export class TextureDome extends TransformNode {
    /**
     * Gets the texture being displayed on the sphere
     */
    get texture() {
        return this._texture;
    }
    /**
     * Sets the texture being displayed on the sphere
     */
    set texture(newTexture) {
        if (this._texture === newTexture) {
            return;
        }
        this._texture = newTexture;
        if (this._useDirectMapping) {
            this._texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._material.diffuseTexture = this._texture;
        }
        else {
            this._texture.coordinatesMode = Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE; // matches orientation
            this._texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._material.reflectionTexture = this._texture;
        }
        this._changeTextureMode(this._textureMode);
    }
    /**
     * Gets the mesh used for the dome.
     */
    get mesh() {
        return this._mesh;
    }
    /**
     * The current fov(field of view) multiplier, 0.0 - 2.0. Defaults to 1.0. Lower values "zoom in" and higher values "zoom out".
     * Also see the options.resolution property.
     */
    get fovMultiplier() {
        return this._material.fovMultiplier;
    }
    set fovMultiplier(value) {
        this._material.fovMultiplier = value;
    }
    /**
     * Gets or set the current texture mode for the texture. It can be:
     * * TextureDome.MODE_MONOSCOPIC : Define the texture source as a Monoscopic panoramic 360.
     * * TextureDome.MODE_TOPBOTTOM  : Define the texture source as a Stereoscopic TopBottom/OverUnder panoramic 360.
     * * TextureDome.MODE_SIDEBYSIDE : Define the texture source as a Stereoscopic Side by Side panoramic 360.
     */
    get textureMode() {
        return this._textureMode;
    }
    /**
     * Sets the current texture mode for the texture. It can be:
     * * TextureDome.MODE_MONOSCOPIC : Define the texture source as a Monoscopic panoramic 360.
     * * TextureDome.MODE_TOPBOTTOM  : Define the texture source as a Stereoscopic TopBottom/OverUnder panoramic 360.
     * * TextureDome.MODE_SIDEBYSIDE : Define the texture source as a Stereoscopic Side by Side panoramic 360.
     */
    set textureMode(value) {
        if (this._textureMode === value) {
            return;
        }
        this._changeTextureMode(value);
    }
    /**
     * Is it a 180 degrees dome (half dome) or 360 texture (full dome)
     */
    get halfDome() {
        return this._halfDome;
    }
    /**
     * Set the halfDome mode. If set, only the front (180 degrees) will be displayed and the back will be blacked out.
     */
    set halfDome(enabled) {
        this._halfDome = enabled;
        this._halfDomeMask.setEnabled(enabled);
        this._changeTextureMode(this._textureMode);
    }
    /**
     * Set the cross-eye mode. If set, images that can be seen when crossing eyes will render correctly
     */
    set crossEye(enabled) {
        this._crossEye = enabled;
        this._changeTextureMode(this._textureMode);
    }
    /**
     * Is it a cross-eye texture?
     */
    get crossEye() {
        return this._crossEye;
    }
    /**
     * The background material of this dome.
     */
    get material() {
        return this._material;
    }
    /**
     * Create an instance of this class and pass through the parameters to the relevant classes- Texture, StandardMaterial, and Mesh.
     * @param name Element's name, child elements will append suffixes for their own names.
     * @param textureUrlOrElement defines the url(s) or the (video) HTML element to use
     * @param options An object containing optional or exposed sub element properties
     * @param options.resolution
     * @param options.clickToPlay
     * @param options.autoPlay
     * @param options.loop
     * @param options.size
     * @param options.poster
     * @param options.faceForward
     * @param options.useDirectMapping
     * @param options.halfDomeMode
     * @param options.crossEyeMode
     * @param options.generateMipMaps
     * @param options.mesh
     * @param scene
     * @param onError
     */
    constructor(name, textureUrlOrElement, options, scene, 
    // eslint-disable-next-line @typescript-eslint/naming-convention
    onError = null) {
        super(name, scene);
        this.onError = onError;
        this._halfDome = false;
        this._crossEye = false;
        this._useDirectMapping = false;
        this._textureMode = TextureDome.MODE_MONOSCOPIC;
        /**
         * Oberserver used in Stereoscopic VR Mode.
         */
        this._onBeforeCameraRenderObserver = null;
        /**
         * Observable raised when an error occurred while loading the texture
         */
        this.onLoadErrorObservable = new Observable();
        /**
         * Observable raised when the texture finished loading
         */
        this.onLoadObservable = new Observable();
        scene = this.getScene();
        // set defaults and manage values
        name = name || "textureDome";
        options.resolution = Math.abs(options.resolution) | 0 || 32;
        options.clickToPlay = Boolean(options.clickToPlay);
        options.autoPlay = options.autoPlay === undefined ? true : Boolean(options.autoPlay);
        options.loop = options.loop === undefined ? true : Boolean(options.loop);
        options.size = Math.abs(options.size) || (scene.activeCamera ? scene.activeCamera.maxZ * 0.48 : 1000);
        if (options.useDirectMapping === undefined) {
            this._useDirectMapping = true;
        }
        else {
            this._useDirectMapping = options.useDirectMapping;
        }
        if (options.faceForward === undefined) {
            options.faceForward = true;
        }
        this._setReady(false);
        if (!options.mesh) {
            this._mesh = CreateSphere(name + "_mesh", { segments: options.resolution, diameter: options.size, updatable: false, sideOrientation: Mesh.BACKSIDE }, scene);
        }
        else {
            this._mesh = options.mesh;
        }
        // configure material
        const material = (this._material = new BackgroundMaterial(name + "_material", scene));
        material.useEquirectangularFOV = true;
        material.fovMultiplier = 1.0;
        material.opacityFresnel = false;
        const texture = this._initTexture(textureUrlOrElement, scene, options);
        this.texture = texture;
        // configure mesh
        this._mesh.material = material;
        this._mesh.parent = this;
        // create a (disabled until needed) mask to cover unneeded segments of 180 texture.
        this._halfDomeMask = CreateSphere("", { slice: 0.5, diameter: options.size * 0.98, segments: options.resolution * 2, sideOrientation: Mesh.BACKSIDE }, scene);
        this._halfDomeMask.rotate(Axis.X, -Math.PI / 2);
        // set the parent, so it will always be positioned correctly AND will be disposed when the main sphere is disposed
        this._halfDomeMask.parent = this._mesh;
        this._halfDome = !!options.halfDomeMode;
        // enable or disable according to the settings
        this._halfDomeMask.setEnabled(this._halfDome);
        this._crossEye = !!options.crossEyeMode;
        // create
        this._texture.anisotropicFilteringLevel = 1;
        this._texture.onLoadObservable.addOnce(() => {
            this._setReady(true);
        });
        // Initial rotation
        if (options.faceForward && scene.activeCamera) {
            const camera = scene.activeCamera;
            const forward = Vector3.Forward();
            const direction = Vector3.TransformNormal(forward, camera.getViewMatrix());
            direction.normalize();
            this.rotation.y = Math.acos(Vector3.Dot(forward, direction));
        }
        this._changeTextureMode(this._textureMode);
    }
    _changeTextureMode(value) {
        this._scene.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
        this._textureMode = value;
        // Default Setup and Reset.
        this._texture.uScale = 1;
        this._texture.vScale = 1;
        this._texture.uOffset = 0;
        this._texture.vOffset = 0;
        this._texture.vAng = 0;
        switch (value) {
            case TextureDome.MODE_MONOSCOPIC:
                if (this._halfDome) {
                    this._texture.uScale = 2;
                    this._texture.uOffset = -1;
                }
                break;
            case TextureDome.MODE_SIDEBYSIDE: {
                // in half-dome mode the uScale should be double of 360 texture
                // Use 0.99999 to boost perf by not switching program
                this._texture.uScale = this._halfDome ? 0.99999 : 0.5;
                const rightOffset = this._halfDome ? 0.0 : 0.5;
                const leftOffset = this._halfDome ? -0.5 : 0.0;
                this._onBeforeCameraRenderObserver = this._scene.onBeforeCameraRenderObservable.add((camera) => {
                    let isRightCamera = camera.isRightCamera;
                    if (this._crossEye) {
                        isRightCamera = !isRightCamera;
                    }
                    if (isRightCamera) {
                        this._texture.uOffset = rightOffset;
                    }
                    else {
                        this._texture.uOffset = leftOffset;
                    }
                });
                break;
            }
            case TextureDome.MODE_TOPBOTTOM:
                // in half-dome mode the vScale should be double of 360 texture
                // Use 0.99999 to boost perf by not switching program
                this._texture.vScale = this._halfDome ? 0.99999 : 0.5;
                this._onBeforeCameraRenderObserver = this._scene.onBeforeCameraRenderObservable.add((camera) => {
                    let isRightCamera = camera.isRightCamera;
                    // allow "cross-eye" if left and right were switched in this mode
                    if (this._crossEye) {
                        isRightCamera = !isRightCamera;
                    }
                    this._texture.vOffset = isRightCamera ? 0.5 : 0.0;
                });
                break;
        }
    }
    /**
     * Releases resources associated with this node.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    dispose(doNotRecurse, disposeMaterialAndTextures = false) {
        this._texture.dispose();
        this._mesh.dispose();
        this._material.dispose();
        this._scene.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
        this.onLoadErrorObservable.clear();
        this.onLoadObservable.clear();
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
}
/**
 * Define the source as a Monoscopic panoramic 360/180.
 */
TextureDome.MODE_MONOSCOPIC = 0;
/**
 * Define the source as a Stereoscopic TopBottom/OverUnder panoramic 360/180.
 */
TextureDome.MODE_TOPBOTTOM = 1;
/**
 * Define the source as a Stereoscopic Side by Side panoramic 360/180.
 */
TextureDome.MODE_SIDEBYSIDE = 2;
//# sourceMappingURL=textureDome.js.map