import {Viewer} from "@plum-render/babylon-sdk";
import {ISceneLoaderProgressEvent, SceneLoader} from "@babylonjs/core";

const testMesh = (viewer: Viewer, name: string = "testS.glb") => {
    // SceneLoader.AppendAsync("/", "实例化.glb", viewer.scene,
    // SceneLoader.AppendAsync("/", "test.glb", viewer.scene,
    // SceneLoader.AppendAsync("/", "Xbot.glb", viewer.scene,
    SceneLoader.AppendAsync("/", name, viewer.scene,
        (event: ISceneLoaderProgressEvent) => {
            // console.log(event)
        }
    ).then((scene) => {
        window.setTimeout(() => {
            // viewer?.cameraControls.focusToScene();
        }, 500)
    })
}

export default testMesh