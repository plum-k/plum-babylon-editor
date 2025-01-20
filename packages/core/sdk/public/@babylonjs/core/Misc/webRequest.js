/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
function createXMLHttpRequest() {
    // If running in Babylon Native, then defer to the native XMLHttpRequest, which has the same public contract
    if (typeof _native !== "undefined" && _native.XMLHttpRequest) {
        return new _native.XMLHttpRequest();
    }
    else {
        return new XMLHttpRequest();
    }
}
/**
 * Extended version of XMLHttpRequest with support for customizations (headers, ...)
 */
export class WebRequest {
    constructor() {
        this._xhr = createXMLHttpRequest();
        this._requestURL = "";
    }
    /**
     * This function can be called to check if there are request modifiers for network requests
     * @returns true if there are any custom requests available
     */
    static get IsCustomRequestAvailable() {
        return Object.keys(WebRequest.CustomRequestHeaders).length > 0 || WebRequest.CustomRequestModifiers.length > 0;
    }
    /**
     * Returns the requested URL once open has been called
     */
    get requestURL() {
        return this._requestURL;
    }
    _injectCustomRequestHeaders() {
        if (this._shouldSkipRequestModifications(this._requestURL)) {
            return;
        }
        for (const key in WebRequest.CustomRequestHeaders) {
            const val = WebRequest.CustomRequestHeaders[key];
            if (val) {
                this._xhr.setRequestHeader(key, val);
            }
        }
    }
    _shouldSkipRequestModifications(url) {
        return WebRequest.SkipRequestModificationForBabylonCDN && (url.includes("preview.babylonjs.com") || url.includes("cdn.babylonjs.com"));
    }
    /**
     * Gets or sets a function to be called when loading progress changes
     */
    get onprogress() {
        return this._xhr.onprogress;
    }
    set onprogress(value) {
        this._xhr.onprogress = value;
    }
    /**
     * Returns client's state
     */
    get readyState() {
        return this._xhr.readyState;
    }
    /**
     * Returns client's status
     */
    get status() {
        return this._xhr.status;
    }
    /**
     * Returns client's status as a text
     */
    get statusText() {
        return this._xhr.statusText;
    }
    /**
     * Returns client's response
     */
    get response() {
        return this._xhr.response;
    }
    /**
     * Returns client's response url
     */
    get responseURL() {
        return this._xhr.responseURL;
    }
    /**
     * Returns client's response as text
     */
    get responseText() {
        return this._xhr.responseText;
    }
    /**
     * Gets or sets the expected response type
     */
    get responseType() {
        return this._xhr.responseType;
    }
    set responseType(value) {
        this._xhr.responseType = value;
    }
    /**
     * Gets or sets the timeout value in milliseconds
     */
    get timeout() {
        return this._xhr.timeout;
    }
    set timeout(value) {
        this._xhr.timeout = value;
    }
    addEventListener(type, listener, options) {
        this._xhr.addEventListener(type, listener, options);
    }
    removeEventListener(type, listener, options) {
        this._xhr.removeEventListener(type, listener, options);
    }
    /**
     * Cancels any network activity
     */
    abort() {
        this._xhr.abort();
    }
    /**
     * Initiates the request. The optional argument provides the request body. The argument is ignored if request method is GET or HEAD
     * @param body defines an optional request body
     */
    send(body) {
        if (WebRequest.CustomRequestHeaders) {
            this._injectCustomRequestHeaders();
        }
        this._xhr.send(body);
    }
    /**
     * Sets the request method, request URL
     * @param method defines the method to use (GET, POST, etc..)
     * @param url defines the url to connect with
     */
    open(method, url) {
        for (const update of WebRequest.CustomRequestModifiers) {
            if (this._shouldSkipRequestModifications(url)) {
                return;
            }
            url = update(this._xhr, url) || url;
        }
        // Clean url
        url = url.replace("file:http:", "http:");
        url = url.replace("file:https:", "https:");
        this._requestURL = url;
        this._xhr.open(method, url, true);
    }
    /**
     * Sets the value of a request header.
     * @param name The name of the header whose value is to be set
     * @param value The value to set as the body of the header
     */
    setRequestHeader(name, value) {
        this._xhr.setRequestHeader(name, value);
    }
    /**
     * Get the string containing the text of a particular header's value.
     * @param name The name of the header
     * @returns The string containing the text of the given header name
     */
    getResponseHeader(name) {
        return this._xhr.getResponseHeader(name);
    }
}
/**
 * Custom HTTP Request Headers to be sent with XMLHttpRequests
 * i.e. when loading files, where the server/service expects an Authorization header
 */
WebRequest.CustomRequestHeaders = {};
/**
 * Add callback functions in this array to update all the requests before they get sent to the network
 */
WebRequest.CustomRequestModifiers = new Array();
/**
 * If set to true, requests to Babylon.js CDN requests will not be modified
 */
WebRequest.SkipRequestModificationForBabylonCDN = true;
//# sourceMappingURL=webRequest.js.map