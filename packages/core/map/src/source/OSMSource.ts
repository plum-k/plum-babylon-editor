import {ISourceOptions, Source} from "./Source";
import {replace} from "lodash-es";

export interface IOSMSource extends ISourceOptions {

}

export class OSMSource extends Source {
    url: string = `https://tile.openstreetmap.org/{z}/{x}/{y}.png`

    constructor(options: IOSMSource) {
        super(options);
    }

    getUrl(x: number, y: number, z: number): string {
        let str = this.url;
        str = replace(str, `{x}`, x.toString());
        str = replace(str, `{y}`, y.toString());
        str = replace(str, `{z}`, z.toString());
        return str;
    }
}