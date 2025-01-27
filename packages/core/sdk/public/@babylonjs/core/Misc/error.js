/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Base error. Due to limitations of typedoc-check and missing documentation
 * in lib.es5.d.ts, cannot extend Error directly for RuntimeError.
 * @ignore
 */
export class BaseError extends Error {
}
// See https://stackoverflow.com/questions/12915412/how-do-i-extend-a-host-object-e-g-error-in-typescript
// and https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
// Polyfill for Object.setPrototypeOf if necessary.
BaseError._setPrototypeOf = Object.setPrototypeOf ||
    ((o, proto) => {
        o.__proto__ = proto;
        return o;
    });
/* IMP! DO NOT CHANGE THE NUMBERING OF EXISTING ERROR CODES */
/**
 * Error codes for BaseError
 */
export const ErrorCodes = {
    // Mesh errors 0-999
    /** Invalid or empty mesh vertex positions. */
    MeshInvalidPositionsError: 0,
    // Texture errors 1000-1999
    /** Unsupported texture found. */
    UnsupportedTextureError: 1000,
    // GLTFLoader errors 2000-2999
    /** Unexpected magic number found in GLTF file header. */
    GLTFLoaderUnexpectedMagicError: 2000,
    // SceneLoader errors 3000-3999
    /** SceneLoader generic error code. Ideally wraps the inner exception. */
    SceneLoaderError: 3000,
    // File related errors 4000-4999
    /** Load file error */
    LoadFileError: 4000,
    /** Request file error */
    RequestFileError: 4001,
    /** Read file error */
    ReadFileError: 4002,
};
/**
 * Application runtime error
 */
export class RuntimeError extends BaseError {
    /**
     * Creates a new RuntimeError
     * @param message defines the message of the error
     * @param errorCode the error code
     * @param innerError the error that caused the outer error
     */
    constructor(message, errorCode, innerError) {
        super(message);
        this.errorCode = errorCode;
        this.innerError = innerError;
        this.name = "RuntimeError";
        BaseError._setPrototypeOf(this, RuntimeError.prototype);
    }
}
/**
 * Used for flow control when an operation is aborted, such as with AbortController.
 */
export class AbortError extends BaseError {
    constructor(message = "Operation aborted") {
        super(message);
        this.name = "AbortError";
        BaseError._setPrototypeOf(this, AbortError.prototype);
    }
}
//# sourceMappingURL=error.js.map