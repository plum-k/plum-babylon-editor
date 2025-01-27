import { _IsConfigurationAvailable, DracoCodec } from "./dracoCodec.js";
import { EncodeMesh, EncoderWorkerFunction } from "./dracoCompressionWorker.js";
import { Tools } from "../../Misc/tools.js";
import { VertexBuffer } from "../buffer.js";
import { Mesh } from "../mesh.js";
import { Logger } from "../../Misc/logger.js";
import { deepMerge } from "../../Misc/deepMerger.js";
import { AreIndices32Bits } from "../../Buffers/bufferUtils.js";
/**
 * Map the Babylon.js attribute kind to the Draco attribute kind, defined by the `GeometryAttributeType` enum.
 * @internal
 */
function GetDracoAttributeName(kind) {
    if (kind === VertexBuffer.PositionKind) {
        return "POSITION";
    }
    else if (kind === VertexBuffer.NormalKind) {
        return "NORMAL";
    }
    else if (kind === VertexBuffer.ColorKind) {
        return "COLOR";
    }
    else if (kind.startsWith(VertexBuffer.UVKind)) {
        return "TEX_COORD";
    }
    return "GENERIC";
}
/**
 * Get the indices for the geometry, if present. Eventually used as
 * `AddFacesToMesh(mesh: Mesh, numFaces: number, faces: Uint16Array | Uint32Array)`;
 * where `numFaces = indices.length / 3` and `faces = indices`.
 * @internal
 */
function PrepareIndicesForDraco(input) {
    let indices = input.getIndices();
    // Convert number[] and Int32Array types, if needed
    if (indices && !(indices instanceof Uint32Array) && !(indices instanceof Uint16Array)) {
        indices = (AreIndices32Bits(indices, indices.length) ? Uint32Array : Uint16Array).from(indices);
    }
    return indices;
}
/**
 * Get relevant information about the geometry's vertex attributes for Draco encoding. Eventually used for each attribute as
 * `AddFloatAttribute(mesh: Mesh, attribute: number, count: number, itemSize: number, array: TypedArray)`
 * where `attribute = EncoderModule[<dracoAttribute>]`, `itemSize = <size>`, `array = <data>`, and count is the number of position vertices.
 * @internal
 */
function PrepareAttributesForDraco(input, excludedAttributes) {
    const attributes = [];
    for (const kind of input.getVerticesDataKinds()) {
        if (excludedAttributes?.includes(kind)) {
            if (kind === VertexBuffer.PositionKind) {
                throw new Error("Cannot exclude position attribute from Draco encoding.");
            }
            continue;
        }
        // Convert number[] to typed array, if needed
        let data = input.getVerticesData(kind);
        if (!(data instanceof Float32Array)) {
            data = Float32Array.from(data);
        }
        attributes.push({ kind: kind, dracoName: GetDracoAttributeName(kind), size: input.getVertexBuffer(kind).getSize(), data: data });
    }
    return attributes;
}
const DefaultEncoderOptions = {
    decodeSpeed: 5,
    encodeSpeed: 5,
    method: "MESH_EDGEBREAKER_ENCODING",
    quantizationBits: {
        POSITION: 14,
        NORMAL: 10,
        COLOR: 8,
        TEX_COORD: 12,
        GENERIC: 12,
    },
};
/**
 * @experimental This class is subject to change.
 *
 * Draco Encoder (https://google.github.io/draco/)
 *
 * This class wraps the Draco encoder module.
 *
 * By default, the configuration points to a copy of the Draco encoder files from the Babylon.js cdn https://cdn.babylonjs.com/draco_encoder_wasm_wrapper.js.
 *
 * To update the configuration, use the following code:
 * ```javascript
 *     DracoEncoder.DefaultConfiguration = {
 *          wasmUrl: "<url to the WebAssembly library>",
 *          wasmBinaryUrl: "<url to the WebAssembly binary>",
 *          fallbackUrl: "<url to the fallback JavaScript library>",
 *     };
 * ```
 *
 * Draco has two versions, one for WebAssembly and one for JavaScript. The encoder configuration can be set to only support WebAssembly or only support the JavaScript version.
 * Decoding will automatically fallback to the JavaScript version if WebAssembly version is not configured or if WebAssembly is not supported by the browser.
 * Use `DracoEncoder.DefaultAvailable` to determine if the encoder configuration is available for the current context.
 *
 * To encode Draco compressed data, get the default DracoEncoder object and call encodeMeshAsync:
 * ```javascript
 *     var dracoData = await DracoEncoder.Default.encodeMeshAsync(mesh);
 * ```
 *
 * Currently, DracoEncoder only encodes to meshes. Encoding to point clouds is not yet supported.
 *
 * Only position, normal, color, and UV attributes are supported natively by the encoder. All other attributes are treated as generic. This means that,
 * when decoding these generic attributes later, additional information about their original Babylon types will be needed to interpret the data correctly.
 * You can use the return value of `encodeMeshAsync` to source this information, specifically the `attributes` field. E.g.,
 * ```javascript
 *    var dracoData = await DracoEncoder.Default.encodeMeshAsync(mesh);
 *    var meshData = await DracoDecoder.Default.decodeMeshToMeshDataAsync(dracoData.data, dracoData.attributes);
 * ```
 *
 * By default, DracoEncoder will encode all available attributes of the mesh. To exclude specific attributes, use the following code:
 * ```javascript
 *    var options = { excludedAttributes: [VertexBuffer.MatricesIndicesKind, VertexBuffer.MatricesWeightsKind] };
 *    var dracoData = await DracoDecoder.Default.encodeMeshAsync(mesh, options);
 * ```
 */
export class DracoEncoder extends DracoCodec {
    /**
     * Returns true if the encoder's `DefaultConfiguration` is available.
     */
    static get DefaultAvailable() {
        return _IsConfigurationAvailable(DracoEncoder.DefaultConfiguration);
    }
    /**
     * Default instance for the DracoEncoder.
     */
    static get Default() {
        DracoEncoder._Default ?? (DracoEncoder._Default = new DracoEncoder());
        return DracoEncoder._Default;
    }
    /**
     * Reset the default DracoEncoder object to null and disposing the removed default instance.
     * Note that if the workerPool is a member of the static DefaultConfiguration object it is recommended not to run dispose,
     * unless the static worker pool is no longer needed.
     * @param skipDispose set to true to not dispose the removed default instance
     */
    static ResetDefault(skipDispose) {
        if (DracoEncoder._Default) {
            if (!skipDispose) {
                DracoEncoder._Default.dispose();
            }
            DracoEncoder._Default = null;
        }
    }
    _isModuleAvailable() {
        return typeof DracoEncoderModule !== "undefined";
    }
    async _createModuleAsync(wasmBinary, jsModule /** DracoEncoderModule */) {
        const module = await (jsModule || DracoEncoderModule)({ wasmBinary });
        return { module };
    }
    _getWorkerContent() {
        return `${EncodeMesh}(${EncoderWorkerFunction})()`;
    }
    /**
     * Creates a new Draco encoder.
     * @param configuration Optional override of the configuration for the DracoEncoder. If not provided, defaults to {@link DracoEncoder.DefaultConfiguration}.
     */
    constructor(configuration = DracoEncoder.DefaultConfiguration) {
        super(configuration);
    }
    /**
     * @internal
     */
    async _encodeAsync(attributes, indices, options) {
        const mergedOptions = options ? deepMerge(DefaultEncoderOptions, options) : DefaultEncoderOptions;
        if (this._workerPoolPromise) {
            const workerPool = await this._workerPoolPromise;
            return new Promise((resolve, reject) => {
                workerPool.push((worker, onComplete) => {
                    const onError = (error) => {
                        worker.removeEventListener("error", onError);
                        worker.removeEventListener("message", onMessage);
                        reject(error);
                        onComplete();
                    };
                    const onMessage = (message) => {
                        if (message.data.id === "encodeMeshDone") {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            resolve(message.data.encodedMeshData);
                            onComplete();
                        }
                    };
                    worker.addEventListener("error", onError);
                    worker.addEventListener("message", onMessage);
                    // Manually create copies of our attribute data and add them to the transfer list to ensure we only copy the ArrayBuffer data we need.
                    const transferList = [];
                    attributes.forEach((attribute) => {
                        attribute.data = attribute.data.slice();
                        transferList.push(attribute.data.buffer);
                    });
                    if (indices) {
                        indices = indices.slice();
                        transferList.push(indices.buffer);
                    }
                    worker.postMessage({ id: "encodeMesh", attributes: attributes, indices: indices, options: mergedOptions }, transferList);
                });
            });
        }
        if (this._modulePromise) {
            const encoder = await this._modulePromise;
            return EncodeMesh(encoder.module, attributes, indices, mergedOptions);
        }
        throw new Error("Draco encoder module is not available");
    }
    /**
     * Encodes a mesh or geometry into a Draco-encoded mesh data.
     * @param input the mesh or geometry to encode
     * @param options options for the encoding
     * @returns a promise that resolves to the newly-encoded data
     */
    async encodeMeshAsync(input, options) {
        const verticesCount = input.getTotalVertices();
        if (verticesCount == 0) {
            throw new Error("Cannot compress geometry with Draco. There are no vertices.");
        }
        // Prepare parameters for encoding
        if (input instanceof Mesh && input.morphTargetManager && options?.method === "MESH_EDGEBREAKER_ENCODING") {
            Logger.Warn("Cannot use Draco EDGEBREAKER method with morph targets. Falling back to SEQUENTIAL method.");
            options.method = "MESH_SEQUENTIAL_ENCODING";
        }
        const indices = PrepareIndicesForDraco(input);
        const attributes = PrepareAttributesForDraco(input, options?.excludedAttributes);
        return this._encodeAsync(attributes, indices, options);
    }
}
/**
 * Default configuration for the DracoEncoder. Defaults to the following:
 * - numWorkers: 50% of the available logical processors, capped to 4. If no logical processors are available, defaults to 1.
 * - wasmUrl: `"https://cdn.babylonjs.com/draco_encoder_wasm_wrapper.js"`
 * - wasmBinaryUrl: `"https://cdn.babylonjs.com/draco_encoder.wasm"`
 * - fallbackUrl: `"https://cdn.babylonjs.com/draco_encoder.js"`
 */
DracoEncoder.DefaultConfiguration = {
    wasmUrl: `${Tools._DefaultCdnUrl}/draco_encoder_wasm_wrapper.js`,
    wasmBinaryUrl: `${Tools._DefaultCdnUrl}/draco_encoder.wasm`,
    fallbackUrl: `${Tools._DefaultCdnUrl}/draco_encoder.js`,
};
DracoEncoder._Default = null;
//# sourceMappingURL=dracoEncoder.js.map