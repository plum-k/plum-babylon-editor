/**
 * Groups all the scene component constants in one place to ease maintenance.
 * @internal
 */
export class SceneComponentConstants {
}
SceneComponentConstants.NAME_EFFECTLAYER = "EffectLayer";
SceneComponentConstants.NAME_LAYER = "Layer";
SceneComponentConstants.NAME_LENSFLARESYSTEM = "LensFlareSystem";
SceneComponentConstants.NAME_BOUNDINGBOXRENDERER = "BoundingBoxRenderer";
SceneComponentConstants.NAME_PARTICLESYSTEM = "ParticleSystem";
SceneComponentConstants.NAME_GAMEPAD = "Gamepad";
SceneComponentConstants.NAME_SIMPLIFICATIONQUEUE = "SimplificationQueue";
SceneComponentConstants.NAME_GEOMETRYBUFFERRENDERER = "GeometryBufferRenderer";
SceneComponentConstants.NAME_PREPASSRENDERER = "PrePassRenderer";
SceneComponentConstants.NAME_DEPTHRENDERER = "DepthRenderer";
SceneComponentConstants.NAME_DEPTHPEELINGRENDERER = "DepthPeelingRenderer";
SceneComponentConstants.NAME_POSTPROCESSRENDERPIPELINEMANAGER = "PostProcessRenderPipelineManager";
SceneComponentConstants.NAME_SPRITE = "Sprite";
SceneComponentConstants.NAME_SUBSURFACE = "SubSurface";
SceneComponentConstants.NAME_OUTLINERENDERER = "Outline";
SceneComponentConstants.NAME_PROCEDURALTEXTURE = "ProceduralTexture";
SceneComponentConstants.NAME_SHADOWGENERATOR = "ShadowGenerator";
SceneComponentConstants.NAME_OCTREE = "Octree";
SceneComponentConstants.NAME_PHYSICSENGINE = "PhysicsEngine";
SceneComponentConstants.NAME_AUDIO = "Audio";
SceneComponentConstants.NAME_FLUIDRENDERER = "FluidRenderer";
SceneComponentConstants.NAME_IBLCDFGENERATOR = "iblCDFGenerator";
SceneComponentConstants.STEP_ISREADYFORMESH_EFFECTLAYER = 0;
SceneComponentConstants.STEP_BEFOREEVALUATEACTIVEMESH_BOUNDINGBOXRENDERER = 0;
SceneComponentConstants.STEP_EVALUATESUBMESH_BOUNDINGBOXRENDERER = 0;
SceneComponentConstants.STEP_PREACTIVEMESH_BOUNDINGBOXRENDERER = 0;
SceneComponentConstants.STEP_CAMERADRAWRENDERTARGET_EFFECTLAYER = 1;
SceneComponentConstants.STEP_BEFORECAMERADRAW_PREPASS = 0;
SceneComponentConstants.STEP_BEFORECAMERADRAW_EFFECTLAYER = 1;
SceneComponentConstants.STEP_BEFORECAMERADRAW_LAYER = 2;
SceneComponentConstants.STEP_BEFORERENDERTARGETDRAW_PREPASS = 0;
SceneComponentConstants.STEP_BEFORERENDERTARGETDRAW_LAYER = 1;
SceneComponentConstants.STEP_BEFORERENDERINGMESH_PREPASS = 0;
SceneComponentConstants.STEP_BEFORERENDERINGMESH_OUTLINE = 1;
SceneComponentConstants.STEP_AFTERRENDERINGMESH_PREPASS = 0;
SceneComponentConstants.STEP_AFTERRENDERINGMESH_OUTLINE = 1;
SceneComponentConstants.STEP_AFTERRENDERINGGROUPDRAW_EFFECTLAYER_DRAW = 0;
SceneComponentConstants.STEP_AFTERRENDERINGGROUPDRAW_BOUNDINGBOXRENDERER = 1;
SceneComponentConstants.STEP_BEFORECAMERAUPDATE_SIMPLIFICATIONQUEUE = 0;
SceneComponentConstants.STEP_BEFORECLEAR_PROCEDURALTEXTURE = 0;
SceneComponentConstants.STEP_BEFORECLEAR_PREPASS = 1;
SceneComponentConstants.STEP_BEFORERENDERTARGETCLEAR_PREPASS = 0;
SceneComponentConstants.STEP_AFTERRENDERTARGETDRAW_PREPASS = 0;
SceneComponentConstants.STEP_AFTERRENDERTARGETDRAW_LAYER = 1;
SceneComponentConstants.STEP_AFTERCAMERADRAW_PREPASS = 0;
SceneComponentConstants.STEP_AFTERCAMERADRAW_EFFECTLAYER = 1;
SceneComponentConstants.STEP_AFTERCAMERADRAW_LENSFLARESYSTEM = 2;
SceneComponentConstants.STEP_AFTERCAMERADRAW_EFFECTLAYER_DRAW = 3;
SceneComponentConstants.STEP_AFTERCAMERADRAW_LAYER = 4;
SceneComponentConstants.STEP_AFTERCAMERADRAW_FLUIDRENDERER = 5;
SceneComponentConstants.STEP_AFTERCAMERAPOSTPROCESS_LAYER = 0;
SceneComponentConstants.STEP_AFTERRENDERTARGETPOSTPROCESS_LAYER = 0;
SceneComponentConstants.STEP_AFTERRENDER_AUDIO = 0;
SceneComponentConstants.STEP_GATHERRENDERTARGETS_DEPTHRENDERER = 0;
SceneComponentConstants.STEP_GATHERRENDERTARGETS_GEOMETRYBUFFERRENDERER = 1;
SceneComponentConstants.STEP_GATHERRENDERTARGETS_SHADOWGENERATOR = 2;
SceneComponentConstants.STEP_GATHERRENDERTARGETS_POSTPROCESSRENDERPIPELINEMANAGER = 3;
SceneComponentConstants.STEP_GATHERACTIVECAMERARENDERTARGETS_DEPTHRENDERER = 0;
SceneComponentConstants.STEP_GATHERACTIVECAMERARENDERTARGETS_FLUIDRENDERER = 1;
SceneComponentConstants.STEP_POINTERMOVE_SPRITE = 0;
SceneComponentConstants.STEP_POINTERDOWN_SPRITE = 0;
SceneComponentConstants.STEP_POINTERUP_SPRITE = 0;
/**
 * Representation of a stage in the scene (Basically a list of ordered steps)
 * @internal
 */
export class Stage extends Array {
    /**
     * Hide ctor from the rest of the world.
     * @param items The items to add.
     */
    constructor(items) {
        super(...items);
    }
    /**
     * Creates a new Stage.
     * @returns A new instance of a Stage
     */
    static Create() {
        return Object.create(Stage.prototype);
    }
    /**
     * Registers a step in an ordered way in the targeted stage.
     * @param index Defines the position to register the step in
     * @param component Defines the component attached to the step
     * @param action Defines the action to launch during the step
     */
    registerStep(index, component, action) {
        let i = 0;
        let maxIndex = Number.MAX_VALUE;
        for (; i < this.length; i++) {
            const step = this[i];
            maxIndex = step.index;
            if (index < maxIndex) {
                break;
            }
        }
        this.splice(i, 0, { index, component, action: action.bind(component) });
    }
    /**
     * Clears all the steps from the stage.
     */
    clear() {
        this.length = 0;
    }
}
//# sourceMappingURL=sceneComponent.js.map