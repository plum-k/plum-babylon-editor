import { SubMesh } from "../subMesh.js";
import { Mesh } from "../mesh.js";
import { VertexData } from "../mesh.vertexData.js";
import { Matrix, TmpVectors, Vector2, Vector3 } from "../../Maths/math.vector.js";
import { Logger } from "../../Misc/logger.js";
import { GaussianSplattingMaterial } from "../../Materials/GaussianSplatting/gaussianSplattingMaterial.js";
import { RawTexture } from "../../Materials/Textures/rawTexture.js";

import { Tools } from "../../Misc/tools.js";
import "../thinInstanceMesh.js";
import { ToHalfFloat } from "../../Misc/textureTools.js";
import { Scalar } from "../../Maths/math.scalar.js";
import { runCoroutineSync, runCoroutineAsync, createYieldingScheduler } from "../../Misc/coroutine.js";
import { EngineStore } from "../../Engines/engineStore.js";
// @internal
const unpackUnorm = (value, bits) => {
    const t = (1 << bits) - 1;
    return (value & t) / t;
};
// @internal
const unpack111011 = (value, result) => {
    result.x = unpackUnorm(value >>> 21, 11);
    result.y = unpackUnorm(value >>> 11, 10);
    result.z = unpackUnorm(value, 11);
};
// @internal
const unpack8888 = (value, result) => {
    result[0] = unpackUnorm(value >>> 24, 8) * 255;
    result[1] = unpackUnorm(value >>> 16, 8) * 255;
    result[2] = unpackUnorm(value >>> 8, 8) * 255;
    result[3] = unpackUnorm(value, 8) * 255;
};
// @internal
// unpack quaternion with 2,10,10,10 format (largest element, 3x10bit element)
const unpackRot = (value, result) => {
    const norm = 1.0 / (Math.sqrt(2) * 0.5);
    const a = (unpackUnorm(value >>> 20, 10) - 0.5) * norm;
    const b = (unpackUnorm(value >>> 10, 10) - 0.5) * norm;
    const c = (unpackUnorm(value, 10) - 0.5) * norm;
    const m = Math.sqrt(1.0 - (a * a + b * b + c * c));
    switch (value >>> 30) {
        case 0:
            result.set(m, a, b, c);
            break;
        case 1:
            result.set(a, m, b, c);
            break;
        case 2:
            result.set(a, b, m, c);
            break;
        case 3:
            result.set(a, b, c, m);
            break;
    }
};
/**
 * Representation of the types
 */
var PLYType;
(function (PLYType) {
    PLYType[PLYType["FLOAT"] = 0] = "FLOAT";
    PLYType[PLYType["INT"] = 1] = "INT";
    PLYType[PLYType["UINT"] = 2] = "UINT";
    PLYType[PLYType["DOUBLE"] = 3] = "DOUBLE";
    PLYType[PLYType["UCHAR"] = 4] = "UCHAR";
    PLYType[PLYType["UNDEFINED"] = 5] = "UNDEFINED";
})(PLYType || (PLYType = {}));
/**
 * Usage types of the PLY values
 */
var PLYValue;
(function (PLYValue) {
    PLYValue[PLYValue["MIN_X"] = 0] = "MIN_X";
    PLYValue[PLYValue["MIN_Y"] = 1] = "MIN_Y";
    PLYValue[PLYValue["MIN_Z"] = 2] = "MIN_Z";
    PLYValue[PLYValue["MAX_X"] = 3] = "MAX_X";
    PLYValue[PLYValue["MAX_Y"] = 4] = "MAX_Y";
    PLYValue[PLYValue["MAX_Z"] = 5] = "MAX_Z";
    PLYValue[PLYValue["MIN_SCALE_X"] = 6] = "MIN_SCALE_X";
    PLYValue[PLYValue["MIN_SCALE_Y"] = 7] = "MIN_SCALE_Y";
    PLYValue[PLYValue["MIN_SCALE_Z"] = 8] = "MIN_SCALE_Z";
    PLYValue[PLYValue["MAX_SCALE_X"] = 9] = "MAX_SCALE_X";
    PLYValue[PLYValue["MAX_SCALE_Y"] = 10] = "MAX_SCALE_Y";
    PLYValue[PLYValue["MAX_SCALE_Z"] = 11] = "MAX_SCALE_Z";
    PLYValue[PLYValue["PACKED_POSITION"] = 12] = "PACKED_POSITION";
    PLYValue[PLYValue["PACKED_ROTATION"] = 13] = "PACKED_ROTATION";
    PLYValue[PLYValue["PACKED_SCALE"] = 14] = "PACKED_SCALE";
    PLYValue[PLYValue["PACKED_COLOR"] = 15] = "PACKED_COLOR";
    PLYValue[PLYValue["X"] = 16] = "X";
    PLYValue[PLYValue["Y"] = 17] = "Y";
    PLYValue[PLYValue["Z"] = 18] = "Z";
    PLYValue[PLYValue["SCALE_0"] = 19] = "SCALE_0";
    PLYValue[PLYValue["SCALE_1"] = 20] = "SCALE_1";
    PLYValue[PLYValue["SCALE_2"] = 21] = "SCALE_2";
    PLYValue[PLYValue["DIFFUSE_RED"] = 22] = "DIFFUSE_RED";
    PLYValue[PLYValue["DIFFUSE_GREEN"] = 23] = "DIFFUSE_GREEN";
    PLYValue[PLYValue["DIFFUSE_BLUE"] = 24] = "DIFFUSE_BLUE";
    PLYValue[PLYValue["OPACITY"] = 25] = "OPACITY";
    PLYValue[PLYValue["F_DC_0"] = 26] = "F_DC_0";
    PLYValue[PLYValue["F_DC_1"] = 27] = "F_DC_1";
    PLYValue[PLYValue["F_DC_2"] = 28] = "F_DC_2";
    PLYValue[PLYValue["F_DC_3"] = 29] = "F_DC_3";
    PLYValue[PLYValue["ROT_0"] = 30] = "ROT_0";
    PLYValue[PLYValue["ROT_1"] = 31] = "ROT_1";
    PLYValue[PLYValue["ROT_2"] = 32] = "ROT_2";
    PLYValue[PLYValue["ROT_3"] = 33] = "ROT_3";
    PLYValue[PLYValue["MIN_COLOR_R"] = 34] = "MIN_COLOR_R";
    PLYValue[PLYValue["MIN_COLOR_G"] = 35] = "MIN_COLOR_G";
    PLYValue[PLYValue["MIN_COLOR_B"] = 36] = "MIN_COLOR_B";
    PLYValue[PLYValue["MAX_COLOR_R"] = 37] = "MAX_COLOR_R";
    PLYValue[PLYValue["MAX_COLOR_G"] = 38] = "MAX_COLOR_G";
    PLYValue[PLYValue["MAX_COLOR_B"] = 39] = "MAX_COLOR_B";
    PLYValue[PLYValue["SH_0"] = 40] = "SH_0";
    PLYValue[PLYValue["SH_1"] = 41] = "SH_1";
    PLYValue[PLYValue["SH_2"] = 42] = "SH_2";
    PLYValue[PLYValue["SH_3"] = 43] = "SH_3";
    PLYValue[PLYValue["SH_4"] = 44] = "SH_4";
    PLYValue[PLYValue["SH_5"] = 45] = "SH_5";
    PLYValue[PLYValue["SH_6"] = 46] = "SH_6";
    PLYValue[PLYValue["SH_7"] = 47] = "SH_7";
    PLYValue[PLYValue["SH_8"] = 48] = "SH_8";
    PLYValue[PLYValue["SH_9"] = 49] = "SH_9";
    PLYValue[PLYValue["SH_10"] = 50] = "SH_10";
    PLYValue[PLYValue["SH_11"] = 51] = "SH_11";
    PLYValue[PLYValue["SH_12"] = 52] = "SH_12";
    PLYValue[PLYValue["SH_13"] = 53] = "SH_13";
    PLYValue[PLYValue["SH_14"] = 54] = "SH_14";
    PLYValue[PLYValue["SH_15"] = 55] = "SH_15";
    PLYValue[PLYValue["SH_16"] = 56] = "SH_16";
    PLYValue[PLYValue["SH_17"] = 57] = "SH_17";
    PLYValue[PLYValue["SH_18"] = 58] = "SH_18";
    PLYValue[PLYValue["SH_19"] = 59] = "SH_19";
    PLYValue[PLYValue["SH_20"] = 60] = "SH_20";
    PLYValue[PLYValue["SH_21"] = 61] = "SH_21";
    PLYValue[PLYValue["SH_22"] = 62] = "SH_22";
    PLYValue[PLYValue["SH_23"] = 63] = "SH_23";
    PLYValue[PLYValue["SH_24"] = 64] = "SH_24";
    PLYValue[PLYValue["SH_25"] = 65] = "SH_25";
    PLYValue[PLYValue["SH_26"] = 66] = "SH_26";
    PLYValue[PLYValue["SH_27"] = 67] = "SH_27";
    PLYValue[PLYValue["SH_28"] = 68] = "SH_28";
    PLYValue[PLYValue["SH_29"] = 69] = "SH_29";
    PLYValue[PLYValue["SH_30"] = 70] = "SH_30";
    PLYValue[PLYValue["SH_31"] = 71] = "SH_31";
    PLYValue[PLYValue["SH_32"] = 72] = "SH_32";
    PLYValue[PLYValue["SH_33"] = 73] = "SH_33";
    PLYValue[PLYValue["SH_34"] = 74] = "SH_34";
    PLYValue[PLYValue["SH_35"] = 75] = "SH_35";
    PLYValue[PLYValue["SH_36"] = 76] = "SH_36";
    PLYValue[PLYValue["SH_37"] = 77] = "SH_37";
    PLYValue[PLYValue["SH_38"] = 78] = "SH_38";
    PLYValue[PLYValue["SH_39"] = 79] = "SH_39";
    PLYValue[PLYValue["SH_40"] = 80] = "SH_40";
    PLYValue[PLYValue["SH_41"] = 81] = "SH_41";
    PLYValue[PLYValue["SH_42"] = 82] = "SH_42";
    PLYValue[PLYValue["SH_43"] = 83] = "SH_43";
    PLYValue[PLYValue["SH_44"] = 84] = "SH_44";
    PLYValue[PLYValue["UNDEFINED"] = 85] = "UNDEFINED";
})(PLYValue || (PLYValue = {}));
/**
 * Class used to render a gaussian splatting mesh
 */
export class GaussianSplattingMesh extends Mesh {
    /**
     * SH degree. 0 = no sh (default). 1 = 3 parameters. 2 = 8 parameters. 3 = 15 parameters.
     */
    get shDegree() {
        return this._shDegree;
    }
    /**
     * returns the splats data array buffer that contains in order : postions (3 floats), size (3 floats), color (4 bytes), orientation quaternion (4 bytes)
     */
    get splatsData() {
        return this._splatsData;
    }
    /**
     * Gets the covariancesA texture
     */
    get covariancesATexture() {
        return this._covariancesATexture;
    }
    /**
     * Gets the covariancesB texture
     */
    get covariancesBTexture() {
        return this._covariancesBTexture;
    }
    /**
     * Gets the centers texture
     */
    get centersTexture() {
        return this._centersTexture;
    }
    /**
     * Gets the colors texture
     */
    get colorsTexture() {
        return this._colorsTexture;
    }
    /**
     * Gets the SH textures
     */
    get shTextures() {
        return this._shTextures;
    }
    /**
     * set rendering material
     */
    set material(value) {
        this._material = value;
        this._material.backFaceCulling = true;
        this._material.cullBackFaces = false;
        value.resetDrawCache();
    }
    /**
     * get rendering material
     */
    get material() {
        return this._material;
    }
    /**
     * Creates a new gaussian splatting mesh
     * @param name defines the name of the mesh
     * @param url defines the url to load from (optional)
     * @param scene defines the hosting scene (optional)
     * @param keepInRam keep datas in ram for editing purpose
     */
    constructor(name, url = null, scene = null, keepInRam = false) {
        super(name, scene);
        this._vertexCount = 0;
        this._worker = null;
        this._frameIdLastUpdate = -1;
        this._modelViewMatrix = Matrix.Identity();
        this._canPostToWorker = true;
        this._readyToDisplay = false;
        this._covariancesATexture = null;
        this._covariancesBTexture = null;
        this._centersTexture = null;
        this._colorsTexture = null;
        this._splatPositions = null;
        this._splatIndex = null;
        this._shTextures = null;
        this._splatsData = null;
        this._sh = null;
        this._keepInRam = false;
        this._delayedTextureUpdate = null;
        this._oldDirection = new Vector3();
        this._useRGBACovariants = false;
        this._material = null;
        this._tmpCovariances = [0, 0, 0, 0, 0, 0];
        this._sortIsDirty = false;
        this._shDegree = 0;
        const vertexData = new VertexData();
        // Use an intanced quad or triangle. Triangle might be a bit faster because of less shader invocation but I didn't see any difference.
        // Keeping both and use triangle for now.
        // for quad, use following lines
        //vertexData.positions = [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0];
        //vertexData.indices = [0, 1, 2, 0, 2, 3];
        vertexData.positions = [-3, -2, 0, 3, -2, 0, 0, 4, 0];
        vertexData.indices = [0, 1, 2];
        vertexData.applyToMesh(this);
        this.subMeshes = [];
        // for quad, use following line
        //new SubMesh(0, 0, 4, 0, 6, this);
        new SubMesh(0, 0, 3, 0, 3, this);
        this.setEnabled(false);
        // webGL2 and webGPU support for RG texture with float16 is fine. not webGL1
        this._useRGBACovariants = !this.getEngine().isWebGPU && this.getEngine().version === 1.0;
        this._keepInRam = keepInRam;
        if (url) {
            this.loadFileAsync(url);
        }
        this._material = new GaussianSplattingMaterial(this.name + "_material", this._scene);
    }
    /**
     * Returns the class name
     * @returns "GaussianSplattingMesh"
     */
    getClassName() {
        return "GaussianSplattingMesh";
    }
    /**
     * Returns the total number of vertices (splats) within the mesh
     * @returns the total number of vertices
     */
    getTotalVertices() {
        return this._vertexCount;
    }
    /**
     * Is this node ready to be used/rendered
     * @param completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
     * @returns true when ready
     */
    isReady(completeCheck = false) {
        if (!super.isReady(completeCheck, true)) {
            return false;
        }
        if (!this._readyToDisplay) {
            // mesh is ready when worker has done at least 1 sorting
            this._postToWorker(true);
            return false;
        }
        return true;
    }
    /** @internal */
    _postToWorker(forced = false) {
        const frameId = this.getScene().getFrameId();
        if ((forced || frameId !== this._frameIdLastUpdate) && this._worker && this._scene.activeCamera && this._canPostToWorker) {
            const cameraMatrix = this._scene.activeCamera.getViewMatrix();
            this.getWorldMatrix().multiplyToRef(cameraMatrix, this._modelViewMatrix);
            cameraMatrix.invertToRef(TmpVectors.Matrix[0]);
            this.getWorldMatrix().multiplyToRef(TmpVectors.Matrix[0], TmpVectors.Matrix[1]);
            Vector3.TransformNormalToRef(Vector3.Forward(this._scene.useRightHandedSystem), TmpVectors.Matrix[1], TmpVectors.Vector3[2]);
            TmpVectors.Vector3[2].normalize();
            const dot = Vector3.Dot(TmpVectors.Vector3[2], this._oldDirection);
            if (forced || Math.abs(dot - 1) >= 0.01) {
                this._oldDirection.copyFrom(TmpVectors.Vector3[2]);
                this._frameIdLastUpdate = frameId;
                this._canPostToWorker = false;
                this._worker.postMessage({ view: this._modelViewMatrix.m, depthMix: this._depthMix, useRightHandedSystem: this._scene.useRightHandedSystem }, [
                    this._depthMix.buffer,
                ]);
            }
        }
    }
    /**
     * Triggers the draw call for the mesh. Usually, you don't need to call this method by your own because the mesh rendering is handled by the scene rendering manager
     * @param subMesh defines the subMesh to render
     * @param enableAlphaMode defines if alpha mode can be changed
     * @param effectiveMeshReplacement defines an optional mesh used to provide info for the rendering
     * @returns the current mesh
     */
    render(subMesh, enableAlphaMode, effectiveMeshReplacement) {
        this._postToWorker();
        return super.render(subMesh, enableAlphaMode, effectiveMeshReplacement);
    }
    static _TypeNameToEnum(name) {
        switch (name) {
            case "float":
                return 0 /* PLYType.FLOAT */;
            case "int":
                return 1 /* PLYType.INT */;
                break;
            case "uint":
                return 2 /* PLYType.UINT */;
            case "double":
                return 3 /* PLYType.DOUBLE */;
            case "uchar":
                return 4 /* PLYType.UCHAR */;
        }
        return 5 /* PLYType.UNDEFINED */;
    }
    static _ValueNameToEnum(name) {
        switch (name) {
            case "min_x":
                return 0 /* PLYValue.MIN_X */;
            case "min_y":
                return 1 /* PLYValue.MIN_Y */;
            case "min_z":
                return 2 /* PLYValue.MIN_Z */;
            case "max_x":
                return 3 /* PLYValue.MAX_X */;
            case "max_y":
                return 4 /* PLYValue.MAX_Y */;
            case "max_z":
                return 5 /* PLYValue.MAX_Z */;
            case "min_scale_x":
                return 6 /* PLYValue.MIN_SCALE_X */;
            case "min_scale_y":
                return 7 /* PLYValue.MIN_SCALE_Y */;
            case "min_scale_z":
                return 8 /* PLYValue.MIN_SCALE_Z */;
            case "max_scale_x":
                return 9 /* PLYValue.MAX_SCALE_X */;
            case "max_scale_y":
                return 10 /* PLYValue.MAX_SCALE_Y */;
            case "max_scale_z":
                return 11 /* PLYValue.MAX_SCALE_Z */;
            case "packed_position":
                return 12 /* PLYValue.PACKED_POSITION */;
            case "packed_rotation":
                return 13 /* PLYValue.PACKED_ROTATION */;
            case "packed_scale":
                return 14 /* PLYValue.PACKED_SCALE */;
            case "packed_color":
                return 15 /* PLYValue.PACKED_COLOR */;
            case "x":
                return 16 /* PLYValue.X */;
            case "y":
                return 17 /* PLYValue.Y */;
            case "z":
                return 18 /* PLYValue.Z */;
            case "scale_0":
                return 19 /* PLYValue.SCALE_0 */;
            case "scale_1":
                return 20 /* PLYValue.SCALE_1 */;
            case "scale_2":
                return 21 /* PLYValue.SCALE_2 */;
            case "diffuse_red":
            case "red":
                return 22 /* PLYValue.DIFFUSE_RED */;
            case "diffuse_green":
            case "green":
                return 23 /* PLYValue.DIFFUSE_GREEN */;
            case "diffuse_blue":
            case "blue":
                return 24 /* PLYValue.DIFFUSE_BLUE */;
            case "f_dc_0":
                return 26 /* PLYValue.F_DC_0 */;
            case "f_dc_1":
                return 27 /* PLYValue.F_DC_1 */;
            case "f_dc_2":
                return 28 /* PLYValue.F_DC_2 */;
            case "f_dc_3":
                return 29 /* PLYValue.F_DC_3 */;
            case "opacity":
                return 25 /* PLYValue.OPACITY */;
            case "rot_0":
                return 30 /* PLYValue.ROT_0 */;
            case "rot_1":
                return 31 /* PLYValue.ROT_1 */;
            case "rot_2":
                return 32 /* PLYValue.ROT_2 */;
            case "rot_3":
                return 33 /* PLYValue.ROT_3 */;
            case "min_r":
                return 34 /* PLYValue.MIN_COLOR_R */;
            case "min_g":
                return 35 /* PLYValue.MIN_COLOR_G */;
            case "min_b":
                return 36 /* PLYValue.MIN_COLOR_B */;
            case "max_r":
                return 37 /* PLYValue.MAX_COLOR_R */;
            case "max_g":
                return 38 /* PLYValue.MAX_COLOR_G */;
            case "max_b":
                return 39 /* PLYValue.MAX_COLOR_B */;
            case "f_rest_0":
                return 40 /* PLYValue.SH_0 */;
            case "f_rest_1":
                return 41 /* PLYValue.SH_1 */;
            case "f_rest_2":
                return 42 /* PLYValue.SH_2 */;
            case "f_rest_3":
                return 43 /* PLYValue.SH_3 */;
            case "f_rest_4":
                return 44 /* PLYValue.SH_4 */;
            case "f_rest_5":
                return 45 /* PLYValue.SH_5 */;
            case "f_rest_6":
                return 46 /* PLYValue.SH_6 */;
            case "f_rest_7":
                return 47 /* PLYValue.SH_7 */;
            case "f_rest_8":
                return 48 /* PLYValue.SH_8 */;
            case "f_rest_9":
                return 49 /* PLYValue.SH_9 */;
            case "f_rest_10":
                return 50 /* PLYValue.SH_10 */;
            case "f_rest_11":
                return 51 /* PLYValue.SH_11 */;
            case "f_rest_12":
                return 52 /* PLYValue.SH_12 */;
            case "f_rest_13":
                return 53 /* PLYValue.SH_13 */;
            case "f_rest_14":
                return 54 /* PLYValue.SH_14 */;
            case "f_rest_15":
                return 55 /* PLYValue.SH_15 */;
            case "f_rest_16":
                return 56 /* PLYValue.SH_16 */;
            case "f_rest_17":
                return 57 /* PLYValue.SH_17 */;
            case "f_rest_18":
                return 58 /* PLYValue.SH_18 */;
            case "f_rest_19":
                return 59 /* PLYValue.SH_19 */;
            case "f_rest_20":
                return 60 /* PLYValue.SH_20 */;
            case "f_rest_21":
                return 61 /* PLYValue.SH_21 */;
            case "f_rest_22":
                return 62 /* PLYValue.SH_22 */;
            case "f_rest_23":
                return 63 /* PLYValue.SH_23 */;
            case "f_rest_24":
                return 64 /* PLYValue.SH_24 */;
            case "f_rest_25":
                return 65 /* PLYValue.SH_25 */;
            case "f_rest_26":
                return 66 /* PLYValue.SH_26 */;
            case "f_rest_27":
                return 67 /* PLYValue.SH_27 */;
            case "f_rest_28":
                return 68 /* PLYValue.SH_28 */;
            case "f_rest_29":
                return 69 /* PLYValue.SH_29 */;
            case "f_rest_30":
                return 70 /* PLYValue.SH_30 */;
            case "f_rest_31":
                return 71 /* PLYValue.SH_31 */;
            case "f_rest_32":
                return 72 /* PLYValue.SH_32 */;
            case "f_rest_33":
                return 73 /* PLYValue.SH_33 */;
            case "f_rest_34":
                return 74 /* PLYValue.SH_34 */;
            case "f_rest_35":
                return 75 /* PLYValue.SH_35 */;
            case "f_rest_36":
                return 76 /* PLYValue.SH_36 */;
            case "f_rest_37":
                return 77 /* PLYValue.SH_37 */;
            case "f_rest_38":
                return 78 /* PLYValue.SH_38 */;
            case "f_rest_39":
                return 79 /* PLYValue.SH_39 */;
            case "f_rest_40":
                return 80 /* PLYValue.SH_40 */;
            case "f_rest_41":
                return 81 /* PLYValue.SH_41 */;
            case "f_rest_42":
                return 82 /* PLYValue.SH_42 */;
            case "f_rest_43":
                return 83 /* PLYValue.SH_43 */;
            case "f_rest_44":
                return 84 /* PLYValue.SH_44 */;
        }
        return 85 /* PLYValue.UNDEFINED */;
    }
    /**
     * Parse a PLY file header and returns metas infos on splats and chunks
     * @param data the loaded buffer
     * @returns a PLYHeader
     */
    static ParseHeader(data) {
        const ubuf = new Uint8Array(data);
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const headerEnd = "end_header\n";
        const headerEndIndex = header.indexOf(headerEnd);
        if (headerEndIndex < 0 || !header) {
            // standard splat
            return null;
        }
        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)[1]);
        const chunkElement = /element chunk (\d+)\n/.exec(header);
        let chunkCount = 0;
        if (chunkElement) {
            chunkCount = parseInt(chunkElement[1]);
        }
        let rowVertexOffset = 0;
        let rowChunkOffset = 0;
        const offsets = {
            double: 8,
            int: 4,
            uint: 4,
            float: 4,
            short: 2,
            ushort: 2,
            uchar: 1,
            list: 0,
        };
        let ElementMode;
        (function (ElementMode) {
            ElementMode[ElementMode["Vertex"] = 0] = "Vertex";
            ElementMode[ElementMode["Chunk"] = 1] = "Chunk";
        })(ElementMode || (ElementMode = {}));
        let chunkMode = 1 /* ElementMode.Chunk */;
        const vertexProperties = [];
        const chunkProperties = [];
        const filtered = header.slice(0, headerEndIndex).split("\n");
        let shDegree = 0;
        for (const prop of filtered) {
            if (prop.startsWith("property ")) {
                const [, typeName, name] = prop.split(" ");
                const value = GaussianSplattingMesh._ValueNameToEnum(name);
                // SH degree 1,2 or 3 for 9, 24 or 45 values
                if (value >= 84 /* PLYValue.SH_44 */) {
                    shDegree = 3;
                }
                else if (value >= 64 /* PLYValue.SH_24 */) {
                    shDegree = 2;
                }
                else if (value >= 48 /* PLYValue.SH_8 */) {
                    shDegree = 1;
                }
                const type = GaussianSplattingMesh._TypeNameToEnum(typeName);
                if (chunkMode == 1 /* ElementMode.Chunk */) {
                    chunkProperties.push({ value, type, offset: rowChunkOffset });
                    rowChunkOffset += offsets[typeName];
                }
                else if (chunkMode == 0 /* ElementMode.Vertex */) {
                    vertexProperties.push({ value, type, offset: rowVertexOffset });
                    rowVertexOffset += offsets[typeName];
                }
                if (!offsets[typeName]) {
                    Logger.Warn(`Unsupported property type: ${typeName}.`);
                }
            }
            else if (prop.startsWith("element ")) {
                const [, type] = prop.split(" ");
                if (type == "chunk") {
                    chunkMode = 1 /* ElementMode.Chunk */;
                }
                else if (type == "vertex") {
                    chunkMode = 0 /* ElementMode.Vertex */;
                }
            }
        }
        const dataView = new DataView(data, headerEndIndex + headerEnd.length);
        const buffer = new ArrayBuffer(GaussianSplattingMesh._RowOutputLength * vertexCount);
        let shBuffer = null;
        let shCoefficientCount = 0;
        if (shDegree) {
            const shVectorCount = (shDegree + 1) * (shDegree + 1) - 1;
            shCoefficientCount = shVectorCount * 3;
            shBuffer = new ArrayBuffer(shCoefficientCount * vertexCount);
        }
        return {
            vertexCount: vertexCount,
            chunkCount: chunkCount,
            rowVertexLength: rowVertexOffset,
            rowChunkLength: rowChunkOffset,
            vertexProperties: vertexProperties,
            chunkProperties: chunkProperties,
            dataView: dataView,
            buffer: buffer,
            shDegree: shDegree,
            shCoefficientCount: shCoefficientCount,
            shBuffer: shBuffer,
        };
    }
    static _GetCompressedChunks(header, offset) {
        if (!header.chunkCount) {
            return null;
        }
        const dataView = header.dataView;
        const compressedChunks = new Array(header.chunkCount);
        for (let i = 0; i < header.chunkCount; i++) {
            const currentChunk = {
                min: new Vector3(),
                max: new Vector3(),
                minScale: new Vector3(),
                maxScale: new Vector3(),
                minColor: new Vector3(0, 0, 0),
                maxColor: new Vector3(1, 1, 1),
            };
            compressedChunks[i] = currentChunk;
            for (let propertyIndex = 0; propertyIndex < header.chunkProperties.length; propertyIndex++) {
                const property = header.chunkProperties[propertyIndex];
                let value;
                switch (property.type) {
                    case 0 /* PLYType.FLOAT */:
                        value = dataView.getFloat32(property.offset + offset.value, true);
                        break;
                    default:
                        continue;
                }
                switch (property.value) {
                    case 0 /* PLYValue.MIN_X */:
                        currentChunk.min.x = value;
                        break;
                    case 1 /* PLYValue.MIN_Y */:
                        currentChunk.min.y = value;
                        break;
                    case 2 /* PLYValue.MIN_Z */:
                        currentChunk.min.z = value;
                        break;
                    case 3 /* PLYValue.MAX_X */:
                        currentChunk.max.x = value;
                        break;
                    case 4 /* PLYValue.MAX_Y */:
                        currentChunk.max.y = value;
                        break;
                    case 5 /* PLYValue.MAX_Z */:
                        currentChunk.max.z = value;
                        break;
                    case 6 /* PLYValue.MIN_SCALE_X */:
                        currentChunk.minScale.x = value;
                        break;
                    case 7 /* PLYValue.MIN_SCALE_Y */:
                        currentChunk.minScale.y = value;
                        break;
                    case 8 /* PLYValue.MIN_SCALE_Z */:
                        currentChunk.minScale.z = value;
                        break;
                    case 9 /* PLYValue.MAX_SCALE_X */:
                        currentChunk.maxScale.x = value;
                        break;
                    case 10 /* PLYValue.MAX_SCALE_Y */:
                        currentChunk.maxScale.y = value;
                        break;
                    case 11 /* PLYValue.MAX_SCALE_Z */:
                        currentChunk.maxScale.z = value;
                        break;
                    case 34 /* PLYValue.MIN_COLOR_R */:
                        currentChunk.minColor.x = value;
                        break;
                    case 35 /* PLYValue.MIN_COLOR_G */:
                        currentChunk.minColor.y = value;
                        break;
                    case 36 /* PLYValue.MIN_COLOR_B */:
                        currentChunk.minColor.z = value;
                        break;
                    case 37 /* PLYValue.MAX_COLOR_R */:
                        currentChunk.maxColor.x = value;
                        break;
                    case 38 /* PLYValue.MAX_COLOR_G */:
                        currentChunk.maxColor.y = value;
                        break;
                    case 39 /* PLYValue.MAX_COLOR_B */:
                        currentChunk.maxColor.z = value;
                        break;
                }
            }
            offset.value += header.rowChunkLength;
        }
        return compressedChunks;
    }
    static _GetSplat(header, index, compressedChunks, offset) {
        const q = TmpVectors.Quaternion[0];
        const temp3 = TmpVectors.Vector3[0];
        const rowOutputLength = GaussianSplattingMesh._RowOutputLength;
        const buffer = header.buffer;
        const dataView = header.dataView;
        const position = new Float32Array(buffer, index * rowOutputLength, 3);
        const scale = new Float32Array(buffer, index * rowOutputLength + 12, 3);
        const rgba = new Uint8ClampedArray(buffer, index * rowOutputLength + 24, 4);
        const rot = new Uint8ClampedArray(buffer, index * rowOutputLength + 28, 4);
        let sh = null;
        if (header.shBuffer) {
            sh = new Uint8ClampedArray(header.shBuffer, index * header.shCoefficientCount, header.shCoefficientCount);
        }
        const chunkIndex = index >> 8;
        let r0 = 255;
        let r1 = 0;
        let r2 = 0;
        let r3 = 0;
        for (let propertyIndex = 0; propertyIndex < header.vertexProperties.length; propertyIndex++) {
            const property = header.vertexProperties[propertyIndex];
            let value;
            switch (property.type) {
                case 0 /* PLYType.FLOAT */:
                    value = dataView.getFloat32(offset.value + property.offset, true);
                    break;
                case 1 /* PLYType.INT */:
                    value = dataView.getInt32(offset.value + property.offset, true);
                    break;
                case 2 /* PLYType.UINT */:
                    value = dataView.getUint32(offset.value + property.offset, true);
                    break;
                case 3 /* PLYType.DOUBLE */:
                    value = dataView.getFloat64(offset.value + property.offset, true);
                    break;
                case 4 /* PLYType.UCHAR */:
                    value = dataView.getUint8(offset.value + property.offset);
                    break;
                default:
                    continue;
            }
            switch (property.value) {
                case 12 /* PLYValue.PACKED_POSITION */:
                    {
                        const compressedChunk = compressedChunks[chunkIndex];
                        unpack111011(value, temp3);
                        position[0] = Scalar.Lerp(compressedChunk.min.x, compressedChunk.max.x, temp3.x);
                        position[1] = Scalar.Lerp(compressedChunk.min.y, compressedChunk.max.y, temp3.y);
                        position[2] = Scalar.Lerp(compressedChunk.min.z, compressedChunk.max.z, temp3.z);
                    }
                    break;
                case 13 /* PLYValue.PACKED_ROTATION */:
                    {
                        unpackRot(value, q);
                        r0 = q.w;
                        r1 = -q.z;
                        r2 = q.y;
                        r3 = -q.x;
                    }
                    break;
                case 14 /* PLYValue.PACKED_SCALE */:
                    {
                        const compressedChunk = compressedChunks[chunkIndex];
                        unpack111011(value, temp3);
                        scale[0] = Math.exp(Scalar.Lerp(compressedChunk.minScale.x, compressedChunk.maxScale.x, temp3.x));
                        scale[1] = Math.exp(Scalar.Lerp(compressedChunk.minScale.y, compressedChunk.maxScale.y, temp3.y));
                        scale[2] = Math.exp(Scalar.Lerp(compressedChunk.minScale.z, compressedChunk.maxScale.z, temp3.z));
                    }
                    break;
                case 15 /* PLYValue.PACKED_COLOR */:
                    {
                        const compressedChunk = compressedChunks[chunkIndex];
                        unpack8888(value, rgba);
                        rgba[0] = Scalar.Lerp(compressedChunk.minColor.x, compressedChunk.maxColor.x, rgba[0] / 255) * 255;
                        rgba[1] = Scalar.Lerp(compressedChunk.minColor.y, compressedChunk.maxColor.y, rgba[1] / 255) * 255;
                        rgba[2] = Scalar.Lerp(compressedChunk.minColor.z, compressedChunk.maxColor.z, rgba[2] / 255) * 255;
                    }
                    break;
                case 16 /* PLYValue.X */:
                    position[0] = value;
                    break;
                case 17 /* PLYValue.Y */:
                    position[1] = value;
                    break;
                case 18 /* PLYValue.Z */:
                    position[2] = value;
                    break;
                case 19 /* PLYValue.SCALE_0 */:
                    scale[0] = Math.exp(value);
                    break;
                case 20 /* PLYValue.SCALE_1 */:
                    scale[1] = Math.exp(value);
                    break;
                case 21 /* PLYValue.SCALE_2 */:
                    scale[2] = Math.exp(value);
                    break;
                case 22 /* PLYValue.DIFFUSE_RED */:
                    rgba[0] = value;
                    break;
                case 23 /* PLYValue.DIFFUSE_GREEN */:
                    rgba[1] = value;
                    break;
                case 24 /* PLYValue.DIFFUSE_BLUE */:
                    rgba[2] = value;
                    break;
                case 26 /* PLYValue.F_DC_0 */:
                    rgba[0] = (0.5 + GaussianSplattingMesh._SH_C0 * value) * 255;
                    break;
                case 27 /* PLYValue.F_DC_1 */:
                    rgba[1] = (0.5 + GaussianSplattingMesh._SH_C0 * value) * 255;
                    break;
                case 28 /* PLYValue.F_DC_2 */:
                    rgba[2] = (0.5 + GaussianSplattingMesh._SH_C0 * value) * 255;
                    break;
                case 29 /* PLYValue.F_DC_3 */:
                    rgba[3] = (0.5 + GaussianSplattingMesh._SH_C0 * value) * 255;
                    break;
                case 25 /* PLYValue.OPACITY */:
                    rgba[3] = (1 / (1 + Math.exp(-value))) * 255;
                    break;
                case 30 /* PLYValue.ROT_0 */:
                    r0 = value;
                    break;
                case 31 /* PLYValue.ROT_1 */:
                    r1 = value;
                    break;
                case 32 /* PLYValue.ROT_2 */:
                    r2 = value;
                    break;
                case 33 /* PLYValue.ROT_3 */:
                    r3 = value;
                    break;
            }
            if (sh && property.value >= 40 /* PLYValue.SH_0 */ && property.value <= 84 /* PLYValue.SH_44 */) {
                const clampedValue = Scalar.Clamp(value * 127.5 + 127.5, 0, 255);
                const shIndex = property.value - 40 /* PLYValue.SH_0 */;
                sh[shIndex] = clampedValue;
            }
        }
        q.set(r1, r2, r3, r0);
        q.normalize();
        rot[0] = q.w * 128 + 128;
        rot[1] = q.x * 128 + 128;
        rot[2] = q.y * 128 + 128;
        rot[3] = q.z * 128 + 128;
        offset.value += header.rowVertexLength;
    }
    /**
     * Converts a .ply data with SH coefficients splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @param useCoroutine use coroutine and yield
     * @returns the loaded splat buffer and optional array of sh coefficients
     */
    static *ConvertPLYWithSHToSplat(data, useCoroutine = false) {
        const header = GaussianSplattingMesh.ParseHeader(data);
        if (!header) {
            return { buffer: data };
        }
        const offset = { value: 0 };
        const compressedChunks = GaussianSplattingMesh._GetCompressedChunks(header, offset);
        for (let i = 0; i < header.vertexCount; i++) {
            GaussianSplattingMesh._GetSplat(header, i, compressedChunks, offset);
            if (i % GaussianSplattingMesh._PlyConversionBatchSize === 0 && useCoroutine) {
                yield;
            }
        }
        let sh = null;
        // make SH texture buffers
        if (header.shDegree && header.shBuffer) {
            const textureCount = Math.ceil(header.shCoefficientCount / 16); // 4 components can be stored per texture, 4 sh per component
            let shIndexRead = 0;
            const ubuf = new Uint8Array(header.shBuffer);
            // sh is an array of uint8array that will be used to create sh textures
            sh = [];
            const splatCount = header.vertexCount;
            const engine = EngineStore.LastCreatedEngine;
            if (engine) {
                const width = engine.getCaps().maxTextureSize;
                const height = Math.ceil(splatCount / width);
                // create array for the number of textures needed.
                for (let textureIndex = 0; textureIndex < textureCount; textureIndex++) {
                    const texture = new Uint8Array(height * width * 4 * 4); // 4 components per texture, 4 sh per component
                    sh.push(texture);
                }
                for (let i = 0; i < splatCount; i++) {
                    for (let shIndexWrite = 0; shIndexWrite < header.shCoefficientCount; shIndexWrite++) {
                        const shValue = ubuf[shIndexRead++];
                        const textureIndex = Math.floor(shIndexWrite / 16);
                        const shArray = sh[textureIndex];
                        const byteIndexInTexture = shIndexWrite % 16; // [0..15]
                        const offsetPerSplat = i * 16; // 16 sh values per texture per splat.
                        shArray[byteIndexInTexture + offsetPerSplat] = shValue;
                    }
                }
            }
        }
        return { buffer: header.buffer, sh: sh };
    }
    /**
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @param useCoroutine use coroutine and yield
     * @returns the loaded splat buffer without SH coefficient, whether ply contains or not SH.
     */
    static *ConvertPLYToSplat(data, useCoroutine = false) {
        const header = GaussianSplattingMesh.ParseHeader(data);
        if (!header) {
            return data;
        }
        const offset = { value: 0 };
        const compressedChunks = GaussianSplattingMesh._GetCompressedChunks(header, offset);
        for (let i = 0; i < header.vertexCount; i++) {
            GaussianSplattingMesh._GetSplat(header, i, compressedChunks, offset);
            if (i % GaussianSplattingMesh._PlyConversionBatchSize === 0 && useCoroutine) {
                yield;
            }
        }
        return header.buffer;
    }
    /**
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer
     */
    static async ConvertPLYToSplatAsync(data) {
        return runCoroutineAsync(GaussianSplattingMesh.ConvertPLYToSplat(data, true), createYieldingScheduler());
    }
    /**
     * Converts a .ply with SH data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer with SH
     */
    static async ConvertPLYWithSHToSplatAsync(data) {
        return runCoroutineAsync(GaussianSplattingMesh.ConvertPLYWithSHToSplat(data, true), createYieldingScheduler());
    }
    /**
     * Loads a .splat Gaussian Splatting array buffer asynchronously
     * @param data arraybuffer containing splat file
     * @returns a promise that resolves when the operation is complete
     */
    loadDataAsync(data) {
        return this.updateDataAsync(data);
    }
    /**
     * Loads a .splat Gaussian or .ply Splatting file asynchronously
     * @param url path to the splat file to load
     * @returns a promise that resolves when the operation is complete
     * @deprecated Please use SceneLoader.ImportMeshAsync instead
     */
    loadFileAsync(url) {
        return Tools.LoadFileAsync(url, true).then(async (plyBuffer) => {
            GaussianSplattingMesh.ConvertPLYWithSHToSplatAsync(plyBuffer).then((splatsData) => {
                this.updateDataAsync(splatsData.buffer, splatsData.sh);
            });
        });
    }
    /**
     * Releases resources associated with this mesh.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     */
    dispose(doNotRecurse) {
        this._covariancesATexture?.dispose();
        this._covariancesBTexture?.dispose();
        this._centersTexture?.dispose();
        this._colorsTexture?.dispose();
        if (this._shTextures) {
            this._shTextures.forEach((shTexture) => {
                shTexture.dispose();
            });
        }
        this._covariancesATexture = null;
        this._covariancesBTexture = null;
        this._centersTexture = null;
        this._colorsTexture = null;
        this._shTextures = null;
        this._worker?.terminate();
        this._worker = null;
        super.dispose(doNotRecurse, true);
    }
    _copyTextures(source) {
        this._covariancesATexture = source.covariancesATexture?.clone();
        this._covariancesBTexture = source.covariancesBTexture?.clone();
        this._centersTexture = source.centersTexture?.clone();
        this._colorsTexture = source.colorsTexture?.clone();
        if (source._shTextures) {
            this._shTextures = [];
            this._shTextures.forEach((shTexture) => {
                this._shTextures?.push(shTexture.clone());
            });
        }
    }
    /**
     * Returns a new Mesh object generated from the current mesh properties.
     * @param name is a string, the name given to the new mesh
     * @returns a new Gaussian Splatting Mesh
     */
    clone(name = "") {
        const newGS = new GaussianSplattingMesh(name, undefined, this.getScene());
        newGS._copySource(this);
        newGS.makeGeometryUnique();
        newGS._vertexCount = this._vertexCount;
        newGS._copyTextures(this);
        newGS._modelViewMatrix = Matrix.Identity();
        newGS._splatPositions = this._splatPositions;
        newGS._readyToDisplay = false;
        newGS._instanciateWorker();
        const binfo = this.getBoundingInfo();
        newGS.getBoundingInfo().reConstruct(binfo.minimum, binfo.maximum, this.getWorldMatrix());
        newGS.forcedInstanceCount = newGS._vertexCount;
        newGS.setEnabled(true);
        return newGS;
    }
    _makeSplat(index, fBuffer, uBuffer, covA, covB, colorArray, minimum, maximum) {
        const matrixRotation = TmpVectors.Matrix[0];
        const matrixScale = TmpVectors.Matrix[1];
        const quaternion = TmpVectors.Quaternion[0];
        const covBSItemSize = this._useRGBACovariants ? 4 : 2;
        const x = fBuffer[8 * index + 0];
        const y = -fBuffer[8 * index + 1];
        const z = fBuffer[8 * index + 2];
        this._splatPositions[4 * index + 0] = x;
        this._splatPositions[4 * index + 1] = y;
        this._splatPositions[4 * index + 2] = z;
        minimum.minimizeInPlaceFromFloats(x, y, z);
        maximum.maximizeInPlaceFromFloats(x, y, z);
        quaternion.set((uBuffer[32 * index + 28 + 1] - 127.5) / 127.5, (uBuffer[32 * index + 28 + 2] - 127.5) / 127.5, (uBuffer[32 * index + 28 + 3] - 127.5) / 127.5, -(uBuffer[32 * index + 28 + 0] - 127.5) / 127.5);
        quaternion.toRotationMatrix(matrixRotation);
        Matrix.ScalingToRef(fBuffer[8 * index + 3 + 0] * 2, fBuffer[8 * index + 3 + 1] * 2, fBuffer[8 * index + 3 + 2] * 2, matrixScale);
        const M = matrixRotation.multiplyToRef(matrixScale, TmpVectors.Matrix[0]).m;
        const covariances = this._tmpCovariances;
        covariances[0] = M[0] * M[0] + M[1] * M[1] + M[2] * M[2];
        covariances[1] = M[0] * M[4] + M[1] * M[5] + M[2] * M[6];
        covariances[2] = M[0] * M[8] + M[1] * M[9] + M[2] * M[10];
        covariances[3] = M[4] * M[4] + M[5] * M[5] + M[6] * M[6];
        covariances[4] = M[4] * M[8] + M[5] * M[9] + M[6] * M[10];
        covariances[5] = M[8] * M[8] + M[9] * M[9] + M[10] * M[10];
        // normalize covA, covB
        let factor = -10000;
        for (let covIndex = 0; covIndex < 6; covIndex++) {
            factor = Math.max(factor, Math.abs(covariances[covIndex]));
        }
        this._splatPositions[4 * index + 3] = factor;
        const transform = factor;
        covA[index * 4 + 0] = ToHalfFloat(covariances[0] / transform);
        covA[index * 4 + 1] = ToHalfFloat(covariances[1] / transform);
        covA[index * 4 + 2] = ToHalfFloat(covariances[2] / transform);
        covA[index * 4 + 3] = ToHalfFloat(covariances[3] / transform);
        covB[index * covBSItemSize + 0] = ToHalfFloat(covariances[4] / transform);
        covB[index * covBSItemSize + 1] = ToHalfFloat(covariances[5] / transform);
        // colors
        colorArray[index * 4 + 0] = uBuffer[32 * index + 24 + 0];
        colorArray[index * 4 + 1] = uBuffer[32 * index + 24 + 1];
        colorArray[index * 4 + 2] = uBuffer[32 * index + 24 + 2];
        colorArray[index * 4 + 3] = uBuffer[32 * index + 24 + 3];
    }
    _updateTextures(covA, covB, colorArray, sh) {
        const textureSize = this._getTextureSize(this._vertexCount);
        // Update the textures
        const createTextureFromData = (data, width, height, format) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, 2, 1);
        };
        const createTextureFromDataU8 = (data, width, height, format) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, 2, 0);
        };
        const createTextureFromDataU32 = (data, width, height, format) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, 1, 7);
        };
        const createTextureFromDataF16 = (data, width, height, format) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, 2, 2);
        };
        if (this._covariancesATexture) {
            this._delayedTextureUpdate = { covA: covA, covB: covB, colors: colorArray, centers: this._splatPositions, sh: sh };
            const positions = Float32Array.from(this._splatPositions);
            const vertexCount = this._vertexCount;
            this._worker.postMessage({ positions, vertexCount }, [positions.buffer]);
            this._postToWorker(true);
        }
        else {
            this._covariancesATexture = createTextureFromDataF16(covA, textureSize.x, textureSize.y, 5);
            this._covariancesBTexture = createTextureFromDataF16(covB, textureSize.x, textureSize.y, this._useRGBACovariants ? 5 : 7);
            this._centersTexture = createTextureFromData(this._splatPositions, textureSize.x, textureSize.y, 5);
            this._colorsTexture = createTextureFromDataU8(colorArray, textureSize.x, textureSize.y, 5);
            if (sh) {
                this._shTextures = [];
                sh.forEach((shData) => {
                    const buffer = new Uint32Array(shData.buffer);
                    const shTexture = createTextureFromDataU32(buffer, textureSize.x, textureSize.y, 11);
                    shTexture.wrapU = 0;
                    shTexture.wrapV = 0;
                    this._shTextures.push(shTexture);
                });
            }
            this._instanciateWorker();
        }
    }
    *_updateData(data, isAsync, sh) {
        // if a covariance texture is present, then it's not a creation but an update
        if (!this._covariancesATexture) {
            this._readyToDisplay = false;
        }
        // Parse the data
        const uBuffer = new Uint8Array(data);
        const fBuffer = new Float32Array(uBuffer.buffer);
        if (this._keepInRam) {
            this._splatsData = data;
            if (sh) {
                this._sh = sh;
            }
        }
        const vertexCount = uBuffer.length / GaussianSplattingMesh._RowOutputLength;
        if (vertexCount != this._vertexCount) {
            this._updateSplatIndexBuffer(vertexCount);
        }
        this._vertexCount = vertexCount;
        // degree == 1 for 1 texture (3 terms), 2 for 2 textures(8 terms) and 3 for 3 textures (15 terms)
        this._shDegree = sh ? sh.length : 0;
        const textureSize = this._getTextureSize(vertexCount);
        const textureLength = textureSize.x * textureSize.y;
        const lineCountUpdate = GaussianSplattingMesh.ProgressiveUpdateAmount ?? textureSize.y;
        const textureLengthPerUpdate = textureSize.x * lineCountUpdate;
        this._splatPositions = new Float32Array(4 * textureLength);
        const covA = new Uint16Array(textureLength * 4);
        const covB = new Uint16Array((this._useRGBACovariants ? 4 : 2) * textureLength);
        const colorArray = new Uint8Array(textureLength * 4);
        const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        if (GaussianSplattingMesh.ProgressiveUpdateAmount) {
            // create textures with not filled-yet array, then update directly portions of it
            this._updateTextures(covA, covB, colorArray, sh);
            this.setEnabled(true);
            const partCount = Math.ceil(textureSize.y / lineCountUpdate);
            for (let partIndex = 0; partIndex < partCount; partIndex++) {
                const updateLine = partIndex * lineCountUpdate;
                const splatIndexBase = updateLine * textureSize.x;
                for (let i = 0; i < textureLengthPerUpdate; i++) {
                    this._makeSplat(splatIndexBase + i, fBuffer, uBuffer, covA, covB, colorArray, minimum, maximum);
                }
                this._updateSubTextures(this._splatPositions, covA, covB, colorArray, updateLine, Math.min(lineCountUpdate, textureSize.y - updateLine));
                // Update the binfo
                this.getBoundingInfo().reConstruct(minimum, maximum, this.getWorldMatrix());
                if (isAsync) {
                    yield;
                }
            }
            // sort will be dirty here as just finished filled positions will not be sorted
            const positions = Float32Array.from(this._splatPositions);
            const vertexCount = this._vertexCount;
            this._worker.postMessage({ positions, vertexCount }, [positions.buffer]);
            this._sortIsDirty = true;
        }
        else {
            for (let i = 0; i < vertexCount; i++) {
                this._makeSplat(i, fBuffer, uBuffer, covA, covB, colorArray, minimum, maximum);
                if (isAsync && i % GaussianSplattingMesh._SplatBatchSize === 0) {
                    yield;
                }
            }
            // textures
            this._updateTextures(covA, covB, colorArray, sh);
            // Update the binfo
            this.getBoundingInfo().reConstruct(minimum, maximum, this.getWorldMatrix());
            this.setEnabled(true);
        }
        this._postToWorker(true);
    }
    /**
     * Update asynchronously the buffer
     * @param data array buffer containing center, color, orientation and scale of splats
     * @param sh optional array of uint8 array for SH data
     * @returns a promise
     */
    async updateDataAsync(data, sh) {
        return runCoroutineAsync(this._updateData(data, true, sh), createYieldingScheduler());
    }
    /**
     * @experimental
     * Update data from GS (position, orientation, color, scaling)
     * @param data array that contain all the datas
     * @param sh optional array of uint8 array for SH data
     */
    updateData(data, sh) {
        runCoroutineSync(this._updateData(data, false, sh));
    }
    /**
     * Refreshes the bounding info, taking into account all the thin instances defined
     * @returns the current Gaussian Splatting
     */
    refreshBoundingInfo() {
        this.thinInstanceRefreshBoundingInfo(false);
        return this;
    }
    // in case size is different
    _updateSplatIndexBuffer(vertexCount) {
        if (!this._splatIndex || vertexCount > this._splatIndex.length) {
            this._splatIndex = new Float32Array(vertexCount);
            this.thinInstanceSetBuffer("splatIndex", this._splatIndex, 1, false);
        }
        this.forcedInstanceCount = vertexCount;
    }
    _updateSubTextures(centers, covA, covB, colors, lineStart, lineCount, sh) {
        const updateTextureFromData = (texture, data, width, lineStart, lineCount) => {
            this.getEngine().updateTextureData(texture.getInternalTexture(), data, 0, lineStart, width, lineCount, 0, 0, false);
        };
        const textureSize = this._getTextureSize(this._vertexCount);
        const covBSItemSize = this._useRGBACovariants ? 4 : 2;
        const texelStart = lineStart * textureSize.x;
        const texelCount = lineCount * textureSize.x;
        const covAView = new Uint16Array(covA.buffer, texelStart * 4 * Uint16Array.BYTES_PER_ELEMENT, texelCount * 4);
        const covBView = new Uint16Array(covB.buffer, texelStart * covBSItemSize * Uint16Array.BYTES_PER_ELEMENT, texelCount * covBSItemSize);
        const colorsView = new Uint8Array(colors.buffer, texelStart * 4, texelCount * 4);
        const centersView = new Float32Array(centers.buffer, texelStart * 4 * Float32Array.BYTES_PER_ELEMENT, texelCount * 4);
        updateTextureFromData(this._covariancesATexture, covAView, textureSize.x, lineStart, lineCount);
        updateTextureFromData(this._covariancesBTexture, covBView, textureSize.x, lineStart, lineCount);
        updateTextureFromData(this._centersTexture, centersView, textureSize.x, lineStart, lineCount);
        updateTextureFromData(this._colorsTexture, colorsView, textureSize.x, lineStart, lineCount);
        if (sh) {
            for (let i = 0; i < sh.length; i++) {
                const componentCount = 4;
                const shView = new Uint8Array(this._sh[i].buffer, texelStart * componentCount, texelCount * componentCount);
                updateTextureFromData(this._shTextures[i], shView, textureSize.x, lineStart, lineCount);
            }
        }
    }
    _instanciateWorker() {
        if (!this._vertexCount) {
            return;
        }
        this._updateSplatIndexBuffer(this._vertexCount);
        // Start the worker thread
        this._worker?.terminate();
        this._worker = new Worker(URL.createObjectURL(new Blob(["(", GaussianSplattingMesh._CreateWorker.toString(), ")(self)"], {
            type: "application/javascript",
        })));
        this._depthMix = new BigInt64Array(this._vertexCount);
        const positions = Float32Array.from(this._splatPositions);
        const vertexCount = this._vertexCount;
        this._worker.postMessage({ positions, vertexCount }, [positions.buffer]);
        this._worker.onmessage = (e) => {
            this._depthMix = e.data.depthMix;
            const indexMix = new Uint32Array(e.data.depthMix.buffer);
            if (this._splatIndex) {
                for (let j = 0; j < this._vertexCount; j++) {
                    this._splatIndex[j] = indexMix[2 * j];
                }
            }
            if (this._delayedTextureUpdate) {
                const textureSize = this._getTextureSize(vertexCount);
                this._updateSubTextures(this._delayedTextureUpdate.centers, this._delayedTextureUpdate.covA, this._delayedTextureUpdate.covB, this._delayedTextureUpdate.colors, 0, textureSize.y, this._delayedTextureUpdate.sh);
                this._delayedTextureUpdate = null;
            }
            this.thinInstanceBufferUpdated("splatIndex");
            this._canPostToWorker = true;
            this._readyToDisplay = true;
            // sort is dirty when GS is visible for progressive update with a this message arriving but positions were partially filled
            // another update needs to be kicked. The kick can't happen just when the position buffer is ready because _canPostToWorker might be false.
            if (this._sortIsDirty) {
                this._postToWorker(true);
                this._sortIsDirty = false;
            }
        };
    }
    _getTextureSize(length) {
        const engine = this._scene.getEngine();
        const width = engine.getCaps().maxTextureSize;
        let height = 1;
        if (engine.version === 1 && !engine.isWebGPU) {
            while (width * height < length) {
                height *= 2;
            }
        }
        else {
            height = Math.ceil(length / width);
        }
        if (height > width) {
            Logger.Error("GaussianSplatting texture size: (" + width + ", " + height + "), maxTextureSize: " + width);
            height = width;
        }
        return new Vector2(width, height);
    }
}
GaussianSplattingMesh._RowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // Vector3 position, Vector3 scale, 1 u8 quaternion, 1 color with alpha
GaussianSplattingMesh._SH_C0 = 0.28209479177387814;
// batch size between 2 yield calls. This value is a tradeoff between updates overhead and framerate hiccups
// This step is faster the PLY conversion. So batch size can be bigger
GaussianSplattingMesh._SplatBatchSize = 327680;
// batch size between 2 yield calls during the PLY to splat conversion.
GaussianSplattingMesh._PlyConversionBatchSize = 32768;
/**
 * Set the number of batch (a batch is 16384 splats) after which a display update is performed
 * A value of 0 (default) means display update will not happens before splat is ready.
 */
GaussianSplattingMesh.ProgressiveUpdateAmount = 0;
GaussianSplattingMesh._CreateWorker = function (self) {
    let vertexCount = 0;
    let positions;
    let depthMix;
    let indices;
    let floatMix;
    self.onmessage = (e) => {
        // updated on init
        if (e.data.positions) {
            positions = e.data.positions;
            vertexCount = e.data.vertexCount;
        }
        // udpate on view changed
        else {
            const viewProj = e.data.view;
            if (!positions || !viewProj) {
                // Sanity check, it shouldn't happen!
                throw new Error("positions or view is not defined!");
            }
            depthMix = e.data.depthMix;
            indices = new Uint32Array(depthMix.buffer);
            floatMix = new Float32Array(depthMix.buffer);
            // Sort
            for (let j = 0; j < vertexCount; j++) {
                indices[2 * j] = j;
            }
            let depthFactor = -1;
            if (e.data.useRightHandedSystem) {
                depthFactor = 1;
            }
            for (let j = 0; j < vertexCount; j++) {
                floatMix[2 * j + 1] = 10000 + (viewProj[2] * positions[4 * j + 0] + viewProj[6] * positions[4 * j + 1] + viewProj[10] * positions[4 * j + 2]) * depthFactor;
            }
            depthMix.sort();
            self.postMessage({ depthMix }, [depthMix.buffer]);
        }
    };
};
//# sourceMappingURL=gaussianSplattingMesh.js.map