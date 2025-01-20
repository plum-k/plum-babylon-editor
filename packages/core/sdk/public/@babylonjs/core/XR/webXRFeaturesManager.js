import { Tools } from "../Misc/tools.js";
/**
 * A list of the currently available features without referencing them
 */
export class WebXRFeatureName {
}
/**
 * The name of the anchor system feature
 */
WebXRFeatureName.ANCHOR_SYSTEM = "xr-anchor-system";
/**
 * The name of the background remover feature
 */
WebXRFeatureName.BACKGROUND_REMOVER = "xr-background-remover";
/**
 * The name of the hit test feature
 */
WebXRFeatureName.HIT_TEST = "xr-hit-test";
/**
 * The name of the mesh detection feature
 */
WebXRFeatureName.MESH_DETECTION = "xr-mesh-detection";
/**
 * physics impostors for xr controllers feature
 */
WebXRFeatureName.PHYSICS_CONTROLLERS = "xr-physics-controller";
/**
 * The name of the plane detection feature
 */
WebXRFeatureName.PLANE_DETECTION = "xr-plane-detection";
/**
 * The name of the pointer selection feature
 */
WebXRFeatureName.POINTER_SELECTION = "xr-controller-pointer-selection";
/**
 * The name of the teleportation feature
 */
WebXRFeatureName.TELEPORTATION = "xr-controller-teleportation";
/**
 * The name of the feature points feature.
 */
WebXRFeatureName.FEATURE_POINTS = "xr-feature-points";
/**
 * The name of the hand tracking feature.
 */
WebXRFeatureName.HAND_TRACKING = "xr-hand-tracking";
/**
 * The name of the image tracking feature
 */
WebXRFeatureName.IMAGE_TRACKING = "xr-image-tracking";
/**
 * The name of the near interaction feature
 */
WebXRFeatureName.NEAR_INTERACTION = "xr-near-interaction";
/**
 * The name of the DOM overlay feature
 */
WebXRFeatureName.DOM_OVERLAY = "xr-dom-overlay";
/**
 * The name of the movement feature
 */
WebXRFeatureName.MOVEMENT = "xr-controller-movement";
/**
 * The name of the light estimation feature
 */
WebXRFeatureName.LIGHT_ESTIMATION = "xr-light-estimation";
/**
 * The name of the eye tracking feature
 */
WebXRFeatureName.EYE_TRACKING = "xr-eye-tracking";
/**
 * The name of the walking locomotion feature
 */
WebXRFeatureName.WALKING_LOCOMOTION = "xr-walking-locomotion";
/**
 * The name of the composition layers feature
 */
WebXRFeatureName.LAYERS = "xr-layers";
/**
 * The name of the depth sensing feature
 */
WebXRFeatureName.DEPTH_SENSING = "xr-depth-sensing";
/**
 * The name of the WebXR Space Warp feature
 */
WebXRFeatureName.SPACE_WARP = "xr-space-warp";
/**
 * The name of the WebXR Raw Camera Access feature
 */
WebXRFeatureName.RAW_CAMERA_ACCESS = "xr-raw-camera-access";
/**
 * The WebXR features manager is responsible of enabling or disabling features required for the current XR session.
 * It is mainly used in AR sessions.
 *
 * A feature can have a version that is defined by Babylon (and does not correspond with the webxr version).
 */
export class WebXRFeaturesManager {
    /**
     * constructs a new features manages.
     *
     * @param _xrSessionManager an instance of WebXRSessionManager
     */
    constructor(_xrSessionManager) {
        this._xrSessionManager = _xrSessionManager;
        this._features = {};
        // when session starts / initialized - attach
        this._xrSessionManager.onXRSessionInit.add(() => {
            this.getEnabledFeatures().forEach((featureName) => {
                const feature = this._features[featureName];
                if (feature.enabled && !feature.featureImplementation.attached && !feature.featureImplementation.disableAutoAttach) {
                    this.attachFeature(featureName);
                }
            });
        });
        // when session ends - detach
        this._xrSessionManager.onXRSessionEnded.add(() => {
            this.getEnabledFeatures().forEach((featureName) => {
                const feature = this._features[featureName];
                if (feature.enabled && feature.featureImplementation.attached) {
                    // detach, but don't disable!
                    this.detachFeature(featureName);
                }
            });
        });
    }
    /**
     * Used to register a module. After calling this function a developer can use this feature in the scene.
     * Mainly used internally.
     *
     * @param featureName the name of the feature to register
     * @param constructorFunction the function used to construct the module
     * @param version the (babylon) version of the module
     * @param stable is that a stable version of this module
     */
    static AddWebXRFeature(featureName, constructorFunction, version = 1, stable = false) {
        this._AvailableFeatures[featureName] = this._AvailableFeatures[featureName] || { latest: version };
        if (version > this._AvailableFeatures[featureName].latest) {
            this._AvailableFeatures[featureName].latest = version;
        }
        if (stable) {
            this._AvailableFeatures[featureName].stable = version;
        }
        this._AvailableFeatures[featureName][version] = constructorFunction;
    }
    /**
     * Returns a constructor of a specific feature.
     *
     * @param featureName the name of the feature to construct
     * @param version the version of the feature to load
     * @param xrSessionManager the xrSessionManager. Used to construct the module
     * @param options optional options provided to the module.
     * @returns a function that, when called, will return a new instance of this feature
     */
    static ConstructFeature(featureName, version = 1, xrSessionManager, options) {
        const constructorFunction = this._AvailableFeatures[featureName][version];
        if (!constructorFunction) {
            // throw an error? return nothing?
            throw new Error("feature not found");
        }
        return constructorFunction(xrSessionManager, options);
    }
    /**
     * Can be used to return the list of features currently registered
     *
     * @returns an Array of available features
     */
    static GetAvailableFeatures() {
        return Object.keys(this._AvailableFeatures);
    }
    /**
     * Gets the versions available for a specific feature
     * @param featureName the name of the feature
     * @returns an array with the available versions
     */
    static GetAvailableVersions(featureName) {
        return Object.keys(this._AvailableFeatures[featureName]);
    }
    /**
     * Return the latest unstable version of this feature
     * @param featureName the name of the feature to search
     * @returns the version number. if not found will return -1
     */
    static GetLatestVersionOfFeature(featureName) {
        return (this._AvailableFeatures[featureName] && this._AvailableFeatures[featureName].latest) || -1;
    }
    /**
     * Return the latest stable version of this feature
     * @param featureName the name of the feature to search
     * @returns the version number. if not found will return -1
     */
    static GetStableVersionOfFeature(featureName) {
        return (this._AvailableFeatures[featureName] && this._AvailableFeatures[featureName].stable) || -1;
    }
    /**
     * Attach a feature to the current session. Mainly used when session started to start the feature effect.
     * Can be used during a session to start a feature
     * @param featureName the name of feature to attach
     */
    attachFeature(featureName) {
        const feature = this._features[featureName];
        if (feature && feature.enabled && !feature.featureImplementation.attached) {
            const attached = feature.featureImplementation.attach();
            if (!attached) {
                Tools.Warn(`Feature ${featureName} failed to attach`);
            }
        }
    }
    /**
     * Can be used inside a session or when the session ends to detach a specific feature
     * @param featureName the name of the feature to detach
     */
    detachFeature(featureName) {
        const feature = this._features[featureName];
        if (feature && feature.featureImplementation.attached) {
            const detached = feature.featureImplementation.detach();
            if (!detached) {
                Tools.Warn(`Feature ${featureName} failed to detach`);
            }
        }
    }
    /**
     * Used to disable an already-enabled feature
     * The feature will be disposed and will be recreated once enabled.
     * @param featureName the feature to disable
     * @returns true if disable was successful
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    disableFeature(featureName) {
        const name = typeof featureName === "string" ? featureName : featureName.Name;
        const feature = this._features[name];
        if (feature && feature.enabled) {
            feature.enabled = false;
            this.detachFeature(name);
            feature.featureImplementation.dispose();
            delete this._features[name];
            return true;
        }
        return false;
    }
    /**
     * dispose this features manager
     */
    dispose() {
        this.getEnabledFeatures().forEach((feature) => {
            this.disableFeature(feature);
        });
    }
    /**
     * Enable a feature using its name and a version. This will enable it in the scene, and will be responsible to attach it when the session starts.
     * If used twice, the old version will be disposed and a new one will be constructed. This way you can re-enable with different configuration.
     *
     * @param featureName the name of the feature to load or the class of the feature
     * @param version optional version to load. if not provided the latest version will be enabled
     * @param moduleOptions options provided to the module. Ses the module documentation / constructor
     * @param attachIfPossible if set to true (default) the feature will be automatically attached, if it is currently possible
     * @param required is this feature required to the app. If set to true the session init will fail if the feature is not available.
     * @returns a new constructed feature or throws an error if feature not found or conflicts with another enabled feature.
     */
    enableFeature(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    featureName, version = "latest", moduleOptions = {}, attachIfPossible = true, required = true) {
        const name = typeof featureName === "string" ? featureName : featureName.Name;
        let versionToLoad = 0;
        if (typeof version === "string") {
            if (!version) {
                throw new Error(`Error in provided version - ${name} (${version})`);
            }
            if (version === "stable") {
                versionToLoad = WebXRFeaturesManager.GetStableVersionOfFeature(name);
            }
            else if (version === "latest") {
                versionToLoad = WebXRFeaturesManager.GetLatestVersionOfFeature(name);
            }
            else {
                // try loading the number the string represents
                versionToLoad = +version;
            }
            if (versionToLoad === -1 || isNaN(versionToLoad)) {
                throw new Error(`feature not found - ${name} (${version})`);
            }
        }
        else {
            versionToLoad = version;
        }
        // check if there is a feature conflict
        const conflictingFeature = WebXRFeaturesManager._ConflictingFeatures[name];
        if (conflictingFeature !== undefined && this.getEnabledFeatures().indexOf(conflictingFeature) !== -1) {
            throw new Error(`Feature ${name} cannot be enabled while ${conflictingFeature} is enabled.`);
        }
        // check if already initialized
        const feature = this._features[name];
        const constructFunction = WebXRFeaturesManager.ConstructFeature(name, versionToLoad, this._xrSessionManager, moduleOptions);
        if (!constructFunction) {
            // report error?
            throw new Error(`feature not found - ${name}`);
        }
        /* If the feature is already enabled, detach and dispose it, and create a new one */
        if (feature) {
            this.disableFeature(name);
        }
        const constructed = constructFunction();
        if (constructed.dependsOn) {
            const dependentsFound = constructed.dependsOn.every((featureName) => !!this._features[featureName]);
            if (!dependentsFound) {
                throw new Error(`Dependant features missing. Make sure the following features are enabled - ${constructed.dependsOn.join(", ")}`);
            }
        }
        if (constructed.isCompatible()) {
            this._features[name] = {
                featureImplementation: constructed,
                enabled: true,
                version: versionToLoad,
                required,
            };
            if (attachIfPossible) {
                // if session started already, request and enable
                if (this._xrSessionManager.session && !this._features[name].featureImplementation.attached) {
                    // enable feature
                    this.attachFeature(name);
                }
            }
            else {
                // disable auto-attach when session starts
                this._features[name].featureImplementation.disableAutoAttach = true;
            }
            return this._features[name].featureImplementation;
        }
        else {
            if (required) {
                throw new Error("required feature not compatible");
            }
            else {
                Tools.Warn(`Feature ${name} not compatible with the current environment/browser and was not enabled.`);
                return constructed;
            }
        }
    }
    /**
     * get the implementation of an enabled feature.
     * @param featureName the name of the feature to load
     * @returns the feature class, if found
     */
    getEnabledFeature(featureName) {
        return this._features[featureName] && this._features[featureName].featureImplementation;
    }
    /**
     * Get the list of enabled features
     * @returns an array of enabled features
     */
    getEnabledFeatures() {
        return Object.keys(this._features);
    }
    /**
     * This function will extend the session creation configuration object with enabled features.
     * If, for example, the anchors feature is enabled, it will be automatically added to the optional or required features list,
     * according to the defined "required" variable, provided during enableFeature call
     * @param xrSessionInit the xr Session init object to extend
     *
     * @returns an extended XRSessionInit object
     */
    async _extendXRSessionInitObject(xrSessionInit) {
        const enabledFeatures = this.getEnabledFeatures();
        for (const featureName of enabledFeatures) {
            const feature = this._features[featureName];
            const nativeName = feature.featureImplementation.xrNativeFeatureName;
            if (nativeName) {
                if (feature.required) {
                    xrSessionInit.requiredFeatures = xrSessionInit.requiredFeatures || [];
                    if (xrSessionInit.requiredFeatures.indexOf(nativeName) === -1) {
                        xrSessionInit.requiredFeatures.push(nativeName);
                    }
                }
                else {
                    xrSessionInit.optionalFeatures = xrSessionInit.optionalFeatures || [];
                    if (xrSessionInit.optionalFeatures.indexOf(nativeName) === -1) {
                        xrSessionInit.optionalFeatures.push(nativeName);
                    }
                }
            }
            if (feature.featureImplementation.getXRSessionInitExtension) {
                const extended = await feature.featureImplementation.getXRSessionInitExtension();
                xrSessionInit = {
                    ...xrSessionInit,
                    ...extended,
                };
            }
        }
        return xrSessionInit;
    }
}
WebXRFeaturesManager._AvailableFeatures = {};
/**
 * The key is the feature to check and the value is the feature that conflicts.
 */
WebXRFeaturesManager._ConflictingFeatures = {
    [WebXRFeatureName.TELEPORTATION]: WebXRFeatureName.MOVEMENT,
    [WebXRFeatureName.MOVEMENT]: WebXRFeatureName.TELEPORTATION,
};
//# sourceMappingURL=webXRFeaturesManager.js.map