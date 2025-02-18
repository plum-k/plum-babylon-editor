import {InitializeCSG2Async} from "@babylonjs/core";

export class CSG {

    constructor() {
    }

    static async init() {
        await InitializeCSG2Async({
            manifoldUrl: "./wasm/manifold-3d",
        });
    }
}