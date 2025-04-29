import {DeepImmutable, FloatArray, Vector3} from "@babylonjs/core";

export class Coordinates extends Vector3 {
    constructor() {
        super();
    }

    get longitude() {
        return this.x;
    }

    get latitude() {
        return this.y;
    }

    get altitude() {
        return this.z;
    }

    getArray() {
        return [this.x, this.y, this.z];
    }
}