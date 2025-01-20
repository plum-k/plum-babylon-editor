import { Tools } from "../Misc/tools.js";
import { Scene } from "../scene.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { LensFlareSystem } from "./lensFlareSystem.js";
import { AddParser } from "../Loading/Plugins/babylonFileParser.function.js";
// Adds the parser to the scene parsers.
AddParser(SceneComponentConstants.NAME_LENSFLARESYSTEM, (parsedData, scene, container, rootUrl) => {
    // Lens flares
    if (parsedData.lensFlareSystems !== undefined && parsedData.lensFlareSystems !== null) {
        if (!container.lensFlareSystems) {
            container.lensFlareSystems = [];
        }
        for (let index = 0, cache = parsedData.lensFlareSystems.length; index < cache; index++) {
            const parsedLensFlareSystem = parsedData.lensFlareSystems[index];
            const lf = LensFlareSystem.Parse(parsedLensFlareSystem, scene, rootUrl);
            container.lensFlareSystems.push(lf);
        }
    }
});
Scene.prototype.getLensFlareSystemByName = function (name) {
    for (let index = 0; index < this.lensFlareSystems.length; index++) {
        if (this.lensFlareSystems[index].name === name) {
            return this.lensFlareSystems[index];
        }
    }
    return null;
};
Scene.prototype.getLensFlareSystemById = function (id) {
    for (let index = 0; index < this.lensFlareSystems.length; index++) {
        if (this.lensFlareSystems[index].id === id) {
            return this.lensFlareSystems[index];
        }
    }
    return null;
};
Scene.prototype.getLensFlareSystemByID = function (id) {
    return this.getLensFlareSystemById(id);
};
Scene.prototype.removeLensFlareSystem = function (toRemove) {
    const index = this.lensFlareSystems.indexOf(toRemove);
    if (index !== -1) {
        this.lensFlareSystems.splice(index, 1);
    }
    return index;
};
Scene.prototype.addLensFlareSystem = function (newLensFlareSystem) {
    this.lensFlareSystems.push(newLensFlareSystem);
};
/**
 * Defines the lens flare scene component responsible to manage any lens flares
 * in a given scene.
 */
export class LensFlareSystemSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_LENSFLARESYSTEM;
        this.scene = scene;
    }
    /**
     * Registers the component in a given scene
     */
    register() {
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_LENSFLARESYSTEM, this, this._draw);
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        for (let index = 0; index < this.scene.lensFlareSystems.length; index++) {
            this.scene.lensFlareSystems[index].rebuild();
        }
    }
    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    addFromContainer(container) {
        if (!container.lensFlareSystems) {
            return;
        }
        container.lensFlareSystems.forEach((o) => {
            this.scene.addLensFlareSystem(o);
        });
    }
    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    removeFromContainer(container, dispose) {
        if (!container.lensFlareSystems) {
            return;
        }
        container.lensFlareSystems.forEach((o) => {
            this.scene.removeLensFlareSystem(o);
            if (dispose) {
                o.dispose();
            }
        });
    }
    /**
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    serialize(serializationObject) {
        // Lens flares
        serializationObject.lensFlareSystems = [];
        const lensFlareSystems = this.scene.lensFlareSystems;
        for (const lensFlareSystem of lensFlareSystems) {
            serializationObject.lensFlareSystems.push(lensFlareSystem.serialize());
        }
    }
    /**
     * Disposes the component and the associated resources.
     */
    dispose() {
        const lensFlareSystems = this.scene.lensFlareSystems;
        while (lensFlareSystems.length) {
            lensFlareSystems[0].dispose();
        }
    }
    _draw(camera) {
        // Lens flares
        if (this.scene.lensFlaresEnabled) {
            const lensFlareSystems = this.scene.lensFlareSystems;
            Tools.StartPerformanceCounter("Lens flares", lensFlareSystems.length > 0);
            for (const lensFlareSystem of lensFlareSystems) {
                if ((camera.layerMask & lensFlareSystem.layerMask) !== 0) {
                    lensFlareSystem.render();
                }
            }
            Tools.EndPerformanceCounter("Lens flares", lensFlareSystems.length > 0);
        }
    }
}
LensFlareSystem._SceneComponentInitialization = (scene) => {
    let component = scene._getComponent(SceneComponentConstants.NAME_LENSFLARESYSTEM);
    if (!component) {
        component = new LensFlareSystemSceneComponent(scene);
        scene._addComponent(component);
    }
};
//# sourceMappingURL=lensFlareSystemSceneComponent.js.map