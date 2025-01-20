import { GetDirectStore } from "./decorators.functions.js";
function generateSerializableMember(type, sourceName) {
    return (target, propertyKey) => {
        const classStore = GetDirectStore(target);
        if (!classStore[propertyKey]) {
            classStore[propertyKey] = { type: type, sourceName: sourceName };
        }
    };
}
function generateExpandMember(setCallback, targetKey = null) {
    return (target, propertyKey) => {
        const key = targetKey || "_" + propertyKey;
        Object.defineProperty(target, propertyKey, {
            get: function () {
                return this[key];
            },
            set: function (value) {
                // does this object (i.e. vector3) has an equals function? use it!
                // Note - not using "with epsilon" here, it is expected te behave like the internal cache does.
                if (typeof this.equals === "function") {
                    if (this.equals(value)) {
                        return;
                    }
                }
                if (this[key] === value) {
                    return;
                }
                this[key] = value;
                target[setCallback].apply(this);
            },
            enumerable: true,
            configurable: true,
        });
    };
}
export function expandToProperty(callback, targetKey = null) {
    return generateExpandMember(callback, targetKey);
}
export function serialize(sourceName) {
    return generateSerializableMember(0, sourceName); // value member
}
export function serializeAsTexture(sourceName) {
    return generateSerializableMember(1, sourceName); // texture member
}
export function serializeAsColor3(sourceName) {
    return generateSerializableMember(2, sourceName); // color3 member
}
export function serializeAsFresnelParameters(sourceName) {
    return generateSerializableMember(3, sourceName); // fresnel parameters member
}
export function serializeAsVector2(sourceName) {
    return generateSerializableMember(4, sourceName); // vector2 member
}
export function serializeAsVector3(sourceName) {
    return generateSerializableMember(5, sourceName); // vector3 member
}
export function serializeAsMeshReference(sourceName) {
    return generateSerializableMember(6, sourceName); // mesh reference member
}
export function serializeAsColorCurves(sourceName) {
    return generateSerializableMember(7, sourceName); // color curves
}
export function serializeAsColor4(sourceName) {
    return generateSerializableMember(8, sourceName); // color 4
}
export function serializeAsImageProcessingConfiguration(sourceName) {
    return generateSerializableMember(9, sourceName); // image processing
}
export function serializeAsQuaternion(sourceName) {
    return generateSerializableMember(10, sourceName); // quaternion member
}
export function serializeAsMatrix(sourceName) {
    return generateSerializableMember(12, sourceName); // matrix member
}
/**
 * Decorator used to define property that can be serialized as reference to a camera
 * @param sourceName defines the name of the property to decorate
 * @returns Property Decorator
 */
export function serializeAsCameraReference(sourceName) {
    return generateSerializableMember(11, sourceName); // camera reference member
}
/**
 * Decorator used to redirect a function to a native implementation if available.
 * @internal
 */
export function nativeOverride(target, propertyKey, descriptor, predicate) {
    // Cache the original JS function for later.
    const jsFunc = descriptor.value;
    // Override the JS function to check for a native override on first invocation. Setting descriptor.value overrides the function at the early stage of code being loaded/imported.
    descriptor.value = (...params) => {
        // Assume the resolved function will be the original JS function, then we will check for the Babylon Native context.
        let func = jsFunc;
        // Check if we are executing in a Babylon Native context (e.g. check the presence of the _native global property) and if so also check if a function override is available.
        if (typeof _native !== "undefined" && _native[propertyKey]) {
            const nativeFunc = _native[propertyKey];
            // If a predicate was provided, then we'll need to invoke the predicate on each invocation of the underlying function to determine whether to call the native function or the JS function.
            if (predicate) {
                // The resolved function will execute the predicate and then either execute the native function or the JS function.
                func = (...params) => (predicate(...params) ? nativeFunc(...params) : jsFunc(...params));
            }
            else {
                // The resolved function will directly execute the native function.
                func = nativeFunc;
            }
        }
        // Override the JS function again with the final resolved target function.
        target[propertyKey] = func;
        // The JS function has now been overridden based on whether we're executing in the context of Babylon Native, but we still need to invoke that function.
        // Future invocations of the function will just directly invoke the final overridden function, not any of the decorator setup logic above.
        return func(...params);
    };
}
/**
 * Decorator factory that applies the nativeOverride decorator, but determines whether to redirect to the native implementation based on a filter function that evaluates the function arguments.
 * @param predicate
 * @example @nativeOverride.filter((...[arg1]: Parameters<typeof someClass.someMethod>) => arg1.length > 20)
 *          public someMethod(arg1: string, arg2: number): string {
 * @internal
 */
nativeOverride.filter = function (predicate) {
    return (target, propertyKey, descriptor) => nativeOverride(target, propertyKey, descriptor, predicate);
};
//# sourceMappingURL=decorators.js.map