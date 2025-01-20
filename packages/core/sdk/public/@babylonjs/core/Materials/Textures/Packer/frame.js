/**
 * This is a support class for frame Data on texture packer sets.
 */
export class TexturePackerFrame {
    /**
     * Initializes a texture package frame.
     * @param id The numerical frame identifier
     * @param scale Scalar Vector2 for UV frame
     * @param offset Vector2 for the frame position in UV units.
     * @returns TexturePackerFrame
     */
    constructor(id, scale, offset) {
        this.id = id;
        this.scale = scale;
        this.offset = offset;
    }
}
//# sourceMappingURL=frame.js.map