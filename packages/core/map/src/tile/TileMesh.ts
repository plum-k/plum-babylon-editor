import {Mesh, Plane, VertexData} from "@babylonjs/core";
import {Extent} from "../geographic";

function getTileName(x: number, y: number, z: number): string {
    return `tile_${z}_${x}_${y}`;
}

export interface ITileMeshOptions {
    x: number;
    y: number;
    z: number;
    extent: Extent;
}

export class TileMesh extends Mesh {
    x: number = 0;
    y: number = 0;
    z: number = 0;
    extent: Extent;

    constructor(options: ITileMeshOptions) {
        super("");
        this.name = getTileName(options.x, options.y, options.z);

        this.x = options.x;
        this.y = options.y;
        this.z = options.z;
        this.extent = options.extent;
        this.buildMesh();
    }

    /**
     * 只在视锥中渲染
     * @param frustumPlanes
     */
    isRender(frustumPlanes: Plane[]) {
        const isInFrustum = this.isInFrustum(frustumPlanes);

        return isInFrustum
    }


    /**
     * 是否有子节点
     */
    hasChildTile() {
        const hasChildren = this.getChildren().length > 0;
        return hasChildren;
    }

    /**
     * 生成网格
     */
    buildMesh() {
        const vertexData = this.extent.buildVertexData();
        vertexData.applyToMesh(this);
        console.log(vertexData);

    }
}