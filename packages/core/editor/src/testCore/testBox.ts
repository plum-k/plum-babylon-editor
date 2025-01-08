import {MeshBuilder} from "@babylonjs/core";


export function testBox(viewer) {
    const box = MeshBuilder.CreateBox("Box", {size: 1});
    viewer.editor.addObjectCommandExecute({
        source: "editor",
        object: box
    });
}