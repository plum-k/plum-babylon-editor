import { Vector3 } from "../../Maths/math.vector.js";
import { BoundingBox } from "../../Culling/boundingBox.js";
/**
 * Class used to store a cell in an octree
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeOctrees
 */
export class OctreeBlock {
    /**
     * Creates a new block
     * @param minPoint defines the minimum vector (in world space) of the block's bounding box
     * @param maxPoint defines the maximum vector (in world space) of the block's bounding box
     * @param capacity defines the maximum capacity of this block (if capacity is reached the block will be split into sub blocks)
     * @param depth defines the current depth of this block in the octree
     * @param maxDepth defines the maximal depth allowed (beyond this value, the capacity is ignored)
     * @param creationFunc defines a callback to call when an element is added to the block
     */
    constructor(minPoint, maxPoint, capacity, depth, maxDepth, creationFunc) {
        /**
         * Gets the content of the current block
         */
        this.entries = [];
        this._boundingVectors = new Array();
        this._capacity = capacity;
        this._depth = depth;
        this._maxDepth = maxDepth;
        this._creationFunc = creationFunc;
        this._minPoint = minPoint;
        this._maxPoint = maxPoint;
        this._boundingVectors.push(minPoint.clone());
        this._boundingVectors.push(maxPoint.clone());
        this._boundingVectors.push(minPoint.clone());
        this._boundingVectors[2].x = maxPoint.x;
        this._boundingVectors.push(minPoint.clone());
        this._boundingVectors[3].y = maxPoint.y;
        this._boundingVectors.push(minPoint.clone());
        this._boundingVectors[4].z = maxPoint.z;
        this._boundingVectors.push(maxPoint.clone());
        this._boundingVectors[5].z = minPoint.z;
        this._boundingVectors.push(maxPoint.clone());
        this._boundingVectors[6].x = minPoint.x;
        this._boundingVectors.push(maxPoint.clone());
        this._boundingVectors[7].y = minPoint.y;
    }
    // Property
    /**
     * Gets the maximum capacity of this block (if capacity is reached the block will be split into sub blocks)
     */
    get capacity() {
        return this._capacity;
    }
    /**
     * Gets the minimum vector (in world space) of the block's bounding box
     */
    get minPoint() {
        return this._minPoint;
    }
    /**
     * Gets the maximum vector (in world space) of the block's bounding box
     */
    get maxPoint() {
        return this._maxPoint;
    }
    // Methods
    /**
     * Add a new element to this block
     * @param entry defines the element to add
     */
    addEntry(entry) {
        if (this.blocks) {
            for (let index = 0; index < this.blocks.length; index++) {
                const block = this.blocks[index];
                block.addEntry(entry);
            }
            return;
        }
        this._creationFunc(entry, this);
        if (this.entries.length > this.capacity && this._depth < this._maxDepth) {
            this.createInnerBlocks();
        }
    }
    /**
     * Remove an element from this block
     * @param entry defines the element to remove
     */
    removeEntry(entry) {
        if (this.blocks) {
            for (let index = 0; index < this.blocks.length; index++) {
                const block = this.blocks[index];
                block.removeEntry(entry);
            }
            return;
        }
        const entryIndex = this.entries.indexOf(entry);
        if (entryIndex > -1) {
            this.entries.splice(entryIndex, 1);
        }
    }
    /**
     * Add an array of elements to this block
     * @param entries defines the array of elements to add
     */
    addEntries(entries) {
        for (let index = 0; index < entries.length; index++) {
            const mesh = entries[index];
            this.addEntry(mesh);
        }
    }
    /**
     * Test if the current block intersects the frustum planes and if yes, then add its content to the selection array
     * @param frustumPlanes defines the frustum planes to test
     * @param selection defines the array to store current content if selection is positive
     * @param allowDuplicate defines if the selection array can contains duplicated entries
     */
    select(frustumPlanes, selection, allowDuplicate) {
        if (BoundingBox.IsInFrustum(this._boundingVectors, frustumPlanes)) {
            if (this.blocks) {
                for (let index = 0; index < this.blocks.length; index++) {
                    const block = this.blocks[index];
                    block.select(frustumPlanes, selection, allowDuplicate);
                }
                return;
            }
            if (allowDuplicate) {
                selection.concat(this.entries);
            }
            else {
                selection.concatWithNoDuplicate(this.entries);
            }
        }
    }
    /**
     * Test if the current block intersect with the given bounding sphere and if yes, then add its content to the selection array
     * @param sphereCenter defines the bounding sphere center
     * @param sphereRadius defines the bounding sphere radius
     * @param selection defines the array to store current content if selection is positive
     * @param allowDuplicate defines if the selection array can contains duplicated entries
     */
    intersects(sphereCenter, sphereRadius, selection, allowDuplicate) {
        if (BoundingBox.IntersectsSphere(this._minPoint, this._maxPoint, sphereCenter, sphereRadius)) {
            if (this.blocks) {
                for (let index = 0; index < this.blocks.length; index++) {
                    const block = this.blocks[index];
                    block.intersects(sphereCenter, sphereRadius, selection, allowDuplicate);
                }
                return;
            }
            if (allowDuplicate) {
                selection.concat(this.entries);
            }
            else {
                selection.concatWithNoDuplicate(this.entries);
            }
        }
    }
    /**
     * Test if the current block intersect with the given ray and if yes, then add its content to the selection array
     * @param ray defines the ray to test with
     * @param selection defines the array to store current content if selection is positive
     */
    intersectsRay(ray, selection) {
        if (ray.intersectsBoxMinMax(this._minPoint, this._maxPoint)) {
            if (this.blocks) {
                for (let index = 0; index < this.blocks.length; index++) {
                    const block = this.blocks[index];
                    block.intersectsRay(ray, selection);
                }
                return;
            }
            selection.concatWithNoDuplicate(this.entries);
        }
    }
    /**
     * Subdivide the content into child blocks (this block will then be empty)
     */
    createInnerBlocks() {
        OctreeBlock._CreateBlocks(this._minPoint, this._maxPoint, this.entries, this._capacity, this._depth, this._maxDepth, this, this._creationFunc);
        this.entries.splice(0);
    }
    /**
     * @internal
     */
    static _CreateBlocks(worldMin, worldMax, entries, maxBlockCapacity, currentDepth, maxDepth, target, creationFunc) {
        target.blocks = new Array();
        const blockSize = new Vector3((worldMax.x - worldMin.x) / 2, (worldMax.y - worldMin.y) / 2, (worldMax.z - worldMin.z) / 2);
        // Segmenting space
        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 2; y++) {
                for (let z = 0; z < 2; z++) {
                    const localMin = worldMin.add(blockSize.multiplyByFloats(x, y, z));
                    const localMax = worldMin.add(blockSize.multiplyByFloats(x + 1, y + 1, z + 1));
                    const block = new OctreeBlock(localMin, localMax, maxBlockCapacity, currentDepth + 1, maxDepth, creationFunc);
                    block.addEntries(entries);
                    target.blocks.push(block);
                }
            }
        }
    }
}
//# sourceMappingURL=octreeBlock.js.map