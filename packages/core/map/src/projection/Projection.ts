export interface IProjectionOptions {

}

export const EarthRadius: number = 6378137;

export const EarthHalfCircumference: number = Math.PI * EarthRadius;

export abstract class Projection {
    protected constructor(options: IProjectionOptions) {

    }
    extent: [number, number, number, number] = []

    world_extent: [number, number, number, number] = [];
    abstract project(lon: number, lat: number): { x: number; y: number };
    abstract unProject(x: number, y: number): { lon: number; lat: number };
}
