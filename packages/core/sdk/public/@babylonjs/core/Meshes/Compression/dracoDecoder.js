import { _IsConfigurationAvailable, DracoCodec } from "./dracoCodec.js";
import { Tools } from "../../Misc/tools.js";
import { Geometry } from "../geometry.js";
import { VertexBuffer } from "../buffer.js";
import { Logger } from "../../Misc/logger.js";
import { DecodeMesh, DecoderWorkerFunction } from "./dracoCompressionWorker.js";
/**
 * @experimental This class is an experimental version of `DracoCompression` and is subject to change.
 *
 * Draco Decoder (https://google.github.io/draco/)
 *
 * This class wraps the Draco decoder module.
 *
 * By default, the configuration points to a copy of the Draco decoder files for glTF from the Babylon.js cdn https://cdn.babylonjs.com/draco_wasm_wrapper_gltf.js.
 *
 * To update the configuration, use the following code:
 * ```javascript
 *     DracoDecoder.DefaultConfiguration = {
 *          wasmUrl: "<url to the WebAssembly library>",
 *          wasmBinaryUrl: "<url to the WebAssembly binary>",
 *          fallbackUrl: "<url to the fallback JavaScript library>",
 *     };
 * ```
 *
 * Draco has two versions, one for WebAssembly and one for JavaScript. The decoder configuration can be set to only support WebAssembly or only support the JavaScript version.
 * Decoding will automatically fallback to the JavaScript version if WebAssembly version is not configured or if WebAssembly is not supported by the browser.
 * Use `DracoDecoder.DefaultAvailable` to determine if the decoder configuration is available for the current context.
 *
 * To decode Draco compressed data, get the default DracoDecoder object and call decodeMeshToGeometryAsync:
 * ```javascript
 *     var geometry = await DracoDecoder.Default.decodeMeshToGeometryAsync(data);
 * ```
 */
export class DracoDecoder extends DracoCodec {
    /**
     * Returns true if the decoder's `DefaultConfiguration` is available.
     */
    static get DefaultAvailable() {
        return _IsConfigurationAvailable(DracoDecoder.DefaultConfiguration);
    }
    /**
     * Default instance for the DracoDecoder.
     */
    static get Default() {
        DracoDecoder._Default ?? (DracoDecoder._Default = new DracoDecoder());
        return DracoDecoder._Default;
    }
    /**
     * Reset the default DracoDecoder object to null and disposing the removed default instance.
     * Note that if the workerPool is a member of the static DefaultConfiguration object it is recommended not to run dispose,
     * unless the static worker pool is no longer needed.
     * @param skipDispose set to true to not dispose the removed default instance
     */
    static ResetDefault(skipDispose) {
        if (DracoDecoder._Default) {
            if (!skipDispose) {
                DracoDecoder._Default.dispose();
            }
            DracoDecoder._Default = null;
        }
    }
    _isModuleAvailable() {
        return typeof DracoDecoderModule !== "undefined";
    }
    async _createModuleAsync(wasmBinary, jsModule /** DracoDecoderModule */) {
        const module = await (jsModule || DracoDecoderModule)({ wasmBinary });
        return { module };
    }
    _getWorkerContent() {
        return `${DecodeMesh}(${DecoderWorkerFunction})()`;
    }
    /**
     * Creates a new Draco decoder.
     * @param configuration Optional override of the configuration for the DracoDecoder. If not provided, defaults to {@link DracoDecoder.DefaultConfiguration}.
     */
    constructor(configuration = DracoDecoder.DefaultConfiguration) {
        super(configuration);
    }
    /**
     * Decode Draco compressed mesh data to mesh data.
     * @param data The ArrayBuffer or ArrayBufferView of the compressed Draco data
     * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
     * @param gltfNormalizedOverride A map of attributes from vertex buffer kinds to normalized flags to override the Draco normalization
     * @returns A promise that resolves with the decoded mesh data
     */
    decodeMeshToMeshDataAsync(data, attributes, gltfNormalizedOverride) {
        const dataView = data instanceof ArrayBuffer ? new Int8Array(data) : new Int8Array(data.buffer, data.byteOffset, data.byteLength);
        const applyGltfNormalizedOverride = (kind, normalized) => {
            if (gltfNormalizedOverride && gltfNormalizedOverride[kind] !== undefined) {
                if (normalized !== gltfNormalizedOverride[kind]) {
                    Logger.Warn(`Normalized flag from Draco data (${normalized}) does not match normalized flag from glTF accessor (${gltfNormalizedOverride[kind]}). Using flag from glTF accessor.`);
                }
                return gltfNormalizedOverride[kind];
            }
            else {
                return normalized;
            }
        };
        if (this._workerPoolPromise) {
            return this._workerPoolPromise.then((workerPool) => {
                return new Promise((resolve, reject) => {
                    workerPool.push((worker, onComplete) => {
                        let resultIndices = null;
                        const resultAttributes = [];
                        const onError = (error) => {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(error);
                            onComplete();
                        };
                        const onMessage = (event) => {
                            const message = event.data;
                            switch (message.id) {
                                case "indices": {
                                    resultIndices = message.data;
                                    break;
                                }
                                case "attribute": {
                                    resultAttributes.push({
                                        kind: message.kind,
                                        data: message.data,
                                        size: message.size,
                                        byteOffset: message.byteOffset,
                                        byteStride: message.byteStride,
                                        normalized: applyGltfNormalizedOverride(message.kind, message.normalized),
                                    });
                                    break;
                                }
                                case "decodeMeshDone": {
                                    worker.removeEventListener("error", onError);
                                    worker.removeEventListener("message", onMessage);
                                    resolve({ indices: resultIndices, attributes: resultAttributes, totalVertices: message.totalVertices });
                                    onComplete();
                                    break;
                                }
                            }
                        };
                        worker.addEventListener("error", onError);
                        worker.addEventListener("message", onMessage);
                        const dataViewCopy = dataView.slice();
                        worker.postMessage({ id: "decodeMesh", dataView: dataViewCopy, attributes: attributes }, [dataViewCopy.buffer]);
                    });
                });
            });
        }
        if (this._modulePromise) {
            return this._modulePromise.then((decoder) => {
                let resultIndices = null;
                const resultAttributes = [];
                const numPoints = DecodeMesh(decoder.module, dataView, attributes, (indices) => {
                    resultIndices = indices;
                }, (kind, data, size, byteOffset, byteStride, normalized) => {
                    resultAttributes.push({
                        kind,
                        data,
                        size,
                        byteOffset,
                        byteStride,
                        normalized,
                    });
                });
                return { indices: resultIndices, attributes: resultAttributes, totalVertices: numPoints };
            });
        }
        throw new Error("Draco decoder module is not available");
    }
    /**
     * Decode Draco compressed mesh data to Babylon geometry.
     * @param name The name to use when creating the geometry
     * @param scene The scene to use when creating the geometry
     * @param data The ArrayBuffer or ArrayBufferView of the Draco compressed data
     * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
     * @returns A promise that resolves with the decoded geometry
     */
    async decodeMeshToGeometryAsync(name, scene, data, attributes) {
        const meshData = await this.decodeMeshToMeshDataAsync(data, attributes);
        const geometry = new Geometry(name, scene);
        if (meshData.indices) {
            geometry.setIndices(meshData.indices);
        }
        for (const attribute of meshData.attributes) {
            geometry.setVerticesBuffer(new VertexBuffer(scene.getEngine(), attribute.data, attribute.kind, false, undefined, attribute.byteStride, undefined, attribute.byteOffset, attribute.size, undefined, attribute.normalized, true), meshData.totalVertices);
        }
        return geometry;
    }
    /** @internal */
    async _decodeMeshToGeometryForGltfAsync(name, scene, data, attributes, gltfNormalizedOverride, boundingInfo) {
        const meshData = await this.decodeMeshToMeshDataAsync(data, attributes, gltfNormalizedOverride);
        const geometry = new Geometry(name, scene);
        if (boundingInfo) {
            geometry._boundingInfo = boundingInfo;
            geometry.useBoundingInfoFromGeometry = true;
        }
        if (meshData.indices) {
            geometry.setIndices(meshData.indices);
        }
        for (const attribute of meshData.attributes) {
            geometry.setVerticesBuffer(new VertexBuffer(scene.getEngine(), attribute.data, attribute.kind, false, undefined, attribute.byteStride, undefined, attribute.byteOffset, attribute.size, undefined, attribute.normalized, true), meshData.totalVertices);
        }
        return geometry;
    }
}
/**
 * Default configuration for the DracoDecoder. Defaults to the following:
 * - numWorkers: 50% of the available logical processors, capped to 4. If no logical processors are available, defaults to 1.
 * - wasmUrl: `"https://cdn.babylonjs.com/draco_wasm_wrapper_gltf.js"`
 * - wasmBinaryUrl: `"https://cdn.babylonjs.com/draco_decoder_gltf.wasm"`
 * - fallbackUrl: `"https://cdn.babylonjs.com/draco_decoder_gltf.js"`
 */
DracoDecoder.DefaultConfiguration = {
    wasmUrl: `${Tools._DefaultCdnUrl}/draco_wasm_wrapper_gltf.js`,
    wasmBinaryUrl: `${Tools._DefaultCdnUrl}/draco_decoder_gltf.wasm`,
    fallbackUrl: `${Tools._DefaultCdnUrl}/draco_decoder_gltf.js`,
};
DracoDecoder._Default = null;
//# sourceMappingURL=dracoDecoder.js.map