import { GLTFLoader, ArrayItem } from "../glTFLoader.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "KHR_materials_variants";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_variants/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_variants {
    /**
     * @internal
     */
    constructor(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @internal */
    dispose() {
        this._loader = null;
    }
    /**
     * Gets the list of available variant names for this asset.
     * @param rootNode The glTF root node
     * @returns the list of all the variant names for this model
     */
    static GetAvailableVariants(rootNode) {
        const extensionMetadata = this._GetExtensionMetadata(rootNode);
        if (!extensionMetadata) {
            return [];
        }
        return Object.keys(extensionMetadata.variants);
    }
    /**
     * Gets the list of available variant names for this asset.
     * @param rootNode The glTF root node
     * @returns the list of all the variant names for this model
     */
    getAvailableVariants(rootNode) {
        return KHR_materials_variants.GetAvailableVariants(rootNode);
    }
    /**
     * Select a variant given a variant name or a list of variant names.
     * @param rootNode The glTF root node
     * @param variantName The variant name(s) to select.
     */
    static SelectVariant(rootNode, variantName) {
        const extensionMetadata = this._GetExtensionMetadata(rootNode);
        if (!extensionMetadata) {
            throw new Error(`Cannot select variant on a glTF mesh that does not have the ${NAME} extension`);
        }
        const select = (variantName) => {
            const entries = extensionMetadata.variants[variantName];
            if (entries) {
                for (const entry of entries) {
                    entry.mesh.material = entry.material;
                }
            }
        };
        if (variantName instanceof Array) {
            for (const name of variantName) {
                select(name);
            }
        }
        else {
            select(variantName);
        }
        extensionMetadata.lastSelected = variantName;
    }
    /**
     * Select a variant given a variant name or a list of variant names.
     * @param rootNode The glTF root node
     * @param variantName The variant name(s) to select.
     */
    selectVariant(rootNode, variantName) {
        KHR_materials_variants.SelectVariant(rootNode, variantName);
    }
    /**
     * Reset back to the original before selecting a variant.
     * @param rootNode The glTF root node
     */
    static Reset(rootNode) {
        const extensionMetadata = this._GetExtensionMetadata(rootNode);
        if (!extensionMetadata) {
            throw new Error(`Cannot reset on a glTF mesh that does not have the ${NAME} extension`);
        }
        for (const entry of extensionMetadata.original) {
            entry.mesh.material = entry.material;
        }
        extensionMetadata.lastSelected = null;
    }
    /**
     * Reset back to the original before selecting a variant.
     * @param rootNode The glTF root node
     */
    reset(rootNode) {
        KHR_materials_variants.Reset(rootNode);
    }
    /**
     * Gets the last selected variant name(s) or null if original.
     * @param rootNode The glTF root node
     * @returns The selected variant name(s).
     */
    static GetLastSelectedVariant(rootNode) {
        const extensionMetadata = this._GetExtensionMetadata(rootNode);
        if (!extensionMetadata) {
            throw new Error(`Cannot get the last selected variant on a glTF mesh that does not have the ${NAME} extension`);
        }
        return extensionMetadata.lastSelected;
    }
    /**
     * Gets the last selected variant name(s) or null if original.
     * @param rootNode The glTF root node
     * @returns The selected variant name(s).
     */
    getLastSelectedVariant(rootNode) {
        return KHR_materials_variants.GetLastSelectedVariant(rootNode);
    }
    static _GetExtensionMetadata(rootNode) {
        return rootNode?._internalMetadata?.gltf?.[NAME] || null;
    }
    /** @internal */
    onLoading() {
        const extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            const extension = extensions[this.name];
            this._variants = extension.variants;
        }
    }
    /** @internal */
    onReady() {
        const rootNode = this._loader.rootBabylonMesh;
        if (rootNode) {
            this._loader.parent.extensionOptions[NAME]?.onLoaded?.({
                get variants() {
                    return KHR_materials_variants.GetAvailableVariants(rootNode);
                },
                get selectedVariant() {
                    const lastSelectedVariant = KHR_materials_variants.GetLastSelectedVariant(rootNode);
                    if (!lastSelectedVariant) {
                        return KHR_materials_variants.GetAvailableVariants(rootNode)[0];
                    }
                    if (Array.isArray(lastSelectedVariant)) {
                        return lastSelectedVariant[0];
                    }
                    return lastSelectedVariant;
                },
                set selectedVariant(variantName) {
                    KHR_materials_variants.SelectVariant(rootNode, variantName);
                },
            });
        }
    }
    /**
     * @internal
     */
    _loadMeshPrimitiveAsync(context, name, node, mesh, primitive, assign) {
        return GLTFLoader.LoadExtensionAsync(context, primitive, this.name, (extensionContext, extension) => {
            const promises = new Array();
            promises.push(this._loader._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, (babylonMesh) => {
                assign(babylonMesh);
                if (babylonMesh instanceof Mesh) {
                    const babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);
                    const root = this._loader.rootBabylonMesh;
                    const metadata = root ? (root._internalMetadata = root._internalMetadata || {}) : {};
                    const gltf = (metadata.gltf = metadata.gltf || {});
                    const extensionMetadata = (gltf[NAME] = gltf[NAME] || { lastSelected: null, original: [], variants: {} });
                    // Store the original material.
                    extensionMetadata.original.push({ mesh: babylonMesh, material: babylonMesh.material });
                    // For each mapping, look at the variants and make a new entry for them.
                    for (let mappingIndex = 0; mappingIndex < extension.mappings.length; ++mappingIndex) {
                        const mapping = extension.mappings[mappingIndex];
                        const material = ArrayItem.Get(`${extensionContext}/mappings/${mappingIndex}/material`, this._loader.gltf.materials, mapping.material);
                        promises.push(this._loader._loadMaterialAsync(`#/materials/${mapping.material}`, material, babylonMesh, babylonDrawMode, (babylonMaterial) => {
                            for (let mappingVariantIndex = 0; mappingVariantIndex < mapping.variants.length; ++mappingVariantIndex) {
                                const variantIndex = mapping.variants[mappingVariantIndex];
                                const variant = ArrayItem.Get(`/extensions/${NAME}/variants/${variantIndex}`, this._variants, variantIndex);
                                extensionMetadata.variants[variant.name] = extensionMetadata.variants[variant.name] || [];
                                extensionMetadata.variants[variant.name].push({
                                    mesh: babylonMesh,
                                    material: babylonMaterial,
                                });
                                // Replace the target when original mesh is cloned
                                babylonMesh.onClonedObservable.add((newOne) => {
                                    const newMesh = newOne;
                                    let metadata = null;
                                    let newRoot = newMesh;
                                    // Find root to get medata
                                    do {
                                        newRoot = newRoot.parent;
                                        if (!newRoot) {
                                            return;
                                        }
                                        metadata = KHR_materials_variants._GetExtensionMetadata(newRoot);
                                    } while (metadata === null);
                                    // Need to clone the metadata on the root (first time only)
                                    if (root && metadata === KHR_materials_variants._GetExtensionMetadata(root)) {
                                        // Copy main metadata
                                        newRoot._internalMetadata = {};
                                        for (const key in root._internalMetadata) {
                                            newRoot._internalMetadata[key] = root._internalMetadata[key];
                                        }
                                        // Copy the gltf metadata
                                        newRoot._internalMetadata.gltf = [];
                                        for (const key in root._internalMetadata.gltf) {
                                            newRoot._internalMetadata.gltf[key] = root._internalMetadata.gltf[key];
                                        }
                                        // Duplicate the extension specific metadata
                                        newRoot._internalMetadata.gltf[NAME] = { lastSelected: null, original: [], variants: {} };
                                        for (const original of metadata.original) {
                                            newRoot._internalMetadata.gltf[NAME].original.push({
                                                mesh: original.mesh,
                                                material: original.material,
                                            });
                                        }
                                        for (const key in metadata.variants) {
                                            if (Object.prototype.hasOwnProperty.call(metadata.variants, key)) {
                                                newRoot._internalMetadata.gltf[NAME].variants[key] = [];
                                                for (const variantEntry of metadata.variants[key]) {
                                                    newRoot._internalMetadata.gltf[NAME].variants[key].push({
                                                        mesh: variantEntry.mesh,
                                                        material: variantEntry.material,
                                                    });
                                                }
                                            }
                                        }
                                        metadata = newRoot._internalMetadata.gltf[NAME];
                                    }
                                    // Relocate
                                    for (const target of metadata.original) {
                                        if (target.mesh === babylonMesh) {
                                            target.mesh = newMesh;
                                        }
                                    }
                                    for (const target of metadata.variants[variant.name]) {
                                        if (target.mesh === babylonMesh) {
                                            target.mesh = newMesh;
                                        }
                                    }
                                });
                            }
                        }));
                    }
                }
            }));
            return Promise.all(promises).then(([babylonMesh]) => {
                return babylonMesh;
            });
        });
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_variants(loader));
//# sourceMappingURL=KHR_materials_variants.js.map