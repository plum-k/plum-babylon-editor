import {TileMesh} from "../tile";
import {AbstractEngine, Scene} from "@babylonjs/core";
import {Layer} from "../layer";
import {isRasterLayer} from "../layer/RasterLayer";

export interface IMapOptions {
    engine: AbstractEngine;
    scene: Scene;

}

export class ViewMap {
    private options: IMapOptions;

    rootTileMesh = new TileMesh({})
    engine: AbstractEngine;
    scene: Scene;

    constructor(options: IMapOptions) {
        this.options = options;
        this.engine = options.engine;
        this.scene = options.scene;
        const extent = EPSG_3857_Projected_Extent;

        this.rootTileMesh = new TileMesh({
            extent: extent,
            x: 0,
            y: 0,
            z: 0
        })

        this.scene.addMesh(this.rootTileMesh);
    }

    layerMap = new Map<string, Layer>();
    layerArray: Array<Layer> = [];

    getLayerById(id: string) {
        return this.layerMap.get(id);
    }

    addLayer(layer: Layer) {
        this.layerArray.push(layer);
        this.layerMap.set(layer.id, layer);
        for (const [id, layer] of this.layerMap) {

        }
    }

    removeLayer(value:  Layer) {
        this.layerArray.splice(this.layerArray.indexOf(value), 1);
        this.layerMap.delete(value.id);
    }

    getAllRasterLayer() {
        const array = []
        for (let i = 0; i < this.layerArray.length; i++) {
            array.push(this.layerArray[i]);
        }
        return array;
    }

    update() {
        const rasterLayerArray = this.getAllRasterLayer();
        for (let i = 0; i < rasterLayerArray.length; i++) {
            const rasterLayer = rasterLayerArray[i];
            rasterLayer.update();
        }
    }


}