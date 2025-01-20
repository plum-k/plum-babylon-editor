// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "copyTexture3DLayerToTexturePixelShader";
const shader = `precision highp sampler3D;uniform sampler3D textureSampler;uniform int layerNum;varying vec2 vUV;void main(void) {vec3 coord=vec3(0.0,0.0,float(layerNum));coord.xy=vec2(vUV.x,vUV.y)*vec2(textureSize(textureSampler,0).xy);vec3 color=texelFetch(textureSampler,ivec3(coord),0).rgb;gl_FragColor=vec4(color,1);}
`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const copyTexture3DLayerToTexturePixelShader = { name, shader };
//# sourceMappingURL=copyTexture3DLayerToTexture.fragment.js.map