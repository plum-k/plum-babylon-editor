import {Viewer} from "./Viewer";

export interface ILightManagerOptions {
    viewer: Viewer;
}

export class LightManager {
    // light: HemisphericLight;

    constructor(options: ILightManagerOptions) {
        const {viewer} = options;
        const {scene} = viewer;
        // this.options = defaultsDeep({}, options);
        // this.light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        // Default intensity is 1. Let's dim the light a small amount
        // this.light.intensity = 0.7;

    }
}