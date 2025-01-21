type CaptureReleaseCallback = () => void;
/**
 * Get the id of the object currently capturing pointer events
 * @returns The id of the object currently capturing pointer events
 * or null if no object is capturing pointer events
 */
export declare const getCapturingId: () => string | null;
/**
 * Request that the object with the given id capture pointer events.  If there is no current
 * owner, then the request is granted immediately.  If there is a current owner, then the request
 * is queued until the current owner releases pointer events.
 * @param requestId An id to identify the request.  This id will be used to match the capture
 * request with the release request.
 * @param captureCallback The callback to call when the request is granted and the object is capturing
 * @param releaseCallback The callback to call when the object is no longer capturing pointer events
 */
export declare const requestCapture: (requestId: string, captureCallback: CaptureReleaseCallback, releaseCallback: CaptureReleaseCallback) => void;
/**
 * Release pointer events from the object with the given id.  If the object is the current owner
 * then pointer events are released immediately.  If the object is not the current owner, then the
 * associated capture request is removed from the queue.  If there is no matching capture request
 * in the queue, then the release request is added to a list of unmatched release requests and will
 * negate the next capture request with the same id.  This is to guard against the possibility that
 * the release request arrived before the capture request.
 * @param requestId The id which should match the id of the capture request
 */
export declare const requestRelease: (requestId: string | null) => void;
/**
 * Relase pointer events from the current owner
 */
export declare const releaseCurrent: () => void;
declare global {
    interface Window {
        "pointer-events-capture-debug": boolean | null;
    }
}
export {};
