// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "oitFinalPixelShader";
const shader = `precision highp float;uniform sampler2D uFrontColor;uniform sampler2D uBackColor;void main() {ivec2 fragCoord=ivec2(gl_FragCoord.xy);vec4 frontColor=texelFetch(uFrontColor,fragCoord,0);vec4 backColor=texelFetch(uBackColor,fragCoord,0);float alphaMultiplier=1.0-frontColor.a;glFragColor=vec4(
frontColor.rgb+alphaMultiplier*backColor.rgb,
frontColor.a+backColor.a
);}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const oitFinalPixelShader = { name, shader };
//# sourceMappingURL=oitFinal.fragment.js.map