// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "fluidRenderingParticleDiffusePixelShader";
const shader = `uniform float particleAlpha;varying vec2 uv;varying vec3 diffuseColor;void main(void) {vec3 normal;normal.xy=uv*2.0-1.0;float r2=dot(normal.xy,normal.xy);if (r2>1.0) discard;glFragColor=vec4(diffuseColor,1.0);}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const fluidRenderingParticleDiffusePixelShader = { name, shader };
//# sourceMappingURL=fluidRenderingParticleDiffuse.fragment.js.map