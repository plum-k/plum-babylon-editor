import HavokPhysics from "@babylonjs/havok";
import {HavokPlugin, TransformNode, Vector3} from "@babylonjs/core";
import {BasePlum, IBasePlumOptions} from "../core";
import {Debug} from "@babylonjs/core/Legacy/legacy";

export interface IPhysicsOptions extends IBasePlumOptions {
}

export class Physics extends BasePlum {

    constructor(options: IPhysicsOptions) {
        super(options);
    }

    /**
     * 初始化物理引擎
     */
    async init() {
        const havokInstance = await HavokPhysics({
            // 设置 wasm 文件路径
            locateFile: (url: string, scriptDirectory: string) => {
                return "/wasm/HavokPhysics.wasm"
            }
        });
        const hk = new HavokPlugin(true, havokInstance);
        this.scene.enablePhysics(new Vector3(0, -9.8, 0), hk);
    }


    /**
     * 调试物理引擎
     */
    debug() {
        const physicsViewer = new Debug.PhysicsViewer();
        for (const mesh of this.viewer.scene.rootNodes) {
            let physicsBody = (mesh as TransformNode).physicsBody
            if (physicsBody) {
                const debugMesh = physicsViewer.showBody(physicsBody);
            }
        }
    }
}