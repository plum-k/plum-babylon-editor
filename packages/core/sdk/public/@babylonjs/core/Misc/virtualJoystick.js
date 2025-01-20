import { Vector3, Vector2 } from "../Maths/math.vector.js";
import { StringDictionary } from "./stringDictionary.js";
// Mainly based on these 2 articles :
// Creating an universal virtual touch joystick working for all Touch models thanks to Hand.JS : http://blogs.msdn.com/b/davrous/archive/2013/02/22/creating-an-universal-virtual-touch-joystick-working-for-all-touch-models-thanks-to-hand-js.aspx
// & on Seb Lee-Delisle original work: http://seb.ly/2011/04/multi-touch-game-controller-in-javascripthtml5-for-ipad/
/**
 * Defines the potential axis of a Joystick
 */
export var JoystickAxis;
(function (JoystickAxis) {
    /** X axis */
    JoystickAxis[JoystickAxis["X"] = 0] = "X";
    /** Y axis */
    JoystickAxis[JoystickAxis["Y"] = 1] = "Y";
    /** Z axis */
    JoystickAxis[JoystickAxis["Z"] = 2] = "Z";
})(JoystickAxis || (JoystickAxis = {}));
/**
 * Class used to define virtual joystick (used in touch mode)
 */
export class VirtualJoystick {
    static _GetDefaultOptions() {
        return {
            puckSize: 40,
            containerSize: 60,
            color: "cyan",
            puckImage: undefined,
            containerImage: undefined,
            position: undefined,
            alwaysVisible: false,
            limitToContainer: false,
        };
    }
    /**
     * Creates a new virtual joystick
     * @param leftJoystick defines that the joystick is for left hand (false by default)
     * @param customizations Defines the options we want to customize the VirtualJoystick
     */
    constructor(leftJoystick, customizations) {
        this._released = false;
        const options = {
            ...VirtualJoystick._GetDefaultOptions(),
            ...customizations,
        };
        if (leftJoystick) {
            this._leftJoystick = true;
        }
        else {
            this._leftJoystick = false;
        }
        VirtualJoystick._GlobalJoystickIndex++;
        // By default left & right arrow keys are moving the X
        // and up & down keys are moving the Y
        this._axisTargetedByLeftAndRight = 0 /* JoystickAxis.X */;
        this._axisTargetedByUpAndDown = 1 /* JoystickAxis.Y */;
        this.reverseLeftRight = false;
        this.reverseUpDown = false;
        // collections of pointers
        this._touches = new StringDictionary();
        this.deltaPosition = Vector3.Zero();
        this._joystickSensibility = 25;
        this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
        this._onResize = () => {
            VirtualJoystick._VJCanvasWidth = window.innerWidth;
            VirtualJoystick._VJCanvasHeight = window.innerHeight;
            if (VirtualJoystick.Canvas) {
                VirtualJoystick.Canvas.width = VirtualJoystick._VJCanvasWidth;
                VirtualJoystick.Canvas.height = VirtualJoystick._VJCanvasHeight;
            }
            VirtualJoystick._HalfWidth = VirtualJoystick._VJCanvasWidth / 2;
        };
        // injecting a canvas element on top of the canvas 3D game
        if (!VirtualJoystick.Canvas) {
            window.addEventListener("resize", this._onResize, false);
            VirtualJoystick.Canvas = document.createElement("canvas");
            VirtualJoystick._VJCanvasWidth = window.innerWidth;
            VirtualJoystick._VJCanvasHeight = window.innerHeight;
            VirtualJoystick.Canvas.width = window.innerWidth;
            VirtualJoystick.Canvas.height = window.innerHeight;
            VirtualJoystick.Canvas.style.width = "100%";
            VirtualJoystick.Canvas.style.height = "100%";
            VirtualJoystick.Canvas.style.position = "absolute";
            VirtualJoystick.Canvas.style.backgroundColor = "transparent";
            VirtualJoystick.Canvas.style.top = "0px";
            VirtualJoystick.Canvas.style.left = "0px";
            VirtualJoystick.Canvas.style.zIndex = "5";
            VirtualJoystick.Canvas.style.touchAction = "none"; // fix https://forum.babylonjs.com/t/virtualjoystick-needs-to-set-style-touch-action-none-explicitly/9562
            // Support for jQuery PEP polyfill
            VirtualJoystick.Canvas.setAttribute("touch-action", "none");
            const context = VirtualJoystick.Canvas.getContext("2d");
            if (!context) {
                throw new Error("Unable to create canvas for virtual joystick");
            }
            VirtualJoystick._VJCanvasContext = context;
            VirtualJoystick._VJCanvasContext.strokeStyle = "#ffffff";
            VirtualJoystick._VJCanvasContext.lineWidth = 2;
            document.body.appendChild(VirtualJoystick.Canvas);
        }
        VirtualJoystick._HalfWidth = VirtualJoystick.Canvas.width / 2;
        this.pressed = false;
        this.limitToContainer = options.limitToContainer;
        // default joystick color
        this._joystickColor = options.color;
        // default joystick size
        this.containerSize = options.containerSize;
        this.puckSize = options.puckSize;
        if (options.position) {
            this.setPosition(options.position.x, options.position.y);
        }
        if (options.puckImage) {
            this.setPuckImage(options.puckImage);
        }
        if (options.containerImage) {
            this.setContainerImage(options.containerImage);
        }
        if (options.alwaysVisible) {
            VirtualJoystick._AlwaysVisibleSticks++;
        }
        // must come after position potentially set
        this.alwaysVisible = options.alwaysVisible;
        this._joystickPointerId = -1;
        // current joystick position
        this._joystickPointerPos = new Vector2(0, 0);
        this._joystickPreviousPointerPos = new Vector2(0, 0);
        // origin joystick position
        this._joystickPointerStartPos = new Vector2(0, 0);
        this._deltaJoystickVector = new Vector2(0, 0);
        this._onPointerDownHandlerRef = (evt) => {
            this._onPointerDown(evt);
        };
        this._onPointerMoveHandlerRef = (evt) => {
            this._onPointerMove(evt);
        };
        this._onPointerUpHandlerRef = (evt) => {
            this._onPointerUp(evt);
        };
        VirtualJoystick.Canvas.addEventListener("pointerdown", this._onPointerDownHandlerRef, false);
        VirtualJoystick.Canvas.addEventListener("pointermove", this._onPointerMoveHandlerRef, false);
        VirtualJoystick.Canvas.addEventListener("pointerup", this._onPointerUpHandlerRef, false);
        VirtualJoystick.Canvas.addEventListener("pointerout", this._onPointerUpHandlerRef, false);
        VirtualJoystick.Canvas.addEventListener("pointercancel", this._onPointerUpHandlerRef, false);
        VirtualJoystick.Canvas.addEventListener("contextmenu", (evt) => {
            evt.preventDefault(); // Disables system menu
        }, false);
        requestAnimationFrame(() => {
            this._drawVirtualJoystick();
        });
    }
    /**
     * Defines joystick sensibility (ie. the ratio between a physical move and virtual joystick position change)
     * @param newJoystickSensibility defines the new sensibility
     */
    setJoystickSensibility(newJoystickSensibility) {
        this._joystickSensibility = newJoystickSensibility;
        this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
    }
    _onPointerDown(e) {
        let positionOnScreenCondition;
        e.preventDefault();
        if (this._leftJoystick === true) {
            positionOnScreenCondition = e.clientX < VirtualJoystick._HalfWidth;
        }
        else {
            positionOnScreenCondition = e.clientX > VirtualJoystick._HalfWidth;
        }
        if (positionOnScreenCondition && this._joystickPointerId < 0) {
            // First contact will be dedicated to the virtual joystick
            this._joystickPointerId = e.pointerId;
            if (this._joystickPosition) {
                this._joystickPointerStartPos = this._joystickPosition.clone();
                this._joystickPointerPos = this._joystickPosition.clone();
                this._joystickPreviousPointerPos = this._joystickPosition.clone();
                // in case the user only clicks down && doesn't move:
                // this ensures the delta is properly set
                this._onPointerMove(e);
            }
            else {
                this._joystickPointerStartPos.x = e.clientX;
                this._joystickPointerStartPos.y = e.clientY;
                this._joystickPointerPos = this._joystickPointerStartPos.clone();
                this._joystickPreviousPointerPos = this._joystickPointerStartPos.clone();
            }
            this._deltaJoystickVector.x = 0;
            this._deltaJoystickVector.y = 0;
            this.pressed = true;
            this._touches.add(e.pointerId.toString(), e);
        }
        else {
            // You can only trigger the action buttons with a joystick declared
            if (VirtualJoystick._GlobalJoystickIndex < 2 && this._action) {
                this._action();
                this._touches.add(e.pointerId.toString(), { x: e.clientX, y: e.clientY, prevX: e.clientX, prevY: e.clientY });
            }
        }
    }
    _onPointerMove(e) {
        // If the current pointer is the one associated to the joystick (first touch contact)
        if (this._joystickPointerId == e.pointerId) {
            // limit to container if need be
            if (this.limitToContainer) {
                const vector = new Vector2(e.clientX - this._joystickPointerStartPos.x, e.clientY - this._joystickPointerStartPos.y);
                const distance = vector.length();
                if (distance > this.containerSize) {
                    vector.scaleInPlace(this.containerSize / distance);
                }
                this._joystickPointerPos.x = this._joystickPointerStartPos.x + vector.x;
                this._joystickPointerPos.y = this._joystickPointerStartPos.y + vector.y;
            }
            else {
                this._joystickPointerPos.x = e.clientX;
                this._joystickPointerPos.y = e.clientY;
            }
            // create delta vector
            this._deltaJoystickVector = this._joystickPointerPos.clone();
            this._deltaJoystickVector = this._deltaJoystickVector.subtract(this._joystickPointerStartPos);
            // if a joystick is always visible, there will be clipping issues if
            // you drag the puck from one over the container of the other
            if (0 < VirtualJoystick._AlwaysVisibleSticks) {
                if (this._leftJoystick) {
                    this._joystickPointerPos.x = Math.min(VirtualJoystick._HalfWidth, this._joystickPointerPos.x);
                }
                else {
                    this._joystickPointerPos.x = Math.max(VirtualJoystick._HalfWidth, this._joystickPointerPos.x);
                }
            }
            const directionLeftRight = this.reverseLeftRight ? -1 : 1;
            const deltaJoystickX = (directionLeftRight * this._deltaJoystickVector.x) / this._inversedSensibility;
            switch (this._axisTargetedByLeftAndRight) {
                case 0 /* JoystickAxis.X */:
                    this.deltaPosition.x = Math.min(1, Math.max(-1, deltaJoystickX));
                    break;
                case 1 /* JoystickAxis.Y */:
                    this.deltaPosition.y = Math.min(1, Math.max(-1, deltaJoystickX));
                    break;
                case 2 /* JoystickAxis.Z */:
                    this.deltaPosition.z = Math.min(1, Math.max(-1, deltaJoystickX));
                    break;
            }
            const directionUpDown = this.reverseUpDown ? 1 : -1;
            const deltaJoystickY = (directionUpDown * this._deltaJoystickVector.y) / this._inversedSensibility;
            switch (this._axisTargetedByUpAndDown) {
                case 0 /* JoystickAxis.X */:
                    this.deltaPosition.x = Math.min(1, Math.max(-1, deltaJoystickY));
                    break;
                case 1 /* JoystickAxis.Y */:
                    this.deltaPosition.y = Math.min(1, Math.max(-1, deltaJoystickY));
                    break;
                case 2 /* JoystickAxis.Z */:
                    this.deltaPosition.z = Math.min(1, Math.max(-1, deltaJoystickY));
                    break;
            }
        }
        else {
            const data = this._touches.get(e.pointerId.toString());
            if (data) {
                data.x = e.clientX;
                data.y = e.clientY;
            }
        }
    }
    _onPointerUp(e) {
        if (this._joystickPointerId == e.pointerId) {
            this._clearPreviousDraw();
            this._joystickPointerId = -1;
            this.pressed = false;
        }
        else {
            const touch = this._touches.get(e.pointerId.toString());
            if (touch) {
                VirtualJoystick._VJCanvasContext.clearRect(touch.prevX - 44, touch.prevY - 44, 88, 88);
            }
        }
        this._deltaJoystickVector.x = 0;
        this._deltaJoystickVector.y = 0;
        this._touches.remove(e.pointerId.toString());
    }
    /**
     * Change the color of the virtual joystick
     * @param newColor a string that must be a CSS color value (like "red") or the hexa value (like "#FF0000")
     */
    setJoystickColor(newColor) {
        this._joystickColor = newColor;
    }
    /**
     * Size of the joystick's container
     */
    set containerSize(newSize) {
        this._joystickContainerSize = newSize;
        this._clearContainerSize = ~~(this._joystickContainerSize * 2.1);
        this._clearContainerSizeOffset = ~~(this._clearContainerSize / 2);
    }
    get containerSize() {
        return this._joystickContainerSize;
    }
    /**
     * Size of the joystick's puck
     */
    set puckSize(newSize) {
        this._joystickPuckSize = newSize;
        this._clearPuckSize = ~~(this._joystickPuckSize * 2.1);
        this._clearPuckSizeOffset = ~~(this._clearPuckSize / 2);
    }
    get puckSize() {
        return this._joystickPuckSize;
    }
    /**
     * Clears the set position of the joystick
     */
    clearPosition() {
        this.alwaysVisible = false;
        this._joystickPosition = null;
    }
    /**
     * Defines whether or not the joystick container is always visible
     */
    set alwaysVisible(value) {
        if (this._alwaysVisible === value) {
            return;
        }
        if (value && this._joystickPosition) {
            VirtualJoystick._AlwaysVisibleSticks++;
            this._alwaysVisible = true;
        }
        else {
            VirtualJoystick._AlwaysVisibleSticks--;
            this._alwaysVisible = false;
        }
    }
    get alwaysVisible() {
        return this._alwaysVisible;
    }
    /**
     * Sets the constant position of the Joystick container
     * @param x X axis coordinate
     * @param y Y axis coordinate
     */
    setPosition(x, y) {
        // just in case position is moved while the container is visible
        if (this._joystickPointerStartPos) {
            this._clearPreviousDraw();
        }
        this._joystickPosition = new Vector2(x, y);
    }
    /**
     * Defines a callback to call when the joystick is touched
     * @param action defines the callback
     */
    setActionOnTouch(action) {
        this._action = action;
    }
    /**
     * Defines which axis you'd like to control for left & right
     * @param axis defines the axis to use
     */
    setAxisForLeftRight(axis) {
        switch (axis) {
            case 0 /* JoystickAxis.X */:
            case 1 /* JoystickAxis.Y */:
            case 2 /* JoystickAxis.Z */:
                this._axisTargetedByLeftAndRight = axis;
                break;
            default:
                this._axisTargetedByLeftAndRight = 0 /* JoystickAxis.X */;
                break;
        }
    }
    /**
     * Defines which axis you'd like to control for up & down
     * @param axis defines the axis to use
     */
    setAxisForUpDown(axis) {
        switch (axis) {
            case 0 /* JoystickAxis.X */:
            case 1 /* JoystickAxis.Y */:
            case 2 /* JoystickAxis.Z */:
                this._axisTargetedByUpAndDown = axis;
                break;
            default:
                this._axisTargetedByUpAndDown = 1 /* JoystickAxis.Y */;
                break;
        }
    }
    /**
     * Clears the canvas from the previous puck / container draw
     */
    _clearPreviousDraw() {
        const jp = this._joystickPosition || this._joystickPointerStartPos;
        // clear container pixels
        VirtualJoystick._VJCanvasContext.clearRect(jp.x - this._clearContainerSizeOffset, jp.y - this._clearContainerSizeOffset, this._clearContainerSize, this._clearContainerSize);
        // clear puck pixels + 1 pixel for the change made before it moved
        VirtualJoystick._VJCanvasContext.clearRect(this._joystickPreviousPointerPos.x - this._clearPuckSizeOffset - 1, this._joystickPreviousPointerPos.y - this._clearPuckSizeOffset - 1, this._clearPuckSize + 2, this._clearPuckSize + 2);
    }
    /**
     * Loads `urlPath` to be used for the container's image
     * @param urlPath defines the urlPath of an image to use
     */
    setContainerImage(urlPath) {
        const image = new Image();
        image.src = urlPath;
        image.onload = () => (this._containerImage = image);
    }
    /**
     * Loads `urlPath` to be used for the puck's image
     * @param urlPath defines the urlPath of an image to use
     */
    setPuckImage(urlPath) {
        const image = new Image();
        image.src = urlPath;
        image.onload = () => (this._puckImage = image);
    }
    /**
     * Draws the Virtual Joystick's container
     */
    _drawContainer() {
        const jp = this._joystickPosition || this._joystickPointerStartPos;
        this._clearPreviousDraw();
        if (this._containerImage) {
            VirtualJoystick._VJCanvasContext.drawImage(this._containerImage, jp.x - this.containerSize, jp.y - this.containerSize, this.containerSize * 2, this.containerSize * 2);
        }
        else {
            // outer container
            VirtualJoystick._VJCanvasContext.beginPath();
            VirtualJoystick._VJCanvasContext.strokeStyle = this._joystickColor;
            VirtualJoystick._VJCanvasContext.lineWidth = 2;
            VirtualJoystick._VJCanvasContext.arc(jp.x, jp.y, this.containerSize, 0, Math.PI * 2, true);
            VirtualJoystick._VJCanvasContext.stroke();
            VirtualJoystick._VJCanvasContext.closePath();
            // inner container
            VirtualJoystick._VJCanvasContext.beginPath();
            VirtualJoystick._VJCanvasContext.lineWidth = 6;
            VirtualJoystick._VJCanvasContext.strokeStyle = this._joystickColor;
            VirtualJoystick._VJCanvasContext.arc(jp.x, jp.y, this.puckSize, 0, Math.PI * 2, true);
            VirtualJoystick._VJCanvasContext.stroke();
            VirtualJoystick._VJCanvasContext.closePath();
        }
    }
    /**
     * Draws the Virtual Joystick's puck
     */
    _drawPuck() {
        if (this._puckImage) {
            VirtualJoystick._VJCanvasContext.drawImage(this._puckImage, this._joystickPointerPos.x - this.puckSize, this._joystickPointerPos.y - this.puckSize, this.puckSize * 2, this.puckSize * 2);
        }
        else {
            VirtualJoystick._VJCanvasContext.beginPath();
            VirtualJoystick._VJCanvasContext.strokeStyle = this._joystickColor;
            VirtualJoystick._VJCanvasContext.lineWidth = 2;
            VirtualJoystick._VJCanvasContext.arc(this._joystickPointerPos.x, this._joystickPointerPos.y, this.puckSize, 0, Math.PI * 2, true);
            VirtualJoystick._VJCanvasContext.stroke();
            VirtualJoystick._VJCanvasContext.closePath();
        }
    }
    _drawVirtualJoystick() {
        // canvas released? don't continue iterating
        if (this._released) {
            return;
        }
        if (this.alwaysVisible) {
            this._drawContainer();
        }
        if (this.pressed) {
            this._touches.forEach((key, touch) => {
                if (touch.pointerId === this._joystickPointerId) {
                    if (!this.alwaysVisible) {
                        this._drawContainer();
                    }
                    this._drawPuck();
                    // store current pointer for next clear
                    this._joystickPreviousPointerPos = this._joystickPointerPos.clone();
                }
                else {
                    VirtualJoystick._VJCanvasContext.clearRect(touch.prevX - 44, touch.prevY - 44, 88, 88);
                    VirtualJoystick._VJCanvasContext.beginPath();
                    VirtualJoystick._VJCanvasContext.fillStyle = "white";
                    VirtualJoystick._VJCanvasContext.beginPath();
                    VirtualJoystick._VJCanvasContext.strokeStyle = "red";
                    VirtualJoystick._VJCanvasContext.lineWidth = 6;
                    VirtualJoystick._VJCanvasContext.arc(touch.x, touch.y, 40, 0, Math.PI * 2, true);
                    VirtualJoystick._VJCanvasContext.stroke();
                    VirtualJoystick._VJCanvasContext.closePath();
                    touch.prevX = touch.x;
                    touch.prevY = touch.y;
                }
            });
        }
        requestAnimationFrame(() => {
            this._drawVirtualJoystick();
        });
    }
    /**
     * Release internal HTML canvas
     */
    releaseCanvas() {
        if (VirtualJoystick.Canvas) {
            VirtualJoystick.Canvas.removeEventListener("pointerdown", this._onPointerDownHandlerRef);
            VirtualJoystick.Canvas.removeEventListener("pointermove", this._onPointerMoveHandlerRef);
            VirtualJoystick.Canvas.removeEventListener("pointerup", this._onPointerUpHandlerRef);
            VirtualJoystick.Canvas.removeEventListener("pointerout", this._onPointerUpHandlerRef);
            VirtualJoystick.Canvas.removeEventListener("pointercancel", this._onPointerUpHandlerRef);
            window.removeEventListener("resize", this._onResize);
            document.body.removeChild(VirtualJoystick.Canvas);
            VirtualJoystick.Canvas = null;
        }
        this._released = true;
    }
}
// Used to draw the virtual joystick inside a 2D canvas on top of the WebGL rendering canvas
VirtualJoystick._GlobalJoystickIndex = 0;
VirtualJoystick._AlwaysVisibleSticks = 0;
//# sourceMappingURL=virtualJoystick.js.map