import {AssetContainer} from "@babylonjs/core";
import {Viewer} from "../core";


// https://doc.babylonjs.com/features/featuresDeepDive/importers/assetContainers/
// 收集资产, 用于实例化或动态加载资源
export class PlumAssetContainer extends AssetContainer {
    viewer: Viewer;

    constructor(viewer: Viewer) {
        super(viewer.scene);
        this.viewer = viewer;
    }
}
