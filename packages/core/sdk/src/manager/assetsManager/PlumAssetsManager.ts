import {AssetsManager} from "@babylonjs/core";
import {Viewer} from "../../core";
import {PlumMeshAssetTask} from "./PlumMeshAssetTask";
import {PlumSceneAssetTask} from "./PlumSceneAssetTask";


// https://doc.babylonjs.com/features/featuresDeepDive/importers/assetManager/#executing-the-tasks
// 资产管理封装
export class PlumAssetsManager extends AssetsManager {
    viewer: Viewer;

    constructor(viewer: Viewer) {
        super(viewer.scene);
        this.useDefaultLoadingScreen = false;
        this.viewer = viewer;
    }

    public addPlumMeshTask(taskName: string, meshesNames: any, rootUrl: string, sceneFilename: string | File, extension?: string): PlumMeshAssetTask {
        const task = new PlumMeshAssetTask(taskName, meshesNames, rootUrl, sceneFilename, extension);
        this._tasks.push(task);

        return task;
    }

    public addPlumSceneTask(taskName: string, meshesNames: any, rootUrl: string, sceneFilename: string | File, extension?: string): PlumMeshAssetTask {
        const task = new PlumSceneAssetTask(taskName, meshesNames, rootUrl, sceneFilename, extension);
        this._tasks.push(task);
        return task;
    }
}
