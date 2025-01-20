import { __decorate } from "../tslib.es6.js";
import { serialize, serializeAsTexture } from "../Misc/decorators.js";
import { Matrix, Vector3 } from "../Maths/math.vector.js";
import { Node } from "../node.js";
import { Light } from "./light.js";
import { ShadowLight } from "./shadowLight.js";
import { Texture } from "../Materials/Textures/texture.js";
import { RegisterClass } from "../Misc/typeStore.js";

Node.AddNodeConstructor("Light_Type_2", (name, scene) => {
    return () => new SpotLight(name, Vector3.Zero(), Vector3.Zero(), 0, 0, scene);
});
/**
 * A spot light is defined by a position, a direction, an angle, and an exponent.
 * These values define a cone of light starting from the position, emitting toward the direction.
 * The angle, in radians, defines the size (field of illumination) of the spotlight's conical beam,
 * and the exponent defines the speed of the decay of the light with distance (reach).
 * Documentation: https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
 */
export class SpotLight extends ShadowLight {
    /**
     * Gets or sets the IES profile texture used to create the spotlight
     * #UIAXAU#1
     */
    get iesProfileTexture() {
        return this._iesProfileTexture;
    }
    set iesProfileTexture(value) {
        if (this._iesProfileTexture === value) {
            return;
        }
        this._iesProfileTexture = value;
        if (this._iesProfileTexture && SpotLight._IsTexture(this._iesProfileTexture)) {
            this._iesProfileTexture.onLoadObservable.addOnce(() => {
                this._markMeshesAsLightDirty();
            });
        }
    }
    /**
     * Gets the cone angle of the spot light in Radians.
     */
    get angle() {
        return this._angle;
    }
    /**
     * Sets the cone angle of the spot light in Radians.
     */
    set angle(value) {
        this._angle = value;
        this._cosHalfAngle = Math.cos(value * 0.5);
        this._projectionTextureProjectionLightDirty = true;
        this.forceProjectionMatrixCompute();
        this._computeAngleValues();
    }
    /**
     * Only used in gltf falloff mode, this defines the angle where
     * the directional falloff will start before cutting at angle which could be seen
     * as outer angle.
     */
    get innerAngle() {
        return this._innerAngle;
    }
    /**
     * Only used in gltf falloff mode, this defines the angle where
     * the directional falloff will start before cutting at angle which could be seen
     * as outer angle.
     */
    set innerAngle(value) {
        this._innerAngle = value;
        this._computeAngleValues();
    }
    /**
     * Allows scaling the angle of the light for shadow generation only.
     */
    get shadowAngleScale() {
        return this._shadowAngleScale;
    }
    /**
     * Allows scaling the angle of the light for shadow generation only.
     */
    set shadowAngleScale(value) {
        this._shadowAngleScale = value;
        this.forceProjectionMatrixCompute();
    }
    /**
     * Allows reading the projection texture
     */
    get projectionTextureMatrix() {
        return this._projectionTextureMatrix;
    }
    /**
     * Gets the near clip of the Spotlight for texture projection.
     */
    get projectionTextureLightNear() {
        return this._projectionTextureLightNear;
    }
    /**
     * Sets the near clip of the Spotlight for texture projection.
     */
    set projectionTextureLightNear(value) {
        this._projectionTextureLightNear = value;
        this._projectionTextureProjectionLightDirty = true;
    }
    /**
     * Gets the far clip of the Spotlight for texture projection.
     */
    get projectionTextureLightFar() {
        return this._projectionTextureLightFar;
    }
    /**
     * Sets the far clip of the Spotlight for texture projection.
     */
    set projectionTextureLightFar(value) {
        this._projectionTextureLightFar = value;
        this._projectionTextureProjectionLightDirty = true;
    }
    /**
     * Gets the Up vector of the Spotlight for texture projection.
     */
    get projectionTextureUpDirection() {
        return this._projectionTextureUpDirection;
    }
    /**
     * Sets the Up vector of the Spotlight for texture projection.
     */
    set projectionTextureUpDirection(value) {
        this._projectionTextureUpDirection = value;
        this._projectionTextureProjectionLightDirty = true;
    }
    /**
     * Gets the projection texture of the light.
     */
    get projectionTexture() {
        return this._projectionTexture;
    }
    /**
     * Sets the projection texture of the light.
     */
    set projectionTexture(value) {
        if (this._projectionTexture === value) {
            return;
        }
        this._projectionTexture = value;
        this._projectionTextureDirty = true;
        if (this._projectionTexture && !this._projectionTexture.isReady()) {
            if (SpotLight._IsProceduralTexture(this._projectionTexture)) {
                this._projectionTexture.getEffect().executeWhenCompiled(() => {
                    this._markMeshesAsLightDirty();
                });
            }
            else if (SpotLight._IsTexture(this._projectionTexture)) {
                this._projectionTexture.onLoadObservable.addOnce(() => {
                    this._markMeshesAsLightDirty();
                });
            }
        }
    }
    static _IsProceduralTexture(texture) {
        return texture.onGeneratedObservable !== undefined;
    }
    static _IsTexture(texture) {
        return texture.onLoadObservable !== undefined;
    }
    /**
     * Gets or sets the light projection matrix as used by the projection texture
     */
    get projectionTextureProjectionLightMatrix() {
        return this._projectionTextureProjectionLightMatrix;
    }
    set projectionTextureProjectionLightMatrix(projection) {
        this._projectionTextureProjectionLightMatrix = projection;
        this._projectionTextureProjectionLightDirty = false;
        this._projectionTextureDirty = true;
    }
    /**
     * Creates a SpotLight object in the scene. A spot light is a simply light oriented cone.
     * It can cast shadows.
     * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
     * @param name The light friendly name
     * @param position The position of the spot light in the scene
     * @param direction The direction of the light in the scene
     * @param angle The cone angle of the light in Radians
     * @param exponent The light decay speed with the distance from the emission spot
     * @param scene The scene the lights belongs to
     */
    constructor(name, position, direction, angle, exponent, scene) {
        super(name, scene);
        this._innerAngle = 0;
        this._iesProfileTexture = null;
        this._projectionTextureMatrix = Matrix.Zero();
        this._projectionTextureLightNear = 1e-6;
        this._projectionTextureLightFar = 1000.0;
        this._projectionTextureUpDirection = Vector3.Up();
        this._projectionTextureViewLightDirty = true;
        this._projectionTextureProjectionLightDirty = true;
        this._projectionTextureDirty = true;
        this._projectionTextureViewTargetVector = Vector3.Zero();
        this._projectionTextureViewLightMatrix = Matrix.Zero();
        this._projectionTextureProjectionLightMatrix = Matrix.Zero();
        this._projectionTextureScalingMatrix = Matrix.FromValues(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);
        this.position = position;
        this.direction = direction;
        this.angle = angle;
        this.exponent = exponent;
    }
    /**
     * Returns the string "SpotLight".
     * @returns the class name
     */
    getClassName() {
        return "SpotLight";
    }
    /**
     * Returns the integer 2.
     * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
     */
    getTypeID() {
        return Light.LIGHTTYPEID_SPOTLIGHT;
    }
    /**
     * Overrides the direction setter to recompute the projection texture view light Matrix.
     * @param value
     */
    _setDirection(value) {
        super._setDirection(value);
        this._projectionTextureViewLightDirty = true;
    }
    /**
     * Overrides the position setter to recompute the projection texture view light Matrix.
     * @param value
     */
    _setPosition(value) {
        super._setPosition(value);
        this._projectionTextureViewLightDirty = true;
    }
    /**
     * Sets the passed matrix "matrix" as perspective projection matrix for the shadows and the passed view matrix with the fov equal to the SpotLight angle and and aspect ratio of 1.0.
     * Returns the SpotLight.
     * @param matrix
     * @param viewMatrix
     * @param renderList
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setDefaultShadowProjectionMatrix(matrix, viewMatrix, renderList) {
        const activeCamera = this.getScene().activeCamera;
        if (!activeCamera) {
            return;
        }
        this._shadowAngleScale = this._shadowAngleScale || 1;
        const angle = this._shadowAngleScale * this._angle;
        const minZ = this.shadowMinZ !== undefined ? this.shadowMinZ : activeCamera.minZ;
        const maxZ = this.shadowMaxZ !== undefined ? this.shadowMaxZ : activeCamera.maxZ;
        const useReverseDepthBuffer = this.getScene().getEngine().useReverseDepthBuffer;
        Matrix.PerspectiveFovLHToRef(angle, 1.0, useReverseDepthBuffer ? maxZ : minZ, useReverseDepthBuffer ? minZ : maxZ, matrix, true, this._scene.getEngine().isNDCHalfZRange, undefined, useReverseDepthBuffer);
    }
    _computeProjectionTextureViewLightMatrix() {
        this._projectionTextureViewLightDirty = false;
        this._projectionTextureDirty = true;
        this.getAbsolutePosition().addToRef(this.getShadowDirection(), this._projectionTextureViewTargetVector);
        Matrix.LookAtLHToRef(this.getAbsolutePosition(), this._projectionTextureViewTargetVector, this._projectionTextureUpDirection, this._projectionTextureViewLightMatrix);
    }
    _computeProjectionTextureProjectionLightMatrix() {
        this._projectionTextureProjectionLightDirty = false;
        this._projectionTextureDirty = true;
        const lightFar = this.projectionTextureLightFar;
        const lightNear = this.projectionTextureLightNear;
        const P = lightFar / (lightFar - lightNear);
        const Q = -P * lightNear;
        const S = 1.0 / Math.tan(this._angle / 2.0);
        const A = 1.0;
        Matrix.FromValuesToRef(S / A, 0.0, 0.0, 0.0, 0.0, S, 0.0, 0.0, 0.0, 0.0, P, 1.0, 0.0, 0.0, Q, 0.0, this._projectionTextureProjectionLightMatrix);
    }
    /**
     * Main function for light texture projection matrix computing.
     */
    _computeProjectionTextureMatrix() {
        this._projectionTextureDirty = false;
        this._projectionTextureViewLightMatrix.multiplyToRef(this._projectionTextureProjectionLightMatrix, this._projectionTextureMatrix);
        if (this._projectionTexture instanceof Texture) {
            const u = this._projectionTexture.uScale / 2.0;
            const v = this._projectionTexture.vScale / 2.0;
            Matrix.FromValuesToRef(u, 0.0, 0.0, 0.0, 0.0, v, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0, this._projectionTextureScalingMatrix);
        }
        this._projectionTextureMatrix.multiplyToRef(this._projectionTextureScalingMatrix, this._projectionTextureMatrix);
    }
    _buildUniformLayout() {
        this._uniformBuffer.addUniform("vLightData", 4);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        this._uniformBuffer.addUniform("vLightDirection", 3);
        this._uniformBuffer.addUniform("vLightFalloff", 4);
        this._uniformBuffer.addUniform("shadowsInfo", 3);
        this._uniformBuffer.addUniform("depthValues", 2);
        this._uniformBuffer.create();
    }
    _computeAngleValues() {
        this._lightAngleScale = 1.0 / Math.max(0.001, Math.cos(this._innerAngle * 0.5) - this._cosHalfAngle);
        this._lightAngleOffset = -this._cosHalfAngle * this._lightAngleScale;
    }
    /**
     * Sets the passed Effect "effect" with the Light textures.
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The light
     */
    transferTexturesToEffect(effect, lightIndex) {
        if (this.projectionTexture && this.projectionTexture.isReady()) {
            if (this._projectionTextureViewLightDirty) {
                this._computeProjectionTextureViewLightMatrix();
            }
            if (this._projectionTextureProjectionLightDirty) {
                this._computeProjectionTextureProjectionLightMatrix();
            }
            if (this._projectionTextureDirty) {
                this._computeProjectionTextureMatrix();
            }
            effect.setMatrix("textureProjectionMatrix" + lightIndex, this._projectionTextureMatrix);
            effect.setTexture("projectionLightTexture" + lightIndex, this.projectionTexture);
        }
        if (this._iesProfileTexture && this._iesProfileTexture.isReady()) {
            effect.setTexture("iesLightTexture" + lightIndex, this._iesProfileTexture);
        }
        return this;
    }
    /**
     * Sets the passed Effect object with the SpotLight transformed position (or position if not parented) and normalized direction.
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The spot light
     */
    transferToEffect(effect, lightIndex) {
        let normalizeDirection;
        if (this.computeTransformedInformation()) {
            this._uniformBuffer.updateFloat4("vLightData", this.transformedPosition.x, this.transformedPosition.y, this.transformedPosition.z, this.exponent, lightIndex);
            normalizeDirection = Vector3.Normalize(this.transformedDirection);
        }
        else {
            this._uniformBuffer.updateFloat4("vLightData", this.position.x, this.position.y, this.position.z, this.exponent, lightIndex);
            normalizeDirection = Vector3.Normalize(this.direction);
        }
        this._uniformBuffer.updateFloat4("vLightDirection", normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, this._cosHalfAngle, lightIndex);
        this._uniformBuffer.updateFloat4("vLightFalloff", this.range, this._inverseSquaredRange, this._lightAngleScale, this._lightAngleOffset, lightIndex);
        return this;
    }
    transferToNodeMaterialEffect(effect, lightDataUniformName) {
        let normalizeDirection;
        if (this.computeTransformedInformation()) {
            normalizeDirection = Vector3.Normalize(this.transformedDirection);
        }
        else {
            normalizeDirection = Vector3.Normalize(this.direction);
        }
        if (this.getScene().useRightHandedSystem) {
            effect.setFloat3(lightDataUniformName, -normalizeDirection.x, -normalizeDirection.y, -normalizeDirection.z);
        }
        else {
            effect.setFloat3(lightDataUniformName, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z);
        }
        return this;
    }
    /**
     * Disposes the light and the associated resources.
     */
    dispose() {
        super.dispose();
        if (this._projectionTexture) {
            this._projectionTexture.dispose();
        }
        if (this._iesProfileTexture) {
            this._iesProfileTexture.dispose();
            this._iesProfileTexture = null;
        }
    }
    /**
     * Gets the minZ used for shadow according to both the scene and the light.
     * @param activeCamera The camera we are returning the min for
     * @returns the depth min z
     */
    getDepthMinZ(activeCamera) {
        const engine = this._scene.getEngine();
        const minZ = this.shadowMinZ !== undefined ? this.shadowMinZ : (activeCamera?.minZ ?? 0);
        return engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? minZ : this._scene.getEngine().isNDCHalfZRange ? 0 : minZ;
    }
    /**
     * Gets the maxZ used for shadow according to both the scene and the light.
     * @param activeCamera The camera we are returning the max for
     * @returns the depth max z
     */
    getDepthMaxZ(activeCamera) {
        const engine = this._scene.getEngine();
        const maxZ = this.shadowMaxZ !== undefined ? this.shadowMaxZ : (activeCamera?.maxZ ?? 10000);
        return engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : maxZ;
    }
    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    prepareLightSpecificDefines(defines, lightIndex) {
        defines["SPOTLIGHT" + lightIndex] = true;
        defines["PROJECTEDLIGHTTEXTURE" + lightIndex] = this.projectionTexture && this.projectionTexture.isReady() ? true : false;
        defines["IESLIGHTTEXTURE" + lightIndex] = this._iesProfileTexture && this._iesProfileTexture.isReady() ? true : false;
    }
}
__decorate([
    serialize()
], SpotLight.prototype, "angle", null);
__decorate([
    serialize()
], SpotLight.prototype, "innerAngle", null);
__decorate([
    serialize()
], SpotLight.prototype, "shadowAngleScale", null);
__decorate([
    serialize()
], SpotLight.prototype, "exponent", void 0);
__decorate([
    serialize()
], SpotLight.prototype, "projectionTextureLightNear", null);
__decorate([
    serialize()
], SpotLight.prototype, "projectionTextureLightFar", null);
__decorate([
    serialize()
], SpotLight.prototype, "projectionTextureUpDirection", null);
__decorate([
    serializeAsTexture("projectedLightTexture")
], SpotLight.prototype, "_projectionTexture", void 0);
// Register Class Name
RegisterClass("BABYLON.SpotLight", SpotLight);
//# sourceMappingURL=spotLight.js.map