import {Viewer} from "@plum-render/babylon-sdk";
import {uniqueId} from "lodash-es";

const testMesh = (viewer: Viewer, name: string = "testS.glb") => {
    // SceneLoader.AppendAsync("/", "实例化.glb", viewer.scene,
    // SceneLoader.AppendAsync("/", "test.glb", viewer.scene,
    // SceneLoader.AppendAsync("/", "Xbot.glb", viewer.scene,

    let meshAssetTask = viewer.assetsManager.addPlumMeshTask(`${uniqueId(name)}`, "", "/", name);
    meshAssetTask.onSuccess = (task) => {
        window.setTimeout(() => {
            // viewer?.cameraControls.focusToScene();
        }, 500)
    }
    viewer.assetsManager.load();
}

export default testMesh