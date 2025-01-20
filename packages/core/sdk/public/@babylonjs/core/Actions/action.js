import { Observable } from "../Misc/observable.js";
import { Vector2, Vector3 } from "../Maths/math.vector.js";
import { Color3, Color4 } from "../Maths/math.color.js";
import { RegisterClass } from "../Misc/typeStore.js";
/**
 * The action to be carried out following a trigger
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#available-actions
 */
export class Action {
    /**
     * Creates a new Action
     * @param triggerOptions the trigger, with or without parameters, for the action
     * @param condition an optional determinant of action
     */
    constructor(
    /** the trigger, with or without parameters, for the action */
    triggerOptions, condition) {
        this.triggerOptions = triggerOptions;
        /**
         * An event triggered prior to action being executed.
         */
        this.onBeforeExecuteObservable = new Observable();
        if (triggerOptions.parameter) {
            this.trigger = triggerOptions.trigger;
            this._triggerParameter = triggerOptions.parameter;
        }
        else if (triggerOptions.trigger) {
            this.trigger = triggerOptions.trigger;
        }
        else {
            this.trigger = triggerOptions;
        }
        this._nextActiveAction = this;
        this._condition = condition;
    }
    /**
     * Internal only
     * @internal
     */
    _prepare() { }
    /**
     * Gets the trigger parameter
     * @returns the trigger parameter
     */
    getTriggerParameter() {
        return this._triggerParameter;
    }
    /**
     * Sets the trigger parameter
     * @param value defines the new trigger parameter
     */
    setTriggerParameter(value) {
        this._triggerParameter = value;
    }
    /**
     * Internal only - Returns if the current condition allows to run the action
     * @internal
     */
    _evaluateConditionForCurrentFrame() {
        const condition = this._condition;
        if (!condition) {
            return true;
        }
        const currentRenderId = this._actionManager.getScene().getRenderId();
        // We cache the current evaluation for the current frame
        if (condition._evaluationId !== currentRenderId) {
            condition._evaluationId = currentRenderId;
            condition._currentResult = condition.isValid();
        }
        return condition._currentResult;
    }
    /**
     * Internal only - executes current action event
     * @internal
     */
    _executeCurrent(evt) {
        const isConditionValid = this._evaluateConditionForCurrentFrame();
        if (!isConditionValid) {
            return;
        }
        this.onBeforeExecuteObservable.notifyObservers(this);
        this._nextActiveAction.execute(evt);
        this.skipToNextActiveAction();
    }
    /**
     * Execute placeholder for child classes
     * @param evt optional action event
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute(evt) { }
    /**
     * Skips to next active action
     */
    skipToNextActiveAction() {
        if (this._nextActiveAction._child) {
            if (!this._nextActiveAction._child._actionManager) {
                this._nextActiveAction._child._actionManager = this._actionManager;
            }
            this._nextActiveAction = this._nextActiveAction._child;
        }
        else {
            this._nextActiveAction = this;
        }
    }
    /**
     * Adds action to chain of actions, may be a DoNothingAction
     * @param action defines the next action to execute
     * @returns The action passed in
     * @see https://www.babylonjs-playground.com/#1T30HR#0
     */
    then(action) {
        this._child = action;
        action._actionManager = this._actionManager;
        action._prepare();
        return action;
    }
    /**
     * Internal only
     * @internal
     */
    _getProperty(propertyPath) {
        return this._actionManager._getProperty(propertyPath);
    }
    /**
     * @internal
     */
    _getEffectiveTarget(target, propertyPath) {
        return this._actionManager._getEffectiveTarget(target, propertyPath);
    }
    /**
     * Serialize placeholder for child classes
     * @param parent of child
     * @returns the serialized object
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    serialize(parent) {
        return null;
    }
    /**
     * Internal only called by serialize
     * @internal
     */
    _serialize(serializedAction, parent) {
        const serializationObject = {
            type: 1,
            children: [],
            name: serializedAction.name,
            properties: serializedAction.properties || [],
        };
        // Serialize child
        if (this._child) {
            this._child.serialize(serializationObject);
        }
        // Check if "this" has a condition
        if (this._condition) {
            const serializedCondition = this._condition.serialize();
            serializedCondition.children.push(serializationObject);
            if (parent) {
                parent.children.push(serializedCondition);
            }
            return serializedCondition;
        }
        if (parent) {
            parent.children.push(serializationObject);
        }
        return serializationObject;
    }
}
/**
 * Internal only
 * @internal
 */
Action._SerializeValueAsString = (value) => {
    if (typeof value === "number") {
        return value.toString();
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }
    if (value instanceof Vector2) {
        return value.x + ", " + value.y;
    }
    if (value instanceof Vector3) {
        return value.x + ", " + value.y + ", " + value.z;
    }
    if (value instanceof Color3) {
        return value.r + ", " + value.g + ", " + value.b;
    }
    if (value instanceof Color4) {
        return value.r + ", " + value.g + ", " + value.b + ", " + value.a;
    }
    return value; // string
};
/**
 * Internal only
 * @internal
 */
Action._GetTargetProperty = (target) => {
    return {
        name: "target",
        targetType: target._isMesh
            ? "MeshProperties"
            : target._isLight
                ? "LightProperties"
                : target._isCamera
                    ? "CameraProperties"
                    : target._isMaterial
                        ? "MaterialProperties"
                        : "SceneProperties",
        value: target._isScene ? "Scene" : target.name,
    };
};
RegisterClass("BABYLON.Action", Action);
//# sourceMappingURL=action.js.map