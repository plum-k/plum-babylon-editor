/**
 * Enum for Device Types
 */
export var DeviceType;
(function (DeviceType) {
    /** Generic */
    DeviceType[DeviceType["Generic"] = 0] = "Generic";
    /** Keyboard */
    DeviceType[DeviceType["Keyboard"] = 1] = "Keyboard";
    /** Mouse */
    DeviceType[DeviceType["Mouse"] = 2] = "Mouse";
    /** Touch Pointers */
    DeviceType[DeviceType["Touch"] = 3] = "Touch";
    /** PS4 Dual Shock */
    DeviceType[DeviceType["DualShock"] = 4] = "DualShock";
    /** Xbox */
    DeviceType[DeviceType["Xbox"] = 5] = "Xbox";
    /** Switch Controller */
    DeviceType[DeviceType["Switch"] = 6] = "Switch";
    /** PS5 DualSense */
    DeviceType[DeviceType["DualSense"] = 7] = "DualSense";
})(DeviceType || (DeviceType = {}));
// Device Enums
/**
 * Enum for All Pointers (Touch/Mouse)
 */
export var PointerInput;
(function (PointerInput) {
    /** Horizontal Axis (Not used in events/observables; only in polling) */
    PointerInput[PointerInput["Horizontal"] = 0] = "Horizontal";
    /** Vertical Axis (Not used in events/observables; only in polling) */
    PointerInput[PointerInput["Vertical"] = 1] = "Vertical";
    /** Left Click or Touch */
    PointerInput[PointerInput["LeftClick"] = 2] = "LeftClick";
    /** Middle Click */
    PointerInput[PointerInput["MiddleClick"] = 3] = "MiddleClick";
    /** Right Click */
    PointerInput[PointerInput["RightClick"] = 4] = "RightClick";
    /** Browser Back */
    PointerInput[PointerInput["BrowserBack"] = 5] = "BrowserBack";
    /** Browser Forward */
    PointerInput[PointerInput["BrowserForward"] = 6] = "BrowserForward";
    /** Mouse Wheel X */
    PointerInput[PointerInput["MouseWheelX"] = 7] = "MouseWheelX";
    /** Mouse Wheel Y */
    PointerInput[PointerInput["MouseWheelY"] = 8] = "MouseWheelY";
    /** Mouse Wheel Z */
    PointerInput[PointerInput["MouseWheelZ"] = 9] = "MouseWheelZ";
    /** Used in events/observables to identify if x/y changes occurred */
    PointerInput[PointerInput["Move"] = 12] = "Move";
})(PointerInput || (PointerInput = {}));
/** @internal */
export var NativePointerInput;
(function (NativePointerInput) {
    /** Horizontal Axis */
    NativePointerInput[NativePointerInput["Horizontal"] = 0] = "Horizontal";
    /** Vertical Axis */
    NativePointerInput[NativePointerInput["Vertical"] = 1] = "Vertical";
    /** Left Click or Touch */
    NativePointerInput[NativePointerInput["LeftClick"] = 2] = "LeftClick";
    /** Middle Click */
    NativePointerInput[NativePointerInput["MiddleClick"] = 3] = "MiddleClick";
    /** Right Click */
    NativePointerInput[NativePointerInput["RightClick"] = 4] = "RightClick";
    /** Browser Back */
    NativePointerInput[NativePointerInput["BrowserBack"] = 5] = "BrowserBack";
    /** Browser Forward */
    NativePointerInput[NativePointerInput["BrowserForward"] = 6] = "BrowserForward";
    /** Mouse Wheel X */
    NativePointerInput[NativePointerInput["MouseWheelX"] = 7] = "MouseWheelX";
    /** Mouse Wheel Y */
    NativePointerInput[NativePointerInput["MouseWheelY"] = 8] = "MouseWheelY";
    /** Mouse Wheel Z */
    NativePointerInput[NativePointerInput["MouseWheelZ"] = 9] = "MouseWheelZ";
    /** Delta X */
    NativePointerInput[NativePointerInput["DeltaHorizontal"] = 10] = "DeltaHorizontal";
    /** Delta Y */
    NativePointerInput[NativePointerInput["DeltaVertical"] = 11] = "DeltaVertical";
})(NativePointerInput || (NativePointerInput = {}));
/**
 * Enum for Dual Shock Gamepad
 */
export var DualShockInput;
(function (DualShockInput) {
    /** Cross */
    DualShockInput[DualShockInput["Cross"] = 0] = "Cross";
    /** Circle */
    DualShockInput[DualShockInput["Circle"] = 1] = "Circle";
    /** Square */
    DualShockInput[DualShockInput["Square"] = 2] = "Square";
    /** Triangle */
    DualShockInput[DualShockInput["Triangle"] = 3] = "Triangle";
    /** L1 */
    DualShockInput[DualShockInput["L1"] = 4] = "L1";
    /** R1 */
    DualShockInput[DualShockInput["R1"] = 5] = "R1";
    /** L2 */
    DualShockInput[DualShockInput["L2"] = 6] = "L2";
    /** R2 */
    DualShockInput[DualShockInput["R2"] = 7] = "R2";
    /** Share */
    DualShockInput[DualShockInput["Share"] = 8] = "Share";
    /** Options */
    DualShockInput[DualShockInput["Options"] = 9] = "Options";
    /** L3 */
    DualShockInput[DualShockInput["L3"] = 10] = "L3";
    /** R3 */
    DualShockInput[DualShockInput["R3"] = 11] = "R3";
    /** DPadUp */
    DualShockInput[DualShockInput["DPadUp"] = 12] = "DPadUp";
    /** DPadDown */
    DualShockInput[DualShockInput["DPadDown"] = 13] = "DPadDown";
    /** DPadLeft */
    DualShockInput[DualShockInput["DPadLeft"] = 14] = "DPadLeft";
    /** DRight */
    DualShockInput[DualShockInput["DPadRight"] = 15] = "DPadRight";
    /** Home */
    DualShockInput[DualShockInput["Home"] = 16] = "Home";
    /** TouchPad */
    DualShockInput[DualShockInput["TouchPad"] = 17] = "TouchPad";
    /** LStickXAxis */
    DualShockInput[DualShockInput["LStickXAxis"] = 18] = "LStickXAxis";
    /** LStickYAxis */
    DualShockInput[DualShockInput["LStickYAxis"] = 19] = "LStickYAxis";
    /** RStickXAxis */
    DualShockInput[DualShockInput["RStickXAxis"] = 20] = "RStickXAxis";
    /** RStickYAxis */
    DualShockInput[DualShockInput["RStickYAxis"] = 21] = "RStickYAxis";
})(DualShockInput || (DualShockInput = {}));
/**
 * Enum for Dual Sense Gamepad
 */
export var DualSenseInput;
(function (DualSenseInput) {
    /** Cross */
    DualSenseInput[DualSenseInput["Cross"] = 0] = "Cross";
    /** Circle */
    DualSenseInput[DualSenseInput["Circle"] = 1] = "Circle";
    /** Square */
    DualSenseInput[DualSenseInput["Square"] = 2] = "Square";
    /** Triangle */
    DualSenseInput[DualSenseInput["Triangle"] = 3] = "Triangle";
    /** L1 */
    DualSenseInput[DualSenseInput["L1"] = 4] = "L1";
    /** R1 */
    DualSenseInput[DualSenseInput["R1"] = 5] = "R1";
    /** L2 */
    DualSenseInput[DualSenseInput["L2"] = 6] = "L2";
    /** R2 */
    DualSenseInput[DualSenseInput["R2"] = 7] = "R2";
    /** Create */
    DualSenseInput[DualSenseInput["Create"] = 8] = "Create";
    /** Options */
    DualSenseInput[DualSenseInput["Options"] = 9] = "Options";
    /** L3 */
    DualSenseInput[DualSenseInput["L3"] = 10] = "L3";
    /** R3 */
    DualSenseInput[DualSenseInput["R3"] = 11] = "R3";
    /** DPadUp */
    DualSenseInput[DualSenseInput["DPadUp"] = 12] = "DPadUp";
    /** DPadDown */
    DualSenseInput[DualSenseInput["DPadDown"] = 13] = "DPadDown";
    /** DPadLeft */
    DualSenseInput[DualSenseInput["DPadLeft"] = 14] = "DPadLeft";
    /** DRight */
    DualSenseInput[DualSenseInput["DPadRight"] = 15] = "DPadRight";
    /** Home */
    DualSenseInput[DualSenseInput["Home"] = 16] = "Home";
    /** TouchPad */
    DualSenseInput[DualSenseInput["TouchPad"] = 17] = "TouchPad";
    /** LStickXAxis */
    DualSenseInput[DualSenseInput["LStickXAxis"] = 18] = "LStickXAxis";
    /** LStickYAxis */
    DualSenseInput[DualSenseInput["LStickYAxis"] = 19] = "LStickYAxis";
    /** RStickXAxis */
    DualSenseInput[DualSenseInput["RStickXAxis"] = 20] = "RStickXAxis";
    /** RStickYAxis */
    DualSenseInput[DualSenseInput["RStickYAxis"] = 21] = "RStickYAxis";
})(DualSenseInput || (DualSenseInput = {}));
/**
 * Enum for Xbox Gamepad
 */
export var XboxInput;
(function (XboxInput) {
    /** A */
    XboxInput[XboxInput["A"] = 0] = "A";
    /** B */
    XboxInput[XboxInput["B"] = 1] = "B";
    /** X */
    XboxInput[XboxInput["X"] = 2] = "X";
    /** Y */
    XboxInput[XboxInput["Y"] = 3] = "Y";
    /** LB */
    XboxInput[XboxInput["LB"] = 4] = "LB";
    /** RB */
    XboxInput[XboxInput["RB"] = 5] = "RB";
    /** LT */
    XboxInput[XboxInput["LT"] = 6] = "LT";
    /** RT */
    XboxInput[XboxInput["RT"] = 7] = "RT";
    /** Back */
    XboxInput[XboxInput["Back"] = 8] = "Back";
    /** Start */
    XboxInput[XboxInput["Start"] = 9] = "Start";
    /** LS */
    XboxInput[XboxInput["LS"] = 10] = "LS";
    /** RS */
    XboxInput[XboxInput["RS"] = 11] = "RS";
    /** DPadUp */
    XboxInput[XboxInput["DPadUp"] = 12] = "DPadUp";
    /** DPadDown */
    XboxInput[XboxInput["DPadDown"] = 13] = "DPadDown";
    /** DPadLeft */
    XboxInput[XboxInput["DPadLeft"] = 14] = "DPadLeft";
    /** DRight */
    XboxInput[XboxInput["DPadRight"] = 15] = "DPadRight";
    /** Home */
    XboxInput[XboxInput["Home"] = 16] = "Home";
    /** LStickXAxis */
    XboxInput[XboxInput["LStickXAxis"] = 17] = "LStickXAxis";
    /** LStickYAxis */
    XboxInput[XboxInput["LStickYAxis"] = 18] = "LStickYAxis";
    /** RStickXAxis */
    XboxInput[XboxInput["RStickXAxis"] = 19] = "RStickXAxis";
    /** RStickYAxis */
    XboxInput[XboxInput["RStickYAxis"] = 20] = "RStickYAxis";
})(XboxInput || (XboxInput = {}));
/**
 * Enum for Switch (Pro/JoyCon L+R) Gamepad
 */
export var SwitchInput;
(function (SwitchInput) {
    /** B */
    SwitchInput[SwitchInput["B"] = 0] = "B";
    /** A */
    SwitchInput[SwitchInput["A"] = 1] = "A";
    /** Y */
    SwitchInput[SwitchInput["Y"] = 2] = "Y";
    /** X */
    SwitchInput[SwitchInput["X"] = 3] = "X";
    /** L */
    SwitchInput[SwitchInput["L"] = 4] = "L";
    /** R */
    SwitchInput[SwitchInput["R"] = 5] = "R";
    /** ZL */
    SwitchInput[SwitchInput["ZL"] = 6] = "ZL";
    /** ZR */
    SwitchInput[SwitchInput["ZR"] = 7] = "ZR";
    /** Minus */
    SwitchInput[SwitchInput["Minus"] = 8] = "Minus";
    /** Plus */
    SwitchInput[SwitchInput["Plus"] = 9] = "Plus";
    /** LS */
    SwitchInput[SwitchInput["LS"] = 10] = "LS";
    /** RS */
    SwitchInput[SwitchInput["RS"] = 11] = "RS";
    /** DPadUp */
    SwitchInput[SwitchInput["DPadUp"] = 12] = "DPadUp";
    /** DPadDown */
    SwitchInput[SwitchInput["DPadDown"] = 13] = "DPadDown";
    /** DPadLeft */
    SwitchInput[SwitchInput["DPadLeft"] = 14] = "DPadLeft";
    /** DRight */
    SwitchInput[SwitchInput["DPadRight"] = 15] = "DPadRight";
    /** Home */
    SwitchInput[SwitchInput["Home"] = 16] = "Home";
    /** Capture */
    SwitchInput[SwitchInput["Capture"] = 17] = "Capture";
    /** LStickXAxis */
    SwitchInput[SwitchInput["LStickXAxis"] = 18] = "LStickXAxis";
    /** LStickYAxis */
    SwitchInput[SwitchInput["LStickYAxis"] = 19] = "LStickYAxis";
    /** RStickXAxis */
    SwitchInput[SwitchInput["RStickXAxis"] = 20] = "RStickXAxis";
    /** RStickYAxis */
    SwitchInput[SwitchInput["RStickYAxis"] = 21] = "RStickYAxis";
})(SwitchInput || (SwitchInput = {}));
//# sourceMappingURL=deviceEnums.js.map