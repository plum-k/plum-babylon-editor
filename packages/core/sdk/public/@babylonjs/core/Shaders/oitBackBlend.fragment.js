// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "oitBackBlendPixelShader";
const shader = `precision highp float;uniform sampler2D uBackColor;void main() {glFragColor=texelFetch(uBackColor,ivec2(gl_FragCoord.xy),0);if (glFragColor.a==0.0) { 
discard;}}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const oitBackBlendPixelShader = { name, shader };
//# sourceMappingURL=oitBackBlend.fragment.js.map