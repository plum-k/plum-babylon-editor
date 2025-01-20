/**
 * @internal
 */
export function EncodeMesh(module /** EncoderModule */, attributes, indices, options) {
    const encoderModule = module;
    let encoder = null;
    let meshBuilder = null;
    let mesh = null;
    let encodedNativeBuffer = null;
    const attributeIDs = {}; // Babylon kind -> Draco unique id
    // Double-check that at least a position attribute is provided
    const positionAttribute = attributes.find((a) => a.babylonAttribute === "position");
    if (!positionAttribute) {
        throw new Error("Position attribute is required for Draco encoding");
    }
    // If no indices are provided, assume mesh is unindexed. Let's generate them, since Draco meshes require them.
    // TODO: This may be the POINT_CLOUD case, but need to investigate. Should work for now-- just less efficient.
    if (!indices) {
        // Assume position attribute is the largest attribute.
        const positionVerticesCount = positionAttribute.data.length / positionAttribute.size;
        indices = new (positionVerticesCount > 65535 ? Uint32Array : Uint16Array)(positionVerticesCount);
        for (let i = 0; i < positionVerticesCount; i++) {
            indices[i] = i;
        }
    }
    try {
        encoder = new encoderModule.Encoder();
        meshBuilder = new encoderModule.MeshBuilder();
        mesh = new encoderModule.Mesh();
        // Add the faces
        meshBuilder.AddFacesToMesh(mesh, indices.length / 3, indices);
        // Add the attributes
        for (const attribute of attributes) {
            const verticesCount = attribute.data.length / attribute.size;
            attributeIDs[attribute.babylonAttribute] = meshBuilder.AddFloatAttribute(mesh, encoderModule[attribute.dracoAttribute], verticesCount, attribute.size, attribute.data);
            if (options.quantizationBits && options.quantizationBits[attribute.dracoAttribute]) {
                encoder.SetAttributeQuantization(encoderModule[attribute.dracoAttribute], options.quantizationBits[attribute.dracoAttribute]);
            }
        }
        // Set the options
        if (options.method) {
            encoder.SetEncodingMethod(encoderModule[options.method]);
        }
        if (options.encodeSpeed !== undefined && options.decodeSpeed !== undefined) {
            encoder.SetSpeedOptions(options.encodeSpeed, options.decodeSpeed);
        }
        // Encode to native buffer
        encodedNativeBuffer = new encoderModule.DracoInt8Array();
        const encodedLength = encoder.EncodeMeshToDracoBuffer(mesh, encodedNativeBuffer);
        if (encodedLength <= 0) {
            throw new Error("Draco encoding failed.");
        }
        // Copy the native buffer data to worker heap
        const encodedData = new Int8Array(encodedLength);
        for (let i = 0; i < encodedLength; i++) {
            encodedData[i] = encodedNativeBuffer.GetValue(i);
        }
        return { data: encodedData, attributeIDs: attributeIDs };
    }
    finally {
        if (mesh) {
            encoderModule.destroy(mesh);
        }
        if (meshBuilder) {
            encoderModule.destroy(meshBuilder);
        }
        if (encoder) {
            encoderModule.destroy(encoder);
        }
        if (encodedNativeBuffer) {
            encoderModule.destroy(encodedNativeBuffer);
        }
    }
}
/**
 * The worker function that gets converted to a blob url to pass into a worker.
 * To be used if a developer wants to create their own worker instance and inject it instead of using the default worker.
 */
export function EncoderWorkerFunction() {
    let encoderPromise;
    onmessage = (event) => {
        const message = event.data;
        switch (message.id) {
            case "init": {
                // if URL is provided then load the script. Otherwise expect the script to be loaded already
                if (message.url) {
                    importScripts(message.url);
                }
                const initEncoderObject = message.wasmBinary ? { wasmBinary: message.wasmBinary } : {};
                encoderPromise = DracoEncoderModule(initEncoderObject);
                postMessage({ id: "initDone" });
                break;
            }
            case "encodeMesh": {
                if (!encoderPromise) {
                    throw new Error("Draco encoder module is not available");
                }
                encoderPromise.then((encoder) => {
                    const result = EncodeMesh(encoder, message.attributes, message.indices, message.options);
                    postMessage({ id: "encodeMeshDone", encodedMeshData: result }, result ? [result.data.buffer] : undefined);
                });
                break;
            }
        }
    };
}
/**
 * @internal
 */
export function DecodeMesh(module /** DecoderModule */, data, attributeIDs, onIndicesData, onAttributeData) {
    const decoderModule = module;
    let decoder = null;
    let buffer = null;
    let geometry = null;
    try {
        decoder = new decoderModule.Decoder();
        buffer = new decoderModule.DecoderBuffer();
        buffer.Init(data, data.byteLength);
        let status;
        const type = decoder.GetEncodedGeometryType(buffer);
        switch (type) {
            case decoderModule.TRIANGULAR_MESH: {
                const mesh = new decoderModule.Mesh();
                status = decoder.DecodeBufferToMesh(buffer, mesh);
                if (!status.ok() || mesh.ptr === 0) {
                    throw new Error(status.error_msg());
                }
                const numFaces = mesh.num_faces();
                const numIndices = numFaces * 3;
                const byteLength = numIndices * 4;
                const ptr = decoderModule._malloc(byteLength);
                try {
                    decoder.GetTrianglesUInt32Array(mesh, byteLength, ptr);
                    const indices = new Uint32Array(numIndices);
                    indices.set(new Uint32Array(decoderModule.HEAPF32.buffer, ptr, numIndices));
                    onIndicesData(indices);
                }
                finally {
                    decoderModule._free(ptr);
                }
                geometry = mesh;
                break;
            }
            case decoderModule.POINT_CLOUD: {
                const pointCloud = new decoderModule.PointCloud();
                status = decoder.DecodeBufferToPointCloud(buffer, pointCloud);
                if (!status.ok() || !pointCloud.ptr) {
                    throw new Error(status.error_msg());
                }
                geometry = pointCloud;
                break;
            }
            default: {
                throw new Error(`Invalid geometry type ${type}`);
            }
        }
        const numPoints = geometry.num_points();
        const processAttribute = (decoder, geometry, kind, attribute /** Attribute */) => {
            const dataType = attribute.data_type();
            const numComponents = attribute.num_components();
            const normalized = attribute.normalized();
            const byteStride = attribute.byte_stride();
            const byteOffset = attribute.byte_offset();
            const dataTypeInfo = {
                [decoderModule.DT_FLOAT32]: { typedArrayConstructor: Float32Array, heap: decoderModule.HEAPF32 },
                [decoderModule.DT_INT8]: { typedArrayConstructor: Int8Array, heap: decoderModule.HEAP8 },
                [decoderModule.DT_INT16]: { typedArrayConstructor: Int16Array, heap: decoderModule.HEAP16 },
                [decoderModule.DT_INT32]: { typedArrayConstructor: Int32Array, heap: decoderModule.HEAP32 },
                [decoderModule.DT_UINT8]: { typedArrayConstructor: Uint8Array, heap: decoderModule.HEAPU8 },
                [decoderModule.DT_UINT16]: { typedArrayConstructor: Uint16Array, heap: decoderModule.HEAPU16 },
                [decoderModule.DT_UINT32]: { typedArrayConstructor: Uint32Array, heap: decoderModule.HEAPU32 },
            };
            const info = dataTypeInfo[dataType];
            if (!info) {
                throw new Error(`Invalid data type ${dataType}`);
            }
            const numValues = numPoints * numComponents;
            const byteLength = numValues * info.typedArrayConstructor.BYTES_PER_ELEMENT;
            const ptr = decoderModule._malloc(byteLength);
            try {
                decoder.GetAttributeDataArrayForAllPoints(geometry, attribute, dataType, byteLength, ptr);
                // this cast seems to be needed because of an issue with typescript, as all constructors do have the ptr and numValues arguments.
                const data = new info.typedArrayConstructor(info.heap.buffer, ptr, numValues);
                onAttributeData(kind, data.slice(), numComponents, byteOffset, byteStride, normalized);
            }
            finally {
                decoderModule._free(ptr);
            }
        };
        if (attributeIDs) {
            for (const kind in attributeIDs) {
                const id = attributeIDs[kind];
                const attribute = decoder.GetAttributeByUniqueId(geometry, id);
                processAttribute(decoder, geometry, kind, attribute);
            }
        }
        else {
            const dracoAttributeTypes = {
                position: decoderModule.POSITION,
                normal: decoderModule.NORMAL,
                color: decoderModule.COLOR,
                uv: decoderModule.TEX_COORD,
            };
            for (const kind in dracoAttributeTypes) {
                const id = decoder.GetAttributeId(geometry, dracoAttributeTypes[kind]);
                if (id !== -1) {
                    const attribute = decoder.GetAttribute(geometry, id);
                    processAttribute(decoder, geometry, kind, attribute);
                }
            }
        }
        return numPoints;
    }
    finally {
        if (geometry) {
            decoderModule.destroy(geometry);
        }
        if (buffer) {
            decoderModule.destroy(buffer);
        }
        if (decoder) {
            decoderModule.destroy(decoder);
        }
    }
}
/**
 * The worker function that gets converted to a blob url to pass into a worker.
 * To be used if a developer wants to create their own worker instance and inject it instead of using the default worker.
 */
export function DecoderWorkerFunction() {
    let decoderPromise;
    onmessage = (event) => {
        const message = event.data;
        switch (message.id) {
            case "init": {
                // if URL is provided then load the script. Otherwise expect the script to be loaded already
                if (message.url) {
                    importScripts(message.url);
                }
                const initDecoderObject = message.wasmBinary ? { wasmBinary: message.wasmBinary } : {};
                decoderPromise = DracoDecoderModule(initDecoderObject);
                postMessage({ id: "initDone" });
                break;
            }
            case "decodeMesh": {
                if (!decoderPromise) {
                    throw new Error("Draco decoder module is not available");
                }
                decoderPromise.then((decoder) => {
                    const numPoints = DecodeMesh(decoder, message.dataView, message.attributes, (indices) => {
                        postMessage({ id: "indices", data: indices }, [indices.buffer]);
                    }, (kind, data, size, offset, stride, normalized) => {
                        postMessage({ id: "attribute", kind, data, size, byteOffset: offset, byteStride: stride, normalized }, [data.buffer]);
                    });
                    postMessage({ id: "decodeMeshDone", totalVertices: numPoints });
                });
                break;
            }
        }
    };
}
// For backwards compatibility
export { DecoderWorkerFunction as workerFunction };
/**
 * Initializes a worker that was created for the draco agent pool
 * @param worker  The worker to initialize
 * @param wasmBinary The wasm binary to load into the worker
 * @param moduleUrl The url to the draco decoder module (optional)
 * @returns A promise that resolves when the worker is initialized
 */
export function initializeWebWorker(worker, wasmBinary, moduleUrl) {
    return new Promise((resolve, reject) => {
        const onError = (error) => {
            worker.removeEventListener("error", onError);
            worker.removeEventListener("message", onMessage);
            reject(error);
        };
        const onMessage = (event) => {
            if (event.data.id === "initDone") {
                worker.removeEventListener("error", onError);
                worker.removeEventListener("message", onMessage);
                resolve(worker);
            }
        };
        worker.addEventListener("error", onError);
        worker.addEventListener("message", onMessage);
        // Load with either JS-only or WASM version
        if (!wasmBinary) {
            worker.postMessage({
                id: "init",
                url: moduleUrl,
            });
        }
        else {
            // clone the array buffer to make it transferable
            const clone = wasmBinary.slice(0);
            worker.postMessage({
                id: "init",
                url: moduleUrl,
                wasmBinary: clone,
            }, [clone]);
        }
        // note: no transfer list as the ArrayBuffer is shared across main thread and pool workers
    });
}
//# sourceMappingURL=dracoCompressionWorker.js.map