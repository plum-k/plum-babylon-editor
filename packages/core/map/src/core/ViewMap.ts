import {TileMesh} from "../tile";
import {AbstractEngine, Scene} from "@babylonjs/core";

export interface IMapOptions {
    engine: AbstractEngine;
    scene: Scene;
}

export class ViewMap {
    private options: IMapOptions;

    rootTileMesh = new TileMesh({})
    engine: AbstractEngine;
    scene: Scene;

    constructor(options: IMapOptions) {
        this.options = options;
        this.engine = options.engine;
        this.scene = options.scene;
        this.rootTileMesh = new TileMesh({
            x: 0,
            y: 0,
            z: 0
        })

        this.scene.addMesh(this.rootTileMesh);
    }


    render() {


    }


}