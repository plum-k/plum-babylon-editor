import {MeshBuilder} from "@babylonjs/core";


export function testRemoveObject(viewer) {
    const box = MeshBuilder.CreateBox("Box", {size: 1});
    viewer.editor.addObjectCommandExecute({
        source: "editor",
        object: box
    });

    const box1 = MeshBuilder.CreateBox("Box1", {size: 1});
    box1.position.set(0, 2, 0);
    box1.setParent(box);
    viewer.editor.addObjectCommandExecute({
        source: "editor",
        object: box1
    });
}