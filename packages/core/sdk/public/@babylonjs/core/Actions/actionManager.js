import { Vector3, Vector4 } from "../Maths/math.vector.js";
import { Color3, Color4 } from "../Maths/math.color.js";
import { Condition, ValueCondition } from "./condition.js";
import { Action } from "./action.js";
import { DoNothingAction } from "./directActions.js";
import { EngineStore } from "../Engines/engineStore.js";
import { Logger } from "../Misc/logger.js";
import { DeepCopier } from "../Misc/deepCopier.js";
import { GetClass } from "../Misc/typeStore.js";
import { AbstractActionManager } from "./abstractActionManager.js";

/**
 * Action Manager manages all events to be triggered on a given mesh or the global scene.
 * A single scene can have many Action Managers to handle predefined actions on specific meshes.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions
 */
export class ActionManager extends AbstractActionManager {
    /**
     * Creates a new action manager
     * @param scene defines the hosting scene
     */
    constructor(scene) {
        super();
        scene = scene || EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }
        this._scene = scene;
        scene.actionManagers.push(this);
    }
    // Methods
    /**
     * Releases all associated resources
     */
    dispose() {
        const sceneIndex = this._scene.actionManagers.indexOf(this);
        for (let i = 0; i < this.actions.length; i++) {
            const action = this.actions[i];
            ActionManager.Triggers[action.trigger]--;
            if (ActionManager.Triggers[action.trigger] === 0) {
                delete ActionManager.Triggers[action.trigger];
            }
        }
        this.actions.length = 0;
        if (sceneIndex > -1) {
            this._scene.actionManagers.splice(sceneIndex, 1);
        }
        const ownerMeshes = this._scene.meshes.filter((m) => m.actionManager === this);
        for (const ownerMesh of ownerMeshes) {
            ownerMesh.actionManager = null;
        }
    }
    /**
     * Gets hosting scene
     * @returns the hosting scene
     */
    getScene() {
        return this._scene;
    }
    /**
     * Does this action manager handles actions of any of the given triggers
     * @param triggers defines the triggers to be tested
     * @returns a boolean indicating whether one (or more) of the triggers is handled
     */
    hasSpecificTriggers(triggers) {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];
            if (triggers.indexOf(action.trigger) > -1) {
                return true;
            }
        }
        return false;
    }
    /**
     * Does this action manager handles actions of any of the given triggers. This function takes two arguments for
     * speed.
     * @param triggerA defines the trigger to be tested
     * @param triggerB defines the trigger to be tested
     * @returns a boolean indicating whether one (or more) of the triggers is handled
     */
    hasSpecificTriggers2(triggerA, triggerB) {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];
            if (triggerA == action.trigger || triggerB == action.trigger) {
                return true;
            }
        }
        return false;
    }
    /**
     * Does this action manager handles actions of a given trigger
     * @param trigger defines the trigger to be tested
     * @param parameterPredicate defines an optional predicate to filter triggers by parameter
     * @returns whether the trigger is handled
     */
    hasSpecificTrigger(trigger, parameterPredicate) {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];
            if (action.trigger === trigger) {
                if (parameterPredicate) {
                    if (parameterPredicate(action.getTriggerParameter())) {
                        return true;
                    }
                }
                else {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Does this action manager has pointer triggers
     */
    get hasPointerTriggers() {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];
            if (action.trigger >= ActionManager.OnPickTrigger && action.trigger <= ActionManager.OnPointerOutTrigger) {
                return true;
            }
        }
        return false;
    }
    /**
     * Does this action manager has pick triggers
     */
    get hasPickTriggers() {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];
            if (action.trigger >= ActionManager.OnPickTrigger && action.trigger <= ActionManager.OnPickUpTrigger) {
                return true;
            }
        }
        return false;
    }
    /**
     * Registers an action to this action manager
     * @param action defines the action to be registered
     * @returns the action amended (prepared) after registration
     */
    registerAction(action) {
        if (action.trigger === ActionManager.OnEveryFrameTrigger) {
            if (this.getScene().actionManager !== this) {
                Logger.Warn("OnEveryFrameTrigger can only be used with scene.actionManager");
                return null;
            }
        }
        this.actions.push(action);
        this.getScene()._registeredActions++;
        if (ActionManager.Triggers[action.trigger]) {
            ActionManager.Triggers[action.trigger]++;
        }
        else {
            ActionManager.Triggers[action.trigger] = 1;
        }
        action._actionManager = this;
        action._prepare();
        return action;
    }
    /**
     * Unregisters an action to this action manager
     * @param action defines the action to be unregistered
     * @returns a boolean indicating whether the action has been unregistered
     */
    unregisterAction(action) {
        const index = this.actions.indexOf(action);
        if (index !== -1) {
            this.actions.splice(index, 1);
            ActionManager.Triggers[action.trigger] -= 1;
            if (ActionManager.Triggers[action.trigger] === 0) {
                delete ActionManager.Triggers[action.trigger];
            }
            action._actionManager = null;
            this.getScene()._registeredActions--;
            return true;
        }
        return false;
    }
    /**
     * Process a specific trigger
     * @param trigger defines the trigger to process
     * @param evt defines the event details to be processed
     */
    processTrigger(trigger, evt) {
        for (let index = 0; index < this.actions.length; index++) {
            const action = this.actions[index];
            if (action.trigger === trigger) {
                if (evt) {
                    if (trigger === ActionManager.OnKeyUpTrigger || trigger === ActionManager.OnKeyDownTrigger) {
                        const parameter = action.getTriggerParameter();
                        if (typeof parameter === "function") {
                            if (!parameter(evt)) {
                                continue;
                            }
                        }
                        else if (parameter && parameter !== evt.sourceEvent.keyCode) {
                            if (!parameter.toLowerCase) {
                                continue;
                            }
                            const lowerCase = parameter.toLowerCase();
                            if (lowerCase !== evt.sourceEvent.key) {
                                const unicode = evt.sourceEvent.charCode ? evt.sourceEvent.charCode : evt.sourceEvent.keyCode;
                                const actualkey = String.fromCharCode(unicode).toLowerCase();
                                if (actualkey !== lowerCase) {
                                    continue;
                                }
                            }
                        }
                    }
                }
                action._executeCurrent(evt);
            }
        }
    }
    /**
     * @internal
     */
    _getEffectiveTarget(target, propertyPath) {
        const properties = propertyPath.split(".");
        for (let index = 0; index < properties.length - 1; index++) {
            target = target[properties[index]];
        }
        return target;
    }
    /**
     * @internal
     */
    _getProperty(propertyPath) {
        const properties = propertyPath.split(".");
        return properties[properties.length - 1];
    }
    /**
     * Serialize this manager to a JSON object
     * @param name defines the property name to store this manager
     * @returns a JSON representation of this manager
     */
    serialize(name) {
        const root = {
            children: new Array(),
            name: name,
            type: 3, // Root node
            properties: new Array(), // Empty for root but required
        };
        for (let i = 0; i < this.actions.length; i++) {
            const triggerObject = {
                type: 0, // Trigger
                children: new Array(),
                name: ActionManager.GetTriggerName(this.actions[i].trigger),
                properties: new Array(),
            };
            const triggerOptions = this.actions[i].triggerOptions;
            if (triggerOptions && typeof triggerOptions !== "number") {
                if (triggerOptions.parameter instanceof Node) {
                    triggerObject.properties.push(Action._GetTargetProperty(triggerOptions.parameter));
                }
                else if (typeof triggerOptions.parameter === "object") {
                    const parameter = {};
                    DeepCopier.DeepCopy(triggerOptions.parameter, parameter, ["mesh"]);
                    if (triggerOptions.parameter && triggerOptions.parameter.mesh) {
                        parameter._meshId = triggerOptions.parameter.mesh.id;
                    }
                    triggerObject.properties.push({ name: "parameter", targetType: null, value: parameter });
                }
                else {
                    triggerObject.properties.push({ name: "parameter", targetType: null, value: triggerOptions.parameter });
                }
            }
            // Serialize child action, recursively
            this.actions[i].serialize(triggerObject);
            // Add serialized trigger
            root.children.push(triggerObject);
        }
        return root;
    }
    /**
     * Creates a new ActionManager from a JSON data
     * @param parsedActions defines the JSON data to read from
     * @param object defines the hosting mesh
     * @param scene defines the hosting scene
     */
    static Parse(parsedActions, object, scene) {
        const actionManager = new ActionManager(scene);
        if (object === null) {
            scene.actionManager = actionManager;
        }
        else {
            object.actionManager = actionManager;
        }
        // instantiate a new object
        const instantiate = (name, params) => {
            const internalClassType = GetClass("BABYLON." + name);
            return internalClassType && new internalClassType(...params);
        };
        const parseParameter = (name, value, target, propertyPath) => {
            if (propertyPath === null) {
                // String, boolean or float
                const floatValue = parseFloat(value);
                if (value === "true" || value === "false") {
                    return value === "true";
                }
                else {
                    return isNaN(floatValue) ? value : floatValue;
                }
            }
            const effectiveTarget = propertyPath.split(".");
            const values = value.split(",");
            // Get effective Target
            for (let i = 0; i < effectiveTarget.length; i++) {
                target = target[effectiveTarget[i]];
            }
            // Return appropriate value with its type
            if (typeof target === "boolean") {
                return values[0] === "true";
            }
            if (typeof target === "string") {
                return values[0];
            }
            // Parameters with multiple values such as Vector3 etc.
            const split = [];
            for (let i = 0; i < values.length; i++) {
                split.push(parseFloat(values[i]));
            }
            if (target instanceof Vector3) {
                return Vector3.FromArray(split);
            }
            if (target instanceof Vector4) {
                return Vector4.FromArray(split);
            }
            if (target instanceof Color3) {
                return Color3.FromArray(split);
            }
            if (target instanceof Color4) {
                return Color4.FromArray(split);
            }
            return parseFloat(values[0]);
        };
        // traverse graph per trigger
        const traverse = (parsedAction, trigger, condition, action, combineArray = null) => {
            if (parsedAction.detached) {
                return;
            }
            const parameters = [];
            let target = null;
            let propertyPath = null;
            const combine = parsedAction.combine && parsedAction.combine.length > 0;
            // Parameters
            if (parsedAction.type === 2) {
                parameters.push(actionManager);
            }
            else {
                parameters.push(trigger);
            }
            if (combine) {
                const actions = [];
                for (let j = 0; j < parsedAction.combine.length; j++) {
                    traverse(parsedAction.combine[j], ActionManager.NothingTrigger, condition, action, actions);
                }
                parameters.push(actions);
            }
            else {
                for (let i = 0; i < parsedAction.properties.length; i++) {
                    let value = parsedAction.properties[i].value;
                    const name = parsedAction.properties[i].name;
                    const targetType = parsedAction.properties[i].targetType;
                    if (name === "target") {
                        if (targetType === "SceneProperties") {
                            value = target = scene;
                        }
                        else if (targetType === "MaterialProperties") {
                            value = target = scene.getMaterialByName(value);
                        }
                        else {
                            value = target = scene.getNodeByName(value);
                        }
                    }
                    else if (name === "parent") {
                        value = scene.getNodeByName(value);
                    }
                    else if (name === "sound") {
                        // Can not externalize to component, so only checks for the presence off the API.
                        if (scene.getSoundByName) {
                            value = scene.getSoundByName(value);
                        }
                    }
                    else if (name !== "propertyPath") {
                        if (parsedAction.type === 2 && name === "operator") {
                            value = ValueCondition[value];
                        }
                        else {
                            value = parseParameter(name, value, target, name === "value" ? propertyPath : null);
                        }
                    }
                    else {
                        propertyPath = value;
                    }
                    parameters.push(value);
                }
            }
            if (combineArray === null) {
                parameters.push(condition);
            }
            else {
                parameters.push(null);
            }
            // If interpolate value action
            if (parsedAction.name === "InterpolateValueAction") {
                const param = parameters[parameters.length - 2];
                parameters[parameters.length - 1] = param;
                parameters[parameters.length - 2] = condition;
            }
            // Action or condition(s) and not CombineAction
            let newAction = instantiate(parsedAction.name, parameters);
            if (newAction instanceof Condition && condition !== null) {
                const nothing = new DoNothingAction(trigger, condition);
                if (action) {
                    action.then(nothing);
                }
                else {
                    actionManager.registerAction(nothing);
                }
                action = nothing;
            }
            if (combineArray === null) {
                if (newAction instanceof Condition) {
                    condition = newAction;
                    newAction = action;
                }
                else {
                    condition = null;
                    if (action) {
                        action.then(newAction);
                    }
                    else {
                        actionManager.registerAction(newAction);
                    }
                }
            }
            else {
                combineArray.push(newAction);
            }
            for (let i = 0; i < parsedAction.children.length; i++) {
                traverse(parsedAction.children[i], trigger, condition, newAction, null);
            }
        };
        // triggers
        for (let i = 0; i < parsedActions.children.length; i++) {
            let triggerParams;
            const trigger = parsedActions.children[i];
            if (trigger.properties.length > 0) {
                const param = trigger.properties[0].value;
                const value = trigger.properties[0].targetType === null ? param : scene.getMeshByName(param);
                if (value._meshId) {
                    value.mesh = scene.getMeshById(value._meshId);
                }
                triggerParams = { trigger: ActionManager[trigger.name], parameter: value };
            }
            else {
                triggerParams = ActionManager[trigger.name];
            }
            for (let j = 0; j < trigger.children.length; j++) {
                if (!trigger.detached) {
                    traverse(trigger.children[j], triggerParams, null, null);
                }
            }
        }
    }
    /**
     * Get a trigger name by index
     * @param trigger defines the trigger index
     * @returns a trigger name
     */
    static GetTriggerName(trigger) {
        switch (trigger) {
            case 0:
                return "NothingTrigger";
            case 1:
                return "OnPickTrigger";
            case 2:
                return "OnLeftPickTrigger";
            case 3:
                return "OnRightPickTrigger";
            case 4:
                return "OnCenterPickTrigger";
            case 5:
                return "OnPickDownTrigger";
            case 6:
                return "OnDoublePickTrigger"; // start;
            case 7:
                return "OnPickUpTrigger";
            case 8:
                return "OnLongPressTrigger";
            case 9:
                return "OnPointerOverTrigger";
            case 10:
                return "OnPointerOutTrigger";
            case 11:
                return "OnEveryFrameTrigger";
            case 12:
                return "OnIntersectionEnterTrigger";
            case 13:
                return "OnIntersectionExitTrigger";
            case 14:
                return "OnKeyDownTrigger";
            case 15:
                return "OnKeyUpTrigger";
            case 16:
                return "OnPickOutTrigger";
            default:
                return "";
        }
    }
}
/**
 * Nothing
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.NothingTrigger = 0;
/**
 * On pick
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnPickTrigger = 1;
/**
 * On left pick
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnLeftPickTrigger = 2;
/**
 * On right pick
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnRightPickTrigger = 3;
/**
 * On center pick
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnCenterPickTrigger = 4;
/**
 * On pick down
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnPickDownTrigger = 5;
/**
 * On double pick
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnDoublePickTrigger = 6;
/**
 * On pick up
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnPickUpTrigger = 7;
/**
 * On pick out.
 * This trigger will only be raised if you also declared a OnPickDown
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnPickOutTrigger = 16;
/**
 * On long press
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnLongPressTrigger = 8;
/**
 * On pointer over
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnPointerOverTrigger = 9;
/**
 * On pointer out
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnPointerOutTrigger = 10;
/**
 * On every frame
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnEveryFrameTrigger = 11;
/**
 * On intersection enter
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnIntersectionEnterTrigger = 12;
/**
 * On intersection exit
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnIntersectionExitTrigger = 13;
/**
 * On key down
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnKeyDownTrigger = 14;
/**
 * On key up
 * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions#triggers
 */
ActionManager.OnKeyUpTrigger = 15;
//# sourceMappingURL=actionManager.js.map