import {Tile} from "./Tile";
import {Mesh} from "@babylonjs/core";

export interface IMapOptions {

}

export class Map {
    private options: IMapOptions;

    rootTile = new Tile({})

    constructor(options: IMapOptions) {
        super("map");
        this.options = options;



    }







}