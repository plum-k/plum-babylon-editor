import { GreasedLinePluginMaterial } from "../../Materials/GreasedLine/greasedLinePluginMaterial.js";
import { Mesh } from "../mesh.js";
import { Buffer } from "../../Buffers/buffer.js";
import { VertexData } from "../mesh.vertexData.js";
import { DeepCopier } from "../../Misc/deepCopier.js";
import { GreasedLineSimpleMaterial, GreasedLineUseOffsetsSimpleMaterialDefine } from "../../Materials/GreasedLine/greasedLineSimpleMaterial.js";
import { GreasedLineTools } from "../../Misc/greasedLineTools.js";
/**
 * In POINTS_MODE_POINTS every array of points will become the center (backbone) of the ribbon. The ribbon will be expanded by `width / 2` to `+direction` and `-direction` as well.
 * In POINTS_MODE_PATHS every array of points specifies an edge. These will be used to build one ribbon.
 */
export var GreasedLineRibbonPointsMode;
(function (GreasedLineRibbonPointsMode) {
    GreasedLineRibbonPointsMode[GreasedLineRibbonPointsMode["POINTS_MODE_POINTS"] = 0] = "POINTS_MODE_POINTS";
    GreasedLineRibbonPointsMode[GreasedLineRibbonPointsMode["POINTS_MODE_PATHS"] = 1] = "POINTS_MODE_PATHS";
})(GreasedLineRibbonPointsMode || (GreasedLineRibbonPointsMode = {}));
/**
 * FACES_MODE_SINGLE_SIDED single sided with back face culling. Default value.
 * FACES_MODE_SINGLE_SIDED_NO_BACKFACE_CULLING single sided without back face culling. Sets backFaceCulling = false on the material so it affects all line ribbons added to the line ribbon instance.
 * FACES_MODE_DOUBLE_SIDED extra back faces are created. This doubles the amount of faces of the mesh.
 */
export var GreasedLineRibbonFacesMode;
(function (GreasedLineRibbonFacesMode) {
    GreasedLineRibbonFacesMode[GreasedLineRibbonFacesMode["FACES_MODE_SINGLE_SIDED"] = 0] = "FACES_MODE_SINGLE_SIDED";
    GreasedLineRibbonFacesMode[GreasedLineRibbonFacesMode["FACES_MODE_SINGLE_SIDED_NO_BACKFACE_CULLING"] = 1] = "FACES_MODE_SINGLE_SIDED_NO_BACKFACE_CULLING";
    GreasedLineRibbonFacesMode[GreasedLineRibbonFacesMode["FACES_MODE_DOUBLE_SIDED"] = 2] = "FACES_MODE_DOUBLE_SIDED";
})(GreasedLineRibbonFacesMode || (GreasedLineRibbonFacesMode = {}));
/**
 * Only with POINTS_MODE_PATHS.
 * AUTO_DIRECTIONS_FROM_FIRST_SEGMENT sets the direction (slope) of the ribbon from the direction of the first line segment. Recommended.
 * AUTO_DIRECTIONS_FROM_ALL_SEGMENTS in this mode the direction (slope) will be calculated for each line segment according to the direction vector between each point of the line segments. Slow method.
 * AUTO_DIRECTIONS_ENHANCED in this mode the direction (slope) will be calculated for each line segment according to the direction vector between each point of the line segments using a more sophisitcaed algorithm. Slowest method.
 * AUTO_DIRECTIONS_FACE_TO in this mode the direction (slope) will be calculated for each line segment according to the direction vector between each point of the line segments and a direction (face-to) vector specified in direction. The resulting line will face to the direction of this face-to vector.
 * AUTO_DIRECTIONS_NONE you have to set the direction (slope) manually. Recommended.
 */
export var GreasedLineRibbonAutoDirectionMode;
(function (GreasedLineRibbonAutoDirectionMode) {
    GreasedLineRibbonAutoDirectionMode[GreasedLineRibbonAutoDirectionMode["AUTO_DIRECTIONS_FROM_FIRST_SEGMENT"] = 0] = "AUTO_DIRECTIONS_FROM_FIRST_SEGMENT";
    GreasedLineRibbonAutoDirectionMode[GreasedLineRibbonAutoDirectionMode["AUTO_DIRECTIONS_FROM_ALL_SEGMENTS"] = 1] = "AUTO_DIRECTIONS_FROM_ALL_SEGMENTS";
    GreasedLineRibbonAutoDirectionMode[GreasedLineRibbonAutoDirectionMode["AUTO_DIRECTIONS_ENHANCED"] = 2] = "AUTO_DIRECTIONS_ENHANCED";
    GreasedLineRibbonAutoDirectionMode[GreasedLineRibbonAutoDirectionMode["AUTO_DIRECTIONS_FACE_TO"] = 3] = "AUTO_DIRECTIONS_FACE_TO";
    GreasedLineRibbonAutoDirectionMode[GreasedLineRibbonAutoDirectionMode["AUTO_DIRECTIONS_NONE"] = 99] = "AUTO_DIRECTIONS_NONE";
})(GreasedLineRibbonAutoDirectionMode || (GreasedLineRibbonAutoDirectionMode = {}));
/**
 * GreasedLineBaseMesh
 */
export class GreasedLineBaseMesh extends Mesh {
    constructor(name, scene, _options) {
        super(name, scene, null, null, false, false);
        this.name = name;
        this._options = _options;
        this._lazy = false;
        this._updatable = false;
        this._engine = scene.getEngine();
        this._lazy = _options.lazy ?? false;
        this._updatable = _options.updatable ?? false;
        this._vertexPositions = [];
        this._indices = [];
        this._uvs = [];
        this._points = [];
        this._colorPointers = _options.colorPointers ?? [];
        this._widths = _options.widths ?? new Array(_options.points.length).fill(1);
    }
    /**
     * "GreasedLineMesh"
     * @returns "GreasedLineMesh"
     */
    getClassName() {
        return "GreasedLineMesh";
    }
    _updateWidthsWithValue(defaulValue) {
        let pointCount = 0;
        for (const points of this._points) {
            pointCount += points.length;
        }
        const countDiff = (pointCount / 3) * 2 - this._widths.length;
        for (let i = 0; i < countDiff; i++) {
            this._widths.push(defaulValue);
        }
    }
    /**
     * Updated a lazy line. Rerenders the line and updates boundinfo as well.
     */
    updateLazy() {
        this._setPoints(this._points);
        if (!this._options.colorPointers) {
            this._updateColorPointers();
        }
        this._createVertexBuffers(this._options.ribbonOptions?.smoothShading);
        !this.doNotSyncBoundingInfo && this.refreshBoundingInfo();
        this.greasedLineMaterial?.updateLazy();
    }
    /**
     * Adds new points to the line. It doesn't rerenders the line if in lazy mode.
     * @param points points table
     * @param options optional options
     */
    addPoints(points, options) {
        for (const p of points) {
            this._points.push(p);
        }
        if (!this._lazy) {
            this.setPoints(this._points, options);
        }
    }
    /**
     * Dispose the line and it's resources
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    dispose(doNotRecurse, disposeMaterialAndTextures = false) {
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
    /**
     * @returns true if the mesh was created in lazy mode
     */
    isLazy() {
        return this._lazy;
    }
    /**
     * Returns the UVs
     */
    get uvs() {
        return this._uvs;
    }
    /**
     * Sets the UVs
     * @param uvs the UVs
     */
    set uvs(uvs) {
        this._uvs = uvs instanceof Float32Array ? uvs : new Float32Array(uvs);
        this._createVertexBuffers();
    }
    /**
     * Returns the points offsets
     * Return the points offsets
     */
    get offsets() {
        return this._offsets;
    }
    /**
     * Sets point offests
     * @param offsets offset table [x,y,z, x,y,z, ....]
     */
    set offsets(offsets) {
        if (this.material instanceof GreasedLineSimpleMaterial) {
            this.material.setDefine(GreasedLineUseOffsetsSimpleMaterialDefine, offsets?.length > 0);
        }
        this._offsets = offsets;
        if (!this._offsetsBuffer) {
            this._createOffsetsBuffer(offsets);
        }
        else {
            this._offsetsBuffer.update(offsets);
        }
    }
    /**
     * Gets widths at each line point like [widthLower, widthUpper, widthLower, widthUpper, ...]
     */
    get widths() {
        return this._widths;
    }
    /**
     * Sets widths at each line point
     * @param widths width table [widthLower, widthUpper, widthLower, widthUpper ...]
     */
    set widths(widths) {
        this._widths = widths;
        if (!this._lazy) {
            this._widthsBuffer && this._widthsBuffer.update(widths);
        }
    }
    /**
     * Gets the color pointer. Each vertex need a color pointer. These color pointers points to the colors in the color table @see colors
     */
    get colorPointers() {
        return this._colorPointers;
    }
    /**
     * Sets the color pointer
     * @param colorPointers array of color pointer in the colors array. One pointer for every vertex is needed.
     */
    set colorPointers(colorPointers) {
        this._colorPointers = colorPointers;
        if (!this._lazy) {
            this._colorPointersBuffer && this._colorPointersBuffer.update(colorPointers);
        }
    }
    /**
     * Gets the pluginMaterial associated with line
     */
    get greasedLineMaterial() {
        if (this.material && this.material instanceof GreasedLineSimpleMaterial) {
            return this.material;
        }
        const materialPlugin = this.material?.pluginManager?.getPlugin(GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME);
        if (materialPlugin) {
            return materialPlugin;
        }
        return;
    }
    /**
     * Return copy the points.
     */
    get points() {
        const pointsCopy = [];
        DeepCopier.DeepCopy(this._points, pointsCopy);
        return pointsCopy;
    }
    /**
     * Sets line points and rerenders the line.
     * @param points points table
     * @param options optional options
     */
    setPoints(points, options) {
        this._points = GreasedLineTools.ConvertPoints(points, options?.pointsOptions ?? this._options.pointsOptions);
        this._updateWidths();
        if (!options?.colorPointers) {
            this._updateColorPointers();
        }
        this._setPoints(this._points, options);
    }
    _initGreasedLine() {
        this._vertexPositions = [];
        this._indices = [];
        this._uvs = [];
    }
    _createLineOptions() {
        const lineOptions = {
            points: this._points,
            colorPointers: this._colorPointers,
            lazy: this._lazy,
            updatable: this._updatable,
            uvs: this._uvs,
            widths: this._widths,
            ribbonOptions: this._options.ribbonOptions,
        };
        return lineOptions;
    }
    /**
     * Serializes this GreasedLineMesh
     * @param serializationObject object to write serialization to
     */
    serialize(serializationObject) {
        super.serialize(serializationObject);
        serializationObject.type = this.getClassName();
        serializationObject.lineOptions = this._createLineOptions();
    }
    _createVertexBuffers(computeNormals = false) {
        const vertexData = new VertexData();
        vertexData.positions = this._vertexPositions;
        vertexData.indices = this._indices;
        vertexData.uvs = this._uvs;
        if (computeNormals) {
            vertexData.normals = [];
            VertexData.ComputeNormals(this._vertexPositions, this._indices, vertexData.normals);
        }
        vertexData.applyToMesh(this, this._options.updatable);
        return vertexData;
    }
    _createOffsetsBuffer(offsets) {
        const engine = this._scene.getEngine();
        const offsetBuffer = new Buffer(engine, offsets, this._updatable, 3);
        this.setVerticesBuffer(offsetBuffer.createVertexBuffer("grl_offsets", 0, 3));
        this._offsetsBuffer = offsetBuffer;
    }
}
//# sourceMappingURL=greasedLineBaseMesh.js.map