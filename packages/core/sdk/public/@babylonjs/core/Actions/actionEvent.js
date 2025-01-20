/**
 * ActionEvent is the event being sent when an action is triggered.
 */
export class ActionEvent {
    /**
     * Creates a new ActionEvent
     * @param source The mesh or sprite that triggered the action
     * @param pointerX The X mouse cursor position at the time of the event
     * @param pointerY The Y mouse cursor position at the time of the event
     * @param meshUnderPointer The mesh that is currently pointed at (can be null)
     * @param sourceEvent the original (browser) event that triggered the ActionEvent
     * @param additionalData additional data for the event
     */
    constructor(
    /** The mesh or sprite that triggered the action */
    source, 
    /** The X mouse cursor position at the time of the event */
    pointerX, 
    /** The Y mouse cursor position at the time of the event */
    pointerY, 
    /** The mesh that is currently pointed at (can be null) */
    meshUnderPointer, 
    /** the original (browser) event that triggered the ActionEvent */
    sourceEvent, 
    /** additional data for the event */
    additionalData) {
        this.source = source;
        this.pointerX = pointerX;
        this.pointerY = pointerY;
        this.meshUnderPointer = meshUnderPointer;
        this.sourceEvent = sourceEvent;
        this.additionalData = additionalData;
    }
    /**
     * Helper function to auto-create an ActionEvent from a source mesh.
     * @param source The source mesh that triggered the event
     * @param evt The original (browser) event
     * @param additionalData additional data for the event
     * @returns the new ActionEvent
     */
    static CreateNew(source, evt, additionalData) {
        const scene = source.getScene();
        return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer || source, evt, additionalData);
    }
    /**
     * Helper function to auto-create an ActionEvent from a source sprite
     * @param source The source sprite that triggered the event
     * @param scene Scene associated with the sprite
     * @param evt The original (browser) event
     * @param additionalData additional data for the event
     * @returns the new ActionEvent
     */
    static CreateNewFromSprite(source, scene, evt, additionalData) {
        return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt, additionalData);
    }
    /**
     * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
     * @param scene the scene where the event occurred
     * @param evt The original (browser) event
     * @returns the new ActionEvent
     */
    static CreateNewFromScene(scene, evt) {
        return new ActionEvent(null, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
    }
    /**
     * Helper function to auto-create an ActionEvent from a primitive
     * @param prim defines the target primitive
     * @param pointerPos defines the pointer position
     * @param evt The original (browser) event
     * @param additionalData additional data for the event
     * @returns the new ActionEvent
     */
    static CreateNewFromPrimitive(prim, pointerPos, evt, additionalData) {
        return new ActionEvent(prim, pointerPos.x, pointerPos.y, null, evt, additionalData);
    }
}
//# sourceMappingURL=actionEvent.js.map