import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { FitStrategyType } from "./fitStrategy";
/**
 * This class represents HTML content that we want to render as though it is part of the scene.  The HTML content is actually
 * rendered below the canvas, but a depth mask is created by this class that writes to the depth buffer but does not
 * write to the color buffer, effectively punching a hole in the canvas.  CSS transforms are used to scale, translate, and rotate
 * the HTML content so that it matches the camera and mesh orientation.  The class supports interactions in editable and non-editable mode.
 * In non-editable mode (the default), events are passed to the HTML content when the pointer is over the mask (and not occluded by other meshes
 * in the scene).
 * #HVHYJC#5
 * #B17TC7#112
 */
export declare class HtmlMesh extends Mesh {
    /**
     * Helps identifying a html mesh from a regular mesh
     */
    get isHtmlMesh(): boolean;
    private _enabled;
    private _ready;
    /**
     * @internal
     */
    _isCanvasOverlay: boolean;
    private _requiresUpdate;
    private _element?;
    private _width?;
    private _height?;
    private _inverseScaleMatrix;
    private _captureOnPointerEnter;
    private _pointerEventCaptureBehavior;
    private _sourceWidth;
    private _sourceHeight;
    /**
     * Return the source width of the content in pixels
     */
    get sourceWidth(): number | null;
    /**
     * Return the source height of the content in pixels
     */
    get sourceHeight(): number | null;
    private _worldMatrixUpdateObserver;
    private _fitStrategy;
    /**
     * Contruct an instance of HtmlMesh
     * @param scene
     * @param id The id of the mesh.  Will be used as the id of the HTML element as well.
     * @param options object with optional parameters
     */
    constructor(scene: Scene, id: string, { captureOnPointerEnter, isCanvasOverlay, fitStrategy }?: {
        captureOnPointerEnter?: boolean | undefined;
        isCanvasOverlay?: boolean | undefined;
        fitStrategy?: FitStrategyType | undefined;
    });
    /**
     * The width of the content in pixels
     */
    get width(): number | undefined;
    /**
     * The height of the content in pixels
     */
    get height(): number | undefined;
    /**
     * The HTML element that is being rendered as a mesh
     */
    get element(): HTMLElement | undefined;
    /**
     * True if the mesh has been moved, rotated, or scaled since the last time this
     * property was read.  This property is reset to false after reading.
     */
    get requiresUpdate(): boolean;
    /**
     * Enable capture for the pointer when entering the mesh area
     */
    set captureOnPointerEnter(captureOnPointerEnter: boolean);
    /**
     * Disposes of the mesh and the HTML element
     */
    dispose(): void;
    /**
     * @internal
     */
    _markAsUpdated(): void;
    /**
     * Sets the content of the element to the specified content adjusting the mesh scale to match and making it visible.
     * If the the specified content is undefined, then it will make the mesh invisible.  In either case it will clear the
     * element content first.
     * @param element The element to render as a mesh
     * @param width The width of the mesh in Babylon units
     * @param height The height of the mesh in Babylon units
     */
    setContent(element: HTMLElement, width: number, height: number): void;
    setEnabled(enabled: boolean): void;
    /**
     * Sets the content size in pixels
     * @param width width of the source
     * @param height height of the source
     */
    setContentSizePx(width: number, height: number): void;
    protected _setAsReady(ready: boolean): void;
    protected _doSetEnabled(enabled: boolean): void;
    protected _updateScaleIfNecessary(): void;
    protected _createMask(): void;
    protected _setElementZIndex(zIndex: number): void;
    /**
     * Callback used by the PointerEventsCaptureBehavior to capture pointer events
     */
    capturePointerEvents(): void;
    /**
     * Callback used by the PointerEventsCaptureBehavior to release pointer events
     */
    releasePointerEvents(): void;
    protected _createElement(): HTMLDivElement | undefined;
}
