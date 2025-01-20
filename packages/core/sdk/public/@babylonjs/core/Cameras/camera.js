import { __decorate } from "../tslib.es6.js";
import { serialize, serializeAsVector3 } from "../Misc/decorators.js";
import { SmartArray } from "../Misc/smartArray.js";
import { Tools } from "../Misc/tools.js";
import { Observable } from "../Misc/observable.js";
import { Matrix, Vector3, Quaternion } from "../Maths/math.vector.js";
import { Node } from "../node.js";
import { Logger } from "../Misc/logger.js";
import { GetClass } from "../Misc/typeStore.js";
import { _WarnImport } from "../Misc/devTools.js";
import { Viewport } from "../Maths/math.viewport.js";
import { Frustum } from "../Maths/math.frustum.js";

import { SerializationHelper } from "../Misc/decorators.serialization.js";
/**
 * This is the base class of all the camera used in the application.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
 */
export class Camera extends Node {
    /**
     * Define the current local position of the camera in the scene
     */
    get position() {
        return this._position;
    }
    set position(newPosition) {
        this._position = newPosition;
    }
    /**
     * The vector the camera should consider as up.
     * (default is Vector3(0, 1, 0) aka Vector3.Up())
     */
    set upVector(vec) {
        this._upVector = vec;
    }
    get upVector() {
        return this._upVector;
    }
    /**
     * The screen area in scene units squared
     */
    get screenArea() {
        let x = 0;
        let y = 0;
        if (this.mode === Camera.PERSPECTIVE_CAMERA) {
            if (this.fovMode === Camera.FOVMODE_VERTICAL_FIXED) {
                y = this.minZ * 2 * Math.tan(this.fov / 2);
                x = this.getEngine().getAspectRatio(this) * y;
            }
            else {
                x = this.minZ * 2 * Math.tan(this.fov / 2);
                y = x / this.getEngine().getAspectRatio(this);
            }
        }
        else {
            const halfWidth = this.getEngine().getRenderWidth() / 2.0;
            const halfHeight = this.getEngine().getRenderHeight() / 2.0;
            x = (this.orthoRight ?? halfWidth) - (this.orthoLeft ?? -halfWidth);
            y = (this.orthoTop ?? halfHeight) - (this.orthoBottom ?? -halfHeight);
        }
        return x * y;
    }
    /**
     * Define the current limit on the left side for an orthographic camera
     * In scene unit
     */
    set orthoLeft(value) {
        this._orthoLeft = value;
        for (const rigCamera of this._rigCameras) {
            rigCamera.orthoLeft = value;
        }
    }
    get orthoLeft() {
        return this._orthoLeft;
    }
    /**
     * Define the current limit on the right side for an orthographic camera
     * In scene unit
     */
    set orthoRight(value) {
        this._orthoRight = value;
        for (const rigCamera of this._rigCameras) {
            rigCamera.orthoRight = value;
        }
    }
    get orthoRight() {
        return this._orthoRight;
    }
    /**
     * Define the current limit on the bottom side for an orthographic camera
     * In scene unit
     */
    set orthoBottom(value) {
        this._orthoBottom = value;
        for (const rigCamera of this._rigCameras) {
            rigCamera.orthoBottom = value;
        }
    }
    get orthoBottom() {
        return this._orthoBottom;
    }
    /**
     * Define the current limit on the top side for an orthographic camera
     * In scene unit
     */
    set orthoTop(value) {
        this._orthoTop = value;
        for (const rigCamera of this._rigCameras) {
            rigCamera.orthoTop = value;
        }
    }
    get orthoTop() {
        return this._orthoTop;
    }
    /**
     * Define the mode of the camera (Camera.PERSPECTIVE_CAMERA or Camera.ORTHOGRAPHIC_CAMERA)
     */
    set mode(mode) {
        this._mode = mode;
        // Pass the mode down to the rig cameras
        for (const rigCamera of this._rigCameras) {
            rigCamera.mode = mode;
        }
    }
    get mode() {
        return this._mode;
    }
    /**
     * Gets a flag indicating that the camera has moved in some way since the last call to Camera.update()
     */
    get hasMoved() {
        return this._hasMoved;
    }
    /**
     * Instantiates a new camera object.
     * This should not be used directly but through the inherited cameras: ArcRotate, Free...
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
     * @param name Defines the name of the camera in the scene
     * @param position Defines the position of the camera
     * @param scene Defines the scene the camera belongs too
     * @param setActiveOnSceneIfNoneActive Defines if the camera should be set as active after creation if no other camera have been defined in the scene
     */
    constructor(name, position, scene, setActiveOnSceneIfNoneActive = true) {
        super(name, scene, false);
        /** @internal */
        this._position = Vector3.Zero();
        this._upVector = Vector3.Up();
        /**
         * Object containing oblique projection values (only used with ORTHOGRAPHIC_CAMERA)
         */
        this.oblique = null;
        this._orthoLeft = null;
        this._orthoRight = null;
        this._orthoBottom = null;
        this._orthoTop = null;
        /**
         * Field Of View is set in Radians. (default is 0.8)
         */
        this.fov = 0.8;
        /**
         * Projection plane tilt around the X axis (horizontal), set in Radians. (default is 0)
         * Can be used to make vertical lines in world space actually vertical on the screen.
         * See https://forum.babylonjs.com/t/add-vertical-shift-to-3ds-max-exporter-babylon-cameras/17480
         */
        this.projectionPlaneTilt = 0;
        /**
         * Define the minimum distance the camera can see from.
         * This is important to note that the depth buffer are not infinite and the closer it starts
         * the more your scene might encounter depth fighting issue.
         */
        this.minZ = 1;
        /**
         * Define the maximum distance the camera can see to.
         * This is important to note that the depth buffer are not infinite and the further it end
         * the more your scene might encounter depth fighting issue.
         */
        this.maxZ = 10000.0;
        /**
         * Define the default inertia of the camera.
         * This helps giving a smooth feeling to the camera movement.
         */
        this.inertia = 0.9;
        this._mode = Camera.PERSPECTIVE_CAMERA;
        /**
         * Define whether the camera is intermediate.
         * This is useful to not present the output directly to the screen in case of rig without post process for instance
         */
        this.isIntermediate = false;
        /**
         * Define the viewport of the camera.
         * This correspond to the portion of the screen the camera will render to in normalized 0 to 1 unit.
         */
        this.viewport = new Viewport(0, 0, 1.0, 1.0);
        /**
         * Restricts the camera to viewing objects with the same layerMask.
         * A camera with a layerMask of 1 will render mesh.layerMask & camera.layerMask!== 0
         */
        this.layerMask = 0x0fffffff;
        /**
         * fovMode sets the camera frustum bounds to the viewport bounds. (default is FOVMODE_VERTICAL_FIXED)
         */
        this.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
        /**
         * Rig mode of the camera.
         * This is useful to create the camera with two "eyes" instead of one to create VR or stereoscopic scenes.
         * This is normally controlled byt the camera themselves as internal use.
         */
        this.cameraRigMode = Camera.RIG_MODE_NONE;
        /**
         * Defines the list of custom render target which are rendered to and then used as the input to this camera's render. Eg. display another camera view on a TV in the main scene
         * This is pretty helpful if you wish to make a camera render to a texture you could reuse somewhere
         * else in the scene. (Eg. security camera)
         *
         * To change the final output target of the camera, camera.outputRenderTarget should be used instead (eg. webXR renders to a render target corresponding to an HMD)
         */
        this.customRenderTargets = [];
        /**
         * When set, the camera will render to this render target instead of the default canvas
         *
         * If the desire is to use the output of a camera as a texture in the scene consider using camera.customRenderTargets instead
         */
        this.outputRenderTarget = null;
        /**
         * Observable triggered when the camera view matrix has changed.
         * Beware of reentrance! Some methods like Camera.getViewMatrix and Camera.getWorldMatrix can trigger the onViewMatrixChangedObservable
         * observable, so using them inside an observer will require additional logic to avoid a stack overflow error.
         */
        this.onViewMatrixChangedObservable = new Observable();
        /**
         * Observable triggered when the camera Projection matrix has changed.
         */
        this.onProjectionMatrixChangedObservable = new Observable();
        /**
         * Observable triggered when the inputs have been processed.
         */
        this.onAfterCheckInputsObservable = new Observable();
        /**
         * Observable triggered when reset has been called and applied to the camera.
         */
        this.onRestoreStateObservable = new Observable();
        /**
         * Is this camera a part of a rig system?
         */
        this.isRigCamera = false;
        this._hasMoved = false;
        /** @internal */
        this._rigCameras = new Array();
        /** @internal */
        this._skipRendering = false;
        /** @internal */
        this._projectionMatrix = new Matrix();
        /** @internal */
        this._postProcesses = new Array();
        /** @internal */
        this._activeMeshes = new SmartArray(256);
        this._globalPosition = Vector3.Zero();
        /** @internal */
        this._computedViewMatrix = Matrix.Identity();
        this._doNotComputeProjectionMatrix = false;
        this._transformMatrix = Matrix.Zero();
        this._refreshFrustumPlanes = true;
        this._absoluteRotation = Quaternion.Identity();
        /** @internal */
        this._isCamera = true;
        /** @internal */
        this._isLeftCamera = false;
        /** @internal */
        this._isRightCamera = false;
        this.getScene().addCamera(this);
        if (setActiveOnSceneIfNoneActive && !this.getScene().activeCamera) {
            this.getScene().activeCamera = this;
        }
        this.position = position;
        this.renderPassId = this.getScene().getEngine().createRenderPassId(`Camera ${name}`);
    }
    /**
     * Store current camera state (fov, position, etc..)
     * @returns the camera
     */
    storeState() {
        this._stateStored = true;
        this._storedFov = this.fov;
        return this;
    }
    /**
     * Returns true if a state has been stored by calling storeState method.
     * @returns true if state has been stored.
     */
    hasStateStored() {
        return !!this._stateStored;
    }
    /**
     * Restores the camera state values if it has been stored. You must call storeState() first
     * @returns true if restored and false otherwise
     */
    _restoreStateValues() {
        if (!this._stateStored) {
            return false;
        }
        this.fov = this._storedFov;
        return true;
    }
    /**
     * Restored camera state. You must call storeState() first.
     * @returns true if restored and false otherwise
     */
    restoreState() {
        if (this._restoreStateValues()) {
            this.onRestoreStateObservable.notifyObservers(this);
            return true;
        }
        return false;
    }
    /**
     * Gets the class name of the camera.
     * @returns the class name
     */
    getClassName() {
        return "Camera";
    }
    /**
     * Gets a string representation of the camera useful for debug purpose.
     * @param fullDetails Defines that a more verbose level of logging is required
     * @returns the string representation
     */
    toString(fullDetails) {
        let ret = "Name: " + this.name;
        ret += ", type: " + this.getClassName();
        if (this.animations) {
            for (let i = 0; i < this.animations.length; i++) {
                ret += ", animation[0]: " + this.animations[i].toString(fullDetails);
            }
        }
        return ret;
    }
    /**
     * Automatically tilts the projection plane, using `projectionPlaneTilt`, to correct the perspective effect on vertical lines.
     */
    applyVerticalCorrection() {
        const rot = this.absoluteRotation.toEulerAngles();
        this.projectionPlaneTilt = this._scene.useRightHandedSystem ? -rot.x : rot.x;
    }
    /**
     * Gets the current world space position of the camera.
     */
    get globalPosition() {
        return this._globalPosition;
    }
    /**
     * Gets the list of active meshes this frame (meshes no culled or excluded by lod s in the frame)
     * @returns the active meshe list
     */
    getActiveMeshes() {
        return this._activeMeshes;
    }
    /**
     * Check whether a mesh is part of the current active mesh list of the camera
     * @param mesh Defines the mesh to check
     * @returns true if active, false otherwise
     */
    isActiveMesh(mesh) {
        return this._activeMeshes.indexOf(mesh) !== -1;
    }
    /**
     * Is this camera ready to be used/rendered
     * @param completeCheck defines if a complete check (including post processes) has to be done (false by default)
     * @returns true if the camera is ready
     */
    isReady(completeCheck = false) {
        if (completeCheck) {
            for (const pp of this._postProcesses) {
                if (pp && !pp.isReady()) {
                    return false;
                }
            }
        }
        return super.isReady(completeCheck);
    }
    /** @internal */
    _initCache() {
        super._initCache();
        this._cache.position = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._cache.upVector = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._cache.mode = undefined;
        this._cache.minZ = undefined;
        this._cache.maxZ = undefined;
        this._cache.fov = undefined;
        this._cache.fovMode = undefined;
        this._cache.aspectRatio = undefined;
        this._cache.orthoLeft = undefined;
        this._cache.orthoRight = undefined;
        this._cache.orthoBottom = undefined;
        this._cache.orthoTop = undefined;
        this._cache.obliqueAngle = undefined;
        this._cache.obliqueLength = undefined;
        this._cache.obliqueOffset = undefined;
        this._cache.renderWidth = undefined;
        this._cache.renderHeight = undefined;
    }
    /**
     * @internal
     */
    _updateCache(ignoreParentClass) {
        if (!ignoreParentClass) {
            super._updateCache();
        }
        this._cache.position.copyFrom(this.position);
        this._cache.upVector.copyFrom(this.upVector);
    }
    /** @internal */
    _isSynchronized() {
        return this._isSynchronizedViewMatrix() && this._isSynchronizedProjectionMatrix();
    }
    /** @internal */
    _isSynchronizedViewMatrix() {
        if (!super._isSynchronized()) {
            return false;
        }
        return this._cache.position.equals(this.position) && this._cache.upVector.equals(this.upVector) && this.isSynchronizedWithParent();
    }
    /** @internal */
    _isSynchronizedProjectionMatrix() {
        let isSynchronized = this._cache.mode === this.mode && this._cache.minZ === this.minZ && this._cache.maxZ === this.maxZ;
        if (!isSynchronized) {
            return false;
        }
        const engine = this.getEngine();
        if (this.mode === Camera.PERSPECTIVE_CAMERA) {
            isSynchronized =
                this._cache.fov === this.fov &&
                    this._cache.fovMode === this.fovMode &&
                    this._cache.aspectRatio === engine.getAspectRatio(this) &&
                    this._cache.projectionPlaneTilt === this.projectionPlaneTilt;
        }
        else {
            isSynchronized =
                this._cache.orthoLeft === this.orthoLeft &&
                    this._cache.orthoRight === this.orthoRight &&
                    this._cache.orthoBottom === this.orthoBottom &&
                    this._cache.orthoTop === this.orthoTop &&
                    this._cache.renderWidth === engine.getRenderWidth() &&
                    this._cache.renderHeight === engine.getRenderHeight();
            if (this.oblique) {
                isSynchronized =
                    isSynchronized &&
                        this._cache.obliqueAngle === this.oblique.angle &&
                        this._cache.obliqueLength === this.oblique.length &&
                        this._cache.obliqueOffset === this.oblique.offset;
            }
        }
        return isSynchronized;
    }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * This function is here because typescript removes the typing of the last function.
     * @param _ignored defines an ignored parameter kept for backward compatibility.
     * @param _noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    attachControl(_ignored, _noPreventDefault) { }
    /**
     * Detach the current controls from the specified dom element.
     * This function is here because typescript removes the typing of the last function.
     * @param _ignored defines an ignored parameter kept for backward compatibility.
     */
    detachControl(_ignored) { }
    /**
     * Update the camera state according to the different inputs gathered during the frame.
     */
    update() {
        this._hasMoved = false;
        this._checkInputs();
        if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
            this._updateRigCameras();
        }
        // Attempt to update the camera's view and projection matrices.
        // This call is being made because these matrices are no longer being updated
        // as a part of the picking ray process (in addition to scene.render).
        this.getViewMatrix();
        this.getProjectionMatrix();
    }
    /** @internal */
    _checkInputs() {
        this.onAfterCheckInputsObservable.notifyObservers(this);
    }
    /** @internal */
    get rigCameras() {
        return this._rigCameras;
    }
    /**
     * Gets the post process used by the rig cameras
     */
    get rigPostProcess() {
        return this._rigPostProcess;
    }
    /**
     * Internal, gets the first post process.
     * @returns the first post process to be run on this camera.
     */
    _getFirstPostProcess() {
        for (let ppIndex = 0; ppIndex < this._postProcesses.length; ppIndex++) {
            if (this._postProcesses[ppIndex] !== null) {
                return this._postProcesses[ppIndex];
            }
        }
        return null;
    }
    _cascadePostProcessesToRigCams() {
        // invalidate framebuffer
        const firstPostProcess = this._getFirstPostProcess();
        if (firstPostProcess) {
            firstPostProcess.markTextureDirty();
        }
        // glue the rigPostProcess to the end of the user postprocesses & assign to each sub-camera
        for (let i = 0, len = this._rigCameras.length; i < len; i++) {
            const cam = this._rigCameras[i];
            const rigPostProcess = cam._rigPostProcess;
            // for VR rig, there does not have to be a post process
            if (rigPostProcess) {
                const isPass = rigPostProcess.getEffectName() === "pass";
                if (isPass) {
                    // any rig which has a PassPostProcess for rig[0], cannot be isIntermediate when there are also user postProcesses
                    cam.isIntermediate = this._postProcesses.length === 0;
                }
                cam._postProcesses = this._postProcesses.slice(0).concat(rigPostProcess);
                rigPostProcess.markTextureDirty();
            }
            else {
                cam._postProcesses = this._postProcesses.slice(0);
            }
        }
    }
    /**
     * Attach a post process to the camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#attach-postprocess
     * @param postProcess The post process to attach to the camera
     * @param insertAt The position of the post process in case several of them are in use in the scene
     * @returns the position the post process has been inserted at
     */
    attachPostProcess(postProcess, insertAt = null) {
        if (!postProcess.isReusable() && this._postProcesses.indexOf(postProcess) > -1) {
            Logger.Error("You're trying to reuse a post process not defined as reusable.");
            return 0;
        }
        if (insertAt == null || insertAt < 0) {
            this._postProcesses.push(postProcess);
        }
        else if (this._postProcesses[insertAt] === null) {
            this._postProcesses[insertAt] = postProcess;
        }
        else {
            this._postProcesses.splice(insertAt, 0, postProcess);
        }
        this._cascadePostProcessesToRigCams(); // also ensures framebuffer invalidated
        // Update prePass
        if (this._scene.prePassRenderer) {
            this._scene.prePassRenderer.markAsDirty();
        }
        return this._postProcesses.indexOf(postProcess);
    }
    /**
     * Detach a post process to the camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#attach-postprocess
     * @param postProcess The post process to detach from the camera
     */
    detachPostProcess(postProcess) {
        const idx = this._postProcesses.indexOf(postProcess);
        if (idx !== -1) {
            this._postProcesses[idx] = null;
        }
        // Update prePass
        if (this._scene.prePassRenderer) {
            this._scene.prePassRenderer.markAsDirty();
        }
        this._cascadePostProcessesToRigCams(); // also ensures framebuffer invalidated
    }
    /**
     * Gets the current world matrix of the camera
     * @returns the world matrix
     */
    getWorldMatrix() {
        if (this._isSynchronizedViewMatrix()) {
            return this._worldMatrix;
        }
        // Getting the view matrix will also compute the world matrix.
        this.getViewMatrix();
        return this._worldMatrix;
    }
    /** @internal */
    _getViewMatrix() {
        return Matrix.Identity();
    }
    /**
     * Gets the current view matrix of the camera.
     * @param force forces the camera to recompute the matrix without looking at the cached state
     * @returns the view matrix
     */
    getViewMatrix(force) {
        if (!force && this._isSynchronizedViewMatrix()) {
            return this._computedViewMatrix;
        }
        this._hasMoved = true;
        this.updateCache();
        this._computedViewMatrix = this._getViewMatrix();
        this._currentRenderId = this.getScene().getRenderId();
        this._childUpdateId++;
        this._refreshFrustumPlanes = true;
        if (this._cameraRigParams && this._cameraRigParams.vrPreViewMatrix) {
            this._computedViewMatrix.multiplyToRef(this._cameraRigParams.vrPreViewMatrix, this._computedViewMatrix);
        }
        // Notify parent camera if rig camera is changed
        if (this.parent && this.parent.onViewMatrixChangedObservable) {
            this.parent.onViewMatrixChangedObservable.notifyObservers(this.parent);
        }
        this.onViewMatrixChangedObservable.notifyObservers(this);
        this._computedViewMatrix.invertToRef(this._worldMatrix);
        return this._computedViewMatrix;
    }
    /**
     * Freeze the projection matrix.
     * It will prevent the cache check of the camera projection compute and can speed up perf
     * if no parameter of the camera are meant to change
     * @param projection Defines manually a projection if necessary
     */
    freezeProjectionMatrix(projection) {
        this._doNotComputeProjectionMatrix = true;
        if (projection !== undefined) {
            this._projectionMatrix = projection;
        }
    }
    /**
     * Unfreeze the projection matrix if it has previously been freezed by freezeProjectionMatrix.
     */
    unfreezeProjectionMatrix() {
        this._doNotComputeProjectionMatrix = false;
    }
    /**
     * Gets the current projection matrix of the camera.
     * @param force forces the camera to recompute the matrix without looking at the cached state
     * @returns the projection matrix
     */
    getProjectionMatrix(force) {
        if (this._doNotComputeProjectionMatrix || (!force && this._isSynchronizedProjectionMatrix())) {
            return this._projectionMatrix;
        }
        // Cache
        this._cache.mode = this.mode;
        this._cache.minZ = this.minZ;
        this._cache.maxZ = this.maxZ;
        // Matrix
        this._refreshFrustumPlanes = true;
        const engine = this.getEngine();
        const scene = this.getScene();
        const reverseDepth = engine.useReverseDepthBuffer;
        if (this.mode === Camera.PERSPECTIVE_CAMERA) {
            this._cache.fov = this.fov;
            this._cache.fovMode = this.fovMode;
            this._cache.aspectRatio = engine.getAspectRatio(this);
            this._cache.projectionPlaneTilt = this.projectionPlaneTilt;
            if (this.minZ <= 0) {
                this.minZ = 0.1;
            }
            let getProjectionMatrix;
            if (scene.useRightHandedSystem) {
                getProjectionMatrix = Matrix.PerspectiveFovRHToRef;
            }
            else {
                getProjectionMatrix = Matrix.PerspectiveFovLHToRef;
            }
            getProjectionMatrix(this.fov, engine.getAspectRatio(this), reverseDepth ? this.maxZ : this.minZ, reverseDepth ? this.minZ : this.maxZ, this._projectionMatrix, this.fovMode === Camera.FOVMODE_VERTICAL_FIXED, engine.isNDCHalfZRange, this.projectionPlaneTilt, reverseDepth);
        }
        else {
            const halfWidth = engine.getRenderWidth() / 2.0;
            const halfHeight = engine.getRenderHeight() / 2.0;
            if (scene.useRightHandedSystem) {
                if (this.oblique) {
                    Matrix.ObliqueOffCenterRHToRef(this.orthoLeft ?? -halfWidth, this.orthoRight ?? halfWidth, this.orthoBottom ?? -halfHeight, this.orthoTop ?? halfHeight, reverseDepth ? this.maxZ : this.minZ, reverseDepth ? this.minZ : this.maxZ, this.oblique.length, this.oblique.angle, this._computeObliqueDistance(this.oblique.offset), this._projectionMatrix, engine.isNDCHalfZRange);
                }
                else {
                    Matrix.OrthoOffCenterRHToRef(this.orthoLeft ?? -halfWidth, this.orthoRight ?? halfWidth, this.orthoBottom ?? -halfHeight, this.orthoTop ?? halfHeight, reverseDepth ? this.maxZ : this.minZ, reverseDepth ? this.minZ : this.maxZ, this._projectionMatrix, engine.isNDCHalfZRange);
                }
            }
            else {
                if (this.oblique) {
                    Matrix.ObliqueOffCenterLHToRef(this.orthoLeft ?? -halfWidth, this.orthoRight ?? halfWidth, this.orthoBottom ?? -halfHeight, this.orthoTop ?? halfHeight, reverseDepth ? this.maxZ : this.minZ, reverseDepth ? this.minZ : this.maxZ, this.oblique.length, this.oblique.angle, this._computeObliqueDistance(this.oblique.offset), this._projectionMatrix, engine.isNDCHalfZRange);
                }
                else {
                    Matrix.OrthoOffCenterLHToRef(this.orthoLeft ?? -halfWidth, this.orthoRight ?? halfWidth, this.orthoBottom ?? -halfHeight, this.orthoTop ?? halfHeight, reverseDepth ? this.maxZ : this.minZ, reverseDepth ? this.minZ : this.maxZ, this._projectionMatrix, engine.isNDCHalfZRange);
                }
            }
            this._cache.orthoLeft = this.orthoLeft;
            this._cache.orthoRight = this.orthoRight;
            this._cache.orthoBottom = this.orthoBottom;
            this._cache.orthoTop = this.orthoTop;
            this._cache.obliqueAngle = this.oblique?.angle;
            this._cache.obliqueLength = this.oblique?.length;
            this._cache.obliqueOffset = this.oblique?.offset;
            this._cache.renderWidth = engine.getRenderWidth();
            this._cache.renderHeight = engine.getRenderHeight();
        }
        this.onProjectionMatrixChangedObservable.notifyObservers(this);
        return this._projectionMatrix;
    }
    /**
     * Gets the transformation matrix (ie. the multiplication of view by projection matrices)
     * @returns a Matrix
     */
    getTransformationMatrix() {
        this._computedViewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
        return this._transformMatrix;
    }
    _computeObliqueDistance(offset) {
        const arcRotateCamera = this;
        const targetCamera = this;
        return (arcRotateCamera.radius || (targetCamera.target ? Vector3.Distance(this.position, targetCamera.target) : this.position.length())) + offset;
    }
    /** @internal */
    _updateFrustumPlanes() {
        if (!this._refreshFrustumPlanes) {
            return;
        }
        this.getTransformationMatrix();
        if (!this._frustumPlanes) {
            this._frustumPlanes = Frustum.GetPlanes(this._transformMatrix);
        }
        else {
            Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
        }
        this._refreshFrustumPlanes = false;
    }
    /**
     * Checks if a cullable object (mesh...) is in the camera frustum
     * This checks the bounding box center. See isCompletelyInFrustum for a full bounding check
     * @param target The object to check
     * @param checkRigCameras If the rig cameras should be checked (eg. with VR camera both eyes should be checked) (Default: false)
     * @returns true if the object is in frustum otherwise false
     */
    isInFrustum(target, checkRigCameras = false) {
        this._updateFrustumPlanes();
        if (checkRigCameras && this.rigCameras.length > 0) {
            let result = false;
            this.rigCameras.forEach((cam) => {
                cam._updateFrustumPlanes();
                result = result || target.isInFrustum(cam._frustumPlanes);
            });
            return result;
        }
        else {
            return target.isInFrustum(this._frustumPlanes);
        }
    }
    /**
     * Checks if a cullable object (mesh...) is in the camera frustum
     * Unlike isInFrustum this checks the full bounding box
     * @param target The object to check
     * @returns true if the object is in frustum otherwise false
     */
    isCompletelyInFrustum(target) {
        this._updateFrustumPlanes();
        return target.isCompletelyInFrustum(this._frustumPlanes);
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Gets a ray in the forward direction from the camera.
     * @param length Defines the length of the ray to create
     * @param transform Defines the transform to apply to the ray, by default the world matrix is used to create a workd space ray
     * @param origin Defines the start point of the ray which defaults to the camera position
     * @returns the forward ray
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getForwardRay(length = 100, transform, origin) {
        throw _WarnImport("Ray");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Gets a ray in the forward direction from the camera.
     * @param refRay the ray to (re)use when setting the values
     * @param length Defines the length of the ray to create
     * @param transform Defines the transform to apply to the ray, by default the world matrx is used to create a workd space ray
     * @param origin Defines the start point of the ray which defaults to the camera position
     * @returns the forward ray
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getForwardRayToRef(refRay, length = 100, transform, origin) {
        throw _WarnImport("Ray");
    }
    /**
     * Releases resources associated with this node.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    dispose(doNotRecurse, disposeMaterialAndTextures = false) {
        // Observables
        this.onViewMatrixChangedObservable.clear();
        this.onProjectionMatrixChangedObservable.clear();
        this.onAfterCheckInputsObservable.clear();
        this.onRestoreStateObservable.clear();
        // Inputs
        if (this.inputs) {
            this.inputs.clear();
        }
        // Animations
        this.getScene().stopAnimation(this);
        // Remove from scene
        this.getScene().removeCamera(this);
        while (this._rigCameras.length > 0) {
            const camera = this._rigCameras.pop();
            if (camera) {
                camera.dispose();
            }
        }
        if (this._parentContainer) {
            const index = this._parentContainer.cameras.indexOf(this);
            if (index > -1) {
                this._parentContainer.cameras.splice(index, 1);
            }
            this._parentContainer = null;
        }
        // Postprocesses
        if (this._rigPostProcess) {
            this._rigPostProcess.dispose(this);
            this._rigPostProcess = null;
            this._postProcesses.length = 0;
        }
        else if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
            this._rigPostProcess = null;
            this._postProcesses.length = 0;
        }
        else {
            let i = this._postProcesses.length;
            while (--i >= 0) {
                const postProcess = this._postProcesses[i];
                if (postProcess) {
                    postProcess.dispose(this);
                }
            }
        }
        // Render targets
        let i = this.customRenderTargets.length;
        while (--i >= 0) {
            this.customRenderTargets[i].dispose();
        }
        this.customRenderTargets.length = 0;
        // Active Meshes
        this._activeMeshes.dispose();
        this.getScene().getEngine().releaseRenderPassId(this.renderPassId);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
    /**
     * Gets the left camera of a rig setup in case of Rigged Camera
     */
    get isLeftCamera() {
        return this._isLeftCamera;
    }
    /**
     * Gets the right camera of a rig setup in case of Rigged Camera
     */
    get isRightCamera() {
        return this._isRightCamera;
    }
    /**
     * Gets the left camera of a rig setup in case of Rigged Camera
     */
    get leftCamera() {
        if (this._rigCameras.length < 1) {
            return null;
        }
        return this._rigCameras[0];
    }
    /**
     * Gets the right camera of a rig setup in case of Rigged Camera
     */
    get rightCamera() {
        if (this._rigCameras.length < 2) {
            return null;
        }
        return this._rigCameras[1];
    }
    /**
     * Gets the left camera target of a rig setup in case of Rigged Camera
     * @returns the target position
     */
    getLeftTarget() {
        if (this._rigCameras.length < 1) {
            return null;
        }
        return this._rigCameras[0].getTarget();
    }
    /**
     * Gets the right camera target of a rig setup in case of Rigged Camera
     * @returns the target position
     */
    getRightTarget() {
        if (this._rigCameras.length < 2) {
            return null;
        }
        return this._rigCameras[1].getTarget();
    }
    /**
     * @internal
     */
    setCameraRigMode(mode, rigParams) {
        if (this.cameraRigMode === mode) {
            return;
        }
        while (this._rigCameras.length > 0) {
            const camera = this._rigCameras.pop();
            if (camera) {
                camera.dispose();
            }
        }
        this.cameraRigMode = mode;
        this._cameraRigParams = {};
        //we have to implement stereo camera calcultating left and right viewpoints from interaxialDistance and target,
        //not from a given angle as it is now, but until that complete code rewriting provisional stereoHalfAngle value is introduced
        this._cameraRigParams.interaxialDistance = rigParams.interaxialDistance || 0.0637;
        this._cameraRigParams.stereoHalfAngle = Tools.ToRadians(this._cameraRigParams.interaxialDistance / 0.0637);
        // create the rig cameras, unless none
        if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
            const leftCamera = this.createRigCamera(this.name + "_L", 0);
            if (leftCamera) {
                leftCamera._isLeftCamera = true;
            }
            const rightCamera = this.createRigCamera(this.name + "_R", 1);
            if (rightCamera) {
                rightCamera._isRightCamera = true;
            }
            if (leftCamera && rightCamera) {
                this._rigCameras.push(leftCamera);
                this._rigCameras.push(rightCamera);
            }
        }
        this._setRigMode(rigParams);
        this._cascadePostProcessesToRigCams();
        this.update();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setRigMode(rigParams) {
        // no-op
    }
    /** @internal */
    _getVRProjectionMatrix() {
        Matrix.PerspectiveFovLHToRef(this._cameraRigParams.vrMetrics.aspectRatioFov, this._cameraRigParams.vrMetrics.aspectRatio, this.minZ, this.maxZ, this._cameraRigParams.vrWorkMatrix, true, this.getEngine().isNDCHalfZRange);
        this._cameraRigParams.vrWorkMatrix.multiplyToRef(this._cameraRigParams.vrHMatrix, this._projectionMatrix);
        return this._projectionMatrix;
    }
    /**
     * @internal
     */
    setCameraRigParameter(name, value) {
        if (!this._cameraRigParams) {
            this._cameraRigParams = {};
        }
        this._cameraRigParams[name] = value;
        //provisionnally:
        if (name === "interaxialDistance") {
            this._cameraRigParams.stereoHalfAngle = Tools.ToRadians(value / 0.0637);
        }
    }
    /**
     * needs to be overridden by children so sub has required properties to be copied
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createRigCamera(name, cameraIndex) {
        return null;
    }
    /**
     * May need to be overridden by children
     * @internal
     */
    _updateRigCameras() {
        for (let i = 0; i < this._rigCameras.length; i++) {
            this._rigCameras[i].minZ = this.minZ;
            this._rigCameras[i].maxZ = this.maxZ;
            this._rigCameras[i].fov = this.fov;
            this._rigCameras[i].upVector.copyFrom(this.upVector);
        }
        // only update viewport when ANAGLYPH
        if (this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH) {
            this._rigCameras[0].viewport = this._rigCameras[1].viewport = this.viewport;
        }
    }
    /** @internal */
    _setupInputs() { }
    /**
     * Serialiaze the camera setup to a json representation
     * @returns the JSON representation
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.uniqueId = this.uniqueId;
        // Type
        serializationObject.type = this.getClassName();
        // Parent
        if (this.parent) {
            this.parent._serializeAsParent(serializationObject);
        }
        if (this.inputs) {
            this.inputs.serialize(serializationObject);
        }
        // Animations
        SerializationHelper.AppendSerializedAnimations(this, serializationObject);
        serializationObject.ranges = this.serializeAnimationRanges();
        serializationObject.isEnabled = this.isEnabled();
        return serializationObject;
    }
    /**
     * Clones the current camera.
     * @param name The cloned camera name
     * @param newParent The cloned camera's new parent (none by default)
     * @returns the cloned camera
     */
    clone(name, newParent = null) {
        const camera = SerializationHelper.Clone(Camera.GetConstructorFromName(this.getClassName(), name, this.getScene(), this.interaxialDistance, this.isStereoscopicSideBySide), this);
        camera.name = name;
        camera.parent = newParent;
        this.onClonedObservable.notifyObservers(camera);
        return camera;
    }
    /**
     * Gets the direction of the camera relative to a given local axis.
     * @param localAxis Defines the reference axis to provide a relative direction.
     * @returns the direction
     */
    getDirection(localAxis) {
        const result = Vector3.Zero();
        this.getDirectionToRef(localAxis, result);
        return result;
    }
    /**
     * Returns the current camera absolute rotation
     */
    get absoluteRotation() {
        this.getWorldMatrix().decompose(undefined, this._absoluteRotation);
        return this._absoluteRotation;
    }
    /**
     * Gets the direction of the camera relative to a given local axis into a passed vector.
     * @param localAxis Defines the reference axis to provide a relative direction.
     * @param result Defines the vector to store the result in
     */
    getDirectionToRef(localAxis, result) {
        Vector3.TransformNormalToRef(localAxis, this.getWorldMatrix(), result);
    }
    /**
     * Gets a camera constructor for a given camera type
     * @param type The type of the camera to construct (should be equal to one of the camera class name)
     * @param name The name of the camera the result will be able to instantiate
     * @param scene The scene the result will construct the camera in
     * @param interaxial_distance In case of stereoscopic setup, the distance between both eyes
     * @param isStereoscopicSideBySide In case of stereoscopic setup, should the sereo be side b side
     * @returns a factory method to construct the camera
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static GetConstructorFromName(type, name, scene, interaxial_distance = 0, isStereoscopicSideBySide = true) {
        const constructorFunc = Node.Construct(type, name, scene, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            interaxial_distance: interaxial_distance,
            isStereoscopicSideBySide: isStereoscopicSideBySide,
        });
        if (constructorFunc) {
            return constructorFunc;
        }
        // Default to universal camera
        return () => Camera._CreateDefaultParsedCamera(name, scene);
    }
    /**
     * Compute the world  matrix of the camera.
     * @returns the camera world matrix
     */
    computeWorldMatrix() {
        return this.getWorldMatrix();
    }
    /**
     * Parse a JSON and creates the camera from the parsed information
     * @param parsedCamera The JSON to parse
     * @param scene The scene to instantiate the camera in
     * @returns the newly constructed camera
     */
    static Parse(parsedCamera, scene) {
        const type = parsedCamera.type;
        const construct = Camera.GetConstructorFromName(type, parsedCamera.name, scene, parsedCamera.interaxial_distance, parsedCamera.isStereoscopicSideBySide);
        const camera = SerializationHelper.Parse(construct, parsedCamera, scene);
        // Parent
        if (parsedCamera.parentId !== undefined) {
            camera._waitingParentId = parsedCamera.parentId;
        }
        // Parent instance index
        if (parsedCamera.parentInstanceIndex !== undefined) {
            camera._waitingParentInstanceIndex = parsedCamera.parentInstanceIndex;
        }
        //If camera has an input manager, let it parse inputs settings
        if (camera.inputs) {
            camera.inputs.parse(parsedCamera);
            camera._setupInputs();
        }
        if (parsedCamera.upVector) {
            camera.upVector = Vector3.FromArray(parsedCamera.upVector); // need to force the upVector
        }
        if (camera.setPosition) {
            // need to force position
            camera.position.copyFromFloats(0, 0, 0);
            camera.setPosition(Vector3.FromArray(parsedCamera.position));
        }
        // Target
        if (parsedCamera.target) {
            if (camera.setTarget) {
                camera.setTarget(Vector3.FromArray(parsedCamera.target));
            }
        }
        // Apply 3d rig, when found
        if (parsedCamera.cameraRigMode) {
            const rigParams = parsedCamera.interaxial_distance ? { interaxialDistance: parsedCamera.interaxial_distance } : {};
            camera.setCameraRigMode(parsedCamera.cameraRigMode, rigParams);
        }
        // Animations
        if (parsedCamera.animations) {
            for (let animationIndex = 0; animationIndex < parsedCamera.animations.length; animationIndex++) {
                const parsedAnimation = parsedCamera.animations[animationIndex];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    camera.animations.push(internalClass.Parse(parsedAnimation));
                }
            }
            Node.ParseAnimationRanges(camera, parsedCamera, scene);
        }
        if (parsedCamera.autoAnimate) {
            scene.beginAnimation(camera, parsedCamera.autoAnimateFrom, parsedCamera.autoAnimateTo, parsedCamera.autoAnimateLoop, parsedCamera.autoAnimateSpeed || 1.0);
        }
        // Check if isEnabled is defined to be back compatible with prior serialized versions.
        if (parsedCamera.isEnabled !== undefined) {
            camera.setEnabled(parsedCamera.isEnabled);
        }
        return camera;
    }
    /** @internal */
    _calculateHandednessMultiplier() {
        let handednessMultiplier = this.getScene().useRightHandedSystem ? -1 : 1;
        if (this.parent && this.parent._getWorldMatrixDeterminant() < 0) {
            handednessMultiplier *= -1;
        }
        return handednessMultiplier;
    }
}
/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
Camera._CreateDefaultParsedCamera = (name, scene) => {
    throw _WarnImport("UniversalCamera");
};
/**
 * This is the default projection mode used by the cameras.
 * It helps recreating a feeling of perspective and better appreciate depth.
 * This is the best way to simulate real life cameras.
 */
Camera.PERSPECTIVE_CAMERA = 0;
/**
 * This helps creating camera with an orthographic mode.
 * Orthographic is commonly used in engineering as a means to produce object specifications that communicate dimensions unambiguously, each line of 1 unit length (cm, meter..whatever) will appear to have the same length everywhere on the drawing. This allows the drafter to dimension only a subset of lines and let the reader know that other lines of that length on the drawing are also that length in reality. Every parallel line in the drawing is also parallel in the object.
 */
Camera.ORTHOGRAPHIC_CAMERA = 1;
/**
 * This is the default FOV mode for perspective cameras.
 * This setting aligns the upper and lower bounds of the viewport to the upper and lower bounds of the camera frustum.
 */
Camera.FOVMODE_VERTICAL_FIXED = 0;
/**
 * This setting aligns the left and right bounds of the viewport to the left and right bounds of the camera frustum.
 */
Camera.FOVMODE_HORIZONTAL_FIXED = 1;
/**
 * This specifies there is no need for a camera rig.
 * Basically only one eye is rendered corresponding to the camera.
 */
Camera.RIG_MODE_NONE = 0;
/**
 * Simulates a camera Rig with one blue eye and one red eye.
 * This can be use with 3d blue and red glasses.
 */
Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH = 10;
/**
 * Defines that both eyes of the camera will be rendered side by side with a parallel target.
 */
Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL = 11;
/**
 * Defines that both eyes of the camera will be rendered side by side with a none parallel target.
 */
Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED = 12;
/**
 * Defines that both eyes of the camera will be rendered over under each other.
 */
Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER = 13;
/**
 * Defines that both eyes of the camera will be rendered on successive lines interlaced for passive 3d monitors.
 */
Camera.RIG_MODE_STEREOSCOPIC_INTERLACED = 14;
/**
 * Defines that both eyes of the camera should be renderered in a VR mode (carbox).
 */
Camera.RIG_MODE_VR = 20;
/**
 * Custom rig mode allowing rig cameras to be populated manually with any number of cameras
 */
Camera.RIG_MODE_CUSTOM = 22;
/**
 * Defines if by default attaching controls should prevent the default javascript event to continue.
 */
Camera.ForceAttachControlToAlwaysPreventDefault = false;
__decorate([
    serializeAsVector3("position")
], Camera.prototype, "_position", void 0);
__decorate([
    serializeAsVector3("upVector")
], Camera.prototype, "_upVector", void 0);
__decorate([
    serialize()
], Camera.prototype, "orthoLeft", null);
__decorate([
    serialize()
], Camera.prototype, "orthoRight", null);
__decorate([
    serialize()
], Camera.prototype, "orthoBottom", null);
__decorate([
    serialize()
], Camera.prototype, "orthoTop", null);
__decorate([
    serialize()
], Camera.prototype, "fov", void 0);
__decorate([
    serialize()
], Camera.prototype, "projectionPlaneTilt", void 0);
__decorate([
    serialize()
], Camera.prototype, "minZ", void 0);
__decorate([
    serialize()
], Camera.prototype, "maxZ", void 0);
__decorate([
    serialize()
], Camera.prototype, "inertia", void 0);
__decorate([
    serialize()
], Camera.prototype, "mode", null);
__decorate([
    serialize()
], Camera.prototype, "layerMask", void 0);
__decorate([
    serialize()
], Camera.prototype, "fovMode", void 0);
__decorate([
    serialize()
], Camera.prototype, "cameraRigMode", void 0);
__decorate([
    serialize()
], Camera.prototype, "interaxialDistance", void 0);
__decorate([
    serialize()
], Camera.prototype, "isStereoscopicSideBySide", void 0);
//# sourceMappingURL=camera.js.map