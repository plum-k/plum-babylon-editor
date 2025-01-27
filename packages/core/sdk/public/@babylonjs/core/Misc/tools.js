import { Observable } from "./observable.js";
import { GetDOMTextContent, IsNavigatorAvailable, IsWindowObjectExist } from "./domManagement.js";
import { Logger } from "./logger.js";
import { DeepCopier } from "./deepCopier.js";
import { PrecisionDate } from "./precisionDate.js";
import { _WarnImport } from "./devTools.js";
import { WebRequest } from "./webRequest.js";
import { EngineStore } from "../Engines/engineStore.js";
import { FileToolsOptions, DecodeBase64UrlToBinary, IsBase64DataUrl, LoadFile as FileToolsLoadFile, LoadImage as FileToolLoadImage, ReadFile as FileToolsReadFile, SetCorsBehavior, } from "./fileTools.js";
import { TimingTools } from "./timingTools.js";
import { InstantiationTools } from "./instantiationTools.js";
import { RandomGUID } from "./guid.js";
import { IsExponentOfTwo, Mix } from "./tools.functions.js";
/**
 * Class containing a set of static utilities functions
 */
export class Tools {
    /**
     * Gets or sets the base URL to use to load assets
     */
    static get BaseUrl() {
        return FileToolsOptions.BaseUrl;
    }
    static set BaseUrl(value) {
        FileToolsOptions.BaseUrl = value;
    }
    /**
     * Gets or sets the clean URL function to use to load assets
     */
    static get CleanUrl() {
        return FileToolsOptions.CleanUrl;
    }
    static set CleanUrl(value) {
        FileToolsOptions.CleanUrl = value;
    }
    /**
     * This function checks whether a URL is absolute or not.
     * It will also detect data and blob URLs
     * @param url the url to check
     * @returns is the url absolute or relative
     */
    static IsAbsoluteUrl(url) {
        // See https://stackoverflow.com/a/38979205.
        // URL is protocol-relative (= absolute)
        if (url.indexOf("//") === 0) {
            return true;
        }
        // URL has no protocol (= relative)
        if (url.indexOf("://") === -1) {
            return false;
        }
        // URL does not contain a dot, i.e. no TLD (= relative, possibly REST)
        if (url.indexOf(".") === -1) {
            return false;
        }
        // URL does not contain a single slash (= relative)
        if (url.indexOf("/") === -1) {
            return false;
        }
        // The first colon comes after the first slash (= relative)
        if (url.indexOf(":") > url.indexOf("/")) {
            return false;
        }
        // Protocol is defined before first dot (= absolute)
        if (url.indexOf("://") < url.indexOf(".")) {
            return true;
        }
        if (url.indexOf("data:") === 0 || url.indexOf("blob:") === 0) {
            return true;
        }
        // Anything else must be relative
        return false;
    }
    /**
     * Sets the base URL to use to load scripts
     */
    static set ScriptBaseUrl(value) {
        FileToolsOptions.ScriptBaseUrl = value;
    }
    static get ScriptBaseUrl() {
        return FileToolsOptions.ScriptBaseUrl;
    }
    /**
     * Sets both the script base URL and the assets base URL to the same value.
     * Setter only!
     */
    static set CDNBaseUrl(value) {
        Tools.ScriptBaseUrl = value;
        Tools.AssetBaseUrl = value;
    }
    /**
     * Sets a preprocessing function to run on a source URL before importing it
     * Note that this function will execute AFTER the base URL is appended to the URL
     */
    static set ScriptPreprocessUrl(func) {
        FileToolsOptions.ScriptPreprocessUrl = func;
    }
    static get ScriptPreprocessUrl() {
        return FileToolsOptions.ScriptPreprocessUrl;
    }
    /**
     * Gets or sets the retry strategy to apply when an error happens while loading an asset
     */
    static get DefaultRetryStrategy() {
        return FileToolsOptions.DefaultRetryStrategy;
    }
    static set DefaultRetryStrategy(strategy) {
        FileToolsOptions.DefaultRetryStrategy = strategy;
    }
    /**
     * Default behavior for cors in the application.
     * It can be a string if the expected behavior is identical in the entire app.
     * Or a callback to be able to set it per url or on a group of them (in case of Video source for instance)
     */
    static get CorsBehavior() {
        return FileToolsOptions.CorsBehavior;
    }
    static set CorsBehavior(value) {
        FileToolsOptions.CorsBehavior = value;
    }
    /**
     * Gets or sets a global variable indicating if fallback texture must be used when a texture cannot be loaded
     * @ignorenaming
     */
    static get UseFallbackTexture() {
        return EngineStore.UseFallbackTexture;
    }
    static set UseFallbackTexture(value) {
        EngineStore.UseFallbackTexture = value;
    }
    /**
     * Use this object to register external classes like custom textures or material
     * to allow the loaders to instantiate them
     */
    static get RegisteredExternalClasses() {
        return InstantiationTools.RegisteredExternalClasses;
    }
    static set RegisteredExternalClasses(classes) {
        InstantiationTools.RegisteredExternalClasses = classes;
    }
    /**
     * Texture content used if a texture cannot loaded
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static get fallbackTexture() {
        return EngineStore.FallbackTexture;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static set fallbackTexture(value) {
        EngineStore.FallbackTexture = value;
    }
    /**
     * Read the content of a byte array at a specified coordinates (taking in account wrapping)
     * @param u defines the coordinate on X axis
     * @param v defines the coordinate on Y axis
     * @param width defines the width of the source data
     * @param height defines the height of the source data
     * @param pixels defines the source byte array
     * @param color defines the output color
     */
    static FetchToRef(u, v, width, height, pixels, color) {
        const wrappedU = (Math.abs(u) * width) % width | 0;
        const wrappedV = (Math.abs(v) * height) % height | 0;
        const position = (wrappedU + wrappedV * width) * 4;
        color.r = pixels[position] / 255;
        color.g = pixels[position + 1] / 255;
        color.b = pixels[position + 2] / 255;
        color.a = pixels[position + 3] / 255;
    }
    /**
     * Interpolates between a and b via alpha
     * @param a The lower value (returned when alpha = 0)
     * @param b The upper value (returned when alpha = 1)
     * @param alpha The interpolation-factor
     * @returns The mixed value
     */
    static Mix(a, b, alpha) {
        return 0;
    }
    /**
     * Tries to instantiate a new object from a given class name
     * @param className defines the class name to instantiate
     * @returns the new object or null if the system was not able to do the instantiation
     */
    static Instantiate(className) {
        return InstantiationTools.Instantiate(className);
    }
    /**
     * Polyfill for setImmediate
     * @param action defines the action to execute after the current execution block
     */
    static SetImmediate(action) {
        TimingTools.SetImmediate(action);
    }
    /**
     * Function indicating if a number is an exponent of 2
     * @param value defines the value to test
     * @returns true if the value is an exponent of 2
     */
    static IsExponentOfTwo(value) {
        return true;
    }
    /**
     * Returns the nearest 32-bit single precision float representation of a Number
     * @param value A Number.  If the parameter is of a different type, it will get converted
     * to a number or to NaN if it cannot be converted
     * @returns number
     */
    static FloatRound(value) {
        return Math.fround(value);
    }
    /**
     * Extracts the filename from a path
     * @param path defines the path to use
     * @returns the filename
     */
    static GetFilename(path) {
        const index = path.lastIndexOf("/");
        if (index < 0) {
            return path;
        }
        return path.substring(index + 1);
    }
    /**
     * Extracts the "folder" part of a path (everything before the filename).
     * @param uri The URI to extract the info from
     * @param returnUnchangedIfNoSlash Do not touch the URI if no slashes are present
     * @returns The "folder" part of the path
     */
    static GetFolderPath(uri, returnUnchangedIfNoSlash = false) {
        const index = uri.lastIndexOf("/");
        if (index < 0) {
            if (returnUnchangedIfNoSlash) {
                return uri;
            }
            return "";
        }
        return uri.substring(0, index + 1);
    }
    /**
     * Convert an angle in radians to degrees
     * @param angle defines the angle to convert
     * @returns the angle in degrees
     */
    static ToDegrees(angle) {
        return (angle * 180) / Math.PI;
    }
    /**
     * Convert an angle in degrees to radians
     * @param angle defines the angle to convert
     * @returns the angle in radians
     */
    static ToRadians(angle) {
        return (angle * Math.PI) / 180;
    }
    /**
     * Smooth angle changes (kind of low-pass filter), in particular for device orientation "shaking"
     * Use trigonometric functions to avoid discontinuity (0/360, -180/180)
     * @param previousAngle defines last angle value, in degrees
     * @param newAngle defines new angle value, in degrees
     * @param smoothFactor defines smoothing sensitivity; min 0: no smoothing, max 1: new data ignored
     * @returns the angle in degrees
     */
    static SmoothAngleChange(previousAngle, newAngle, smoothFactor = 0.9) {
        const previousAngleRad = this.ToRadians(previousAngle);
        const newAngleRad = this.ToRadians(newAngle);
        return this.ToDegrees(Math.atan2((1 - smoothFactor) * Math.sin(newAngleRad) + smoothFactor * Math.sin(previousAngleRad), (1 - smoothFactor) * Math.cos(newAngleRad) + smoothFactor * Math.cos(previousAngleRad)));
    }
    /**
     * Returns an array if obj is not an array
     * @param obj defines the object to evaluate as an array
     * @param allowsNullUndefined defines a boolean indicating if obj is allowed to be null or undefined
     * @returns either obj directly if obj is an array or a new array containing obj
     */
    static MakeArray(obj, allowsNullUndefined) {
        if (allowsNullUndefined !== true && (obj === undefined || obj == null)) {
            return null;
        }
        return Array.isArray(obj) ? obj : [obj];
    }
    /**
     * Gets the pointer prefix to use
     * @param engine defines the engine we are finding the prefix for
     * @returns "pointer" if touch is enabled. Else returns "mouse"
     */
    static GetPointerPrefix(engine) {
        return IsWindowObjectExist() && !window.PointerEvent ? "mouse" : "pointer";
    }
    /**
     * Sets the cors behavior on a dom element. This will add the required Tools.CorsBehavior to the element.
     * @param url define the url we are trying
     * @param element define the dom element where to configure the cors policy
     * @param element.crossOrigin
     */
    static SetCorsBehavior(url, element) {
        SetCorsBehavior(url, element);
    }
    /**
     * Sets the referrerPolicy behavior on a dom element.
     * @param referrerPolicy define the referrer policy to use
     * @param element define the dom element where to configure the referrer policy
     * @param element.referrerPolicy
     */
    static SetReferrerPolicyBehavior(referrerPolicy, element) {
        element.referrerPolicy = referrerPolicy;
    }
    // External files
    /**
     * Gets or sets a function used to pre-process url before using them to load assets
     */
    static get PreprocessUrl() {
        return FileToolsOptions.PreprocessUrl;
    }
    static set PreprocessUrl(processor) {
        FileToolsOptions.PreprocessUrl = processor;
    }
    /**
     * Loads an image as an HTMLImageElement.
     * @param input url string, ArrayBuffer, or Blob to load
     * @param onLoad callback called when the image successfully loads
     * @param onError callback called when the image fails to load
     * @param offlineProvider offline provider for caching
     * @param mimeType optional mime type
     * @param imageBitmapOptions optional the options to use when creating an ImageBitmap
     * @returns the HTMLImageElement of the loaded image
     */
    static LoadImage(input, onLoad, onError, offlineProvider, mimeType, imageBitmapOptions) {
        return FileToolLoadImage(input, onLoad, onError, offlineProvider, mimeType, imageBitmapOptions);
    }
    /**
     * Loads a file from a url
     * @param url url string, ArrayBuffer, or Blob to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param offlineProvider defines the offline provider for caching
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     */
    static LoadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError) {
        return FileToolsLoadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
    }
    /**
     * Loads a file from a url
     * @param url the file url to load
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @returns a promise containing an ArrayBuffer corresponding to the loaded file
     */
    static LoadFileAsync(url, useArrayBuffer = true) {
        return new Promise((resolve, reject) => {
            FileToolsLoadFile(url, (data) => {
                resolve(data);
            }, undefined, undefined, useArrayBuffer, (request, exception) => {
                reject(exception);
            });
        });
    }
    /**
     * This function will convert asset URLs if the AssetBaseUrl parameter is set.
     * Any URL with `assets.babylonjs.com/core` will be replaced with the value of AssetBaseUrl.
     * @param url the URL to convert
     * @returns a new URL
     */
    static GetAssetUrl(url) {
        if (!url) {
            return "";
        }
        if (Tools.AssetBaseUrl && url.startsWith(Tools._DefaultAssetsUrl)) {
            // normalize the baseUrl
            const baseUrl = Tools.AssetBaseUrl[Tools.AssetBaseUrl.length - 1] === "/" ? Tools.AssetBaseUrl.substring(0, Tools.AssetBaseUrl.length - 1) : Tools.AssetBaseUrl;
            return url.replace(Tools._DefaultAssetsUrl, baseUrl);
        }
        return url;
    }
    /**
     * Get a script URL including preprocessing
     * @param scriptUrl the script Url to process
     * @param forceAbsoluteUrl force the script to be an absolute url (adding the current base url if necessary)
     * @returns a modified URL to use
     */
    static GetBabylonScriptURL(scriptUrl, forceAbsoluteUrl) {
        if (!scriptUrl) {
            return "";
        }
        // if the base URL was set, and the script Url is an absolute path change the default path
        if (Tools.ScriptBaseUrl && scriptUrl.startsWith(Tools._DefaultCdnUrl)) {
            // change the default host, which is https://cdn.babylonjs.com with the one defined
            // make sure no trailing slash is present
            const baseUrl = Tools.ScriptBaseUrl[Tools.ScriptBaseUrl.length - 1] === "/" ? Tools.ScriptBaseUrl.substring(0, Tools.ScriptBaseUrl.length - 1) : Tools.ScriptBaseUrl;
            scriptUrl = scriptUrl.replace(Tools._DefaultCdnUrl, baseUrl);
        }
        // run the preprocessor
        scriptUrl = Tools.ScriptPreprocessUrl(scriptUrl);
        if (forceAbsoluteUrl) {
            scriptUrl = Tools.GetAbsoluteUrl(scriptUrl);
        }
        return scriptUrl;
    }
    /**
     * This function is used internally by babylon components to load a script (identified by an url). When the url returns, the
     * content of this file is added into a new script element, attached to the DOM (body element)
     * @param scriptUrl defines the url of the script to load
     * @param onSuccess defines the callback called when the script is loaded
     * @param onError defines the callback to call if an error occurs
     * @param scriptId defines the id of the script element
     */
    static LoadBabylonScript(scriptUrl, onSuccess, onError, scriptId) {
        scriptUrl = Tools.GetBabylonScriptURL(scriptUrl);
        Tools.LoadScript(scriptUrl, onSuccess, onError);
    }
    /**
     * Load an asynchronous script (identified by an url). When the url returns, the
     * content of this file is added into a new script element, attached to the DOM (body element)
     * @param scriptUrl defines the url of the script to laod
     * @returns a promise request object
     */
    static LoadBabylonScriptAsync(scriptUrl) {
        scriptUrl = Tools.GetBabylonScriptURL(scriptUrl);
        return Tools.LoadScriptAsync(scriptUrl);
    }
    /**
     * This function is used internally by babylon components to load a script (identified by an url). When the url returns, the
     * content of this file is added into a new script element, attached to the DOM (body element)
     * @param scriptUrl defines the url of the script to load
     * @param onSuccess defines the callback called when the script is loaded
     * @param onError defines the callback to call if an error occurs
     * @param scriptId defines the id of the script element
     * @param useModule defines if we should use the module strategy to load the script
     */
    static LoadScript(scriptUrl, onSuccess, onError, scriptId, useModule = false) {
        if (typeof importScripts === "function") {
            try {
                importScripts(scriptUrl);
                if (onSuccess) {
                    onSuccess();
                }
            }
            catch (e) {
                onError?.(`Unable to load script '${scriptUrl}' in worker`, e);
            }
            return;
        }
        else if (!IsWindowObjectExist()) {
            onError?.(`Cannot load script '${scriptUrl}' outside of a window or a worker`);
            return;
        }
        const head = document.getElementsByTagName("head")[0];
        const script = document.createElement("script");
        if (useModule) {
            script.setAttribute("type", "module");
            script.innerText = scriptUrl;
        }
        else {
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", scriptUrl);
        }
        if (scriptId) {
            script.id = scriptId;
        }
        script.onload = () => {
            if (onSuccess) {
                onSuccess();
            }
        };
        script.onerror = (e) => {
            if (onError) {
                onError(`Unable to load script '${scriptUrl}'`, e);
            }
        };
        head.appendChild(script);
    }
    /**
     * Load an asynchronous script (identified by an url). When the url returns, the
     * content of this file is added into a new script element, attached to the DOM (body element)
     * @param scriptUrl defines the url of the script to load
     * @param scriptId defines the id of the script element
     * @returns a promise request object
     */
    static LoadScriptAsync(scriptUrl, scriptId) {
        return new Promise((resolve, reject) => {
            this.LoadScript(scriptUrl, () => {
                resolve();
            }, (message, exception) => {
                reject(exception || new Error(message));
            }, scriptId);
        });
    }
    /**
     * Loads a file from a blob
     * @param fileToLoad defines the blob to use
     * @param callback defines the callback to call when data is loaded
     * @param progressCallback defines the callback to call during loading process
     * @returns a file request object
     */
    static ReadFileAsDataURL(fileToLoad, callback, progressCallback) {
        const reader = new FileReader();
        const request = {
            onCompleteObservable: new Observable(),
            abort: () => reader.abort(),
        };
        reader.onloadend = () => {
            request.onCompleteObservable.notifyObservers(request);
        };
        reader.onload = (e) => {
            //target doesn't have result from ts 1.3
            callback(e.target["result"]);
        };
        reader.onprogress = progressCallback;
        reader.readAsDataURL(fileToLoad);
        return request;
    }
    /**
     * Reads a file from a File object
     * @param file defines the file to load
     * @param onSuccess defines the callback to call when data is loaded
     * @param onProgress defines the callback to call during loading process
     * @param useArrayBuffer defines a boolean indicating that data must be returned as an ArrayBuffer
     * @param onError defines the callback to call when an error occurs
     * @returns a file request object
     */
    static ReadFile(file, onSuccess, onProgress, useArrayBuffer, onError) {
        return FileToolsReadFile(file, onSuccess, onProgress, useArrayBuffer, onError);
    }
    /**
     * Creates a data url from a given string content
     * @param content defines the content to convert
     * @returns the new data url link
     */
    static FileAsURL(content) {
        const fileBlob = new Blob([content]);
        const url = window.URL;
        const link = url.createObjectURL(fileBlob);
        return link;
    }
    /**
     * Format the given number to a specific decimal format
     * @param value defines the number to format
     * @param decimals defines the number of decimals to use
     * @returns the formatted string
     */
    static Format(value, decimals = 2) {
        return value.toFixed(decimals);
    }
    /**
     * Tries to copy an object by duplicating every property
     * @param source defines the source object
     * @param destination defines the target object
     * @param doNotCopyList defines a list of properties to avoid
     * @param mustCopyList defines a list of properties to copy (even if they start with _)
     */
    static DeepCopy(source, destination, doNotCopyList, mustCopyList) {
        DeepCopier.DeepCopy(source, destination, doNotCopyList, mustCopyList);
    }
    /**
     * Gets a boolean indicating if the given object has no own property
     * @param obj defines the object to test
     * @returns true if object has no own property
     */
    static IsEmpty(obj) {
        for (const i in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, i)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Function used to register events at window level
     * @param windowElement defines the Window object to use
     * @param events defines the events to register
     */
    static RegisterTopRootEvents(windowElement, events) {
        for (let index = 0; index < events.length; index++) {
            const event = events[index];
            windowElement.addEventListener(event.name, event.handler, false);
            try {
                if (window.parent) {
                    window.parent.addEventListener(event.name, event.handler, false);
                }
            }
            catch (e) {
                // Silently fails...
            }
        }
    }
    /**
     * Function used to unregister events from window level
     * @param windowElement defines the Window object to use
     * @param events defines the events to unregister
     */
    static UnregisterTopRootEvents(windowElement, events) {
        for (let index = 0; index < events.length; index++) {
            const event = events[index];
            windowElement.removeEventListener(event.name, event.handler);
            try {
                if (windowElement.parent) {
                    windowElement.parent.removeEventListener(event.name, event.handler);
                }
            }
            catch (e) {
                // Silently fails...
            }
        }
    }
    /**
     * Dumps the current bound framebuffer
     * @param width defines the rendering width
     * @param height defines the rendering height
     * @param engine defines the hosting engine
     * @param successCallback defines the callback triggered once the data are available
     * @param mimeType defines the mime type of the result
     * @param fileName defines the filename to download. If present, the result will automatically be downloaded
     * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
     * @returns a void promise
     */
    static async DumpFramebuffer(width, height, engine, successCallback, mimeType = "image/png", fileName, quality) {
        throw _WarnImport("DumpTools");
    }
    /**
     * Dumps an array buffer
     * @param width defines the rendering width
     * @param height defines the rendering height
     * @param data the data array
     * @param successCallback defines the callback triggered once the data are available
     * @param mimeType defines the mime type of the result
     * @param fileName defines the filename to download. If present, the result will automatically be downloaded
     * @param invertY true to invert the picture in the Y dimension
     * @param toArrayBuffer true to convert the data to an ArrayBuffer (encoded as `mimeType`) instead of a base64 string
     * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
     */
    static DumpData(width, height, data, successCallback, mimeType = "image/png", fileName, invertY = false, toArrayBuffer = false, quality) {
        throw _WarnImport("DumpTools");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Dumps an array buffer
     * @param width defines the rendering width
     * @param height defines the rendering height
     * @param data the data array
     * @param mimeType defines the mime type of the result
     * @param fileName defines the filename to download. If present, the result will automatically be downloaded
     * @param invertY true to invert the picture in the Y dimension
     * @param toArrayBuffer true to convert the data to an ArrayBuffer (encoded as `mimeType`) instead of a base64 string
     * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
     * @returns a promise that resolve to the final data
     */
    static DumpDataAsync(width, height, data, mimeType = "image/png", fileName, invertY = false, toArrayBuffer = false, quality) {
        throw _WarnImport("DumpTools");
    }
    static _IsOffScreenCanvas(canvas) {
        return canvas.convertToBlob !== undefined;
    }
    /**
     * Converts the canvas data to blob.
     * This acts as a polyfill for browsers not supporting the to blob function.
     * @param canvas Defines the canvas to extract the data from (can be an offscreen canvas)
     * @param successCallback Defines the callback triggered once the data are available
     * @param mimeType Defines the mime type of the result
     * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
     */
    static ToBlob(canvas, successCallback, mimeType = "image/png", quality) {
        // We need HTMLCanvasElement.toBlob for HD screenshots
        if (!Tools._IsOffScreenCanvas(canvas) && !canvas.toBlob) {
            //  low performance polyfill based on toDataURL (https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
            canvas.toBlob = function (callback, type, quality) {
                setTimeout(() => {
                    const binStr = atob(this.toDataURL(type, quality).split(",")[1]), len = binStr.length, arr = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        arr[i] = binStr.charCodeAt(i);
                    }
                    callback(new Blob([arr]));
                });
            };
        }
        if (Tools._IsOffScreenCanvas(canvas)) {
            canvas
                .convertToBlob({
                type: mimeType,
                quality,
            })
                .then((blob) => successCallback(blob));
        }
        else {
            canvas.toBlob(function (blob) {
                successCallback(blob);
            }, mimeType, quality);
        }
    }
    /**
     * Download a Blob object
     * @param blob the Blob object
     * @param fileName the file name to download
     */
    static DownloadBlob(blob, fileName) {
        //Creating a link if the browser have the download attribute on the a tag, to automatically start download generated image.
        if ("download" in document.createElement("a")) {
            if (!fileName) {
                const date = new Date();
                const stringDate = (date.getFullYear() + "-" + (date.getMonth() + 1)).slice(2) + "-" + date.getDate() + "_" + date.getHours() + "-" + ("0" + date.getMinutes()).slice(-2);
                fileName = "screenshot_" + stringDate + ".png";
            }
            Tools.Download(blob, fileName);
        }
        else {
            if (blob && typeof URL !== "undefined") {
                const url = URL.createObjectURL(blob);
                const newWindow = window.open("");
                if (!newWindow) {
                    return;
                }
                const img = newWindow.document.createElement("img");
                img.onload = function () {
                    // no longer need to read the blob so it's revoked
                    URL.revokeObjectURL(url);
                };
                img.src = url;
                newWindow.document.body.appendChild(img);
            }
        }
    }
    /**
     * Encodes the canvas data to base 64, or automatically downloads the result if `fileName` is defined.
     * @param canvas The canvas to get the data from, which can be an offscreen canvas.
     * @param successCallback The callback which is triggered once the data is available. If `fileName` is defined, the callback will be invoked after the download occurs, and the `data` argument will be an empty string.
     * @param mimeType The mime type of the result.
     * @param fileName The name of the file to download. If defined, the result will automatically be downloaded. If not defined, and `successCallback` is also not defined, the result will automatically be downloaded with an auto-generated file name.
     * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
     */
    static EncodeScreenshotCanvasData(canvas, successCallback, mimeType = "image/png", fileName, quality) {
        if (typeof fileName === "string" || !successCallback) {
            this.ToBlob(canvas, function (blob) {
                if (blob) {
                    Tools.DownloadBlob(blob, fileName);
                }
                if (successCallback) {
                    successCallback("");
                }
            }, mimeType, quality);
        }
        else if (successCallback) {
            if (Tools._IsOffScreenCanvas(canvas)) {
                canvas
                    .convertToBlob({
                    type: mimeType,
                    quality,
                })
                    .then((blob) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        successCallback(base64data);
                    };
                });
                return;
            }
            const base64Image = canvas.toDataURL(mimeType, quality);
            successCallback(base64Image);
        }
    }
    /**
     * Downloads a blob in the browser
     * @param blob defines the blob to download
     * @param fileName defines the name of the downloaded file
     */
    static Download(blob, fileName) {
        if (typeof URL === "undefined") {
            return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = fileName;
        a.addEventListener("click", () => {
            if (a.parentElement) {
                a.parentElement.removeChild(a);
            }
        });
        a.click();
        window.URL.revokeObjectURL(url);
    }
    /**
     * Will return the right value of the noPreventDefault variable
     * Needed to keep backwards compatibility to the old API.
     *
     * @param args arguments passed to the attachControl function
     * @returns the correct value for noPreventDefault
     */
    static BackCompatCameraNoPreventDefault(args) {
        // is it used correctly?
        if (typeof args[0] === "boolean") {
            return args[0];
        }
        else if (typeof args[1] === "boolean") {
            return args[1];
        }
        return false;
    }
    /**
     * Captures a screenshot of the current rendering
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/renderToPNG
     * @param engine defines the rendering engine
     * @param camera defines the source camera
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param successCallback defines the callback receives a single parameter which contains the
     * screenshot as a string of base64-encoded characters. This string can be assigned to the
     * src parameter of an <img> to display it
     * @param mimeType defines the MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     * @param forceDownload force the system to download the image even if a successCallback is provided
     * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static CreateScreenshot(engine, camera, size, successCallback, mimeType = "image/png", forceDownload = false, quality) {
        throw _WarnImport("ScreenshotTools");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Captures a screenshot of the current rendering
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/renderToPNG
     * @param engine defines the rendering engine
     * @param camera defines the source camera
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param mimeType defines the MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
     * @returns screenshot as a string of base64-encoded characters. This string can be assigned
     * to the src parameter of an <img> to display it
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static CreateScreenshotAsync(engine, camera, size, mimeType = "image/png", quality) {
        throw _WarnImport("ScreenshotTools");
    }
    /**
     * Generates an image screenshot from the specified camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/renderToPNG
     * @param engine The engine to use for rendering
     * @param camera The camera to use for rendering
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param successCallback The callback receives a single parameter which contains the
     * screenshot as a string of base64-encoded characters. This string can be assigned to the
     * src parameter of an <img> to display it
     * @param mimeType The MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     * @param samples Texture samples (default: 1)
     * @param antialiasing Whether antialiasing should be turned on or not (default: false)
     * @param fileName A name for for the downloaded file.
     * @param renderSprites Whether the sprites should be rendered or not (default: false)
     * @param enableStencilBuffer Whether the stencil buffer should be enabled or not (default: false)
     * @param useLayerMask if the camera's layer mask should be used to filter what should be rendered (default: true)
     * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
     * @param customizeTexture An optional callback that can be used to modify the render target texture before taking the screenshot. This can be used, for instance, to enable camera post-processes before taking the screenshot.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static CreateScreenshotUsingRenderTarget(engine, camera, size, successCallback, mimeType = "image/png", samples = 1, antialiasing = false, fileName, renderSprites = false, enableStencilBuffer = false, useLayerMask = true, quality, customizeTexture) {
        throw _WarnImport("ScreenshotTools");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Generates an image screenshot from the specified camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/renderToPNG
     * @param engine The engine to use for rendering
     * @param camera The camera to use for rendering
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param mimeType The MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     * @param samples Texture samples (default: 1)
     * @param antialiasing Whether antialiasing should be turned on or not (default: false)
     * @param fileName A name for for the downloaded file.
     * @param renderSprites Whether the sprites should be rendered or not (default: false)
     * @param enableStencilBuffer Whether the stencil buffer should be enabled or not (default: false)
     * @param useLayerMask if the camera's layer mask should be used to filter what should be rendered (default: true)
     * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
     * @param customizeTexture An optional callback that can be used to modify the render target texture before taking the screenshot. This can be used, for instance, to enable camera post-processes before taking the screenshot.
     * @returns screenshot as a string of base64-encoded characters. This string can be assigned
     * to the src parameter of an <img> to display it
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static CreateScreenshotUsingRenderTargetAsync(engine, camera, size, mimeType = "image/png", samples = 1, antialiasing = false, fileName, renderSprites = false, enableStencilBuffer = false, useLayerMask = true, quality, customizeTexture) {
        throw _WarnImport("ScreenshotTools");
    }
    /**
     * Implementation from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
     * Be aware Math.random() could cause collisions, but:
     * "All but 6 of the 128 bits of the ID are randomly generated, which means that for any two ids, there's a 1 in 2^^122 (or 5.3x10^^36) chance they'll collide"
     * @returns a pseudo random id
     */
    static RandomId() {
        return RandomGUID();
    }
    /**
     * Test if the given uri is a base64 string
     * @deprecated Please use FileTools.IsBase64DataUrl instead.
     * @param uri The uri to test
     * @returns True if the uri is a base64 string or false otherwise
     */
    static IsBase64(uri) {
        return IsBase64DataUrl(uri);
    }
    /**
     * Decode the given base64 uri.
     * @deprecated Please use FileTools.DecodeBase64UrlToBinary instead.
     * @param uri The uri to decode
     * @returns The decoded base64 data.
     */
    static DecodeBase64(uri) {
        return DecodeBase64UrlToBinary(uri);
    }
    /**
     * Gets a value indicating the number of loading errors
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static get errorsCount() {
        return Logger.errorsCount;
    }
    /**
     * Log a message to the console
     * @param message defines the message to log
     */
    static Log(message) {
        Logger.Log(message);
    }
    /**
     * Write a warning message to the console
     * @param message defines the message to log
     */
    static Warn(message) {
        Logger.Warn(message);
    }
    /**
     * Write an error message to the console
     * @param message defines the message to log
     */
    static Error(message) {
        Logger.Error(message);
    }
    /**
     * Gets current log cache (list of logs)
     */
    static get LogCache() {
        return Logger.LogCache;
    }
    /**
     * Clears the log cache
     */
    static ClearLogCache() {
        Logger.ClearLogCache();
    }
    /**
     * Sets the current log level (MessageLogLevel / WarningLogLevel / ErrorLogLevel)
     */
    static set LogLevels(level) {
        Logger.LogLevels = level;
    }
    /**
     * Sets the current performance log level
     */
    static set PerformanceLogLevel(level) {
        if ((level & Tools.PerformanceUserMarkLogLevel) === Tools.PerformanceUserMarkLogLevel) {
            Tools.StartPerformanceCounter = Tools._StartUserMark;
            Tools.EndPerformanceCounter = Tools._EndUserMark;
            return;
        }
        if ((level & Tools.PerformanceConsoleLogLevel) === Tools.PerformanceConsoleLogLevel) {
            Tools.StartPerformanceCounter = Tools._StartPerformanceConsole;
            Tools.EndPerformanceCounter = Tools._EndPerformanceConsole;
            return;
        }
        Tools.StartPerformanceCounter = Tools._StartPerformanceCounterDisabled;
        Tools.EndPerformanceCounter = Tools._EndPerformanceCounterDisabled;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static _StartPerformanceCounterDisabled(counterName, condition) { }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static _EndPerformanceCounterDisabled(counterName, condition) { }
    static _StartUserMark(counterName, condition = true) {
        if (!Tools._Performance) {
            if (!IsWindowObjectExist()) {
                return;
            }
            Tools._Performance = window.performance;
        }
        if (!condition || !Tools._Performance.mark) {
            return;
        }
        Tools._Performance.mark(counterName + "-Begin");
    }
    static _EndUserMark(counterName, condition = true) {
        if (!condition || !Tools._Performance.mark) {
            return;
        }
        Tools._Performance.mark(counterName + "-End");
        Tools._Performance.measure(counterName, counterName + "-Begin", counterName + "-End");
    }
    static _StartPerformanceConsole(counterName, condition = true) {
        if (!condition) {
            return;
        }
        Tools._StartUserMark(counterName, condition);
        if (console.time) {
            console.time(counterName);
        }
    }
    static _EndPerformanceConsole(counterName, condition = true) {
        if (!condition) {
            return;
        }
        Tools._EndUserMark(counterName, condition);
        console.timeEnd(counterName);
    }
    /**
     * Gets either window.performance.now() if supported or Date.now() else
     */
    static get Now() {
        return PrecisionDate.Now;
    }
    /**
     * This method will return the name of the class used to create the instance of the given object.
     * It will works only on Javascript basic data types (number, string, ...) and instance of class declared with the @className decorator.
     * @param object the object to get the class name from
     * @param isType defines if the object is actually a type
     * @returns the name of the class, will be "object" for a custom data type not using the @className decorator
     */
    static GetClassName(object, isType = false) {
        let name = null;
        if (!isType && object.getClassName) {
            name = object.getClassName();
        }
        else {
            if (object instanceof Object) {
                const classObj = isType ? object : Object.getPrototypeOf(object);
                name = classObj.constructor["__bjsclassName__"];
            }
            if (!name) {
                name = typeof object;
            }
        }
        return name;
    }
    /**
     * Gets the first element of an array satisfying a given predicate
     * @param array defines the array to browse
     * @param predicate defines the predicate to use
     * @returns null if not found or the element
     */
    static First(array, predicate) {
        for (const el of array) {
            if (predicate(el)) {
                return el;
            }
        }
        return null;
    }
    /**
     * This method will return the name of the full name of the class, including its owning module (if any).
     * It will works only on Javascript basic data types (number, string, ...) and instance of class declared with the @className decorator or implementing a method getClassName():string (in which case the module won't be specified).
     * @param object the object to get the class name from
     * @param isType defines if the object is actually a type
     * @returns a string that can have two forms: "moduleName.className" if module was specified when the class' Name was registered or "className" if there was not module specified.
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static getFullClassName(object, isType = false) {
        let className = null;
        let moduleName = null;
        if (!isType && object.getClassName) {
            className = object.getClassName();
        }
        else {
            if (object instanceof Object) {
                const classObj = isType ? object : Object.getPrototypeOf(object);
                className = classObj.constructor["__bjsclassName__"];
                moduleName = classObj.constructor["__bjsmoduleName__"];
            }
            if (!className) {
                className = typeof object;
            }
        }
        if (!className) {
            return null;
        }
        return (moduleName != null ? moduleName + "." : "") + className;
    }
    /**
     * Returns a promise that resolves after the given amount of time.
     * @param delay Number of milliseconds to delay
     * @returns Promise that resolves after the given amount of time
     */
    static DelayAsync(delay) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    }
    /**
     * Utility function to detect if the current user agent is Safari
     * @returns whether or not the current user agent is safari
     */
    static IsSafari() {
        if (!IsNavigatorAvailable()) {
            return false;
        }
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
}
/**
 * The base URL to use to load assets. If empty the default base url is used.
 */
Tools.AssetBaseUrl = "";
/**
 * Enable/Disable Custom HTTP Request Headers globally.
 * default = false
 * @see CustomRequestHeaders
 */
Tools.UseCustomRequestHeaders = false;
/**
 * Custom HTTP Request Headers to be sent with XMLHttpRequests
 * i.e. when loading files, where the server/service expects an Authorization header
 */
Tools.CustomRequestHeaders = WebRequest.CustomRequestHeaders;
/**
 * Extracts text content from a DOM element hierarchy
 * Back Compat only, please use GetDOMTextContent instead.
 */
Tools.GetDOMTextContent = GetDOMTextContent;
/**
 * @internal
 */
Tools._DefaultCdnUrl = "https://cdn.babylonjs.com";
/**
 * @internal
 */
Tools._DefaultAssetsUrl = "https://assets.babylonjs.com/core";
// eslint-disable-next-line jsdoc/require-returns-check, jsdoc/require-param
/**
 * @returns the absolute URL of a given (relative) url
 */
Tools.GetAbsoluteUrl = typeof document === "object"
    ? (url) => {
        const a = document.createElement("a");
        a.href = url;
        return a.href;
    }
    : typeof URL === "function" && typeof location === "object"
        ? (url) => new URL(url, location.origin).href
        : () => {
            throw new Error("Unable to get absolute URL. Override BABYLON.Tools.GetAbsoluteUrl to a custom implementation for the current context.");
        };
// Logs
/**
 * No log
 */
Tools.NoneLogLevel = Logger.NoneLogLevel;
/**
 * Only message logs
 */
Tools.MessageLogLevel = Logger.MessageLogLevel;
/**
 * Only warning logs
 */
Tools.WarningLogLevel = Logger.WarningLogLevel;
/**
 * Only error logs
 */
Tools.ErrorLogLevel = Logger.ErrorLogLevel;
/**
 * All logs
 */
Tools.AllLogLevel = Logger.AllLogLevel;
/**
 * Checks if the window object exists
 * Back Compat only, please use IsWindowObjectExist instead.
 */
Tools.IsWindowObjectExist = IsWindowObjectExist;
// Performances
/**
 * No performance log
 */
Tools.PerformanceNoneLogLevel = 0;
/**
 * Use user marks to log performance
 */
Tools.PerformanceUserMarkLogLevel = 1;
/**
 * Log performance to the console
 */
Tools.PerformanceConsoleLogLevel = 2;
/**
 * Starts a performance counter
 */
Tools.StartPerformanceCounter = Tools._StartPerformanceCounterDisabled;
/**
 * Ends a specific performance counter
 */
Tools.EndPerformanceCounter = Tools._EndPerformanceCounterDisabled;
/**
 * Use this className as a decorator on a given class definition to add it a name and optionally its module.
 * You can then use the Tools.getClassName(obj) on an instance to retrieve its class name.
 * This method is the only way to get it done in all cases, even if the .js file declaring the class is minified
 * @param name The name of the class, case should be preserved
 * @param module The name of the Module hosting the class, optional, but strongly recommended to specify if possible. Case should be preserved.
 * @returns a decorator function to apply on the class definition.
 */
export function className(name, module) {
    return (target) => {
        target["__bjsclassName__"] = name;
        target["__bjsmoduleName__"] = module != null ? module : null;
    };
}
/**
 * An implementation of a loop for asynchronous functions.
 */
export class AsyncLoop {
    /**
     * Constructor.
     * @param iterations the number of iterations.
     * @param func the function to run each iteration
     * @param successCallback the callback that will be called upon successful execution
     * @param offset starting offset.
     */
    constructor(
    /**
     * Defines the number of iterations for the loop
     */
    iterations, func, successCallback, offset = 0) {
        this.iterations = iterations;
        this.index = offset - 1;
        this._done = false;
        this._fn = func;
        this._successCallback = successCallback;
    }
    /**
     * Execute the next iteration. Must be called after the last iteration was finished.
     */
    executeNext() {
        if (!this._done) {
            if (this.index + 1 < this.iterations) {
                ++this.index;
                this._fn(this);
            }
            else {
                this.breakLoop();
            }
        }
    }
    /**
     * Break the loop and run the success callback.
     */
    breakLoop() {
        this._done = true;
        this._successCallback();
    }
    /**
     * Create and run an async loop.
     * @param iterations the number of iterations.
     * @param fn the function to run each iteration
     * @param successCallback the callback that will be called upon successful execution
     * @param offset starting offset.
     * @returns the created async loop object
     */
    static Run(iterations, fn, successCallback, offset = 0) {
        const loop = new AsyncLoop(iterations, fn, successCallback, offset);
        loop.executeNext();
        return loop;
    }
    /**
     * A for-loop that will run a given number of iterations synchronous and the rest async.
     * @param iterations total number of iterations
     * @param syncedIterations number of synchronous iterations in each async iteration.
     * @param fn the function to call each iteration.
     * @param callback a success call back that will be called when iterating stops.
     * @param breakFunction a break condition (optional)
     * @param timeout timeout settings for the setTimeout function. default - 0.
     * @returns the created async loop object
     */
    static SyncAsyncForLoop(iterations, syncedIterations, fn, callback, breakFunction, timeout = 0) {
        return AsyncLoop.Run(Math.ceil(iterations / syncedIterations), (loop) => {
            if (breakFunction && breakFunction()) {
                loop.breakLoop();
            }
            else {
                setTimeout(() => {
                    for (let i = 0; i < syncedIterations; ++i) {
                        const iteration = loop.index * syncedIterations + i;
                        if (iteration >= iterations) {
                            break;
                        }
                        fn(iteration);
                        if (breakFunction && breakFunction()) {
                            loop.breakLoop();
                            break;
                        }
                    }
                    loop.executeNext();
                }, timeout);
            }
        }, callback);
    }
}
Tools.Mix = Mix;
Tools.IsExponentOfTwo = IsExponentOfTwo;
// Will only be define if Tools is imported freeing up some space when only engine is required
EngineStore.FallbackTexture =
    "data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBmRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAAQAAAATgAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMC41AP/bAEMABAIDAwMCBAMDAwQEBAQFCQYFBQUFCwgIBgkNCw0NDQsMDA4QFBEODxMPDAwSGBITFRYXFxcOERkbGRYaFBYXFv/bAEMBBAQEBQUFCgYGChYPDA8WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFv/AABEIAQABAAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APH6KKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76P//Z";
//# sourceMappingURL=tools.js.map