import { RawTexture } from "../Materials/Textures/rawTexture.js";
import { Texture } from "../Materials/Textures/texture.js";
import { EncodeArrayBufferToBase64, DecodeBase64ToBinary } from "../Misc/stringTools.js";

import { Skeleton } from "../Bones/skeleton.js";
/**
 * Class to bake vertex animation textures.
 * @since 5.0
 */
export class VertexAnimationBaker {
    /**
     * Create a new VertexAnimationBaker object which can help baking animations into a texture.
     * @param scene Defines the scene the VAT belongs to
     * @param meshOrSkeleton Defines the skeleton or the mesh from which to retrieve the skeleton from.
     */
    constructor(scene, meshOrSkeleton) {
        this._scene = scene;
        if (meshOrSkeleton instanceof Skeleton) {
            this._skeleton = meshOrSkeleton;
            this._mesh = null;
        }
        else {
            this._mesh = meshOrSkeleton;
            this._skeleton = meshOrSkeleton.skeleton;
        }
    }
    /**
     * Bakes the animation into the texture. This should be called once, when the
     * scene starts, so the VAT is generated and associated to the mesh.
     * @param ranges Defines the ranges in the animation that will be baked.
     * @returns The array of matrix transforms for each vertex (columns) and frame (rows), as a Float32Array.
     */
    async bakeVertexData(ranges) {
        if (!this._skeleton) {
            throw new Error("No skeleton provided.");
        }
        const boneCount = this._skeleton.bones.length;
        /** total number of frames in our animations */
        const frameCount = ranges.reduce((previous, current) => previous + current.to - current.from + 1, 0);
        if (isNaN(frameCount)) {
            throw new Error("Invalid animation ranges.");
        }
        // reset our loop data
        let textureIndex = 0;
        const textureSize = (boneCount + 1) * 4 * 4 * frameCount;
        const vertexData = new Float32Array(textureSize);
        this._scene.stopAnimation(this._skeleton);
        this._skeleton.returnToRest();
        // render all frames from our slices
        for (const range of ranges) {
            for (let frameIndex = range.from; frameIndex <= range.to; frameIndex++) {
                await this._executeAnimationFrame(vertexData, frameIndex, textureIndex++);
            }
        }
        return vertexData;
    }
    /**
     * Runs an animation frame and stores its vertex data
     *
     * @param vertexData The array to save data to.
     * @param frameIndex Current frame in the skeleton animation to render.
     * @param textureIndex Current index of the texture data.
     */
    async _executeAnimationFrame(vertexData, frameIndex, textureIndex) {
        return new Promise((resolve, _reject) => {
            this._scene.beginAnimation(this._skeleton, frameIndex, frameIndex, false, 1.0, () => {
                // generate matrices
                const skeletonMatrices = this._skeleton.getTransformMatrices(this._mesh);
                vertexData.set(skeletonMatrices, textureIndex * skeletonMatrices.length);
                resolve();
            });
        });
    }
    /**
     * Builds a vertex animation texture given the vertexData in an array.
     * @param vertexData The vertex animation data. You can generate it with bakeVertexData().
     * @returns The vertex animation texture to be used with BakedVertexAnimationManager.
     */
    textureFromBakedVertexData(vertexData) {
        if (!this._skeleton) {
            throw new Error("No skeleton provided.");
        }
        const boneCount = this._skeleton.bones.length;
        const texture = RawTexture.CreateRGBATexture(vertexData, (boneCount + 1) * 4, vertexData.length / ((boneCount + 1) * 4 * 4), this._scene, false, false, Texture.NEAREST_NEAREST, 1);
        texture.name = "VAT" + this._skeleton.name;
        return texture;
    }
    /**
     * Serializes our vertexData to an object, with a nice string for the vertexData.
     * @param vertexData The vertex array data.
     * @returns This object serialized to a JS dict.
     */
    serializeBakedVertexDataToObject(vertexData) {
        if (!this._skeleton) {
            throw new Error("No skeleton provided.");
        }
        // this converts the float array to a serialized base64 string, ~1.3x larger
        // than the original.
        const boneCount = this._skeleton.bones.length;
        const width = (boneCount + 1) * 4;
        const height = vertexData.length / ((boneCount + 1) * 4 * 4);
        const data = {
            vertexData: EncodeArrayBufferToBase64(vertexData),
            width,
            height,
        };
        return data;
    }
    /**
     * Loads previously baked data.
     * @param data The object as serialized by serializeBakedVertexDataToObject()
     * @returns The array of matrix transforms for each vertex (columns) and frame (rows), as a Float32Array.
     */
    loadBakedVertexDataFromObject(data) {
        return new Float32Array(DecodeBase64ToBinary(data.vertexData));
    }
    /**
     * Serializes our vertexData to a JSON string, with a nice string for the vertexData.
     * Should be called right after bakeVertexData().
     * @param vertexData The vertex array data.
     * @returns This object serialized to a safe string.
     */
    serializeBakedVertexDataToJSON(vertexData) {
        return JSON.stringify(this.serializeBakedVertexDataToObject(vertexData));
    }
    /**
     * Loads previously baked data in string format.
     * @param json The json string as serialized by serializeBakedVertexDataToJSON().
     * @returns The array of matrix transforms for each vertex (columns) and frame (rows), as a Float32Array.
     */
    loadBakedVertexDataFromJSON(json) {
        return this.loadBakedVertexDataFromObject(JSON.parse(json));
    }
}
//# sourceMappingURL=vertexAnimationBaker.js.map