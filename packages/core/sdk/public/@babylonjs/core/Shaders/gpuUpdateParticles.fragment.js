// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "gpuUpdateParticlesPixelShader";
const shader = `#version 300 es
void main() {discard;}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const gpuUpdateParticlesPixelShader = { name, shader };
//# sourceMappingURL=gpuUpdateParticles.fragment.js.map