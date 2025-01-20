import { CubeMapToSphericalPolynomialTools } from "../../Misc/HighDynamicRange/cubemapToSphericalPolynomial.js";
import { BaseTexture } from "./baseTexture.js";
BaseTexture.prototype.forceSphericalPolynomialsRecompute = function () {
    if (this._texture) {
        this._texture._sphericalPolynomial = null;
        this._texture._sphericalPolynomialPromise = null;
        this._texture._sphericalPolynomialComputed = false;
    }
};
Object.defineProperty(BaseTexture.prototype, "sphericalPolynomial", {
    get: function () {
        if (this._texture) {
            if (this._texture._sphericalPolynomial || this._texture._sphericalPolynomialComputed) {
                return this._texture._sphericalPolynomial;
            }
            if (this._texture.isReady) {
                if (!this._texture._sphericalPolynomialPromise) {
                    this._texture._sphericalPolynomialPromise = CubeMapToSphericalPolynomialTools.ConvertCubeMapTextureToSphericalPolynomial(this);
                    if (this._texture._sphericalPolynomialPromise === null) {
                        this._texture._sphericalPolynomialComputed = true;
                    }
                    else {
                        this._texture._sphericalPolynomialPromise.then((sphericalPolynomial) => {
                            this._texture._sphericalPolynomial = sphericalPolynomial;
                            this._texture._sphericalPolynomialComputed = true;
                        });
                    }
                }
                return null;
            }
        }
        return null;
    },
    set: function (value) {
        if (this._texture) {
            this._texture._sphericalPolynomial = value;
        }
    },
    enumerable: true,
    configurable: true,
});
//# sourceMappingURL=baseTexture.polynomial.js.map