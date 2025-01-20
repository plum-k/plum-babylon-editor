import { __decorate } from "../tslib.es6.js";
import { serialize } from "../Misc/decorators.js";
import { Matrix, Vector3 } from "../Maths/math.vector.js";
import { Node } from "../node.js";
import { Light } from "./light.js";
import { ShadowLight } from "./shadowLight.js";
import { RegisterClass } from "../Misc/typeStore.js";

Node.AddNodeConstructor("Light_Type_1", (name, scene) => {
    return () => new DirectionalLight(name, Vector3.Zero(), scene);
});
/**
 * A directional light is defined by a direction (what a surprise!).
 * The light is emitted from everywhere in the specified direction, and has an infinite range.
 * An example of a directional light is when a distance planet is lit by the apparently parallel lines of light from its sun. Light in a downward direction will light the top of an object.
 * Documentation: https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
 */
export class DirectionalLight extends ShadowLight {
    /**
     * Fix frustum size for the shadow generation. This is disabled if the value is 0.
     */
    get shadowFrustumSize() {
        return this._shadowFrustumSize;
    }
    /**
     * Specifies a fix frustum size for the shadow generation.
     */
    set shadowFrustumSize(value) {
        this._shadowFrustumSize = value;
        this.forceProjectionMatrixCompute();
    }
    /**
     * Gets the shadow projection scale against the optimal computed one.
     * 0.1 by default which means that the projection window is increase by 10% from the optimal size.
     * This does not impact in fixed frustum size (shadowFrustumSize being set)
     */
    get shadowOrthoScale() {
        return this._shadowOrthoScale;
    }
    /**
     * Sets the shadow projection scale against the optimal computed one.
     * 0.1 by default which means that the projection window is increase by 10% from the optimal size.
     * This does not impact in fixed frustum size (shadowFrustumSize being set)
     */
    set shadowOrthoScale(value) {
        this._shadowOrthoScale = value;
        this.forceProjectionMatrixCompute();
    }
    /**
     * Gets or sets the orthoLeft property used to build the light frustum
     */
    get orthoLeft() {
        return this._orthoLeft;
    }
    set orthoLeft(left) {
        this._orthoLeft = left;
    }
    /**
     * Gets or sets the orthoRight property used to build the light frustum
     */
    get orthoRight() {
        return this._orthoRight;
    }
    set orthoRight(right) {
        this._orthoRight = right;
    }
    /**
     * Gets or sets the orthoTop property used to build the light frustum
     */
    get orthoTop() {
        return this._orthoTop;
    }
    set orthoTop(top) {
        this._orthoTop = top;
    }
    /**
     * Gets or sets the orthoBottom property used to build the light frustum
     */
    get orthoBottom() {
        return this._orthoBottom;
    }
    set orthoBottom(bottom) {
        this._orthoBottom = bottom;
    }
    /**
     * Creates a DirectionalLight object in the scene, oriented towards the passed direction (Vector3).
     * The directional light is emitted from everywhere in the given direction.
     * It can cast shadows.
     * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
     * @param name The friendly name of the light
     * @param direction The direction of the light
     * @param scene The scene the light belongs to
     */
    constructor(name, direction, scene) {
        super(name, scene);
        this._shadowFrustumSize = 0;
        this._shadowOrthoScale = 0.1;
        /**
         * Automatically compute the projection matrix to best fit (including all the casters)
         * on each frame.
         */
        this.autoUpdateExtends = true;
        /**
         * Automatically compute the shadowMinZ and shadowMaxZ for the projection matrix to best fit (including all the casters)
         * on each frame. autoUpdateExtends must be set to true for this to work
         */
        this.autoCalcShadowZBounds = false;
        // Cache
        this._orthoLeft = Number.MAX_VALUE;
        this._orthoRight = Number.MIN_VALUE;
        this._orthoTop = Number.MIN_VALUE;
        this._orthoBottom = Number.MAX_VALUE;
        this.position = direction.scale(-1.0);
        this.direction = direction;
    }
    /**
     * Returns the string "DirectionalLight".
     * @returns The class name
     */
    getClassName() {
        return "DirectionalLight";
    }
    /**
     * Returns the integer 1.
     * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
     */
    getTypeID() {
        return Light.LIGHTTYPEID_DIRECTIONALLIGHT;
    }
    /**
     * Sets the passed matrix "matrix" as projection matrix for the shadows cast by the light according to the passed view matrix.
     * Returns the DirectionalLight Shadow projection matrix.
     * @param matrix
     * @param viewMatrix
     * @param renderList
     */
    _setDefaultShadowProjectionMatrix(matrix, viewMatrix, renderList) {
        if (this.shadowFrustumSize > 0) {
            this._setDefaultFixedFrustumShadowProjectionMatrix(matrix);
        }
        else {
            this._setDefaultAutoExtendShadowProjectionMatrix(matrix, viewMatrix, renderList);
        }
    }
    /**
     * Sets the passed matrix "matrix" as fixed frustum projection matrix for the shadows cast by the light according to the passed view matrix.
     * Returns the DirectionalLight Shadow projection matrix.
     * @param matrix
     */
    _setDefaultFixedFrustumShadowProjectionMatrix(matrix) {
        const activeCamera = this.getScene().activeCamera;
        if (!activeCamera) {
            return;
        }
        Matrix.OrthoLHToRef(this.shadowFrustumSize, this.shadowFrustumSize, this.shadowMinZ !== undefined ? this.shadowMinZ : activeCamera.minZ, this.shadowMaxZ !== undefined ? this.shadowMaxZ : activeCamera.maxZ, matrix, this.getScene().getEngine().isNDCHalfZRange);
    }
    /**
     * Sets the passed matrix "matrix" as auto extend projection matrix for the shadows cast by the light according to the passed view matrix.
     * Returns the DirectionalLight Shadow projection matrix.
     * @param matrix
     * @param viewMatrix
     * @param renderList
     */
    _setDefaultAutoExtendShadowProjectionMatrix(matrix, viewMatrix, renderList) {
        const activeCamera = this.getScene().activeCamera;
        // Check extends
        if (this.autoUpdateExtends || this._orthoLeft === Number.MAX_VALUE) {
            const tempVector3 = Vector3.Zero();
            this._orthoLeft = Number.MAX_VALUE;
            this._orthoRight = -Number.MAX_VALUE;
            this._orthoTop = -Number.MAX_VALUE;
            this._orthoBottom = Number.MAX_VALUE;
            let shadowMinZ = Number.MAX_VALUE;
            let shadowMaxZ = -Number.MAX_VALUE;
            for (let meshIndex = 0; meshIndex < renderList.length; meshIndex++) {
                const mesh = renderList[meshIndex];
                if (!mesh) {
                    continue;
                }
                const boundingInfo = mesh.getBoundingInfo();
                const boundingBox = boundingInfo.boundingBox;
                for (let index = 0; index < boundingBox.vectorsWorld.length; index++) {
                    Vector3.TransformCoordinatesToRef(boundingBox.vectorsWorld[index], viewMatrix, tempVector3);
                    if (tempVector3.x < this._orthoLeft) {
                        this._orthoLeft = tempVector3.x;
                    }
                    if (tempVector3.y < this._orthoBottom) {
                        this._orthoBottom = tempVector3.y;
                    }
                    if (tempVector3.x > this._orthoRight) {
                        this._orthoRight = tempVector3.x;
                    }
                    if (tempVector3.y > this._orthoTop) {
                        this._orthoTop = tempVector3.y;
                    }
                    if (this.autoCalcShadowZBounds) {
                        if (tempVector3.z < shadowMinZ) {
                            shadowMinZ = tempVector3.z;
                        }
                        if (tempVector3.z > shadowMaxZ) {
                            shadowMaxZ = tempVector3.z;
                        }
                    }
                }
            }
            if (this.autoCalcShadowZBounds) {
                this._shadowMinZ = shadowMinZ;
                this._shadowMaxZ = shadowMaxZ;
            }
        }
        const xOffset = this._orthoRight - this._orthoLeft;
        const yOffset = this._orthoTop - this._orthoBottom;
        const minZ = this.shadowMinZ !== undefined ? this.shadowMinZ : activeCamera?.minZ || 0;
        const maxZ = this.shadowMaxZ !== undefined ? this.shadowMaxZ : activeCamera?.maxZ || 10000;
        const useReverseDepthBuffer = this.getScene().getEngine().useReverseDepthBuffer;
        Matrix.OrthoOffCenterLHToRef(this._orthoLeft - xOffset * this.shadowOrthoScale, this._orthoRight + xOffset * this.shadowOrthoScale, this._orthoBottom - yOffset * this.shadowOrthoScale, this._orthoTop + yOffset * this.shadowOrthoScale, useReverseDepthBuffer ? maxZ : minZ, useReverseDepthBuffer ? minZ : maxZ, matrix, this.getScene().getEngine().isNDCHalfZRange);
    }
    _buildUniformLayout() {
        this._uniformBuffer.addUniform("vLightData", 4);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        this._uniformBuffer.addUniform("shadowsInfo", 3);
        this._uniformBuffer.addUniform("depthValues", 2);
        this._uniformBuffer.create();
    }
    /**
     * Sets the passed Effect object with the DirectionalLight transformed position (or position if not parented) and the passed name.
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The directional light
     */
    transferToEffect(effect, lightIndex) {
        if (this.computeTransformedInformation()) {
            this._uniformBuffer.updateFloat4("vLightData", this.transformedDirection.x, this.transformedDirection.y, this.transformedDirection.z, 1, lightIndex);
            return this;
        }
        this._uniformBuffer.updateFloat4("vLightData", this.direction.x, this.direction.y, this.direction.z, 1, lightIndex);
        return this;
    }
    transferToNodeMaterialEffect(effect, lightDataUniformName) {
        if (this.computeTransformedInformation()) {
            effect.setFloat3(lightDataUniformName, this.transformedDirection.x, this.transformedDirection.y, this.transformedDirection.z);
            return this;
        }
        effect.setFloat3(lightDataUniformName, this.direction.x, this.direction.y, this.direction.z);
        return this;
    }
    /**
     * Gets the minZ used for shadow according to both the scene and the light.
     *
     * Values are fixed on directional lights as it relies on an ortho projection hence the need to convert being
     * -1 and 1 to 0 and 1 doing (depth + min) / (min + max) -> (depth + 1) / (1 + 1) -> (depth * 0.5) + 0.5.
     * (when not using reverse depth buffer / NDC half Z range)
     * @param _activeCamera The camera we are returning the min for (not used)
     * @returns the depth min z
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getDepthMinZ(_activeCamera) {
        const engine = this._scene.getEngine();
        return !engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
    }
    /**
     * Gets the maxZ used for shadow according to both the scene and the light.
     *
     * Values are fixed on directional lights as it relies on an ortho projection hence the need to convert being
     * -1 and 1 to 0 and 1 doing (depth + min) / (min + max) -> (depth + 1) / (1 + 1) -> (depth * 0.5) + 0.5.
     * (when not using reverse depth buffer / NDC half Z range)
     * @param _activeCamera The camera we are returning the max for
     * @returns the depth max z
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getDepthMaxZ(_activeCamera) {
        const engine = this._scene.getEngine();
        return engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
    }
    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    prepareLightSpecificDefines(defines, lightIndex) {
        defines["DIRLIGHT" + lightIndex] = true;
    }
}
__decorate([
    serialize()
], DirectionalLight.prototype, "shadowFrustumSize", null);
__decorate([
    serialize()
], DirectionalLight.prototype, "shadowOrthoScale", null);
__decorate([
    serialize()
], DirectionalLight.prototype, "autoUpdateExtends", void 0);
__decorate([
    serialize()
], DirectionalLight.prototype, "autoCalcShadowZBounds", void 0);
__decorate([
    serialize("orthoLeft")
], DirectionalLight.prototype, "_orthoLeft", void 0);
__decorate([
    serialize("orthoRight")
], DirectionalLight.prototype, "_orthoRight", void 0);
__decorate([
    serialize("orthoTop")
], DirectionalLight.prototype, "_orthoTop", void 0);
__decorate([
    serialize("orthoBottom")
], DirectionalLight.prototype, "_orthoBottom", void 0);
// Register Class Name
RegisterClass("BABYLON.DirectionalLight", DirectionalLight);
//# sourceMappingURL=directionalLight.js.map