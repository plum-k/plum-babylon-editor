import { __decorate } from "../tslib.es6.js";
import { serialize, serializeAsColor3, expandToProperty } from "../Misc/decorators.js";
import { Vector3 } from "../Maths/math.vector.js";
import { Color3, TmpColors } from "../Maths/math.color.js";
import { Node } from "../node.js";
import { UniformBuffer } from "../Materials/uniformBuffer.js";
import { GetClass } from "../Misc/typeStore.js";
import { LightConstants } from "./lightConstants.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
/**
 * Base class of all the lights in Babylon. It groups all the generic information about lights.
 * Lights are used, as you would expect, to affect how meshes are seen, in terms of both illumination and colour.
 * All meshes allow light to pass through them unless shadow generation is activated. The default number of lights allowed is four but this can be increased.
 */
export class Light extends Node {
    /**
     * Defines how far from the source the light is impacting in scene units.
     * Note: Unused in PBR material as the distance light falloff is defined following the inverse squared falloff.
     */
    get range() {
        return this._range;
    }
    /**
     * Defines how far from the source the light is impacting in scene units.
     * Note: Unused in PBR material as the distance light falloff is defined following the inverse squared falloff.
     */
    set range(value) {
        this._range = value;
        this._inverseSquaredRange = 1.0 / (this.range * this.range);
    }
    /**
     * Gets the photometric scale used to interpret the intensity.
     * This is only relevant with PBR Materials where the light intensity can be defined in a physical way.
     */
    get intensityMode() {
        return this._intensityMode;
    }
    /**
     * Sets the photometric scale used to interpret the intensity.
     * This is only relevant with PBR Materials where the light intensity can be defined in a physical way.
     */
    set intensityMode(value) {
        this._intensityMode = value;
        this._computePhotometricScale();
    }
    /**
     * Gets the light radius used by PBR Materials to simulate soft area lights.
     */
    get radius() {
        return this._radius;
    }
    /**
     * sets the light radius used by PBR Materials to simulate soft area lights.
     */
    set radius(value) {
        this._radius = value;
        this._computePhotometricScale();
    }
    /**
     * Gets whether or not the shadows are enabled for this light. This can help turning off/on shadow without detaching
     * the current shadow generator.
     */
    get shadowEnabled() {
        return this._shadowEnabled;
    }
    /**
     * Sets whether or not the shadows are enabled for this light. This can help turning off/on shadow without detaching
     * the current shadow generator.
     */
    set shadowEnabled(value) {
        if (this._shadowEnabled === value) {
            return;
        }
        this._shadowEnabled = value;
        this._markMeshesAsLightDirty();
    }
    /**
     * Gets the only meshes impacted by this light.
     */
    get includedOnlyMeshes() {
        return this._includedOnlyMeshes;
    }
    /**
     * Sets the only meshes impacted by this light.
     */
    set includedOnlyMeshes(value) {
        this._includedOnlyMeshes = value;
        this._hookArrayForIncludedOnly(value);
    }
    /**
     * Gets the meshes not impacted by this light.
     */
    get excludedMeshes() {
        return this._excludedMeshes;
    }
    /**
     * Sets the meshes not impacted by this light.
     */
    set excludedMeshes(value) {
        this._excludedMeshes = value;
        this._hookArrayForExcluded(value);
    }
    /**
     * Gets the layer id use to find what meshes are not impacted by the light.
     * Inactive if 0
     */
    get excludeWithLayerMask() {
        return this._excludeWithLayerMask;
    }
    /**
     * Sets the layer id use to find what meshes are not impacted by the light.
     * Inactive if 0
     */
    set excludeWithLayerMask(value) {
        this._excludeWithLayerMask = value;
        this._resyncMeshes();
    }
    /**
     * Gets the layer id use to find what meshes are impacted by the light.
     * Inactive if 0
     */
    get includeOnlyWithLayerMask() {
        return this._includeOnlyWithLayerMask;
    }
    /**
     * Sets the layer id use to find what meshes are impacted by the light.
     * Inactive if 0
     */
    set includeOnlyWithLayerMask(value) {
        this._includeOnlyWithLayerMask = value;
        this._resyncMeshes();
    }
    /**
     * Gets the lightmap mode of this light (should be one of the constants defined by Light.LIGHTMAP_x)
     */
    get lightmapMode() {
        return this._lightmapMode;
    }
    /**
     * Sets the lightmap mode of this light (should be one of the constants defined by Light.LIGHTMAP_x)
     */
    set lightmapMode(value) {
        if (this._lightmapMode === value) {
            return;
        }
        this._lightmapMode = value;
        this._markMeshesAsLightDirty();
    }
    /**
     * Returns the view matrix.
     * @param _faceIndex The index of the face for which we want to extract the view matrix. Only used for point light types.
     * @returns The view matrix. Can be null, if a view matrix cannot be defined for the type of light considered (as for a hemispherical light, for example).
     */
    getViewMatrix(_faceIndex) {
        return null;
    }
    /**
     * Returns the projection matrix.
     * Note that viewMatrix and renderList are optional and are only used by lights that calculate the projection matrix from a list of meshes (e.g. directional lights with automatic extents calculation).
     * @param _viewMatrix The view transform matrix of the light (optional).
     * @param _renderList The list of meshes to take into account when calculating the projection matrix (optional).
     * @returns The projection matrix. Can be null, if a projection matrix cannot be defined for the type of light considered (as for a hemispherical light, for example).
     */
    getProjectionMatrix(_viewMatrix, _renderList) {
        return null;
    }
    /**
     * Creates a Light object in the scene.
     * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
     * @param name The friendly name of the light
     * @param scene The scene the light belongs too
     */
    constructor(name, scene) {
        super(name, scene, false);
        /**
         * Diffuse gives the basic color to an object.
         */
        this.diffuse = new Color3(1.0, 1.0, 1.0);
        /**
         * Specular produces a highlight color on an object.
         * Note: This is not affecting PBR materials.
         */
        this.specular = new Color3(1.0, 1.0, 1.0);
        /**
         * Defines the falloff type for this light. This lets overriding how punctual light are
         * falling off base on range or angle.
         * This can be set to any values in Light.FALLOFF_x.
         *
         * Note: This is only useful for PBR Materials at the moment. This could be extended if required to
         * other types of materials.
         */
        this.falloffType = Light.FALLOFF_DEFAULT;
        /**
         * Strength of the light.
         * Note: By default it is define in the framework own unit.
         * Note: In PBR materials the intensityMode can be use to chose what unit the intensity is defined in.
         */
        this.intensity = 1.0;
        this._range = Number.MAX_VALUE;
        this._inverseSquaredRange = 0;
        /**
         * Cached photometric scale default to 1.0 as the automatic intensity mode defaults to 1.0 for every type
         * of light.
         */
        this._photometricScale = 1.0;
        this._intensityMode = Light.INTENSITYMODE_AUTOMATIC;
        this._radius = 0.00001;
        /**
         * Defines the rendering priority of the lights. It can help in case of fallback or number of lights
         * exceeding the number allowed of the materials.
         */
        this.renderPriority = 0;
        this._shadowEnabled = true;
        this._excludeWithLayerMask = 0;
        this._includeOnlyWithLayerMask = 0;
        this._lightmapMode = 0;
        /**
         * Shadow generators associated to the light.
         * @internal Internal use only.
         */
        this._shadowGenerators = null;
        /**
         * @internal Internal use only.
         */
        this._excludedMeshesIds = new Array();
        /**
         * @internal Internal use only.
         */
        this._includedOnlyMeshesIds = new Array();
        /** @internal */
        this._isLight = true;
        this.getScene().addLight(this);
        this._uniformBuffer = new UniformBuffer(this.getScene().getEngine(), undefined, undefined, name);
        this._buildUniformLayout();
        this.includedOnlyMeshes = [];
        this.excludedMeshes = [];
        this._resyncMeshes();
    }
    /**
     * Sets the passed Effect "effect" with the Light textures.
     * @param effect The effect to update
     * @param lightIndex The index of the light in the effect to update
     * @returns The light
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transferTexturesToEffect(effect, lightIndex) {
        // Do nothing by default.
        return this;
    }
    /**
     * Binds the lights information from the scene to the effect for the given mesh.
     * @param lightIndex Light index
     * @param scene The scene where the light belongs to
     * @param effect The effect we are binding the data to
     * @param useSpecular Defines if specular is supported
     * @param receiveShadows Defines if the effect (mesh) we bind the light for receives shadows
     */
    _bindLight(lightIndex, scene, effect, useSpecular, receiveShadows = true) {
        const iAsString = lightIndex.toString();
        let needUpdate = false;
        this._uniformBuffer.bindToEffect(effect, "Light" + iAsString);
        if (this._renderId !== scene.getRenderId() || this._lastUseSpecular !== useSpecular || !this._uniformBuffer.useUbo) {
            this._renderId = scene.getRenderId();
            this._lastUseSpecular = useSpecular;
            const scaledIntensity = this.getScaledIntensity();
            this.transferToEffect(effect, iAsString);
            this.diffuse.scaleToRef(scaledIntensity, TmpColors.Color3[0]);
            this._uniformBuffer.updateColor4("vLightDiffuse", TmpColors.Color3[0], this.range, iAsString);
            if (useSpecular) {
                this.specular.scaleToRef(scaledIntensity, TmpColors.Color3[1]);
                this._uniformBuffer.updateColor4("vLightSpecular", TmpColors.Color3[1], this.radius, iAsString);
            }
            needUpdate = true;
        }
        // Textures might still need to be rebound.
        this.transferTexturesToEffect(effect, iAsString);
        // Shadows
        if (scene.shadowsEnabled && this.shadowEnabled && receiveShadows) {
            const shadowGenerator = this.getShadowGenerator(scene.activeCamera) ?? this.getShadowGenerator();
            if (shadowGenerator) {
                shadowGenerator.bindShadowLight(iAsString, effect);
                needUpdate = true;
            }
        }
        if (needUpdate) {
            this._uniformBuffer.update();
        }
        else {
            this._uniformBuffer.bindUniformBuffer();
        }
    }
    /**
     * Returns the string "Light".
     * @returns the class name
     */
    getClassName() {
        return "Light";
    }
    /**
     * Converts the light information to a readable string for debug purpose.
     * @param fullDetails Supports for multiple levels of logging within scene loading
     * @returns the human readable light info
     */
    toString(fullDetails) {
        let ret = "Name: " + this.name;
        ret += ", type: " + ["Point", "Directional", "Spot", "Hemispheric"][this.getTypeID()];
        if (this.animations) {
            for (let i = 0; i < this.animations.length; i++) {
                ret += ", animation[0]: " + this.animations[i].toString(fullDetails);
            }
        }
        return ret;
    }
    /** @internal */
    _syncParentEnabledState() {
        super._syncParentEnabledState();
        if (!this.isDisposed()) {
            this._resyncMeshes();
        }
    }
    /**
     * Set the enabled state of this node.
     * @param value - the new enabled state
     */
    setEnabled(value) {
        super.setEnabled(value);
        this._resyncMeshes();
    }
    /**
     * Returns the Light associated shadow generator if any.
     * @param camera Camera for which the shadow generator should be retrieved (default: null). If null, retrieves the default shadow generator
     * @returns the associated shadow generator.
     */
    getShadowGenerator(camera = null) {
        if (this._shadowGenerators === null) {
            return null;
        }
        return this._shadowGenerators.get(camera) ?? null;
    }
    /**
     * Returns all the shadow generators associated to this light
     * @returns
     */
    getShadowGenerators() {
        return this._shadowGenerators;
    }
    /**
     * Returns a Vector3, the absolute light position in the World.
     * @returns the world space position of the light
     */
    getAbsolutePosition() {
        return Vector3.Zero();
    }
    /**
     * Specifies if the light will affect the passed mesh.
     * @param mesh The mesh to test against the light
     * @returns true the mesh is affected otherwise, false.
     */
    canAffectMesh(mesh) {
        if (!mesh) {
            return true;
        }
        if (this.includedOnlyMeshes && this.includedOnlyMeshes.length > 0 && this.includedOnlyMeshes.indexOf(mesh) === -1) {
            return false;
        }
        if (this.excludedMeshes && this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(mesh) !== -1) {
            return false;
        }
        if (this.includeOnlyWithLayerMask !== 0 && (this.includeOnlyWithLayerMask & mesh.layerMask) === 0) {
            return false;
        }
        if (this.excludeWithLayerMask !== 0 && this.excludeWithLayerMask & mesh.layerMask) {
            return false;
        }
        return true;
    }
    /**
     * Releases resources associated with this node.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    dispose(doNotRecurse, disposeMaterialAndTextures = false) {
        if (this._shadowGenerators) {
            const iterator = this._shadowGenerators.values();
            for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
                const shadowGenerator = key.value;
                shadowGenerator.dispose();
            }
            this._shadowGenerators = null;
        }
        // Animations
        this.getScene().stopAnimation(this);
        if (this._parentContainer) {
            const index = this._parentContainer.lights.indexOf(this);
            if (index > -1) {
                this._parentContainer.lights.splice(index, 1);
            }
            this._parentContainer = null;
        }
        // Remove from meshes
        for (const mesh of this.getScene().meshes) {
            mesh._removeLightSource(this, true);
        }
        this._uniformBuffer.dispose();
        // Remove from scene
        this.getScene().removeLight(this);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
    /**
     * Returns the light type ID (integer).
     * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
     */
    getTypeID() {
        return 0;
    }
    /**
     * Returns the intensity scaled by the Photometric Scale according to the light type and intensity mode.
     * @returns the scaled intensity in intensity mode unit
     */
    getScaledIntensity() {
        return this._photometricScale * this.intensity;
    }
    /**
     * Returns a new Light object, named "name", from the current one.
     * @param name The name of the cloned light
     * @param newParent The parent of this light, if it has one
     * @returns the new created light
     */
    clone(name, newParent = null) {
        const constructor = Light.GetConstructorFromName(this.getTypeID(), name, this.getScene());
        if (!constructor) {
            return null;
        }
        const clonedLight = SerializationHelper.Clone(constructor, this);
        if (name) {
            clonedLight.name = name;
        }
        if (newParent) {
            clonedLight.parent = newParent;
        }
        clonedLight.setEnabled(this.isEnabled());
        this.onClonedObservable.notifyObservers(clonedLight);
        return clonedLight;
    }
    /**
     * Serializes the current light into a Serialization object.
     * @returns the serialized object.
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.uniqueId = this.uniqueId;
        // Type
        serializationObject.type = this.getTypeID();
        // Parent
        if (this.parent) {
            this.parent._serializeAsParent(serializationObject);
        }
        // Inclusion / exclusions
        if (this.excludedMeshes.length > 0) {
            serializationObject.excludedMeshesIds = [];
            this.excludedMeshes.forEach((mesh) => {
                serializationObject.excludedMeshesIds.push(mesh.id);
            });
        }
        if (this.includedOnlyMeshes.length > 0) {
            serializationObject.includedOnlyMeshesIds = [];
            this.includedOnlyMeshes.forEach((mesh) => {
                serializationObject.includedOnlyMeshesIds.push(mesh.id);
            });
        }
        // Animations
        SerializationHelper.AppendSerializedAnimations(this, serializationObject);
        serializationObject.ranges = this.serializeAnimationRanges();
        serializationObject.isEnabled = this.isEnabled();
        return serializationObject;
    }
    /**
     * Creates a new typed light from the passed type (integer) : point light = 0, directional light = 1, spot light = 2, hemispheric light = 3.
     * This new light is named "name" and added to the passed scene.
     * @param type Type according to the types available in Light.LIGHTTYPEID_x
     * @param name The friendly name of the light
     * @param scene The scene the new light will belong to
     * @returns the constructor function
     */
    static GetConstructorFromName(type, name, scene) {
        const constructorFunc = Node.Construct("Light_Type_" + type, name, scene);
        if (constructorFunc) {
            return constructorFunc;
        }
        // Default to no light for none present once.
        return null;
    }
    /**
     * Parses the passed "parsedLight" and returns a new instanced Light from this parsing.
     * @param parsedLight The JSON representation of the light
     * @param scene The scene to create the parsed light in
     * @returns the created light after parsing
     */
    static Parse(parsedLight, scene) {
        const constructor = Light.GetConstructorFromName(parsedLight.type, parsedLight.name, scene);
        if (!constructor) {
            return null;
        }
        const light = SerializationHelper.Parse(constructor, parsedLight, scene);
        // Inclusion / exclusions
        if (parsedLight.excludedMeshesIds) {
            light._excludedMeshesIds = parsedLight.excludedMeshesIds;
        }
        if (parsedLight.includedOnlyMeshesIds) {
            light._includedOnlyMeshesIds = parsedLight.includedOnlyMeshesIds;
        }
        // Parent
        if (parsedLight.parentId !== undefined) {
            light._waitingParentId = parsedLight.parentId;
        }
        if (parsedLight.parentInstanceIndex !== undefined) {
            light._waitingParentInstanceIndex = parsedLight.parentInstanceIndex;
        }
        // Falloff
        if (parsedLight.falloffType !== undefined) {
            light.falloffType = parsedLight.falloffType;
        }
        // Lightmaps
        if (parsedLight.lightmapMode !== undefined) {
            light.lightmapMode = parsedLight.lightmapMode;
        }
        // Animations
        if (parsedLight.animations) {
            for (let animationIndex = 0; animationIndex < parsedLight.animations.length; animationIndex++) {
                const parsedAnimation = parsedLight.animations[animationIndex];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    light.animations.push(internalClass.Parse(parsedAnimation));
                }
            }
            Node.ParseAnimationRanges(light, parsedLight, scene);
        }
        if (parsedLight.autoAnimate) {
            scene.beginAnimation(light, parsedLight.autoAnimateFrom, parsedLight.autoAnimateTo, parsedLight.autoAnimateLoop, parsedLight.autoAnimateSpeed || 1.0);
        }
        // Check if isEnabled is defined to be back compatible with prior serialized versions.
        if (parsedLight.isEnabled !== undefined) {
            light.setEnabled(parsedLight.isEnabled);
        }
        return light;
    }
    _hookArrayForExcluded(array) {
        const oldPush = array.push;
        array.push = (...items) => {
            const result = oldPush.apply(array, items);
            for (const item of items) {
                item._resyncLightSource(this);
            }
            return result;
        };
        const oldSplice = array.splice;
        array.splice = (index, deleteCount) => {
            const deleted = oldSplice.apply(array, [index, deleteCount]);
            for (const item of deleted) {
                item._resyncLightSource(this);
            }
            return deleted;
        };
        for (const item of array) {
            item._resyncLightSource(this);
        }
    }
    _hookArrayForIncludedOnly(array) {
        const oldPush = array.push;
        array.push = (...items) => {
            const result = oldPush.apply(array, items);
            this._resyncMeshes();
            return result;
        };
        const oldSplice = array.splice;
        array.splice = (index, deleteCount) => {
            const deleted = oldSplice.apply(array, [index, deleteCount]);
            this._resyncMeshes();
            return deleted;
        };
        this._resyncMeshes();
    }
    _resyncMeshes() {
        for (const mesh of this.getScene().meshes) {
            mesh._resyncLightSource(this);
        }
    }
    /**
     * Forces the meshes to update their light related information in their rendering used effects
     * @internal Internal Use Only
     */
    _markMeshesAsLightDirty() {
        for (const mesh of this.getScene().meshes) {
            if (mesh.lightSources.indexOf(this) !== -1) {
                mesh._markSubMeshesAsLightDirty();
            }
        }
    }
    /**
     * Recomputes the cached photometric scale if needed.
     */
    _computePhotometricScale() {
        this._photometricScale = this._getPhotometricScale();
        this.getScene().resetCachedMaterial();
    }
    /**
     * @returns the Photometric Scale according to the light type and intensity mode.
     */
    _getPhotometricScale() {
        let photometricScale = 0.0;
        const lightTypeID = this.getTypeID();
        //get photometric mode
        let photometricMode = this.intensityMode;
        if (photometricMode === Light.INTENSITYMODE_AUTOMATIC) {
            if (lightTypeID === Light.LIGHTTYPEID_DIRECTIONALLIGHT) {
                photometricMode = Light.INTENSITYMODE_ILLUMINANCE;
            }
            else {
                photometricMode = Light.INTENSITYMODE_LUMINOUSINTENSITY;
            }
        }
        //compute photometric scale
        switch (lightTypeID) {
            case Light.LIGHTTYPEID_POINTLIGHT:
            case Light.LIGHTTYPEID_SPOTLIGHT:
                switch (photometricMode) {
                    case Light.INTENSITYMODE_LUMINOUSPOWER:
                        photometricScale = 1.0 / (4.0 * Math.PI);
                        break;
                    case Light.INTENSITYMODE_LUMINOUSINTENSITY:
                        photometricScale = 1.0;
                        break;
                    case Light.INTENSITYMODE_LUMINANCE:
                        photometricScale = this.radius * this.radius;
                        break;
                }
                break;
            case Light.LIGHTTYPEID_DIRECTIONALLIGHT:
                switch (photometricMode) {
                    case Light.INTENSITYMODE_ILLUMINANCE:
                        photometricScale = 1.0;
                        break;
                    case Light.INTENSITYMODE_LUMINANCE: {
                        // When radius (and therefore solid angle) is non-zero a directional lights brightness can be specified via central (peak) luminance.
                        // For a directional light the 'radius' defines the angular radius (in radians) rather than world-space radius (e.g. in metres).
                        let apexAngleRadians = this.radius;
                        // Impose a minimum light angular size to avoid the light becoming an infinitely small angular light source (i.e. a dirac delta function).
                        apexAngleRadians = Math.max(apexAngleRadians, 0.001);
                        const solidAngle = 2.0 * Math.PI * (1.0 - Math.cos(apexAngleRadians));
                        photometricScale = solidAngle;
                        break;
                    }
                }
                break;
            case Light.LIGHTTYPEID_HEMISPHERICLIGHT:
                // No fall off in hemispheric light.
                photometricScale = 1.0;
                break;
        }
        return photometricScale;
    }
    /**
     * Reorder the light in the scene according to their defined priority.
     * @internal Internal Use Only
     */
    _reorderLightsInScene() {
        const scene = this.getScene();
        if (this._renderPriority != 0) {
            scene.requireLightSorting = true;
        }
        this.getScene().sortLightsByPriority();
    }
}
/**
 * Falloff Default: light is falling off following the material specification:
 * standard material is using standard falloff whereas pbr material can request special falloff per materials.
 */
Light.FALLOFF_DEFAULT = LightConstants.FALLOFF_DEFAULT;
/**
 * Falloff Physical: light is falling off following the inverse squared distance law.
 */
Light.FALLOFF_PHYSICAL = LightConstants.FALLOFF_PHYSICAL;
/**
 * Falloff gltf: light is falling off as described in the gltf moving to PBR document
 * to enhance interoperability with other engines.
 */
Light.FALLOFF_GLTF = LightConstants.FALLOFF_GLTF;
/**
 * Falloff Standard: light is falling off like in the standard material
 * to enhance interoperability with other materials.
 */
Light.FALLOFF_STANDARD = LightConstants.FALLOFF_STANDARD;
//lightmapMode Consts
/**
 * If every light affecting the material is in this lightmapMode,
 * material.lightmapTexture adds or multiplies
 * (depends on material.useLightmapAsShadowmap)
 * after every other light calculations.
 */
Light.LIGHTMAP_DEFAULT = LightConstants.LIGHTMAP_DEFAULT;
/**
 * material.lightmapTexture as only diffuse lighting from this light
 * adds only specular lighting from this light
 * adds dynamic shadows
 */
Light.LIGHTMAP_SPECULAR = LightConstants.LIGHTMAP_SPECULAR;
/**
 * material.lightmapTexture as only lighting
 * no light calculation from this light
 * only adds dynamic shadows from this light
 */
Light.LIGHTMAP_SHADOWSONLY = LightConstants.LIGHTMAP_SHADOWSONLY;
// Intensity Mode Consts
/**
 * Each light type uses the default quantity according to its type:
 *      point/spot lights use luminous intensity
 *      directional lights use illuminance
 */
Light.INTENSITYMODE_AUTOMATIC = LightConstants.INTENSITYMODE_AUTOMATIC;
/**
 * lumen (lm)
 */
Light.INTENSITYMODE_LUMINOUSPOWER = LightConstants.INTENSITYMODE_LUMINOUSPOWER;
/**
 * candela (lm/sr)
 */
Light.INTENSITYMODE_LUMINOUSINTENSITY = LightConstants.INTENSITYMODE_LUMINOUSINTENSITY;
/**
 * lux (lm/m^2)
 */
Light.INTENSITYMODE_ILLUMINANCE = LightConstants.INTENSITYMODE_ILLUMINANCE;
/**
 * nit (cd/m^2)
 */
Light.INTENSITYMODE_LUMINANCE = LightConstants.INTENSITYMODE_LUMINANCE;
// Light types ids const.
/**
 * Light type const id of the point light.
 */
Light.LIGHTTYPEID_POINTLIGHT = LightConstants.LIGHTTYPEID_POINTLIGHT;
/**
 * Light type const id of the directional light.
 */
Light.LIGHTTYPEID_DIRECTIONALLIGHT = LightConstants.LIGHTTYPEID_DIRECTIONALLIGHT;
/**
 * Light type const id of the spot light.
 */
Light.LIGHTTYPEID_SPOTLIGHT = LightConstants.LIGHTTYPEID_SPOTLIGHT;
/**
 * Light type const id of the hemispheric light.
 */
Light.LIGHTTYPEID_HEMISPHERICLIGHT = LightConstants.LIGHTTYPEID_HEMISPHERICLIGHT;
__decorate([
    serializeAsColor3()
], Light.prototype, "diffuse", void 0);
__decorate([
    serializeAsColor3()
], Light.prototype, "specular", void 0);
__decorate([
    serialize()
], Light.prototype, "falloffType", void 0);
__decorate([
    serialize()
], Light.prototype, "intensity", void 0);
__decorate([
    serialize()
], Light.prototype, "range", null);
__decorate([
    serialize()
], Light.prototype, "intensityMode", null);
__decorate([
    serialize()
], Light.prototype, "radius", null);
__decorate([
    serialize()
], Light.prototype, "_renderPriority", void 0);
__decorate([
    expandToProperty("_reorderLightsInScene")
], Light.prototype, "renderPriority", void 0);
__decorate([
    serialize("shadowEnabled")
], Light.prototype, "_shadowEnabled", void 0);
__decorate([
    serialize("excludeWithLayerMask")
], Light.prototype, "_excludeWithLayerMask", void 0);
__decorate([
    serialize("includeOnlyWithLayerMask")
], Light.prototype, "_includeOnlyWithLayerMask", void 0);
__decorate([
    serialize("lightmapMode")
], Light.prototype, "_lightmapMode", void 0);
//# sourceMappingURL=light.js.map