import { Vector2 } from "@babylonjs/core/Maths/math.vector.js";
import { Tools } from "@babylonjs/core/Misc/tools.js";
import { registerSceneLoaderPlugin } from "@babylonjs/core/Loading/sceneLoader.js";
import { AssetContainer } from "@babylonjs/core/assetContainer.js";
import { OBJFileLoaderMetadata } from "./objFileLoader.metadata.js";
import { MTLFileLoader } from "./mtlFileLoader.js";
import { SolidParser } from "./solidParser.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
/**
 * OBJ file type loader.
 * This is a babylon scene loader plugin.
 */
export class OBJFileLoader {
    /**
     * Invert Y-Axis of referenced textures on load
     */
    static get INVERT_TEXTURE_Y() {
        return MTLFileLoader.INVERT_TEXTURE_Y;
    }
    static set INVERT_TEXTURE_Y(value) {
        MTLFileLoader.INVERT_TEXTURE_Y = value;
    }
    /**
     * Creates loader for .OBJ files
     *
     * @param loadingOptions options for loading and parsing OBJ/MTL files.
     */
    constructor(loadingOptions) {
        /**
         * Defines the name of the plugin.
         */
        this.name = OBJFileLoaderMetadata.name;
        /**
         * Defines the extension the plugin is able to load.
         */
        this.extensions = OBJFileLoaderMetadata.extensions;
        this._assetContainer = null;
        this._loadingOptions = loadingOptions || OBJFileLoader._DefaultLoadingOptions;
    }
    static get _DefaultLoadingOptions() {
        return {
            computeNormals: OBJFileLoader.COMPUTE_NORMALS,
            optimizeNormals: OBJFileLoader.OPTIMIZE_NORMALS,
            importVertexColors: OBJFileLoader.IMPORT_VERTEX_COLORS,
            invertY: OBJFileLoader.INVERT_Y,
            invertTextureY: OBJFileLoader.INVERT_TEXTURE_Y,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            UVScaling: OBJFileLoader.UV_SCALING,
            materialLoadingFailsSilently: OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY,
            optimizeWithUV: OBJFileLoader.OPTIMIZE_WITH_UV,
            skipMaterials: OBJFileLoader.SKIP_MATERIALS,
            useLegacyBehavior: OBJFileLoader.USE_LEGACY_BEHAVIOR,
        };
    }
    /**
     * Calls synchronously the MTL file attached to this obj.
     * Load function or importMesh function don't enable to load 2 files in the same time asynchronously.
     * Without this function materials are not displayed in the first frame (but displayed after).
     * In consequence it is impossible to get material information in your HTML file
     *
     * @param url The URL of the MTL file
     * @param rootUrl defines where to load data from
     * @param onSuccess Callback function to be called when the MTL file is loaded
     * @param onFailure
     */
    _loadMTL(url, rootUrl, onSuccess, onFailure) {
        //The complete path to the mtl file
        const pathOfFile = rootUrl + url;
        // Loads through the babylon tools to allow fileInput search.
        Tools.LoadFile(pathOfFile, onSuccess, undefined, undefined, false, (request, exception) => {
            onFailure(pathOfFile, exception);
        });
    }
    /**
     * Instantiates a OBJ file loader plugin.
     * @returns the created plugin
     */
    createPlugin() {
        return new OBJFileLoader(OBJFileLoader._DefaultLoadingOptions);
    }
    /**
     * If the data string can be loaded directly.
     * @returns if the data can be loaded directly
     */
    canDirectLoad() {
        return false;
    }
    /**
     * Imports one or more meshes from the loaded OBJ data and adds them to the scene
     * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param data the OBJ data to load
     * @param rootUrl root url to load from
     * @returns a promise containing the loaded meshes, particles, skeletons and animations
     */
    importMeshAsync(meshesNames, scene, data, rootUrl) {
        //get the meshes from OBJ file
        return this._parseSolid(meshesNames, scene, data, rootUrl).then((meshes) => {
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
            result.meshes.forEach((mesh) => {
                const material = mesh.material;
                if (material) {
                    // Materials
                    if (container.materials.indexOf(material) == -1) {
                        container.materials.push(material);
                        // Textures
                        const textures = material.getActiveTextures();
                        textures.forEach((t) => {
                            if (container.textures.indexOf(t) == -1) {
                                container.textures.push(t);
                            }
                        });
                    }
                }
            });
            this._assetContainer = null;
            return container;
        })
            .catch((ex) => {
            this._assetContainer = null;
            throw ex;
        });
    }
    /**
     * Read the OBJ file and create an Array of meshes.
     * Each mesh contains all information given by the OBJ and the MTL file.
     * i.e. vertices positions and indices, optional normals values, optional UV values, optional material
     * @param meshesNames defines a string or array of strings of the mesh names that should be loaded from the file
     * @param scene defines the scene where are displayed the data
     * @param data defines the content of the obj file
     * @param rootUrl defines the path to the folder
     * @returns the list of loaded meshes
     */
    _parseSolid(meshesNames, scene, data, rootUrl) {
        let fileToLoad = ""; //The name of the mtlFile to load
        const materialsFromMTLFile = new MTLFileLoader();
        const materialToUse = [];
        const babylonMeshesArray = []; //The mesh for babylon
        // Sanitize data
        data = data.replace(/#.*$/gm, "").trim();
        // Main function
        const solidParser = new SolidParser(materialToUse, babylonMeshesArray, this._loadingOptions);
        solidParser.parse(meshesNames, data, scene, this._assetContainer, (fileName) => {
            fileToLoad = fileName;
        });
        // load the materials
        const mtlPromises = [];
        // Check if we have a file to load
        if (fileToLoad !== "" && !this._loadingOptions.skipMaterials) {
            //Load the file synchronously
            mtlPromises.push(new Promise((resolve, reject) => {
                this._loadMTL(fileToLoad, rootUrl, (dataLoaded) => {
                    try {
                        //Create materials thanks MTLLoader function
                        materialsFromMTLFile.parseMTL(scene, dataLoaded, rootUrl, this._assetContainer);
                        //Look at each material loaded in the mtl file
                        for (let n = 0; n < materialsFromMTLFile.materials.length; n++) {
                            //Three variables to get all meshes with the same material
                            let startIndex = 0;
                            const _indices = [];
                            let _index;
                            //The material from MTL file is used in the meshes loaded
                            //Push the indice in an array
                            //Check if the material is not used for another mesh
                            while ((_index = materialToUse.indexOf(materialsFromMTLFile.materials[n].name, startIndex)) > -1) {
                                _indices.push(_index);
                                startIndex = _index + 1;
                            }
                            //If the material is not used dispose it
                            if (_index === -1 && _indices.length === 0) {
                                //If the material is not needed, remove it
                                materialsFromMTLFile.materials[n].dispose();
                            }
                            else {
                                for (let o = 0; o < _indices.length; o++) {
                                    //Apply the material to the Mesh for each mesh with the material
                                    const mesh = babylonMeshesArray[_indices[o]];
                                    const material = materialsFromMTLFile.materials[n];
                                    mesh.material = material;
                                    if (!mesh.getTotalIndices()) {
                                        // No indices, we need to turn on point cloud
                                        material.pointsCloud = true;
                                    }
                                }
                            }
                        }
                        resolve();
                    }
                    catch (e) {
                        Tools.Warn(`Error processing MTL file: '${fileToLoad}'`);
                        if (this._loadingOptions.materialLoadingFailsSilently) {
                            resolve();
                        }
                        else {
                            reject(e);
                        }
                    }
                }, (pathOfFile, exception) => {
                    Tools.Warn(`Error downloading MTL file: '${fileToLoad}'`);
                    if (this._loadingOptions.materialLoadingFailsSilently) {
                        resolve();
                    }
                    else {
                        reject(exception);
                    }
                });
            }));
        }
        //Return an array with all Mesh
        return Promise.all(mtlPromises).then(() => {
            const isLine = (mesh) => Boolean(mesh._internalMetadata?.["_isLine"] ?? false);
            // Iterate over the mesh, determine if it is a line mesh, clone or modify the material to line rendering.
            babylonMeshesArray.forEach((mesh) => {
                if (isLine(mesh)) {
                    let mat = mesh.material ?? new StandardMaterial(mesh.name + "_line", scene);
                    // If another mesh is using this material and it is not a line then we need to clone it.
                    const needClone = mat.getBindedMeshes().filter((e) => !isLine(e)).length > 0;
                    if (needClone) {
                        mat = mat.clone(mat.name + "_line") ?? mat;
                    }
                    mat.wireframe = true;
                    mesh.material = mat;
                    if (mesh._internalMetadata) {
                        mesh._internalMetadata["_isLine"] = undefined;
                    }
                }
            });
            return babylonMeshesArray;
        });
    }
}
/**
 * Defines if UVs are optimized by default during load.
 */
OBJFileLoader.OPTIMIZE_WITH_UV = true;
/**
 * Invert model on y-axis (does a model scaling inversion)
 */
OBJFileLoader.INVERT_Y = false;
/**
 * Include in meshes the vertex colors available in some OBJ files.  This is not part of OBJ standard.
 */
OBJFileLoader.IMPORT_VERTEX_COLORS = false;
/**
 * Compute the normals for the model, even if normals are present in the file.
 */
OBJFileLoader.COMPUTE_NORMALS = false;
/**
 * Optimize the normals for the model. Lighting can be uneven if you use OptimizeWithUV = true because new vertices can be created for the same location if they pertain to different faces.
 * Using OptimizehNormals = true will help smoothing the lighting by averaging the normals of those vertices.
 */
OBJFileLoader.OPTIMIZE_NORMALS = false;
/**
 * Defines custom scaling of UV coordinates of loaded meshes.
 */
OBJFileLoader.UV_SCALING = new Vector2(1, 1);
/**
 * Skip loading the materials even if defined in the OBJ file (materials are ignored).
 */
OBJFileLoader.SKIP_MATERIALS = false;
/**
 * When a material fails to load OBJ loader will silently fail and onSuccess() callback will be triggered.
 *
 * Defaults to true for backwards compatibility.
 */
OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = true;
/**
 * Loads assets without handedness conversions. This flag is for compatibility. Use it only if absolutely required. Defaults to false.
 */
OBJFileLoader.USE_LEGACY_BEHAVIOR = false;
//Add this loader into the register plugin
registerSceneLoaderPlugin(new OBJFileLoader());
//# sourceMappingURL=objFileLoader.js.map