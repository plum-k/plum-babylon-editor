import {Projection} from "./Projection";

export interface IProjection4326Options {

}


export class Projection4326 extends Projection {
    constructor(options: IProjection4326Options) {
        super(options);
    }

    extent = [-180, -90, 180, 90];
    world_extent= [
        -180,
        -85,
        180,
        85
    ];
}