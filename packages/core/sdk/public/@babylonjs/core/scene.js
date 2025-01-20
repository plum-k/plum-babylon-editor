import { Tools } from "./Misc/tools.js";
import { PrecisionDate } from "./Misc/precisionDate.js";
import { Observable } from "./Misc/observable.js";
import { SmartArrayNoDuplicate, SmartArray } from "./Misc/smartArray.js";
import { StringDictionary } from "./Misc/stringDictionary.js";
import { Tags } from "./Misc/tags.js";
import { Vector3, Matrix, TmpVectors } from "./Maths/math.vector.js";
import { ImageProcessingConfiguration } from "./Materials/imageProcessingConfiguration.js";
import { UniformBuffer } from "./Materials/uniformBuffer.js";
import { PickingInfo } from "./Collisions/pickingInfo.js";
import { ActionEvent } from "./Actions/actionEvent.js";
import { PostProcessManager } from "./PostProcesses/postProcessManager.js";
import { RenderingManager } from "./Rendering/renderingManager.js";
import { Stage } from "./sceneComponent.js";

import { IsWindowObjectExist } from "./Misc/domManagement.js";
import { EngineStore } from "./Engines/engineStore.js";
import { _WarnImport } from "./Misc/devTools.js";
import { InputManager } from "./Inputs/scene.inputManager.js";
import { PerfCounter } from "./Misc/perfCounter.js";
import { Color4, Color3 } from "./Maths/math.color.js";
import { Frustum } from "./Maths/math.frustum.js";
import { UniqueIdGenerator } from "./Misc/uniqueIdGenerator.js";
import { ReadFile, RequestFile, LoadFile } from "./Misc/fileTools.js";
import { LightConstants } from "./Lights/lightConstants.js";
import { _ObserveArray } from "./Misc/arrayTools.js";
import { PointerPickingConfiguration } from "./Inputs/pointerPickingConfiguration.js";
import { Logger } from "./Misc/logger.js";
import { RegisterClass } from "./Misc/typeStore.js";
/**
 * Define how the scene should favor performance over ease of use
 */
export var ScenePerformancePriority;
(function (ScenePerformancePriority) {
    /** Default mode. No change. Performance will be treated as less important than backward compatibility */
    ScenePerformancePriority[ScenePerformancePriority["BackwardCompatible"] = 0] = "BackwardCompatible";
    /** Some performance options will be turned on trying to strike a balance between perf and ease of use */
    ScenePerformancePriority[ScenePerformancePriority["Intermediate"] = 1] = "Intermediate";
    /** Performance will be top priority */
    ScenePerformancePriority[ScenePerformancePriority["Aggressive"] = 2] = "Aggressive";
})(ScenePerformancePriority || (ScenePerformancePriority = {}));
/**
 * Represents a scene to be rendered by the engine.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene
 */
export class Scene {
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Factory used to create the default material.
     * @param scene The scene to create the material for
     * @returns The default material
     */
    static DefaultMaterialFactory(scene) {
        throw _WarnImport("StandardMaterial");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Factory used to create the a collision coordinator.
     * @returns The collision coordinator
     */
    static CollisionCoordinatorFactory() {
        throw _WarnImport("DefaultCollisionCoordinator");
    }
    /**
     * Defines the color used to clear the render buffer (Default is (0.2, 0.2, 0.3, 1.0))
     */
    get clearColor() {
        return this._clearColor;
    }
    set clearColor(value) {
        if (value !== this._clearColor) {
            this._clearColor = value;
            this.onClearColorChangedObservable.notifyObservers(this._clearColor);
        }
    }
    /**
     * Default image processing configuration used either in the rendering
     * Forward main pass or through the imageProcessingPostProcess if present.
     * As in the majority of the scene they are the same (exception for multi camera),
     * this is easier to reference from here than from all the materials and post process.
     *
     * No setter as we it is a shared configuration, you can set the values instead.
     */
    get imageProcessingConfiguration() {
        return this._imageProcessingConfiguration;
    }
    /**
     * Gets or sets a value indicating how to treat performance relatively to ease of use and backward compatibility
     */
    get performancePriority() {
        return this._performancePriority;
    }
    set performancePriority(value) {
        if (value === this._performancePriority) {
            return;
        }
        this._performancePriority = value;
        switch (value) {
            case 0 /* ScenePerformancePriority.BackwardCompatible */:
                this.skipFrustumClipping = false;
                this._renderingManager.maintainStateBetweenFrames = false;
                this.skipPointerMovePicking = false;
                this.autoClear = true;
                break;
            case 1 /* ScenePerformancePriority.Intermediate */:
                this.skipFrustumClipping = false;
                this._renderingManager.maintainStateBetweenFrames = false;
                this.skipPointerMovePicking = true;
                this.autoClear = false;
                break;
            case 2 /* ScenePerformancePriority.Aggressive */:
                this.skipFrustumClipping = true;
                this._renderingManager.maintainStateBetweenFrames = true;
                this.skipPointerMovePicking = true;
                this.autoClear = false;
                break;
        }
        this.onScenePerformancePriorityChangedObservable.notifyObservers(value);
    }
    /**
     * Gets or sets a boolean indicating if all rendering must be done in wireframe
     */
    set forceWireframe(value) {
        if (this._forceWireframe === value) {
            return;
        }
        this._forceWireframe = value;
        this.markAllMaterialsAsDirty(16);
    }
    get forceWireframe() {
        return this._forceWireframe;
    }
    /**
     * Gets or sets a boolean indicating if we should skip the frustum clipping part of the active meshes selection
     */
    set skipFrustumClipping(value) {
        if (this._skipFrustumClipping === value) {
            return;
        }
        this._skipFrustumClipping = value;
    }
    get skipFrustumClipping() {
        return this._skipFrustumClipping;
    }
    /**
     * Gets or sets a boolean indicating if all rendering must be done in point cloud
     */
    set forcePointsCloud(value) {
        if (this._forcePointsCloud === value) {
            return;
        }
        this._forcePointsCloud = value;
        this.markAllMaterialsAsDirty(16);
    }
    get forcePointsCloud() {
        return this._forcePointsCloud;
    }
    /**
     * Texture used in all pbr material as the reflection texture.
     * As in the majority of the scene they are the same (exception for multi room and so on),
     * this is easier to reference from here than from all the materials.
     */
    get environmentTexture() {
        return this._environmentTexture;
    }
    /**
     * Texture used in all pbr material as the reflection texture.
     * As in the majority of the scene they are the same (exception for multi room and so on),
     * this is easier to set here than in all the materials.
     */
    set environmentTexture(value) {
        if (this._environmentTexture === value) {
            return;
        }
        this._environmentTexture = value;
        this.onEnvironmentTextureChangedObservable.notifyObservers(value);
        this.markAllMaterialsAsDirty(1);
    }
    /**
     * @returns all meshes, lights, cameras, transformNodes and bones
     */
    getNodes() {
        let nodes = [];
        nodes = nodes.concat(this.meshes);
        nodes = nodes.concat(this.lights);
        nodes = nodes.concat(this.cameras);
        nodes = nodes.concat(this.transformNodes); // dummies
        this.skeletons.forEach((skeleton) => (nodes = nodes.concat(skeleton.bones)));
        return nodes;
    }
    /**
     * Gets or sets the animation properties override
     */
    get animationPropertiesOverride() {
        return this._animationPropertiesOverride;
    }
    set animationPropertiesOverride(value) {
        this._animationPropertiesOverride = value;
    }
    /** Sets a function to be executed when this scene is disposed. */
    set onDispose(callback) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }
    /** Sets a function to be executed before rendering this scene */
    set beforeRender(callback) {
        if (this._onBeforeRenderObserver) {
            this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        }
        if (callback) {
            this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
        }
    }
    /** Sets a function to be executed after rendering this scene */
    set afterRender(callback) {
        if (this._onAfterRenderObserver) {
            this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        }
        if (callback) {
            this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
        }
    }
    /** Sets a function to be executed before rendering a camera*/
    set beforeCameraRender(callback) {
        if (this._onBeforeCameraRenderObserver) {
            this.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
        }
        this._onBeforeCameraRenderObserver = this.onBeforeCameraRenderObservable.add(callback);
    }
    /** Sets a function to be executed after rendering a camera*/
    set afterCameraRender(callback) {
        if (this._onAfterCameraRenderObserver) {
            this.onAfterCameraRenderObservable.remove(this._onAfterCameraRenderObserver);
        }
        this._onAfterCameraRenderObserver = this.onAfterCameraRenderObservable.add(callback);
    }
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer down event
     */
    get pointerDownPredicate() {
        return this._pointerPickingConfiguration.pointerDownPredicate;
    }
    set pointerDownPredicate(value) {
        this._pointerPickingConfiguration.pointerDownPredicate = value;
    }
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer up event
     */
    get pointerUpPredicate() {
        return this._pointerPickingConfiguration.pointerUpPredicate;
    }
    set pointerUpPredicate(value) {
        this._pointerPickingConfiguration.pointerUpPredicate = value;
    }
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer move event
     */
    get pointerMovePredicate() {
        return this._pointerPickingConfiguration.pointerMovePredicate;
    }
    set pointerMovePredicate(value) {
        this._pointerPickingConfiguration.pointerMovePredicate = value;
    }
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer down event
     */
    get pointerDownFastCheck() {
        return this._pointerPickingConfiguration.pointerDownFastCheck;
    }
    set pointerDownFastCheck(value) {
        this._pointerPickingConfiguration.pointerDownFastCheck = value;
    }
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer up event
     */
    get pointerUpFastCheck() {
        return this._pointerPickingConfiguration.pointerUpFastCheck;
    }
    set pointerUpFastCheck(value) {
        this._pointerPickingConfiguration.pointerUpFastCheck = value;
    }
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer move event
     */
    get pointerMoveFastCheck() {
        return this._pointerPickingConfiguration.pointerMoveFastCheck;
    }
    set pointerMoveFastCheck(value) {
        this._pointerPickingConfiguration.pointerMoveFastCheck = value;
    }
    /**
     * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer move event occurs.
     */
    get skipPointerMovePicking() {
        return this._pointerPickingConfiguration.skipPointerMovePicking;
    }
    set skipPointerMovePicking(value) {
        this._pointerPickingConfiguration.skipPointerMovePicking = value;
    }
    /**
     * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer down event occurs.
     */
    get skipPointerDownPicking() {
        return this._pointerPickingConfiguration.skipPointerDownPicking;
    }
    set skipPointerDownPicking(value) {
        this._pointerPickingConfiguration.skipPointerDownPicking = value;
    }
    /**
     * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer up event occurs.  Off by default.
     */
    get skipPointerUpPicking() {
        return this._pointerPickingConfiguration.skipPointerUpPicking;
    }
    set skipPointerUpPicking(value) {
        this._pointerPickingConfiguration.skipPointerUpPicking = value;
    }
    /**
     * Gets the pointer coordinates without any translation (ie. straight out of the pointer event)
     */
    get unTranslatedPointer() {
        return this._inputManager.unTranslatedPointer;
    }
    /**
     * Gets or sets the distance in pixel that you have to move to prevent some events. Default is 10 pixels
     */
    static get DragMovementThreshold() {
        return InputManager.DragMovementThreshold;
    }
    static set DragMovementThreshold(value) {
        InputManager.DragMovementThreshold = value;
    }
    /**
     * Time in milliseconds to wait to raise long press events if button is still pressed. Default is 500 ms
     */
    static get LongPressDelay() {
        return InputManager.LongPressDelay;
    }
    static set LongPressDelay(value) {
        InputManager.LongPressDelay = value;
    }
    /**
     * Time in milliseconds to wait to raise long press events if button is still pressed. Default is 300 ms
     */
    static get DoubleClickDelay() {
        return InputManager.DoubleClickDelay;
    }
    static set DoubleClickDelay(value) {
        InputManager.DoubleClickDelay = value;
    }
    /** If you need to check double click without raising a single click at first click, enable this flag */
    static get ExclusiveDoubleClickMode() {
        return InputManager.ExclusiveDoubleClickMode;
    }
    static set ExclusiveDoubleClickMode(value) {
        InputManager.ExclusiveDoubleClickMode = value;
    }
    /**
     * Bind the current view position to an effect.
     * @param effect The effect to be bound
     * @param variableName name of the shader variable that will hold the eye position
     * @param isVector3 true to indicates that variableName is a Vector3 and not a Vector4
     * @returns the computed eye position
     */
    bindEyePosition(effect, variableName = "vEyePosition", isVector3 = false) {
        const eyePosition = this._forcedViewPosition
            ? this._forcedViewPosition
            : this._mirroredCameraPosition
                ? this._mirroredCameraPosition
                : (this.activeCamera?.globalPosition ?? Vector3.ZeroReadOnly);
        const invertNormal = this.useRightHandedSystem === (this._mirroredCameraPosition != null);
        TmpVectors.Vector4[0].set(eyePosition.x, eyePosition.y, eyePosition.z, invertNormal ? -1 : 1);
        if (effect) {
            if (isVector3) {
                effect.setFloat3(variableName, TmpVectors.Vector4[0].x, TmpVectors.Vector4[0].y, TmpVectors.Vector4[0].z);
            }
            else {
                effect.setVector4(variableName, TmpVectors.Vector4[0]);
            }
        }
        return TmpVectors.Vector4[0];
    }
    /**
     * Update the scene ubo before it can be used in rendering processing
     * @returns the scene UniformBuffer
     */
    finalizeSceneUbo() {
        const ubo = this.getSceneUniformBuffer();
        const eyePosition = this.bindEyePosition(null);
        ubo.updateFloat4("vEyePosition", eyePosition.x, eyePosition.y, eyePosition.z, eyePosition.w);
        ubo.update();
        return ubo;
    }
    /**
     * Gets or sets a boolean indicating if the scene must use right-handed coordinates system
     */
    set useRightHandedSystem(value) {
        if (this._useRightHandedSystem === value) {
            return;
        }
        this._useRightHandedSystem = value;
        this.markAllMaterialsAsDirty(16);
    }
    get useRightHandedSystem() {
        return this._useRightHandedSystem;
    }
    /**
     * Sets the step Id used by deterministic lock step
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @param newStepId defines the step Id
     */
    setStepId(newStepId) {
        this._currentStepId = newStepId;
    }
    /**
     * Gets the step Id used by deterministic lock step
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns the step Id
     */
    getStepId() {
        return this._currentStepId;
    }
    /**
     * Gets the internal step used by deterministic lock step
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns the internal step
     */
    getInternalStep() {
        return this._currentInternalStep;
    }
    /**
     * Gets or sets a boolean indicating if fog is enabled on this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/environment_introduction#fog
     * (Default is true)
     */
    set fogEnabled(value) {
        if (this._fogEnabled === value) {
            return;
        }
        this._fogEnabled = value;
        this.markAllMaterialsAsDirty(16);
    }
    get fogEnabled() {
        return this._fogEnabled;
    }
    /**
     * Gets or sets the fog mode to use
     * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/environment_introduction#fog
     * | mode | value |
     * | --- | --- |
     * | FOGMODE_NONE | 0 |
     * | FOGMODE_EXP | 1 |
     * | FOGMODE_EXP2 | 2 |
     * | FOGMODE_LINEAR | 3 |
     */
    set fogMode(value) {
        if (this._fogMode === value) {
            return;
        }
        this._fogMode = value;
        this.markAllMaterialsAsDirty(16);
    }
    get fogMode() {
        return this._fogMode;
    }
    /**
     * Flag indicating that the frame buffer binding is handled by another component
     */
    get prePass() {
        return !!this.prePassRenderer && this.prePassRenderer.defaultRT.enabled;
    }
    /**
     * Gets or sets a boolean indicating if shadows are enabled on this scene
     */
    set shadowsEnabled(value) {
        if (this._shadowsEnabled === value) {
            return;
        }
        this._shadowsEnabled = value;
        this.markAllMaterialsAsDirty(2);
    }
    get shadowsEnabled() {
        return this._shadowsEnabled;
    }
    /**
     * Gets or sets a boolean indicating if lights are enabled on this scene
     */
    set lightsEnabled(value) {
        if (this._lightsEnabled === value) {
            return;
        }
        this._lightsEnabled = value;
        this.markAllMaterialsAsDirty(2);
    }
    get lightsEnabled() {
        return this._lightsEnabled;
    }
    /** All of the active cameras added to this scene. */
    get activeCameras() {
        return this._activeCameras;
    }
    set activeCameras(cameras) {
        if (this._unObserveActiveCameras) {
            this._unObserveActiveCameras();
            this._unObserveActiveCameras = null;
        }
        if (cameras) {
            this._unObserveActiveCameras = _ObserveArray(cameras, () => {
                this.onActiveCamerasChanged.notifyObservers(this);
            });
        }
        this._activeCameras = cameras;
    }
    /** Gets or sets the current active camera */
    get activeCamera() {
        return this._activeCamera;
    }
    set activeCamera(value) {
        if (value === this._activeCamera) {
            return;
        }
        this._activeCamera = value;
        this.onActiveCameraChanged.notifyObservers(this);
    }
    /** The default material used on meshes when no material is affected */
    get defaultMaterial() {
        if (!this._defaultMaterial) {
            this._defaultMaterial = Scene.DefaultMaterialFactory(this);
        }
        return this._defaultMaterial;
    }
    /** The default material used on meshes when no material is affected */
    set defaultMaterial(value) {
        this._defaultMaterial = value;
    }
    /**
     * Gets or sets a boolean indicating if textures are enabled on this scene
     */
    set texturesEnabled(value) {
        if (this._texturesEnabled === value) {
            return;
        }
        this._texturesEnabled = value;
        this.markAllMaterialsAsDirty(1);
    }
    get texturesEnabled() {
        return this._texturesEnabled;
    }
    /**
     * Gets or sets the frame graph used to render the scene. If set, the scene will use the frame graph to render the scene instead of the default render loop.
     */
    get frameGraph() {
        return this._frameGraph;
    }
    set frameGraph(value) {
        if (this._frameGraph) {
            this._frameGraph = value;
            if (!value) {
                this.customRenderFunction = this._currentCustomRenderFunction;
            }
            return;
        }
        this._frameGraph = value;
        if (value) {
            this._currentCustomRenderFunction = this.customRenderFunction;
            this.customRenderFunction = this._renderWithFrameGraph;
        }
    }
    /**
     * Gets or sets a boolean indicating if skeletons are enabled on this scene
     */
    set skeletonsEnabled(value) {
        if (this._skeletonsEnabled === value) {
            return;
        }
        this._skeletonsEnabled = value;
        this.markAllMaterialsAsDirty(8);
    }
    get skeletonsEnabled() {
        return this._skeletonsEnabled;
    }
    /** @internal */
    get collisionCoordinator() {
        if (!this._collisionCoordinator) {
            this._collisionCoordinator = Scene.CollisionCoordinatorFactory();
            this._collisionCoordinator.init(this);
        }
        return this._collisionCoordinator;
    }
    /**
     * Gets the scene's rendering manager
     */
    get renderingManager() {
        return this._renderingManager;
    }
    /**
     * Gets the list of frustum planes (built from the active camera)
     */
    get frustumPlanes() {
        return this._frustumPlanes;
    }
    /**
     * Registers the transient components if needed.
     */
    _registerTransientComponents() {
        // Register components that have been associated lately to the scene.
        if (this._transientComponents.length > 0) {
            for (const component of this._transientComponents) {
                component.register();
            }
            this._transientComponents.length = 0;
        }
    }
    /**
     * @internal
     * Add a component to the scene.
     * Note that the ccomponent could be registered on th next frame if this is called after
     * the register component stage.
     * @param component Defines the component to add to the scene
     */
    _addComponent(component) {
        this._components.push(component);
        this._transientComponents.push(component);
        const serializableComponent = component;
        if (serializableComponent.addFromContainer && serializableComponent.serialize) {
            this._serializableComponents.push(serializableComponent);
        }
    }
    /**
     * @internal
     * Gets a component from the scene.
     * @param name defines the name of the component to retrieve
     * @returns the component or null if not present
     */
    _getComponent(name) {
        for (const component of this._components) {
            if (component.name === name) {
                return component;
            }
        }
        return null;
    }
    /**
     * Creates a new Scene
     * @param engine defines the engine to use to render this scene
     * @param options defines the scene options
     */
    constructor(engine, options) {
        /** @internal */
        this._inputManager = new InputManager(this);
        /** Define this parameter if you are using multiple cameras and you want to specify which one should be used for pointer position */
        this.cameraToUseForPointers = null;
        /** @internal */
        this._isScene = true;
        /** @internal */
        this._blockEntityCollection = false;
        /**
         * Gets or sets a boolean that indicates if the scene must clear the render buffer before rendering a frame
         */
        this.autoClear = true;
        /**
         * Gets or sets a boolean that indicates if the scene must clear the depth and stencil buffers before rendering a frame
         */
        this.autoClearDepthAndStencil = true;
        this._clearColor = new Color4(0.2, 0.2, 0.3, 1.0);
        /**
         * Observable triggered when the performance priority is changed
         */
        this.onClearColorChangedObservable = new Observable();
        /**
         * Defines the color used to simulate the ambient color (Default is (0, 0, 0))
         */
        this.ambientColor = new Color3(0, 0, 0);
        /**
         * Intensity of the environment in all pbr material.
         * This dims or reinforces the IBL lighting overall (reflection and diffuse).
         * As in the majority of the scene they are the same (exception for multi room and so on),
         * this is easier to reference from here than from all the materials.
         */
        this.environmentIntensity = 1;
        this._performancePriority = 0 /* ScenePerformancePriority.BackwardCompatible */;
        /**
         * Observable triggered when the performance priority is changed
         */
        this.onScenePerformancePriorityChangedObservable = new Observable();
        this._forceWireframe = false;
        this._skipFrustumClipping = false;
        this._forcePointsCloud = false;
        /**
         * Gets the list of root nodes (ie. nodes with no parent)
         */
        this.rootNodes = [];
        /** All of the cameras added to this scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
         */
        this.cameras = [];
        /**
         * All of the lights added to this scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
         */
        this.lights = [];
        /**
         * All of the (abstract) meshes added to this scene
         */
        this.meshes = [];
        /**
         * The list of skeletons added to the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons
         */
        this.skeletons = [];
        /**
         * All of the particle systems added to this scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro
         */
        this.particleSystems = [];
        /**
         * Gets a list of Animations associated with the scene
         */
        this.animations = [];
        /**
         * All of the animation groups added to this scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/groupAnimations
         */
        this.animationGroups = [];
        /**
         * All of the multi-materials added to this scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/multiMaterials
         */
        this.multiMaterials = [];
        /**
         * All of the materials added to this scene
         * In the context of a Scene, it is not supposed to be modified manually.
         * Any addition or removal should be done using the addMaterial and removeMaterial Scene methods.
         * Note also that the order of the Material within the array is not significant and might change.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction
         */
        this.materials = [];
        /**
         * The list of morph target managers added to the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph
         */
        this.morphTargetManagers = [];
        /**
         * The list of geometries used in the scene.
         */
        this.geometries = [];
        /**
         * All of the transform nodes added to this scene
         * In the context of a Scene, it is not supposed to be modified manually.
         * Any addition or removal should be done using the addTransformNode and removeTransformNode Scene methods.
         * Note also that the order of the TransformNode within the array is not significant and might change.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/parent_pivot/transform_node
         */
        this.transformNodes = [];
        /**
         * ActionManagers available on the scene.
         * @deprecated
         */
        this.actionManagers = [];
        /**
         * Textures to keep.
         */
        this.textures = [];
        /** @internal */
        this._environmentTexture = null;
        /**
         * The list of postprocesses added to the scene
         */
        this.postProcesses = [];
        /**
         * The list of effect layers (highlights/glow) added to the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/highlightLayer
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/glowLayer
         */
        this.effectLayers = [];
        /**
         * The list of sounds used in the scene.
         */
        this.sounds = null;
        /**
         * The list of layers (background and foreground) of the scene
         */
        this.layers = [];
        /**
         * The list of lens flare system added to the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/lenseFlare
         */
        this.lensFlareSystems = [];
        /**
         * The list of procedural textures added to the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/proceduralTextures
         */
        this.proceduralTextures = [];
        /**
         * Gets or sets a boolean indicating if animations are enabled
         */
        this.animationsEnabled = true;
        this._animationPropertiesOverride = null;
        /**
         * Gets or sets a boolean indicating if a constant deltatime has to be used
         * This is mostly useful for testing purposes when you do not want the animations to scale with the framerate
         */
        this.useConstantAnimationDeltaTime = false;
        /**
         * Gets or sets a boolean indicating if the scene must keep the meshUnderPointer property updated
         * Please note that it requires to run a ray cast through the scene on every frame
         */
        this.constantlyUpdateMeshUnderPointer = false;
        /**
         * Defines the HTML cursor to use when hovering over interactive elements
         */
        this.hoverCursor = "pointer";
        /**
         * Defines the HTML default cursor to use (empty by default)
         */
        this.defaultCursor = "";
        /**
         * Defines whether cursors are handled by the scene.
         */
        this.doNotHandleCursors = false;
        /**
         * This is used to call preventDefault() on pointer down
         * in order to block unwanted artifacts like system double clicks
         */
        this.preventDefaultOnPointerDown = true;
        /**
         * This is used to call preventDefault() on pointer up
         * in order to block unwanted artifacts like system double clicks
         */
        this.preventDefaultOnPointerUp = true;
        // Metadata
        /**
         * Gets or sets user defined metadata
         */
        this.metadata = null;
        /**
         * For internal use only. Please do not use.
         */
        this.reservedDataStore = null;
        /**
         * Use this array to add regular expressions used to disable offline support for specific urls
         */
        this.disableOfflineSupportExceptionRules = [];
        /**
         * An event triggered when the scene is disposed.
         */
        this.onDisposeObservable = new Observable();
        this._onDisposeObserver = null;
        /**
         * An event triggered before rendering the scene (right after animations and physics)
         */
        this.onBeforeRenderObservable = new Observable();
        this._onBeforeRenderObserver = null;
        /**
         * An event triggered after rendering the scene
         */
        this.onAfterRenderObservable = new Observable();
        /**
         * An event triggered after rendering the scene for an active camera (When scene.render is called this will be called after each camera)
         * This is triggered for each "sub" camera in a Camera Rig unlike onAfterCameraRenderObservable
         */
        this.onAfterRenderCameraObservable = new Observable();
        this._onAfterRenderObserver = null;
        /**
         * An event triggered before animating the scene
         */
        this.onBeforeAnimationsObservable = new Observable();
        /**
         * An event triggered after animations processing
         */
        this.onAfterAnimationsObservable = new Observable();
        /**
         * An event triggered before draw calls are ready to be sent
         */
        this.onBeforeDrawPhaseObservable = new Observable();
        /**
         * An event triggered after draw calls have been sent
         */
        this.onAfterDrawPhaseObservable = new Observable();
        /**
         * An event triggered when the scene is ready
         */
        this.onReadyObservable = new Observable();
        /**
         * An event triggered before rendering a camera
         */
        this.onBeforeCameraRenderObservable = new Observable();
        this._onBeforeCameraRenderObserver = null;
        /**
         * An event triggered after rendering a camera
         * This is triggered for the full rig Camera only unlike onAfterRenderCameraObservable
         */
        this.onAfterCameraRenderObservable = new Observable();
        this._onAfterCameraRenderObserver = null;
        /**
         * An event triggered when active meshes evaluation is about to start
         */
        this.onBeforeActiveMeshesEvaluationObservable = new Observable();
        /**
         * An event triggered when active meshes evaluation is done
         */
        this.onAfterActiveMeshesEvaluationObservable = new Observable();
        /**
         * An event triggered when particles rendering is about to start
         * Note: This event can be trigger more than once per frame (because particles can be rendered by render target textures as well)
         */
        this.onBeforeParticlesRenderingObservable = new Observable();
        /**
         * An event triggered when particles rendering is done
         * Note: This event can be trigger more than once per frame (because particles can be rendered by render target textures as well)
         */
        this.onAfterParticlesRenderingObservable = new Observable();
        /**
         * An event triggered when SceneLoader.Append or SceneLoader.Load or SceneLoader.ImportMesh were successfully executed
         */
        this.onDataLoadedObservable = new Observable();
        /**
         * An event triggered when a camera is created
         */
        this.onNewCameraAddedObservable = new Observable();
        /**
         * An event triggered when a camera is removed
         */
        this.onCameraRemovedObservable = new Observable();
        /**
         * An event triggered when a light is created
         */
        this.onNewLightAddedObservable = new Observable();
        /**
         * An event triggered when a light is removed
         */
        this.onLightRemovedObservable = new Observable();
        /**
         * An event triggered when a geometry is created
         */
        this.onNewGeometryAddedObservable = new Observable();
        /**
         * An event triggered when a geometry is removed
         */
        this.onGeometryRemovedObservable = new Observable();
        /**
         * An event triggered when a transform node is created
         */
        this.onNewTransformNodeAddedObservable = new Observable();
        /**
         * An event triggered when a transform node is removed
         */
        this.onTransformNodeRemovedObservable = new Observable();
        /**
         * An event triggered when a mesh is created
         */
        this.onNewMeshAddedObservable = new Observable();
        /**
         * An event triggered when a mesh is removed
         */
        this.onMeshRemovedObservable = new Observable();
        /**
         * An event triggered when a skeleton is created
         */
        this.onNewSkeletonAddedObservable = new Observable();
        /**
         * An event triggered when a skeleton is removed
         */
        this.onSkeletonRemovedObservable = new Observable();
        /**
         * An event triggered when a material is created
         */
        this.onNewMaterialAddedObservable = new Observable();
        /**
         * An event triggered when a multi material is created
         */
        this.onNewMultiMaterialAddedObservable = new Observable();
        /**
         * An event triggered when a material is removed
         */
        this.onMaterialRemovedObservable = new Observable();
        /**
         * An event triggered when a multi material is removed
         */
        this.onMultiMaterialRemovedObservable = new Observable();
        /**
         * An event triggered when a texture is created
         */
        this.onNewTextureAddedObservable = new Observable();
        /**
         * An event triggered when a texture is removed
         */
        this.onTextureRemovedObservable = new Observable();
        /**
         * An event triggered when render targets are about to be rendered
         * Can happen multiple times per frame.
         */
        this.onBeforeRenderTargetsRenderObservable = new Observable();
        /**
         * An event triggered when render targets were rendered.
         * Can happen multiple times per frame.
         */
        this.onAfterRenderTargetsRenderObservable = new Observable();
        /**
         * An event triggered before calculating deterministic simulation step
         */
        this.onBeforeStepObservable = new Observable();
        /**
         * An event triggered after calculating deterministic simulation step
         */
        this.onAfterStepObservable = new Observable();
        /**
         * An event triggered when the activeCamera property is updated
         */
        this.onActiveCameraChanged = new Observable();
        /**
         * An event triggered when the activeCameras property is updated
         */
        this.onActiveCamerasChanged = new Observable();
        /**
         * This Observable will be triggered before rendering each renderingGroup of each rendered camera.
         * The RenderingGroupInfo class contains all the information about the context in which the observable is called
         * If you wish to register an Observer only for a given set of renderingGroup, use the mask with a combination of the renderingGroup index elevated to the power of two (1 for renderingGroup 0, 2 for renderingrOup1, 4 for 2 and 8 for 3)
         */
        this.onBeforeRenderingGroupObservable = new Observable();
        /**
         * This Observable will be triggered after rendering each renderingGroup of each rendered camera.
         * The RenderingGroupInfo class contains all the information about the context in which the observable is called
         * If you wish to register an Observer only for a given set of renderingGroup, use the mask with a combination of the renderingGroup index elevated to the power of two (1 for renderingGroup 0, 2 for renderingrOup1, 4 for 2 and 8 for 3)
         */
        this.onAfterRenderingGroupObservable = new Observable();
        /**
         * This Observable will when a mesh has been imported into the scene.
         */
        this.onMeshImportedObservable = new Observable();
        /**
         * This Observable will when an animation file has been imported into the scene.
         */
        this.onAnimationFileImportedObservable = new Observable();
        /**
         * An event triggered when the environmentTexture is changed.
         */
        this.onEnvironmentTextureChangedObservable = new Observable();
        /**
         * An event triggered when the state of mesh under pointer, for a specific pointerId, changes.
         */
        this.onMeshUnderPointerUpdatedObservable = new Observable();
        // Animations
        /** @internal */
        this._registeredForLateAnimationBindings = new SmartArrayNoDuplicate(256);
        // Pointers
        this._pointerPickingConfiguration = new PointerPickingConfiguration();
        /**
         * This observable event is triggered when any ponter event is triggered. It is registered during Scene.attachControl() and it is called BEFORE the 3D engine process anything (mesh/sprite picking for instance).
         * You have the possibility to skip the process and the call to onPointerObservable by setting PointerInfoPre.skipOnPointerObservable to true
         */
        this.onPrePointerObservable = new Observable();
        /**
         * Observable event triggered each time an input event is received from the rendering canvas
         */
        this.onPointerObservable = new Observable();
        // Keyboard
        /**
         * This observable event is triggered when any keyboard event si raised and registered during Scene.attachControl()
         * You have the possibility to skip the process and the call to onKeyboardObservable by setting KeyboardInfoPre.skipOnPointerObservable to true
         */
        this.onPreKeyboardObservable = new Observable();
        /**
         * Observable event triggered each time an keyboard event is received from the hosting window
         */
        this.onKeyboardObservable = new Observable();
        // Coordinates system
        this._useRightHandedSystem = false;
        // Deterministic lockstep
        this._timeAccumulator = 0;
        this._currentStepId = 0;
        this._currentInternalStep = 0;
        // Fog
        this._fogEnabled = true;
        this._fogMode = Scene.FOGMODE_NONE;
        /**
         * Gets or sets the fog color to use
         * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/environment_introduction#fog
         * (Default is Color3(0.2, 0.2, 0.3))
         */
        this.fogColor = new Color3(0.2, 0.2, 0.3);
        /**
         * Gets or sets the fog density to use
         * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/environment_introduction#fog
         * (Default is 0.1)
         */
        this.fogDensity = 0.1;
        /**
         * Gets or sets the fog start distance to use
         * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/environment_introduction#fog
         * (Default is 0)
         */
        this.fogStart = 0;
        /**
         * Gets or sets the fog end distance to use
         * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/environment_introduction#fog
         * (Default is 1000)
         */
        this.fogEnd = 1000.0;
        /**
         * Flag indicating if we need to store previous matrices when rendering
         */
        this.needsPreviousWorldMatrices = false;
        // Lights
        this._shadowsEnabled = true;
        this._lightsEnabled = true;
        this._unObserveActiveCameras = null;
        // Textures
        this._texturesEnabled = true;
        this._frameGraph = null;
        // Physics
        /**
         * Gets or sets a boolean indicating if physic engines are enabled on this scene
         */
        this.physicsEnabled = true;
        // Particles
        /**
         * Gets or sets a boolean indicating if particles are enabled on this scene
         */
        this.particlesEnabled = true;
        // Sprites
        /**
         * Gets or sets a boolean indicating if sprites are enabled on this scene
         */
        this.spritesEnabled = true;
        // Skeletons
        this._skeletonsEnabled = true;
        // Lens flares
        /**
         * Gets or sets a boolean indicating if lens flares are enabled on this scene
         */
        this.lensFlaresEnabled = true;
        // Collisions
        /**
         * Gets or sets a boolean indicating if collisions are enabled on this scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
         */
        this.collisionsEnabled = true;
        /**
         * Defines the gravity applied to this scene (used only for collisions)
         * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
         */
        this.gravity = new Vector3(0, -9.807, 0);
        // Postprocesses
        /**
         * Gets or sets a boolean indicating if postprocesses are enabled on this scene
         */
        this.postProcessesEnabled = true;
        // Customs render targets
        /**
         * Gets or sets a boolean indicating if render targets are enabled on this scene
         */
        this.renderTargetsEnabled = true;
        /**
         * Gets or sets a boolean indicating if next render targets must be dumped as image for debugging purposes
         * We recommend not using it and instead rely on Spector.js: http://spector.babylonjs.com
         */
        this.dumpNextRenderTargets = false;
        /**
         * The list of user defined render targets added to the scene
         */
        this.customRenderTargets = [];
        /**
         * Gets the list of meshes imported to the scene through SceneLoader
         */
        this.importedMeshesFiles = [];
        // Probes
        /**
         * Gets or sets a boolean indicating if probes are enabled on this scene
         */
        this.probesEnabled = true;
        this._meshesForIntersections = new SmartArrayNoDuplicate(256);
        // Procedural textures
        /**
         * Gets or sets a boolean indicating if procedural textures are enabled on this scene
         */
        this.proceduralTexturesEnabled = true;
        // Performance counters
        this._totalVertices = new PerfCounter();
        /** @internal */
        this._activeIndices = new PerfCounter();
        /** @internal */
        this._activeParticles = new PerfCounter();
        /** @internal */
        this._activeBones = new PerfCounter();
        /** @internal */
        this._animationTime = 0;
        /**
         * Gets or sets a general scale for animation speed
         * @see https://www.babylonjs-playground.com/#IBU2W7#3
         */
        this.animationTimeScale = 1;
        this._renderId = 0;
        this._frameId = 0;
        this._executeWhenReadyTimeoutId = null;
        this._intermediateRendering = false;
        this._defaultFrameBufferCleared = false;
        this._viewUpdateFlag = -1;
        this._projectionUpdateFlag = -1;
        /** @internal */
        this._toBeDisposed = new Array(256);
        this._activeRequests = new Array();
        /** @internal */
        this._pendingData = new Array();
        this._isDisposed = false;
        /**
         * Gets or sets a boolean indicating that all submeshes of active meshes must be rendered
         * Use this boolean to avoid computing frustum clipping on submeshes (This could help when you are CPU bound)
         */
        this.dispatchAllSubMeshesOfActiveMeshes = false;
        this._activeMeshes = new SmartArray(256);
        this._processedMaterials = new SmartArray(256);
        this._renderTargets = new SmartArrayNoDuplicate(256);
        this._materialsRenderTargets = new SmartArrayNoDuplicate(256);
        /** @internal */
        this._activeParticleSystems = new SmartArray(256);
        this._activeSkeletons = new SmartArrayNoDuplicate(32);
        this._softwareSkinnedMeshes = new SmartArrayNoDuplicate(32);
        /** @internal */
        this._activeAnimatables = new Array();
        this._transformMatrix = Matrix.Zero();
        /**
         * Gets or sets a boolean indicating if lights must be sorted by priority (off by default)
         * This is useful if there are more lights that the maximum simulteanous authorized
         */
        this.requireLightSorting = false;
        /**
         * @internal
         * Backing store of defined scene components.
         */
        this._components = [];
        /**
         * @internal
         * Backing store of defined scene components.
         */
        this._serializableComponents = [];
        /**
         * List of components to register on the next registration step.
         */
        this._transientComponents = [];
        /**
         * @internal
         * Defines the actions happening before camera updates.
         */
        this._beforeCameraUpdateStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening before clear the canvas.
         */
        this._beforeClearStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening before clear the canvas.
         */
        this._beforeRenderTargetClearStage = Stage.Create();
        /**
         * @internal
         * Defines the actions when collecting render targets for the frame.
         */
        this._gatherRenderTargetsStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening for one camera in the frame.
         */
        this._gatherActiveCameraRenderTargetsStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening during the per mesh ready checks.
         */
        this._isReadyForMeshStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening before evaluate active mesh checks.
         */
        this._beforeEvaluateActiveMeshStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening during the evaluate sub mesh checks.
         */
        this._evaluateSubMeshStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening during the active mesh stage.
         */
        this._preActiveMeshStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening during the per camera render target step.
         */
        this._cameraDrawRenderTargetStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening just before the active camera is drawing.
         */
        this._beforeCameraDrawStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening just before a render target is drawing.
         */
        this._beforeRenderTargetDrawStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening just before a rendering group is drawing.
         */
        this._beforeRenderingGroupDrawStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening just before a mesh is drawing.
         */
        this._beforeRenderingMeshStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening just after a mesh has been drawn.
         */
        this._afterRenderingMeshStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening just after a rendering group has been drawn.
         */
        this._afterRenderingGroupDrawStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening just after the active camera has been drawn.
         */
        this._afterCameraDrawStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening just after the post processing
         */
        this._afterCameraPostProcessStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening just after a render target has been drawn.
         */
        this._afterRenderTargetDrawStage = Stage.Create();
        /**
         * Defines the actions happening just after the post processing on a render target
         */
        this._afterRenderTargetPostProcessStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening just after rendering all cameras and computing intersections.
         */
        this._afterRenderStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening when a pointer move event happens.
         */
        this._pointerMoveStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening when a pointer down event happens.
         */
        this._pointerDownStage = Stage.Create();
        /**
         * @internal
         * Defines the actions happening when a pointer up event happens.
         */
        this._pointerUpStage = Stage.Create();
        /**
         * an optional map from Geometry Id to Geometry index in the 'geometries' array
         */
        this._geometriesByUniqueId = null;
        this._defaultMeshCandidates = {
            data: [],
            length: 0,
        };
        this._defaultSubMeshCandidates = {
            data: [],
            length: 0,
        };
        this._preventFreeActiveMeshesAndRenderingGroups = false;
        /** @internal */
        this._activeMeshesFrozen = false;
        /** @internal */
        this._activeMeshesFrozenButKeepClipping = false;
        this._skipEvaluateActiveMeshesCompletely = false;
        /** @internal */
        this._allowPostProcessClearColor = true;
        /**
         * User updatable function that will return a deterministic frame time when engine is in deterministic lock step mode
         * @returns the frame time
         */
        this.getDeterministicFrameTime = () => {
            return this._engine.getTimeStep();
        };
        /** @internal */
        this._registeredActions = 0;
        this._blockMaterialDirtyMechanism = false;
        /**
         * Internal perfCollector instance used for sharing between inspector and playground.
         * Marked as protected to allow sharing between prototype extensions, but disallow access at toplevel.
         */
        this._perfCollector = null;
        this.activeCameras = [];
        const fullOptions = {
            useGeometryUniqueIdsMap: true,
            useMaterialMeshMap: true,
            useClonedMeshMap: true,
            virtual: false,
            ...options,
        };
        engine = this._engine = engine || EngineStore.LastCreatedEngine;
        if (fullOptions.virtual) {
            engine._virtualScenes.push(this);
        }
        else {
            EngineStore._LastCreatedScene = this;
            engine.scenes.push(this);
        }
        this._uid = null;
        this._renderingManager = new RenderingManager(this);
        if (PostProcessManager) {
            this.postProcessManager = new PostProcessManager(this);
        }
        if (IsWindowObjectExist()) {
            this.attachControl();
        }
        // Uniform Buffer
        this._createUbo();
        // Default Image processing definition
        if (ImageProcessingConfiguration) {
            this._imageProcessingConfiguration = new ImageProcessingConfiguration();
        }
        this.setDefaultCandidateProviders();
        if (fullOptions.useGeometryUniqueIdsMap) {
            this._geometriesByUniqueId = {};
        }
        this.useMaterialMeshMap = fullOptions.useMaterialMeshMap;
        this.useClonedMeshMap = fullOptions.useClonedMeshMap;
        if (!options || !options.virtual) {
            engine.onNewSceneAddedObservable.notifyObservers(this);
        }
    }
    /**
     * Gets a string identifying the name of the class
     * @returns "Scene" string
     */
    getClassName() {
        return "Scene";
    }
    /**
     * @internal
     */
    _getDefaultMeshCandidates() {
        this._defaultMeshCandidates.data = this.meshes;
        this._defaultMeshCandidates.length = this.meshes.length;
        return this._defaultMeshCandidates;
    }
    /**
     * @internal
     */
    _getDefaultSubMeshCandidates(mesh) {
        this._defaultSubMeshCandidates.data = mesh.subMeshes;
        this._defaultSubMeshCandidates.length = mesh.subMeshes.length;
        return this._defaultSubMeshCandidates;
    }
    /**
     * Sets the default candidate providers for the scene.
     * This sets the getActiveMeshCandidates, getActiveSubMeshCandidates, getIntersectingSubMeshCandidates
     * and getCollidingSubMeshCandidates to their default function
     */
    setDefaultCandidateProviders() {
        this.getActiveMeshCandidates = () => this._getDefaultMeshCandidates();
        this.getActiveSubMeshCandidates = (mesh) => this._getDefaultSubMeshCandidates(mesh);
        this.getIntersectingSubMeshCandidates = (mesh, localRay) => this._getDefaultSubMeshCandidates(mesh);
        this.getCollidingSubMeshCandidates = (mesh, collider) => this._getDefaultSubMeshCandidates(mesh);
    }
    /**
     * Gets the mesh that is currently under the pointer
     */
    get meshUnderPointer() {
        return this._inputManager.meshUnderPointer;
    }
    /**
     * Gets or sets the current on-screen X position of the pointer
     */
    get pointerX() {
        return this._inputManager.pointerX;
    }
    set pointerX(value) {
        this._inputManager.pointerX = value;
    }
    /**
     * Gets or sets the current on-screen Y position of the pointer
     */
    get pointerY() {
        return this._inputManager.pointerY;
    }
    set pointerY(value) {
        this._inputManager.pointerY = value;
    }
    /**
     * Gets the cached material (ie. the latest rendered one)
     * @returns the cached material
     */
    getCachedMaterial() {
        return this._cachedMaterial;
    }
    /**
     * Gets the cached effect (ie. the latest rendered one)
     * @returns the cached effect
     */
    getCachedEffect() {
        return this._cachedEffect;
    }
    /**
     * Gets the cached visibility state (ie. the latest rendered one)
     * @returns the cached visibility state
     */
    getCachedVisibility() {
        return this._cachedVisibility;
    }
    /**
     * Gets a boolean indicating if the current material / effect / visibility must be bind again
     * @param material defines the current material
     * @param effect defines the current effect
     * @param visibility defines the current visibility state
     * @returns true if one parameter is not cached
     */
    isCachedMaterialInvalid(material, effect, visibility = 1) {
        return this._cachedEffect !== effect || this._cachedMaterial !== material || this._cachedVisibility !== visibility;
    }
    /**
     * Gets the engine associated with the scene
     * @returns an Engine
     */
    getEngine() {
        return this._engine;
    }
    /**
     * Gets the total number of vertices rendered per frame
     * @returns the total number of vertices rendered per frame
     */
    getTotalVertices() {
        return this._totalVertices.current;
    }
    /**
     * Gets the performance counter for total vertices
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#instrumentation
     */
    get totalVerticesPerfCounter() {
        return this._totalVertices;
    }
    /**
     * Gets the total number of active indices rendered per frame (You can deduce the number of rendered triangles by dividing this number by 3)
     * @returns the total number of active indices rendered per frame
     */
    getActiveIndices() {
        return this._activeIndices.current;
    }
    /**
     * Gets the performance counter for active indices
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#instrumentation
     */
    get totalActiveIndicesPerfCounter() {
        return this._activeIndices;
    }
    /**
     * Gets the total number of active particles rendered per frame
     * @returns the total number of active particles rendered per frame
     */
    getActiveParticles() {
        return this._activeParticles.current;
    }
    /**
     * Gets the performance counter for active particles
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#instrumentation
     */
    get activeParticlesPerfCounter() {
        return this._activeParticles;
    }
    /**
     * Gets the total number of active bones rendered per frame
     * @returns the total number of active bones rendered per frame
     */
    getActiveBones() {
        return this._activeBones.current;
    }
    /**
     * Gets the performance counter for active bones
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#instrumentation
     */
    get activeBonesPerfCounter() {
        return this._activeBones;
    }
    /**
     * Gets the array of active meshes
     * @returns an array of AbstractMesh
     */
    getActiveMeshes() {
        return this._activeMeshes;
    }
    /**
     * Gets the animation ratio (which is 1.0 is the scene renders at 60fps and 2 if the scene renders at 30fps, etc.)
     * @returns a number
     */
    getAnimationRatio() {
        return this._animationRatio !== undefined ? this._animationRatio : 1;
    }
    /**
     * Gets an unique Id for the current render phase
     * @returns a number
     */
    getRenderId() {
        return this._renderId;
    }
    /**
     * Gets an unique Id for the current frame
     * @returns a number
     */
    getFrameId() {
        return this._frameId;
    }
    /** Call this function if you want to manually increment the render Id*/
    incrementRenderId() {
        this._renderId++;
    }
    _createUbo() {
        this.setSceneUniformBuffer(this.createSceneUniformBuffer());
    }
    /**
     * Use this method to simulate a pointer move on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     * @returns the current scene
     */
    simulatePointerMove(pickResult, pointerEventInit) {
        this._inputManager.simulatePointerMove(pickResult, pointerEventInit);
        return this;
    }
    /**
     * Use this method to simulate a pointer down on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     * @returns the current scene
     */
    simulatePointerDown(pickResult, pointerEventInit) {
        this._inputManager.simulatePointerDown(pickResult, pointerEventInit);
        return this;
    }
    /**
     * Use this method to simulate a pointer up on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     * @param doubleTap indicates that the pointer up event should be considered as part of a double click (false by default)
     * @returns the current scene
     */
    simulatePointerUp(pickResult, pointerEventInit, doubleTap) {
        this._inputManager.simulatePointerUp(pickResult, pointerEventInit, doubleTap);
        return this;
    }
    /**
     * Gets a boolean indicating if the current pointer event is captured (meaning that the scene has already handled the pointer down)
     * @param pointerId defines the pointer id to use in a multi-touch scenario (0 by default)
     * @returns true if the pointer was captured
     */
    isPointerCaptured(pointerId = 0) {
        return this._inputManager.isPointerCaptured(pointerId);
    }
    /**
     * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
     * @param attachUp defines if you want to attach events to pointerup
     * @param attachDown defines if you want to attach events to pointerdown
     * @param attachMove defines if you want to attach events to pointermove
     */
    attachControl(attachUp = true, attachDown = true, attachMove = true) {
        this._inputManager.attachControl(attachUp, attachDown, attachMove);
    }
    /** Detaches all event handlers*/
    detachControl() {
        this._inputManager.detachControl();
    }
    /**
     * This function will check if the scene can be rendered (textures are loaded, shaders are compiled)
     * Delay loaded resources are not taking in account
     * @param checkRenderTargets true to also check that the meshes rendered as part of a render target are ready (default: true)
     * @returns true if all required resources are ready
     */
    isReady(checkRenderTargets = true) {
        if (this._isDisposed) {
            return false;
        }
        let index;
        const engine = this.getEngine();
        const currentRenderPassId = engine.currentRenderPassId;
        engine.currentRenderPassId = this.activeCamera?.renderPassId ?? currentRenderPassId;
        let isReady = true;
        // Pending data
        if (this._pendingData.length > 0) {
            isReady = false;
        }
        // Ensures that the pre-pass renderer is enabled if it is to be enabled.
        this.prePassRenderer?.update();
        // OIT
        if (this.useOrderIndependentTransparency && this.depthPeelingRenderer) {
            isReady && (isReady = this.depthPeelingRenderer.isReady());
        }
        // Meshes
        if (checkRenderTargets) {
            this._processedMaterials.reset();
            this._materialsRenderTargets.reset();
        }
        for (index = 0; index < this.meshes.length; index++) {
            const mesh = this.meshes[index];
            if (!mesh.subMeshes || mesh.subMeshes.length === 0) {
                continue;
            }
            // Do not stop at the first encountered "unready" object as we want to ensure
            // all materials are starting off their compilation in parallel.
            if (!mesh.isReady(true)) {
                isReady = false;
                continue;
            }
            const hardwareInstancedRendering = mesh.hasThinInstances ||
                mesh.getClassName() === "InstancedMesh" ||
                mesh.getClassName() === "InstancedLinesMesh" ||
                (engine.getCaps().instancedArrays && mesh.instances.length > 0);
            // Is Ready For Mesh
            for (const step of this._isReadyForMeshStage) {
                if (!step.action(mesh, hardwareInstancedRendering)) {
                    isReady = false;
                }
            }
            if (!checkRenderTargets) {
                continue;
            }
            const mat = mesh.material || this.defaultMaterial;
            if (mat) {
                if (mat._storeEffectOnSubMeshes) {
                    for (const subMesh of mesh.subMeshes) {
                        const material = subMesh.getMaterial();
                        if (material && material.hasRenderTargetTextures && material.getRenderTargetTextures != null) {
                            if (this._processedMaterials.indexOf(material) === -1) {
                                this._processedMaterials.push(material);
                                this._materialsRenderTargets.concatWithNoDuplicate(material.getRenderTargetTextures());
                            }
                        }
                    }
                }
                else {
                    if (mat.hasRenderTargetTextures && mat.getRenderTargetTextures != null) {
                        if (this._processedMaterials.indexOf(mat) === -1) {
                            this._processedMaterials.push(mat);
                            this._materialsRenderTargets.concatWithNoDuplicate(mat.getRenderTargetTextures());
                        }
                    }
                }
            }
        }
        // Render targets
        if (checkRenderTargets) {
            for (index = 0; index < this._materialsRenderTargets.length; ++index) {
                const rtt = this._materialsRenderTargets.data[index];
                if (!rtt.isReadyForRendering()) {
                    isReady = false;
                }
            }
        }
        // Geometries
        for (index = 0; index < this.geometries.length; index++) {
            const geometry = this.geometries[index];
            if (geometry.delayLoadState === 2) {
                isReady = false;
            }
        }
        // Post-processes
        if (this.activeCameras && this.activeCameras.length > 0) {
            for (const camera of this.activeCameras) {
                if (!camera.isReady(true)) {
                    isReady = false;
                }
            }
        }
        else if (this.activeCamera) {
            if (!this.activeCamera.isReady(true)) {
                isReady = false;
            }
        }
        // Particles
        for (const particleSystem of this.particleSystems) {
            if (!particleSystem.isReady()) {
                isReady = false;
            }
        }
        // Layers
        if (this.layers) {
            for (const layer of this.layers) {
                if (!layer.isReady()) {
                    isReady = false;
                }
            }
        }
        // Effects
        if (!engine.areAllEffectsReady()) {
            isReady = false;
        }
        engine.currentRenderPassId = currentRenderPassId;
        return isReady;
    }
    /** Resets all cached information relative to material (including effect and visibility) */
    resetCachedMaterial() {
        this._cachedMaterial = null;
        this._cachedEffect = null;
        this._cachedVisibility = null;
    }
    /**
     * Registers a function to be called before every frame render
     * @param func defines the function to register
     */
    registerBeforeRender(func) {
        this.onBeforeRenderObservable.add(func);
    }
    /**
     * Unregisters a function called before every frame render
     * @param func defines the function to unregister
     */
    unregisterBeforeRender(func) {
        this.onBeforeRenderObservable.removeCallback(func);
    }
    /**
     * Registers a function to be called after every frame render
     * @param func defines the function to register
     */
    registerAfterRender(func) {
        this.onAfterRenderObservable.add(func);
    }
    /**
     * Unregisters a function called after every frame render
     * @param func defines the function to unregister
     */
    unregisterAfterRender(func) {
        this.onAfterRenderObservable.removeCallback(func);
    }
    _executeOnceBeforeRender(func) {
        const execFunc = () => {
            func();
            setTimeout(() => {
                this.unregisterBeforeRender(execFunc);
            });
        };
        this.registerBeforeRender(execFunc);
    }
    /**
     * The provided function will run before render once and will be disposed afterwards.
     * A timeout delay can be provided so that the function will be executed in N ms.
     * The timeout is using the browser's native setTimeout so time percision cannot be guaranteed.
     * @param func The function to be executed.
     * @param timeout optional delay in ms
     */
    executeOnceBeforeRender(func, timeout) {
        if (timeout !== undefined) {
            setTimeout(() => {
                this._executeOnceBeforeRender(func);
            }, timeout);
        }
        else {
            this._executeOnceBeforeRender(func);
        }
    }
    /**
     * This function can help adding any object to the list of data awaited to be ready in order to check for a complete scene loading.
     * @param data defines the object to wait for
     */
    addPendingData(data) {
        this._pendingData.push(data);
    }
    /**
     * Remove a pending data from the loading list which has previously been added with addPendingData.
     * @param data defines the object to remove from the pending list
     */
    removePendingData(data) {
        const wasLoading = this.isLoading;
        const index = this._pendingData.indexOf(data);
        if (index !== -1) {
            this._pendingData.splice(index, 1);
        }
        if (wasLoading && !this.isLoading) {
            this.onDataLoadedObservable.notifyObservers(this);
        }
    }
    /**
     * Returns the number of items waiting to be loaded
     * @returns the number of items waiting to be loaded
     */
    getWaitingItemsCount() {
        return this._pendingData.length;
    }
    /**
     * Returns a boolean indicating if the scene is still loading data
     */
    get isLoading() {
        return this._pendingData.length > 0;
    }
    /**
     * Registers a function to be executed when the scene is ready
     * @param func - the function to be executed
     * @param checkRenderTargets true to also check that the meshes rendered as part of a render target are ready (default: false)
     */
    executeWhenReady(func, checkRenderTargets = false) {
        this.onReadyObservable.addOnce(func);
        if (this._executeWhenReadyTimeoutId !== null) {
            return;
        }
        this._checkIsReady(checkRenderTargets);
    }
    /**
     * Returns a promise that resolves when the scene is ready
     * @param checkRenderTargets true to also check that the meshes rendered as part of a render target are ready (default: false)
     * @returns A promise that resolves when the scene is ready
     */
    whenReadyAsync(checkRenderTargets = false) {
        return new Promise((resolve) => {
            this.executeWhenReady(() => {
                resolve();
            }, checkRenderTargets);
        });
    }
    /**
     * @internal
     */
    _checkIsReady(checkRenderTargets = false) {
        this._registerTransientComponents();
        if (this.isReady(checkRenderTargets)) {
            this.onReadyObservable.notifyObservers(this);
            this.onReadyObservable.clear();
            this._executeWhenReadyTimeoutId = null;
            return;
        }
        if (this._isDisposed) {
            this.onReadyObservable.clear();
            this._executeWhenReadyTimeoutId = null;
            return;
        }
        this._executeWhenReadyTimeoutId = setTimeout(() => {
            // Ensure materials effects are checked outside render loops
            this.incrementRenderId();
            this._checkIsReady(checkRenderTargets);
        }, 100);
    }
    /**
     * Gets all animatable attached to the scene
     */
    get animatables() {
        return this._activeAnimatables;
    }
    /**
     * Resets the last animation time frame.
     * Useful to override when animations start running when loading a scene for the first time.
     */
    resetLastAnimationTimeFrame() {
        this._animationTimeLast = PrecisionDate.Now;
    }
    // Matrix
    /**
     * Gets the current view matrix
     * @returns a Matrix
     */
    getViewMatrix() {
        return this._viewMatrix;
    }
    /**
     * Gets the current projection matrix
     * @returns a Matrix
     */
    getProjectionMatrix() {
        return this._projectionMatrix;
    }
    /**
     * Gets the current transform matrix
     * @returns a Matrix made of View * Projection
     */
    getTransformMatrix() {
        return this._transformMatrix;
    }
    /**
     * Sets the current transform matrix
     * @param viewL defines the View matrix to use
     * @param projectionL defines the Projection matrix to use
     * @param viewR defines the right View matrix to use (if provided)
     * @param projectionR defines the right Projection matrix to use (if provided)
     */
    setTransformMatrix(viewL, projectionL, viewR, projectionR) {
        // clear the multiviewSceneUbo if no viewR and projectionR are defined
        if (!viewR && !projectionR && this._multiviewSceneUbo) {
            this._multiviewSceneUbo.dispose();
            this._multiviewSceneUbo = null;
        }
        if (this._viewUpdateFlag === viewL.updateFlag && this._projectionUpdateFlag === projectionL.updateFlag) {
            return;
        }
        this._viewUpdateFlag = viewL.updateFlag;
        this._projectionUpdateFlag = projectionL.updateFlag;
        this._viewMatrix = viewL;
        this._projectionMatrix = projectionL;
        this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
        // Update frustum
        if (!this._frustumPlanes) {
            this._frustumPlanes = Frustum.GetPlanes(this._transformMatrix);
        }
        else {
            Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
        }
        if (this._multiviewSceneUbo && this._multiviewSceneUbo.useUbo) {
            this._updateMultiviewUbo(viewR, projectionR);
        }
        else if (this._sceneUbo.useUbo) {
            this._sceneUbo.updateMatrix("viewProjection", this._transformMatrix);
            this._sceneUbo.updateMatrix("view", this._viewMatrix);
            this._sceneUbo.updateMatrix("projection", this._projectionMatrix);
        }
    }
    /**
     * Gets the uniform buffer used to store scene data
     * @returns a UniformBuffer
     */
    getSceneUniformBuffer() {
        return this._multiviewSceneUbo ? this._multiviewSceneUbo : this._sceneUbo;
    }
    /**
     * Creates a scene UBO
     * @param name name of the uniform buffer (optional, for debugging purpose only)
     * @returns a new ubo
     */
    createSceneUniformBuffer(name) {
        const sceneUbo = new UniformBuffer(this._engine, undefined, false, name ?? "scene");
        sceneUbo.addUniform("viewProjection", 16);
        sceneUbo.addUniform("view", 16);
        sceneUbo.addUniform("projection", 16);
        sceneUbo.addUniform("vEyePosition", 4);
        return sceneUbo;
    }
    /**
     * Sets the scene ubo
     * @param ubo the ubo to set for the scene
     */
    setSceneUniformBuffer(ubo) {
        this._sceneUbo = ubo;
        this._viewUpdateFlag = -1;
        this._projectionUpdateFlag = -1;
    }
    /**
     * Gets an unique (relatively to the current scene) Id
     * @returns an unique number for the scene
     */
    getUniqueId() {
        return UniqueIdGenerator.UniqueId;
    }
    /**
     * Add a mesh to the list of scene's meshes
     * @param newMesh defines the mesh to add
     * @param recursive if all child meshes should also be added to the scene
     */
    addMesh(newMesh, recursive = false) {
        if (this._blockEntityCollection) {
            return;
        }
        this.meshes.push(newMesh);
        newMesh._resyncLightSources();
        if (!newMesh.parent) {
            newMesh._addToSceneRootNodes();
        }
        Tools.SetImmediate(() => {
            this.onNewMeshAddedObservable.notifyObservers(newMesh);
        });
        if (recursive) {
            newMesh.getChildMeshes().forEach((m) => {
                this.addMesh(m);
            });
        }
    }
    /**
     * Remove a mesh for the list of scene's meshes
     * @param toRemove defines the mesh to remove
     * @param recursive if all child meshes should also be removed from the scene
     * @returns the index where the mesh was in the mesh list
     */
    removeMesh(toRemove, recursive = false) {
        const index = this.meshes.indexOf(toRemove);
        if (index !== -1) {
            // Remove from the scene if the mesh found
            this.meshes.splice(index, 1);
            if (!toRemove.parent) {
                toRemove._removeFromSceneRootNodes();
            }
        }
        this._inputManager._invalidateMesh(toRemove);
        this.onMeshRemovedObservable.notifyObservers(toRemove);
        if (recursive) {
            toRemove.getChildMeshes().forEach((m) => {
                this.removeMesh(m);
            });
        }
        return index;
    }
    /**
     * Add a transform node to the list of scene's transform nodes
     * @param newTransformNode defines the transform node to add
     */
    addTransformNode(newTransformNode) {
        if (this._blockEntityCollection) {
            return;
        }
        if (newTransformNode.getScene() === this && newTransformNode._indexInSceneTransformNodesArray !== -1) {
            // Already there?
            return;
        }
        newTransformNode._indexInSceneTransformNodesArray = this.transformNodes.length;
        this.transformNodes.push(newTransformNode);
        if (!newTransformNode.parent) {
            newTransformNode._addToSceneRootNodes();
        }
        this.onNewTransformNodeAddedObservable.notifyObservers(newTransformNode);
    }
    /**
     * Remove a transform node for the list of scene's transform nodes
     * @param toRemove defines the transform node to remove
     * @returns the index where the transform node was in the transform node list
     */
    removeTransformNode(toRemove) {
        const index = toRemove._indexInSceneTransformNodesArray;
        if (index !== -1) {
            if (index !== this.transformNodes.length - 1) {
                const lastNode = this.transformNodes[this.transformNodes.length - 1];
                this.transformNodes[index] = lastNode;
                lastNode._indexInSceneTransformNodesArray = index;
            }
            toRemove._indexInSceneTransformNodesArray = -1;
            this.transformNodes.pop();
            if (!toRemove.parent) {
                toRemove._removeFromSceneRootNodes();
            }
        }
        this.onTransformNodeRemovedObservable.notifyObservers(toRemove);
        return index;
    }
    /**
     * Remove a skeleton for the list of scene's skeletons
     * @param toRemove defines the skeleton to remove
     * @returns the index where the skeleton was in the skeleton list
     */
    removeSkeleton(toRemove) {
        const index = this.skeletons.indexOf(toRemove);
        if (index !== -1) {
            // Remove from the scene if found
            this.skeletons.splice(index, 1);
            this.onSkeletonRemovedObservable.notifyObservers(toRemove);
            // Clean active container
            this._executeActiveContainerCleanup(this._activeSkeletons);
        }
        return index;
    }
    /**
     * Remove a morph target for the list of scene's morph targets
     * @param toRemove defines the morph target to remove
     * @returns the index where the morph target was in the morph target list
     */
    removeMorphTargetManager(toRemove) {
        const index = this.morphTargetManagers.indexOf(toRemove);
        if (index !== -1) {
            // Remove from the scene if found
            this.morphTargetManagers.splice(index, 1);
        }
        return index;
    }
    /**
     * Remove a light for the list of scene's lights
     * @param toRemove defines the light to remove
     * @returns the index where the light was in the light list
     */
    removeLight(toRemove) {
        const index = this.lights.indexOf(toRemove);
        if (index !== -1) {
            // Remove from meshes
            for (const mesh of this.meshes) {
                mesh._removeLightSource(toRemove, false);
            }
            // Remove from the scene if mesh found
            this.lights.splice(index, 1);
            this.sortLightsByPriority();
            if (!toRemove.parent) {
                toRemove._removeFromSceneRootNodes();
            }
        }
        this.onLightRemovedObservable.notifyObservers(toRemove);
        return index;
    }
    /**
     * Remove a camera for the list of scene's cameras
     * @param toRemove defines the camera to remove
     * @returns the index where the camera was in the camera list
     */
    removeCamera(toRemove) {
        const index = this.cameras.indexOf(toRemove);
        if (index !== -1) {
            // Remove from the scene if mesh found
            this.cameras.splice(index, 1);
            if (!toRemove.parent) {
                toRemove._removeFromSceneRootNodes();
            }
        }
        // Remove from activeCameras
        if (this.activeCameras) {
            const index2 = this.activeCameras.indexOf(toRemove);
            if (index2 !== -1) {
                // Remove from the scene if mesh found
                this.activeCameras.splice(index2, 1);
            }
        }
        // Reset the activeCamera
        if (this.activeCamera === toRemove) {
            if (this.cameras.length > 0) {
                this.activeCamera = this.cameras[0];
            }
            else {
                this.activeCamera = null;
            }
        }
        this.onCameraRemovedObservable.notifyObservers(toRemove);
        return index;
    }
    /**
     * Remove a particle system for the list of scene's particle systems
     * @param toRemove defines the particle system to remove
     * @returns the index where the particle system was in the particle system list
     */
    removeParticleSystem(toRemove) {
        const index = this.particleSystems.indexOf(toRemove);
        if (index !== -1) {
            this.particleSystems.splice(index, 1);
            // Clean active container
            this._executeActiveContainerCleanup(this._activeParticleSystems);
        }
        return index;
    }
    /**
     * Remove a animation for the list of scene's animations
     * @param toRemove defines the animation to remove
     * @returns the index where the animation was in the animation list
     */
    removeAnimation(toRemove) {
        const index = this.animations.indexOf(toRemove);
        if (index !== -1) {
            this.animations.splice(index, 1);
        }
        return index;
    }
    /**
     * Will stop the animation of the given target
     * @param target - the target
     * @param animationName - the name of the animation to stop (all animations will be stopped if both this and targetMask are empty)
     * @param targetMask - a function that determines if the animation should be stopped based on its target (all animations will be stopped if both this and animationName are empty)
     */
    stopAnimation(target, animationName, targetMask) {
        // Do nothing as code will be provided by animation component
    }
    /**
     * Removes the given animation group from this scene.
     * @param toRemove The animation group to remove
     * @returns The index of the removed animation group
     */
    removeAnimationGroup(toRemove) {
        const index = this.animationGroups.indexOf(toRemove);
        if (index !== -1) {
            this.animationGroups.splice(index, 1);
        }
        return index;
    }
    /**
     * Removes the given multi-material from this scene.
     * @param toRemove The multi-material to remove
     * @returns The index of the removed multi-material
     */
    removeMultiMaterial(toRemove) {
        const index = this.multiMaterials.indexOf(toRemove);
        if (index !== -1) {
            this.multiMaterials.splice(index, 1);
        }
        this.onMultiMaterialRemovedObservable.notifyObservers(toRemove);
        return index;
    }
    /**
     * Removes the given material from this scene.
     * @param toRemove The material to remove
     * @returns The index of the removed material
     */
    removeMaterial(toRemove) {
        const index = toRemove._indexInSceneMaterialArray;
        if (index !== -1 && index < this.materials.length) {
            if (index !== this.materials.length - 1) {
                const lastMaterial = this.materials[this.materials.length - 1];
                this.materials[index] = lastMaterial;
                lastMaterial._indexInSceneMaterialArray = index;
            }
            toRemove._indexInSceneMaterialArray = -1;
            this.materials.pop();
        }
        this.onMaterialRemovedObservable.notifyObservers(toRemove);
        return index;
    }
    /**
     * Removes the given action manager from this scene.
     * @deprecated
     * @param toRemove The action manager to remove
     * @returns The index of the removed action manager
     */
    removeActionManager(toRemove) {
        const index = this.actionManagers.indexOf(toRemove);
        if (index !== -1) {
            this.actionManagers.splice(index, 1);
        }
        return index;
    }
    /**
     * Removes the given texture from this scene.
     * @param toRemove The texture to remove
     * @returns The index of the removed texture
     */
    removeTexture(toRemove) {
        const index = this.textures.indexOf(toRemove);
        if (index !== -1) {
            this.textures.splice(index, 1);
        }
        this.onTextureRemovedObservable.notifyObservers(toRemove);
        return index;
    }
    /**
     * Adds the given light to this scene
     * @param newLight The light to add
     */
    addLight(newLight) {
        if (this._blockEntityCollection) {
            return;
        }
        this.lights.push(newLight);
        this.sortLightsByPriority();
        if (!newLight.parent) {
            newLight._addToSceneRootNodes();
        }
        // Add light to all meshes (To support if the light is removed and then re-added)
        for (const mesh of this.meshes) {
            if (mesh.lightSources.indexOf(newLight) === -1) {
                mesh.lightSources.push(newLight);
                mesh._resyncLightSources();
            }
        }
        Tools.SetImmediate(() => {
            this.onNewLightAddedObservable.notifyObservers(newLight);
        });
    }
    /**
     * Sorts the list list based on light priorities
     */
    sortLightsByPriority() {
        if (this.requireLightSorting) {
            this.lights.sort(LightConstants.CompareLightsPriority);
        }
    }
    /**
     * Adds the given camera to this scene
     * @param newCamera The camera to add
     */
    addCamera(newCamera) {
        if (this._blockEntityCollection) {
            return;
        }
        this.cameras.push(newCamera);
        Tools.SetImmediate(() => {
            this.onNewCameraAddedObservable.notifyObservers(newCamera);
        });
        if (!newCamera.parent) {
            newCamera._addToSceneRootNodes();
        }
    }
    /**
     * Adds the given skeleton to this scene
     * @param newSkeleton The skeleton to add
     */
    addSkeleton(newSkeleton) {
        if (this._blockEntityCollection) {
            return;
        }
        this.skeletons.push(newSkeleton);
        Tools.SetImmediate(() => {
            this.onNewSkeletonAddedObservable.notifyObservers(newSkeleton);
        });
    }
    /**
     * Adds the given particle system to this scene
     * @param newParticleSystem The particle system to add
     */
    addParticleSystem(newParticleSystem) {
        if (this._blockEntityCollection) {
            return;
        }
        this.particleSystems.push(newParticleSystem);
    }
    /**
     * Adds the given animation to this scene
     * @param newAnimation The animation to add
     */
    addAnimation(newAnimation) {
        if (this._blockEntityCollection) {
            return;
        }
        this.animations.push(newAnimation);
    }
    /**
     * Adds the given animation group to this scene.
     * @param newAnimationGroup The animation group to add
     */
    addAnimationGroup(newAnimationGroup) {
        if (this._blockEntityCollection) {
            return;
        }
        this.animationGroups.push(newAnimationGroup);
    }
    /**
     * Adds the given multi-material to this scene
     * @param newMultiMaterial The multi-material to add
     */
    addMultiMaterial(newMultiMaterial) {
        if (this._blockEntityCollection) {
            return;
        }
        this.multiMaterials.push(newMultiMaterial);
        Tools.SetImmediate(() => {
            this.onNewMultiMaterialAddedObservable.notifyObservers(newMultiMaterial);
        });
    }
    /**
     * Adds the given material to this scene
     * @param newMaterial The material to add
     */
    addMaterial(newMaterial) {
        if (this._blockEntityCollection) {
            return;
        }
        if (newMaterial.getScene() === this && newMaterial._indexInSceneMaterialArray !== -1) {
            // Already there??
            return;
        }
        newMaterial._indexInSceneMaterialArray = this.materials.length;
        this.materials.push(newMaterial);
        Tools.SetImmediate(() => {
            this.onNewMaterialAddedObservable.notifyObservers(newMaterial);
        });
    }
    /**
     * Adds the given morph target to this scene
     * @param newMorphTargetManager The morph target to add
     */
    addMorphTargetManager(newMorphTargetManager) {
        if (this._blockEntityCollection) {
            return;
        }
        this.morphTargetManagers.push(newMorphTargetManager);
    }
    /**
     * Adds the given geometry to this scene
     * @param newGeometry The geometry to add
     */
    addGeometry(newGeometry) {
        if (this._blockEntityCollection) {
            return;
        }
        if (this._geometriesByUniqueId) {
            this._geometriesByUniqueId[newGeometry.uniqueId] = this.geometries.length;
        }
        this.geometries.push(newGeometry);
    }
    /**
     * Adds the given action manager to this scene
     * @deprecated
     * @param newActionManager The action manager to add
     */
    addActionManager(newActionManager) {
        this.actionManagers.push(newActionManager);
    }
    /**
     * Adds the given texture to this scene.
     * @param newTexture The texture to add
     */
    addTexture(newTexture) {
        if (this._blockEntityCollection) {
            return;
        }
        this.textures.push(newTexture);
        this.onNewTextureAddedObservable.notifyObservers(newTexture);
    }
    /**
     * Switch active camera
     * @param newCamera defines the new active camera
     * @param attachControl defines if attachControl must be called for the new active camera (default: true)
     */
    switchActiveCamera(newCamera, attachControl = true) {
        const canvas = this._engine.getInputElement();
        if (!canvas) {
            return;
        }
        if (this.activeCamera) {
            this.activeCamera.detachControl();
        }
        this.activeCamera = newCamera;
        if (attachControl) {
            newCamera.attachControl();
        }
    }
    /**
     * sets the active camera of the scene using its Id
     * @param id defines the camera's Id
     * @returns the new active camera or null if none found.
     */
    setActiveCameraById(id) {
        const camera = this.getCameraById(id);
        if (camera) {
            this.activeCamera = camera;
            return camera;
        }
        return null;
    }
    /**
     * sets the active camera of the scene using its name
     * @param name defines the camera's name
     * @returns the new active camera or null if none found.
     */
    setActiveCameraByName(name) {
        const camera = this.getCameraByName(name);
        if (camera) {
            this.activeCamera = camera;
            return camera;
        }
        return null;
    }
    /**
     * get an animation group using its name
     * @param name defines the material's name
     * @returns the animation group or null if none found.
     */
    getAnimationGroupByName(name) {
        for (let index = 0; index < this.animationGroups.length; index++) {
            if (this.animationGroups[index].name === name) {
                return this.animationGroups[index];
            }
        }
        return null;
    }
    _getMaterial(allowMultiMaterials, predicate) {
        for (let index = 0; index < this.materials.length; index++) {
            const material = this.materials[index];
            if (predicate(material)) {
                return material;
            }
        }
        if (allowMultiMaterials) {
            for (let index = 0; index < this.multiMaterials.length; index++) {
                const material = this.multiMaterials[index];
                if (predicate(material)) {
                    return material;
                }
            }
        }
        return null;
    }
    /**
     * Get a material using its unique id
     * @param uniqueId defines the material's unique id
     * @param allowMultiMaterials determines whether multimaterials should be considered
     * @returns the material or null if none found.
     */
    getMaterialByUniqueID(uniqueId, allowMultiMaterials = false) {
        return this._getMaterial(allowMultiMaterials, (m) => m.uniqueId === uniqueId);
    }
    /**
     * get a material using its id
     * @param id defines the material's Id
     * @param allowMultiMaterials determines whether multimaterials should be considered
     * @returns the material or null if none found.
     */
    getMaterialById(id, allowMultiMaterials = false) {
        return this._getMaterial(allowMultiMaterials, (m) => m.id === id);
    }
    /**
     * Gets a material using its name
     * @param name defines the material's name
     * @param allowMultiMaterials determines whether multimaterials should be considered
     * @returns the material or null if none found.
     */
    getMaterialByName(name, allowMultiMaterials = false) {
        return this._getMaterial(allowMultiMaterials, (m) => m.name === name);
    }
    /**
     * Gets a last added material using a given id
     * @param id defines the material's id
     * @param allowMultiMaterials determines whether multimaterials should be considered
     * @returns the last material with the given id or null if none found.
     */
    getLastMaterialById(id, allowMultiMaterials = false) {
        for (let index = this.materials.length - 1; index >= 0; index--) {
            if (this.materials[index].id === id) {
                return this.materials[index];
            }
        }
        if (allowMultiMaterials) {
            for (let index = this.multiMaterials.length - 1; index >= 0; index--) {
                if (this.multiMaterials[index].id === id) {
                    return this.multiMaterials[index];
                }
            }
        }
        return null;
    }
    /**
     * Get a texture using its unique id
     * @param uniqueId defines the texture's unique id
     * @returns the texture or null if none found.
     */
    getTextureByUniqueId(uniqueId) {
        for (let index = 0; index < this.textures.length; index++) {
            if (this.textures[index].uniqueId === uniqueId) {
                return this.textures[index];
            }
        }
        return null;
    }
    /**
     * Gets a texture using its name
     * @param name defines the texture's name
     * @returns the texture or null if none found.
     */
    getTextureByName(name) {
        for (let index = 0; index < this.textures.length; index++) {
            if (this.textures[index].name === name) {
                return this.textures[index];
            }
        }
        return null;
    }
    /**
     * Gets a camera using its Id
     * @param id defines the Id to look for
     * @returns the camera or null if not found
     */
    getCameraById(id) {
        for (let index = 0; index < this.cameras.length; index++) {
            if (this.cameras[index].id === id) {
                return this.cameras[index];
            }
        }
        return null;
    }
    /**
     * Gets a camera using its unique Id
     * @param uniqueId defines the unique Id to look for
     * @returns the camera or null if not found
     */
    getCameraByUniqueId(uniqueId) {
        for (let index = 0; index < this.cameras.length; index++) {
            if (this.cameras[index].uniqueId === uniqueId) {
                return this.cameras[index];
            }
        }
        return null;
    }
    /**
     * Gets a camera using its name
     * @param name defines the camera's name
     * @returns the camera or null if none found.
     */
    getCameraByName(name) {
        for (let index = 0; index < this.cameras.length; index++) {
            if (this.cameras[index].name === name) {
                return this.cameras[index];
            }
        }
        return null;
    }
    /**
     * Gets a bone using its Id
     * @param id defines the bone's Id
     * @returns the bone or null if not found
     */
    getBoneById(id) {
        for (let skeletonIndex = 0; skeletonIndex < this.skeletons.length; skeletonIndex++) {
            const skeleton = this.skeletons[skeletonIndex];
            for (let boneIndex = 0; boneIndex < skeleton.bones.length; boneIndex++) {
                if (skeleton.bones[boneIndex].id === id) {
                    return skeleton.bones[boneIndex];
                }
            }
        }
        return null;
    }
    /**
     * Gets a bone using its id
     * @param name defines the bone's name
     * @returns the bone or null if not found
     */
    getBoneByName(name) {
        for (let skeletonIndex = 0; skeletonIndex < this.skeletons.length; skeletonIndex++) {
            const skeleton = this.skeletons[skeletonIndex];
            for (let boneIndex = 0; boneIndex < skeleton.bones.length; boneIndex++) {
                if (skeleton.bones[boneIndex].name === name) {
                    return skeleton.bones[boneIndex];
                }
            }
        }
        return null;
    }
    /**
     * Gets a light node using its name
     * @param name defines the light's name
     * @returns the light or null if none found.
     */
    getLightByName(name) {
        for (let index = 0; index < this.lights.length; index++) {
            if (this.lights[index].name === name) {
                return this.lights[index];
            }
        }
        return null;
    }
    /**
     * Gets a light node using its Id
     * @param id defines the light's Id
     * @returns the light or null if none found.
     */
    getLightById(id) {
        for (let index = 0; index < this.lights.length; index++) {
            if (this.lights[index].id === id) {
                return this.lights[index];
            }
        }
        return null;
    }
    /**
     * Gets a light node using its scene-generated unique Id
     * @param uniqueId defines the light's unique Id
     * @returns the light or null if none found.
     */
    getLightByUniqueId(uniqueId) {
        for (let index = 0; index < this.lights.length; index++) {
            if (this.lights[index].uniqueId === uniqueId) {
                return this.lights[index];
            }
        }
        return null;
    }
    /**
     * Gets a particle system by Id
     * @param id defines the particle system Id
     * @returns the corresponding system or null if none found
     */
    getParticleSystemById(id) {
        for (let index = 0; index < this.particleSystems.length; index++) {
            if (this.particleSystems[index].id === id) {
                return this.particleSystems[index];
            }
        }
        return null;
    }
    /**
     * Gets a geometry using its Id
     * @param id defines the geometry's Id
     * @returns the geometry or null if none found.
     */
    getGeometryById(id) {
        for (let index = 0; index < this.geometries.length; index++) {
            if (this.geometries[index].id === id) {
                return this.geometries[index];
            }
        }
        return null;
    }
    _getGeometryByUniqueId(uniqueId) {
        if (this._geometriesByUniqueId) {
            const index = this._geometriesByUniqueId[uniqueId];
            if (index !== undefined) {
                return this.geometries[index];
            }
        }
        else {
            for (let index = 0; index < this.geometries.length; index++) {
                if (this.geometries[index].uniqueId === uniqueId) {
                    return this.geometries[index];
                }
            }
        }
        return null;
    }
    /**
     * Add a new geometry to this scene
     * @param geometry defines the geometry to be added to the scene.
     * @param force defines if the geometry must be pushed even if a geometry with this id already exists
     * @returns a boolean defining if the geometry was added or not
     */
    pushGeometry(geometry, force) {
        if (!force && this._getGeometryByUniqueId(geometry.uniqueId)) {
            return false;
        }
        this.addGeometry(geometry);
        Tools.SetImmediate(() => {
            this.onNewGeometryAddedObservable.notifyObservers(geometry);
        });
        return true;
    }
    /**
     * Removes an existing geometry
     * @param geometry defines the geometry to be removed from the scene
     * @returns a boolean defining if the geometry was removed or not
     */
    removeGeometry(geometry) {
        let index;
        if (this._geometriesByUniqueId) {
            index = this._geometriesByUniqueId[geometry.uniqueId];
            if (index === undefined) {
                return false;
            }
        }
        else {
            index = this.geometries.indexOf(geometry);
            if (index < 0) {
                return false;
            }
        }
        if (index !== this.geometries.length - 1) {
            const lastGeometry = this.geometries[this.geometries.length - 1];
            if (lastGeometry) {
                this.geometries[index] = lastGeometry;
                if (this._geometriesByUniqueId) {
                    this._geometriesByUniqueId[lastGeometry.uniqueId] = index;
                }
            }
        }
        if (this._geometriesByUniqueId) {
            this._geometriesByUniqueId[geometry.uniqueId] = undefined;
        }
        this.geometries.pop();
        this.onGeometryRemovedObservable.notifyObservers(geometry);
        return true;
    }
    /**
     * Gets the list of geometries attached to the scene
     * @returns an array of Geometry
     */
    getGeometries() {
        return this.geometries;
    }
    /**
     * Gets the first added mesh found of a given Id
     * @param id defines the Id to search for
     * @returns the mesh found or null if not found at all
     */
    getMeshById(id) {
        for (let index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].id === id) {
                return this.meshes[index];
            }
        }
        return null;
    }
    /**
     * Gets a list of meshes using their Id
     * @param id defines the Id to search for
     * @returns a list of meshes
     */
    getMeshesById(id) {
        return this.meshes.filter(function (m) {
            return m.id === id;
        });
    }
    /**
     * Gets the first added transform node found of a given Id
     * @param id defines the Id to search for
     * @returns the found transform node or null if not found at all.
     */
    getTransformNodeById(id) {
        for (let index = 0; index < this.transformNodes.length; index++) {
            if (this.transformNodes[index].id === id) {
                return this.transformNodes[index];
            }
        }
        return null;
    }
    /**
     * Gets a transform node with its auto-generated unique Id
     * @param uniqueId defines the unique Id to search for
     * @returns the found transform node or null if not found at all.
     */
    getTransformNodeByUniqueId(uniqueId) {
        for (let index = 0; index < this.transformNodes.length; index++) {
            if (this.transformNodes[index].uniqueId === uniqueId) {
                return this.transformNodes[index];
            }
        }
        return null;
    }
    /**
     * Gets a list of transform nodes using their Id
     * @param id defines the Id to search for
     * @returns a list of transform nodes
     */
    getTransformNodesById(id) {
        return this.transformNodes.filter(function (m) {
            return m.id === id;
        });
    }
    /**
     * Gets a mesh with its auto-generated unique Id
     * @param uniqueId defines the unique Id to search for
     * @returns the found mesh or null if not found at all.
     */
    getMeshByUniqueId(uniqueId) {
        for (let index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].uniqueId === uniqueId) {
                return this.meshes[index];
            }
        }
        return null;
    }
    /**
     * Gets a the last added mesh using a given Id
     * @param id defines the Id to search for
     * @returns the found mesh or null if not found at all.
     */
    getLastMeshById(id) {
        for (let index = this.meshes.length - 1; index >= 0; index--) {
            if (this.meshes[index].id === id) {
                return this.meshes[index];
            }
        }
        return null;
    }
    /**
     * Gets a the last transform node using a given Id
     * @param id defines the Id to search for
     * @returns the found mesh or null if not found at all.
     */
    getLastTransformNodeById(id) {
        for (let index = this.transformNodes.length - 1; index >= 0; index--) {
            if (this.transformNodes[index].id === id) {
                return this.transformNodes[index];
            }
        }
        return null;
    }
    /**
     * Gets a the last added node (Mesh, Camera, Light) using a given Id
     * @param id defines the Id to search for
     * @returns the found node or null if not found at all
     */
    getLastEntryById(id) {
        let index;
        for (index = this.meshes.length - 1; index >= 0; index--) {
            if (this.meshes[index].id === id) {
                return this.meshes[index];
            }
        }
        for (index = this.transformNodes.length - 1; index >= 0; index--) {
            if (this.transformNodes[index].id === id) {
                return this.transformNodes[index];
            }
        }
        for (index = this.cameras.length - 1; index >= 0; index--) {
            if (this.cameras[index].id === id) {
                return this.cameras[index];
            }
        }
        for (index = this.lights.length - 1; index >= 0; index--) {
            if (this.lights[index].id === id) {
                return this.lights[index];
            }
        }
        return null;
    }
    /**
     * Gets a node (Mesh, Camera, Light) using a given Id
     * @param id defines the Id to search for
     * @returns the found node or null if not found at all
     */
    getNodeById(id) {
        const mesh = this.getMeshById(id);
        if (mesh) {
            return mesh;
        }
        const transformNode = this.getTransformNodeById(id);
        if (transformNode) {
            return transformNode;
        }
        const light = this.getLightById(id);
        if (light) {
            return light;
        }
        const camera = this.getCameraById(id);
        if (camera) {
            return camera;
        }
        const bone = this.getBoneById(id);
        if (bone) {
            return bone;
        }
        return null;
    }
    /**
     * Gets a node (Mesh, Camera, Light) using a given name
     * @param name defines the name to search for
     * @returns the found node or null if not found at all.
     */
    getNodeByName(name) {
        const mesh = this.getMeshByName(name);
        if (mesh) {
            return mesh;
        }
        const transformNode = this.getTransformNodeByName(name);
        if (transformNode) {
            return transformNode;
        }
        const light = this.getLightByName(name);
        if (light) {
            return light;
        }
        const camera = this.getCameraByName(name);
        if (camera) {
            return camera;
        }
        const bone = this.getBoneByName(name);
        if (bone) {
            return bone;
        }
        return null;
    }
    /**
     * Gets a mesh using a given name
     * @param name defines the name to search for
     * @returns the found mesh or null if not found at all.
     */
    getMeshByName(name) {
        for (let index = 0; index < this.meshes.length; index++) {
            if (this.meshes[index].name === name) {
                return this.meshes[index];
            }
        }
        return null;
    }
    /**
     * Gets a transform node using a given name
     * @param name defines the name to search for
     * @returns the found transform node or null if not found at all.
     */
    getTransformNodeByName(name) {
        for (let index = 0; index < this.transformNodes.length; index++) {
            if (this.transformNodes[index].name === name) {
                return this.transformNodes[index];
            }
        }
        return null;
    }
    /**
     * Gets a skeleton using a given Id (if many are found, this function will pick the last one)
     * @param id defines the Id to search for
     * @returns the found skeleton or null if not found at all.
     */
    getLastSkeletonById(id) {
        for (let index = this.skeletons.length - 1; index >= 0; index--) {
            if (this.skeletons[index].id === id) {
                return this.skeletons[index];
            }
        }
        return null;
    }
    /**
     * Gets a skeleton using a given auto generated unique id
     * @param  uniqueId defines the unique id to search for
     * @returns the found skeleton or null if not found at all.
     */
    getSkeletonByUniqueId(uniqueId) {
        for (let index = 0; index < this.skeletons.length; index++) {
            if (this.skeletons[index].uniqueId === uniqueId) {
                return this.skeletons[index];
            }
        }
        return null;
    }
    /**
     * Gets a skeleton using a given id (if many are found, this function will pick the first one)
     * @param id defines the id to search for
     * @returns the found skeleton or null if not found at all.
     */
    getSkeletonById(id) {
        for (let index = 0; index < this.skeletons.length; index++) {
            if (this.skeletons[index].id === id) {
                return this.skeletons[index];
            }
        }
        return null;
    }
    /**
     * Gets a skeleton using a given name
     * @param name defines the name to search for
     * @returns the found skeleton or null if not found at all.
     */
    getSkeletonByName(name) {
        for (let index = 0; index < this.skeletons.length; index++) {
            if (this.skeletons[index].name === name) {
                return this.skeletons[index];
            }
        }
        return null;
    }
    /**
     * Gets a morph target manager  using a given id (if many are found, this function will pick the last one)
     * @param id defines the id to search for
     * @returns the found morph target manager or null if not found at all.
     */
    getMorphTargetManagerById(id) {
        for (let index = 0; index < this.morphTargetManagers.length; index++) {
            if (this.morphTargetManagers[index].uniqueId === id) {
                return this.morphTargetManagers[index];
            }
        }
        return null;
    }
    /**
     * Gets a morph target using a given id (if many are found, this function will pick the first one)
     * @param id defines the id to search for
     * @returns the found morph target or null if not found at all.
     */
    getMorphTargetById(id) {
        for (let managerIndex = 0; managerIndex < this.morphTargetManagers.length; ++managerIndex) {
            const morphTargetManager = this.morphTargetManagers[managerIndex];
            for (let index = 0; index < morphTargetManager.numTargets; ++index) {
                const target = morphTargetManager.getTarget(index);
                if (target.id === id) {
                    return target;
                }
            }
        }
        return null;
    }
    /**
     * Gets a morph target using a given name (if many are found, this function will pick the first one)
     * @param name defines the name to search for
     * @returns the found morph target or null if not found at all.
     */
    getMorphTargetByName(name) {
        for (let managerIndex = 0; managerIndex < this.morphTargetManagers.length; ++managerIndex) {
            const morphTargetManager = this.morphTargetManagers[managerIndex];
            for (let index = 0; index < morphTargetManager.numTargets; ++index) {
                const target = morphTargetManager.getTarget(index);
                if (target.name === name) {
                    return target;
                }
            }
        }
        return null;
    }
    /**
     * Gets a post process using a given name (if many are found, this function will pick the first one)
     * @param name defines the name to search for
     * @returns the found post process or null if not found at all.
     */
    getPostProcessByName(name) {
        for (let postProcessIndex = 0; postProcessIndex < this.postProcesses.length; ++postProcessIndex) {
            const postProcess = this.postProcesses[postProcessIndex];
            if (postProcess.name === name) {
                return postProcess;
            }
        }
        return null;
    }
    /**
     * Gets a boolean indicating if the given mesh is active
     * @param mesh defines the mesh to look for
     * @returns true if the mesh is in the active list
     */
    isActiveMesh(mesh) {
        return this._activeMeshes.indexOf(mesh) !== -1;
    }
    /**
     * Return a unique id as a string which can serve as an identifier for the scene
     */
    get uid() {
        if (!this._uid) {
            this._uid = Tools.RandomId();
        }
        return this._uid;
    }
    /**
     * Add an externally attached data from its key.
     * This method call will fail and return false, if such key already exists.
     * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
     * @param key the unique key that identifies the data
     * @param data the data object to associate to the key for this Engine instance
     * @returns true if no such key were already present and the data was added successfully, false otherwise
     */
    addExternalData(key, data) {
        if (!this._externalData) {
            this._externalData = new StringDictionary();
        }
        return this._externalData.add(key, data);
    }
    /**
     * Get an externally attached data from its key
     * @param key the unique key that identifies the data
     * @returns the associated data, if present (can be null), or undefined if not present
     */
    getExternalData(key) {
        if (!this._externalData) {
            return null;
        }
        return this._externalData.get(key);
    }
    /**
     * Get an externally attached data from its key, create it using a factory if it's not already present
     * @param key the unique key that identifies the data
     * @param factory the factory that will be called to create the instance if and only if it doesn't exists
     * @returns the associated data, can be null if the factory returned null.
     */
    getOrAddExternalDataWithFactory(key, factory) {
        if (!this._externalData) {
            this._externalData = new StringDictionary();
        }
        return this._externalData.getOrAddWithFactory(key, factory);
    }
    /**
     * Remove an externally attached data from the Engine instance
     * @param key the unique key that identifies the data
     * @returns true if the data was successfully removed, false if it doesn't exist
     */
    removeExternalData(key) {
        return this._externalData.remove(key);
    }
    _evaluateSubMesh(subMesh, mesh, initialMesh, forcePush) {
        if (forcePush || subMesh.isInFrustum(this._frustumPlanes)) {
            for (const step of this._evaluateSubMeshStage) {
                step.action(mesh, subMesh);
            }
            const material = subMesh.getMaterial();
            if (material !== null && material !== undefined) {
                // Render targets
                if (material.hasRenderTargetTextures && material.getRenderTargetTextures != null) {
                    if (this._processedMaterials.indexOf(material) === -1) {
                        this._processedMaterials.push(material);
                        this._materialsRenderTargets.concatWithNoDuplicate(material.getRenderTargetTextures());
                    }
                }
                // Dispatch
                this._renderingManager.dispatch(subMesh, mesh, material);
            }
        }
    }
    /**
     * Clear the processed materials smart array preventing retention point in material dispose.
     */
    freeProcessedMaterials() {
        this._processedMaterials.dispose();
    }
    /** Gets or sets a boolean blocking all the calls to freeActiveMeshes and freeRenderingGroups
     * It can be used in order to prevent going through methods freeRenderingGroups and freeActiveMeshes several times to improve performance
     * when disposing several meshes in a row or a hierarchy of meshes.
     * When used, it is the responsibility of the user to blockfreeActiveMeshesAndRenderingGroups back to false.
     */
    get blockfreeActiveMeshesAndRenderingGroups() {
        return this._preventFreeActiveMeshesAndRenderingGroups;
    }
    set blockfreeActiveMeshesAndRenderingGroups(value) {
        if (this._preventFreeActiveMeshesAndRenderingGroups === value) {
            return;
        }
        if (value) {
            this.freeActiveMeshes();
            this.freeRenderingGroups();
        }
        this._preventFreeActiveMeshesAndRenderingGroups = value;
    }
    /**
     * Clear the active meshes smart array preventing retention point in mesh dispose.
     */
    freeActiveMeshes() {
        if (this.blockfreeActiveMeshesAndRenderingGroups) {
            return;
        }
        this._activeMeshes.dispose();
        if (this.activeCamera && this.activeCamera._activeMeshes) {
            this.activeCamera._activeMeshes.dispose();
        }
        if (this.activeCameras) {
            for (let i = 0; i < this.activeCameras.length; i++) {
                const activeCamera = this.activeCameras[i];
                if (activeCamera && activeCamera._activeMeshes) {
                    activeCamera._activeMeshes.dispose();
                }
            }
        }
    }
    /**
     * Clear the info related to rendering groups preventing retention points during dispose.
     */
    freeRenderingGroups() {
        if (this.blockfreeActiveMeshesAndRenderingGroups) {
            return;
        }
        if (this._renderingManager) {
            this._renderingManager.freeRenderingGroups();
        }
        if (this.textures) {
            for (let i = 0; i < this.textures.length; i++) {
                const texture = this.textures[i];
                if (texture && texture.renderList) {
                    texture.freeRenderingGroups();
                }
            }
        }
    }
    /** @internal */
    _isInIntermediateRendering() {
        return this._intermediateRendering;
    }
    /**
     * Use this function to stop evaluating active meshes. The current list will be keep alive between frames
     * @param skipEvaluateActiveMeshes defines an optional boolean indicating that the evaluate active meshes step must be completely skipped
     * @param onSuccess optional success callback
     * @param onError optional error callback
     * @param freezeMeshes defines if meshes should be frozen (true by default)
     * @param keepFrustumCulling defines if you want to keep running the frustum clipping (false by default)
     * @returns the current scene
     */
    freezeActiveMeshes(skipEvaluateActiveMeshes = false, onSuccess, onError, freezeMeshes = true, keepFrustumCulling = false) {
        this.executeWhenReady(() => {
            if (!this.activeCamera) {
                onError && onError("No active camera found");
                return;
            }
            if (!this._frustumPlanes) {
                this.updateTransformMatrix();
            }
            this._evaluateActiveMeshes();
            this._activeMeshesFrozen = true;
            this._activeMeshesFrozenButKeepClipping = keepFrustumCulling;
            this._skipEvaluateActiveMeshesCompletely = skipEvaluateActiveMeshes;
            if (freezeMeshes) {
                for (let index = 0; index < this._activeMeshes.length; index++) {
                    this._activeMeshes.data[index]._freeze();
                }
            }
            onSuccess && onSuccess();
        });
        return this;
    }
    /**
     * Use this function to restart evaluating active meshes on every frame
     * @returns the current scene
     */
    unfreezeActiveMeshes() {
        for (let index = 0; index < this.meshes.length; index++) {
            const mesh = this.meshes[index];
            if (mesh._internalAbstractMeshDataInfo) {
                mesh._internalAbstractMeshDataInfo._isActive = false;
            }
        }
        for (let index = 0; index < this._activeMeshes.length; index++) {
            this._activeMeshes.data[index]._unFreeze();
        }
        this._activeMeshesFrozen = false;
        return this;
    }
    _executeActiveContainerCleanup(container) {
        const isInFastMode = this._engine.snapshotRendering && this._engine.snapshotRenderingMode === 1;
        if (!isInFastMode && this._activeMeshesFrozen && this._activeMeshes.length) {
            return; // Do not execute in frozen mode
        }
        // We need to ensure we are not in the rendering loop
        this.onBeforeRenderObservable.addOnce(() => container.dispose());
    }
    _evaluateActiveMeshes() {
        if (this._engine.snapshotRendering && this._engine.snapshotRenderingMode === 1) {
            if (this._activeMeshes.length > 0) {
                this.activeCamera?._activeMeshes.reset();
                this._activeMeshes.reset();
                this._renderingManager.reset();
                this._processedMaterials.reset();
                this._activeParticleSystems.reset();
                this._activeSkeletons.reset();
                this._softwareSkinnedMeshes.reset();
            }
            return;
        }
        if (this._activeMeshesFrozen && this._activeMeshes.length) {
            if (!this._skipEvaluateActiveMeshesCompletely) {
                const len = this._activeMeshes.length;
                for (let i = 0; i < len; i++) {
                    const mesh = this._activeMeshes.data[i];
                    mesh.computeWorldMatrix();
                }
            }
            if (this._activeParticleSystems) {
                const psLength = this._activeParticleSystems.length;
                for (let i = 0; i < psLength; i++) {
                    this._activeParticleSystems.data[i].animate();
                }
            }
            this._renderingManager.resetSprites();
            return;
        }
        if (!this.activeCamera) {
            return;
        }
        this.onBeforeActiveMeshesEvaluationObservable.notifyObservers(this);
        this.activeCamera._activeMeshes.reset();
        this._activeMeshes.reset();
        this._renderingManager.reset();
        this._processedMaterials.reset();
        this._activeParticleSystems.reset();
        this._activeSkeletons.reset();
        this._softwareSkinnedMeshes.reset();
        this._materialsRenderTargets.reset();
        for (const step of this._beforeEvaluateActiveMeshStage) {
            step.action();
        }
        // Determine mesh candidates
        const meshes = this.getActiveMeshCandidates();
        // Check each mesh
        const len = meshes.length;
        for (let i = 0; i < len; i++) {
            const mesh = meshes.data[i];
            let currentLOD = mesh._internalAbstractMeshDataInfo._currentLOD.get(this.activeCamera);
            if (currentLOD) {
                currentLOD[1] = -1;
            }
            else {
                currentLOD = [mesh, -1];
                mesh._internalAbstractMeshDataInfo._currentLOD.set(this.activeCamera, currentLOD);
            }
            if (mesh.isBlocked) {
                continue;
            }
            this._totalVertices.addCount(mesh.getTotalVertices(), false);
            if (!mesh.isReady() || !mesh.isEnabled() || mesh.scaling.hasAZeroComponent) {
                continue;
            }
            mesh.computeWorldMatrix();
            // Intersections
            if (mesh.actionManager && mesh.actionManager.hasSpecificTriggers2(12, 13)) {
                this._meshesForIntersections.pushNoDuplicate(mesh);
            }
            // Switch to current LOD
            let meshToRender = this.customLODSelector ? this.customLODSelector(mesh, this.activeCamera) : mesh.getLOD(this.activeCamera);
            currentLOD[0] = meshToRender;
            currentLOD[1] = this._frameId;
            if (meshToRender === undefined || meshToRender === null) {
                continue;
            }
            // Compute world matrix if LOD is billboard
            if (meshToRender !== mesh && meshToRender.billboardMode !== 0) {
                meshToRender.computeWorldMatrix();
            }
            mesh._preActivate();
            if (mesh.isVisible &&
                mesh.visibility > 0 &&
                (mesh.layerMask & this.activeCamera.layerMask) !== 0 &&
                (this._skipFrustumClipping || mesh.alwaysSelectAsActiveMesh || mesh.isInFrustum(this._frustumPlanes))) {
                this._activeMeshes.push(mesh);
                this.activeCamera._activeMeshes.push(mesh);
                if (meshToRender !== mesh) {
                    meshToRender._activate(this._renderId, false);
                }
                for (const step of this._preActiveMeshStage) {
                    step.action(mesh);
                }
                if (mesh._activate(this._renderId, false)) {
                    if (!mesh.isAnInstance) {
                        meshToRender._internalAbstractMeshDataInfo._onlyForInstances = false;
                    }
                    else {
                        if (mesh._internalAbstractMeshDataInfo._actAsRegularMesh) {
                            meshToRender = mesh;
                        }
                    }
                    meshToRender._internalAbstractMeshDataInfo._isActive = true;
                    this._activeMesh(mesh, meshToRender);
                }
                mesh._postActivate();
            }
        }
        this.onAfterActiveMeshesEvaluationObservable.notifyObservers(this);
        // Particle systems
        if (this.particlesEnabled) {
            this.onBeforeParticlesRenderingObservable.notifyObservers(this);
            for (let particleIndex = 0; particleIndex < this.particleSystems.length; particleIndex++) {
                const particleSystem = this.particleSystems[particleIndex];
                if (!particleSystem.isStarted() || !particleSystem.emitter) {
                    continue;
                }
                const emitter = particleSystem.emitter;
                if (!emitter.position || emitter.isEnabled()) {
                    this._activeParticleSystems.push(particleSystem);
                    particleSystem.animate();
                    this._renderingManager.dispatchParticles(particleSystem);
                }
            }
            this.onAfterParticlesRenderingObservable.notifyObservers(this);
        }
    }
    /** @internal */
    _prepareSkeleton(mesh) {
        if (!this._skeletonsEnabled || !mesh.skeleton) {
            return;
        }
        if (this._activeSkeletons.pushNoDuplicate(mesh.skeleton)) {
            mesh.skeleton.prepare();
            this._activeBones.addCount(mesh.skeleton.bones.length, false);
        }
        if (!mesh.computeBonesUsingShaders) {
            if (this._softwareSkinnedMeshes.pushNoDuplicate(mesh) && this.frameGraph) {
                mesh.applySkeleton(mesh.skeleton);
            }
        }
    }
    _activeMesh(sourceMesh, mesh) {
        this._prepareSkeleton(mesh);
        let forcePush = sourceMesh.hasInstances || sourceMesh.isAnInstance || this.dispatchAllSubMeshesOfActiveMeshes || this._skipFrustumClipping || mesh.alwaysSelectAsActiveMesh;
        if (mesh && mesh.subMeshes && mesh.subMeshes.length > 0) {
            const subMeshes = this.getActiveSubMeshCandidates(mesh);
            const len = subMeshes.length;
            forcePush = forcePush || len === 1;
            for (let i = 0; i < len; i++) {
                const subMesh = subMeshes.data[i];
                this._evaluateSubMesh(subMesh, mesh, sourceMesh, forcePush);
            }
        }
    }
    /**
     * Update the transform matrix to update from the current active camera
     * @param force defines a boolean used to force the update even if cache is up to date
     */
    updateTransformMatrix(force) {
        const activeCamera = this.activeCamera;
        if (!activeCamera) {
            return;
        }
        if (activeCamera._renderingMultiview) {
            const leftCamera = activeCamera._rigCameras[0];
            const rightCamera = activeCamera._rigCameras[1];
            this.setTransformMatrix(leftCamera.getViewMatrix(), leftCamera.getProjectionMatrix(force), rightCamera.getViewMatrix(), rightCamera.getProjectionMatrix(force));
        }
        else {
            this.setTransformMatrix(activeCamera.getViewMatrix(), activeCamera.getProjectionMatrix(force));
        }
    }
    _bindFrameBuffer(camera, clear = true) {
        if (camera && camera._multiviewTexture) {
            camera._multiviewTexture._bindFrameBuffer();
        }
        else if (camera && camera.outputRenderTarget) {
            camera.outputRenderTarget._bindFrameBuffer();
        }
        else {
            if (!this._engine._currentFrameBufferIsDefaultFrameBuffer()) {
                this._engine.restoreDefaultFramebuffer();
            }
        }
        if (clear) {
            this._clearFrameBuffer(camera);
        }
    }
    _clearFrameBuffer(camera) {
        // we assume the framebuffer currently bound is the right one
        if (camera && camera._multiviewTexture) {
            // no clearing
        }
        else if (camera && camera.outputRenderTarget && !camera._renderingMultiview) {
            const rtt = camera.outputRenderTarget;
            if (rtt.onClearObservable.hasObservers()) {
                rtt.onClearObservable.notifyObservers(this._engine);
            }
            else if (!rtt.skipInitialClear && !camera.isRightCamera) {
                if (this.autoClear) {
                    this._engine.clear(rtt.clearColor || this._clearColor, !rtt._cleared, true, true);
                }
                rtt._cleared = true;
            }
        }
        else {
            if (!this._defaultFrameBufferCleared) {
                this._defaultFrameBufferCleared = true;
                this._clear();
            }
            else {
                this._engine.clear(null, false, true, true);
            }
        }
    }
    /**
     * @internal
     */
    _renderForCamera(camera, rigParent, bindFrameBuffer = true) {
        if (camera && camera._skipRendering) {
            return;
        }
        const engine = this._engine;
        // Use _activeCamera instead of activeCamera to avoid onActiveCameraChanged
        this._activeCamera = camera;
        if (!this.activeCamera) {
            throw new Error("Active camera not set");
        }
        // Viewport
        engine.setViewport(this.activeCamera.viewport);
        // Camera
        this.resetCachedMaterial();
        this._renderId++;
        if (!this.prePass && bindFrameBuffer) {
            let skipInitialClear = true;
            if (camera._renderingMultiview && camera.outputRenderTarget) {
                skipInitialClear = camera.outputRenderTarget.skipInitialClear;
                if (this.autoClear) {
                    this._defaultFrameBufferCleared = false;
                    camera.outputRenderTarget.skipInitialClear = false;
                }
            }
            this._bindFrameBuffer(this._activeCamera);
            if (camera._renderingMultiview && camera.outputRenderTarget) {
                camera.outputRenderTarget.skipInitialClear = skipInitialClear;
            }
        }
        this.updateTransformMatrix();
        this.onBeforeCameraRenderObservable.notifyObservers(this.activeCamera);
        // Meshes
        this._evaluateActiveMeshes();
        // Software skinning
        for (let softwareSkinnedMeshIndex = 0; softwareSkinnedMeshIndex < this._softwareSkinnedMeshes.length; softwareSkinnedMeshIndex++) {
            const mesh = this._softwareSkinnedMeshes.data[softwareSkinnedMeshIndex];
            mesh.applySkeleton(mesh.skeleton);
        }
        // Render targets
        this.onBeforeRenderTargetsRenderObservable.notifyObservers(this);
        this._renderTargets.concatWithNoDuplicate(this._materialsRenderTargets);
        if (camera.customRenderTargets && camera.customRenderTargets.length > 0) {
            this._renderTargets.concatWithNoDuplicate(camera.customRenderTargets);
        }
        if (rigParent && rigParent.customRenderTargets && rigParent.customRenderTargets.length > 0) {
            this._renderTargets.concatWithNoDuplicate(rigParent.customRenderTargets);
        }
        if (this.environmentTexture && this.environmentTexture.isRenderTarget) {
            this._renderTargets.pushNoDuplicate(this.environmentTexture);
        }
        // Collects render targets from external components.
        for (const step of this._gatherActiveCameraRenderTargetsStage) {
            step.action(this._renderTargets);
        }
        let needRebind = false;
        if (this.renderTargetsEnabled) {
            this._intermediateRendering = true;
            if (this._renderTargets.length > 0) {
                Tools.StartPerformanceCounter("Render targets", this._renderTargets.length > 0);
                for (let renderIndex = 0; renderIndex < this._renderTargets.length; renderIndex++) {
                    const renderTarget = this._renderTargets.data[renderIndex];
                    if (renderTarget._shouldRender()) {
                        this._renderId++;
                        const hasSpecialRenderTargetCamera = renderTarget.activeCamera && renderTarget.activeCamera !== this.activeCamera;
                        renderTarget.render(hasSpecialRenderTargetCamera, this.dumpNextRenderTargets);
                        needRebind = true;
                    }
                }
                Tools.EndPerformanceCounter("Render targets", this._renderTargets.length > 0);
                this._renderId++;
            }
            for (const step of this._cameraDrawRenderTargetStage) {
                needRebind = step.action(this.activeCamera) || needRebind;
            }
            this._intermediateRendering = false;
        }
        this._engine.currentRenderPassId = camera.outputRenderTarget?.renderPassId ?? camera.renderPassId ?? 0;
        // Restore framebuffer after rendering to targets
        if (needRebind && !this.prePass) {
            this._bindFrameBuffer(this._activeCamera, false);
            this.updateTransformMatrix();
        }
        this.onAfterRenderTargetsRenderObservable.notifyObservers(this);
        // Prepare Frame
        if (this.postProcessManager && !camera._multiviewTexture && !this.prePass) {
            this.postProcessManager._prepareFrame();
        }
        // Before Camera Draw
        for (const step of this._beforeCameraDrawStage) {
            step.action(this.activeCamera);
        }
        // Render
        this.onBeforeDrawPhaseObservable.notifyObservers(this);
        if (engine.snapshotRendering && engine.snapshotRenderingMode === 1) {
            this.finalizeSceneUbo();
        }
        this._renderingManager.render(null, null, true, true);
        this.onAfterDrawPhaseObservable.notifyObservers(this);
        // After Camera Draw
        for (const step of this._afterCameraDrawStage) {
            step.action(this.activeCamera);
        }
        // Finalize frame
        if (this.postProcessManager && !camera._multiviewTexture) {
            // if the camera has an output render target, render the post process to the render target
            const texture = camera.outputRenderTarget ? camera.outputRenderTarget.renderTarget : undefined;
            this.postProcessManager._finalizeFrame(camera.isIntermediate, texture);
        }
        // After post process
        for (const step of this._afterCameraPostProcessStage) {
            step.action(this.activeCamera);
        }
        // Reset some special arrays
        this._renderTargets.reset();
        this.onAfterCameraRenderObservable.notifyObservers(this.activeCamera);
    }
    _processSubCameras(camera, bindFrameBuffer = true) {
        if (camera.cameraRigMode === 0 || camera._renderingMultiview) {
            if (camera._renderingMultiview && !this._multiviewSceneUbo) {
                this._createMultiviewUbo();
            }
            this._renderForCamera(camera, undefined, bindFrameBuffer);
            this.onAfterRenderCameraObservable.notifyObservers(camera);
            return;
        }
        if (camera._useMultiviewToSingleView) {
            this._renderMultiviewToSingleView(camera);
        }
        else {
            // rig cameras
            this.onBeforeCameraRenderObservable.notifyObservers(camera);
            for (let index = 0; index < camera._rigCameras.length; index++) {
                this._renderForCamera(camera._rigCameras[index], camera);
            }
        }
        // Use _activeCamera instead of activeCamera to avoid onActiveCameraChanged
        this._activeCamera = camera;
        this.updateTransformMatrix();
        this.onAfterRenderCameraObservable.notifyObservers(camera);
    }
    _checkIntersections() {
        for (let index = 0; index < this._meshesForIntersections.length; index++) {
            const sourceMesh = this._meshesForIntersections.data[index];
            if (!sourceMesh.actionManager) {
                continue;
            }
            for (let actionIndex = 0; sourceMesh.actionManager && actionIndex < sourceMesh.actionManager.actions.length; actionIndex++) {
                const action = sourceMesh.actionManager.actions[actionIndex];
                if (action.trigger === 12 || action.trigger === 13) {
                    const parameters = action.getTriggerParameter();
                    const otherMesh = parameters.mesh ? parameters.mesh : parameters;
                    const areIntersecting = otherMesh.intersectsMesh(sourceMesh, parameters.usePreciseIntersection);
                    const currentIntersectionInProgress = sourceMesh._intersectionsInProgress.indexOf(otherMesh);
                    if (areIntersecting && currentIntersectionInProgress === -1) {
                        if (action.trigger === 12) {
                            action._executeCurrent(ActionEvent.CreateNew(sourceMesh, undefined, otherMesh));
                            sourceMesh._intersectionsInProgress.push(otherMesh);
                        }
                        else if (action.trigger === 13) {
                            sourceMesh._intersectionsInProgress.push(otherMesh);
                        }
                    }
                    else if (!areIntersecting && currentIntersectionInProgress > -1) {
                        //They intersected, and now they don't.
                        //is this trigger an exit trigger? execute an event.
                        if (action.trigger === 13) {
                            action._executeCurrent(ActionEvent.CreateNew(sourceMesh, undefined, otherMesh));
                        }
                        //if this is an exit trigger, or no exit trigger exists, remove the id from the intersection in progress array.
                        if (!sourceMesh.actionManager.hasSpecificTrigger(13, (parameter) => {
                            const parameterMesh = parameter.mesh ? parameter.mesh : parameter;
                            return otherMesh === parameterMesh;
                        }) ||
                            action.trigger === 13) {
                            sourceMesh._intersectionsInProgress.splice(currentIntersectionInProgress, 1);
                        }
                    }
                }
            }
        }
    }
    /**
     * @internal
     */
    _advancePhysicsEngineStep(step) {
        // Do nothing. Code will be replaced if physics engine component is referenced
    }
    /** @internal */
    _animate(customDeltaTime) {
        // Nothing to do as long as Animatable have not been imported.
    }
    /** Execute all animations (for a frame) */
    animate() {
        if (this._engine.isDeterministicLockStep()) {
            let deltaTime = Math.max(Scene.MinDeltaTime, Math.min(this._engine.getDeltaTime(), Scene.MaxDeltaTime)) + this._timeAccumulator;
            const defaultFrameTime = this._engine.getTimeStep();
            const defaultFPS = 1000.0 / defaultFrameTime / 1000.0;
            let stepsTaken = 0;
            const maxSubSteps = this._engine.getLockstepMaxSteps();
            let internalSteps = Math.floor(deltaTime / defaultFrameTime);
            internalSteps = Math.min(internalSteps, maxSubSteps);
            while (deltaTime > 0 && stepsTaken < internalSteps) {
                this.onBeforeStepObservable.notifyObservers(this);
                // Animations
                this._animationRatio = defaultFrameTime * defaultFPS;
                this._animate(defaultFrameTime);
                this.onAfterAnimationsObservable.notifyObservers(this);
                // Physics
                if (this.physicsEnabled) {
                    this._advancePhysicsEngineStep(defaultFrameTime);
                }
                this.onAfterStepObservable.notifyObservers(this);
                this._currentStepId++;
                stepsTaken++;
                deltaTime -= defaultFrameTime;
            }
            this._timeAccumulator = deltaTime < 0 ? 0 : deltaTime;
        }
        else {
            // Animations
            const deltaTime = this.useConstantAnimationDeltaTime ? 16 : Math.max(Scene.MinDeltaTime, Math.min(this._engine.getDeltaTime(), Scene.MaxDeltaTime));
            this._animationRatio = deltaTime * (60.0 / 1000.0);
            this._animate();
            this.onAfterAnimationsObservable.notifyObservers(this);
            // Physics
            if (this.physicsEnabled) {
                this._advancePhysicsEngineStep(deltaTime);
            }
        }
    }
    _clear() {
        if (this.autoClearDepthAndStencil || this.autoClear) {
            this._engine.clear(this._clearColor, this.autoClear || this.forceWireframe || this.forcePointsCloud, this.autoClearDepthAndStencil, this.autoClearDepthAndStencil);
        }
    }
    _checkCameraRenderTarget(camera) {
        if (camera?.outputRenderTarget && !camera?.isRigCamera) {
            camera.outputRenderTarget._cleared = false;
        }
        if (camera?.rigCameras?.length) {
            for (let i = 0; i < camera.rigCameras.length; ++i) {
                const rtt = camera.rigCameras[i].outputRenderTarget;
                if (rtt) {
                    rtt._cleared = false;
                }
            }
        }
    }
    /**
     * Resets the draw wrappers cache of all meshes
     * @param passId If provided, releases only the draw wrapper corresponding to this render pass id
     */
    resetDrawCache(passId) {
        if (!this.meshes) {
            return;
        }
        for (const mesh of this.meshes) {
            mesh.resetDrawCache(passId);
        }
    }
    _renderWithFrameGraph(updateCameras = true, ignoreAnimations = false) {
        this.activeCamera = null;
        this._activeParticleSystems.reset();
        this._activeSkeletons.reset();
        // Update Cameras
        if (updateCameras) {
            for (const camera of this.cameras) {
                camera.update();
                if (camera.cameraRigMode !== 0) {
                    // rig cameras
                    for (let index = 0; index < camera._rigCameras.length; index++) {
                        camera._rigCameras[index].update();
                    }
                }
            }
        }
        // We must keep these steps because the procedural texture component relies on them.
        // TODO: move the procedural texture component to the frame graph.
        for (const step of this._beforeClearStage) {
            step.action();
        }
        // Process meshes
        const meshes = this.getActiveMeshCandidates();
        const len = meshes.length;
        for (let i = 0; i < len; i++) {
            const mesh = meshes.data[i];
            if (mesh.isBlocked) {
                continue;
            }
            this._totalVertices.addCount(mesh.getTotalVertices(), false);
            if (!mesh.isReady() || !mesh.isEnabled() || mesh.scaling.hasAZeroComponent) {
                continue;
            }
            mesh.computeWorldMatrix();
            if (mesh.actionManager && mesh.actionManager.hasSpecificTriggers2(12, 13)) {
                this._meshesForIntersections.pushNoDuplicate(mesh);
            }
        }
        // Animate Particle systems
        if (this.particlesEnabled) {
            for (let particleIndex = 0; particleIndex < this.particleSystems.length; particleIndex++) {
                const particleSystem = this.particleSystems[particleIndex];
                if (!particleSystem.isStarted() || !particleSystem.emitter) {
                    continue;
                }
                const emitter = particleSystem.emitter;
                if (!emitter.position || emitter.isEnabled()) {
                    this._activeParticleSystems.push(particleSystem);
                    particleSystem.animate();
                }
            }
        }
        // Render the graph
        this.frameGraph?.execute();
    }
    /**
     * Render the scene
     * @param updateCameras defines a boolean indicating if cameras must update according to their inputs (true by default)
     * @param ignoreAnimations defines a boolean indicating if animations should not be executed (false by default)
     */
    render(updateCameras = true, ignoreAnimations = false) {
        if (this.isDisposed) {
            return;
        }
        if (this.onReadyObservable.hasObservers() && this._executeWhenReadyTimeoutId === null) {
            this._checkIsReady();
        }
        this._frameId++;
        this._defaultFrameBufferCleared = false;
        this._checkCameraRenderTarget(this.activeCamera);
        if (this.activeCameras?.length) {
            this.activeCameras.forEach(this._checkCameraRenderTarget);
        }
        // Register components that have been associated lately to the scene.
        this._registerTransientComponents();
        this._activeParticles.fetchNewFrame();
        this._totalVertices.fetchNewFrame();
        this._activeIndices.fetchNewFrame();
        this._activeBones.fetchNewFrame();
        this._meshesForIntersections.reset();
        this.resetCachedMaterial();
        this.onBeforeAnimationsObservable.notifyObservers(this);
        // Actions
        if (this.actionManager) {
            this.actionManager.processTrigger(11);
        }
        // Animations
        if (!ignoreAnimations) {
            this.animate();
        }
        // Before camera update steps
        for (const step of this._beforeCameraUpdateStage) {
            step.action();
        }
        // Update Cameras
        if (updateCameras) {
            if (this.activeCameras && this.activeCameras.length > 0) {
                for (let cameraIndex = 0; cameraIndex < this.activeCameras.length; cameraIndex++) {
                    const camera = this.activeCameras[cameraIndex];
                    camera.update();
                    if (camera.cameraRigMode !== 0) {
                        // rig cameras
                        for (let index = 0; index < camera._rigCameras.length; index++) {
                            camera._rigCameras[index].update();
                        }
                    }
                }
            }
            else if (this.activeCamera) {
                this.activeCamera.update();
                if (this.activeCamera.cameraRigMode !== 0) {
                    // rig cameras
                    for (let index = 0; index < this.activeCamera._rigCameras.length; index++) {
                        this.activeCamera._rigCameras[index].update();
                    }
                }
            }
        }
        // Before render
        this.onBeforeRenderObservable.notifyObservers(this);
        // Custom render function?
        if (this.customRenderFunction) {
            this._renderId++;
            this._engine.currentRenderPassId = 0;
            this.customRenderFunction(updateCameras, ignoreAnimations);
        }
        else {
            const engine = this.getEngine();
            // Customs render targets
            this.onBeforeRenderTargetsRenderObservable.notifyObservers(this);
            const currentActiveCamera = this.activeCameras?.length ? this.activeCameras[0] : this.activeCamera;
            if (this.renderTargetsEnabled) {
                Tools.StartPerformanceCounter("Custom render targets", this.customRenderTargets.length > 0);
                this._intermediateRendering = true;
                for (let customIndex = 0; customIndex < this.customRenderTargets.length; customIndex++) {
                    const renderTarget = this.customRenderTargets[customIndex];
                    if (renderTarget._shouldRender()) {
                        this._renderId++;
                        this.activeCamera = renderTarget.activeCamera || this.activeCamera;
                        if (!this.activeCamera) {
                            throw new Error("Active camera not set");
                        }
                        // Viewport
                        engine.setViewport(this.activeCamera.viewport);
                        // Camera
                        this.updateTransformMatrix();
                        renderTarget.render(currentActiveCamera !== this.activeCamera, this.dumpNextRenderTargets);
                    }
                }
                Tools.EndPerformanceCounter("Custom render targets", this.customRenderTargets.length > 0);
                this._intermediateRendering = false;
                this._renderId++;
            }
            this._engine.currentRenderPassId = currentActiveCamera?.renderPassId ?? 0;
            // Restore back buffer
            this.activeCamera = currentActiveCamera;
            if (this._activeCamera && this._activeCamera.cameraRigMode !== 22 && !this.prePass) {
                this._bindFrameBuffer(this._activeCamera, false);
            }
            this.onAfterRenderTargetsRenderObservable.notifyObservers(this);
            for (const step of this._beforeClearStage) {
                step.action();
            }
            // Clear
            this._clearFrameBuffer(this.activeCamera);
            // Collects render targets from external components.
            for (const step of this._gatherRenderTargetsStage) {
                step.action(this._renderTargets);
            }
            // Multi-cameras?
            if (this.activeCameras && this.activeCameras.length > 0) {
                for (let cameraIndex = 0; cameraIndex < this.activeCameras.length; cameraIndex++) {
                    this._processSubCameras(this.activeCameras[cameraIndex], cameraIndex > 0);
                }
            }
            else {
                if (!this.activeCamera) {
                    throw new Error("No camera defined");
                }
                this._processSubCameras(this.activeCamera, !!this.activeCamera.outputRenderTarget);
            }
        }
        // Intersection checks
        this._checkIntersections();
        // Executes the after render stage actions.
        for (const step of this._afterRenderStage) {
            step.action();
        }
        // After render
        if (this.afterRender) {
            this.afterRender();
        }
        this.onAfterRenderObservable.notifyObservers(this);
        // Cleaning
        if (this._toBeDisposed.length) {
            for (let index = 0; index < this._toBeDisposed.length; index++) {
                const data = this._toBeDisposed[index];
                if (data) {
                    data.dispose();
                }
            }
            this._toBeDisposed.length = 0;
        }
        if (this.dumpNextRenderTargets) {
            this.dumpNextRenderTargets = false;
        }
        this._activeBones.addCount(0, true);
        this._activeIndices.addCount(0, true);
        this._activeParticles.addCount(0, true);
        this._engine.restoreDefaultFramebuffer();
    }
    /**
     * Freeze all materials
     * A frozen material will not be updatable but should be faster to render
     * Note: multimaterials will not be frozen, but their submaterials will
     */
    freezeMaterials() {
        for (let i = 0; i < this.materials.length; i++) {
            this.materials[i].freeze();
        }
    }
    /**
     * Unfreeze all materials
     * A frozen material will not be updatable but should be faster to render
     */
    unfreezeMaterials() {
        for (let i = 0; i < this.materials.length; i++) {
            this.materials[i].unfreeze();
        }
    }
    /**
     * Releases all held resources
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this.beforeRender = null;
        this.afterRender = null;
        this.metadata = null;
        this.skeletons.length = 0;
        this.morphTargetManagers.length = 0;
        this._transientComponents.length = 0;
        this._isReadyForMeshStage.clear();
        this._beforeEvaluateActiveMeshStage.clear();
        this._evaluateSubMeshStage.clear();
        this._preActiveMeshStage.clear();
        this._cameraDrawRenderTargetStage.clear();
        this._beforeCameraDrawStage.clear();
        this._beforeRenderTargetDrawStage.clear();
        this._beforeRenderingGroupDrawStage.clear();
        this._beforeRenderingMeshStage.clear();
        this._afterRenderingMeshStage.clear();
        this._afterRenderingGroupDrawStage.clear();
        this._afterCameraDrawStage.clear();
        this._afterRenderTargetDrawStage.clear();
        this._afterRenderStage.clear();
        this._beforeCameraUpdateStage.clear();
        this._beforeClearStage.clear();
        this._gatherRenderTargetsStage.clear();
        this._gatherActiveCameraRenderTargetsStage.clear();
        this._pointerMoveStage.clear();
        this._pointerDownStage.clear();
        this._pointerUpStage.clear();
        this.importedMeshesFiles = [];
        if (this._activeAnimatables && this.stopAllAnimations) {
            // Ensures that no animatable notifies a callback that could start a new animation group, constantly adding new animatables to the active list...
            this._activeAnimatables.forEach((animatable) => {
                animatable.onAnimationEndObservable.clear();
                animatable.onAnimationEnd = null;
            });
            this.stopAllAnimations();
        }
        this.resetCachedMaterial();
        // Smart arrays
        if (this.activeCamera) {
            this.activeCamera._activeMeshes.dispose();
            this.activeCamera = null;
        }
        this.activeCameras = null;
        this._activeMeshes.dispose();
        this._renderingManager.dispose();
        this._processedMaterials.dispose();
        this._activeParticleSystems.dispose();
        this._activeSkeletons.dispose();
        this._softwareSkinnedMeshes.dispose();
        this._renderTargets.dispose();
        this._materialsRenderTargets.dispose();
        this._registeredForLateAnimationBindings.dispose();
        this._meshesForIntersections.dispose();
        this._toBeDisposed.length = 0;
        // Abort active requests
        const activeRequests = this._activeRequests.slice();
        for (const request of activeRequests) {
            request.abort();
        }
        this._activeRequests.length = 0;
        // Events
        try {
            this.onDisposeObservable.notifyObservers(this);
        }
        catch (e) {
            Logger.Error("An error occurred while calling onDisposeObservable!", e);
        }
        this.detachControl();
        // Detach cameras
        const canvas = this._engine.getInputElement();
        if (canvas) {
            for (let index = 0; index < this.cameras.length; index++) {
                this.cameras[index].detachControl();
            }
        }
        // Release animation groups
        this._disposeList(this.animationGroups);
        // Release lights
        this._disposeList(this.lights);
        // Release materials
        if (this._defaultMaterial) {
            this._defaultMaterial.dispose();
        }
        this._disposeList(this.multiMaterials);
        this._disposeList(this.materials);
        // Release meshes
        this._disposeList(this.meshes, (item) => item.dispose(true));
        this._disposeList(this.transformNodes, (item) => item.dispose(true));
        // Release cameras
        const cameras = this.cameras;
        this._disposeList(cameras);
        // Release particles
        this._disposeList(this.particleSystems);
        // Release postProcesses
        this._disposeList(this.postProcesses);
        // Release textures
        this._disposeList(this.textures);
        // Release morph targets
        this._disposeList(this.morphTargetManagers);
        // Release UBO
        this._sceneUbo.dispose();
        if (this._multiviewSceneUbo) {
            this._multiviewSceneUbo.dispose();
        }
        // Post-processes
        this.postProcessManager.dispose();
        // Components
        this._disposeList(this._components);
        // Remove from engine
        let index = this._engine.scenes.indexOf(this);
        if (index > -1) {
            this._engine.scenes.splice(index, 1);
        }
        if (EngineStore._LastCreatedScene === this) {
            EngineStore._LastCreatedScene = null;
            let engineIndex = EngineStore.Instances.length - 1;
            while (engineIndex >= 0) {
                const engine = EngineStore.Instances[engineIndex];
                if (engine.scenes.length > 0) {
                    EngineStore._LastCreatedScene = engine.scenes[this._engine.scenes.length - 1];
                    break;
                }
                engineIndex--;
            }
        }
        index = this._engine._virtualScenes.indexOf(this);
        if (index > -1) {
            this._engine._virtualScenes.splice(index, 1);
        }
        this._engine.wipeCaches(true);
        this.onDisposeObservable.clear();
        this.onBeforeRenderObservable.clear();
        this.onAfterRenderObservable.clear();
        this.onBeforeRenderTargetsRenderObservable.clear();
        this.onAfterRenderTargetsRenderObservable.clear();
        this.onAfterStepObservable.clear();
        this.onBeforeStepObservable.clear();
        this.onBeforeActiveMeshesEvaluationObservable.clear();
        this.onAfterActiveMeshesEvaluationObservable.clear();
        this.onBeforeParticlesRenderingObservable.clear();
        this.onAfterParticlesRenderingObservable.clear();
        this.onBeforeDrawPhaseObservable.clear();
        this.onAfterDrawPhaseObservable.clear();
        this.onBeforeAnimationsObservable.clear();
        this.onAfterAnimationsObservable.clear();
        this.onDataLoadedObservable.clear();
        this.onBeforeRenderingGroupObservable.clear();
        this.onAfterRenderingGroupObservable.clear();
        this.onMeshImportedObservable.clear();
        this.onBeforeCameraRenderObservable.clear();
        this.onAfterCameraRenderObservable.clear();
        this.onAfterRenderCameraObservable.clear();
        this.onReadyObservable.clear();
        this.onNewCameraAddedObservable.clear();
        this.onCameraRemovedObservable.clear();
        this.onNewLightAddedObservable.clear();
        this.onLightRemovedObservable.clear();
        this.onNewGeometryAddedObservable.clear();
        this.onGeometryRemovedObservable.clear();
        this.onNewTransformNodeAddedObservable.clear();
        this.onTransformNodeRemovedObservable.clear();
        this.onNewMeshAddedObservable.clear();
        this.onMeshRemovedObservable.clear();
        this.onNewSkeletonAddedObservable.clear();
        this.onSkeletonRemovedObservable.clear();
        this.onNewMaterialAddedObservable.clear();
        this.onNewMultiMaterialAddedObservable.clear();
        this.onMaterialRemovedObservable.clear();
        this.onMultiMaterialRemovedObservable.clear();
        this.onNewTextureAddedObservable.clear();
        this.onTextureRemovedObservable.clear();
        this.onPrePointerObservable.clear();
        this.onPointerObservable.clear();
        this.onPreKeyboardObservable.clear();
        this.onKeyboardObservable.clear();
        this.onActiveCameraChanged.clear();
        this.onScenePerformancePriorityChangedObservable.clear();
        this.onClearColorChangedObservable.clear();
        this.onEnvironmentTextureChangedObservable.clear();
        this.onMeshUnderPointerUpdatedObservable.clear();
        this._isDisposed = true;
    }
    _disposeList(items, callback) {
        const itemsCopy = items.slice(0);
        callback = callback ?? ((item) => item.dispose());
        for (const item of itemsCopy) {
            callback(item);
        }
        items.length = 0;
    }
    /**
     * Gets if the scene is already disposed
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Call this function to reduce memory footprint of the scene.
     * Vertex buffers will not store CPU data anymore (this will prevent picking, collisions or physics to work correctly)
     */
    clearCachedVertexData() {
        for (let meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
            const mesh = this.meshes[meshIndex];
            const geometry = mesh.geometry;
            if (geometry) {
                geometry.clearCachedData();
            }
        }
    }
    /**
     * This function will remove the local cached buffer data from texture.
     * It will save memory but will prevent the texture from being rebuilt
     */
    cleanCachedTextureBuffer() {
        for (const baseTexture of this.textures) {
            const buffer = baseTexture._buffer;
            if (buffer) {
                baseTexture._buffer = null;
            }
        }
    }
    /**
     * Get the world extend vectors with an optional filter
     *
     * @param filterPredicate the predicate - which meshes should be included when calculating the world size
     * @returns {{ min: Vector3; max: Vector3 }} min and max vectors
     */
    getWorldExtends(filterPredicate) {
        const min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        filterPredicate = filterPredicate || (() => true);
        this.meshes.filter(filterPredicate).forEach((mesh) => {
            mesh.computeWorldMatrix(true);
            if (!mesh.subMeshes || mesh.subMeshes.length === 0 || mesh.infiniteDistance) {
                return;
            }
            const boundingInfo = mesh.getBoundingInfo();
            const minBox = boundingInfo.boundingBox.minimumWorld;
            const maxBox = boundingInfo.boundingBox.maximumWorld;
            Vector3.CheckExtends(minBox, min, max);
            Vector3.CheckExtends(maxBox, min, max);
        });
        return {
            min: min,
            max: max,
        };
    }
    // Picking
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Creates a ray that can be used to pick in the scene
     * @param x defines the x coordinate of the origin (on-screen)
     * @param y defines the y coordinate of the origin (on-screen)
     * @param world defines the world matrix to use if you want to pick in object space (instead of world space)
     * @param camera defines the camera to use for the picking
     * @param cameraViewSpace defines if picking will be done in view space (false by default)
     * @returns a Ray
     */
    createPickingRay(x, y, world, camera, cameraViewSpace = false) {
        throw _WarnImport("Ray");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Creates a ray that can be used to pick in the scene
     * @param x defines the x coordinate of the origin (on-screen)
     * @param y defines the y coordinate of the origin (on-screen)
     * @param world defines the world matrix to use if you want to pick in object space (instead of world space)
     * @param result defines the ray where to store the picking ray
     * @param camera defines the camera to use for the picking
     * @param cameraViewSpace defines if picking will be done in view space (false by default)
     * @param enableDistantPicking defines if picking should handle large values for mesh position/scaling (false by default)
     * @returns the current scene
     */
    createPickingRayToRef(x, y, world, result, camera, cameraViewSpace = false, enableDistantPicking = false) {
        throw _WarnImport("Ray");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Creates a ray that can be used to pick in the scene
     * @param x defines the x coordinate of the origin (on-screen)
     * @param y defines the y coordinate of the origin (on-screen)
     * @param camera defines the camera to use for the picking
     * @returns a Ray
     */
    createPickingRayInCameraSpace(x, y, camera) {
        throw _WarnImport("Ray");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Creates a ray that can be used to pick in the scene
     * @param x defines the x coordinate of the origin (on-screen)
     * @param y defines the y coordinate of the origin (on-screen)
     * @param result defines the ray where to store the picking ray
     * @param camera defines the camera to use for the picking
     * @returns the current scene
     */
    createPickingRayInCameraSpaceToRef(x, y, result, camera) {
        throw _WarnImport("Ray");
    }
    /** Launch a ray to try to pick a mesh in the scene
     * @param x position on screen
     * @param y position on screen
     * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true. thinInstanceIndex is -1 when the mesh is non-instanced
     * @param fastCheck defines if the first intersection will be used (and not the closest)
     * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @returns a PickingInfo
     */
    pick(x, y, predicate, fastCheck, camera, trianglePredicate) {
        const warn = _WarnImport("Ray", true);
        if (warn) {
            Logger.Warn(warn);
        }
        // Dummy info if picking as not been imported
        return new PickingInfo();
    }
    /** Launch a ray to try to pick a mesh in the scene using only bounding information of the main mesh (not using submeshes)
     * @param x position on screen
     * @param y position on screen
     * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true. thinInstanceIndex is -1 when the mesh is non-instanced
     * @param fastCheck defines if the first intersection will be used (and not the closest)
     * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
     * @returns a PickingInfo (Please note that some info will not be set like distance, bv, bu and everything that cannot be capture by only using bounding infos)
     */
    pickWithBoundingInfo(x, y, predicate, fastCheck, camera) {
        const warn = _WarnImport("Ray", true);
        if (warn) {
            Logger.Warn(warn);
        }
        // Dummy info if picking as not been imported
        return new PickingInfo();
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Use the given ray to pick a mesh in the scene. A mesh triangle can be picked both from its front and back sides,
     * irrespective of orientation.
     * @param ray The ray to use to pick meshes
     * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must have isPickable set to true. thinInstanceIndex is -1 when the mesh is non-instanced
     * @param fastCheck defines if the first intersection will be used (and not the closest)
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @returns a PickingInfo
     */
    pickWithRay(ray, predicate, fastCheck, trianglePredicate) {
        throw _WarnImport("Ray");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Launch a ray to try to pick a mesh in the scene. A mesh triangle can be picked both from its front and back sides,
     * irrespective of orientation.
     * @param x X position on screen
     * @param y Y position on screen
     * @param predicate Predicate function used to determine eligible meshes and instances. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true. thinInstanceIndex is -1 when the mesh is non-instanced
     * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @returns an array of PickingInfo
     */
    multiPick(x, y, predicate, camera, trianglePredicate) {
        throw _WarnImport("Ray");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Launch a ray to try to pick a mesh in the scene
     * @param ray Ray to use
     * @param predicate Predicate function used to determine eligible meshes and instances. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true. thinInstanceIndex is -1 when the mesh is non-instanced
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @returns an array of PickingInfo
     */
    multiPickWithRay(ray, predicate, trianglePredicate) {
        throw _WarnImport("Ray");
    }
    /**
     * Force the value of meshUnderPointer
     * @param mesh defines the mesh to use
     * @param pointerId optional pointer id when using more than one pointer
     * @param pickResult optional pickingInfo data used to find mesh
     */
    setPointerOverMesh(mesh, pointerId, pickResult) {
        this._inputManager.setPointerOverMesh(mesh, pointerId, pickResult);
    }
    /**
     * Gets the mesh under the pointer
     * @returns a Mesh or null if no mesh is under the pointer
     */
    getPointerOverMesh() {
        return this._inputManager.getPointerOverMesh();
    }
    // Misc.
    /** @internal */
    _rebuildGeometries() {
        for (const geometry of this.geometries) {
            geometry._rebuild();
        }
        for (const mesh of this.meshes) {
            mesh._rebuild();
        }
        if (this.postProcessManager) {
            this.postProcessManager._rebuild();
        }
        for (const component of this._components) {
            component.rebuild();
        }
        for (const system of this.particleSystems) {
            system.rebuild();
        }
        if (this.spriteManagers) {
            for (const spriteMgr of this.spriteManagers) {
                spriteMgr.rebuild();
            }
        }
    }
    /** @internal */
    _rebuildTextures() {
        for (const texture of this.textures) {
            texture._rebuild(true);
        }
        this.markAllMaterialsAsDirty(1);
    }
    /**
     * Get from a list of objects by tags
     * @param list the list of objects to use
     * @param tagsQuery the query to use
     * @param filter a predicate to filter for tags
     * @returns
     */
    _getByTags(list, tagsQuery, filter) {
        if (tagsQuery === undefined) {
            // returns the complete list (could be done with Tags.MatchesQuery but no need to have a for-loop here)
            return list;
        }
        const listByTags = [];
        for (const i in list) {
            const item = list[i];
            if (Tags && Tags.MatchesQuery(item, tagsQuery) && (!filter || filter(item))) {
                listByTags.push(item);
            }
        }
        return listByTags;
    }
    /**
     * Get a list of meshes by tags
     * @param tagsQuery defines the tags query to use
     * @param filter defines a predicate used to filter results
     * @returns an array of Mesh
     */
    getMeshesByTags(tagsQuery, filter) {
        return this._getByTags(this.meshes, tagsQuery, filter);
    }
    /**
     * Get a list of cameras by tags
     * @param tagsQuery defines the tags query to use
     * @param filter defines a predicate used to filter results
     * @returns an array of Camera
     */
    getCamerasByTags(tagsQuery, filter) {
        return this._getByTags(this.cameras, tagsQuery, filter);
    }
    /**
     * Get a list of lights by tags
     * @param tagsQuery defines the tags query to use
     * @param filter defines a predicate used to filter results
     * @returns an array of Light
     */
    getLightsByTags(tagsQuery, filter) {
        return this._getByTags(this.lights, tagsQuery, filter);
    }
    /**
     * Get a list of materials by tags
     * @param tagsQuery defines the tags query to use
     * @param filter defines a predicate used to filter results
     * @returns an array of Material
     */
    getMaterialByTags(tagsQuery, filter) {
        return this._getByTags(this.materials, tagsQuery, filter).concat(this._getByTags(this.multiMaterials, tagsQuery, filter));
    }
    /**
     * Get a list of transform nodes by tags
     * @param tagsQuery defines the tags query to use
     * @param filter defines a predicate used to filter results
     * @returns an array of TransformNode
     */
    getTransformNodesByTags(tagsQuery, filter) {
        return this._getByTags(this.transformNodes, tagsQuery, filter);
    }
    /**
     * Overrides the default sort function applied in the rendering group to prepare the meshes.
     * This allowed control for front to back rendering or reversly depending of the special needs.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
     * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
     * @param transparentSortCompareFn The transparent queue comparison function use to sort.
     */
    setRenderingOrder(renderingGroupId, opaqueSortCompareFn = null, alphaTestSortCompareFn = null, transparentSortCompareFn = null) {
        this._renderingManager.setRenderingOrder(renderingGroupId, opaqueSortCompareFn, alphaTestSortCompareFn, transparentSortCompareFn);
    }
    /**
     * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
     * @param depth Automatically clears depth between groups if true and autoClear is true.
     * @param stencil Automatically clears stencil between groups if true and autoClear is true.
     */
    setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil, depth = true, stencil = true) {
        this._renderingManager.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil, depth, stencil);
    }
    /**
     * Gets the current auto clear configuration for one rendering group of the rendering
     * manager.
     * @param index the rendering group index to get the information for
     * @returns The auto clear setup for the requested rendering group
     */
    getAutoClearDepthStencilSetup(index) {
        return this._renderingManager.getAutoClearDepthStencilSetup(index);
    }
    /** @internal */
    _forceBlockMaterialDirtyMechanism(value) {
        this._blockMaterialDirtyMechanism = value;
    }
    /** Gets or sets a boolean blocking all the calls to markAllMaterialsAsDirty (ie. the materials won't be updated if they are out of sync) */
    get blockMaterialDirtyMechanism() {
        return this._blockMaterialDirtyMechanism;
    }
    set blockMaterialDirtyMechanism(value) {
        if (this._blockMaterialDirtyMechanism === value) {
            return;
        }
        this._blockMaterialDirtyMechanism = value;
        if (!value) {
            // Do a complete update
            this.markAllMaterialsAsDirty(63);
        }
    }
    /**
     * Will flag all materials as dirty to trigger new shader compilation
     * @param flag defines the flag used to specify which material part must be marked as dirty
     * @param predicate If not null, it will be used to specify if a material has to be marked as dirty
     */
    markAllMaterialsAsDirty(flag, predicate) {
        if (this._blockMaterialDirtyMechanism) {
            return;
        }
        for (const material of this.materials) {
            if (predicate && !predicate(material)) {
                continue;
            }
            material.markAsDirty(flag);
        }
    }
    /**
     * @internal
     */
    _loadFile(fileOrUrl, onSuccess, onProgress, useOfflineSupport, useArrayBuffer, onError, onOpened) {
        const request = LoadFile(fileOrUrl, onSuccess, onProgress, useOfflineSupport ? this.offlineProvider : undefined, useArrayBuffer, onError, onOpened);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }
    /**
     * @internal
     */
    _loadFileAsync(fileOrUrl, onProgress, useOfflineSupport, useArrayBuffer, onOpened) {
        return new Promise((resolve, reject) => {
            this._loadFile(fileOrUrl, (data) => {
                resolve(data);
            }, onProgress, useOfflineSupport, useArrayBuffer, (request, exception) => {
                reject(exception);
            }, onOpened);
        });
    }
    /**
     * @internal
     */
    _requestFile(url, onSuccess, onProgress, useOfflineSupport, useArrayBuffer, onError, onOpened) {
        const request = RequestFile(url, onSuccess, onProgress, useOfflineSupport ? this.offlineProvider : undefined, useArrayBuffer, onError, onOpened);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }
    /**
     * @internal
     */
    _requestFileAsync(url, onProgress, useOfflineSupport, useArrayBuffer, onOpened) {
        return new Promise((resolve, reject) => {
            this._requestFile(url, (data) => {
                resolve(data);
            }, onProgress, useOfflineSupport, useArrayBuffer, (error) => {
                reject(error);
            }, onOpened);
        });
    }
    /**
     * @internal
     */
    _readFile(file, onSuccess, onProgress, useArrayBuffer, onError) {
        const request = ReadFile(file, onSuccess, onProgress, useArrayBuffer, onError);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }
    /**
     * @internal
     */
    _readFileAsync(file, onProgress, useArrayBuffer) {
        return new Promise((resolve, reject) => {
            this._readFile(file, (data) => {
                resolve(data);
            }, onProgress, useArrayBuffer, (error) => {
                reject(error);
            });
        });
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * This method gets the performance collector belonging to the scene, which is generally shared with the inspector.
     * @returns the perf collector belonging to the scene.
     */
    getPerfCollector() {
        throw _WarnImport("performanceViewerSceneExtension");
    }
    // deprecated
    /**
     * Sets the active camera of the scene using its Id
     * @param id defines the camera's Id
     * @returns the new active camera or null if none found.
     * @deprecated Please use setActiveCameraById instead
     */
    setActiveCameraByID(id) {
        return this.setActiveCameraById(id);
    }
    /**
     * Get a material using its id
     * @param id defines the material's Id
     * @returns the material or null if none found.
     * @deprecated Please use getMaterialById instead
     */
    getMaterialByID(id) {
        return this.getMaterialById(id);
    }
    /**
     * Gets a the last added material using a given id
     * @param id defines the material's Id
     * @returns the last material with the given id or null if none found.
     * @deprecated Please use getLastMaterialById instead
     */
    getLastMaterialByID(id) {
        return this.getLastMaterialById(id);
    }
    /**
     * Get a texture using its unique id
     * @param uniqueId defines the texture's unique id
     * @returns the texture or null if none found.
     * @deprecated Please use getTextureByUniqueId instead
     */
    getTextureByUniqueID(uniqueId) {
        return this.getTextureByUniqueId(uniqueId);
    }
    /**
     * Gets a camera using its Id
     * @param id defines the Id to look for
     * @returns the camera or null if not found
     * @deprecated Please use getCameraById instead
     */
    getCameraByID(id) {
        return this.getCameraById(id);
    }
    /**
     * Gets a camera using its unique Id
     * @param uniqueId defines the unique Id to look for
     * @returns the camera or null if not found
     * @deprecated Please use getCameraByUniqueId instead
     */
    getCameraByUniqueID(uniqueId) {
        return this.getCameraByUniqueId(uniqueId);
    }
    /**
     * Gets a bone using its Id
     * @param id defines the bone's Id
     * @returns the bone or null if not found
     * @deprecated Please use getBoneById instead
     */
    getBoneByID(id) {
        return this.getBoneById(id);
    }
    /**
     * Gets a light node using its Id
     * @param id defines the light's Id
     * @returns the light or null if none found.
     * @deprecated Please use getLightById instead
     */
    getLightByID(id) {
        return this.getLightById(id);
    }
    /**
     * Gets a light node using its scene-generated unique Id
     * @param uniqueId defines the light's unique Id
     * @returns the light or null if none found.
     * @deprecated Please use getLightByUniqueId instead
     */
    getLightByUniqueID(uniqueId) {
        return this.getLightByUniqueId(uniqueId);
    }
    /**
     * Gets a particle system by Id
     * @param id defines the particle system Id
     * @returns the corresponding system or null if none found
     * @deprecated Please use getParticleSystemById instead
     */
    getParticleSystemByID(id) {
        return this.getParticleSystemById(id);
    }
    /**
     * Gets a geometry using its Id
     * @param id defines the geometry's Id
     * @returns the geometry or null if none found.
     * @deprecated Please use getGeometryById instead
     */
    getGeometryByID(id) {
        return this.getGeometryById(id);
    }
    /**
     * Gets the first added mesh found of a given Id
     * @param id defines the Id to search for
     * @returns the mesh found or null if not found at all
     * @deprecated Please use getMeshById instead
     */
    getMeshByID(id) {
        return this.getMeshById(id);
    }
    /**
     * Gets a mesh with its auto-generated unique Id
     * @param uniqueId defines the unique Id to search for
     * @returns the found mesh or null if not found at all.
     * @deprecated Please use getMeshByUniqueId instead
     */
    getMeshByUniqueID(uniqueId) {
        return this.getMeshByUniqueId(uniqueId);
    }
    /**
     * Gets a the last added mesh using a given Id
     * @param id defines the Id to search for
     * @returns the found mesh or null if not found at all.
     * @deprecated Please use getLastMeshById instead
     */
    getLastMeshByID(id) {
        return this.getLastMeshById(id);
    }
    /**
     * Gets a list of meshes using their Id
     * @param id defines the Id to search for
     * @returns a list of meshes
     * @deprecated Please use getMeshesById instead
     */
    getMeshesByID(id) {
        return this.getMeshesById(id);
    }
    /**
     * Gets the first added transform node found of a given Id
     * @param id defines the Id to search for
     * @returns the found transform node or null if not found at all.
     * @deprecated Please use getTransformNodeById instead
     */
    getTransformNodeByID(id) {
        return this.getTransformNodeById(id);
    }
    /**
     * Gets a transform node with its auto-generated unique Id
     * @param uniqueId defines the unique Id to search for
     * @returns the found transform node or null if not found at all.
     * @deprecated Please use getTransformNodeByUniqueId instead
     */
    getTransformNodeByUniqueID(uniqueId) {
        return this.getTransformNodeByUniqueId(uniqueId);
    }
    /**
     * Gets a list of transform nodes using their Id
     * @param id defines the Id to search for
     * @returns a list of transform nodes
     * @deprecated Please use getTransformNodesById instead
     */
    getTransformNodesByID(id) {
        return this.getTransformNodesById(id);
    }
    /**
     * Gets a node (Mesh, Camera, Light) using a given Id
     * @param id defines the Id to search for
     * @returns the found node or null if not found at all
     * @deprecated Please use getNodeById instead
     */
    getNodeByID(id) {
        return this.getNodeById(id);
    }
    /**
     * Gets a the last added node (Mesh, Camera, Light) using a given Id
     * @param id defines the Id to search for
     * @returns the found node or null if not found at all
     * @deprecated Please use getLastEntryById instead
     */
    getLastEntryByID(id) {
        return this.getLastEntryById(id);
    }
    /**
     * Gets a skeleton using a given Id (if many are found, this function will pick the last one)
     * @param id defines the Id to search for
     * @returns the found skeleton or null if not found at all.
     * @deprecated Please use getLastSkeletonById instead
     */
    getLastSkeletonByID(id) {
        return this.getLastSkeletonById(id);
    }
}
/** The fog is deactivated */
Scene.FOGMODE_NONE = 0;
/** The fog density is following an exponential function */
Scene.FOGMODE_EXP = 1;
/** The fog density is following an exponential function faster than FOGMODE_EXP */
Scene.FOGMODE_EXP2 = 2;
/** The fog density is following a linear function. */
Scene.FOGMODE_LINEAR = 3;
/**
 * Gets or sets the minimum deltatime when deterministic lock step is enabled
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
 */
Scene.MinDeltaTime = 1.0;
/**
 * Gets or sets the maximum deltatime when deterministic lock step is enabled
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
 */
Scene.MaxDeltaTime = 1000.0;
// Register Class Name
RegisterClass("BABYLON.Scene", Scene);
//# sourceMappingURL=scene.js.map