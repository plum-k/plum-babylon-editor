import {EarthHalfCircumference, IProjectionOptions, Projection} from "./Projection";
export interface IProjection3857Options {

}

export class Projection3857  extends Projection{
    constructor(options: IProjection3857Options) {
        super(options);
    }

    // 地图范围
    extent: [number, number, number, number] = [
        -EarthHalfCircumference,
        -EarthHalfCircumference,
        EarthHalfCircumference,
        EarthHalfCircumference
    ];
    world_extent = [-180, -85, 180, 85];
}