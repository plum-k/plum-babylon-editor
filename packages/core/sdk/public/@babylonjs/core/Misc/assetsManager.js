import { SceneLoader } from "../Loading/sceneLoader.js";
import { Tools } from "./tools.js";
import { Observable } from "./observable.js";
import { Texture } from "../Materials/Textures/texture.js";
import { CubeTexture } from "../Materials/Textures/cubeTexture.js";
import { HDRCubeTexture } from "../Materials/Textures/hdrCubeTexture.js";
import { EquiRectangularCubeTexture } from "../Materials/Textures/equiRectangularCubeTexture.js";
import { Logger } from "../Misc/logger.js";
import { EngineStore } from "../Engines/engineStore.js";
/**
 * Defines the list of states available for a task inside a AssetsManager
 */
export var AssetTaskState;
(function (AssetTaskState) {
    /**
     * Initialization
     */
    AssetTaskState[AssetTaskState["INIT"] = 0] = "INIT";
    /**
     * Running
     */
    AssetTaskState[AssetTaskState["RUNNING"] = 1] = "RUNNING";
    /**
     * Done
     */
    AssetTaskState[AssetTaskState["DONE"] = 2] = "DONE";
    /**
     * Error
     */
    AssetTaskState[AssetTaskState["ERROR"] = 3] = "ERROR";
})(AssetTaskState || (AssetTaskState = {}));
/**
 * Define an abstract asset task used with a AssetsManager class to load assets into a scene
 */
export class AbstractAssetTask {
    /**
     * Creates a new AssetsManager
     * @param name defines the name of the task
     */
    constructor(
    /**
     * Task name
     */ name) {
        this.name = name;
        this._isCompleted = false;
        this._taskState = 0 /* AssetTaskState.INIT */;
    }
    /**
     * Get if the task is completed
     */
    get isCompleted() {
        return this._isCompleted;
    }
    /**
     * Gets the current state of the task
     */
    get taskState() {
        return this._taskState;
    }
    /**
     * Gets the current error object (if task is in error)
     */
    get errorObject() {
        return this._errorObject;
    }
    /**
     * Internal only
     * @internal
     */
    _setErrorObject(message, exception) {
        if (this._errorObject) {
            return;
        }
        this._errorObject = {
            message: message,
            exception: exception,
        };
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    run(scene, onSuccess, onError) {
        this._taskState = 1 /* AssetTaskState.RUNNING */;
        this.runTask(scene, () => {
            this._onDoneCallback(onSuccess, onError);
        }, (msg, exception) => {
            this._onErrorCallback(onError, msg, exception);
        });
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    runTask(scene, onSuccess, onError) {
        throw new Error("runTask is not implemented");
    }
    /**
     * Reset will set the task state back to INIT, so the next load call of the assets manager will execute this task again.
     * This can be used with failed tasks that have the reason for failure fixed.
     */
    reset() {
        this._taskState = 0 /* AssetTaskState.INIT */;
    }
    _onErrorCallback(onError, message, exception) {
        this._taskState = 3 /* AssetTaskState.ERROR */;
        this._errorObject = {
            message: message,
            exception: exception,
        };
        if (this.onError) {
            this.onError(this, message, exception);
        }
        onError();
    }
    _onDoneCallback(onSuccess, onError) {
        try {
            this._taskState = 2 /* AssetTaskState.DONE */;
            this._isCompleted = true;
            if (this.onSuccess) {
                this.onSuccess(this);
            }
            onSuccess();
        }
        catch (e) {
            this._onErrorCallback(onError, "Task is done, error executing success callback(s)", e);
        }
    }
}
/**
 * Class used to share progress information about assets loading
 */
export class AssetsProgressEvent {
    /**
     * Creates a AssetsProgressEvent
     * @param remainingCount defines the number of remaining tasks to process
     * @param totalCount defines the total number of tasks
     * @param task defines the task that was just processed
     */
    constructor(remainingCount, totalCount, task) {
        this.remainingCount = remainingCount;
        this.totalCount = totalCount;
        this.task = task;
    }
}
/**
 * Define a task used by AssetsManager to load assets into a container
 */
export class ContainerAssetTask extends AbstractAssetTask {
    /**
     * Creates a new ContainerAssetTask
     * @param name defines the name of the task
     * @param meshesNames defines the list of mesh's names you want to load
     * @param rootUrl defines the root url to use as a base to load your meshes and associated resources
     * @param sceneFilename defines the filename or File of the scene to load from
     * @param extension defines the extension to use to load the scene (if not defined, ".babylon" will be used)
     */
    constructor(
    /**
     * Defines the name of the task
     */
    name, 
    /**
     * Defines the list of mesh's names you want to load
     */
    meshesNames, 
    /**
     * Defines the root url to use as a base to load your meshes and associated resources
     */
    rootUrl, 
    /**
     * Defines the filename or File of the scene to load from
     */
    sceneFilename, 
    /**
     * Defines the extension to use to load the scene (if not defined, ".babylon" will be used)
     */
    extension) {
        super(name);
        this.name = name;
        this.meshesNames = meshesNames;
        this.rootUrl = rootUrl;
        this.sceneFilename = sceneFilename;
        this.extension = extension;
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    runTask(scene, onSuccess, onError) {
        SceneLoader.LoadAssetContainer(this.rootUrl, this.sceneFilename, scene, (container) => {
            this.loadedContainer = container;
            this.loadedMeshes = container.meshes;
            this.loadedTransformNodes = container.transformNodes;
            this.loadedParticleSystems = container.particleSystems;
            this.loadedSkeletons = container.skeletons;
            this.loadedAnimationGroups = container.animationGroups;
            onSuccess();
        }, null, (scene, message, exception) => {
            onError(message, exception);
        }, this.extension);
    }
}
/**
 * Define a task used by AssetsManager to load meshes
 */
export class MeshAssetTask extends AbstractAssetTask {
    /**
     * Creates a new MeshAssetTask
     * @param name defines the name of the task
     * @param meshesNames defines the list of mesh's names you want to load
     * @param rootUrl defines the root url to use as a base to load your meshes and associated resources
     * @param sceneFilename defines the filename or File of the scene to load from
     * @param extension defines the extension to use to load the scene (if not defined, ".babylon" will be used)
     */
    constructor(
    /**
     * Defines the name of the task
     */
    name, 
    /**
     * Defines the list of mesh's names you want to load
     */
    meshesNames, 
    /**
     * Defines the root url to use as a base to load your meshes and associated resources
     */
    rootUrl, 
    /**
     * Defines the filename or File of the scene to load from
     */
    sceneFilename, 
    /**
     * Defines the extension to use to load the scene (if not defined, ".babylon" will be used)
     */
    extension) {
        super(name);
        this.name = name;
        this.meshesNames = meshesNames;
        this.rootUrl = rootUrl;
        this.sceneFilename = sceneFilename;
        this.extension = extension;
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    runTask(scene, onSuccess, onError) {
        SceneLoader.ImportMesh(this.meshesNames, this.rootUrl, this.sceneFilename, scene, (meshes, particleSystems, skeletons, animationGroups, transformNodes) => {
            this.loadedMeshes = meshes;
            this.loadedTransformNodes = transformNodes;
            this.loadedParticleSystems = particleSystems;
            this.loadedSkeletons = skeletons;
            this.loadedAnimationGroups = animationGroups;
            onSuccess();
        }, null, (scene, message, exception) => {
            onError(message, exception);
        }, this.extension);
    }
}
/**
 * Define a task used by AssetsManager to load animations
 */
export class AnimationAssetTask extends AbstractAssetTask {
    /**
     * Creates a new AnimationAssetTask
     * @param name defines the name of the task
     * @param rootUrl defines the root url to use as a base to load your meshes and associated resources
     * @param filename defines the filename or File of the scene to load from
     * @param targetConverter defines a function used to convert animation targets from loaded scene to current scene (default: search node by name)
     * @param extension defines the extension to use to load the scene (if not defined, ".babylon" will be used)
     */
    constructor(
    /**
     * Defines the name of the task
     */
    name, 
    /**
     * Defines the root url to use as a base to load your meshes and associated resources
     */
    rootUrl, 
    /**
     * Defines the filename to load from
     */
    filename, 
    /**
     * Defines a function used to convert animation targets from loaded scene to current scene (default: search node by name)
     */
    targetConverter, 
    /**
     * Defines the extension to use to load the scene (if not defined, ".babylon" will be used)
     */
    extension) {
        super(name);
        this.name = name;
        this.rootUrl = rootUrl;
        this.filename = filename;
        this.targetConverter = targetConverter;
        this.extension = extension;
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    runTask(scene, onSuccess, onError) {
        const startingIndexForNewAnimatables = scene.animatables.length;
        const startingIndexForNewAnimationGroups = scene.animationGroups.length;
        this.loadedAnimatables = [];
        this.loadedAnimationGroups = [];
        SceneLoader.ImportAnimations(this.rootUrl, this.filename, scene, false, 3 /* SceneLoaderAnimationGroupLoadingMode.NoSync */, this.targetConverter, () => {
            this.loadedAnimatables = scene.animatables.slice(startingIndexForNewAnimatables);
            this.loadedAnimationGroups = scene.animationGroups.slice(startingIndexForNewAnimationGroups);
            onSuccess();
        }, null, (scene, message, exception) => {
            onError(message, exception);
        }, this.extension);
    }
}
/**
 * Define a task used by AssetsManager to load text content
 */
export class TextFileAssetTask extends AbstractAssetTask {
    /**
     * Creates a new TextFileAssetTask object
     * @param name defines the name of the task
     * @param url defines the location of the file to load
     */
    constructor(
    /**
     * Defines the name of the task
     */
    name, 
    /**
     * Defines the location of the file to load
     */
    url) {
        super(name);
        this.name = name;
        this.url = url;
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    runTask(scene, onSuccess, onError) {
        scene._loadFile(this.url, (data) => {
            this.text = data;
            onSuccess();
        }, undefined, false, false, (request, exception) => {
            if (request) {
                onError(request.status + " " + request.statusText, exception);
            }
        });
    }
}
/**
 * Define a task used by AssetsManager to load binary data
 */
export class BinaryFileAssetTask extends AbstractAssetTask {
    /**
     * Creates a new BinaryFileAssetTask object
     * @param name defines the name of the new task
     * @param url defines the location of the file to load
     */
    constructor(
    /**
     * Defines the name of the task
     */
    name, 
    /**
     * Defines the location of the file to load
     */
    url) {
        super(name);
        this.name = name;
        this.url = url;
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    runTask(scene, onSuccess, onError) {
        scene._loadFile(this.url, (data) => {
            this.data = data;
            onSuccess();
        }, undefined, true, true, (request, exception) => {
            if (request) {
                onError(request.status + " " + request.statusText, exception);
            }
        });
    }
}
/**
 * Define a task used by AssetsManager to load images
 */
export class ImageAssetTask extends AbstractAssetTask {
    /**
     * Creates a new ImageAssetTask
     * @param name defines the name of the task
     * @param url defines the location of the image to load
     */
    constructor(
    /**
     * Defines the name of the task
     */
    name, 
    /**
     * Defines the location of the image to load
     */
    url) {
        super(name);
        this.name = name;
        this.url = url;
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    runTask(scene, onSuccess, onError) {
        const img = new Image();
        Tools.SetCorsBehavior(this.url, img);
        img.onload = () => {
            this.image = img;
            onSuccess();
        };
        img.onerror = (err) => {
            onError("Error loading image", err);
        };
        img.src = this.url;
    }
}
/**
 * Define a task used by AssetsManager to load 2D textures
 */
export class TextureAssetTask extends AbstractAssetTask {
    /**
     * Creates a new TextureAssetTask object
     * @param name defines the name of the task
     * @param url defines the location of the file to load
     * @param noMipmap defines if mipmap should not be generated (default is false)
     * @param invertY defines if texture must be inverted on Y axis (default is true)
     * @param samplingMode defines the sampling mode to use (default is Texture.TRILINEAR_SAMPLINGMODE)
     */
    constructor(
    /**
     * Defines the name of the task
     */
    name, 
    /**
     * Defines the location of the file to load
     */
    url, 
    /**
     * Defines if mipmap should not be generated (default is false)
     */
    noMipmap, 
    /**
     * [true] Defines if texture must be inverted on Y axis (default is true)
     */
    invertY = true, 
    /**
     * [3] Defines the sampling mode to use (default is Texture.TRILINEAR_SAMPLINGMODE)
     */
    samplingMode = Texture.TRILINEAR_SAMPLINGMODE) {
        super(name);
        this.name = name;
        this.url = url;
        this.noMipmap = noMipmap;
        this.invertY = invertY;
        this.samplingMode = samplingMode;
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    runTask(scene, onSuccess, onError) {
        const onload = () => {
            onSuccess();
        };
        const onerror = (message, exception) => {
            onError(message, exception);
        };
        this.texture = new Texture(this.url, scene, this.noMipmap, this.invertY, this.samplingMode, onload, onerror);
    }
}
/**
 * Define a task used by AssetsManager to load cube textures
 */
export class CubeTextureAssetTask extends AbstractAssetTask {
    /**
     * Creates a new CubeTextureAssetTask
     * @param name defines the name of the task
     * @param url defines the location of the files to load (You have to specify the folder where the files are + filename with no extension)
     * @param extensions defines the extensions to use to load files (["_px", "_py", "_pz", "_nx", "_ny", "_nz"] by default)
     * @param noMipmap defines if mipmaps should not be generated (default is false)
     * @param files defines the explicit list of files (undefined by default)
     * @param prefiltered
     */
    constructor(
    /**
     * Defines the name of the task
     */
    name, 
    /**
     * Defines the location of the files to load (You have to specify the folder where the files are + filename with no extension)
     */
    url, 
    /**
     * Defines the extensions to use to load files (["_px", "_py", "_pz", "_nx", "_ny", "_nz"] by default)
     */
    extensions, 
    /**
     * Defines if mipmaps should not be generated (default is false)
     */
    noMipmap, 
    /**
     * Defines the explicit list of files (undefined by default)
     */
    files, 
    /**
     * Defines the prefiltered texture option (default is false)
     */
    prefiltered) {
        super(name);
        this.name = name;
        this.url = url;
        this.extensions = extensions;
        this.noMipmap = noMipmap;
        this.files = files;
        this.prefiltered = prefiltered;
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    runTask(scene, onSuccess, onError) {
        const onload = () => {
            onSuccess();
        };
        const onerror = (message, exception) => {
            onError(message, exception);
        };
        this.texture = new CubeTexture(this.url, scene, this.extensions, this.noMipmap, this.files, onload, onerror, undefined, this.prefiltered);
    }
}
/**
 * Define a task used by AssetsManager to load HDR cube textures
 */
export class HDRCubeTextureAssetTask extends AbstractAssetTask {
    /**
     * Creates a new HDRCubeTextureAssetTask object
     * @param name defines the name of the task
     * @param url defines the location of the file to load
     * @param size defines the desired size (the more it increases the longer the generation will be) If the size is omitted this implies you are using a preprocessed cubemap.
     * @param noMipmap defines if mipmaps should not be generated (default is false)
     * @param generateHarmonics specifies whether you want to extract the polynomial harmonics during the generation process (default is true)
     * @param gammaSpace specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space) (default is false)
     * @param reserved Internal use only
     */
    constructor(
    /**
     * Defines the name of the task
     */
    name, 
    /**
     * Defines the location of the file to load
     */
    url, 
    /**
     * Defines the desired size (the more it increases the longer the generation will be)
     */
    size, 
    /**
     * [false] Defines if mipmaps should not be generated (default is false)
     */
    noMipmap = false, 
    /**
     * [true] Specifies whether you want to extract the polynomial harmonics during the generation process (default is true)
     */
    generateHarmonics = true, 
    /**
     * [false] Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space) (default is false)
     */
    gammaSpace = false, 
    /**
     * [false] Internal Use Only
     */
    reserved = false) {
        super(name);
        this.name = name;
        this.url = url;
        this.size = size;
        this.noMipmap = noMipmap;
        this.generateHarmonics = generateHarmonics;
        this.gammaSpace = gammaSpace;
        this.reserved = reserved;
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    runTask(scene, onSuccess, onError) {
        const onload = () => {
            onSuccess();
        };
        const onerror = (message, exception) => {
            onError(message, exception);
        };
        this.texture = new HDRCubeTexture(this.url, scene, this.size, this.noMipmap, this.generateHarmonics, this.gammaSpace, this.reserved, onload, onerror);
    }
}
/**
 * Define a task used by AssetsManager to load Equirectangular cube textures
 */
export class EquiRectangularCubeTextureAssetTask extends AbstractAssetTask {
    /**
     * Creates a new EquiRectangularCubeTextureAssetTask object
     * @param name defines the name of the task
     * @param url defines the location of the file to load
     * @param size defines the desired size (the more it increases the longer the generation will be)
     * If the size is omitted this implies you are using a preprocessed cubemap.
     * @param noMipmap defines if mipmaps should not be generated (default is false)
     * @param gammaSpace specifies if the texture will be used in gamma or linear space
     * (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space)
     * (default is true)
     */
    constructor(
    /**
     * Defines the name of the task
     */
    name, 
    /**
     * Defines the location of the file to load
     */
    url, 
    /**
     * Defines the desired size (the more it increases the longer the generation will be)
     */
    size, 
    /**
     * [false] Defines if mipmaps should not be generated (default is false)
     */
    noMipmap = false, 
    /**
     * [true] Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space,
     * but the standard material would require them in Gamma space) (default is true)
     */
    gammaSpace = true) {
        super(name);
        this.name = name;
        this.url = url;
        this.size = size;
        this.noMipmap = noMipmap;
        this.gammaSpace = gammaSpace;
    }
    /**
     * Execute the current task
     * @param scene defines the scene where you want your assets to be loaded
     * @param onSuccess is a callback called when the task is successfully executed
     * @param onError is a callback called if an error occurs
     */
    runTask(scene, onSuccess, onError) {
        const onload = () => {
            onSuccess();
        };
        const onerror = (message, exception) => {
            onError(message, exception);
        };
        this.texture = new EquiRectangularCubeTexture(this.url, scene, this.size, this.noMipmap, this.gammaSpace, onload, onerror);
    }
}
/**
 * This class can be used to easily import assets into a scene
 * @see https://doc.babylonjs.com/features/featuresDeepDive/importers/assetManager
 */
export class AssetsManager {
    /**
     * Creates a new AssetsManager
     * @param scene defines the scene to work on
     */
    constructor(scene) {
        this._isLoading = false;
        this._tasks = new Array();
        this._waitingTasksCount = 0;
        this._totalTasksCount = 0;
        /**
         * Observable called when all tasks are processed
         */
        this.onTaskSuccessObservable = new Observable();
        /**
         * Observable called when a task had an error
         */
        this.onTaskErrorObservable = new Observable();
        /**
         * Observable called when all tasks were executed
         */
        this.onTasksDoneObservable = new Observable();
        /**
         * Observable called when a task is done (whatever the result is)
         */
        this.onProgressObservable = new Observable();
        /**
         * Gets or sets a boolean defining if the AssetsManager should use the default loading screen
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        this.useDefaultLoadingScreen = true;
        /**
         * Gets or sets a boolean defining if the AssetsManager should automatically hide the loading screen
         * when all assets have been downloaded.
         * If set to false, you need to manually call in hideLoadingUI() once your scene is ready.
         */
        this.autoHideLoadingUI = true;
        this._scene = scene || EngineStore.LastCreatedScene;
    }
    /**
     * Add a ContainerAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param meshesNames defines the name of meshes to load
     * @param rootUrl defines the root url to use to locate files
     * @param sceneFilename defines the filename of the scene file or the File itself
     * @param extension defines the extension to use to load the file
     * @returns a new ContainerAssetTask object
     */
    addContainerTask(taskName, meshesNames, rootUrl, sceneFilename, extension) {
        const task = new ContainerAssetTask(taskName, meshesNames, rootUrl, sceneFilename, extension);
        this._tasks.push(task);
        return task;
    }
    /**
     * Add a MeshAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param meshesNames defines the name of meshes to load
     * @param rootUrl defines the root url to use to locate files
     * @param sceneFilename defines the filename of the scene file or the File itself
     * @param extension defines the extension to use to load the file
     * @returns a new MeshAssetTask object
     */
    addMeshTask(taskName, meshesNames, rootUrl, sceneFilename, extension) {
        const task = new MeshAssetTask(taskName, meshesNames, rootUrl, sceneFilename, extension);
        this._tasks.push(task);
        return task;
    }
    /**
     * Add a TextFileAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @returns a new TextFileAssetTask object
     */
    addTextFileTask(taskName, url) {
        const task = new TextFileAssetTask(taskName, url);
        this._tasks.push(task);
        return task;
    }
    /**
     * Add a BinaryFileAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @returns a new BinaryFileAssetTask object
     */
    addBinaryFileTask(taskName, url) {
        const task = new BinaryFileAssetTask(taskName, url);
        this._tasks.push(task);
        return task;
    }
    /**
     * Add a ImageAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @returns a new ImageAssetTask object
     */
    addImageTask(taskName, url) {
        const task = new ImageAssetTask(taskName, url);
        this._tasks.push(task);
        return task;
    }
    /**
     * Add a TextureAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @param noMipmap defines if the texture must not receive mipmaps (false by default)
     * @param invertY defines if you want to invert Y axis of the loaded texture (true by default)
     * @param samplingMode defines the sampling mode to use (Texture.TRILINEAR_SAMPLINGMODE by default)
     * @returns a new TextureAssetTask object
     */
    addTextureTask(taskName, url, noMipmap, invertY, samplingMode = Texture.TRILINEAR_SAMPLINGMODE) {
        const task = new TextureAssetTask(taskName, url, noMipmap, invertY, samplingMode);
        this._tasks.push(task);
        return task;
    }
    /**
     * Add a CubeTextureAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @param extensions defines the extension to use to load the cube map (can be null)
     * @param noMipmap defines if the texture must not receive mipmaps (false by default)
     * @param files defines the list of files to load (can be null)
     * @param prefiltered defines the prefiltered texture option (default is false)
     * @returns a new CubeTextureAssetTask object
     */
    addCubeTextureTask(taskName, url, extensions, noMipmap, files, prefiltered) {
        const task = new CubeTextureAssetTask(taskName, url, extensions, noMipmap, files, prefiltered);
        this._tasks.push(task);
        return task;
    }
    /**
     *
     * Add a HDRCubeTextureAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @param size defines the size you want for the cubemap (can be null)
     * @param noMipmap defines if the texture must not receive mipmaps (false by default)
     * @param generateHarmonics defines if you want to automatically generate (true by default)
     * @param gammaSpace specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space) (default is false)
     * @param reserved Internal use only
     * @returns a new HDRCubeTextureAssetTask object
     */
    addHDRCubeTextureTask(taskName, url, size, noMipmap = false, generateHarmonics = true, gammaSpace = false, reserved = false) {
        const task = new HDRCubeTextureAssetTask(taskName, url, size, noMipmap, generateHarmonics, gammaSpace, reserved);
        this._tasks.push(task);
        return task;
    }
    /**
     *
     * Add a EquiRectangularCubeTextureAssetTask to the list of active tasks
     * @param taskName defines the name of the new task
     * @param url defines the url of the file to load
     * @param size defines the size you want for the cubemap (can be null)
     * @param noMipmap defines if the texture must not receive mipmaps (false by default)
     * @param gammaSpace Specifies if the texture will be used in gamma or linear space
     * (the PBR material requires those textures in linear space, but the standard material would require them in Gamma space)
     * @returns a new EquiRectangularCubeTextureAssetTask object
     */
    addEquiRectangularCubeTextureAssetTask(taskName, url, size, noMipmap = false, gammaSpace = true) {
        const task = new EquiRectangularCubeTextureAssetTask(taskName, url, size, noMipmap, gammaSpace);
        this._tasks.push(task);
        return task;
    }
    /**
     * Remove a task from the assets manager.
     * @param task the task to remove
     */
    removeTask(task) {
        const index = this._tasks.indexOf(task);
        if (index > -1) {
            this._tasks.splice(index, 1);
        }
    }
    _decreaseWaitingTasksCount(task) {
        this._waitingTasksCount--;
        try {
            if (this.onProgress) {
                this.onProgress(this._waitingTasksCount, this._totalTasksCount, task);
            }
            this.onProgressObservable.notifyObservers(new AssetsProgressEvent(this._waitingTasksCount, this._totalTasksCount, task));
        }
        catch (e) {
            Logger.Error("Error running progress callbacks.");
            Logger.Log(e);
        }
        if (this._waitingTasksCount === 0) {
            try {
                const currentTasks = this._tasks.slice();
                if (this.onFinish) {
                    // Calling onFinish with immutable array of tasks
                    this.onFinish(currentTasks);
                }
                // Let's remove successful tasks
                for (const task of currentTasks) {
                    if (task.taskState === 2 /* AssetTaskState.DONE */) {
                        const index = this._tasks.indexOf(task);
                        if (index > -1) {
                            this._tasks.splice(index, 1);
                        }
                    }
                }
                this.onTasksDoneObservable.notifyObservers(this._tasks);
            }
            catch (e) {
                Logger.Error("Error running tasks-done callbacks.");
                Logger.Log(e);
            }
            this._isLoading = false;
            if (this.autoHideLoadingUI) {
                this._scene.getEngine().hideLoadingUI();
            }
        }
    }
    _runTask(task) {
        const done = () => {
            try {
                if (this.onTaskSuccess) {
                    this.onTaskSuccess(task);
                }
                this.onTaskSuccessObservable.notifyObservers(task);
                this._decreaseWaitingTasksCount(task);
            }
            catch (e) {
                error("Error executing task success callbacks", e);
            }
        };
        const error = (message, exception) => {
            task._setErrorObject(message, exception);
            if (this.onTaskError) {
                this.onTaskError(task);
            }
            else if (!task.onError) {
                Logger.Error(this._formatTaskErrorMessage(task));
            }
            this.onTaskErrorObservable.notifyObservers(task);
            this._decreaseWaitingTasksCount(task);
        };
        task.run(this._scene, done, error);
    }
    _formatTaskErrorMessage(task) {
        let errorMessage = "Unable to complete task " + task.name;
        if (task.errorObject.message) {
            errorMessage += `: ${task.errorObject.message}`;
        }
        if (task.errorObject.exception) {
            errorMessage += `: ${task.errorObject.exception}`;
        }
        return errorMessage;
    }
    /**
     * Reset the AssetsManager and remove all tasks
     * @returns the current instance of the AssetsManager
     */
    reset() {
        this._isLoading = false;
        this._tasks = new Array();
        return this;
    }
    /**
     * Start the loading process
     * @returns the current instance of the AssetsManager
     */
    load() {
        if (this._isLoading) {
            return this;
        }
        this._isLoading = true;
        this._waitingTasksCount = this._tasks.length;
        this._totalTasksCount = this._tasks.length;
        if (this._waitingTasksCount === 0) {
            this._isLoading = false;
            if (this.onFinish) {
                this.onFinish(this._tasks);
            }
            this.onTasksDoneObservable.notifyObservers(this._tasks);
            return this;
        }
        if (this.useDefaultLoadingScreen) {
            this._scene.getEngine().displayLoadingUI();
        }
        for (let index = 0; index < this._tasks.length; index++) {
            const task = this._tasks[index];
            if (task.taskState === 0 /* AssetTaskState.INIT */) {
                this._runTask(task);
            }
        }
        return this;
    }
    /**
     * Start the loading process as an async operation
     * @returns a promise returning the list of failed tasks
     */
    loadAsync() {
        return new Promise((resolve, reject) => {
            if (this._isLoading) {
                resolve();
                return;
            }
            this.onTasksDoneObservable.addOnce((remainingTasks) => {
                if (remainingTasks && remainingTasks.length) {
                    reject(remainingTasks);
                }
                else {
                    resolve();
                }
            });
            this.load();
        });
    }
}
//# sourceMappingURL=assetsManager.js.map