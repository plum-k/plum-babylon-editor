import {Extent, Projection, WorldExtent} from "./Projection";
import {Coordinates} from "./Coordinates";

export interface IProjection4326Options {

}

export class Projection4326 extends Projection {
    constructor(options: IProjection4326Options) {
        super(options);
    }

    scale = 1000
    extent: Extent = [-180 * this.scale, -90 * this.scale, 180 * this.scale, 90 * this.scale];
    world_extent: WorldExtent = [
        -180,
        -85,
        180,
        85
    ];

    project(coordinates: Coordinates): Coordinates {
        const convertedCoords = [coordinates.x * this.scale, coordinates.y * this.scale];
        return new Coordinates().fromArray(convertedCoords);
    }

    unProject(coordinates: Coordinates): Coordinates {
        const convertedCoords = [coordinates.x / this.scale, coordinates.y / this.scale];
        return new Coordinates().fromArray(convertedCoords);
    }
}