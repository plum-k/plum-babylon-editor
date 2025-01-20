import { Vector3, Vector2 } from "./math.vector.js";
/**
 * Contains position and normal vectors for a vertex
 */
export class PositionNormalVertex {
    /**
     * Creates a PositionNormalVertex
     * @param position the position of the vertex (defaut: 0,0,0)
     * @param normal the normal of the vertex (defaut: 0,1,0)
     */
    constructor(
    /** [Vector3.Zero()] the position of the vertex (defaut: 0,0,0) */
    position = Vector3.Zero(), 
    /** [Vector3.Up()] the normal of the vertex (defaut: 0,1,0) */
    normal = Vector3.Up()) {
        this.position = position;
        this.normal = normal;
    }
    /**
     * Clones the PositionNormalVertex
     * @returns the cloned PositionNormalVertex
     */
    clone() {
        return new PositionNormalVertex(this.position.clone(), this.normal.clone());
    }
}
/**
 * Contains position, normal and uv vectors for a vertex
 */
export class PositionNormalTextureVertex {
    /**
     * Creates a PositionNormalTextureVertex
     * @param position the position of the vertex (defaut: 0,0,0)
     * @param normal the normal of the vertex (defaut: 0,1,0)
     * @param uv the uv of the vertex (default: 0,0)
     */
    constructor(
    /** [Vector3.Zero()] the position of the vertex (defaut: 0,0,0) */
    position = Vector3.Zero(), 
    /** [Vector3.Up()] the normal of the vertex (defaut: 0,1,0) */
    normal = Vector3.Up(), 
    /** [Vector3.Zero()] the uv of the vertex (default: 0,0) */
    uv = Vector2.Zero()) {
        this.position = position;
        this.normal = normal;
        this.uv = uv;
    }
    /**
     * Clones the PositionNormalTextureVertex
     * @returns the cloned PositionNormalTextureVertex
     */
    clone() {
        return new PositionNormalTextureVertex(this.position.clone(), this.normal.clone(), this.uv.clone());
    }
}
//# sourceMappingURL=math.vertexFormat.js.map