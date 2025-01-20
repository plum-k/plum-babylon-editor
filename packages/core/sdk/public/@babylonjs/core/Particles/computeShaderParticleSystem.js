import { StorageBuffer } from "../Buffers/storageBuffer.js";
import { ComputeShader } from "../Compute/computeShader.js";
import { UniformBuffer } from "../Materials/uniformBuffer.js";

import { UniformBufferEffectCommonAccessor } from "../Materials/uniformBufferEffectCommonAccessor.js";
import { RegisterClass } from "../Misc/typeStore.js";
import "../ShadersWGSL/gpuUpdateParticles.compute.js";
/** @internal */
export class ComputeShaderParticleSystem {
    constructor(parent, engine) {
        this._bufferComputeShader = [];
        this._renderVertexBuffers = [];
        this.alignDataInBuffer = true;
        this._parent = parent;
        this._engine = engine;
    }
    contextLost() {
        this._updateComputeShader = undefined;
        this._bufferComputeShader.length = 0;
        this._renderVertexBuffers.length = 0;
    }
    isUpdateBufferCreated() {
        return !!this._updateComputeShader;
    }
    isUpdateBufferReady() {
        return this._updateComputeShader?.isReady() ?? false;
    }
    createUpdateBuffer(defines) {
        const bindingsMapping = {
            params: { group: 0, binding: 0 },
            particlesIn: { group: 0, binding: 1 },
            particlesOut: { group: 0, binding: 2 },
            randomTexture: { group: 0, binding: 3 },
            randomTexture2: { group: 0, binding: 4 },
        };
        if (this._parent._sizeGradientsTexture) {
            bindingsMapping["sizeGradientTexture"] = { group: 1, binding: 1 };
        }
        if (this._parent._angularSpeedGradientsTexture) {
            bindingsMapping["angularSpeedGradientTexture"] = { group: 1, binding: 3 };
        }
        if (this._parent._velocityGradientsTexture) {
            bindingsMapping["velocityGradientTexture"] = { group: 1, binding: 5 };
        }
        if (this._parent._limitVelocityGradientsTexture) {
            bindingsMapping["limitVelocityGradientTexture"] = { group: 1, binding: 7 };
        }
        if (this._parent._dragGradientsTexture) {
            bindingsMapping["dragGradientTexture"] = { group: 1, binding: 9 };
        }
        if (this._parent.noiseTexture) {
            bindingsMapping["noiseTexture"] = { group: 1, binding: 11 };
        }
        this._updateComputeShader = new ComputeShader("updateParticles", this._engine, "gpuUpdateParticles", { bindingsMapping, defines: defines.split("\n") });
        this._simParamsComputeShader?.dispose();
        this._simParamsComputeShader = new UniformBuffer(this._engine, undefined, undefined, "ComputeShaderParticleSystemUBO");
        this._simParamsComputeShader.addUniform("currentCount", 1);
        this._simParamsComputeShader.addUniform("timeDelta", 1);
        this._simParamsComputeShader.addUniform("stopFactor", 1);
        this._simParamsComputeShader.addUniform("randomTextureSize", 1);
        this._simParamsComputeShader.addUniform("lifeTime", 2);
        this._simParamsComputeShader.addUniform("emitPower", 2);
        if (!this._parent._colorGradientsTexture) {
            this._simParamsComputeShader.addUniform("color1", 4);
            this._simParamsComputeShader.addUniform("color2", 4);
        }
        this._simParamsComputeShader.addUniform("sizeRange", 2);
        this._simParamsComputeShader.addUniform("scaleRange", 4);
        this._simParamsComputeShader.addUniform("angleRange", 4);
        this._simParamsComputeShader.addUniform("gravity", 3);
        if (this._parent._limitVelocityGradientsTexture) {
            this._simParamsComputeShader.addUniform("limitVelocityDamping", 1);
        }
        if (this._parent.isAnimationSheetEnabled) {
            this._simParamsComputeShader.addUniform("cellInfos", 4);
        }
        if (this._parent.noiseTexture) {
            this._simParamsComputeShader.addUniform("noiseStrength", 3);
        }
        if (!this._parent.isLocal) {
            this._simParamsComputeShader.addUniform("emitterWM", 16);
        }
        if (this._parent.particleEmitterType) {
            this._parent.particleEmitterType.buildUniformLayout(this._simParamsComputeShader);
        }
        this._updateComputeShader.setUniformBuffer("params", this._simParamsComputeShader);
        return new UniformBufferEffectCommonAccessor(this._simParamsComputeShader);
    }
    createVertexBuffers(updateBuffer, renderVertexBuffers) {
        this._renderVertexBuffers.push(renderVertexBuffers);
    }
    createParticleBuffer(data) {
        const buffer = new StorageBuffer(this._engine, data.length * 4, 3 | 8, "ComputeShaderParticleSystemBuffer");
        buffer.update(data);
        this._bufferComputeShader.push(buffer);
        return buffer.getBuffer();
    }
    bindDrawBuffers(index, effect, indexBuffer) {
        this._engine.bindBuffers(this._renderVertexBuffers[index], indexBuffer, effect);
    }
    preUpdateParticleBuffer() { }
    updateParticleBuffer(index, targetBuffer, currentActiveCount) {
        this._simParamsComputeShader.update();
        this._updateComputeShader.setTexture("randomTexture", this._parent._randomTexture, false);
        this._updateComputeShader.setTexture("randomTexture2", this._parent._randomTexture2, false);
        if (this._parent._sizeGradientsTexture) {
            this._updateComputeShader.setTexture("sizeGradientTexture", this._parent._sizeGradientsTexture);
        }
        if (this._parent._angularSpeedGradientsTexture) {
            this._updateComputeShader.setTexture("angularSpeedGradientTexture", this._parent._angularSpeedGradientsTexture);
        }
        if (this._parent._velocityGradientsTexture) {
            this._updateComputeShader.setTexture("velocityGradientTexture", this._parent._velocityGradientsTexture);
        }
        if (this._parent._limitVelocityGradientsTexture) {
            this._updateComputeShader.setTexture("limitVelocityGradientTexture", this._parent._limitVelocityGradientsTexture);
        }
        if (this._parent._dragGradientsTexture) {
            this._updateComputeShader.setTexture("dragGradientTexture", this._parent._dragGradientsTexture);
        }
        if (this._parent.noiseTexture) {
            this._updateComputeShader.setTexture("noiseTexture", this._parent.noiseTexture);
        }
        this._updateComputeShader.setStorageBuffer("particlesIn", this._bufferComputeShader[index]);
        this._updateComputeShader.setStorageBuffer("particlesOut", this._bufferComputeShader[index ^ 1]);
        this._updateComputeShader.dispatch(Math.ceil(currentActiveCount / 64));
    }
    releaseBuffers() {
        for (let i = 0; i < this._bufferComputeShader.length; ++i) {
            this._bufferComputeShader[i].dispose();
        }
        this._bufferComputeShader.length = 0;
        this._simParamsComputeShader?.dispose();
        this._simParamsComputeShader = null;
        this._updateComputeShader = null;
    }
    releaseVertexBuffers() {
        this._renderVertexBuffers.length = 0;
    }
}
RegisterClass("BABYLON.ComputeShaderParticleSystem", ComputeShaderParticleSystem);
//# sourceMappingURL=computeShaderParticleSystem.js.map