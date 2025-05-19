import {Tile} from "../tile/Tile";

export interface IMapOptions {

}

export class Map {
    private options: IMapOptions;

    rootTile = new Tile({})

    constructor(options: IMapOptions) {
        this.options = options;

    }







}