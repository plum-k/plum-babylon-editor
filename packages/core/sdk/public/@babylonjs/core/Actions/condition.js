import { Action } from "./action.js";
import { RegisterClass } from "../Misc/typeStore.js";
/**
 * A Condition applied to an Action
 */
export class Condition {
    /**
     * Creates a new Condition
     * @param actionManager the manager of the action the condition is applied to
     */
    constructor(actionManager) {
        this._actionManager = actionManager;
    }
    /**
     * Check if the current condition is valid
     * @returns a boolean
     */
    isValid() {
        return true;
    }
    /**
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
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Serialize placeholder for child classes
     * @returns the serialized object
     */
    serialize() { }
    /**
     * @internal
     */
    _serialize(serializedCondition) {
        return {
            type: 2, // Condition
            children: [],
            name: serializedCondition.name,
            properties: serializedCondition.properties,
        };
    }
}
/**
 * Defines specific conditional operators as extensions of Condition
 */
export class ValueCondition extends Condition {
    /**
     * returns the number for IsEqual
     */
    static get IsEqual() {
        return ValueCondition._IsEqual;
    }
    /**
     * Returns the number for IsDifferent
     */
    static get IsDifferent() {
        return ValueCondition._IsDifferent;
    }
    /**
     * Returns the number for IsGreater
     */
    static get IsGreater() {
        return ValueCondition._IsGreater;
    }
    /**
     * Returns the number for IsLesser
     */
    static get IsLesser() {
        return ValueCondition._IsLesser;
    }
    /**
     * Creates a new ValueCondition
     * @param actionManager manager for the action the condition applies to
     * @param target for the action
     * @param propertyPath path to specify the property of the target the conditional operator uses
     * @param value the value compared by the conditional operator against the current value of the property
     * @param operator the conditional operator, default ValueCondition.IsEqual
     */
    constructor(actionManager, target, 
    /** path to specify the property of the target the conditional operator uses  */
    propertyPath, 
    /** the value compared by the conditional operator against the current value of the property */
    value, 
    /** [number] the conditional operator, default ValueCondition.IsEqual */
    operator = ValueCondition.IsEqual) {
        super(actionManager);
        this.propertyPath = propertyPath;
        this.value = value;
        this.operator = operator;
        this._target = target;
        this._effectiveTarget = this._getEffectiveTarget(target, this.propertyPath);
        this._property = this._getProperty(this.propertyPath);
    }
    /**
     * Compares the given value with the property value for the specified conditional operator
     * @returns the result of the comparison
     */
    isValid() {
        switch (this.operator) {
            case ValueCondition.IsGreater:
                return this._effectiveTarget[this._property] > this.value;
            case ValueCondition.IsLesser:
                return this._effectiveTarget[this._property] < this.value;
            case ValueCondition.IsEqual:
            case ValueCondition.IsDifferent: {
                let check;
                if (this.value.equals) {
                    check = this.value.equals(this._effectiveTarget[this._property]);
                }
                else {
                    check = this.value === this._effectiveTarget[this._property];
                }
                return this.operator === ValueCondition.IsEqual ? check : !check;
            }
        }
        return false;
    }
    /**
     * Serialize the ValueCondition into a JSON compatible object
     * @returns serialization object
     */
    serialize() {
        return this._serialize({
            name: "ValueCondition",
            properties: [
                Action._GetTargetProperty(this._target),
                { name: "propertyPath", value: this.propertyPath },
                { name: "value", value: Action._SerializeValueAsString(this.value) },
                { name: "operator", value: ValueCondition.GetOperatorName(this.operator) },
            ],
        });
    }
    /**
     * Gets the name of the conditional operator for the ValueCondition
     * @param operator the conditional operator
     * @returns the name
     */
    static GetOperatorName(operator) {
        switch (operator) {
            case ValueCondition._IsEqual:
                return "IsEqual";
            case ValueCondition._IsDifferent:
                return "IsDifferent";
            case ValueCondition._IsGreater:
                return "IsGreater";
            case ValueCondition._IsLesser:
                return "IsLesser";
            default:
                return "";
        }
    }
}
ValueCondition._IsEqual = 0;
ValueCondition._IsDifferent = 1;
ValueCondition._IsGreater = 2;
ValueCondition._IsLesser = 3;
/**
 * Defines a predicate condition as an extension of Condition
 */
export class PredicateCondition extends Condition {
    /**
     * Creates a new PredicateCondition
     * @param actionManager manager for the action the condition applies to
     * @param predicate defines the predicate function used to validate the condition
     */
    constructor(actionManager, 
    /** defines the predicate function used to validate the condition */
    predicate) {
        super(actionManager);
        this.predicate = predicate;
    }
    /**
     * @returns the validity of the predicate condition
     */
    isValid() {
        return this.predicate();
    }
}
/**
 * Defines a state condition as an extension of Condition
 */
export class StateCondition extends Condition {
    /**
     * Creates a new StateCondition
     * @param actionManager manager for the action the condition applies to
     * @param target of the condition
     * @param value to compare with target state
     */
    constructor(actionManager, target, 
    /** Value to compare with target state  */
    value) {
        super(actionManager);
        this.value = value;
        this._target = target;
    }
    /**
     * Gets a boolean indicating if the current condition is met
     * @returns the validity of the state
     */
    isValid() {
        return this._target.state === this.value;
    }
    /**
     * Serialize the StateCondition into a JSON compatible object
     * @returns serialization object
     */
    serialize() {
        return this._serialize({
            name: "StateCondition",
            properties: [Action._GetTargetProperty(this._target), { name: "value", value: this.value }],
        });
    }
}
RegisterClass("BABYLON.ValueCondition", ValueCondition);
RegisterClass("BABYLON.PredicateCondition", PredicateCondition);
RegisterClass("BABYLON.StateCondition", StateCondition);
//# sourceMappingURL=condition.js.map