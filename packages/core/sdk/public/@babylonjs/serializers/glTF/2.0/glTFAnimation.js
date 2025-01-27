import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import { Tools } from "@babylonjs/core/Misc/tools.js";
import { Animation } from "@babylonjs/core/Animations/animation.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { MorphTarget } from "@babylonjs/core/Morph/morphTarget.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Camera } from "@babylonjs/core/Cameras/camera.js";
import { Light } from "@babylonjs/core/Lights/light.js";
import { GetAccessorElementCount, ConvertToRightHandedPosition, ConvertCameraRotationToGLTF, ConvertToRightHandedRotation } from "./glTFUtilities.js";
/**
 * @internal
 * Enum for handling in tangent and out tangent.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
var _TangentType;
(function (_TangentType) {
    /**
     * Specifies that input tangents are used.
     */
    _TangentType[_TangentType["INTANGENT"] = 0] = "INTANGENT";
    /**
     * Specifies that output tangents are used.
     */
    _TangentType[_TangentType["OUTTANGENT"] = 1] = "OUTTANGENT";
})(_TangentType || (_TangentType = {}));
/**
 * @internal
 * Utility class for generating glTF animation data from BabylonJS.
 */
export class _GLTFAnimation {
    /**
     * Determine if a node is transformable - ie has properties it should be part of animation of transformation.
     * @param babylonNode the node to test
     * @returns true if can be animated, false otherwise. False if the parameter is null or undefined.
     */
    static _IsTransformable(babylonNode) {
        return babylonNode && (babylonNode instanceof TransformNode || babylonNode instanceof Camera || babylonNode instanceof Light);
    }
    /**
     * @ignore
     *
     * Creates glTF channel animation from BabylonJS animation.
     * @param babylonTransformNode - BabylonJS mesh.
     * @param animation - animation.
     * @param animationChannelTargetPath - The target animation channel.
     * @param useQuaternion - Specifies if quaternions are used.
     * @returns nullable IAnimationData
     */
    static _CreateNodeAnimation(babylonTransformNode, animation, animationChannelTargetPath, useQuaternion, animationSampleRate) {
        if (this._IsTransformable(babylonTransformNode)) {
            const inputs = [];
            const outputs = [];
            const keyFrames = animation.getKeys();
            const minMaxKeyFrames = _GLTFAnimation._CalculateMinMaxKeyFrames(keyFrames);
            const interpolationOrBake = _GLTFAnimation._DeduceInterpolation(keyFrames, animationChannelTargetPath, useQuaternion);
            const interpolation = interpolationOrBake.interpolationType;
            const shouldBakeAnimation = interpolationOrBake.shouldBakeAnimation;
            if (shouldBakeAnimation) {
                _GLTFAnimation._CreateBakedAnimation(babylonTransformNode, animation, animationChannelTargetPath, minMaxKeyFrames.min, minMaxKeyFrames.max, animation.framePerSecond, animationSampleRate, inputs, outputs, minMaxKeyFrames, useQuaternion);
            }
            else {
                if (interpolation === "LINEAR" /* AnimationSamplerInterpolation.LINEAR */ || interpolation === "STEP" /* AnimationSamplerInterpolation.STEP */) {
                    _GLTFAnimation._CreateLinearOrStepAnimation(babylonTransformNode, animation, animationChannelTargetPath, inputs, outputs, useQuaternion);
                }
                else if (interpolation === "CUBICSPLINE" /* AnimationSamplerInterpolation.CUBICSPLINE */) {
                    _GLTFAnimation._CreateCubicSplineAnimation(babylonTransformNode, animation, animationChannelTargetPath, inputs, outputs, useQuaternion);
                }
                else {
                    _GLTFAnimation._CreateBakedAnimation(babylonTransformNode, animation, animationChannelTargetPath, minMaxKeyFrames.min, minMaxKeyFrames.max, animation.framePerSecond, animationSampleRate, inputs, outputs, minMaxKeyFrames, useQuaternion);
                }
            }
            if (inputs.length && outputs.length) {
                const result = {
                    inputs: inputs,
                    outputs: outputs,
                    samplerInterpolation: interpolation,
                    inputsMin: shouldBakeAnimation ? minMaxKeyFrames.min : Tools.FloatRound(minMaxKeyFrames.min / animation.framePerSecond),
                    inputsMax: shouldBakeAnimation ? minMaxKeyFrames.max : Tools.FloatRound(minMaxKeyFrames.max / animation.framePerSecond),
                };
                return result;
            }
        }
        return null;
    }
    static _DeduceAnimationInfo(animation) {
        let animationChannelTargetPath = null;
        let dataAccessorType = "VEC3" /* AccessorType.VEC3 */;
        let useQuaternion = false;
        const property = animation.targetProperty.split(".");
        switch (property[0]) {
            case "scaling": {
                animationChannelTargetPath = "scale" /* AnimationChannelTargetPath.SCALE */;
                break;
            }
            case "position": {
                animationChannelTargetPath = "translation" /* AnimationChannelTargetPath.TRANSLATION */;
                break;
            }
            case "rotation": {
                dataAccessorType = "VEC4" /* AccessorType.VEC4 */;
                animationChannelTargetPath = "rotation" /* AnimationChannelTargetPath.ROTATION */;
                break;
            }
            case "rotationQuaternion": {
                dataAccessorType = "VEC4" /* AccessorType.VEC4 */;
                useQuaternion = true;
                animationChannelTargetPath = "rotation" /* AnimationChannelTargetPath.ROTATION */;
                break;
            }
            case "influence": {
                dataAccessorType = "SCALAR" /* AccessorType.SCALAR */;
                animationChannelTargetPath = "weights" /* AnimationChannelTargetPath.WEIGHTS */;
                break;
            }
            default: {
                Tools.Error(`Unsupported animatable property ${property[0]}`);
            }
        }
        if (animationChannelTargetPath) {
            return { animationChannelTargetPath: animationChannelTargetPath, dataAccessorType: dataAccessorType, useQuaternion: useQuaternion };
        }
        else {
            Tools.Error("animation channel target path and data accessor type could be deduced");
        }
        return null;
    }
    /**
     * @ignore
     * Create node animations from the transform node animations
     * @param babylonNode
     * @param runtimeGLTFAnimation
     * @param idleGLTFAnimations
     * @param nodeMap
     * @param nodes
     * @param bufferManager
     * @param bufferViews
     * @param accessors
     * @param animationSampleRate
     */
    static _CreateNodeAnimationFromNodeAnimations(babylonNode, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, nodes, bufferManager, bufferViews, accessors, animationSampleRate, useRightHanded, shouldExportAnimation) {
        let glTFAnimation;
        if (_GLTFAnimation._IsTransformable(babylonNode)) {
            if (babylonNode.animations) {
                for (const animation of babylonNode.animations) {
                    if (shouldExportAnimation && !shouldExportAnimation(animation)) {
                        continue;
                    }
                    const animationInfo = _GLTFAnimation._DeduceAnimationInfo(animation);
                    if (animationInfo) {
                        glTFAnimation = {
                            name: animation.name,
                            samplers: [],
                            channels: [],
                        };
                        _GLTFAnimation._AddAnimation(`${animation.name}`, animation.hasRunningRuntimeAnimations ? runtimeGLTFAnimation : glTFAnimation, babylonNode, animation, animationInfo.dataAccessorType, animationInfo.animationChannelTargetPath, nodeMap, bufferManager, bufferViews, accessors, animationInfo.useQuaternion, animationSampleRate, useRightHanded);
                        if (glTFAnimation.samplers.length && glTFAnimation.channels.length) {
                            idleGLTFAnimations.push(glTFAnimation);
                        }
                    }
                }
            }
        }
    }
    /**
     * @ignore
     * Create individual morph animations from the mesh's morph target animation tracks
     * @param babylonNode
     * @param runtimeGLTFAnimation
     * @param idleGLTFAnimations
     * @param nodeMap
     * @param nodes
     * @param bufferManager
     * @param bufferViews
     * @param accessors
     * @param animationSampleRate
     */
    static _CreateMorphTargetAnimationFromMorphTargetAnimations(babylonNode, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, nodes, bufferManager, bufferViews, accessors, animationSampleRate, useRightHanded, shouldExportAnimation) {
        let glTFAnimation;
        if (babylonNode instanceof Mesh) {
            const morphTargetManager = babylonNode.morphTargetManager;
            if (morphTargetManager) {
                for (let i = 0; i < morphTargetManager.numTargets; ++i) {
                    const morphTarget = morphTargetManager.getTarget(i);
                    for (const animation of morphTarget.animations) {
                        if (shouldExportAnimation && !shouldExportAnimation(animation)) {
                            continue;
                        }
                        const combinedAnimation = new Animation(`${animation.name}`, "influence", animation.framePerSecond, animation.dataType, animation.loopMode, animation.enableBlending);
                        const combinedAnimationKeys = [];
                        const animationKeys = animation.getKeys();
                        for (let j = 0; j < animationKeys.length; ++j) {
                            const animationKey = animationKeys[j];
                            for (let k = 0; k < morphTargetManager.numTargets; ++k) {
                                if (k == i) {
                                    combinedAnimationKeys.push(animationKey);
                                }
                                else {
                                    combinedAnimationKeys.push({ frame: animationKey.frame, value: 0 });
                                }
                            }
                        }
                        combinedAnimation.setKeys(combinedAnimationKeys);
                        const animationInfo = _GLTFAnimation._DeduceAnimationInfo(combinedAnimation);
                        if (animationInfo) {
                            glTFAnimation = {
                                name: combinedAnimation.name,
                                samplers: [],
                                channels: [],
                            };
                            _GLTFAnimation._AddAnimation(animation.name, animation.hasRunningRuntimeAnimations ? runtimeGLTFAnimation : glTFAnimation, babylonNode, combinedAnimation, animationInfo.dataAccessorType, animationInfo.animationChannelTargetPath, nodeMap, bufferManager, bufferViews, accessors, animationInfo.useQuaternion, animationSampleRate, useRightHanded, morphTargetManager.numTargets);
                            if (glTFAnimation.samplers.length && glTFAnimation.channels.length) {
                                idleGLTFAnimations.push(glTFAnimation);
                            }
                        }
                    }
                }
            }
        }
    }
    /**
     * @internal
     * Create node and morph animations from the animation groups
     * @param babylonScene
     * @param glTFAnimations
     * @param nodeMap
     * @param nodes
     * @param bufferManager
     * @param bufferViews
     * @param accessors
     * @param animationSampleRate
     */
    static _CreateNodeAndMorphAnimationFromAnimationGroups(babylonScene, glTFAnimations, nodeMap, bufferManager, bufferViews, accessors, animationSampleRate, leftHandedNodes, shouldExportAnimation) {
        let glTFAnimation;
        if (babylonScene.animationGroups) {
            const animationGroups = babylonScene.animationGroups;
            for (const animationGroup of animationGroups) {
                const morphAnimations = new Map();
                const sampleAnimations = new Map();
                const morphAnimationMeshes = new Set();
                const animationGroupFrameDiff = animationGroup.to - animationGroup.from;
                glTFAnimation = {
                    name: animationGroup.name,
                    channels: [],
                    samplers: [],
                };
                for (let i = 0; i < animationGroup.targetedAnimations.length; ++i) {
                    const targetAnimation = animationGroup.targetedAnimations[i];
                    const target = targetAnimation.target;
                    const animation = targetAnimation.animation;
                    if (shouldExportAnimation && !shouldExportAnimation(animation)) {
                        continue;
                    }
                    const convertToRightHanded = leftHandedNodes.has(target);
                    if (this._IsTransformable(target) || (target.length === 1 && this._IsTransformable(target[0]))) {
                        const animationInfo = _GLTFAnimation._DeduceAnimationInfo(targetAnimation.animation);
                        if (animationInfo) {
                            const babylonTransformNode = this._IsTransformable(target) ? target : this._IsTransformable(target[0]) ? target[0] : null;
                            if (babylonTransformNode) {
                                _GLTFAnimation._AddAnimation(`${animation.name}`, glTFAnimation, babylonTransformNode, animation, animationInfo.dataAccessorType, animationInfo.animationChannelTargetPath, nodeMap, bufferManager, bufferViews, accessors, animationInfo.useQuaternion, animationSampleRate, convertToRightHanded);
                            }
                        }
                    }
                    else if (target instanceof MorphTarget || (target.length === 1 && target[0] instanceof MorphTarget)) {
                        const animationInfo = _GLTFAnimation._DeduceAnimationInfo(targetAnimation.animation);
                        if (animationInfo) {
                            const babylonMorphTarget = target instanceof MorphTarget ? target : target[0];
                            if (babylonMorphTarget) {
                                const babylonMorphTargetManager = babylonScene.morphTargetManagers.find((morphTargetManager) => {
                                    for (let j = 0; j < morphTargetManager.numTargets; ++j) {
                                        if (morphTargetManager.getTarget(j) === babylonMorphTarget) {
                                            return true;
                                        }
                                    }
                                    return false;
                                });
                                if (babylonMorphTargetManager) {
                                    const babylonMesh = babylonScene.meshes.find((mesh) => {
                                        return mesh.morphTargetManager === babylonMorphTargetManager;
                                    });
                                    if (babylonMesh) {
                                        if (!morphAnimations.has(babylonMesh)) {
                                            morphAnimations.set(babylonMesh, new Map());
                                        }
                                        morphAnimations.get(babylonMesh)?.set(babylonMorphTarget, animation);
                                        morphAnimationMeshes.add(babylonMesh);
                                        sampleAnimations.set(babylonMesh, animation);
                                    }
                                }
                            }
                        }
                    }
                    else {
                        // this is the place for the KHR_animation_pointer.
                    }
                }
                morphAnimationMeshes.forEach((mesh) => {
                    const morphTargetManager = mesh.morphTargetManager;
                    let combinedAnimationGroup = null;
                    const animationKeys = [];
                    const sampleAnimation = sampleAnimations.get(mesh);
                    const sampleAnimationKeys = sampleAnimation.getKeys();
                    const numAnimationKeys = sampleAnimationKeys.length;
                    /*
                        Due to how glTF expects morph target animation data to be formatted, we need to rearrange the individual morph target animation tracks,
                        such that we have a single animation, where a given keyframe input value has successive output values for each morph target belonging to the manager.
                        See: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations

                        We do this via constructing a new Animation track, and interleaving the frames of each morph target animation track in the current Animation Group
                        We reuse the Babylon Animation data structure for ease of handling export of cubic spline animation keys, and to reuse the
                        existing _GLTFAnimation.AddAnimation codepath with minimal modification, however the constructed Babylon Animation is NOT intended for use in-engine.
                    */
                    for (let i = 0; i < numAnimationKeys; ++i) {
                        for (let j = 0; j < morphTargetManager.numTargets; ++j) {
                            const morphTarget = morphTargetManager.getTarget(j);
                            const animationsByMorphTarget = morphAnimations.get(mesh);
                            if (animationsByMorphTarget) {
                                const morphTargetAnimation = animationsByMorphTarget.get(morphTarget);
                                if (morphTargetAnimation) {
                                    if (!combinedAnimationGroup) {
                                        combinedAnimationGroup = new Animation(`${animationGroup.name}_${mesh.name}_MorphWeightAnimation`, "influence", morphTargetAnimation.framePerSecond, Animation.ANIMATIONTYPE_FLOAT, morphTargetAnimation.loopMode, morphTargetAnimation.enableBlending);
                                    }
                                    animationKeys.push(morphTargetAnimation.getKeys()[i]);
                                }
                                else {
                                    animationKeys.push({
                                        frame: animationGroup.from + (animationGroupFrameDiff / numAnimationKeys) * i,
                                        value: morphTarget.influence,
                                        inTangent: sampleAnimationKeys[0].inTangent ? 0 : undefined,
                                        outTangent: sampleAnimationKeys[0].outTangent ? 0 : undefined,
                                    });
                                }
                            }
                        }
                    }
                    combinedAnimationGroup.setKeys(animationKeys);
                    const animationInfo = _GLTFAnimation._DeduceAnimationInfo(combinedAnimationGroup);
                    if (animationInfo) {
                        _GLTFAnimation._AddAnimation(`${animationGroup.name}_${mesh.name}_MorphWeightAnimation`, glTFAnimation, mesh, combinedAnimationGroup, animationInfo.dataAccessorType, animationInfo.animationChannelTargetPath, nodeMap, bufferManager, bufferViews, accessors, animationInfo.useQuaternion, animationSampleRate, false, morphTargetManager?.numTargets);
                    }
                });
                if (glTFAnimation.channels.length && glTFAnimation.samplers.length) {
                    glTFAnimations.push(glTFAnimation);
                }
            }
        }
    }
    static _AddAnimation(name, glTFAnimation, babylonTransformNode, animation, dataAccessorType, animationChannelTargetPath, nodeMap, bufferManager, bufferViews, accessors, useQuaternion, animationSampleRate, convertToRightHanded, morphAnimationChannels) {
        const animationData = _GLTFAnimation._CreateNodeAnimation(babylonTransformNode, animation, animationChannelTargetPath, useQuaternion, animationSampleRate);
        let bufferView;
        let accessor;
        let keyframeAccessorIndex;
        let dataAccessorIndex;
        let animationSampler;
        let animationChannel;
        if (animationData) {
            /*
             * Now that we have the glTF converted morph target animation data,
             * we can remove redundant input data so that we have n input frames,
             * and morphAnimationChannels * n output frames
             */
            if (morphAnimationChannels) {
                let index = 0;
                let currentInput = 0;
                const newInputs = [];
                while (animationData.inputs.length > 0) {
                    currentInput = animationData.inputs.shift();
                    if (index % morphAnimationChannels == 0) {
                        newInputs.push(currentInput);
                    }
                    index++;
                }
                animationData.inputs = newInputs;
            }
            const nodeIndex = nodeMap.get(babylonTransformNode);
            // Create buffer view and accessor for key frames.
            const inputData = new Float32Array(animationData.inputs);
            bufferView = bufferManager.createBufferView(inputData);
            accessor = bufferManager.createAccessor(bufferView, "SCALAR" /* AccessorType.SCALAR */, 5126 /* AccessorComponentType.FLOAT */, animationData.inputs.length, undefined, {
                min: [animationData.inputsMin],
                max: [animationData.inputsMax],
            });
            accessors.push(accessor);
            keyframeAccessorIndex = accessors.length - 1;
            // Perform conversions on keyed values while also building their buffer.
            const rotationQuaternion = new Quaternion();
            const eulerVec3 = new Vector3();
            const position = new Vector3();
            const isCamera = babylonTransformNode instanceof Camera;
            const elementCount = GetAccessorElementCount(dataAccessorType);
            const outputData = new Float32Array(animationData.outputs.length * elementCount);
            animationData.outputs.forEach(function (output, index) {
                let outputToWrite = output;
                if (convertToRightHanded) {
                    switch (animationChannelTargetPath) {
                        case "translation" /* AnimationChannelTargetPath.TRANSLATION */:
                            Vector3.FromArrayToRef(output, 0, position);
                            ConvertToRightHandedPosition(position);
                            position.toArray(outputToWrite);
                            break;
                        case "rotation" /* AnimationChannelTargetPath.ROTATION */:
                            if (output.length === 4) {
                                Quaternion.FromArrayToRef(output, 0, rotationQuaternion);
                            }
                            else {
                                outputToWrite = new Array(4); // Will need 4, not 3, for a quaternion
                                Vector3.FromArrayToRef(output, 0, eulerVec3);
                                Quaternion.FromEulerVectorToRef(eulerVec3, rotationQuaternion);
                            }
                            if (isCamera) {
                                ConvertCameraRotationToGLTF(rotationQuaternion);
                            }
                            else {
                                if (!Quaternion.IsIdentity(rotationQuaternion)) {
                                    ConvertToRightHandedRotation(rotationQuaternion);
                                }
                            }
                            rotationQuaternion.toArray(outputToWrite);
                            break;
                    }
                }
                else {
                    switch (animationChannelTargetPath) {
                        case "rotation" /* AnimationChannelTargetPath.ROTATION */:
                            if (output.length === 4) {
                                Quaternion.FromArrayToRef(output, 0, rotationQuaternion);
                            }
                            else {
                                outputToWrite = new Array(4); // Will need 4, not 3, for a quaternion
                                Vector3.FromArrayToRef(output, 0, eulerVec3);
                                Quaternion.FromEulerVectorToRef(eulerVec3, rotationQuaternion);
                            }
                            if (isCamera) {
                                ConvertCameraRotationToGLTF(rotationQuaternion);
                            }
                            rotationQuaternion.toArray(outputToWrite);
                            break;
                    }
                }
                outputData.set(outputToWrite, index * elementCount);
            });
            // Create buffer view and accessor for keyed values.
            bufferView = bufferManager.createBufferView(outputData);
            accessor = bufferManager.createAccessor(bufferView, dataAccessorType, 5126 /* AccessorComponentType.FLOAT */, animationData.outputs.length);
            accessors.push(accessor);
            dataAccessorIndex = accessors.length - 1;
            // create sampler
            animationSampler = {
                interpolation: animationData.samplerInterpolation,
                input: keyframeAccessorIndex,
                output: dataAccessorIndex,
            };
            glTFAnimation.samplers.push(animationSampler);
            // create channel
            animationChannel = {
                sampler: glTFAnimation.samplers.length - 1,
                target: {
                    node: nodeIndex,
                    path: animationChannelTargetPath,
                },
            };
            glTFAnimation.channels.push(animationChannel);
        }
    }
    /**
     * Create a baked animation
     * @param babylonTransformNode BabylonJS mesh
     * @param animation BabylonJS animation corresponding to the BabylonJS mesh
     * @param animationChannelTargetPath animation target channel
     * @param minFrame minimum animation frame
     * @param maxFrame maximum animation frame
     * @param fps frames per second of the animation
     * @param sampleRate
     * @param inputs input key frames of the animation
     * @param outputs output key frame data of the animation
     * @param minMaxFrames
     * @param minMaxFrames.min
     * @param minMaxFrames.max
     * @param useQuaternion specifies if quaternions should be used
     */
    static _CreateBakedAnimation(babylonTransformNode, animation, animationChannelTargetPath, minFrame, maxFrame, fps, sampleRate, inputs, outputs, minMaxFrames, useQuaternion) {
        let value;
        const quaternionCache = Quaternion.Identity();
        let previousTime = null;
        let time;
        let maxUsedFrame = null;
        let currKeyFrame = null;
        let nextKeyFrame = null;
        let prevKeyFrame = null;
        let endFrame = null;
        minMaxFrames.min = Tools.FloatRound(minFrame / fps);
        const keyFrames = animation.getKeys();
        for (let i = 0, length = keyFrames.length; i < length; ++i) {
            endFrame = null;
            currKeyFrame = keyFrames[i];
            if (i + 1 < length) {
                nextKeyFrame = keyFrames[i + 1];
                if ((currKeyFrame.value.equals && currKeyFrame.value.equals(nextKeyFrame.value)) || currKeyFrame.value === nextKeyFrame.value) {
                    if (i === 0) {
                        // set the first frame to itself
                        endFrame = currKeyFrame.frame;
                    }
                    else {
                        continue;
                    }
                }
                else {
                    endFrame = nextKeyFrame.frame;
                }
            }
            else {
                // at the last key frame
                prevKeyFrame = keyFrames[i - 1];
                if ((currKeyFrame.value.equals && currKeyFrame.value.equals(prevKeyFrame.value)) || currKeyFrame.value === prevKeyFrame.value) {
                    continue;
                }
                else {
                    endFrame = maxFrame;
                }
            }
            if (endFrame) {
                for (let f = currKeyFrame.frame; f <= endFrame; f += sampleRate) {
                    time = Tools.FloatRound(f / fps);
                    if (time === previousTime) {
                        continue;
                    }
                    previousTime = time;
                    maxUsedFrame = time;
                    const state = {
                        key: 0,
                        repeatCount: 0,
                        loopMode: animation.loopMode,
                    };
                    value = animation._interpolate(f, state);
                    _GLTFAnimation._SetInterpolatedValue(babylonTransformNode, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, useQuaternion);
                }
            }
        }
        if (maxUsedFrame) {
            minMaxFrames.max = maxUsedFrame;
        }
    }
    static _ConvertFactorToVector3OrQuaternion(factor, babylonTransformNode, animation, animationChannelTargetPath, useQuaternion) {
        const basePositionRotationOrScale = _GLTFAnimation._GetBasePositionRotationOrScale(babylonTransformNode, animationChannelTargetPath, useQuaternion);
        // handles single component x, y, z or w component animation by using a base property and animating over a component.
        const property = animation.targetProperty.split(".");
        const componentName = property ? property[1] : ""; // x, y, z, or w component
        const value = useQuaternion ? Quaternion.FromArray(basePositionRotationOrScale).normalize() : Vector3.FromArray(basePositionRotationOrScale);
        switch (componentName) {
            case "x":
            case "y":
            case "z": {
                value[componentName] = factor;
                break;
            }
            case "w": {
                value.w = factor;
                break;
            }
            default: {
                Tools.Error(`glTFAnimation: Unsupported component name "${componentName}"!`);
            }
        }
        return value;
    }
    static _SetInterpolatedValue(babylonTransformNode, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, useQuaternion) {
        let cacheValue;
        inputs.push(time);
        if (animationChannelTargetPath === "weights" /* AnimationChannelTargetPath.WEIGHTS */) {
            outputs.push([value]);
            return;
        }
        if (animation.dataType === Animation.ANIMATIONTYPE_FLOAT) {
            value = this._ConvertFactorToVector3OrQuaternion(value, babylonTransformNode, animation, animationChannelTargetPath, useQuaternion);
        }
        if (animationChannelTargetPath === "rotation" /* AnimationChannelTargetPath.ROTATION */) {
            if (useQuaternion) {
                quaternionCache = value;
            }
            else {
                cacheValue = value;
                Quaternion.RotationYawPitchRollToRef(cacheValue.y, cacheValue.x, cacheValue.z, quaternionCache);
            }
            outputs.push(quaternionCache.asArray());
        }
        else {
            // scaling and position animation
            cacheValue = value;
            outputs.push(cacheValue.asArray());
        }
    }
    /**
     * Creates linear animation from the animation key frames
     * @param babylonTransformNode BabylonJS mesh
     * @param animation BabylonJS animation
     * @param animationChannelTargetPath The target animation channel
     * @param inputs Array to store the key frame times
     * @param outputs Array to store the key frame data
     * @param useQuaternion Specifies if quaternions are used in the animation
     */
    static _CreateLinearOrStepAnimation(babylonTransformNode, animation, animationChannelTargetPath, inputs, outputs, useQuaternion) {
        for (const keyFrame of animation.getKeys()) {
            inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
            _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, useQuaternion);
        }
    }
    /**
     * Creates cubic spline animation from the animation key frames
     * @param babylonTransformNode BabylonJS mesh
     * @param animation BabylonJS animation
     * @param animationChannelTargetPath The target animation channel
     * @param inputs Array to store the key frame times
     * @param outputs Array to store the key frame data
     * @param useQuaternion Specifies if quaternions are used in the animation
     */
    static _CreateCubicSplineAnimation(babylonTransformNode, animation, animationChannelTargetPath, inputs, outputs, useQuaternion) {
        animation.getKeys().forEach(function (keyFrame) {
            inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
            _GLTFAnimation._AddSplineTangent(_TangentType.INTANGENT, outputs, animationChannelTargetPath, "CUBICSPLINE" /* AnimationSamplerInterpolation.CUBICSPLINE */, keyFrame, useQuaternion);
            _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, useQuaternion);
            _GLTFAnimation._AddSplineTangent(_TangentType.OUTTANGENT, outputs, animationChannelTargetPath, "CUBICSPLINE" /* AnimationSamplerInterpolation.CUBICSPLINE */, keyFrame, useQuaternion);
        });
    }
    static _GetBasePositionRotationOrScale(babylonTransformNode, animationChannelTargetPath, useQuaternion) {
        let basePositionRotationOrScale;
        if (animationChannelTargetPath === "rotation" /* AnimationChannelTargetPath.ROTATION */) {
            if (useQuaternion) {
                const q = babylonTransformNode.rotationQuaternion;
                basePositionRotationOrScale = (q ?? Quaternion.Identity()).asArray();
            }
            else {
                const r = babylonTransformNode.rotation;
                basePositionRotationOrScale = (r ?? Vector3.Zero()).asArray();
            }
        }
        else if (animationChannelTargetPath === "translation" /* AnimationChannelTargetPath.TRANSLATION */) {
            const p = babylonTransformNode.position;
            basePositionRotationOrScale = (p ?? Vector3.Zero()).asArray();
        }
        else {
            // scale
            const s = babylonTransformNode.scaling;
            basePositionRotationOrScale = (s ?? Vector3.One()).asArray();
        }
        return basePositionRotationOrScale;
    }
    /**
     * Adds a key frame value
     * @param keyFrame
     * @param animation
     * @param outputs
     * @param animationChannelTargetPath
     * @param babylonTransformNode
     * @param useQuaternion
     */
    static _AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, useQuaternion) {
        let newPositionRotationOrScale;
        const animationType = animation.dataType;
        if (animationType === Animation.ANIMATIONTYPE_VECTOR3) {
            let value = keyFrame.value.asArray();
            if (animationChannelTargetPath === "rotation" /* AnimationChannelTargetPath.ROTATION */) {
                const array = Vector3.FromArray(value);
                const rotationQuaternion = Quaternion.RotationYawPitchRoll(array.y, array.x, array.z);
                value = rotationQuaternion.asArray();
            }
            outputs.push(value); // scale  vector.
        }
        else if (animationType === Animation.ANIMATIONTYPE_FLOAT) {
            if (animationChannelTargetPath === "weights" /* AnimationChannelTargetPath.WEIGHTS */) {
                outputs.push([keyFrame.value]);
            }
            else {
                // handles single component x, y, z or w component animation by using a base property and animating over a component.
                newPositionRotationOrScale = this._ConvertFactorToVector3OrQuaternion(keyFrame.value, babylonTransformNode, animation, animationChannelTargetPath, useQuaternion);
                if (newPositionRotationOrScale) {
                    if (animationChannelTargetPath === "rotation" /* AnimationChannelTargetPath.ROTATION */) {
                        const posRotScale = useQuaternion
                            ? newPositionRotationOrScale
                            : Quaternion.RotationYawPitchRoll(newPositionRotationOrScale.y, newPositionRotationOrScale.x, newPositionRotationOrScale.z).normalize();
                        outputs.push(posRotScale.asArray());
                    }
                    outputs.push(newPositionRotationOrScale.asArray());
                }
            }
        }
        else if (animationType === Animation.ANIMATIONTYPE_QUATERNION) {
            outputs.push(keyFrame.value.normalize().asArray());
        }
        else {
            Tools.Error("glTFAnimation: Unsupported key frame values for animation!");
        }
    }
    /**
     * @internal
     * Determine the interpolation based on the key frames
     * @param keyFrames
     * @param animationChannelTargetPath
     * @param useQuaternion
     */
    static _DeduceInterpolation(keyFrames, animationChannelTargetPath, useQuaternion) {
        let interpolationType;
        let shouldBakeAnimation = false;
        let key;
        if (animationChannelTargetPath === "rotation" /* AnimationChannelTargetPath.ROTATION */ && !useQuaternion) {
            return { interpolationType: "LINEAR" /* AnimationSamplerInterpolation.LINEAR */, shouldBakeAnimation: true };
        }
        for (let i = 0, length = keyFrames.length; i < length; ++i) {
            key = keyFrames[i];
            if (key.inTangent || key.outTangent) {
                if (interpolationType) {
                    if (interpolationType !== "CUBICSPLINE" /* AnimationSamplerInterpolation.CUBICSPLINE */) {
                        interpolationType = "LINEAR" /* AnimationSamplerInterpolation.LINEAR */;
                        shouldBakeAnimation = true;
                        break;
                    }
                }
                else {
                    interpolationType = "CUBICSPLINE" /* AnimationSamplerInterpolation.CUBICSPLINE */;
                }
            }
            else {
                if (interpolationType) {
                    if (interpolationType === "CUBICSPLINE" /* AnimationSamplerInterpolation.CUBICSPLINE */ ||
                        (key.interpolation && key.interpolation === 1 /* AnimationKeyInterpolation.STEP */ && interpolationType !== "STEP" /* AnimationSamplerInterpolation.STEP */)) {
                        interpolationType = "LINEAR" /* AnimationSamplerInterpolation.LINEAR */;
                        shouldBakeAnimation = true;
                        break;
                    }
                }
                else {
                    if (key.interpolation && key.interpolation === 1 /* AnimationKeyInterpolation.STEP */) {
                        interpolationType = "STEP" /* AnimationSamplerInterpolation.STEP */;
                    }
                    else {
                        interpolationType = "LINEAR" /* AnimationSamplerInterpolation.LINEAR */;
                    }
                }
            }
        }
        if (!interpolationType) {
            interpolationType = "LINEAR" /* AnimationSamplerInterpolation.LINEAR */;
        }
        return { interpolationType: interpolationType, shouldBakeAnimation: shouldBakeAnimation };
    }
    /**
     * Adds an input tangent or output tangent to the output data
     * If an input tangent or output tangent is missing, it uses the zero vector or zero quaternion
     * @param tangentType Specifies which type of tangent to handle (inTangent or outTangent)
     * @param outputs The animation data by keyframe
     * @param animationChannelTargetPath The target animation channel
     * @param interpolation The interpolation type
     * @param keyFrame The key frame with the animation data
     * @param useQuaternion Specifies if quaternions are used
     */
    static _AddSplineTangent(tangentType, outputs, animationChannelTargetPath, interpolation, keyFrame, useQuaternion) {
        let tangent;
        const tangentValue = tangentType === _TangentType.INTANGENT ? keyFrame.inTangent : keyFrame.outTangent;
        if (interpolation === "CUBICSPLINE" /* AnimationSamplerInterpolation.CUBICSPLINE */) {
            if (animationChannelTargetPath === "rotation" /* AnimationChannelTargetPath.ROTATION */) {
                if (tangentValue) {
                    if (useQuaternion) {
                        tangent = tangentValue.asArray();
                    }
                    else {
                        const array = tangentValue;
                        tangent = Quaternion.RotationYawPitchRoll(array.y, array.x, array.z).asArray();
                    }
                }
                else {
                    tangent = [0, 0, 0, 0];
                }
            }
            else if (animationChannelTargetPath === "weights" /* AnimationChannelTargetPath.WEIGHTS */) {
                if (tangentValue) {
                    tangent = [tangentValue];
                }
                else {
                    tangent = [0];
                }
            }
            else {
                if (tangentValue) {
                    tangent = tangentValue.asArray();
                }
                else {
                    tangent = [0, 0, 0];
                }
            }
            outputs.push(tangent);
        }
    }
    /**
     * Get the minimum and maximum key frames' frame values
     * @param keyFrames animation key frames
     * @returns the minimum and maximum key frame value
     */
    static _CalculateMinMaxKeyFrames(keyFrames) {
        let min = Infinity;
        let max = -Infinity;
        keyFrames.forEach(function (keyFrame) {
            min = Math.min(min, keyFrame.frame);
            max = Math.max(max, keyFrame.frame);
        });
        return { min: min, max: max };
    }
}
//# sourceMappingURL=glTFAnimation.js.map