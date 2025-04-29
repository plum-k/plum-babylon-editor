import {Coordinates} from "./Coordinates";

export interface IProjectionOptions {

}

export enum EUnits {
    M = "m"
}

export const EarthRadius: number = 6378137;

export const EarthHalfCircumference: number = Math.PI * EarthRadius;

export type Extent = [number, number, number, number];
export type WorldExtent = [number, number, number, number];

export abstract class Projection {
    protected constructor(options: IProjectionOptions) {

    }

    units:EUnits = EUnits.M

    extent: Extent = []
    world_extent: WorldExtent = [];

    project(coordinates: Coordinates) {
        return new Coordinates();
    }

    unProject(coordinates: Coordinates) {
        return new Coordinates();
    }
}
