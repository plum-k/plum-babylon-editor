import { registerSceneLoaderPlugin } from "@babylonjs/core/Loading/sceneLoader.js";
import { SPLATFileLoaderMetadata } from "./splatFileLoader.metadata.js";
import { GaussianSplattingMesh } from "@babylonjs/core/Meshes/GaussianSplatting/gaussianSplattingMesh.js";
import { AssetContainer } from "@babylonjs/core/assetContainer.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { PointsCloudSystem } from "@babylonjs/core/Particles/pointsCloudSystem.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import { Scalar } from "@babylonjs/core/Maths/math.scalar.js";
/**
 * Indicator of the parsed ply buffer. A standard ready to use splat or an array of positions for a point cloud
 */
var Mode;
(function (Mode) {
    Mode[Mode["Splat"] = 0] = "Splat";
    Mode[Mode["PointCloud"] = 1] = "PointCloud";
    Mode[Mode["Mesh"] = 2] = "Mesh";
    Mode[Mode["Reject"] = 3] = "Reject";
})(Mode || (Mode = {}));
/**
 * @experimental
 * SPLAT file type loader.
 * This is a babylon scene loader plugin.
 */
export class SPLATFileLoader {
    /**
     * Creates loader for gaussian splatting files
     * @param loadingOptions options for loading and parsing splat and PLY files.
     */
    constructor(loadingOptions = SPLATFileLoader._DefaultLoadingOptions) {
        /**
         * Defines the name of the plugin.
         */
        this.name = SPLATFileLoaderMetadata.name;
        this._assetContainer = null;
        /**
         * Defines the extensions the splat loader is able to load.
         * force data to come in as an ArrayBuffer
         */
        this.extensions = SPLATFileLoaderMetadata.extensions;
        this._loadingOptions = loadingOptions;
    }
    /** @internal */
    createPlugin(options) {
        return new SPLATFileLoader(options[SPLATFileLoaderMetadata.name]);
    }
    /**
     * Imports  from the loaded gaussian splatting data and adds them to the scene
     * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param data the gaussian splatting data to load
     * @param rootUrl root url to load from
     * @param onProgress callback called while file is loading
     * @param fileName Defines the name of the file to load
     * @returns a promise containing the loaded meshes, particles, skeletons and animations
     */
    async importMeshAsync(meshesNames, scene, data, rootUrl, onProgress, fileName) {
        return this._parse(meshesNames, scene, data, rootUrl).then((meshes) => {
            return {
                meshes: meshes,
                particleSystems: [],
                skeletons: [],
                animationGroups: [],
                transformNodes: [],
                geometries: [],
                lights: [],
                spriteManagers: [],
            };
        });
    }
    static _BuildPointCloud(pointcloud, data) {
        if (!data.byteLength) {
            return false;
        }
        const uBuffer = new Uint8Array(data);
        const fBuffer = new Float32Array(data);
        // parsed array contains room for position(3floats), normal(3floats), color (4b), quantized quaternion (4b)
        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const vertexCount = uBuffer.length / rowLength;
        const pointcloudfunc = function (particle, i) {
            const x = fBuffer[8 * i + 0];
            const y = fBuffer[8 * i + 1];
            const z = fBuffer[8 * i + 2];
            particle.position = new Vector3(x, y, z);
            const r = uBuffer[rowLength * i + 24 + 0] / 255;
            const g = uBuffer[rowLength * i + 24 + 1] / 255;
            const b = uBuffer[rowLength * i + 24 + 2] / 255;
            particle.color = new Color4(r, g, b, 1);
        };
        pointcloud.addPoints(vertexCount, pointcloudfunc);
        return true;
    }
    static _BuildMesh(scene, parsedPLY) {
        const mesh = new Mesh("PLYMesh", scene);
        const uBuffer = new Uint8Array(parsedPLY.data);
        const fBuffer = new Float32Array(parsedPLY.data);
        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const vertexCount = uBuffer.length / rowLength;
        const positions = [];
        const vertexData = new VertexData();
        for (let i = 0; i < vertexCount; i++) {
            const x = fBuffer[8 * i + 0];
            const y = fBuffer[8 * i + 1];
            const z = fBuffer[8 * i + 2];
            positions.push(x, y, z);
        }
        if (parsedPLY.hasVertexColors) {
            const colors = new Float32Array(vertexCount * 4);
            for (let i = 0; i < vertexCount; i++) {
                const r = uBuffer[rowLength * i + 24 + 0] / 255;
                const g = uBuffer[rowLength * i + 24 + 1] / 255;
                const b = uBuffer[rowLength * i + 24 + 2] / 255;
                colors[i * 4 + 0] = r;
                colors[i * 4 + 1] = g;
                colors[i * 4 + 2] = b;
                colors[i * 4 + 3] = 1;
            }
            vertexData.colors = colors;
        }
        vertexData.positions = positions;
        vertexData.indices = parsedPLY.faces;
        vertexData.applyToMesh(mesh);
        return mesh;
    }
    _parseSPZ(data, scene) {
        const ubuf = new Uint8Array(data);
        const ubufu32 = new Uint32Array(data);
        // debug infos
        const splatCount = ubufu32[2];
        const shDegree = ubuf[12];
        const fractionalBits = ubuf[13];
        //const flags = ubuf[14];
        const reserved = ubuf[15];
        // check magic and version
        if (reserved || ubufu32[0] != 0x5053474e || ubufu32[1] != 2) {
            // reserved must be 0
            return new Promise((resolve) => {
                resolve({ mode: 3 /* Mode.Reject */, data: buffer, hasVertexColors: false });
            });
        }
        const rowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // 32
        const buffer = new ArrayBuffer(rowOutputLength * splatCount);
        const positionScale = 1.0 / (1 << fractionalBits);
        const int32View = new Int32Array(1);
        const uint8View = new Uint8Array(int32View.buffer);
        const read24bComponent = function (u8, offset) {
            uint8View[0] = u8[offset + 0];
            uint8View[1] = u8[offset + 1];
            uint8View[2] = u8[offset + 2];
            uint8View[3] = u8[offset + 2] & 0x80 ? 0xff : 0x00;
            return int32View[0] * positionScale;
        };
        let byteOffset = 16;
        const position = new Float32Array(buffer);
        const scale = new Float32Array(buffer);
        const rgba = new Uint8ClampedArray(buffer);
        const rot = new Uint8ClampedArray(buffer);
        // positions
        for (let i = 0; i < splatCount; i++) {
            position[i * 8 + 0] = read24bComponent(ubuf, byteOffset + 0);
            position[i * 8 + 1] = read24bComponent(ubuf, byteOffset + 3);
            position[i * 8 + 2] = read24bComponent(ubuf, byteOffset + 6);
            byteOffset += 9;
        }
        // colors
        const SH_C0 = 0.282;
        for (let i = 0; i < splatCount; i++) {
            for (let component = 0; component < 3; component++) {
                const byteValue = ubuf[byteOffset + splatCount + i * 3 + component];
                // 0.15 is hard coded value from spz
                // Scale factor for DC color components. To convert to RGB, we should multiply by 0.282, but it can
                // be useful to represent base colors that are out of range if the higher spherical harmonics bands
                // bring them back into range so we multiply by a smaller value.
                const value = (byteValue - 127.5) / (0.15 * 255);
                rgba[i * 32 + 24 + component] = Scalar.Clamp((0.5 + SH_C0 * value) * 255, 0, 255);
            }
            rgba[i * 32 + 24 + 3] = ubuf[byteOffset + i];
        }
        byteOffset += splatCount * 4;
        // scales
        for (let i = 0; i < splatCount; i++) {
            scale[i * 8 + 3 + 0] = Math.exp(ubuf[byteOffset + 0] / 16.0 - 10.0);
            scale[i * 8 + 3 + 1] = Math.exp(ubuf[byteOffset + 1] / 16.0 - 10.0);
            scale[i * 8 + 3 + 2] = Math.exp(ubuf[byteOffset + 2] / 16.0 - 10.0);
            byteOffset += 3;
        }
        // convert quaternion
        for (let i = 0; i < splatCount; i++) {
            const x = ubuf[byteOffset + 0];
            const y = ubuf[byteOffset + 1];
            const z = ubuf[byteOffset + 2];
            const nx = x / 127.5 - 1;
            const ny = y / 127.5 - 1;
            const nz = z / 127.5 - 1;
            rot[i * 32 + 28 + 1] = x;
            rot[i * 32 + 28 + 2] = y;
            rot[i * 32 + 28 + 3] = z;
            const v = 1 - (nx * nx + ny * ny + nz * nz);
            rot[i * 32 + 28 + 0] = 127.5 + Math.sqrt(v < 0 ? 0 : v) * 127.5;
            byteOffset += 3;
        }
        //SH
        if (shDegree) {
            // shVectorCount is : 3 for dim = 1, 8 for dim = 2 and 15 for dim = 3
            // number of vec3 vector needed per splat
            const shVectorCount = (shDegree + 1) * (shDegree + 1) - 1; // minus 1 because sh0 is color
            // number of component values : 3 per vector3 (45)
            const shComponentCount = shVectorCount * 3;
            const textureCount = Math.ceil(shComponentCount / 16); // 4 components can be stored per texture, 4 sh per component
            let shIndexRead = byteOffset;
            // sh is an array of uint8array that will be used to create sh textures
            const sh = [];
            const engine = scene.getEngine();
            const width = engine.getCaps().maxTextureSize;
            const height = Math.ceil(splatCount / width);
            // create array for the number of textures needed.
            for (let textureIndex = 0; textureIndex < textureCount; textureIndex++) {
                const texture = new Uint8Array(height * width * 4 * 4); // 4 components per texture, 4 sh per component
                sh.push(texture);
            }
            for (let i = 0; i < splatCount; i++) {
                for (let shIndexWrite = 0; shIndexWrite < shComponentCount; shIndexWrite++) {
                    const shValue = ubuf[shIndexRead++];
                    const textureIndex = Math.floor(shIndexWrite / 16);
                    const shArray = sh[textureIndex];
                    const byteIndexInTexture = shIndexWrite % 16; // [0..15]
                    const offsetPerSplat = i * 16; // 16 sh values per texture per splat.
                    shArray[byteIndexInTexture + offsetPerSplat] = shValue;
                }
            }
            return new Promise((resolve) => {
                resolve({ mode: 0 /* Mode.Splat */, data: buffer, hasVertexColors: false, sh: sh });
            });
        }
        return new Promise((resolve) => {
            resolve({ mode: 0 /* Mode.Splat */, data: buffer, hasVertexColors: false });
        });
    }
    _parse(meshesNames, scene, data, rootUrl) {
        const babylonMeshesArray = []; //The mesh for babylon
        const readableStream = new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array(data)); // Enqueue the ArrayBuffer as a Uint8Array
                controller.close();
            },
        });
        // Use GZip DecompressionStream
        const decompressionStream = new DecompressionStream("gzip");
        const decompressedStream = readableStream.pipeThrough(decompressionStream);
        return new Promise((resolve) => {
            new Response(decompressedStream)
                .arrayBuffer()
                .then((buffer) => {
                this._parseSPZ(buffer, scene).then((parsedSPZ) => {
                    const gaussianSplatting = new GaussianSplattingMesh("GaussianSplatting", null, scene, this._loadingOptions.keepInRam);
                    gaussianSplatting._parentContainer = this._assetContainer;
                    babylonMeshesArray.push(gaussianSplatting);
                    gaussianSplatting.updateData(parsedSPZ.data, parsedSPZ.sh);
                });
                resolve(babylonMeshesArray);
            })
                .catch(() => {
                // Catch any decompression errors
                SPLATFileLoader._ConvertPLYToSplat(data).then(async (parsedPLY) => {
                    switch (parsedPLY.mode) {
                        case 0 /* Mode.Splat */:
                            {
                                const gaussianSplatting = new GaussianSplattingMesh("GaussianSplatting", null, scene, this._loadingOptions.keepInRam);
                                gaussianSplatting._parentContainer = this._assetContainer;
                                babylonMeshesArray.push(gaussianSplatting);
                                gaussianSplatting.updateData(parsedPLY.data);
                            }
                            break;
                        case 1 /* Mode.PointCloud */:
                            {
                                const pointcloud = new PointsCloudSystem("PointCloud", 1, scene);
                                if (SPLATFileLoader._BuildPointCloud(pointcloud, parsedPLY.data)) {
                                    await pointcloud.buildMeshAsync().then((mesh) => {
                                        babylonMeshesArray.push(mesh);
                                    });
                                }
                                else {
                                    pointcloud.dispose();
                                }
                            }
                            break;
                        case 2 /* Mode.Mesh */:
                            {
                                if (parsedPLY.faces) {
                                    babylonMeshesArray.push(SPLATFileLoader._BuildMesh(scene, parsedPLY));
                                }
                                else {
                                    throw new Error("PLY mesh doesn't contain face informations.");
                                }
                            }
                            break;
                        default:
                            throw new Error("Unsupported Splat mode");
                    }
                    resolve(babylonMeshesArray);
                });
            });
        });
    }
    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @returns The loaded asset container
     */
    loadAssetContainerAsync(scene, data, rootUrl) {
        const container = new AssetContainer(scene);
        this._assetContainer = container;
        return this.importMeshAsync(null, scene, data, rootUrl)
            .then((result) => {
            result.meshes.forEach((mesh) => container.meshes.push(mesh));
            // mesh material will be null before 1st rendered frame.
            this._assetContainer = null;
            return container;
        })
            .catch((ex) => {
            this._assetContainer = null;
            throw ex;
        });
    }
    /**
     * Imports all objects from the loaded OBJ data and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data the OBJ data to load
     * @param rootUrl root url to load from
     * @returns a promise which completes when objects have been loaded to the scene
     */
    loadAsync(scene, data, rootUrl) {
        //Get the 3D model
        return this.importMeshAsync(null, scene, data, rootUrl).then(() => {
            // return void
        });
    }
    /**
     * Code from https://github.com/dylanebert/gsplat.js/blob/main/src/loaders/PLYLoader.ts Under MIT license
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer
     */
    static _ConvertPLYToSplat(data) {
        const ubuf = new Uint8Array(data);
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const headerEnd = "end_header\n";
        const headerEndIndex = header.indexOf(headerEnd);
        if (headerEndIndex < 0 || !header) {
            // standard splat
            return new Promise((resolve) => {
                resolve({ mode: 0 /* Mode.Splat */, data: data });
            });
        }
        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)[1]);
        const faceElement = /element face (\d+)\n/.exec(header);
        let faceCount = 0;
        if (faceElement) {
            faceCount = parseInt(faceElement[1]);
        }
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
        for (const prop of filtered) {
            if (prop.startsWith("property ")) {
                const [, type, name] = prop.split(" ");
                if (chunkMode == 1 /* ElementMode.Chunk */) {
                    chunkProperties.push({ name, type, offset: rowChunkOffset });
                    rowChunkOffset += offsets[type];
                }
                else if (chunkMode == 0 /* ElementMode.Vertex */) {
                    vertexProperties.push({ name, type, offset: rowVertexOffset });
                    rowVertexOffset += offsets[type];
                }
                if (!offsets[type]) {
                    Logger.Warn(`Unsupported property type: ${type}.`);
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
        const rowVertexLength = rowVertexOffset;
        const rowChunkLength = rowChunkOffset;
        return GaussianSplattingMesh.ConvertPLYWithSHToSplatAsync(data).then((splatsData) => {
            const dataView = new DataView(data, headerEndIndex + headerEnd.length);
            let offset = rowChunkLength * chunkCount + rowVertexLength * vertexCount;
            // faces
            const faces = [];
            if (faceCount) {
                for (let i = 0; i < faceCount; i++) {
                    const faceVertexCount = dataView.getUint8(offset);
                    if (faceVertexCount != 3) {
                        continue; // only support triangles
                    }
                    offset += 1;
                    for (let j = 0; j < faceVertexCount; j++) {
                        const vertexIndex = dataView.getUint32(offset + (2 - j) * 4, true); // change face winding
                        faces.push(vertexIndex);
                    }
                    offset += 12;
                }
            }
            // early exit for chunked/quantized ply
            if (chunkCount) {
                return new Promise((resolve) => {
                    resolve({ mode: 0 /* Mode.Splat */, data: splatsData.buffer, sh: splatsData.sh, faces: faces, hasVertexColors: false });
                });
            }
            // count available properties. if all necessary are present then it's a splat. Otherwise, it's a point cloud
            // if faces are found, then it's a standard mesh
            let propertyCount = 0;
            let propertyColorCount = 0;
            const splatProperties = ["x", "y", "z", "scale_0", "scale_1", "scale_2", "opacity", "rot_0", "rot_1", "rot_2", "rot_3"];
            const splatColorProperties = ["red", "green", "blue", "f_dc_0", "f_dc_1", "f_dc_2"];
            for (let propertyIndex = 0; propertyIndex < vertexProperties.length; propertyIndex++) {
                const property = vertexProperties[propertyIndex];
                if (splatProperties.includes(property.name)) {
                    propertyCount++;
                }
                if (splatColorProperties.includes(property.name)) {
                    propertyColorCount++;
                }
            }
            const hasMandatoryProperties = propertyCount == splatProperties.length && propertyColorCount == 3;
            const currentMode = faceCount ? 2 /* Mode.Mesh */ : hasMandatoryProperties ? 0 /* Mode.Splat */ : 1 /* Mode.PointCloud */;
            // parsed ready ready to be used as a splat
            return new Promise((resolve) => {
                resolve({ mode: currentMode, data: splatsData.buffer, sh: splatsData.sh, faces: faces, hasVertexColors: !!propertyColorCount });
            });
        });
    }
}
SPLATFileLoader._DefaultLoadingOptions = {
    keepInRam: false,
};
// Add this loader into the register plugin
registerSceneLoaderPlugin(new SPLATFileLoader());
//# sourceMappingURL=splatFileLoader.js.map