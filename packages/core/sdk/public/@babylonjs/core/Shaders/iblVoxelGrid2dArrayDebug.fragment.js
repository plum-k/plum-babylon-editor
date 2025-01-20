// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
const name = "iblVoxelGrid2dArrayDebugPixelShader";
const shader = `precision highp sampler2DArray;varying vec2 vUV;uniform sampler2DArray voxelTexture;uniform sampler2D textureSampler;uniform int slice;void main(void) {ivec3 size=textureSize(voxelTexture,0);float dimension=sqrt(float(size.z));vec2 samplePos=fract(vUV.xy*vec2(dimension));int sampleIndex=int(floor(vUV.x*float(dimension))+floor(vUV.y*float(dimension))*dimension);glFragColor.rgb=texture(voxelTexture,vec3(samplePos.xy,sampleIndex)).rrr;glFragColor.a=1.0;glFragColor.rgb+=texture(textureSampler,vUV.xy).rgb;}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const iblVoxelGrid2dArrayDebugPixelShader = { name, shader };
//# sourceMappingURL=iblVoxelGrid2dArrayDebug.fragment.js.map