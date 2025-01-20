import { EParameterType, ETextureFilterType, ECullingType, EBlendingFunction, EShaderType } from "./glTFLoaderInterfaces.js";
import { Quaternion, Vector3, Matrix } from "@babylonjs/core/Maths/math.vector.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Tools } from "@babylonjs/core/Misc/tools.js";
import { Camera } from "@babylonjs/core/Cameras/camera.js";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera.js";
import { Animation } from "@babylonjs/core/Animations/animation.js";
import { Bone } from "@babylonjs/core/Bones/bone.js";
import { Skeleton } from "@babylonjs/core/Bones/skeleton.js";
import { Effect } from "@babylonjs/core/Materials/effect.js";
import { Material } from "@babylonjs/core/Materials/material.js";
import { MultiMaterial } from "@babylonjs/core/Materials/multiMaterial.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Geometry } from "@babylonjs/core/Meshes/geometry.js";
import { SubMesh } from "@babylonjs/core/Meshes/subMesh.js";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { PointLight } from "@babylonjs/core/Lights/pointLight.js";
import { SpotLight } from "@babylonjs/core/Lights/spotLight.js";
import { GLTFUtils } from "./glTFLoaderUtils.js";
import { GLTFFileLoader } from "../glTFFileLoader.js";
import { Constants } from "@babylonjs/core/Engines/constants.js";
/**
 * Tokenizer. Used for shaders compatibility
 * Automatically map world, view, projection, worldViewProjection, attributes and so on
 */
var ETokenType;
(function (ETokenType) {
    ETokenType[ETokenType["IDENTIFIER"] = 1] = "IDENTIFIER";
    ETokenType[ETokenType["UNKNOWN"] = 2] = "UNKNOWN";
    ETokenType[ETokenType["END_OF_INPUT"] = 3] = "END_OF_INPUT";
})(ETokenType || (ETokenType = {}));
class Tokenizer {
    constructor(toParse) {
        this._pos = 0;
        this.currentToken = ETokenType.UNKNOWN;
        this.currentIdentifier = "";
        this.currentString = "";
        this.isLetterOrDigitPattern = /^[a-zA-Z0-9]+$/;
        this._toParse = toParse;
        this._maxPos = toParse.length;
    }
    getNextToken() {
        if (this.isEnd()) {
            return ETokenType.END_OF_INPUT;
        }
        this.currentString = this.read();
        this.currentToken = ETokenType.UNKNOWN;
        if (this.currentString === "_" || this.isLetterOrDigitPattern.test(this.currentString)) {
            this.currentToken = ETokenType.IDENTIFIER;
            this.currentIdentifier = this.currentString;
            while (!this.isEnd() && (this.isLetterOrDigitPattern.test((this.currentString = this.peek())) || this.currentString === "_")) {
                this.currentIdentifier += this.currentString;
                this.forward();
            }
        }
        return this.currentToken;
    }
    peek() {
        return this._toParse[this._pos];
    }
    read() {
        return this._toParse[this._pos++];
    }
    forward() {
        this._pos++;
    }
    isEnd() {
        return this._pos >= this._maxPos;
    }
}
/**
 * Values
 */
const glTFTransforms = ["MODEL", "VIEW", "PROJECTION", "MODELVIEW", "MODELVIEWPROJECTION", "JOINTMATRIX"];
const babylonTransforms = ["world", "view", "projection", "worldView", "worldViewProjection", "mBones"];
const glTFAnimationPaths = ["translation", "rotation", "scale"];
const babylonAnimationPaths = ["position", "rotationQuaternion", "scaling"];
/**
 * Parse
 * @param parsedBuffers
 * @param gltfRuntime
 */
const parseBuffers = (parsedBuffers, gltfRuntime) => {
    for (const buf in parsedBuffers) {
        const parsedBuffer = parsedBuffers[buf];
        gltfRuntime.buffers[buf] = parsedBuffer;
        gltfRuntime.buffersCount++;
    }
};
const parseShaders = (parsedShaders, gltfRuntime) => {
    for (const sha in parsedShaders) {
        const parsedShader = parsedShaders[sha];
        gltfRuntime.shaders[sha] = parsedShader;
        gltfRuntime.shaderscount++;
    }
};
const parseObject = (parsedObjects, runtimeProperty, gltfRuntime) => {
    for (const object in parsedObjects) {
        const parsedObject = parsedObjects[object];
        gltfRuntime[runtimeProperty][object] = parsedObject;
    }
};
/**
 * Utils
 * @param buffer
 */
const normalizeUVs = (buffer) => {
    if (!buffer) {
        return;
    }
    for (let i = 0; i < buffer.length / 2; i++) {
        buffer[i * 2 + 1] = 1.0 - buffer[i * 2 + 1];
    }
};
const getAttribute = (attributeParameter) => {
    if (attributeParameter.semantic === "NORMAL") {
        return "normal";
    }
    else if (attributeParameter.semantic === "POSITION") {
        return "position";
    }
    else if (attributeParameter.semantic === "JOINT") {
        return "matricesIndices";
    }
    else if (attributeParameter.semantic === "WEIGHT") {
        return "matricesWeights";
    }
    else if (attributeParameter.semantic === "COLOR") {
        return "color";
    }
    else if (attributeParameter.semantic && attributeParameter.semantic.indexOf("TEXCOORD_") !== -1) {
        const channel = Number(attributeParameter.semantic.split("_")[1]);
        return "uv" + (channel === 0 ? "" : channel + 1);
    }
    return null;
};
/**
 * Loads and creates animations
 * @param gltfRuntime
 */
const loadAnimations = (gltfRuntime) => {
    for (const anim in gltfRuntime.animations) {
        const animation = gltfRuntime.animations[anim];
        if (!animation.channels || !animation.samplers) {
            continue;
        }
        let lastAnimation = null;
        for (let i = 0; i < animation.channels.length; i++) {
            // Get parameters and load buffers
            const channel = animation.channels[i];
            const sampler = animation.samplers[channel.sampler];
            if (!sampler) {
                continue;
            }
            let inputData = null;
            let outputData = null;
            if (animation.parameters) {
                inputData = animation.parameters[sampler.input];
                outputData = animation.parameters[sampler.output];
            }
            else {
                inputData = sampler.input;
                outputData = sampler.output;
            }
            const bufferInput = GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[inputData]);
            const bufferOutput = GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[outputData]);
            const targetId = channel.target.id;
            let targetNode = gltfRuntime.scene.getNodeById(targetId);
            if (targetNode === null) {
                targetNode = gltfRuntime.scene.getNodeByName(targetId);
            }
            if (targetNode === null) {
                Tools.Warn("Creating animation named " + anim + ". But cannot find node named " + targetId + " to attach to");
                continue;
            }
            const isBone = targetNode instanceof Bone;
            // Get target path (position, rotation or scaling)
            let targetPath = channel.target.path;
            const targetPathIndex = glTFAnimationPaths.indexOf(targetPath);
            if (targetPathIndex !== -1) {
                targetPath = babylonAnimationPaths[targetPathIndex];
            }
            // Determine animation type
            let animationType = Animation.ANIMATIONTYPE_MATRIX;
            if (!isBone) {
                if (targetPath === "rotationQuaternion") {
                    animationType = Animation.ANIMATIONTYPE_QUATERNION;
                    targetNode.rotationQuaternion = new Quaternion();
                }
                else {
                    animationType = Animation.ANIMATIONTYPE_VECTOR3;
                }
            }
            // Create animation and key frames
            let babylonAnimation = null;
            const keys = [];
            let arrayOffset = 0;
            let modifyKey = false;
            if (isBone && lastAnimation && lastAnimation.getKeys().length === bufferInput.length) {
                babylonAnimation = lastAnimation;
                modifyKey = true;
            }
            if (!modifyKey) {
                gltfRuntime.scene._blockEntityCollection = !!gltfRuntime.assetContainer;
                babylonAnimation = new Animation(anim, isBone ? "_matrix" : targetPath, 1, animationType, Animation.ANIMATIONLOOPMODE_CYCLE);
                gltfRuntime.scene._blockEntityCollection = false;
            }
            // For each frame
            for (let j = 0; j < bufferInput.length; j++) {
                let value = null;
                if (targetPath === "rotationQuaternion") {
                    // VEC4
                    value = Quaternion.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2], bufferOutput[arrayOffset + 3]]);
                    arrayOffset += 4;
                }
                else {
                    // Position and scaling are VEC3
                    value = Vector3.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2]]);
                    arrayOffset += 3;
                }
                if (isBone) {
                    const bone = targetNode;
                    let translation = Vector3.Zero();
                    let rotationQuaternion = new Quaternion();
                    let scaling = Vector3.Zero();
                    // Warning on decompose
                    let mat = bone.getBaseMatrix();
                    if (modifyKey && lastAnimation) {
                        mat = lastAnimation.getKeys()[j].value;
                    }
                    mat.decompose(scaling, rotationQuaternion, translation);
                    if (targetPath === "position") {
                        translation = value;
                    }
                    else if (targetPath === "rotationQuaternion") {
                        rotationQuaternion = value;
                    }
                    else {
                        scaling = value;
                    }
                    value = Matrix.Compose(scaling, rotationQuaternion, translation);
                }
                if (!modifyKey) {
                    keys.push({
                        frame: bufferInput[j],
                        value: value,
                    });
                }
                else if (lastAnimation) {
                    lastAnimation.getKeys()[j].value = value;
                }
            }
            // Finish
            if (!modifyKey && babylonAnimation) {
                babylonAnimation.setKeys(keys);
                targetNode.animations.push(babylonAnimation);
            }
            lastAnimation = babylonAnimation;
            gltfRuntime.scene.stopAnimation(targetNode);
            gltfRuntime.scene.beginAnimation(targetNode, 0, bufferInput[bufferInput.length - 1], true, 1.0);
        }
    }
};
/**
 * @returns the bones transformation matrix
 * @param node
 */
const configureBoneTransformation = (node) => {
    let mat = null;
    if (node.translation || node.rotation || node.scale) {
        const scale = Vector3.FromArray(node.scale || [1, 1, 1]);
        const rotation = Quaternion.FromArray(node.rotation || [0, 0, 0, 1]);
        const position = Vector3.FromArray(node.translation || [0, 0, 0]);
        mat = Matrix.Compose(scale, rotation, position);
    }
    else {
        mat = Matrix.FromArray(node.matrix);
    }
    return mat;
};
/**
 * Returns the parent bone
 * @param gltfRuntime
 * @param skins
 * @param jointName
 * @param newSkeleton
 * @returns the parent bone
 */
const getParentBone = (gltfRuntime, skins, jointName, newSkeleton) => {
    // Try to find
    for (let i = 0; i < newSkeleton.bones.length; i++) {
        if (newSkeleton.bones[i].name === jointName) {
            return newSkeleton.bones[i];
        }
    }
    // Not found, search in gltf nodes
    const nodes = gltfRuntime.nodes;
    for (const nde in nodes) {
        const node = nodes[nde];
        if (!node.jointName) {
            continue;
        }
        const children = node.children;
        for (let i = 0; i < children.length; i++) {
            const child = gltfRuntime.nodes[children[i]];
            if (!child.jointName) {
                continue;
            }
            if (child.jointName === jointName) {
                const mat = configureBoneTransformation(node);
                const bone = new Bone(node.name || "", newSkeleton, getParentBone(gltfRuntime, skins, node.jointName, newSkeleton), mat);
                bone.id = nde;
                return bone;
            }
        }
    }
    return null;
};
/**
 * Returns the appropriate root node
 * @param nodesToRoot
 * @param id
 * @returns the root node
 */
const getNodeToRoot = (nodesToRoot, id) => {
    for (let i = 0; i < nodesToRoot.length; i++) {
        const nodeToRoot = nodesToRoot[i];
        for (let j = 0; j < nodeToRoot.node.children.length; j++) {
            const child = nodeToRoot.node.children[j];
            if (child === id) {
                return nodeToRoot.bone;
            }
        }
    }
    return null;
};
/**
 * Returns the node with the joint name
 * @param gltfRuntime
 * @param jointName
 * @returns the node with the joint name
 */
const getJointNode = (gltfRuntime, jointName) => {
    const nodes = gltfRuntime.nodes;
    let node = nodes[jointName];
    if (node) {
        return {
            node: node,
            id: jointName,
        };
    }
    for (const nde in nodes) {
        node = nodes[nde];
        if (node.jointName === jointName) {
            return {
                node: node,
                id: nde,
            };
        }
    }
    return null;
};
/**
 * Checks if a nodes is in joints
 * @param skins
 * @param id
 * @returns true if the node is in joints, else false
 */
const nodeIsInJoints = (skins, id) => {
    for (let i = 0; i < skins.jointNames.length; i++) {
        if (skins.jointNames[i] === id) {
            return true;
        }
    }
    return false;
};
/**
 * Fills the nodes to root for bones and builds hierarchy
 * @param gltfRuntime
 * @param newSkeleton
 * @param skins
 * @param nodesToRoot
 */
const getNodesToRoot = (gltfRuntime, newSkeleton, skins, nodesToRoot) => {
    // Creates nodes for root
    for (const nde in gltfRuntime.nodes) {
        const node = gltfRuntime.nodes[nde];
        const id = nde;
        if (!node.jointName || nodeIsInJoints(skins, node.jointName)) {
            continue;
        }
        // Create node to root bone
        const mat = configureBoneTransformation(node);
        const bone = new Bone(node.name || "", newSkeleton, null, mat);
        bone.id = id;
        nodesToRoot.push({ bone: bone, node: node, id: id });
    }
    // Parenting
    for (let i = 0; i < nodesToRoot.length; i++) {
        const nodeToRoot = nodesToRoot[i];
        const children = nodeToRoot.node.children;
        for (let j = 0; j < children.length; j++) {
            let child = null;
            for (let k = 0; k < nodesToRoot.length; k++) {
                if (nodesToRoot[k].id === children[j]) {
                    child = nodesToRoot[k];
                    break;
                }
            }
            if (child) {
                child.bone._parent = nodeToRoot.bone;
                nodeToRoot.bone.children.push(child.bone);
            }
        }
    }
};
/**
 * Imports a skeleton
 * @param gltfRuntime
 * @param skins
 * @param mesh
 * @param newSkeleton
 * @returns the bone name
 */
const importSkeleton = (gltfRuntime, skins, mesh, newSkeleton) => {
    if (!newSkeleton) {
        newSkeleton = new Skeleton(skins.name || "", "", gltfRuntime.scene);
    }
    if (!skins.babylonSkeleton) {
        return newSkeleton;
    }
    // Find the root bones
    const nodesToRoot = [];
    const nodesToRootToAdd = [];
    getNodesToRoot(gltfRuntime, newSkeleton, skins, nodesToRoot);
    newSkeleton.bones = [];
    // Joints
    for (let i = 0; i < skins.jointNames.length; i++) {
        const jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
        if (!jointNode) {
            continue;
        }
        const node = jointNode.node;
        if (!node) {
            Tools.Warn("Joint named " + skins.jointNames[i] + " does not exist");
            continue;
        }
        const id = jointNode.id;
        // Optimize, if the bone already exists...
        const existingBone = gltfRuntime.scene.getBoneById(id);
        if (existingBone) {
            newSkeleton.bones.push(existingBone);
            continue;
        }
        // Search for parent bone
        let foundBone = false;
        let parentBone = null;
        for (let j = 0; j < i; j++) {
            const jointNode = getJointNode(gltfRuntime, skins.jointNames[j]);
            if (!jointNode) {
                continue;
            }
            const joint = jointNode.node;
            if (!joint) {
                Tools.Warn("Joint named " + skins.jointNames[j] + " does not exist when looking for parent");
                continue;
            }
            const children = joint.children;
            if (!children) {
                continue;
            }
            foundBone = false;
            for (let k = 0; k < children.length; k++) {
                if (children[k] === id) {
                    parentBone = getParentBone(gltfRuntime, skins, skins.jointNames[j], newSkeleton);
                    foundBone = true;
                    break;
                }
            }
            if (foundBone) {
                break;
            }
        }
        // Create bone
        const mat = configureBoneTransformation(node);
        if (!parentBone && nodesToRoot.length > 0) {
            parentBone = getNodeToRoot(nodesToRoot, id);
            if (parentBone) {
                if (nodesToRootToAdd.indexOf(parentBone) === -1) {
                    nodesToRootToAdd.push(parentBone);
                }
            }
        }
        const bone = new Bone(node.jointName || "", newSkeleton, parentBone, mat);
        bone.id = id;
    }
    // Polish
    const bones = newSkeleton.bones;
    newSkeleton.bones = [];
    for (let i = 0; i < skins.jointNames.length; i++) {
        const jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
        if (!jointNode) {
            continue;
        }
        for (let j = 0; j < bones.length; j++) {
            if (bones[j].id === jointNode.id) {
                newSkeleton.bones.push(bones[j]);
                break;
            }
        }
    }
    newSkeleton.prepare();
    // Finish
    for (let i = 0; i < nodesToRootToAdd.length; i++) {
        newSkeleton.bones.push(nodesToRootToAdd[i]);
    }
    return newSkeleton;
};
/**
 * Imports a mesh and its geometries
 * @param gltfRuntime
 * @param node
 * @param meshes
 * @param id
 * @param newMesh
 * @returns the new mesh
 */
const importMesh = (gltfRuntime, node, meshes, id, newMesh) => {
    if (!newMesh) {
        gltfRuntime.scene._blockEntityCollection = !!gltfRuntime.assetContainer;
        newMesh = new Mesh(node.name || "", gltfRuntime.scene);
        newMesh._parentContainer = gltfRuntime.assetContainer;
        gltfRuntime.scene._blockEntityCollection = false;
        newMesh.id = id;
    }
    if (!node.babylonNode) {
        return newMesh;
    }
    const subMaterials = [];
    let vertexData = null;
    const verticesStarts = [];
    const verticesCounts = [];
    const indexStarts = [];
    const indexCounts = [];
    for (let meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
        const meshId = meshes[meshIndex];
        const mesh = gltfRuntime.meshes[meshId];
        if (!mesh) {
            continue;
        }
        // Positions, normals and UVs
        for (let i = 0; i < mesh.primitives.length; i++) {
            // Temporary vertex data
            const tempVertexData = new VertexData();
            const primitive = mesh.primitives[i];
            if (primitive.mode !== 4) {
                // continue;
            }
            const attributes = primitive.attributes;
            let accessor = null;
            let buffer = null;
            // Set positions, normal and uvs
            for (const semantic in attributes) {
                // Link accessor and buffer view
                accessor = gltfRuntime.accessors[attributes[semantic]];
                buffer = GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                if (semantic === "NORMAL") {
                    tempVertexData.normals = new Float32Array(buffer.length);
                    tempVertexData.normals.set(buffer);
                }
                else if (semantic === "POSITION") {
                    if (GLTFFileLoader.HomogeneousCoordinates) {
                        tempVertexData.positions = new Float32Array(buffer.length - buffer.length / 4);
                        for (let j = 0; j < buffer.length; j += 4) {
                            tempVertexData.positions[j] = buffer[j];
                            tempVertexData.positions[j + 1] = buffer[j + 1];
                            tempVertexData.positions[j + 2] = buffer[j + 2];
                        }
                    }
                    else {
                        tempVertexData.positions = new Float32Array(buffer.length);
                        tempVertexData.positions.set(buffer);
                    }
                    verticesCounts.push(tempVertexData.positions.length);
                }
                else if (semantic.indexOf("TEXCOORD_") !== -1) {
                    const channel = Number(semantic.split("_")[1]);
                    const uvKind = VertexBuffer.UVKind + (channel === 0 ? "" : channel + 1);
                    const uvs = new Float32Array(buffer.length);
                    uvs.set(buffer);
                    normalizeUVs(uvs);
                    tempVertexData.set(uvs, uvKind);
                }
                else if (semantic === "JOINT") {
                    tempVertexData.matricesIndices = new Float32Array(buffer.length);
                    tempVertexData.matricesIndices.set(buffer);
                }
                else if (semantic === "WEIGHT") {
                    tempVertexData.matricesWeights = new Float32Array(buffer.length);
                    tempVertexData.matricesWeights.set(buffer);
                }
                else if (semantic === "COLOR") {
                    tempVertexData.colors = new Float32Array(buffer.length);
                    tempVertexData.colors.set(buffer);
                }
            }
            // Indices
            accessor = gltfRuntime.accessors[primitive.indices];
            if (accessor) {
                buffer = GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                tempVertexData.indices = new Int32Array(buffer.length);
                tempVertexData.indices.set(buffer);
                indexCounts.push(tempVertexData.indices.length);
            }
            else {
                // Set indices on the fly
                const indices = [];
                for (let j = 0; j < tempVertexData.positions.length / 3; j++) {
                    indices.push(j);
                }
                tempVertexData.indices = new Int32Array(indices);
                indexCounts.push(tempVertexData.indices.length);
            }
            if (!vertexData) {
                vertexData = tempVertexData;
            }
            else {
                vertexData.merge(tempVertexData);
            }
            // Sub material
            const material = gltfRuntime.scene.getMaterialById(primitive.material);
            subMaterials.push(material === null ? GLTFUtils.GetDefaultMaterial(gltfRuntime.scene) : material);
            // Update vertices start and index start
            verticesStarts.push(verticesStarts.length === 0 ? 0 : verticesStarts[verticesStarts.length - 1] + verticesCounts[verticesCounts.length - 2]);
            indexStarts.push(indexStarts.length === 0 ? 0 : indexStarts[indexStarts.length - 1] + indexCounts[indexCounts.length - 2]);
        }
    }
    let material;
    gltfRuntime.scene._blockEntityCollection = !!gltfRuntime.assetContainer;
    if (subMaterials.length > 1) {
        material = new MultiMaterial("multimat" + id, gltfRuntime.scene);
        material.subMaterials = subMaterials;
    }
    else {
        material = new StandardMaterial("multimat" + id, gltfRuntime.scene);
    }
    if (subMaterials.length === 1) {
        material = subMaterials[0];
    }
    material._parentContainer = gltfRuntime.assetContainer;
    if (!newMesh.material) {
        newMesh.material = material;
    }
    // Apply geometry
    new Geometry(id, gltfRuntime.scene, vertexData, false, newMesh);
    newMesh.computeWorldMatrix(true);
    gltfRuntime.scene._blockEntityCollection = false;
    // Apply submeshes
    newMesh.subMeshes = [];
    let index = 0;
    for (let meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
        const meshId = meshes[meshIndex];
        const mesh = gltfRuntime.meshes[meshId];
        if (!mesh) {
            continue;
        }
        for (let i = 0; i < mesh.primitives.length; i++) {
            if (mesh.primitives[i].mode !== 4) {
                //continue;
            }
            SubMesh.AddToMesh(index, verticesStarts[index], verticesCounts[index], indexStarts[index], indexCounts[index], newMesh, newMesh, true);
            index++;
        }
    }
    // Finish
    return newMesh;
};
/**
 * Configure node transformation from position, rotation and scaling
 * @param newNode
 * @param position
 * @param rotation
 * @param scaling
 */
const configureNode = (newNode, position, rotation, scaling) => {
    if (newNode.position) {
        newNode.position = position;
    }
    if (newNode.rotationQuaternion || newNode.rotation) {
        newNode.rotationQuaternion = rotation;
    }
    if (newNode.scaling) {
        newNode.scaling = scaling;
    }
};
/**
 * Configures node from transformation matrix
 * @param newNode
 * @param node
 */
const configureNodeFromMatrix = (newNode, node) => {
    if (node.matrix) {
        const position = new Vector3(0, 0, 0);
        const rotation = new Quaternion();
        const scaling = new Vector3(0, 0, 0);
        const mat = Matrix.FromArray(node.matrix);
        mat.decompose(scaling, rotation, position);
        configureNode(newNode, position, rotation, scaling);
    }
    else if (node.translation && node.rotation && node.scale) {
        configureNode(newNode, Vector3.FromArray(node.translation), Quaternion.FromArray(node.rotation), Vector3.FromArray(node.scale));
    }
    newNode.computeWorldMatrix(true);
};
/**
 * Imports a node
 * @param gltfRuntime
 * @param node
 * @param id
 * @returns the newly imported node
 */
const importNode = (gltfRuntime, node, id) => {
    let lastNode = null;
    if (gltfRuntime.importOnlyMeshes && (node.skin || node.meshes)) {
        if (gltfRuntime.importMeshesNames && gltfRuntime.importMeshesNames.length > 0 && gltfRuntime.importMeshesNames.indexOf(node.name || "") === -1) {
            return null;
        }
    }
    // Meshes
    if (node.skin) {
        if (node.meshes) {
            const skin = gltfRuntime.skins[node.skin];
            const newMesh = importMesh(gltfRuntime, node, node.meshes, id, node.babylonNode);
            newMesh.skeleton = gltfRuntime.scene.getLastSkeletonById(node.skin);
            if (newMesh.skeleton === null) {
                newMesh.skeleton = importSkeleton(gltfRuntime, skin, newMesh, skin.babylonSkeleton);
                if (!skin.babylonSkeleton) {
                    skin.babylonSkeleton = newMesh.skeleton;
                }
            }
            lastNode = newMesh;
        }
    }
    else if (node.meshes) {
        /**
         * Improve meshes property
         */
        const newMesh = importMesh(gltfRuntime, node, node.mesh ? [node.mesh] : node.meshes, id, node.babylonNode);
        lastNode = newMesh;
    }
    // Lights
    else if (node.light && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
        const light = gltfRuntime.lights[node.light];
        if (light) {
            if (light.type === "ambient") {
                const ambienLight = light[light.type];
                const hemiLight = new HemisphericLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                hemiLight.name = node.name || "";
                if (ambienLight.color) {
                    hemiLight.diffuse = Color3.FromArray(ambienLight.color);
                }
                lastNode = hemiLight;
            }
            else if (light.type === "directional") {
                const directionalLight = light[light.type];
                const dirLight = new DirectionalLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                dirLight.name = node.name || "";
                if (directionalLight.color) {
                    dirLight.diffuse = Color3.FromArray(directionalLight.color);
                }
                lastNode = dirLight;
            }
            else if (light.type === "point") {
                const pointLight = light[light.type];
                const ptLight = new PointLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                ptLight.name = node.name || "";
                if (pointLight.color) {
                    ptLight.diffuse = Color3.FromArray(pointLight.color);
                }
                lastNode = ptLight;
            }
            else if (light.type === "spot") {
                const spotLight = light[light.type];
                const spLight = new SpotLight(node.light, Vector3.Zero(), Vector3.Zero(), 0, 0, gltfRuntime.scene);
                spLight.name = node.name || "";
                if (spotLight.color) {
                    spLight.diffuse = Color3.FromArray(spotLight.color);
                }
                if (spotLight.fallOfAngle) {
                    spLight.angle = spotLight.fallOfAngle;
                }
                if (spotLight.fallOffExponent) {
                    spLight.exponent = spotLight.fallOffExponent;
                }
                lastNode = spLight;
            }
        }
    }
    // Cameras
    else if (node.camera && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
        const camera = gltfRuntime.cameras[node.camera];
        if (camera) {
            gltfRuntime.scene._blockEntityCollection = !!gltfRuntime.assetContainer;
            if (camera.type === "orthographic") {
                const orthoCamera = new FreeCamera(node.camera, Vector3.Zero(), gltfRuntime.scene, false);
                orthoCamera.name = node.name || "";
                orthoCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
                orthoCamera.attachControl();
                lastNode = orthoCamera;
                orthoCamera._parentContainer = gltfRuntime.assetContainer;
            }
            else if (camera.type === "perspective") {
                const perspectiveCamera = camera[camera.type];
                const persCamera = new FreeCamera(node.camera, Vector3.Zero(), gltfRuntime.scene, false);
                persCamera.name = node.name || "";
                persCamera.attachControl();
                if (!perspectiveCamera.aspectRatio) {
                    perspectiveCamera.aspectRatio = gltfRuntime.scene.getEngine().getRenderWidth() / gltfRuntime.scene.getEngine().getRenderHeight();
                }
                if (perspectiveCamera.znear && perspectiveCamera.zfar) {
                    persCamera.maxZ = perspectiveCamera.zfar;
                    persCamera.minZ = perspectiveCamera.znear;
                }
                lastNode = persCamera;
                persCamera._parentContainer = gltfRuntime.assetContainer;
            }
            gltfRuntime.scene._blockEntityCollection = false;
        }
    }
    // Empty node
    if (!node.jointName) {
        if (node.babylonNode) {
            return node.babylonNode;
        }
        else if (lastNode === null) {
            gltfRuntime.scene._blockEntityCollection = !!gltfRuntime.assetContainer;
            const dummy = new Mesh(node.name || "", gltfRuntime.scene);
            dummy._parentContainer = gltfRuntime.assetContainer;
            gltfRuntime.scene._blockEntityCollection = false;
            node.babylonNode = dummy;
            lastNode = dummy;
        }
    }
    if (lastNode !== null) {
        if (node.matrix && lastNode instanceof Mesh) {
            configureNodeFromMatrix(lastNode, node);
        }
        else {
            const translation = node.translation || [0, 0, 0];
            const rotation = node.rotation || [0, 0, 0, 1];
            const scale = node.scale || [1, 1, 1];
            configureNode(lastNode, Vector3.FromArray(translation), Quaternion.FromArray(rotation), Vector3.FromArray(scale));
        }
        lastNode.updateCache(true);
        node.babylonNode = lastNode;
    }
    return lastNode;
};
/**
 * Traverses nodes and creates them
 * @param gltfRuntime
 * @param id
 * @param parent
 * @param meshIncluded
 */
const traverseNodes = (gltfRuntime, id, parent, meshIncluded = false) => {
    const node = gltfRuntime.nodes[id];
    let newNode = null;
    if (gltfRuntime.importOnlyMeshes && !meshIncluded && gltfRuntime.importMeshesNames) {
        if (gltfRuntime.importMeshesNames.indexOf(node.name || "") !== -1 || gltfRuntime.importMeshesNames.length === 0) {
            meshIncluded = true;
        }
        else {
            meshIncluded = false;
        }
    }
    else {
        meshIncluded = true;
    }
    if (!node.jointName && meshIncluded) {
        newNode = importNode(gltfRuntime, node, id);
        if (newNode !== null) {
            newNode.id = id;
            newNode.parent = parent;
        }
    }
    if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
            traverseNodes(gltfRuntime, node.children[i], newNode, meshIncluded);
        }
    }
};
/**
 * do stuff after buffers, shaders are loaded (e.g. hook up materials, load animations, etc.)
 * @param gltfRuntime
 */
const postLoad = (gltfRuntime) => {
    // Nodes
    let currentScene = gltfRuntime.currentScene;
    if (currentScene) {
        for (let i = 0; i < currentScene.nodes.length; i++) {
            traverseNodes(gltfRuntime, currentScene.nodes[i], null);
        }
    }
    else {
        for (const thing in gltfRuntime.scenes) {
            currentScene = gltfRuntime.scenes[thing];
            for (let i = 0; i < currentScene.nodes.length; i++) {
                traverseNodes(gltfRuntime, currentScene.nodes[i], null);
            }
        }
    }
    // Set animations
    loadAnimations(gltfRuntime);
    for (let i = 0; i < gltfRuntime.scene.skeletons.length; i++) {
        const skeleton = gltfRuntime.scene.skeletons[i];
        gltfRuntime.scene.beginAnimation(skeleton, 0, Number.MAX_VALUE, true, 1.0);
    }
};
/**
 * onBind shaderrs callback to set uniforms and matrices
 * @param mesh
 * @param gltfRuntime
 * @param unTreatedUniforms
 * @param shaderMaterial
 * @param technique
 * @param material
 * @param onSuccess
 */
const onBindShaderMaterial = (mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess) => {
    const materialValues = material.values || technique.parameters;
    for (const unif in unTreatedUniforms) {
        const uniform = unTreatedUniforms[unif];
        const type = uniform.type;
        if (type === EParameterType.FLOAT_MAT2 || type === EParameterType.FLOAT_MAT3 || type === EParameterType.FLOAT_MAT4) {
            if (uniform.semantic && !uniform.source && !uniform.node) {
                GLTFUtils.SetMatrix(gltfRuntime.scene, mesh, uniform, unif, shaderMaterial.getEffect());
            }
            else if (uniform.semantic && (uniform.source || uniform.node)) {
                let source = gltfRuntime.scene.getNodeByName(uniform.source || uniform.node || "");
                if (source === null) {
                    source = gltfRuntime.scene.getNodeById(uniform.source || uniform.node || "");
                }
                if (source === null) {
                    continue;
                }
                GLTFUtils.SetMatrix(gltfRuntime.scene, source, uniform, unif, shaderMaterial.getEffect());
            }
        }
        else {
            const value = materialValues[technique.uniforms[unif]];
            if (!value) {
                continue;
            }
            if (type === EParameterType.SAMPLER_2D) {
                const texture = gltfRuntime.textures[material.values ? value : uniform.value].babylonTexture;
                if (texture === null || texture === undefined) {
                    continue;
                }
                shaderMaterial.getEffect().setTexture(unif, texture);
            }
            else {
                GLTFUtils.SetUniform(shaderMaterial.getEffect(), unif, value, type);
            }
        }
    }
    onSuccess(shaderMaterial);
};
/**
 * Prepare uniforms to send the only one time
 * Loads the appropriate textures
 * @param gltfRuntime
 * @param shaderMaterial
 * @param technique
 * @param material
 */
const prepareShaderMaterialUniforms = (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms) => {
    const materialValues = material.values || technique.parameters;
    const techniqueUniforms = technique.uniforms;
    /**
     * Prepare values here (not matrices)
     */
    for (const unif in unTreatedUniforms) {
        const uniform = unTreatedUniforms[unif];
        const type = uniform.type;
        let value = materialValues[techniqueUniforms[unif]];
        if (value === undefined) {
            // In case the value is the same for all materials
            value = uniform.value;
        }
        if (!value) {
            continue;
        }
        const onLoadTexture = (uniformName) => {
            return (texture) => {
                if (uniform.value && uniformName) {
                    // Static uniform
                    shaderMaterial.setTexture(uniformName, texture);
                    delete unTreatedUniforms[uniformName];
                }
            };
        };
        // Texture (sampler2D)
        if (type === EParameterType.SAMPLER_2D) {
            GLTFLoaderExtension.LoadTextureAsync(gltfRuntime, material.values ? value : uniform.value, onLoadTexture(unif), () => onLoadTexture(null));
        }
        // Others
        else {
            if (uniform.value && GLTFUtils.SetUniform(shaderMaterial, unif, material.values ? value : uniform.value, type)) {
                // Static uniform
                delete unTreatedUniforms[unif];
            }
        }
    }
};
/**
 * Shader compilation failed
 * @param program
 * @param shaderMaterial
 * @param onError
 * @returns callback when shader is compiled
 */
const onShaderCompileError = (program, shaderMaterial, onError) => {
    return (effect, error) => {
        shaderMaterial.dispose(true);
        onError("Cannot compile program named " + program.name + ". Error: " + error + ". Default material will be applied");
    };
};
/**
 * Shader compilation success
 * @param gltfRuntime
 * @param shaderMaterial
 * @param technique
 * @param material
 * @param unTreatedUniforms
 * @param onSuccess
 * @returns callback when shader is compiled
 */
const onShaderCompileSuccess = (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess) => {
    return (_) => {
        prepareShaderMaterialUniforms(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms);
        shaderMaterial.onBind = (mesh) => {
            onBindShaderMaterial(mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess);
        };
    };
};
/**
 * Returns the appropriate uniform if already handled by babylon
 * @param tokenizer
 * @param technique
 * @param unTreatedUniforms
 * @returns the name of the uniform handled by babylon
 */
const parseShaderUniforms = (tokenizer, technique, unTreatedUniforms) => {
    for (const unif in technique.uniforms) {
        const uniform = technique.uniforms[unif];
        const uniformParameter = technique.parameters[uniform];
        if (tokenizer.currentIdentifier === unif) {
            if (uniformParameter.semantic && !uniformParameter.source && !uniformParameter.node) {
                const transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                if (transformIndex !== -1) {
                    delete unTreatedUniforms[unif];
                    return babylonTransforms[transformIndex];
                }
            }
        }
    }
    return tokenizer.currentIdentifier;
};
/**
 * All shaders loaded. Create materials one by one
 * @param gltfRuntime
 */
const importMaterials = (gltfRuntime) => {
    // Create materials
    for (const mat in gltfRuntime.materials) {
        GLTFLoaderExtension.LoadMaterialAsync(gltfRuntime, mat, () => { }, () => { });
    }
};
/**
 * Implementation of the base glTF spec
 * @internal
 */
export class GLTFLoaderBase {
    static CreateRuntime(parsedData, scene, rootUrl) {
        const gltfRuntime = {
            extensions: {},
            accessors: {},
            buffers: {},
            bufferViews: {},
            meshes: {},
            lights: {},
            cameras: {},
            nodes: {},
            images: {},
            textures: {},
            shaders: {},
            programs: {},
            samplers: {},
            techniques: {},
            materials: {},
            animations: {},
            skins: {},
            extensionsUsed: [],
            scenes: {},
            buffersCount: 0,
            shaderscount: 0,
            scene: scene,
            rootUrl: rootUrl,
            loadedBufferCount: 0,
            loadedBufferViews: {},
            loadedShaderCount: 0,
            importOnlyMeshes: false,
            dummyNodes: [],
            assetContainer: null,
        };
        // Parse
        if (parsedData.extensions) {
            parseObject(parsedData.extensions, "extensions", gltfRuntime);
        }
        if (parsedData.extensionsUsed) {
            parseObject(parsedData.extensionsUsed, "extensionsUsed", gltfRuntime);
        }
        if (parsedData.buffers) {
            parseBuffers(parsedData.buffers, gltfRuntime);
        }
        if (parsedData.bufferViews) {
            parseObject(parsedData.bufferViews, "bufferViews", gltfRuntime);
        }
        if (parsedData.accessors) {
            parseObject(parsedData.accessors, "accessors", gltfRuntime);
        }
        if (parsedData.meshes) {
            parseObject(parsedData.meshes, "meshes", gltfRuntime);
        }
        if (parsedData.lights) {
            parseObject(parsedData.lights, "lights", gltfRuntime);
        }
        if (parsedData.cameras) {
            parseObject(parsedData.cameras, "cameras", gltfRuntime);
        }
        if (parsedData.nodes) {
            parseObject(parsedData.nodes, "nodes", gltfRuntime);
        }
        if (parsedData.images) {
            parseObject(parsedData.images, "images", gltfRuntime);
        }
        if (parsedData.textures) {
            parseObject(parsedData.textures, "textures", gltfRuntime);
        }
        if (parsedData.shaders) {
            parseShaders(parsedData.shaders, gltfRuntime);
        }
        if (parsedData.programs) {
            parseObject(parsedData.programs, "programs", gltfRuntime);
        }
        if (parsedData.samplers) {
            parseObject(parsedData.samplers, "samplers", gltfRuntime);
        }
        if (parsedData.techniques) {
            parseObject(parsedData.techniques, "techniques", gltfRuntime);
        }
        if (parsedData.materials) {
            parseObject(parsedData.materials, "materials", gltfRuntime);
        }
        if (parsedData.animations) {
            parseObject(parsedData.animations, "animations", gltfRuntime);
        }
        if (parsedData.skins) {
            parseObject(parsedData.skins, "skins", gltfRuntime);
        }
        if (parsedData.scenes) {
            gltfRuntime.scenes = parsedData.scenes;
        }
        if (parsedData.scene && parsedData.scenes) {
            gltfRuntime.currentScene = parsedData.scenes[parsedData.scene];
        }
        return gltfRuntime;
    }
    static LoadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress) {
        const buffer = gltfRuntime.buffers[id];
        if (Tools.IsBase64(buffer.uri)) {
            setTimeout(() => onSuccess(new Uint8Array(Tools.DecodeBase64(buffer.uri))));
        }
        else {
            Tools.LoadFile(gltfRuntime.rootUrl + buffer.uri, (data) => onSuccess(new Uint8Array(data)), onProgress, undefined, true, (request) => {
                if (request) {
                    onError(request.status + " " + request.statusText);
                }
            });
        }
    }
    static LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError) {
        const texture = gltfRuntime.textures[id];
        if (!texture || !texture.source) {
            onError("");
            return;
        }
        if (texture.babylonTexture) {
            onSuccess(null);
            return;
        }
        const source = gltfRuntime.images[texture.source];
        if (Tools.IsBase64(source.uri)) {
            setTimeout(() => onSuccess(new Uint8Array(Tools.DecodeBase64(source.uri))));
        }
        else {
            Tools.LoadFile(gltfRuntime.rootUrl + source.uri, (data) => onSuccess(new Uint8Array(data)), undefined, undefined, true, (request) => {
                if (request) {
                    onError(request.status + " " + request.statusText);
                }
            });
        }
    }
    static CreateTextureAsync(gltfRuntime, id, buffer, onSuccess) {
        const texture = gltfRuntime.textures[id];
        if (texture.babylonTexture) {
            onSuccess(texture.babylonTexture);
            return;
        }
        const sampler = gltfRuntime.samplers[texture.sampler];
        const createMipMaps = sampler.minFilter === ETextureFilterType.NEAREST_MIPMAP_NEAREST ||
            sampler.minFilter === ETextureFilterType.NEAREST_MIPMAP_LINEAR ||
            sampler.minFilter === ETextureFilterType.LINEAR_MIPMAP_NEAREST ||
            sampler.minFilter === ETextureFilterType.LINEAR_MIPMAP_LINEAR;
        const samplingMode = Texture.BILINEAR_SAMPLINGMODE;
        const blob = buffer == null ? new Blob() : new Blob([buffer]);
        const blobURL = URL.createObjectURL(blob);
        const revokeBlobURL = () => URL.revokeObjectURL(blobURL);
        const newTexture = new Texture(blobURL, gltfRuntime.scene, !createMipMaps, true, samplingMode, revokeBlobURL, revokeBlobURL);
        if (sampler.wrapS !== undefined) {
            newTexture.wrapU = GLTFUtils.GetWrapMode(sampler.wrapS);
        }
        if (sampler.wrapT !== undefined) {
            newTexture.wrapV = GLTFUtils.GetWrapMode(sampler.wrapT);
        }
        newTexture.name = id;
        texture.babylonTexture = newTexture;
        onSuccess(newTexture);
    }
    static LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError) {
        const shader = gltfRuntime.shaders[id];
        if (Tools.IsBase64(shader.uri)) {
            const shaderString = atob(shader.uri.split(",")[1]);
            if (onSuccess) {
                onSuccess(shaderString);
            }
        }
        else {
            Tools.LoadFile(gltfRuntime.rootUrl + shader.uri, onSuccess, undefined, undefined, false, (request) => {
                if (request && onError) {
                    onError(request.status + " " + request.statusText);
                }
            });
        }
    }
    static LoadMaterialAsync(gltfRuntime, id, onSuccess, onError) {
        const material = gltfRuntime.materials[id];
        if (!material.technique) {
            if (onError) {
                onError("No technique found.");
            }
            return;
        }
        const technique = gltfRuntime.techniques[material.technique];
        if (!technique) {
            gltfRuntime.scene._blockEntityCollection = !!gltfRuntime.assetContainer;
            const defaultMaterial = new StandardMaterial(id, gltfRuntime.scene);
            defaultMaterial._parentContainer = gltfRuntime.assetContainer;
            gltfRuntime.scene._blockEntityCollection = false;
            defaultMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
            defaultMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;
            onSuccess(defaultMaterial);
            return;
        }
        const program = gltfRuntime.programs[technique.program];
        const states = technique.states;
        const vertexShader = Effect.ShadersStore[program.vertexShader + "VertexShader"];
        const pixelShader = Effect.ShadersStore[program.fragmentShader + "PixelShader"];
        let newVertexShader = "";
        let newPixelShader = "";
        const vertexTokenizer = new Tokenizer(vertexShader);
        const pixelTokenizer = new Tokenizer(pixelShader);
        const unTreatedUniforms = {};
        const uniforms = [];
        const attributes = [];
        const samplers = [];
        // Fill uniform, sampler2D and attributes
        for (const unif in technique.uniforms) {
            const uniform = technique.uniforms[unif];
            const uniformParameter = technique.parameters[uniform];
            unTreatedUniforms[unif] = uniformParameter;
            if (uniformParameter.semantic && !uniformParameter.node && !uniformParameter.source) {
                const transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                if (transformIndex !== -1) {
                    uniforms.push(babylonTransforms[transformIndex]);
                    delete unTreatedUniforms[unif];
                }
                else {
                    uniforms.push(unif);
                }
            }
            else if (uniformParameter.type === EParameterType.SAMPLER_2D) {
                samplers.push(unif);
            }
            else {
                uniforms.push(unif);
            }
        }
        for (const attr in technique.attributes) {
            const attribute = technique.attributes[attr];
            const attributeParameter = technique.parameters[attribute];
            if (attributeParameter.semantic) {
                const name = getAttribute(attributeParameter);
                if (name) {
                    attributes.push(name);
                }
            }
        }
        // Configure vertex shader
        while (!vertexTokenizer.isEnd() && vertexTokenizer.getNextToken()) {
            const tokenType = vertexTokenizer.currentToken;
            if (tokenType !== ETokenType.IDENTIFIER) {
                newVertexShader += vertexTokenizer.currentString;
                continue;
            }
            let foundAttribute = false;
            for (const attr in technique.attributes) {
                const attribute = technique.attributes[attr];
                const attributeParameter = technique.parameters[attribute];
                if (vertexTokenizer.currentIdentifier === attr && attributeParameter.semantic) {
                    newVertexShader += getAttribute(attributeParameter);
                    foundAttribute = true;
                    break;
                }
            }
            if (foundAttribute) {
                continue;
            }
            newVertexShader += parseShaderUniforms(vertexTokenizer, technique, unTreatedUniforms);
        }
        // Configure pixel shader
        while (!pixelTokenizer.isEnd() && pixelTokenizer.getNextToken()) {
            const tokenType = pixelTokenizer.currentToken;
            if (tokenType !== ETokenType.IDENTIFIER) {
                newPixelShader += pixelTokenizer.currentString;
                continue;
            }
            newPixelShader += parseShaderUniforms(pixelTokenizer, technique, unTreatedUniforms);
        }
        // Create shader material
        const shaderPath = {
            vertex: program.vertexShader + id,
            fragment: program.fragmentShader + id,
        };
        const options = {
            attributes: attributes,
            uniforms: uniforms,
            samplers: samplers,
            needAlphaBlending: states && states.enable && states.enable.indexOf(3042) !== -1,
        };
        Effect.ShadersStore[program.vertexShader + id + "VertexShader"] = newVertexShader;
        Effect.ShadersStore[program.fragmentShader + id + "PixelShader"] = newPixelShader;
        const shaderMaterial = new ShaderMaterial(id, gltfRuntime.scene, shaderPath, options);
        shaderMaterial.onError = onShaderCompileError(program, shaderMaterial, onError);
        shaderMaterial.onCompiled = onShaderCompileSuccess(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess);
        shaderMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;
        if (states && states.functions) {
            const functions = states.functions;
            if (functions.cullFace && functions.cullFace[0] !== ECullingType.BACK) {
                shaderMaterial.backFaceCulling = false;
            }
            const blendFunc = functions.blendFuncSeparate;
            if (blendFunc) {
                if (blendFunc[0] === EBlendingFunction.SRC_ALPHA &&
                    blendFunc[1] === EBlendingFunction.ONE_MINUS_SRC_ALPHA &&
                    blendFunc[2] === EBlendingFunction.ONE &&
                    blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_COMBINE;
                }
                else if (blendFunc[0] === EBlendingFunction.ONE &&
                    blendFunc[1] === EBlendingFunction.ONE &&
                    blendFunc[2] === EBlendingFunction.ZERO &&
                    blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_ONEONE;
                }
                else if (blendFunc[0] === EBlendingFunction.SRC_ALPHA &&
                    blendFunc[1] === EBlendingFunction.ONE &&
                    blendFunc[2] === EBlendingFunction.ZERO &&
                    blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_ADD;
                }
                else if (blendFunc[0] === EBlendingFunction.ZERO &&
                    blendFunc[1] === EBlendingFunction.ONE_MINUS_SRC_COLOR &&
                    blendFunc[2] === EBlendingFunction.ONE &&
                    blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_SUBTRACT;
                }
                else if (blendFunc[0] === EBlendingFunction.DST_COLOR &&
                    blendFunc[1] === EBlendingFunction.ZERO &&
                    blendFunc[2] === EBlendingFunction.ONE &&
                    blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_MULTIPLY;
                }
                else if (blendFunc[0] === EBlendingFunction.SRC_ALPHA &&
                    blendFunc[1] === EBlendingFunction.ONE_MINUS_SRC_COLOR &&
                    blendFunc[2] === EBlendingFunction.ONE &&
                    blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_MAXIMIZED;
                }
            }
        }
    }
}
/**
 * glTF V1 Loader
 * @internal
 * @deprecated
 */
export class GLTFLoader {
    static RegisterExtension(extension) {
        if (GLTFLoader.Extensions[extension.name]) {
            Tools.Error('Tool with the same name "' + extension.name + '" already exists');
            return;
        }
        GLTFLoader.Extensions[extension.name] = extension;
    }
    dispose() {
        // do nothing
    }
    _importMeshAsync(meshesNames, scene, data, rootUrl, assetContainer, onSuccess, onProgress, onError) {
        scene.useRightHandedSystem = true;
        GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, (gltfRuntime) => {
            gltfRuntime.assetContainer = assetContainer;
            gltfRuntime.importOnlyMeshes = true;
            if (meshesNames === "") {
                gltfRuntime.importMeshesNames = [];
            }
            else if (typeof meshesNames === "string") {
                gltfRuntime.importMeshesNames = [meshesNames];
            }
            else if (meshesNames && !(meshesNames instanceof Array)) {
                gltfRuntime.importMeshesNames = [meshesNames];
            }
            else {
                gltfRuntime.importMeshesNames = [];
                Tools.Warn("Argument meshesNames must be of type string or string[]");
            }
            // Create nodes
            this._createNodes(gltfRuntime);
            const meshes = [];
            const skeletons = [];
            // Fill arrays of meshes and skeletons
            for (const nde in gltfRuntime.nodes) {
                const node = gltfRuntime.nodes[nde];
                if (node.babylonNode instanceof AbstractMesh) {
                    meshes.push(node.babylonNode);
                }
            }
            for (const skl in gltfRuntime.skins) {
                const skin = gltfRuntime.skins[skl];
                if (skin.babylonSkeleton instanceof Skeleton) {
                    skeletons.push(skin.babylonSkeleton);
                }
            }
            // Load buffers, shaders, materials, etc.
            this._loadBuffersAsync(gltfRuntime, () => {
                this._loadShadersAsync(gltfRuntime, () => {
                    importMaterials(gltfRuntime);
                    postLoad(gltfRuntime);
                    if (!GLTFFileLoader.IncrementalLoading && onSuccess) {
                        onSuccess(meshes, skeletons);
                    }
                });
            });
            if (GLTFFileLoader.IncrementalLoading && onSuccess) {
                onSuccess(meshes, skeletons);
            }
        }, onError);
        return true;
    }
    /**
     * Imports one or more meshes from a loaded gltf file and adds them to the scene
     * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param assetContainer defines the asset container to use (can be null)
     * @param data gltf data containing information of the meshes in a loaded file
     * @param rootUrl root url to load from
     * @param onProgress event that fires when loading progress has occured
     * @returns a promise containg the loaded meshes, particles, skeletons and animations
     */
    importMeshAsync(meshesNames, scene, assetContainer, data, rootUrl, onProgress) {
        return new Promise((resolve, reject) => {
            this._importMeshAsync(meshesNames, scene, data, rootUrl, assetContainer, (meshes, skeletons) => {
                resolve({
                    meshes: meshes,
                    particleSystems: [],
                    skeletons: skeletons,
                    animationGroups: [],
                    lights: [],
                    transformNodes: [],
                    geometries: [],
                    spriteManagers: [],
                });
            }, onProgress, (message) => {
                reject(new Error(message));
            });
        });
    }
    _loadAsync(scene, data, rootUrl, onSuccess, onProgress, onError) {
        scene.useRightHandedSystem = true;
        GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, (gltfRuntime) => {
            // Load runtime extensios
            GLTFLoaderExtension.LoadRuntimeExtensionsAsync(gltfRuntime, () => {
                // Create nodes
                this._createNodes(gltfRuntime);
                // Load buffers, shaders, materials, etc.
                this._loadBuffersAsync(gltfRuntime, () => {
                    this._loadShadersAsync(gltfRuntime, () => {
                        importMaterials(gltfRuntime);
                        postLoad(gltfRuntime);
                        if (!GLTFFileLoader.IncrementalLoading) {
                            onSuccess();
                        }
                    });
                });
                if (GLTFFileLoader.IncrementalLoading) {
                    onSuccess();
                }
            }, onError);
        }, onError);
    }
    /**
     * Imports all objects from a loaded gltf file and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data gltf data containing information of the meshes in a loaded file
     * @param rootUrl root url to load from
     * @param onProgress event that fires when loading progress has occured
     * @returns a promise which completes when objects have been loaded to the scene
     */
    loadAsync(scene, data, rootUrl, onProgress) {
        return new Promise((resolve, reject) => {
            this._loadAsync(scene, data, rootUrl, () => {
                resolve();
            }, onProgress, (message) => {
                reject(new Error(message));
            });
        });
    }
    _loadShadersAsync(gltfRuntime, onload) {
        let hasShaders = false;
        const processShader = (sha, shader) => {
            GLTFLoaderExtension.LoadShaderStringAsync(gltfRuntime, sha, (shaderString) => {
                if (shaderString instanceof ArrayBuffer) {
                    return;
                }
                gltfRuntime.loadedShaderCount++;
                if (shaderString) {
                    Effect.ShadersStore[sha + (shader.type === EShaderType.VERTEX ? "VertexShader" : "PixelShader")] = shaderString;
                }
                if (gltfRuntime.loadedShaderCount === gltfRuntime.shaderscount) {
                    onload();
                }
            }, () => {
                Tools.Error("Error when loading shader program named " + sha + " located at " + shader.uri);
            });
        };
        for (const sha in gltfRuntime.shaders) {
            hasShaders = true;
            const shader = gltfRuntime.shaders[sha];
            if (shader) {
                processShader.bind(this, sha, shader)();
            }
            else {
                Tools.Error("No shader named: " + sha);
            }
        }
        if (!hasShaders) {
            onload();
        }
    }
    _loadBuffersAsync(gltfRuntime, onLoad) {
        let hasBuffers = false;
        const processBuffer = (buf, buffer) => {
            GLTFLoaderExtension.LoadBufferAsync(gltfRuntime, buf, (bufferView) => {
                gltfRuntime.loadedBufferCount++;
                if (bufferView) {
                    if (bufferView.byteLength != gltfRuntime.buffers[buf].byteLength) {
                        Tools.Error("Buffer named " + buf + " is length " + bufferView.byteLength + ". Expected: " + buffer.byteLength); // Improve error message
                    }
                    gltfRuntime.loadedBufferViews[buf] = bufferView;
                }
                if (gltfRuntime.loadedBufferCount === gltfRuntime.buffersCount) {
                    onLoad();
                }
            }, () => {
                Tools.Error("Error when loading buffer named " + buf + " located at " + buffer.uri);
            });
        };
        for (const buf in gltfRuntime.buffers) {
            hasBuffers = true;
            const buffer = gltfRuntime.buffers[buf];
            if (buffer) {
                processBuffer.bind(this, buf, buffer)();
            }
            else {
                Tools.Error("No buffer named: " + buf);
            }
        }
        if (!hasBuffers) {
            onLoad();
        }
    }
    _createNodes(gltfRuntime) {
        let currentScene = gltfRuntime.currentScene;
        if (currentScene) {
            // Only one scene even if multiple scenes are defined
            for (let i = 0; i < currentScene.nodes.length; i++) {
                traverseNodes(gltfRuntime, currentScene.nodes[i], null);
            }
        }
        else {
            // Load all scenes
            for (const thing in gltfRuntime.scenes) {
                currentScene = gltfRuntime.scenes[thing];
                for (let i = 0; i < currentScene.nodes.length; i++) {
                    traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                }
            }
        }
    }
}
GLTFLoader.Extensions = {};
/** @internal */
export class GLTFLoaderExtension {
    constructor(name) {
        this._name = name;
    }
    get name() {
        return this._name;
    }
    /**
     * Defines an override for loading the runtime
     * Return true to stop further extensions from loading the runtime
     * @param scene
     * @param data
     * @param rootUrl
     * @param onSuccess
     * @param onError
     * @returns true to stop further extensions from loading the runtime
     */
    loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError) {
        return false;
    }
    /**
     * Defines an onverride for creating gltf runtime
     * Return true to stop further extensions from creating the runtime
     * @param gltfRuntime
     * @param onSuccess
     * @param onError
     * @returns true to stop further extensions from creating the runtime
     */
    loadRuntimeExtensionsAsync(gltfRuntime, onSuccess, onError) {
        return false;
    }
    /**
     * Defines an override for loading buffers
     * Return true to stop further extensions from loading this buffer
     * @param gltfRuntime
     * @param id
     * @param onSuccess
     * @param onError
     * @param onProgress
     * @returns true to stop further extensions from loading this buffer
     */
    loadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress) {
        return false;
    }
    /**
     * Defines an override for loading texture buffers
     * Return true to stop further extensions from loading this texture data
     * @param gltfRuntime
     * @param id
     * @param onSuccess
     * @param onError
     * @returns true to stop further extensions from loading this texture data
     */
    loadTextureBufferAsync(gltfRuntime, id, onSuccess, onError) {
        return false;
    }
    /**
     * Defines an override for creating textures
     * Return true to stop further extensions from loading this texture
     * @param gltfRuntime
     * @param id
     * @param buffer
     * @param onSuccess
     * @param onError
     * @returns true to stop further extensions from loading this texture
     */
    createTextureAsync(gltfRuntime, id, buffer, onSuccess, onError) {
        return false;
    }
    /**
     * Defines an override for loading shader strings
     * Return true to stop further extensions from loading this shader data
     * @param gltfRuntime
     * @param id
     * @param onSuccess
     * @param onError
     * @returns true to stop further extensions from loading this shader data
     */
    loadShaderStringAsync(gltfRuntime, id, onSuccess, onError) {
        return false;
    }
    /**
     * Defines an override for loading materials
     * Return true to stop further extensions from loading this material
     * @param gltfRuntime
     * @param id
     * @param onSuccess
     * @param onError
     * @returns true to stop further extensions from loading this material
     */
    loadMaterialAsync(gltfRuntime, id, onSuccess, onError) {
        return false;
    }
    // ---------
    // Utilities
    // ---------
    static LoadRuntimeAsync(scene, data, rootUrl, onSuccess, onError) {
        GLTFLoaderExtension._ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError);
        }, () => {
            setTimeout(() => {
                if (!onSuccess) {
                    return;
                }
                onSuccess(GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
            });
        });
    }
    static LoadRuntimeExtensionsAsync(gltfRuntime, onSuccess, onError) {
        GLTFLoaderExtension._ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadRuntimeExtensionsAsync(gltfRuntime, onSuccess, onError);
        }, () => {
            setTimeout(() => {
                onSuccess();
            });
        });
    }
    static LoadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress) {
        GLTFLoaderExtension._ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
        }, () => {
            GLTFLoaderBase.LoadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
        });
    }
    static LoadTextureAsync(gltfRuntime, id, onSuccess, onError) {
        GLTFLoaderExtension._LoadTextureBufferAsync(gltfRuntime, id, (buffer) => {
            if (buffer) {
                GLTFLoaderExtension._CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
            }
        }, onError);
    }
    static LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError) {
        GLTFLoaderExtension._ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
        }, () => {
            GLTFLoaderBase.LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
        });
    }
    static LoadMaterialAsync(gltfRuntime, id, onSuccess, onError) {
        GLTFLoaderExtension._ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
        }, () => {
            GLTFLoaderBase.LoadMaterialAsync(gltfRuntime, id, onSuccess, onError);
        });
    }
    static _LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError) {
        GLTFLoaderExtension._ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
        }, () => {
            GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
        });
    }
    static _CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError) {
        GLTFLoaderExtension._ApplyExtensions((loaderExtension) => {
            return loaderExtension.createTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
        }, () => {
            GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess);
        });
    }
    static _ApplyExtensions(func, defaultFunc) {
        for (const extensionName in GLTFLoader.Extensions) {
            const loaderExtension = GLTFLoader.Extensions[extensionName];
            if (func(loaderExtension)) {
                return;
            }
        }
        defaultFunc();
    }
}
GLTFFileLoader._CreateGLTF1Loader = () => new GLTFLoader();
//# sourceMappingURL=glTFLoader.js.map