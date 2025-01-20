import { Logger } from "./logger.js";
import { GetClass } from "./typeStore.js";
/**
 * Class used to enable instantiation of objects by class name
 */
export class InstantiationTools {
    /**
     * Tries to instantiate a new object from a given class name
     * @param className defines the class name to instantiate
     * @returns the new object or null if the system was not able to do the instantiation
     */
    static Instantiate(className) {
        if (this.RegisteredExternalClasses && this.RegisteredExternalClasses[className]) {
            return this.RegisteredExternalClasses[className];
        }
        const internalClass = GetClass(className);
        if (internalClass) {
            return internalClass;
        }
        Logger.Warn(className + " not found, you may have missed an import.");
        const arr = className.split(".");
        let fn = window || this;
        for (let i = 0, len = arr.length; i < len; i++) {
            fn = fn[arr[i]];
        }
        if (typeof fn !== "function") {
            return null;
        }
        return fn;
    }
}
/**
 * Use this object to register external classes like custom textures or material
 * to allow the loaders to instantiate them
 */
InstantiationTools.RegisteredExternalClasses = {};
//# sourceMappingURL=instantiationTools.js.map