import {Viewer} from "@plum-render/babylon-sdk";
import {Pane} from 'tweakpane';
import testMesh from "./testMesh.ts";

export default function testSerialize(viewer: Viewer) {
    const pane = new Pane();
    const PARAMS = {
        hidden: true,
    };
    pane.addButton({
        title: '加载大模型',
    }).on('click', () => {
        testMesh(viewer, "大场景_WEBGL.glb")
    });
    pane.addButton({
        title: '导出',
    }).on('click', () => {
        const serializer = viewer?.serializer
        if (serializer) {
            serializer.pack().then(() => {

            });

        }
    });
}



