// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "taaPixelShader";
const shader = `varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D historySampler;uniform float factor;void main() {vec4 c=texelFetch(textureSampler,ivec2(gl_FragCoord.xy),0);vec4 h=texelFetch(historySampler,ivec2(gl_FragCoord.xy),0);gl_FragColor=mix(h,c,factor);}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const taaPixelShader = { name, shader };
//# sourceMappingURL=taa.fragment.js.map