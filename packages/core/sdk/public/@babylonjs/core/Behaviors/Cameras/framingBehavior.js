import { ExponentialEase, EasingFunction } from "../../Animations/easing.js";
import { Observable } from "../../Misc/observable.js";
import { PointerEventTypes } from "../../Events/pointerEvents.js";
import { PrecisionDate } from "../../Misc/precisionDate.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { Animation } from "../../Animations/animation.js";
/**
 * The framing behavior (FramingBehavior) is designed to automatically position an ArcRotateCamera when its target is set to a mesh. It is also useful if you want to prevent the camera to go under a virtual horizontal plane.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#framing-behavior
 */
export class FramingBehavior {
    constructor() {
        /**
         * An event triggered when the animation to zoom on target mesh has ended
         */
        this.onTargetFramingAnimationEndObservable = new Observable();
        this._mode = FramingBehavior.FitFrustumSidesMode;
        this._radiusScale = 1.0;
        this._positionScale = 0.5;
        this._defaultElevation = 0.3;
        this._elevationReturnTime = 1500;
        this._elevationReturnWaitTime = 1000;
        this._zoomStopsAnimation = false;
        this._framingTime = 1500;
        /**
         * Define if the behavior should automatically change the configured
         * camera limits and sensibilities.
         */
        this.autoCorrectCameraLimitsAndSensibility = true;
        this._isPointerDown = false;
        this._lastInteractionTime = -Infinity;
        // Framing control
        this._animatables = new Array();
        this._betaIsAnimating = false;
    }
    /**
     * Gets the name of the behavior.
     */
    get name() {
        return "Framing";
    }
    /**
     * Sets the current mode used by the behavior
     */
    set mode(mode) {
        this._mode = mode;
    }
    /**
     * Gets current mode used by the behavior.
     */
    get mode() {
        return this._mode;
    }
    /**
     * Sets the scale applied to the radius (1 by default)
     */
    set radiusScale(radius) {
        this._radiusScale = radius;
    }
    /**
     * Gets the scale applied to the radius
     */
    get radiusScale() {
        return this._radiusScale;
    }
    /**
     * Sets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
     */
    set positionScale(scale) {
        this._positionScale = scale;
    }
    /**
     * Gets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
     */
    get positionScale() {
        return this._positionScale;
    }
    /**
     * Sets the angle above/below the horizontal plane to return to when the return to default elevation idle
     * behaviour is triggered, in radians.
     */
    set defaultElevation(elevation) {
        this._defaultElevation = elevation;
    }
    /**
     * Gets the angle above/below the horizontal plane to return to when the return to default elevation idle
     * behaviour is triggered, in radians.
     */
    get defaultElevation() {
        return this._defaultElevation;
    }
    /**
     * Sets the time (in milliseconds) taken to return to the default beta position.
     * Negative value indicates camera should not return to default.
     */
    set elevationReturnTime(speed) {
        this._elevationReturnTime = speed;
    }
    /**
     * Gets the time (in milliseconds) taken to return to the default beta position.
     * Negative value indicates camera should not return to default.
     */
    get elevationReturnTime() {
        return this._elevationReturnTime;
    }
    /**
     * Sets the delay (in milliseconds) taken before the camera returns to the default beta position.
     */
    set elevationReturnWaitTime(time) {
        this._elevationReturnWaitTime = time;
    }
    /**
     * Gets the delay (in milliseconds) taken before the camera returns to the default beta position.
     */
    get elevationReturnWaitTime() {
        return this._elevationReturnWaitTime;
    }
    /**
     * Sets the flag that indicates if user zooming should stop animation.
     */
    set zoomStopsAnimation(flag) {
        this._zoomStopsAnimation = flag;
    }
    /**
     * Gets the flag that indicates if user zooming should stop animation.
     */
    get zoomStopsAnimation() {
        return this._zoomStopsAnimation;
    }
    /**
     * Sets the transition time when framing the mesh, in milliseconds
     */
    set framingTime(time) {
        this._framingTime = time;
    }
    /**
     * Gets the transition time when framing the mesh, in milliseconds
     */
    get framingTime() {
        return this._framingTime;
    }
    /**
     * Initializes the behavior.
     */
    init() {
        // Do nothing
    }
    /**
     * Attaches the behavior to its arc rotate camera.
     * @param camera Defines the camera to attach the behavior to
     */
    attach(camera) {
        this._attachedCamera = camera;
        const scene = this._attachedCamera.getScene();
        FramingBehavior.EasingFunction.setEasingMode(FramingBehavior.EasingMode);
        this._onPrePointerObservableObserver = scene.onPrePointerObservable.add((pointerInfoPre) => {
            if (pointerInfoPre.type === PointerEventTypes.POINTERDOWN) {
                this._isPointerDown = true;
                return;
            }
            if (pointerInfoPre.type === PointerEventTypes.POINTERUP) {
                this._isPointerDown = false;
            }
        });
        this._onMeshTargetChangedObserver = camera.onMeshTargetChangedObservable.add((transformNode) => {
            if (transformNode && transformNode.getBoundingInfo) {
                this.zoomOnMesh(transformNode, undefined, () => {
                    this.onTargetFramingAnimationEndObservable.notifyObservers();
                });
            }
        });
        this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(() => {
            // Stop the animation if there is user interaction and the animation should stop for this interaction
            this._applyUserInteraction();
            // Maintain the camera above the ground. If the user pulls the camera beneath the ground plane, lift it
            // back to the default position after a given timeout
            this._maintainCameraAboveGround();
        });
    }
    /**
     * Detaches the behavior from its current arc rotate camera.
     */
    detach() {
        if (!this._attachedCamera) {
            return;
        }
        const scene = this._attachedCamera.getScene();
        if (this._onPrePointerObservableObserver) {
            scene.onPrePointerObservable.remove(this._onPrePointerObservableObserver);
        }
        if (this._onAfterCheckInputsObserver) {
            this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
        }
        if (this._onMeshTargetChangedObserver) {
            this._attachedCamera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver);
        }
        this._attachedCamera = null;
    }
    /**
     * Targets the given mesh and updates zoom level accordingly.
     * @param mesh  The mesh to target.
     * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
     * @param onAnimationEnd Callback triggered at the end of the framing animation
     */
    zoomOnMesh(mesh, focusOnOriginXZ = false, onAnimationEnd = null) {
        mesh.computeWorldMatrix(true);
        const boundingBox = mesh.getBoundingInfo().boundingBox;
        this.zoomOnBoundingInfo(boundingBox.minimumWorld, boundingBox.maximumWorld, focusOnOriginXZ, onAnimationEnd);
    }
    /**
     * Targets the given mesh with its children and updates zoom level accordingly.
     * @param mesh The mesh to target.
     * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
     * @param onAnimationEnd Callback triggered at the end of the framing animation
     */
    zoomOnMeshHierarchy(mesh, focusOnOriginXZ = false, onAnimationEnd = null) {
        mesh.computeWorldMatrix(true);
        const boundingBox = mesh.getHierarchyBoundingVectors(true);
        this.zoomOnBoundingInfo(boundingBox.min, boundingBox.max, focusOnOriginXZ, onAnimationEnd);
    }
    /**
     * Targets the given meshes with their children and updates zoom level accordingly.
     * @param meshes  The mesh to target.
     * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
     * @param onAnimationEnd Callback triggered at the end of the framing animation
     */
    zoomOnMeshesHierarchy(meshes, focusOnOriginXZ = false, onAnimationEnd = null) {
        const min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        for (let i = 0; i < meshes.length; i++) {
            const boundingInfo = meshes[i].getHierarchyBoundingVectors(true);
            Vector3.CheckExtends(boundingInfo.min, min, max);
            Vector3.CheckExtends(boundingInfo.max, min, max);
        }
        this.zoomOnBoundingInfo(min, max, focusOnOriginXZ, onAnimationEnd);
    }
    /**
     * Targets the bounding box info defined by its extends and updates zoom level accordingly.
     * @param minimumWorld Determines the smaller position of the bounding box extend
     * @param maximumWorld Determines the bigger position of the bounding box extend
     * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
     * @param onAnimationEnd Callback triggered at the end of the framing animation
     * @returns true if the zoom was done
     */
    zoomOnBoundingInfo(minimumWorld, maximumWorld, focusOnOriginXZ = false, onAnimationEnd = null) {
        let zoomTarget;
        if (!this._attachedCamera) {
            return false;
        }
        // Find target by interpolating from bottom of bounding box in world-space to top via framingPositionY
        const bottom = minimumWorld.y;
        const top = maximumWorld.y;
        const zoomTargetY = bottom + (top - bottom) * this._positionScale;
        const radiusWorld = maximumWorld.subtract(minimumWorld).scale(0.5);
        if (focusOnOriginXZ) {
            zoomTarget = new Vector3(0, zoomTargetY, 0);
        }
        else {
            const centerWorld = minimumWorld.add(radiusWorld);
            zoomTarget = new Vector3(centerWorld.x, zoomTargetY, centerWorld.z);
        }
        if (!this._vectorTransition) {
            this._vectorTransition = Animation.CreateAnimation("target", Animation.ANIMATIONTYPE_VECTOR3, 60, FramingBehavior.EasingFunction);
        }
        this._betaIsAnimating = true;
        let animatable = Animation.TransitionTo("target", zoomTarget, this._attachedCamera, this._attachedCamera.getScene(), 60, this._vectorTransition, this._framingTime);
        if (animatable) {
            this._animatables.push(animatable);
        }
        // sets the radius and lower radius bounds
        // Small delta ensures camera is not always at lower zoom limit.
        let radius = 0;
        if (this._mode === FramingBehavior.FitFrustumSidesMode) {
            const position = this._calculateLowerRadiusFromModelBoundingSphere(minimumWorld, maximumWorld);
            if (this.autoCorrectCameraLimitsAndSensibility) {
                this._attachedCamera.lowerRadiusLimit = radiusWorld.length() + this._attachedCamera.minZ;
            }
            radius = position;
        }
        else if (this._mode === FramingBehavior.IgnoreBoundsSizeMode) {
            radius = this._calculateLowerRadiusFromModelBoundingSphere(minimumWorld, maximumWorld);
            if (this.autoCorrectCameraLimitsAndSensibility && this._attachedCamera.lowerRadiusLimit === null) {
                this._attachedCamera.lowerRadiusLimit = this._attachedCamera.minZ;
            }
        }
        // Set sensibilities
        if (this.autoCorrectCameraLimitsAndSensibility) {
            const extend = maximumWorld.subtract(minimumWorld).length();
            this._attachedCamera.panningSensibility = 5000 / extend;
            this._attachedCamera.wheelPrecision = 100 / radius;
        }
        // transition to new radius
        if (!this._radiusTransition) {
            this._radiusTransition = Animation.CreateAnimation("radius", Animation.ANIMATIONTYPE_FLOAT, 60, FramingBehavior.EasingFunction);
        }
        animatable = Animation.TransitionTo("radius", radius, this._attachedCamera, this._attachedCamera.getScene(), 60, this._radiusTransition, this._framingTime, () => {
            this.stopAllAnimations();
            if (onAnimationEnd) {
                onAnimationEnd();
            }
            if (this._attachedCamera && this._attachedCamera.useInputToRestoreState) {
                this._attachedCamera.storeState();
            }
        });
        if (animatable) {
            this._animatables.push(animatable);
        }
        return true;
    }
    /**
     * Calculates the lowest radius for the camera based on the bounding box of the mesh.
     * @param minimumWorld
     * @param maximumWorld
     * @returns The minimum distance from the primary mesh's center point at which the camera must be kept in order
     *		 to fully enclose the mesh in the viewing frustum.
     */
    _calculateLowerRadiusFromModelBoundingSphere(minimumWorld, maximumWorld) {
        const camera = this._attachedCamera;
        if (!camera) {
            return 0;
        }
        let distance = camera._calculateLowerRadiusFromModelBoundingSphere(minimumWorld, maximumWorld, this._radiusScale);
        if (camera.lowerRadiusLimit && this._mode === FramingBehavior.IgnoreBoundsSizeMode) {
            // Don't exceed the requested limit
            distance = distance < camera.lowerRadiusLimit ? camera.lowerRadiusLimit : distance;
        }
        // Don't exceed the upper radius limit
        if (camera.upperRadiusLimit) {
            distance = distance > camera.upperRadiusLimit ? camera.upperRadiusLimit : distance;
        }
        return distance;
    }
    /**
     * Keeps the camera above the ground plane. If the user pulls the camera below the ground plane, the camera
     * is automatically returned to its default position (expected to be above ground plane).
     */
    _maintainCameraAboveGround() {
        if (this._elevationReturnTime < 0) {
            return;
        }
        const timeSinceInteraction = PrecisionDate.Now - this._lastInteractionTime;
        const defaultBeta = Math.PI * 0.5 - this._defaultElevation;
        const limitBeta = Math.PI * 0.5;
        // Bring the camera back up if below the ground plane
        if (this._attachedCamera && !this._betaIsAnimating && this._attachedCamera.beta > limitBeta && timeSinceInteraction >= this._elevationReturnWaitTime) {
            this._betaIsAnimating = true;
            //Transition to new position
            this.stopAllAnimations();
            if (!this._betaTransition) {
                this._betaTransition = Animation.CreateAnimation("beta", Animation.ANIMATIONTYPE_FLOAT, 60, FramingBehavior.EasingFunction);
            }
            const animatabe = Animation.TransitionTo("beta", defaultBeta, this._attachedCamera, this._attachedCamera.getScene(), 60, this._betaTransition, this._elevationReturnTime, () => {
                this._clearAnimationLocks();
                this.stopAllAnimations();
            });
            if (animatabe) {
                this._animatables.push(animatabe);
            }
        }
    }
    /**
     * Removes all animation locks. Allows new animations to be added to any of the arcCamera properties.
     */
    _clearAnimationLocks() {
        this._betaIsAnimating = false;
    }
    /**
     *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
     */
    _applyUserInteraction() {
        if (this.isUserIsMoving) {
            this._lastInteractionTime = PrecisionDate.Now;
            this.stopAllAnimations();
            this._clearAnimationLocks();
        }
    }
    /**
     * Stops and removes all animations that have been applied to the camera
     */
    stopAllAnimations() {
        if (this._attachedCamera) {
            this._attachedCamera.animations = [];
        }
        while (this._animatables.length) {
            if (this._animatables[0]) {
                this._animatables[0].onAnimationEnd = null;
                this._animatables[0].stop();
            }
            this._animatables.shift();
        }
    }
    /**
     * Gets a value indicating if the user is moving the camera
     */
    get isUserIsMoving() {
        if (!this._attachedCamera) {
            return false;
        }
        return (this._attachedCamera.inertialAlphaOffset !== 0 ||
            this._attachedCamera.inertialBetaOffset !== 0 ||
            this._attachedCamera.inertialRadiusOffset !== 0 ||
            this._attachedCamera.inertialPanningX !== 0 ||
            this._attachedCamera.inertialPanningY !== 0 ||
            this._isPointerDown);
    }
}
/**
 * The easing function used by animations
 */
FramingBehavior.EasingFunction = new ExponentialEase();
/**
 * The easing mode used by animations
 */
FramingBehavior.EasingMode = EasingFunction.EASINGMODE_EASEINOUT;
// Statics
/**
 * The camera can move all the way towards the mesh.
 */
FramingBehavior.IgnoreBoundsSizeMode = 0;
/**
 * The camera is not allowed to zoom closer to the mesh than the point at which the adjusted bounding sphere touches the frustum sides
 */
FramingBehavior.FitFrustumSidesMode = 1;
//# sourceMappingURL=framingBehavior.js.map