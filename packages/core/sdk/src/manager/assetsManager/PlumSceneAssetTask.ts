import {ISceneLoaderProgressEvent, LoadAssetContainerAsync, MeshAssetTask, Scene, SceneLoader} from "@babylonjs/core";

export class PlumSceneAssetTask extends MeshAssetTask {
    constructor(
        /**
         * Defines the name of the task
         */
        public override name: string,
        /**
         * Defines the list of mesh's names you want to load
         */
        public override meshesNames: any,
        /**
         * Defines the root url to use as a base to load your meshes and associated resources
         */
        public override rootUrl: string,
        /**
         * Defines the filename or File of the scene to load from
         */
        public override sceneFilename: string | File,
        /**
         * Defines the extension to use to load the scene (if not defined, ".babylon" will be used)
         */
        public override extension?: string
    ) {
        super(name, meshesNames, rootUrl, sceneFilename, extension);
    }

    onProgress: (event: ISceneLoaderProgressEvent) => void = () => {

    }

    public override runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void) {
        // todo LoadAssetContainerAsync
        SceneLoader.AppendAsync(
            this.rootUrl,
            this.sceneFilename,
            scene,
            (event: ISceneLoaderProgressEvent) => {
                this.onProgress(event);
            },
            this.extension
        ).then((result) => {
            const {meshes, particleSystems, skeletons, animationGroups, transformNodes} = result;
            this.loadedMeshes = meshes;
            this.loadedTransformNodes = transformNodes;
            this.loadedParticleSystems = particleSystems;
            this.loadedSkeletons = skeletons;
            this.loadedAnimationGroups = animationGroups;
            onSuccess();
        }).catch((error) => {
            onError(error, error);
        });
    }
}