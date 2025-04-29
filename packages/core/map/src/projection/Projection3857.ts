import {EarthHalfCircumference, EUnits, Extent, Projection, WorldExtent} from "./Projection";
import {Coordinates} from "./Coordinates";
import proj4 from "proj4";

export interface IProjection3857Options {

}

export class Projection3857 extends Projection {
    constructor(options: IProjection3857Options) {
        super(options);
    }

    units = EUnits.M;
    // 地图范围
    extent: Extent = [
        -EarthHalfCircumference,
        -EarthHalfCircumference,
        EarthHalfCircumference,
        EarthHalfCircumference
    ];
    world_extent: WorldExtent = [-180, -85, 180, 85];

    project(coordinates: Coordinates): Coordinates {
        const convertedCoords = proj4('EPSG:4326', 'EPSG:3857', coordinates.getArray());
        return new Coordinates().fromArray(convertedCoords);
    }

    unProject(coordinates: Coordinates): Coordinates {
        const convertedCoords = proj4('EPSG:3857', 'EPSG:4326', coordinates.getArray());
        return new Coordinates().fromArray(convertedCoords);
    }
}

const a = new Projection3857({});

console.log(a.extent);