import { Mesh } from "../Meshes/mesh.js";
import { GPUParticleSystem } from "./gpuParticleSystem.js";
import { ParticleSystem } from "./particleSystem.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { AbstractEngine } from "../Engines/abstractEngine.js";
import { AddParser, AddIndividualParser, GetIndividualParser } from "../Loading/Plugins/babylonFileParser.function.js";
// Adds the parsers to the scene parsers.
AddParser(SceneComponentConstants.NAME_PARTICLESYSTEM, (parsedData, scene, container, rootUrl) => {
    const individualParser = GetIndividualParser(SceneComponentConstants.NAME_PARTICLESYSTEM);
    if (!individualParser) {
        return;
    }
    // Particles Systems
    if (parsedData.particleSystems !== undefined && parsedData.particleSystems !== null) {
        for (let index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
            const parsedParticleSystem = parsedData.particleSystems[index];
            container.particleSystems.push(individualParser(parsedParticleSystem, scene, rootUrl));
        }
    }
});
AddIndividualParser(SceneComponentConstants.NAME_PARTICLESYSTEM, (parsedParticleSystem, scene, rootUrl) => {
    if (parsedParticleSystem.activeParticleCount) {
        const ps = GPUParticleSystem.Parse(parsedParticleSystem, scene, rootUrl);
        return ps;
    }
    else {
        const ps = ParticleSystem.Parse(parsedParticleSystem, scene, rootUrl);
        return ps;
    }
});
AbstractEngine.prototype.createEffectForParticles = function (fragmentName, uniformsNames = [], samplers = [], defines = "", fallbacks, onCompiled, onError, particleSystem, shaderLanguage = 0 /* ShaderLanguage.GLSL */) {
    let attributesNamesOrOptions = [];
    let effectCreationOption = [];
    const allSamplers = [];
    if (particleSystem) {
        particleSystem.fillUniformsAttributesAndSamplerNames(effectCreationOption, attributesNamesOrOptions, allSamplers);
    }
    else {
        attributesNamesOrOptions = ParticleSystem._GetAttributeNamesOrOptions();
        effectCreationOption = ParticleSystem._GetEffectCreationOptions();
    }
    if (defines.indexOf(" BILLBOARD") === -1) {
        defines += "\n#define BILLBOARD\n";
    }
    if (particleSystem?.isAnimationSheetEnabled) {
        if (defines.indexOf(" ANIMATESHEET") === -1) {
            defines += "\n#define ANIMATESHEET\n";
        }
    }
    if (samplers.indexOf("diffuseSampler") === -1) {
        samplers.push("diffuseSampler");
    }
    return this.createEffect({
        vertex: particleSystem?.vertexShaderName ?? "particles",
        fragmentElement: fragmentName,
    }, attributesNamesOrOptions, effectCreationOption.concat(uniformsNames), allSamplers.concat(samplers), defines, fallbacks, onCompiled, onError, undefined, shaderLanguage, async () => {
        if (shaderLanguage === 0 /* ShaderLanguage.GLSL */) {
            await import("../Shaders/particles.vertex.js");
        }
        else {
            await import("../ShadersWGSL/particles.vertex.js");
        }
    });
};
Mesh.prototype.getEmittedParticleSystems = function () {
    const results = [];
    for (let index = 0; index < this.getScene().particleSystems.length; index++) {
        const particleSystem = this.getScene().particleSystems[index];
        if (particleSystem.emitter === this) {
            results.push(particleSystem);
        }
    }
    return results;
};
Mesh.prototype.getHierarchyEmittedParticleSystems = function () {
    const results = [];
    const descendants = this.getDescendants();
    descendants.push(this);
    for (let index = 0; index < this.getScene().particleSystems.length; index++) {
        const particleSystem = this.getScene().particleSystems[index];
        const emitter = particleSystem.emitter;
        if (emitter.position && descendants.indexOf(emitter) !== -1) {
            results.push(particleSystem);
        }
    }
    return results;
};
//# sourceMappingURL=particleSystemComponent.js.map