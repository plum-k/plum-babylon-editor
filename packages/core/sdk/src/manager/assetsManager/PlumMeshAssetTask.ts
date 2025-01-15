import {ISceneLoaderProgressEvent, MeshAssetTask, Scene, SceneLoader} from "@babylonjs/core";
import {initReservedDataStore} from "../../tool";

export class PlumMeshAssetTask extends MeshAssetTask {
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
        SceneLoader.ImportMeshAsync(
            this.meshesNames,
            this.rootUrl,
            this.sceneFilename,
            scene,
            (event: ISceneLoaderProgressEvent) => {
                this.onProgress(event);
            },
            this.extension
        ).then((result) => {
            const {meshes, particleSystems, skeletons, animationGroups, transformNodes} = result;
            // 修改根节点名称未文件名,
            const rootMesh = meshes[0];
            rootMesh.name = this.name;
            initReservedDataStore(rootMesh);

            // 存储相关动画
            rootMesh.reservedDataStore.animations = animationGroups;
            if (animationGroups.length > 0) {
                animationGroups[0].stop();
            }

            // 存储相关骨骼1
            rootMesh.reservedDataStore.skeletons = skeletons;
            if (skeletons.length > 0) {
                rootMesh.reservedDataStore.skeleton = skeletons[0];
            }

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