import {AbstractEngine, Node, Scene, SceneOptions} from "@babylonjs/core";
import {isCamera, isLight, isMesh} from "../guard";


export class PScene extends Scene {

    constructor(engine: AbstractEngine, options?: SceneOptions) {
        super(engine, options);
    }

    /**
     * 判断场景中是否包含指定的节点
     * @param node 节点
     * @returns 是否包含
     */
    objectIsInScene(node: Node) {
        if (isMesh(node)) {
            return this.meshes.includes(node);
        } else if (isLight(node)) {
            return this.lights.includes(node);
        } else if (isCamera(node)) {
            return this.cameras.includes(node);
        }
    }

    /**
     * 获取场景中所有的网格形成的包围盒. 排除隐藏和未启用的网格
     */
    getAllSceneExtends(){
         return  this.getWorldExtends((mesh) => {
            return mesh.isVisible && mesh.isEnabled();
        });
    }
}