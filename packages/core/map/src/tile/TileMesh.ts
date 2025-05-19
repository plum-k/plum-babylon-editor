import {Mesh} from "@babylonjs/core";

export interface ITileMeshOptions {
    name: string;
}


export class TileMesh extends Mesh {

    constructor(options: ITileMeshOptions) {
        super(options.name);
    }

}