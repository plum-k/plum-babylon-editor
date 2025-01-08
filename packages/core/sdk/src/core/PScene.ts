import {AbstractEngine, Node, Scene as BabylonScene, SceneOptions} from "@babylonjs/core";
import {isCamera, isLight, isMesh} from "babylon-is";


export class PScene extends BabylonScene {

    constructor(engine: AbstractEngine, options?: SceneOptions) {
        super(engine, options);
    }

    objectIsInScene(node: Node) {
        if (isMesh(node)) {
            return this.meshes.includes(node);
        } else if (isLight(node)) {
            return this.lights.includes(node);
        } else if (isCamera(node)) {
            return this.cameras.includes(node);
        }
    }
}