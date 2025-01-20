import { PointerInfoPre, PointerInfo, PointerEventTypes } from "../Events/pointerEvents.js";
import { AbstractActionManager } from "../Actions/abstractActionManager.js";
import { PickingInfo } from "../Collisions/pickingInfo.js";
import { Vector2, Matrix } from "../Maths/math.vector.js";

import { ActionEvent } from "../Actions/actionEvent.js";
import { KeyboardEventTypes, KeyboardInfoPre, KeyboardInfo } from "../Events/keyboardEvents.js";
import { DeviceType, PointerInput } from "../DeviceInput/InputDevices/deviceEnums.js";
import { DeviceSourceManager } from "../DeviceInput/InputDevices/deviceSourceManager.js";
import { EngineStore } from "../Engines/engineStore.js";
import { _ImportHelper } from "../import.helper.js";
/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
class _ClickInfo {
    constructor() {
        this._singleClick = false;
        this._doubleClick = false;
        this._hasSwiped = false;
        this._ignore = false;
    }
    get singleClick() {
        return this._singleClick;
    }
    get doubleClick() {
        return this._doubleClick;
    }
    get hasSwiped() {
        return this._hasSwiped;
    }
    get ignore() {
        return this._ignore;
    }
    set singleClick(b) {
        this._singleClick = b;
    }
    set doubleClick(b) {
        this._doubleClick = b;
    }
    set hasSwiped(b) {
        this._hasSwiped = b;
    }
    set ignore(b) {
        this._ignore = b;
    }
}
/**
 * Class used to manage all inputs for the scene.
 */
export class InputManager {
    /**
     * Creates a new InputManager
     * @param scene - defines the hosting scene
     */
    constructor(scene) {
        /** This is a defensive check to not allow control attachment prior to an already active one. If already attached, previous control is unattached before attaching the new one. */
        this._alreadyAttached = false;
        this._meshPickProceed = false;
        this._currentPickResult = null;
        this._previousPickResult = null;
        this._activePointerIds = new Array();
        /** Tracks the count of used slots in _activePointerIds for perf */
        this._activePointerIdsCount = 0;
        this._doubleClickOccured = false;
        this._isSwiping = false;
        this._swipeButtonPressed = -1;
        this._skipPointerTap = false;
        this._isMultiTouchGesture = false;
        this._pointerX = 0;
        this._pointerY = 0;
        this._startingPointerPosition = new Vector2(0, 0);
        this._previousStartingPointerPosition = new Vector2(0, 0);
        this._startingPointerTime = 0;
        this._previousStartingPointerTime = 0;
        this._pointerCaptures = {};
        this._meshUnderPointerId = {};
        this._movePointerInfo = null;
        this._cameraObserverCount = 0;
        this._delayedClicks = [null, null, null, null, null];
        this._deviceSourceManager = null;
        this._scene = scene || EngineStore.LastCreatedScene;
        if (!this._scene) {
            return;
        }
    }
    /**
     * Gets the mesh that is currently under the pointer
     * @returns Mesh that the pointer is pointer is hovering over
     */
    get meshUnderPointer() {
        if (this._movePointerInfo) {
            // Because _pointerOverMesh is populated as part of _pickMove, we need to force a pick to update it.
            // Calling _pickMove calls _setCursorAndPointerOverMesh which calls setPointerOverMesh
            this._movePointerInfo._generatePickInfo();
            // Once we have what we need, we can clear _movePointerInfo because we don't need it anymore
            this._movePointerInfo = null;
        }
        return this._pointerOverMesh;
    }
    /**
     * When using more than one pointer (for example in XR) you can get the mesh under the specific pointer
     * @param pointerId - the pointer id to use
     * @returns The mesh under this pointer id or null if not found
     */
    getMeshUnderPointerByPointerId(pointerId) {
        return this._meshUnderPointerId[pointerId] || null;
    }
    /**
     * Gets the pointer coordinates in 2D without any translation (ie. straight out of the pointer event)
     * @returns Vector with X/Y values directly from pointer event
     */
    get unTranslatedPointer() {
        return new Vector2(this._unTranslatedPointerX, this._unTranslatedPointerY);
    }
    /**
     * Gets or sets the current on-screen X position of the pointer
     * @returns Translated X with respect to screen
     */
    get pointerX() {
        return this._pointerX;
    }
    set pointerX(value) {
        this._pointerX = value;
    }
    /**
     * Gets or sets the current on-screen Y position of the pointer
     * @returns Translated Y with respect to screen
     */
    get pointerY() {
        return this._pointerY;
    }
    set pointerY(value) {
        this._pointerY = value;
    }
    _updatePointerPosition(evt) {
        const canvasRect = this._scene.getEngine().getInputElementClientRect();
        if (!canvasRect) {
            return;
        }
        this._pointerX = evt.clientX - canvasRect.left;
        this._pointerY = evt.clientY - canvasRect.top;
        this._unTranslatedPointerX = this._pointerX;
        this._unTranslatedPointerY = this._pointerY;
    }
    _processPointerMove(pickResult, evt) {
        const scene = this._scene;
        const engine = scene.getEngine();
        const canvas = engine.getInputElement();
        if (canvas) {
            canvas.tabIndex = engine.canvasTabIndex;
            // Restore pointer
            if (!scene.doNotHandleCursors) {
                canvas.style.cursor = scene.defaultCursor;
            }
        }
        this._setCursorAndPointerOverMesh(pickResult, evt, scene);
        for (const step of scene._pointerMoveStage) {
            // If _pointerMoveState is defined, we have an active spriteManager and can't use Lazy Picking
            // Therefore, we need to force a pick to update the pickResult
            pickResult = pickResult || this._pickMove(evt);
            const isMeshPicked = pickResult?.pickedMesh ? true : false;
            pickResult = step.action(this._unTranslatedPointerX, this._unTranslatedPointerY, pickResult, isMeshPicked, canvas);
        }
        const type = evt.inputIndex >= PointerInput.MouseWheelX && evt.inputIndex <= PointerInput.MouseWheelZ ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE;
        if (scene.onPointerMove) {
            // Because of lazy picking, we need to force a pick to update the pickResult
            pickResult = pickResult || this._pickMove(evt);
            scene.onPointerMove(evt, pickResult, type);
        }
        let pointerInfo;
        if (pickResult) {
            pointerInfo = new PointerInfo(type, evt, pickResult);
            this._setRayOnPointerInfo(pickResult, evt);
        }
        else {
            pointerInfo = new PointerInfo(type, evt, null, this);
            this._movePointerInfo = pointerInfo;
        }
        if (scene.onPointerObservable.hasObservers()) {
            scene.onPointerObservable.notifyObservers(pointerInfo, type);
        }
    }
    // Pointers handling
    /** @internal */
    _setRayOnPointerInfo(pickInfo, event) {
        const scene = this._scene;
        if (pickInfo && _ImportHelper._IsPickingAvailable) {
            if (!pickInfo.ray) {
                pickInfo.ray = scene.createPickingRay(event.offsetX, event.offsetY, Matrix.Identity(), scene.activeCamera);
            }
        }
    }
    /** @internal */
    _addCameraPointerObserver(observer, mask) {
        this._cameraObserverCount++;
        return this._scene.onPointerObservable.add(observer, mask);
    }
    /** @internal */
    _removeCameraPointerObserver(observer) {
        this._cameraObserverCount--;
        return this._scene.onPointerObservable.remove(observer);
    }
    _checkForPicking() {
        return !!(this._scene.onPointerObservable.observers.length > this._cameraObserverCount || this._scene.onPointerPick);
    }
    _checkPrePointerObservable(pickResult, evt, type) {
        const scene = this._scene;
        const pi = new PointerInfoPre(type, evt, this._unTranslatedPointerX, this._unTranslatedPointerY);
        if (pickResult) {
            pi.originalPickingInfo = pickResult;
            pi.ray = pickResult.ray;
            if (evt.pointerType === "xr-near" && pickResult.originMesh) {
                pi.nearInteractionPickingInfo = pickResult;
            }
        }
        scene.onPrePointerObservable.notifyObservers(pi, type);
        if (pi.skipOnPointerObservable) {
            return true;
        }
        else {
            return false;
        }
    }
    /** @internal */
    _pickMove(evt) {
        const scene = this._scene;
        const pickResult = scene.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, scene.pointerMovePredicate, scene.pointerMoveFastCheck, scene.cameraToUseForPointers, scene.pointerMoveTrianglePredicate);
        this._setCursorAndPointerOverMesh(pickResult, evt, scene);
        return pickResult;
    }
    _setCursorAndPointerOverMesh(pickResult, evt, scene) {
        const engine = scene.getEngine();
        const canvas = engine.getInputElement();
        if (pickResult?.pickedMesh) {
            this.setPointerOverMesh(pickResult.pickedMesh, evt.pointerId, pickResult, evt);
            if (!scene.doNotHandleCursors && canvas && this._pointerOverMesh) {
                const actionManager = this._pointerOverMesh._getActionManagerForTrigger();
                if (actionManager && actionManager.hasPointerTriggers) {
                    canvas.style.cursor = actionManager.hoverCursor || scene.hoverCursor;
                }
            }
        }
        else {
            this.setPointerOverMesh(null, evt.pointerId, pickResult, evt);
        }
    }
    /**
     * Use this method to simulate a pointer move on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult - pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit - pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     */
    simulatePointerMove(pickResult, pointerEventInit) {
        const evt = new PointerEvent("pointermove", pointerEventInit);
        evt.inputIndex = PointerInput.Move;
        if (this._checkPrePointerObservable(pickResult, evt, PointerEventTypes.POINTERMOVE)) {
            return;
        }
        this._processPointerMove(pickResult, evt);
    }
    /**
     * Use this method to simulate a pointer down on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult - pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit - pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     */
    simulatePointerDown(pickResult, pointerEventInit) {
        const evt = new PointerEvent("pointerdown", pointerEventInit);
        evt.inputIndex = evt.button + 2;
        if (this._checkPrePointerObservable(pickResult, evt, PointerEventTypes.POINTERDOWN)) {
            return;
        }
        this._processPointerDown(pickResult, evt);
    }
    _processPointerDown(pickResult, evt) {
        const scene = this._scene;
        if (pickResult?.pickedMesh) {
            this._pickedDownMesh = pickResult.pickedMesh;
            const actionManager = pickResult.pickedMesh._getActionManagerForTrigger();
            if (actionManager) {
                if (actionManager.hasPickTriggers) {
                    actionManager.processTrigger(5, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                    switch (evt.button) {
                        case 0:
                            actionManager.processTrigger(2, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                            break;
                        case 1:
                            actionManager.processTrigger(4, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                            break;
                        case 2:
                            actionManager.processTrigger(3, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                            break;
                    }
                }
                if (actionManager.hasSpecificTrigger(8)) {
                    window.setTimeout(() => {
                        const pickResult = scene.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, (mesh) => ((mesh.isPickable &&
                            mesh.isVisible &&
                            mesh.isReady() &&
                            mesh.actionManager &&
                            mesh.actionManager.hasSpecificTrigger(8) &&
                            mesh === this._pickedDownMesh)), false, scene.cameraToUseForPointers);
                        if (pickResult?.pickedMesh && actionManager) {
                            if (this._activePointerIdsCount !== 0 && Date.now() - this._startingPointerTime > InputManager.LongPressDelay && !this._isPointerSwiping()) {
                                this._startingPointerTime = 0;
                                actionManager.processTrigger(8, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                            }
                        }
                    }, InputManager.LongPressDelay);
                }
            }
        }
        else {
            for (const step of scene._pointerDownStage) {
                pickResult = step.action(this._unTranslatedPointerX, this._unTranslatedPointerY, pickResult, evt, false);
            }
        }
        let pointerInfo;
        const type = PointerEventTypes.POINTERDOWN;
        if (pickResult) {
            if (scene.onPointerDown) {
                scene.onPointerDown(evt, pickResult, type);
            }
            pointerInfo = new PointerInfo(type, evt, pickResult);
            this._setRayOnPointerInfo(pickResult, evt);
        }
        else {
            pointerInfo = new PointerInfo(type, evt, null, this);
        }
        if (scene.onPointerObservable.hasObservers()) {
            scene.onPointerObservable.notifyObservers(pointerInfo, type);
        }
    }
    /**
     * @internal
     * @internals Boolean if delta for pointer exceeds drag movement threshold
     */
    _isPointerSwiping() {
        return this._isSwiping;
    }
    /**
     * Use this method to simulate a pointer up on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult - pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit - pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     * @param doubleTap - indicates that the pointer up event should be considered as part of a double click (false by default)
     */
    simulatePointerUp(pickResult, pointerEventInit, doubleTap) {
        const evt = new PointerEvent("pointerup", pointerEventInit);
        evt.inputIndex = PointerInput.Move;
        const clickInfo = new _ClickInfo();
        if (doubleTap) {
            clickInfo.doubleClick = true;
        }
        else {
            clickInfo.singleClick = true;
        }
        if (this._checkPrePointerObservable(pickResult, evt, PointerEventTypes.POINTERUP)) {
            return;
        }
        this._processPointerUp(pickResult, evt, clickInfo);
    }
    _processPointerUp(pickResult, evt, clickInfo) {
        const scene = this._scene;
        if (pickResult?.pickedMesh) {
            this._pickedUpMesh = pickResult.pickedMesh;
            if (this._pickedDownMesh === this._pickedUpMesh) {
                if (scene.onPointerPick) {
                    scene.onPointerPick(evt, pickResult);
                }
                if (clickInfo.singleClick && !clickInfo.ignore && scene.onPointerObservable.observers.length > this._cameraObserverCount) {
                    const type = PointerEventTypes.POINTERPICK;
                    const pi = new PointerInfo(type, evt, pickResult);
                    this._setRayOnPointerInfo(pickResult, evt);
                    scene.onPointerObservable.notifyObservers(pi, type);
                }
            }
            const actionManager = pickResult.pickedMesh._getActionManagerForTrigger();
            if (actionManager && !clickInfo.ignore) {
                actionManager.processTrigger(7, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                if (!clickInfo.hasSwiped && clickInfo.singleClick) {
                    actionManager.processTrigger(1, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                }
                const doubleClickActionManager = pickResult.pickedMesh._getActionManagerForTrigger(6);
                if (clickInfo.doubleClick && doubleClickActionManager) {
                    doubleClickActionManager.processTrigger(6, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                }
            }
        }
        else {
            if (!clickInfo.ignore) {
                for (const step of scene._pointerUpStage) {
                    pickResult = step.action(this._unTranslatedPointerX, this._unTranslatedPointerY, pickResult, evt, clickInfo.doubleClick);
                }
            }
        }
        if (this._pickedDownMesh && this._pickedDownMesh !== this._pickedUpMesh) {
            const pickedDownActionManager = this._pickedDownMesh._getActionManagerForTrigger(16);
            if (pickedDownActionManager) {
                pickedDownActionManager.processTrigger(16, ActionEvent.CreateNew(this._pickedDownMesh, evt));
            }
        }
        if (!clickInfo.ignore) {
            const pi = new PointerInfo(PointerEventTypes.POINTERUP, evt, pickResult);
            // Set ray on picking info.  Note that this info will also be reused for the tap notification.
            this._setRayOnPointerInfo(pickResult, evt);
            scene.onPointerObservable.notifyObservers(pi, PointerEventTypes.POINTERUP);
            if (scene.onPointerUp) {
                scene.onPointerUp(evt, pickResult, PointerEventTypes.POINTERUP);
            }
            if (!clickInfo.hasSwiped && !this._skipPointerTap && !this._isMultiTouchGesture) {
                let type = 0;
                if (clickInfo.singleClick) {
                    type = PointerEventTypes.POINTERTAP;
                }
                else if (clickInfo.doubleClick) {
                    type = PointerEventTypes.POINTERDOUBLETAP;
                }
                if (type) {
                    const pi = new PointerInfo(type, evt, pickResult);
                    if (scene.onPointerObservable.hasObservers() && scene.onPointerObservable.hasSpecificMask(type)) {
                        scene.onPointerObservable.notifyObservers(pi, type);
                    }
                }
            }
        }
    }
    /**
     * Gets a boolean indicating if the current pointer event is captured (meaning that the scene has already handled the pointer down)
     * @param pointerId - defines the pointer id to use in a multi-touch scenario (0 by default)
     * @returns true if the pointer was captured
     */
    isPointerCaptured(pointerId = 0) {
        return this._pointerCaptures[pointerId];
    }
    /**
     * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
     * @param attachUp - defines if you want to attach events to pointerup
     * @param attachDown - defines if you want to attach events to pointerdown
     * @param attachMove - defines if you want to attach events to pointermove
     * @param elementToAttachTo - defines the target DOM element to attach to (will use the canvas by default)
     */
    attachControl(attachUp = true, attachDown = true, attachMove = true, elementToAttachTo = null) {
        const scene = this._scene;
        const engine = scene.getEngine();
        if (!elementToAttachTo) {
            elementToAttachTo = engine.getInputElement();
        }
        if (this._alreadyAttached) {
            this.detachControl();
        }
        if (elementToAttachTo) {
            this._alreadyAttachedTo = elementToAttachTo;
        }
        this._deviceSourceManager = new DeviceSourceManager(engine);
        // Because this is only called from _initClickEvent, which is called in _onPointerUp, we'll use the pointerUpPredicate for the pick call
        this._initActionManager = (act) => {
            if (!this._meshPickProceed) {
                const pickResult = scene.skipPointerUpPicking || (scene._registeredActions === 0 && !this._checkForPicking() && !scene.onPointerUp)
                    ? null
                    : scene.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, scene.pointerUpPredicate, scene.pointerUpFastCheck, scene.cameraToUseForPointers, scene.pointerUpTrianglePredicate);
                this._currentPickResult = pickResult;
                if (pickResult) {
                    act = pickResult.hit && pickResult.pickedMesh ? pickResult.pickedMesh._getActionManagerForTrigger() : null;
                }
                this._meshPickProceed = true;
            }
            return act;
        };
        this._delayedSimpleClick = (btn, clickInfo, cb) => {
            // double click delay is over and that no double click has been raised since, or the 2 consecutive keys pressed are different
            if ((Date.now() - this._previousStartingPointerTime > InputManager.DoubleClickDelay && !this._doubleClickOccured) || btn !== this._previousButtonPressed) {
                this._doubleClickOccured = false;
                clickInfo.singleClick = true;
                clickInfo.ignore = false;
                // If we have a delayed click, we need to resolve the TAP event
                if (this._delayedClicks[btn]) {
                    const evt = this._delayedClicks[btn].evt;
                    const type = PointerEventTypes.POINTERTAP;
                    const pi = new PointerInfo(type, evt, this._currentPickResult);
                    if (scene.onPointerObservable.hasObservers() && scene.onPointerObservable.hasSpecificMask(type)) {
                        scene.onPointerObservable.notifyObservers(pi, type);
                    }
                    // Clear the delayed click
                    this._delayedClicks[btn] = null;
                }
            }
        };
        this._initClickEvent = (obs1, obs2, evt, cb) => {
            const clickInfo = new _ClickInfo();
            this._currentPickResult = null;
            let act = null;
            let checkPicking = obs1.hasSpecificMask(PointerEventTypes.POINTERPICK) ||
                obs2.hasSpecificMask(PointerEventTypes.POINTERPICK) ||
                obs1.hasSpecificMask(PointerEventTypes.POINTERTAP) ||
                obs2.hasSpecificMask(PointerEventTypes.POINTERTAP) ||
                obs1.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP) ||
                obs2.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP);
            if (!checkPicking && AbstractActionManager) {
                act = this._initActionManager(act, clickInfo);
                if (act) {
                    checkPicking = act.hasPickTriggers;
                }
            }
            let needToIgnoreNext = false;
            // Never pick if this is a multi-touch gesture (e.g. pinch)
            checkPicking = checkPicking && !this._isMultiTouchGesture;
            if (checkPicking) {
                const btn = evt.button;
                clickInfo.hasSwiped = this._isPointerSwiping();
                if (!clickInfo.hasSwiped) {
                    let checkSingleClickImmediately = !InputManager.ExclusiveDoubleClickMode;
                    if (!checkSingleClickImmediately) {
                        checkSingleClickImmediately = !obs1.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP) && !obs2.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP);
                        if (checkSingleClickImmediately && !AbstractActionManager.HasSpecificTrigger(6)) {
                            act = this._initActionManager(act, clickInfo);
                            if (act) {
                                checkSingleClickImmediately = !act.hasSpecificTrigger(6);
                            }
                        }
                    }
                    if (checkSingleClickImmediately) {
                        // single click detected if double click delay is over or two different successive keys pressed without exclusive double click or no double click required
                        if (Date.now() - this._previousStartingPointerTime > InputManager.DoubleClickDelay || btn !== this._previousButtonPressed) {
                            clickInfo.singleClick = true;
                            cb(clickInfo, this._currentPickResult);
                            needToIgnoreNext = true;
                        }
                    }
                    // at least one double click is required to be check and exclusive double click is enabled
                    else {
                        // Queue up a delayed click, just in case this isn't a double click
                        // It should be noted that while this delayed event happens
                        // because of user input, it shouldn't be considered as a direct,
                        // timing-dependent result of that input.  It's meant to just fire the TAP event
                        const delayedClick = {
                            evt: evt,
                            clickInfo: clickInfo,
                            timeoutId: window.setTimeout(this._delayedSimpleClick.bind(this, btn, clickInfo, cb), InputManager.DoubleClickDelay),
                        };
                        this._delayedClicks[btn] = delayedClick;
                    }
                    let checkDoubleClick = obs1.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP) || obs2.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP);
                    if (!checkDoubleClick && AbstractActionManager.HasSpecificTrigger(6)) {
                        act = this._initActionManager(act, clickInfo);
                        if (act) {
                            checkDoubleClick = act.hasSpecificTrigger(6);
                        }
                    }
                    if (checkDoubleClick) {
                        // two successive keys pressed are equal, double click delay is not over and double click has not just occurred
                        if (btn === this._previousButtonPressed && Date.now() - this._previousStartingPointerTime < InputManager.DoubleClickDelay && !this._doubleClickOccured) {
                            // pointer has not moved for 2 clicks, it's a double click
                            if (!clickInfo.hasSwiped && !this._isPointerSwiping()) {
                                this._previousStartingPointerTime = 0;
                                this._doubleClickOccured = true;
                                clickInfo.doubleClick = true;
                                clickInfo.ignore = false;
                                // If we have a pending click, we need to cancel it
                                if (InputManager.ExclusiveDoubleClickMode && this._delayedClicks[btn]) {
                                    clearTimeout(this._delayedClicks[btn]?.timeoutId);
                                    this._delayedClicks[btn] = null;
                                }
                                cb(clickInfo, this._currentPickResult);
                            }
                            // if the two successive clicks are too far, it's just two simple clicks
                            else {
                                this._doubleClickOccured = false;
                                this._previousStartingPointerTime = this._startingPointerTime;
                                this._previousStartingPointerPosition.x = this._startingPointerPosition.x;
                                this._previousStartingPointerPosition.y = this._startingPointerPosition.y;
                                this._previousButtonPressed = btn;
                                if (InputManager.ExclusiveDoubleClickMode) {
                                    // If we have a delayed click, we need to cancel it
                                    if (this._delayedClicks[btn]) {
                                        clearTimeout(this._delayedClicks[btn]?.timeoutId);
                                        this._delayedClicks[btn] = null;
                                    }
                                    cb(clickInfo, this._previousPickResult);
                                }
                                else {
                                    cb(clickInfo, this._currentPickResult);
                                }
                            }
                            needToIgnoreNext = true;
                        }
                        // just the first click of the double has been raised
                        else {
                            this._doubleClickOccured = false;
                            this._previousStartingPointerTime = this._startingPointerTime;
                            this._previousStartingPointerPosition.x = this._startingPointerPosition.x;
                            this._previousStartingPointerPosition.y = this._startingPointerPosition.y;
                            this._previousButtonPressed = btn;
                        }
                    }
                }
            }
            // Even if ExclusiveDoubleClickMode is true, we need to always handle
            // up events at time of execution, unless we're explicitly ignoring them.
            if (!needToIgnoreNext) {
                cb(clickInfo, this._currentPickResult);
            }
        };
        this._onPointerMove = (evt) => {
            this._updatePointerPosition(evt);
            // Check if pointer leaves DragMovementThreshold range to determine if swipe is occurring
            if (!this._isSwiping && this._swipeButtonPressed !== -1) {
                this._isSwiping =
                    Math.abs(this._startingPointerPosition.x - this._pointerX) > InputManager.DragMovementThreshold ||
                        Math.abs(this._startingPointerPosition.y - this._pointerY) > InputManager.DragMovementThreshold;
            }
            // Because there's a race condition between pointermove and pointerlockchange events, we need to
            // verify that the pointer is still locked after each pointermove event.
            if (engine.isPointerLock) {
                engine._verifyPointerLock();
            }
            // PreObservable support
            if (this._checkPrePointerObservable(null, evt, evt.inputIndex >= PointerInput.MouseWheelX && evt.inputIndex <= PointerInput.MouseWheelZ ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE)) {
                return;
            }
            if (!scene.cameraToUseForPointers && !scene.activeCamera) {
                return;
            }
            if (scene.skipPointerMovePicking) {
                this._processPointerMove(new PickingInfo(), evt);
                return;
            }
            if (!scene.pointerMovePredicate) {
                scene.pointerMovePredicate = (mesh) => mesh.isPickable &&
                    mesh.isVisible &&
                    mesh.isReady() &&
                    mesh.isEnabled() &&
                    (mesh.enablePointerMoveEvents || scene.constantlyUpdateMeshUnderPointer || mesh._getActionManagerForTrigger() !== null) &&
                    (!scene.cameraToUseForPointers || (scene.cameraToUseForPointers.layerMask & mesh.layerMask) !== 0);
            }
            const pickResult = scene._registeredActions > 0 || scene.constantlyUpdateMeshUnderPointer ? this._pickMove(evt) : null;
            this._processPointerMove(pickResult, evt);
        };
        this._onPointerDown = (evt) => {
            const freeIndex = this._activePointerIds.indexOf(-1);
            if (freeIndex === -1) {
                this._activePointerIds.push(evt.pointerId);
            }
            else {
                this._activePointerIds[freeIndex] = evt.pointerId;
            }
            this._activePointerIdsCount++;
            this._pickedDownMesh = null;
            this._meshPickProceed = false;
            // If ExclusiveDoubleClickMode is true, we need to resolve any pending delayed clicks
            if (InputManager.ExclusiveDoubleClickMode) {
                for (let i = 0; i < this._delayedClicks.length; i++) {
                    if (this._delayedClicks[i]) {
                        // If the button that was pressed is the same as the one that was released,
                        // just clear the timer.  This will be resolved in the up event.
                        if (evt.button === i) {
                            clearTimeout(this._delayedClicks[i]?.timeoutId);
                        }
                        else {
                            // Otherwise, we need to resolve the click
                            const clickInfo = this._delayedClicks[i].clickInfo;
                            this._doubleClickOccured = false;
                            clickInfo.singleClick = true;
                            clickInfo.ignore = false;
                            const prevEvt = this._delayedClicks[i].evt;
                            const type = PointerEventTypes.POINTERTAP;
                            const pi = new PointerInfo(type, prevEvt, this._currentPickResult);
                            if (scene.onPointerObservable.hasObservers() && scene.onPointerObservable.hasSpecificMask(type)) {
                                scene.onPointerObservable.notifyObservers(pi, type);
                            }
                            // Clear the delayed click
                            this._delayedClicks[i] = null;
                        }
                    }
                }
            }
            this._updatePointerPosition(evt);
            if (this._swipeButtonPressed === -1) {
                this._swipeButtonPressed = evt.button;
            }
            if (scene.preventDefaultOnPointerDown && elementToAttachTo) {
                evt.preventDefault();
                elementToAttachTo.focus();
            }
            this._startingPointerPosition.x = this._pointerX;
            this._startingPointerPosition.y = this._pointerY;
            this._startingPointerTime = Date.now();
            // PreObservable support
            if (this._checkPrePointerObservable(null, evt, PointerEventTypes.POINTERDOWN)) {
                return;
            }
            if (!scene.cameraToUseForPointers && !scene.activeCamera) {
                return;
            }
            this._pointerCaptures[evt.pointerId] = true;
            if (!scene.pointerDownPredicate) {
                scene.pointerDownPredicate = (mesh) => {
                    return (mesh.isPickable &&
                        mesh.isVisible &&
                        mesh.isReady() &&
                        mesh.isEnabled() &&
                        (!scene.cameraToUseForPointers || (scene.cameraToUseForPointers.layerMask & mesh.layerMask) !== 0));
                };
            }
            // Meshes
            this._pickedDownMesh = null;
            let pickResult;
            if (scene.skipPointerDownPicking || (scene._registeredActions === 0 && !this._checkForPicking() && !scene.onPointerDown)) {
                pickResult = new PickingInfo();
            }
            else {
                pickResult = scene.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, scene.pointerDownPredicate, scene.pointerDownFastCheck, scene.cameraToUseForPointers, scene.pointerDownTrianglePredicate);
            }
            this._processPointerDown(pickResult, evt);
        };
        this._onPointerUp = (evt) => {
            const pointerIdIndex = this._activePointerIds.indexOf(evt.pointerId);
            if (pointerIdIndex === -1) {
                // We are attaching the pointer up to windows because of a bug in FF
                // If this pointerId is not paired with an _onPointerDown call, ignore it
                return;
            }
            this._activePointerIds[pointerIdIndex] = -1;
            this._activePointerIdsCount--;
            this._pickedUpMesh = null;
            this._meshPickProceed = false;
            this._updatePointerPosition(evt);
            if (scene.preventDefaultOnPointerUp && elementToAttachTo) {
                evt.preventDefault();
                elementToAttachTo.focus();
            }
            this._initClickEvent(scene.onPrePointerObservable, scene.onPointerObservable, evt, (clickInfo, pickResult) => {
                // PreObservable support
                if (scene.onPrePointerObservable.hasObservers()) {
                    this._skipPointerTap = false;
                    if (!clickInfo.ignore) {
                        if (this._checkPrePointerObservable(null, evt, PointerEventTypes.POINTERUP)) {
                            // If we're skipping the next observable, we need to reset the swipe state before returning
                            if (this._swipeButtonPressed === evt.button) {
                                this._isSwiping = false;
                                this._swipeButtonPressed = -1;
                            }
                            // If we're going to skip the POINTERUP, we need to reset the pointer capture
                            if (evt.buttons === 0) {
                                this._pointerCaptures[evt.pointerId] = false;
                            }
                            return;
                        }
                        if (!clickInfo.hasSwiped) {
                            if (clickInfo.singleClick && scene.onPrePointerObservable.hasSpecificMask(PointerEventTypes.POINTERTAP)) {
                                if (this._checkPrePointerObservable(null, evt, PointerEventTypes.POINTERTAP)) {
                                    this._skipPointerTap = true;
                                }
                            }
                            if (clickInfo.doubleClick && scene.onPrePointerObservable.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP)) {
                                if (this._checkPrePointerObservable(null, evt, PointerEventTypes.POINTERDOUBLETAP)) {
                                    this._skipPointerTap = true;
                                }
                            }
                        }
                    }
                }
                // There should be a pointer captured at this point so if there isn't we should reset and return
                if (!this._pointerCaptures[evt.pointerId]) {
                    if (this._swipeButtonPressed === evt.button) {
                        this._isSwiping = false;
                        this._swipeButtonPressed = -1;
                    }
                    return;
                }
                // Only release capture if all buttons are released
                if (evt.buttons === 0) {
                    this._pointerCaptures[evt.pointerId] = false;
                }
                if (!scene.cameraToUseForPointers && !scene.activeCamera) {
                    return;
                }
                if (!scene.pointerUpPredicate) {
                    scene.pointerUpPredicate = (mesh) => {
                        return (mesh.isPickable &&
                            mesh.isVisible &&
                            mesh.isReady() &&
                            mesh.isEnabled() &&
                            (!scene.cameraToUseForPointers || (scene.cameraToUseForPointers.layerMask & mesh.layerMask) !== 0));
                    };
                }
                // Meshes
                if (!this._meshPickProceed && ((AbstractActionManager && AbstractActionManager.HasTriggers) || this._checkForPicking() || scene.onPointerUp)) {
                    this._initActionManager(null, clickInfo);
                }
                if (!pickResult) {
                    pickResult = this._currentPickResult;
                }
                this._processPointerUp(pickResult, evt, clickInfo);
                this._previousPickResult = this._currentPickResult;
                if (this._swipeButtonPressed === evt.button) {
                    this._isSwiping = false;
                    this._swipeButtonPressed = -1;
                }
            });
        };
        this._onKeyDown = (evt) => {
            const type = KeyboardEventTypes.KEYDOWN;
            if (scene.onPreKeyboardObservable.hasObservers()) {
                const pi = new KeyboardInfoPre(type, evt);
                scene.onPreKeyboardObservable.notifyObservers(pi, type);
                if (pi.skipOnKeyboardObservable) {
                    return;
                }
            }
            if (scene.onKeyboardObservable.hasObservers()) {
                const pi = new KeyboardInfo(type, evt);
                scene.onKeyboardObservable.notifyObservers(pi, type);
            }
            if (scene.actionManager) {
                scene.actionManager.processTrigger(14, ActionEvent.CreateNewFromScene(scene, evt));
            }
        };
        this._onKeyUp = (evt) => {
            const type = KeyboardEventTypes.KEYUP;
            if (scene.onPreKeyboardObservable.hasObservers()) {
                const pi = new KeyboardInfoPre(type, evt);
                scene.onPreKeyboardObservable.notifyObservers(pi, type);
                if (pi.skipOnKeyboardObservable) {
                    return;
                }
            }
            if (scene.onKeyboardObservable.hasObservers()) {
                const pi = new KeyboardInfo(type, evt);
                scene.onKeyboardObservable.notifyObservers(pi, type);
            }
            if (scene.actionManager) {
                scene.actionManager.processTrigger(15, ActionEvent.CreateNewFromScene(scene, evt));
            }
        };
        // If a device connects that we can handle, wire up the observable
        this._deviceSourceManager.onDeviceConnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                deviceSource.onInputChangedObservable.add((eventData) => {
                    this._originMouseEvent = eventData;
                    if (eventData.inputIndex === PointerInput.LeftClick ||
                        eventData.inputIndex === PointerInput.MiddleClick ||
                        eventData.inputIndex === PointerInput.RightClick ||
                        eventData.inputIndex === PointerInput.BrowserBack ||
                        eventData.inputIndex === PointerInput.BrowserForward) {
                        if (attachDown && deviceSource.getInput(eventData.inputIndex) === 1) {
                            this._onPointerDown(eventData);
                        }
                        else if (attachUp && deviceSource.getInput(eventData.inputIndex) === 0) {
                            this._onPointerUp(eventData);
                        }
                    }
                    else if (attachMove) {
                        if (eventData.inputIndex === PointerInput.Move) {
                            this._onPointerMove(eventData);
                        }
                        else if (eventData.inputIndex === PointerInput.MouseWheelX ||
                            eventData.inputIndex === PointerInput.MouseWheelY ||
                            eventData.inputIndex === PointerInput.MouseWheelZ) {
                            this._onPointerMove(eventData);
                        }
                    }
                });
            }
            else if (deviceSource.deviceType === DeviceType.Touch) {
                deviceSource.onInputChangedObservable.add((eventData) => {
                    if (eventData.inputIndex === PointerInput.LeftClick) {
                        if (attachDown && deviceSource.getInput(eventData.inputIndex) === 1) {
                            this._onPointerDown(eventData);
                            if (this._activePointerIdsCount > 1) {
                                this._isMultiTouchGesture = true;
                            }
                        }
                        else if (attachUp && deviceSource.getInput(eventData.inputIndex) === 0) {
                            this._onPointerUp(eventData);
                            if (this._activePointerIdsCount === 0) {
                                this._isMultiTouchGesture = false;
                            }
                        }
                    }
                    if (attachMove && eventData.inputIndex === PointerInput.Move) {
                        this._onPointerMove(eventData);
                    }
                });
            }
            else if (deviceSource.deviceType === DeviceType.Keyboard) {
                deviceSource.onInputChangedObservable.add((eventData) => {
                    if (eventData.type === "keydown") {
                        this._onKeyDown(eventData);
                    }
                    else if (eventData.type === "keyup") {
                        this._onKeyUp(eventData);
                    }
                });
            }
        });
        this._alreadyAttached = true;
    }
    /**
     * Detaches all event handlers
     */
    detachControl() {
        if (this._alreadyAttached) {
            this._deviceSourceManager.dispose();
            this._deviceSourceManager = null;
            // Cursor
            if (this._alreadyAttachedTo && !this._scene.doNotHandleCursors) {
                this._alreadyAttachedTo.style.cursor = this._scene.defaultCursor;
            }
            this._alreadyAttached = false;
            this._alreadyAttachedTo = null;
        }
    }
    /**
     * Set the value of meshUnderPointer for a given pointerId
     * @param mesh - defines the mesh to use
     * @param pointerId - optional pointer id when using more than one pointer. Defaults to 0
     * @param pickResult - optional pickingInfo data used to find mesh
     * @param evt - optional pointer event
     */
    setPointerOverMesh(mesh, pointerId = 0, pickResult, evt) {
        if (this._meshUnderPointerId[pointerId] === mesh && (!mesh || !mesh._internalAbstractMeshDataInfo._pointerOverDisableMeshTesting)) {
            return;
        }
        const underPointerMesh = this._meshUnderPointerId[pointerId];
        let actionManager;
        if (underPointerMesh) {
            actionManager = underPointerMesh._getActionManagerForTrigger(10);
            if (actionManager) {
                actionManager.processTrigger(10, new ActionEvent(underPointerMesh, this._pointerX, this._pointerY, mesh, evt, { pointerId }));
            }
        }
        if (mesh) {
            this._meshUnderPointerId[pointerId] = mesh;
            this._pointerOverMesh = mesh;
            actionManager = mesh._getActionManagerForTrigger(9);
            if (actionManager) {
                actionManager.processTrigger(9, new ActionEvent(mesh, this._pointerX, this._pointerY, mesh, evt, { pointerId, pickResult }));
            }
        }
        else {
            delete this._meshUnderPointerId[pointerId];
            this._pointerOverMesh = null;
        }
        // if we reached this point, meshUnderPointerId has been updated. We need to notify observers that are registered.
        if (this._scene.onMeshUnderPointerUpdatedObservable.hasObservers()) {
            this._scene.onMeshUnderPointerUpdatedObservable.notifyObservers({
                mesh,
                pointerId,
            });
        }
    }
    /**
     * Gets the mesh under the pointer
     * @returns a Mesh or null if no mesh is under the pointer
     */
    getPointerOverMesh() {
        return this.meshUnderPointer;
    }
    /**
     * @param mesh - Mesh to invalidate
     * @internal
     */
    _invalidateMesh(mesh) {
        if (this._pointerOverMesh === mesh) {
            this._pointerOverMesh = null;
        }
        if (this._pickedDownMesh === mesh) {
            this._pickedDownMesh = null;
        }
        if (this._pickedUpMesh === mesh) {
            this._pickedUpMesh = null;
        }
        for (const pointerId in this._meshUnderPointerId) {
            if (this._meshUnderPointerId[pointerId] === mesh) {
                delete this._meshUnderPointerId[pointerId];
            }
        }
    }
}
/** The distance in pixel that you have to move to prevent some events */
InputManager.DragMovementThreshold = 10; // in pixels
/** Time in milliseconds to wait to raise long press events if button is still pressed */
InputManager.LongPressDelay = 500; // in milliseconds
/** Time in milliseconds with two consecutive clicks will be considered as a double click */
InputManager.DoubleClickDelay = 300; // in milliseconds
/**
 * This flag will modify the behavior so that, when true, a click will happen if and only if
 * another click DOES NOT happen within the DoubleClickDelay time frame.  If another click does
 * happen within that time frame, the first click will not fire an event and and a double click will occur.
 */
InputManager.ExclusiveDoubleClickMode = false;
//# sourceMappingURL=scene.inputManager.js.map