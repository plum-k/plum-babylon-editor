/**
 * Event Types
 */
export var DeviceInputEventType;
(function (DeviceInputEventType) {
    // Pointers
    /** PointerMove */
    DeviceInputEventType[DeviceInputEventType["PointerMove"] = 0] = "PointerMove";
    /** PointerDown */
    DeviceInputEventType[DeviceInputEventType["PointerDown"] = 1] = "PointerDown";
    /** PointerUp */
    DeviceInputEventType[DeviceInputEventType["PointerUp"] = 2] = "PointerUp";
})(DeviceInputEventType || (DeviceInputEventType = {}));
/**
 * Constants used for Events
 */
export class EventConstants {
}
/**
 * Pixel delta for Wheel Events (Default)
 */
EventConstants.DOM_DELTA_PIXEL = 0x00;
/**
 * Line delta for Wheel Events
 */
EventConstants.DOM_DELTA_LINE = 0x01;
/**
 * Page delta for Wheel Events
 */
EventConstants.DOM_DELTA_PAGE = 0x02;
//# sourceMappingURL=deviceInputEvents.js.map