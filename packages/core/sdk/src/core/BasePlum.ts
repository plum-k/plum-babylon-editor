import {defaultsDeep} from "lodash-es";
import {Viewer} from "./Viewer";

export interface IBasePlumOptions {
    viewer: Viewer;
}

export class BasePlum<T extends IBasePlumOptions = IBasePlumOptions> {
    options: T;
    viewer: Viewer;

    constructor(options: T) {
        this.options = defaultsDeep({}, options);
        this.viewer = this.options.viewer;
    }

    get engine() {
        return this.viewer.engine;
    }

    get container() {
        return this.viewer.container
    }

    get canvas() {
        return this.viewer.canvas;
    }

    get scene() {
        return this.viewer.scene;
    }

    get eventManager() {
        return this.viewer.eventManager
    }

    get editor() {
        return this.viewer.editor;
    }
}