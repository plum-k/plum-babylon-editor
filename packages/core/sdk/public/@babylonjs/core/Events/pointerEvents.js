import { Vector2 } from "../Maths/math.vector.js";
/**
 * Gather the list of pointer event types as constants.
 */
export class PointerEventTypes {
}
/**
 * The pointerdown event is fired when a pointer becomes active. For mouse, it is fired when the device transitions from no buttons depressed to at least one button depressed. For touch, it is fired when physical contact is made with the digitizer. For pen, it is fired when the stylus makes physical contact with the digitizer.
 */
PointerEventTypes.POINTERDOWN = 0x01;
/**
 * The pointerup event is fired when a pointer is no longer active.
 */
PointerEventTypes.POINTERUP = 0x02;
/**
 * The pointermove event is fired when a pointer changes coordinates.
 */
PointerEventTypes.POINTERMOVE = 0x04;
/**
 * The pointerwheel event is fired when a mouse wheel has been rotated.
 */
PointerEventTypes.POINTERWHEEL = 0x08;
/**
 * The pointerpick event is fired when a mesh or sprite has been picked by the pointer.
 */
PointerEventTypes.POINTERPICK = 0x10;
/**
 * The pointertap event is fired when a the object has been touched and released without drag.
 */
PointerEventTypes.POINTERTAP = 0x20;
/**
 * The pointerdoubletap event is fired when a the object has been touched and released twice without drag.
 */
PointerEventTypes.POINTERDOUBLETAP = 0x40;
/**
 * Base class of pointer info types.
 */
export class PointerInfoBase {
    /**
     * Instantiates the base class of pointers info.
     * @param type Defines the type of event (PointerEventTypes)
     * @param event Defines the related dom event
     */
    constructor(
    /**
     * Defines the type of event (PointerEventTypes)
     */
    type, 
    /**
     * Defines the related dom event
     */
    event) {
        this.type = type;
        this.event = event;
    }
}
/**
 * This class is used to store pointer related info for the onPrePointerObservable event.
 * Set the skipOnPointerObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onPointerObservable
 */
export class PointerInfoPre extends PointerInfoBase {
    /**
     * Instantiates a PointerInfoPre to store pointer related info to the onPrePointerObservable event.
     * @param type Defines the type of event (PointerEventTypes)
     * @param event Defines the related dom event
     * @param localX Defines the local x coordinates of the pointer when the event occured
     * @param localY Defines the local y coordinates of the pointer when the event occured
     */
    constructor(type, event, localX, localY) {
        super(type, event);
        /**
         * Ray from a pointer if available (eg. 6dof controller)
         */
        this.ray = null;
        /**
         * The original picking info that was used to trigger the pointer event
         */
        this.originalPickingInfo = null;
        this.skipOnPointerObservable = false;
        this.localPosition = new Vector2(localX, localY);
    }
}
/**
 * This type contains all the data related to a pointer event in Babylon.js.
 * The event member is an instance of PointerEvent for all types except PointerWheel and is of type MouseWheelEvent when type equals PointerWheel. The different event types can be found in the PointerEventTypes class.
 */
export class PointerInfo extends PointerInfoBase {
    /**
     * Defines the picking info associated with this PointerInfo object (if applicable)
     */
    get pickInfo() {
        if (!this._pickInfo) {
            this._generatePickInfo();
        }
        return this._pickInfo;
    }
    /**
     * Instantiates a PointerInfo to store pointer related info to the onPointerObservable event.
     * @param type Defines the type of event (PointerEventTypes)
     * @param event Defines the related dom event
     * @param pickInfo Defines the picking info associated to the info (if any)
     * @param inputManager Defines the InputManager to use if there is no pickInfo
     */
    constructor(type, event, pickInfo, inputManager = null) {
        super(type, event);
        this._pickInfo = pickInfo;
        this._inputManager = inputManager;
    }
    /**
     * Generates the picking info if needed
     */
    /** @internal */
    _generatePickInfo() {
        if (this._inputManager) {
            this._pickInfo = this._inputManager._pickMove(this.event);
            this._inputManager._setRayOnPointerInfo(this._pickInfo, this.event);
            this._inputManager = null;
        }
    }
}
//# sourceMappingURL=pointerEvents.js.map