/**
 * Check if a TextureSize is an object
 * @param size The TextureSize to check
 * @returns True if the TextureSize is an object
 */
export function textureSizeIsObject(size) {
    // eslint-disable-next-line jsdoc/require-jsdoc
    return size.width !== undefined;
}
/**
 * Get the width/height dimensions from a TextureSize
 * @param size The TextureSize to get the dimensions from
 * @returns The width and height as an object
 */
export function getDimensionsFromTextureSize(size) {
    if (textureSizeIsObject(size)) {
        return { width: size.width, height: size.height };
    }
    return { width: size, height: size };
}
//# sourceMappingURL=textureCreationOptions.js.map