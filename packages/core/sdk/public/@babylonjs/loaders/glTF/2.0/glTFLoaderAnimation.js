import { Animation } from "@babylonjs/core/Animations/animation.js";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
/** @internal */
export function getVector3(_target, source, offset, scale) {
    return Vector3.FromArray(source, offset).scaleInPlace(scale);
}
/** @internal */
export function getQuaternion(_target, source, offset, scale) {
    return Quaternion.FromArray(source, offset).scaleInPlace(scale);
}
/** @internal */
export function getWeights(target, source, offset, scale) {
    const value = new Array(target._numMorphTargets);
    for (let i = 0; i < value.length; i++) {
        value[i] = source[offset++] * scale;
    }
    return value;
}
/** @internal */
export class AnimationPropertyInfo {
    /** @internal */
    constructor(type, name, getValue, getStride) {
        this.type = type;
        this.name = name;
        this.getValue = getValue;
        this.getStride = getStride;
    }
    _buildAnimation(name, fps, keys) {
        const babylonAnimation = new Animation(name, this.name, fps, this.type);
        babylonAnimation.setKeys(keys);
        return babylonAnimation;
    }
}
/** @internal */
export class TransformNodeAnimationPropertyInfo extends AnimationPropertyInfo {
    /** @internal */
    buildAnimations(target, name, fps, keys, callback) {
        callback(target._babylonTransformNode, this._buildAnimation(name, fps, keys));
    }
}
/** @internal */
export class WeightAnimationPropertyInfo extends AnimationPropertyInfo {
    buildAnimations(target, name, fps, keys, callback) {
        if (target._numMorphTargets) {
            for (let targetIndex = 0; targetIndex < target._numMorphTargets; targetIndex++) {
                const babylonAnimation = new Animation(`${name}_${targetIndex}`, this.name, fps, this.type);
                babylonAnimation.setKeys(keys.map((key) => ({
                    frame: key.frame,
                    inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                    value: key.value[targetIndex],
                    outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined,
                    interpolation: key.interpolation,
                })));
                if (target._primitiveBabylonMeshes) {
                    for (const babylonMesh of target._primitiveBabylonMeshes) {
                        if (babylonMesh.morphTargetManager) {
                            const morphTarget = babylonMesh.morphTargetManager.getTarget(targetIndex);
                            const babylonAnimationClone = babylonAnimation.clone();
                            morphTarget.animations.push(babylonAnimationClone);
                            callback(morphTarget, babylonAnimationClone);
                        }
                    }
                }
            }
        }
    }
}
/** @internal */
export const nodeAnimationData = {
    translation: [new TransformNodeAnimationPropertyInfo(Animation.ANIMATIONTYPE_VECTOR3, "position", getVector3, () => 3)],
    rotation: [new TransformNodeAnimationPropertyInfo(Animation.ANIMATIONTYPE_QUATERNION, "rotationQuaternion", getQuaternion, () => 4)],
    scale: [new TransformNodeAnimationPropertyInfo(Animation.ANIMATIONTYPE_VECTOR3, "scaling", getVector3, () => 3)],
    weights: [new WeightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "influence", getWeights, (target) => target._numMorphTargets)],
};
//# sourceMappingURL=glTFLoaderAnimation.js.map