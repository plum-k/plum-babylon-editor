
/**
 * Class used to represent data loading progression
 */
export class SceneLoaderFlags {
    /**
     * Gets or sets a boolean indicating if entire scene must be loaded even if scene contains incremental data
     */
    static get ForceFullSceneLoadingForIncremental() {
        return SceneLoaderFlags._ForceFullSceneLoadingForIncremental;
    }
    static set ForceFullSceneLoadingForIncremental(value) {
        SceneLoaderFlags._ForceFullSceneLoadingForIncremental = value;
    }
    /**
     * Gets or sets a boolean indicating if loading screen must be displayed while loading a scene
     */
    static get ShowLoadingScreen() {
        return SceneLoaderFlags._ShowLoadingScreen;
    }
    static set ShowLoadingScreen(value) {
        SceneLoaderFlags._ShowLoadingScreen = value;
    }
    /**
     * Defines the current logging level (while loading the scene)
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static get loggingLevel() {
        return SceneLoaderFlags._LoggingLevel;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static set loggingLevel(value) {
        SceneLoaderFlags._LoggingLevel = value;
    }
    /**
     * Gets or set a boolean indicating if matrix weights must be cleaned upon loading
     */
    static get CleanBoneMatrixWeights() {
        return SceneLoaderFlags._CleanBoneMatrixWeights;
    }
    static set CleanBoneMatrixWeights(value) {
        SceneLoaderFlags._CleanBoneMatrixWeights = value;
    }
}
// Flags
SceneLoaderFlags._ForceFullSceneLoadingForIncremental = false;
SceneLoaderFlags._ShowLoadingScreen = true;
SceneLoaderFlags._CleanBoneMatrixWeights = false;
SceneLoaderFlags._LoggingLevel = 0;
//# sourceMappingURL=sceneLoaderFlags.js.map