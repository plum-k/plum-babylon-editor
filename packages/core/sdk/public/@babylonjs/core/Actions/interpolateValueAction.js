import { Action } from "./action.js";
import { Logger } from "../Misc/logger.js";
import { Observable } from "../Misc/observable.js";
import { Color3 } from "../Maths/math.color.js";
import { Vector3, Matrix, Quaternion } from "../Maths/math.vector.js";
import { Animation } from "../Animations/animation.js";
import { RegisterClass } from "../Misc/typeStore.js";
/**
 * This defines an action responsible to change the value of a property
 * by interpolating between its current value and the newly set one once triggered.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions
 */
export class InterpolateValueAction extends Action {
    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param target defines the object containing the value to interpolate
     * @param propertyPath defines the path to the property in the target object
     * @param value defines the target value at the end of the interpolation
     * @param duration defines the time it will take for the property to interpolate to the value.
     * @param condition defines the trigger related conditions
     * @param stopOtherAnimations defines if the other scene animations should be stopped when the action has been triggered
     * @param onInterpolationDone defines a callback raised once the interpolation animation has been done
     */
    constructor(triggerOptions, target, propertyPath, value, duration = 1000, condition, stopOtherAnimations, onInterpolationDone) {
        super(triggerOptions, condition);
        /**
         * Defines the time it will take for the property to interpolate to the value.
         */
        this.duration = 1000;
        /**
         * Observable triggered once the interpolation animation has been done.
         */
        this.onInterpolationDoneObservable = new Observable();
        this.propertyPath = propertyPath;
        this.value = value;
        this.duration = duration;
        this.stopOtherAnimations = stopOtherAnimations;
        this.onInterpolationDone = onInterpolationDone;
        this._target = this._effectiveTarget = target;
    }
    /** @internal */
    _prepare() {
        this._effectiveTarget = this._getEffectiveTarget(this._effectiveTarget, this.propertyPath);
        this._property = this._getProperty(this.propertyPath);
    }
    /**
     * Execute the action starts the value interpolation.
     */
    execute() {
        const scene = this._actionManager.getScene();
        const keys = [
            {
                frame: 0,
                value: this._effectiveTarget[this._property],
            },
            {
                frame: 100,
                value: this.value,
            },
        ];
        let dataType;
        if (typeof this.value === "number") {
            dataType = Animation.ANIMATIONTYPE_FLOAT;
        }
        else if (this.value instanceof Color3) {
            dataType = Animation.ANIMATIONTYPE_COLOR3;
        }
        else if (this.value instanceof Vector3) {
            dataType = Animation.ANIMATIONTYPE_VECTOR3;
        }
        else if (this.value instanceof Matrix) {
            dataType = Animation.ANIMATIONTYPE_MATRIX;
        }
        else if (this.value instanceof Quaternion) {
            dataType = Animation.ANIMATIONTYPE_QUATERNION;
        }
        else {
            Logger.Warn("InterpolateValueAction: Unsupported type (" + typeof this.value + ")");
            return;
        }
        const animation = new Animation("InterpolateValueAction", this._property, 100 * (1000.0 / this.duration), dataType, Animation.ANIMATIONLOOPMODE_CONSTANT);
        animation.setKeys(keys);
        if (this.stopOtherAnimations) {
            scene.stopAnimation(this._effectiveTarget);
        }
        const wrapper = () => {
            this.onInterpolationDoneObservable.notifyObservers(this);
            if (this.onInterpolationDone) {
                this.onInterpolationDone();
            }
        };
        scene.beginDirectAnimation(this._effectiveTarget, [animation], 0, 100, false, 1, wrapper);
    }
    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    serialize(parent) {
        return super._serialize({
            name: "InterpolateValueAction",
            properties: [
                Action._GetTargetProperty(this._target),
                { name: "propertyPath", value: this.propertyPath },
                { name: "value", value: Action._SerializeValueAsString(this.value) },
                { name: "duration", value: Action._SerializeValueAsString(this.duration) },
                { name: "stopOtherAnimations", value: Action._SerializeValueAsString(this.stopOtherAnimations) || false },
            ],
        }, parent);
    }
}
RegisterClass("BABYLON.InterpolateValueAction", InterpolateValueAction);
//# sourceMappingURL=interpolateValueAction.js.map