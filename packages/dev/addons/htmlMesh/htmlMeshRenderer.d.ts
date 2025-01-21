import type { Scene } from "@babylonjs/core/scene.js";
import { Matrix } from "@babylonjs/core/Maths/math.js";
import type { HtmlMesh } from "./htmlMesh";
import { Camera } from "@babylonjs/core/Cameras/camera.js";
import type { SubMesh } from "@babylonjs/core/Meshes/subMesh.js";
/**
 * A function that compares two submeshes and returns a number indicating which
 * should be rendered first.
 */
type RenderOrderFunction = (subMeshA: SubMesh, subMeshB: SubMesh) => number;
/**
 * An instance of this is required to render HtmlMeshes in the scene.
 * if using HtmlMeshes, you must not set render order for group 0 using
 * scene.setRenderingOrder.  You must instead pass the compare functions
 * to the HtmlMeshRenderer constructor.  If you do not, then your render
 * order will be overwritten if the HtmlMeshRenderer is created after and
 * the HtmlMeshes will not render correctly (they will appear in front of
 * meshes that are actually in front of them) if the HtmlMeshRenderer is
 * created before.
 */
export declare class HtmlMeshRenderer {
    private _containerId?;
    private _inSceneElements?;
    private _overlayElements?;
    private _engine;
    private _cache;
    private _width;
    private _height;
    private _heightHalf;
    private _cameraWorldMatrix?;
    private _temp;
    private _lastDevicePixelRatio;
    private _cameraMatrixUpdated;
    private _previousCanvasDocumentPosition;
    private _renderObserver;
    /**
     * Contruct an instance of HtmlMeshRenderer
     * @param scene
     * @param options object containing the following optional properties:
     * @returns
     */
    constructor(scene: Scene, { parentContainerId, _containerId, enableOverlayRender, defaultOpaqueRenderOrder, defaultAlphaTestRenderOrder, defaultTransparentRenderOrder, }?: {
        parentContainerId?: string | null;
        _containerId?: string;
        defaultOpaqueRenderOrder?: RenderOrderFunction;
        defaultAlphaTestRenderOrder?: RenderOrderFunction;
        defaultTransparentRenderOrder?: RenderOrderFunction;
        enableOverlayRender?: boolean;
    });
    /**
     * Dispose of the HtmlMeshRenderer
     */
    dispose(): void;
    protected _init(scene: Scene, parentContainerId: string | null, enableOverlayRender: boolean, defaultOpaqueRenderOrder: RenderOrderFunction, defaultAlphaTestRenderOrder: RenderOrderFunction, defaultTransparentRenderOrder: RenderOrderFunction): void;
    private _createRenderLayerElements;
    protected _getSize(): {
        width: number;
        height: number;
    };
    protected _setSize(width: number, height: number): void;
    protected _getCameraCSSMatrix(matrix: Matrix): string;
    protected _getHtmlContentCSSMatrix(matrix: Matrix, useRightHandedSystem: boolean): string;
    protected _getTransformationMatrix(htmlMesh: HtmlMesh, useRightHandedSystem: boolean): Matrix;
    protected _renderHtmlMesh(htmlMesh: HtmlMesh, useRightHandedSystem: boolean): void;
    protected _render(scene: Scene, camera: Camera): void;
    protected _updateBaseScaleFactor(htmlMesh: HtmlMesh): void;
    protected _updateContainerPositionIfNeeded(): void;
    protected _onCameraMatrixChanged: (camera: Camera) => void;
    private _epsilon;
    private _getAncestorMarginsAndPadding;
}
export {};
