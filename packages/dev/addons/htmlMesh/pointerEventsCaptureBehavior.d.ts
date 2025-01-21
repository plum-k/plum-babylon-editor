import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import type { Behavior } from "@babylonjs/core/Behaviors/behavior.js";
/**
 * Behavior for any content that can capture pointer events, i.e. bypass the Babylon pointer event handling
 * and receive pointer events directly.  It will register the capture triggers and negotiate the capture and
 * release of pointer events.  Curerntly this applies only to HtmlMesh
 */
export declare class PointerEventsCaptureBehavior implements Behavior<AbstractMesh> {
    private _captureCallback;
    private _releaseCallback;
    /** gets or sets behavior's name */
    name: string;
    private _attachedMesh;
    /** @internal */
    _captureOnPointerEnter: boolean;
    /**
     * Gets or sets the mesh that the behavior is attached to
     */
    get attachedMesh(): AbstractMesh | null;
    set attachedMesh(value: AbstractMesh | null);
    constructor(_captureCallback: () => void, _releaseCallback: () => void, { captureOnPointerEnter }?: {
        captureOnPointerEnter?: boolean | undefined;
    });
    /**
     * Set if the behavior should capture pointer events when the pointer enters the mesh
     */
    set captureOnPointerEnter(captureOnPointerEnter: boolean);
    /**
     * Function called when the behavior needs to be initialized (before attaching it to a target)
     */
    init(): void;
    /**
     * Called when the behavior is attached to a target
     * @param mesh defines the target where the behavior is attached to
     */
    attach(mesh: AbstractMesh): void;
    /**
     * Called when the behavior is detached from its target
     */
    detach(): void;
    /**
     * Dispose the behavior
     */
    dispose(): void;
    releasePointerEvents(): void;
    capturePointerEvents(): void;
}
