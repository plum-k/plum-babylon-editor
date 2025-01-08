import {Color3, CreateGround, GroundMesh, Scene, Texture, UtilityLayerRenderer} from "@babylonjs/core";
import {GridMaterial} from "@babylonjs/materials";

export class GridTool {

    gridMesh: GroundMesh | null = null

    constructor() {
    }

    addOrRemoveGrid(baseScene: Scene | null = null, width: number = 200, depth: number = 200) {
        const scene = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer.utilityLayerScene;
        if (!this.gridMesh) {
            if (baseScene) {
                const extend = baseScene.getWorldExtends();
                width = (extend.max.x - extend.min.x) * 5.0;
                depth = (extend.max.z - extend.min.z) * 5.0;
            }
            this.gridMesh = CreateGround("grid", {width: 1.0, height: 1.0, subdivisions: 1}, scene);
            if (!this.gridMesh.reservedDataStore) {
                this.gridMesh.reservedDataStore = {};
            }
            this.gridMesh.scaling.x = Math.max(width, depth);
            this.gridMesh.scaling.z = this.gridMesh.scaling.x;
            this.gridMesh.reservedDataStore.isInspectorGrid = true;
            this.gridMesh.isPickable = false;

            const groundMaterial = new GridMaterial("GridMaterial", scene);
            groundMaterial.majorUnitFrequency = 10;
            groundMaterial.minorUnitVisibility = 0.3;
            groundMaterial.gridRatio = 0.01;
            groundMaterial.backFaceCulling = false;
            groundMaterial.mainColor = new Color3(1, 1, 1);
            groundMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
            groundMaterial.opacity = 0.8;
            groundMaterial.zOffset = 1.0;
            groundMaterial.opacityTexture = new Texture("/texture/backgroundGround.png", scene);
            // groundMaterial.opacityTexture = new Texture(gridImg, scene);
            let json = groundMaterial.opacityTexture.serialize()
            this.gridMesh.material = groundMaterial;
            return;
        }

        this.gridMesh.dispose(true, true);
        this.gridMesh = null;
    }


}