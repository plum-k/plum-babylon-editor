import { FlowGraphCoordinator } from "@babylonjs/core/FlowGraph/flowGraphCoordinator.js";
import { FlowGraph } from "@babylonjs/core/FlowGraph/flowGraph.js";
import { convertGLTFToSerializedFlowGraph } from "./interactivityFunctions.js";
import { InteractivityPathToObjectConverter } from "./interactivityPathToObjectConverter.js";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "KHR_interactivity";
/**
 * Loader extension for KHR_interactivity
 */
export class KHR_interactivity {
    /**
     * @internal
     * @param _loader
     */
    constructor(_loader) {
        this._loader = _loader;
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this.enabled = this._loader.isExtensionUsed(NAME);
        this._pathConverter = new InteractivityPathToObjectConverter(this._loader.gltf);
    }
    dispose() {
        this._loader = null;
        delete this._pathConverter;
    }
    onReady() {
        if (!this._loader.babylonScene || !this._pathConverter) {
            return;
        }
        const scene = this._loader.babylonScene;
        const interactivityDefinition = this._loader.gltf.extensions?.KHR_interactivity;
        const json = convertGLTFToSerializedFlowGraph(interactivityDefinition);
        const coordinator = new FlowGraphCoordinator({ scene });
        FlowGraph.Parse(json, { coordinator, pathConverter: this._pathConverter });
        coordinator.start();
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_interactivity(loader));
//# sourceMappingURL=KHR_interactivity.js.map