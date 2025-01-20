import { Observable } from "@babylonjs/core/Misc/observable.js";
import { Deferred } from "@babylonjs/core/Misc/deferred.js";
import { GLTFLoader, ArrayItem } from "../glTFLoader.js";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "MSFT_lod";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/MSFT_lod/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class MSFT_lod {
    /**
     * @internal
     */
    constructor(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 100;
        /**
         * Maximum number of LODs to load, starting from the lowest LOD.
         */
        this.maxLODsToLoad = 10;
        /**
         * Observable raised when all node LODs of one level are loaded.
         * The event data is the index of the loaded LOD starting from zero.
         * Dispose the loader to cancel the loading of the next level of LODs.
         */
        this.onNodeLODsLoadedObservable = new Observable();
        /**
         * Observable raised when all material LODs of one level are loaded.
         * The event data is the index of the loaded LOD starting from zero.
         * Dispose the loader to cancel the loading of the next level of LODs.
         */
        this.onMaterialLODsLoadedObservable = new Observable();
        this._bufferLODs = new Array();
        this._nodeIndexLOD = null;
        this._nodeSignalLODs = new Array();
        this._nodePromiseLODs = new Array();
        this._nodeBufferLODs = new Array();
        this._materialIndexLOD = null;
        this._materialSignalLODs = new Array();
        this._materialPromiseLODs = new Array();
        this._materialBufferLODs = new Array();
        this._loader = loader;
        // Options takes precedence. The maxLODsToLoad extension property is retained for back compat.
        // For new extensions, they should only use options.
        this.maxLODsToLoad = this._loader.parent.extensionOptions[NAME]?.maxLODsToLoad ?? this.maxLODsToLoad;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @internal */
    dispose() {
        this._loader = null;
        this._nodeIndexLOD = null;
        this._nodeSignalLODs.length = 0;
        this._nodePromiseLODs.length = 0;
        this._nodeBufferLODs.length = 0;
        this._materialIndexLOD = null;
        this._materialSignalLODs.length = 0;
        this._materialPromiseLODs.length = 0;
        this._materialBufferLODs.length = 0;
        this.onMaterialLODsLoadedObservable.clear();
        this.onNodeLODsLoadedObservable.clear();
    }
    /** @internal */
    onReady() {
        for (let indexLOD = 0; indexLOD < this._nodePromiseLODs.length; indexLOD++) {
            const promise = Promise.all(this._nodePromiseLODs[indexLOD]).then(() => {
                if (indexLOD !== 0) {
                    this._loader.endPerformanceCounter(`Node LOD ${indexLOD}`);
                    this._loader.log(`Loaded node LOD ${indexLOD}`);
                }
                this.onNodeLODsLoadedObservable.notifyObservers(indexLOD);
                if (indexLOD !== this._nodePromiseLODs.length - 1) {
                    this._loader.startPerformanceCounter(`Node LOD ${indexLOD + 1}`);
                    this._loadBufferLOD(this._nodeBufferLODs, indexLOD + 1);
                    if (this._nodeSignalLODs[indexLOD]) {
                        this._nodeSignalLODs[indexLOD].resolve();
                    }
                }
            });
            this._loader._completePromises.push(promise);
        }
        for (let indexLOD = 0; indexLOD < this._materialPromiseLODs.length; indexLOD++) {
            const promise = Promise.all(this._materialPromiseLODs[indexLOD]).then(() => {
                if (indexLOD !== 0) {
                    this._loader.endPerformanceCounter(`Material LOD ${indexLOD}`);
                    this._loader.log(`Loaded material LOD ${indexLOD}`);
                }
                this.onMaterialLODsLoadedObservable.notifyObservers(indexLOD);
                if (indexLOD !== this._materialPromiseLODs.length - 1) {
                    this._loader.startPerformanceCounter(`Material LOD ${indexLOD + 1}`);
                    this._loadBufferLOD(this._materialBufferLODs, indexLOD + 1);
                    if (this._materialSignalLODs[indexLOD]) {
                        this._materialSignalLODs[indexLOD].resolve();
                    }
                }
            });
            this._loader._completePromises.push(promise);
        }
    }
    /**
     * @internal
     */
    loadSceneAsync(context, scene) {
        const promise = this._loader.loadSceneAsync(context, scene);
        this._loadBufferLOD(this._bufferLODs, 0);
        return promise;
    }
    /**
     * @internal
     */
    loadNodeAsync(context, node, assign) {
        return GLTFLoader.LoadExtensionAsync(context, node, this.name, (extensionContext, extension) => {
            let firstPromise;
            const nodeLODs = this._getLODs(extensionContext, node, this._loader.gltf.nodes, extension.ids);
            this._loader.logOpen(`${extensionContext}`);
            for (let indexLOD = 0; indexLOD < nodeLODs.length; indexLOD++) {
                const nodeLOD = nodeLODs[indexLOD];
                if (indexLOD !== 0) {
                    this._nodeIndexLOD = indexLOD;
                    this._nodeSignalLODs[indexLOD] = this._nodeSignalLODs[indexLOD] || new Deferred();
                }
                const assignWrap = (babylonTransformNode) => {
                    assign(babylonTransformNode);
                    babylonTransformNode.setEnabled(false);
                };
                const promise = this._loader.loadNodeAsync(`/nodes/${nodeLOD.index}`, nodeLOD, assignWrap).then((babylonMesh) => {
                    if (indexLOD !== 0) {
                        // TODO: should not rely on _babylonTransformNode
                        const previousNodeLOD = nodeLODs[indexLOD - 1];
                        if (previousNodeLOD._babylonTransformNode) {
                            this._disposeTransformNode(previousNodeLOD._babylonTransformNode);
                            delete previousNodeLOD._babylonTransformNode;
                        }
                    }
                    babylonMesh.setEnabled(true);
                    return babylonMesh;
                });
                this._nodePromiseLODs[indexLOD] = this._nodePromiseLODs[indexLOD] || [];
                if (indexLOD === 0) {
                    firstPromise = promise;
                }
                else {
                    this._nodeIndexLOD = null;
                    this._nodePromiseLODs[indexLOD].push(promise);
                }
            }
            this._loader.logClose();
            return firstPromise;
        });
    }
    /**
     * @internal
     */
    _loadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign) {
        // Don't load material LODs if already loading a node LOD.
        if (this._nodeIndexLOD) {
            return null;
        }
        return GLTFLoader.LoadExtensionAsync(context, material, this.name, (extensionContext, extension) => {
            let firstPromise;
            const materialLODs = this._getLODs(extensionContext, material, this._loader.gltf.materials, extension.ids);
            this._loader.logOpen(`${extensionContext}`);
            for (let indexLOD = 0; indexLOD < materialLODs.length; indexLOD++) {
                const materialLOD = materialLODs[indexLOD];
                if (indexLOD !== 0) {
                    this._materialIndexLOD = indexLOD;
                }
                const promise = this._loader
                    ._loadMaterialAsync(`/materials/${materialLOD.index}`, materialLOD, babylonMesh, babylonDrawMode, (babylonMaterial) => {
                    if (indexLOD === 0) {
                        assign(babylonMaterial);
                    }
                })
                    .then((babylonMaterial) => {
                    if (indexLOD !== 0) {
                        assign(babylonMaterial);
                        // TODO: should not rely on _data
                        const previousDataLOD = materialLODs[indexLOD - 1]._data;
                        if (previousDataLOD[babylonDrawMode]) {
                            this._disposeMaterials([previousDataLOD[babylonDrawMode].babylonMaterial]);
                            delete previousDataLOD[babylonDrawMode];
                        }
                    }
                    return babylonMaterial;
                });
                this._materialPromiseLODs[indexLOD] = this._materialPromiseLODs[indexLOD] || [];
                if (indexLOD === 0) {
                    firstPromise = promise;
                }
                else {
                    this._materialIndexLOD = null;
                    this._materialPromiseLODs[indexLOD].push(promise);
                }
            }
            this._loader.logClose();
            return firstPromise;
        });
    }
    /**
     * @internal
     */
    _loadUriAsync(context, property, uri) {
        // Defer the loading of uris if loading a node or material LOD.
        if (this._nodeIndexLOD !== null) {
            this._loader.log(`deferred`);
            const previousIndexLOD = this._nodeIndexLOD - 1;
            this._nodeSignalLODs[previousIndexLOD] = this._nodeSignalLODs[previousIndexLOD] || new Deferred();
            return this._nodeSignalLODs[this._nodeIndexLOD - 1].promise.then(() => {
                return this._loader.loadUriAsync(context, property, uri);
            });
        }
        else if (this._materialIndexLOD !== null) {
            this._loader.log(`deferred`);
            const previousIndexLOD = this._materialIndexLOD - 1;
            this._materialSignalLODs[previousIndexLOD] = this._materialSignalLODs[previousIndexLOD] || new Deferred();
            return this._materialSignalLODs[previousIndexLOD].promise.then(() => {
                return this._loader.loadUriAsync(context, property, uri);
            });
        }
        return null;
    }
    /**
     * @internal
     */
    loadBufferAsync(context, buffer, byteOffset, byteLength) {
        if (this._loader.parent.useRangeRequests && !buffer.uri) {
            if (!this._loader.bin) {
                throw new Error(`${context}: Uri is missing or the binary glTF is missing its binary chunk`);
            }
            const loadAsync = (bufferLODs, indexLOD) => {
                const start = byteOffset;
                const end = start + byteLength - 1;
                let bufferLOD = bufferLODs[indexLOD];
                if (bufferLOD) {
                    bufferLOD.start = Math.min(bufferLOD.start, start);
                    bufferLOD.end = Math.max(bufferLOD.end, end);
                }
                else {
                    bufferLOD = { start: start, end: end, loaded: new Deferred() };
                    bufferLODs[indexLOD] = bufferLOD;
                }
                return bufferLOD.loaded.promise.then((data) => {
                    return new Uint8Array(data.buffer, data.byteOffset + byteOffset - bufferLOD.start, byteLength);
                });
            };
            this._loader.log(`deferred`);
            if (this._nodeIndexLOD !== null) {
                return loadAsync(this._nodeBufferLODs, this._nodeIndexLOD);
            }
            else if (this._materialIndexLOD !== null) {
                return loadAsync(this._materialBufferLODs, this._materialIndexLOD);
            }
            else {
                return loadAsync(this._bufferLODs, 0);
            }
        }
        return null;
    }
    _loadBufferLOD(bufferLODs, indexLOD) {
        const bufferLOD = bufferLODs[indexLOD];
        if (bufferLOD) {
            this._loader.log(`Loading buffer range [${bufferLOD.start}-${bufferLOD.end}]`);
            this._loader.bin.readAsync(bufferLOD.start, bufferLOD.end - bufferLOD.start + 1).then((data) => {
                bufferLOD.loaded.resolve(data);
            }, (error) => {
                bufferLOD.loaded.reject(error);
            });
        }
    }
    /**
     * @returns an array of LOD properties from lowest to highest.
     * @param context
     * @param property
     * @param array
     * @param ids
     */
    _getLODs(context, property, array, ids) {
        if (this.maxLODsToLoad <= 0) {
            throw new Error("maxLODsToLoad must be greater than zero");
        }
        const properties = [];
        for (let i = ids.length - 1; i >= 0; i--) {
            properties.push(ArrayItem.Get(`${context}/ids/${ids[i]}`, array, ids[i]));
            if (properties.length === this.maxLODsToLoad) {
                return properties;
            }
        }
        properties.push(property);
        return properties;
    }
    _disposeTransformNode(babylonTransformNode) {
        const babylonMaterials = [];
        const babylonMaterial = babylonTransformNode.material;
        if (babylonMaterial) {
            babylonMaterials.push(babylonMaterial);
        }
        for (const babylonMesh of babylonTransformNode.getChildMeshes()) {
            if (babylonMesh.material) {
                babylonMaterials.push(babylonMesh.material);
            }
        }
        babylonTransformNode.dispose();
        const babylonMaterialsToDispose = babylonMaterials.filter((babylonMaterial) => this._loader.babylonScene.meshes.every((mesh) => mesh.material != babylonMaterial));
        this._disposeMaterials(babylonMaterialsToDispose);
    }
    _disposeMaterials(babylonMaterials) {
        const babylonTextures = {};
        for (const babylonMaterial of babylonMaterials) {
            for (const babylonTexture of babylonMaterial.getActiveTextures()) {
                babylonTextures[babylonTexture.uniqueId] = babylonTexture;
            }
            babylonMaterial.dispose();
        }
        for (const uniqueId in babylonTextures) {
            for (const babylonMaterial of this._loader.babylonScene.materials) {
                if (babylonMaterial.hasTexture(babylonTextures[uniqueId])) {
                    delete babylonTextures[uniqueId];
                }
            }
        }
        for (const uniqueId in babylonTextures) {
            babylonTextures[uniqueId].dispose();
        }
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new MSFT_lod(loader));
//# sourceMappingURL=MSFT_lod.js.map