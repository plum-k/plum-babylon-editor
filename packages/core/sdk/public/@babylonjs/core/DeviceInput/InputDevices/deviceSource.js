import { Observable } from "../../Misc/observable.js";
/**
 * Class that handles all input for a specific device
 */
export class DeviceSource {
    /**
     * Default Constructor
     * @param deviceInputSystem - Reference to DeviceInputSystem
     * @param deviceType - Type of device
     * @param deviceSlot - "Slot" or index that device is referenced in
     */
    constructor(deviceInputSystem, 
    /** Type of device */
    deviceType, 
    /** [0] "Slot" or index that device is referenced in */
    deviceSlot = 0) {
        this.deviceType = deviceType;
        this.deviceSlot = deviceSlot;
        // Public Members
        /**
         * Observable to handle device input changes per device
         */
        this.onInputChangedObservable = new Observable();
        this._deviceInputSystem = deviceInputSystem;
    }
    /**
     * Get input for specific input
     * @param inputIndex - index of specific input on device
     * @returns Input value from DeviceInputSystem
     */
    getInput(inputIndex) {
        return this._deviceInputSystem.pollInput(this.deviceType, this.deviceSlot, inputIndex);
    }
}
//# sourceMappingURL=deviceSource.js.map