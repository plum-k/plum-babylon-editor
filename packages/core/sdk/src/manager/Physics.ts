import HavokPhysics from "@babylonjs/havok";
import {HavokPlugin, Vector3} from "@babylonjs/core";
import {BasePlum, IBasePlumOptions} from "../core";

export interface IPhysicsOptions extends IBasePlumOptions {
}

export class Physics extends BasePlum {

    constructor(options: IPhysicsOptions) {
        super(options);
    }

    async init() {
        const havokInstance = await HavokPhysics();
        const hk = new HavokPlugin(true, havokInstance);
        this.scene.enablePhysics(new Vector3(0, -9.8, 0), hk);
    }
}