import {ISourceOptions, Source} from "./Source";
import {DataSourceFormat, Projection} from "../enum";
import {Bounds} from "../interface";

export interface IOSMSource extends ISourceOptions {

}


export class OSMSource extends Source {

    constructor(options:IOSMSource) {
        super(options);
    }

    getUrl(x: number, y: number, z: number): string {
        return `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
    }
}