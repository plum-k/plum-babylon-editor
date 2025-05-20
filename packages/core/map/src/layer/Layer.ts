import {Source} from "../source";

export interface ILayerOptions {
    source: Source;
}

export class Layer {
    id: string = "";
    private options: ILayerOptions;
    private source: Source;
    order = 0;

    constructor(options: ILayerOptions) {
        this.options = options;
        this.source = options.source;
    }

    update() {
        this.source.update();


    }
}