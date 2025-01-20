import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock.js";
import { RichTypeAny, RichTypeNumber, RichTypeBoolean } from "../../../flowGraphRichTypes.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { FlowGraphPathConverterComponent } from "../../../flowGraphPathConverterComponent.js";
/**
 * @experimental
 * A block that plays an animation on an animatable object.
 */
export class FlowGraphPlayAnimationBlock extends FlowGraphAsyncExecutionBlock {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        this.templateTargetComponent = new FlowGraphPathConverterComponent(config.targetPath, this);
        this.templateAnimationComponent = new FlowGraphPathConverterComponent(config.animationPath, this);
        this.speed = this.registerDataInput("speed", RichTypeNumber);
        this.loop = this.registerDataInput("loop", RichTypeBoolean);
        this.from = this.registerDataInput("from", RichTypeNumber);
        this.to = this.registerDataInput("to", RichTypeNumber);
        this.runningAnimatable = this.registerDataOutput("runningAnimatable", RichTypeAny);
    }
    /**
     * @internal
     * @param context
     */
    _preparePendingTasks(context) {
        const targetAccessor = this.templateTargetComponent.getAccessor(this.config.pathConverter, context);
        const targetValue = targetAccessor.info.getObject(targetAccessor.object);
        const animationAccessor = this.templateAnimationComponent.getAccessor(this.config.pathConverter, context);
        const animationValue = animationAccessor.info.get(animationAccessor.object);
        if (!targetValue || !animationValue) {
            throw new Error("Cannot play animation without target or animation");
        }
        const contextAnimatables = context._getExecutionVariable(this, "runningAnimatables") ?? [];
        // was an animation started on this target already and was just paused? if so, we can unpause it.
        const existingAnimatable = this.runningAnimatable.getValue(context);
        if (existingAnimatable && existingAnimatable.paused) {
            existingAnimatable.restart();
        }
        else {
            const scene = context.configuration.scene;
            const animatable = scene.beginDirectAnimation(targetValue, [animationValue], this.from.getValue(context), this.to.getValue(context), this.loop.getValue(context), this.speed.getValue(context), () => this._onAnimationEnd(animatable, context));
            this.runningAnimatable.setValue(animatable, context);
            contextAnimatables.push(animatable);
        }
        context._setExecutionVariable(this, "runningAnimatables", contextAnimatables);
    }
    _execute(context) {
        this._startPendingTasks(context);
        this.out._activateSignal(context);
    }
    _onAnimationEnd(animatable, context) {
        const contextAnims = context._getExecutionVariable(this, "runningAnimatables") ?? [];
        const index = contextAnims.indexOf(animatable);
        if (index !== -1) {
            contextAnims.splice(index, 1);
        }
        context._removePendingBlock(this);
        this.done._activateSignal(context);
    }
    /**
     * @internal
     * Stop any currently running animations.
     */
    _cancelPendingTasks(context) {
        const contextAnims = context._getExecutionVariable(this, "runningAnimatables") ?? [];
        for (const anim of contextAnims) {
            anim.stop();
        }
        context._deleteExecutionVariable(this, "runningAnimatables");
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphPlayAnimationBlock.ClassName;
    }
    /**
     * Serializes the block to a JSON object.
     * @param serializationObject the object to serialize to.
     */
    serialize(serializationObject = {}) {
        super.serialize(serializationObject);
        serializationObject.config.targetPath = this.config.targetPath;
        serializationObject.config.animationPath = this.config.animationPath;
    }
}
/**
 * Class name of the block.
 */
FlowGraphPlayAnimationBlock.ClassName = "FGPlayAnimationBlock";
RegisterClass(FlowGraphPlayAnimationBlock.ClassName, FlowGraphPlayAnimationBlock);
//# sourceMappingURL=flowGraphPlayAnimationBlock.js.map