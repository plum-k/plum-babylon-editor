import { Logger } from "@babylonjs/core/Misc/logger.js";
import { animationPointerTree } from "./KHR_animation_pointer.data.js";
import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter.js";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "KHR_animation_pointer";
/**
 * Class to convert an animation pointer path to a smart object that
 * gets data from the animation buffer and creates animations.
 */
class AnimationPointerPathToObjectConverter extends GLTFPathToObjectConverter {
    constructor(gltf) {
        super(gltf, animationPointerTree);
    }
}
/**
 * [Specification PR](https://github.com/KhronosGroup/glTF/pull/2147)
 * !!! Experimental Extension Subject to Changes !!!
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_animation_pointer {
    /**
     * @internal
     */
    constructor(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this._pathToObjectConverter = new AnimationPointerPathToObjectConverter(this._loader.gltf);
    }
    /**
     * Defines whether this extension is enabled.
     */
    get enabled() {
        return this._loader.isExtensionUsed(NAME);
    }
    /** @internal */
    dispose() {
        this._loader = null;
        delete this._pathToObjectConverter; // GC
    }
    /**
     * Loads a glTF animation channel.
     * @param context The context when loading the asset
     * @param animationContext The context of the animation when loading the asset
     * @param animation The glTF animation property
     * @param channel The glTF animation channel property
     * @param onLoad Called for each animation loaded
     * @returns A void promise that resolves when the load is complete or null if not handled
     */
    _loadAnimationChannelAsync(context, animationContext, animation, channel, onLoad) {
        const extension = channel.target.extensions?.KHR_animation_pointer;
        if (!extension || !this._pathToObjectConverter) {
            return null;
        }
        if (channel.target.path !== "pointer" /* AnimationChannelTargetPath.POINTER */) {
            Logger.Warn(`${context}/target/path: Value (${channel.target.path}) must be (${"pointer" /* AnimationChannelTargetPath.POINTER */}) when using the ${this.name} extension`);
        }
        if (channel.target.node != undefined) {
            Logger.Warn(`${context}/target/node: Value (${channel.target.node}) must not be present when using the ${this.name} extension`);
        }
        const extensionContext = `${context}/extensions/${this.name}`;
        const pointer = extension.pointer;
        if (!pointer) {
            throw new Error(`${extensionContext}: Pointer is missing`);
        }
        try {
            const targetInfo = this._pathToObjectConverter.convert(pointer);
            return this._loader._loadAnimationChannelFromTargetInfoAsync(context, animationContext, animation, channel, targetInfo, onLoad);
        }
        catch (e) {
            Logger.Warn(`${extensionContext}/pointer: Invalid pointer (${pointer}) skipped`);
            return null;
        }
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_animation_pointer(loader));
//# sourceMappingURL=KHR_animation_pointer.js.map