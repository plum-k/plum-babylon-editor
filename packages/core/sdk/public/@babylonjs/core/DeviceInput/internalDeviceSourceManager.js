import { DeviceType } from "./InputDevices/deviceEnums.js";
import { NativeDeviceInputSystem } from "./nativeDeviceInputSystem.js";
import { WebDeviceInputSystem } from "./webDeviceInputSystem.js";
import { DeviceSource } from "./InputDevices/deviceSource.js";
/** @internal */
export class InternalDeviceSourceManager {
    constructor(engine) {
        this._registeredManagers = new Array();
        this._refCount = 0;
        // Public Functions
        this.registerManager = (manager) => {
            for (let deviceType = 0; deviceType < this._devices.length; deviceType++) {
                const device = this._devices[deviceType];
                for (const deviceSlotKey in device) {
                    const deviceSlot = +deviceSlotKey;
                    manager._addDevice(new DeviceSource(this._deviceInputSystem, deviceType, deviceSlot));
                }
            }
            this._registeredManagers.push(manager);
        };
        this.unregisterManager = (manager) => {
            const idx = this._registeredManagers.indexOf(manager);
            if (idx > -1) {
                this._registeredManagers.splice(idx, 1);
            }
        };
        const numberOfDeviceTypes = Object.keys(DeviceType).length / 2;
        this._devices = new Array(numberOfDeviceTypes);
        const onDeviceConnected = (deviceType, deviceSlot) => {
            if (!this._devices[deviceType]) {
                this._devices[deviceType] = new Array();
            }
            if (!this._devices[deviceType][deviceSlot]) {
                this._devices[deviceType][deviceSlot] = deviceSlot;
            }
            for (const manager of this._registeredManagers) {
                const deviceSource = new DeviceSource(this._deviceInputSystem, deviceType, deviceSlot);
                manager._addDevice(deviceSource);
            }
        };
        const onDeviceDisconnected = (deviceType, deviceSlot) => {
            if (this._devices[deviceType]?.[deviceSlot]) {
                delete this._devices[deviceType][deviceSlot];
            }
            for (const manager of this._registeredManagers) {
                manager._removeDevice(deviceType, deviceSlot);
            }
        };
        const onInputChanged = (deviceType, deviceSlot, eventData) => {
            if (eventData) {
                for (const manager of this._registeredManagers) {
                    manager._onInputChanged(deviceType, deviceSlot, eventData);
                }
            }
        };
        if (typeof _native !== "undefined") {
            this._deviceInputSystem = new NativeDeviceInputSystem(onDeviceConnected, onDeviceDisconnected, onInputChanged);
        }
        else {
            this._deviceInputSystem = new WebDeviceInputSystem(engine, onDeviceConnected, onDeviceDisconnected, onInputChanged);
        }
    }
    dispose() {
        this._deviceInputSystem.dispose();
    }
}
//# sourceMappingURL=internalDeviceSourceManager.js.map