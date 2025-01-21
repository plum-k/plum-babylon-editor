import {ChunkSerialize, Viewer} from "@plum-render/babylon-sdk";
import {Pane} from 'tweakpane';

export default function testSerialize(viewer: Viewer) {
    const pane = new Pane();
    const PARAMS = {
        hidden: true,
    };
    pane.addButton({
        title: '加载大模型',
    }).on('click', () => {
    });
    pane.addButton({
        title: '导出',
    }).on('click', () => {
        const fullSerializer = new ChunkSerialize({viewer});
        fullSerializer.serialize();

        console.log("导出")

    });
}



