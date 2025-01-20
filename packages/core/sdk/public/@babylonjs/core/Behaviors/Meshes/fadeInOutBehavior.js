/**
 * A behavior that when attached to a mesh will allow the mesh to fade in and out
 */
export class FadeInOutBehavior {
    /**
     * Time in milliseconds to delay before fading in (Default: 0)
     * Will set both fade in and out delay to the same value
     */
    get delay() {
        return this.fadeInDelay;
    }
    set delay(value) {
        this.fadeInDelay = value;
        this.fadeOutDelay = value;
    }
    /**
     * Instantiates the FadeInOutBehavior
     */
    constructor() {
        /**
         * Time in milliseconds to delay before fading in (Default: 0)
         */
        this.fadeInDelay = 0;
        /**
         * Time in milliseconds to delay before fading out (Default: 0)
         */
        this.fadeOutDelay = 0;
        /**
         * Time in milliseconds for the mesh to fade in (Default: 300)
         */
        this.fadeInTime = 300;
        /**
         * Time in milliseconds for the mesh to fade out (Default: 300)
         */
        this.fadeOutTime = 300;
        this._millisecondsPerFrame = 1000 / 60;
        this._hovered = false;
        this._hoverValue = 0;
        this._ownerNode = null;
        this._delay = 0;
        this._time = 300;
        this._update = () => {
            if (this._ownerNode) {
                this._hoverValue += this._hovered ? this._millisecondsPerFrame : -this._millisecondsPerFrame;
                this._setAllVisibility(this._ownerNode, (this._hoverValue - this._delay) / this._time);
                if (this._ownerNode.visibility > 1) {
                    this._setAllVisibility(this._ownerNode, 1);
                    if (this._hoverValue > this._time) {
                        this._hoverValue = this._time;
                        this._detachObserver();
                        return;
                    }
                }
                else if (this._ownerNode.visibility < 0) {
                    this._setAllVisibility(this._ownerNode, 0);
                    if (this._hoverValue < 0) {
                        this._hoverValue = 0;
                        this._detachObserver();
                        return;
                    }
                }
                this._attachObserver();
            }
        };
    }
    /**
     *  The name of the behavior
     */
    get name() {
        return "FadeInOut";
    }
    /**
     *  Initializes the behavior
     */
    init() { }
    /**
     * Attaches the fade behavior on the passed in mesh
     * @param ownerNode The mesh that will be faded in/out once attached
     */
    attach(ownerNode) {
        this._ownerNode = ownerNode;
        this._setAllVisibility(this._ownerNode, 0);
    }
    /**
     *  Detaches the behavior from the mesh
     */
    detach() {
        this._ownerNode = null;
    }
    /**
     * Triggers the mesh to begin fading in (or out)
     * @param fadeIn if the object should fade in or out (true to fade in)
     */
    fadeIn(fadeIn = true) {
        this._delay = fadeIn ? this.fadeInDelay : this.fadeOutDelay;
        this._time = fadeIn ? this.fadeInTime : this.fadeOutTime;
        // Cancel any pending updates
        this._detachObserver();
        // If fading in and already visible or fading out and already not visible do nothing
        if (this._ownerNode && ((fadeIn && this._ownerNode.visibility >= 1) || (!fadeIn && this._ownerNode.visibility <= 0))) {
            return;
        }
        this._hovered = fadeIn;
        if (!this._hovered) {
            // Make the delay the negative of fadeout delay so the hoverValue is kept above 1 until
            // fadeOutDelay has elapsed
            this._delay *= -1;
        }
        // Reset the hoverValue.  This is necessary because we may have been fading out, e.g. but not yet reached
        // the delay, so the hover value is greater than 1
        if (this._ownerNode.visibility >= 1) {
            this._hoverValue = this._time;
        }
        else if (this._ownerNode.visibility <= 0) {
            this._hoverValue = 0;
        }
        this._update();
    }
    /**
     * Triggers the mesh to begin fading out
     */
    fadeOut() {
        this.fadeIn(false);
    }
    _setAllVisibility(mesh, value) {
        mesh.visibility = value;
        mesh.getChildMeshes().forEach((c) => {
            this._setAllVisibility(c, value);
        });
    }
    _attachObserver() {
        if (!this._onBeforeRenderObserver) {
            this._onBeforeRenderObserver = this._ownerNode?.getScene().onBeforeRenderObservable.add(this._update);
        }
    }
    _detachObserver() {
        if (this._onBeforeRenderObserver) {
            this._ownerNode?.getScene().onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }
    }
}
//# sourceMappingURL=fadeInOutBehavior.js.map