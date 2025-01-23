import {AssetContainer, ISceneLoaderAsyncResult, ISceneLoaderProgressEvent, Scene} from "@babylonjs/core";
import {Viewer} from "../../core";

export abstract class Deserialize {
    protected constructor(public viewer: Viewer) {
    }

    // 加载模型
    abstract importMeshAsync(
        meshesNames: string | readonly string[] | null | undefined,
        scene: Scene,
        data: unknown,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ): Promise<ISceneLoaderAsyncResult>;

    // 加载场景
    abstract loadAsync(scene: Scene, data: unknown, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<void>;

    abstract loadAssetContainerAsync(scene: Scene, data: unknown, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<AssetContainer>;
}