import { Engine } from "../engine.js";
function transformTextureUrl(url) {
    const excludeFn = (entry) => {
        const strRegExPattern = "\\b" + entry + "\\b";
        return url && (url === entry || url.match(new RegExp(strRegExPattern, "g")));
    };
    if (this._excludedCompressedTextures && this._excludedCompressedTextures.some(excludeFn)) {
        return url;
    }
    const lastDot = url.lastIndexOf(".");
    const lastQuestionMark = url.lastIndexOf("?");
    const querystring = lastQuestionMark > -1 ? url.substring(lastQuestionMark, url.length) : "";
    return (lastDot > -1 ? url.substring(0, lastDot) : url) + this._textureFormatInUse + querystring;
}
Object.defineProperty(Engine.prototype, "texturesSupported", {
    get: function () {
        // Intelligently add supported compressed formats in order to check for.
        // Check for ASTC support first as it is most powerful and to be very cross platform.
        // Next PVRTC & DXT, which are probably superior to ETC1/2.
        // Likely no hardware which supports both PVR & DXT, so order matters little.
        // ETC2 is newer and handles ETC1 (no alpha capability), so check for first.
        const texturesSupported = [];
        if (this._caps.astc) {
            texturesSupported.push("-astc.ktx");
        }
        if (this._caps.s3tc) {
            texturesSupported.push("-dxt.ktx");
        }
        if (this._caps.pvrtc) {
            texturesSupported.push("-pvrtc.ktx");
        }
        if (this._caps.etc2) {
            texturesSupported.push("-etc2.ktx");
        }
        if (this._caps.etc1) {
            texturesSupported.push("-etc1.ktx");
        }
        return texturesSupported;
    },
    enumerable: true,
    configurable: true,
});
Object.defineProperty(Engine.prototype, "textureFormatInUse", {
    get: function () {
        return this._textureFormatInUse || null;
    },
    enumerable: true,
    configurable: true,
});
Engine.prototype.setCompressedTextureExclusions = function (skippedFiles) {
    this._excludedCompressedTextures = skippedFiles;
};
Engine.prototype.setTextureFormatToUse = function (formatsAvailable) {
    const texturesSupported = this.texturesSupported;
    for (let i = 0, len1 = texturesSupported.length; i < len1; i++) {
        for (let j = 0, len2 = formatsAvailable.length; j < len2; j++) {
            if (texturesSupported[i] === formatsAvailable[j].toLowerCase()) {
                this._transformTextureUrl = transformTextureUrl.bind(this);
                return (this._textureFormatInUse = texturesSupported[i]);
            }
        }
    }
    // actively set format to nothing, to allow this to be called more than once
    // and possibly fail the 2nd time
    this._textureFormatInUse = "";
    this._transformTextureUrl = null;
    return null;
};
//# sourceMappingURL=engine.textureSelector.js.map