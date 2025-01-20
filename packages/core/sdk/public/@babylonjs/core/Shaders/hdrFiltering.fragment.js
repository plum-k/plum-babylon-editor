// Do not edit.
import { ShaderStore } from "../Engines/shaderStore.js";
import "./ShadersInclude/helperFunctions.js";
import "./ShadersInclude/importanceSampling.js";
import "./ShadersInclude/pbrBRDFFunctions.js";
import "./ShadersInclude/hdrFilteringFunctions.js";
const name = "hdrFilteringPixelShader";
const shader = `#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform float alphaG;uniform samplerCube inputTexture;uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=radiance(alphaG,inputTexture,direction,vFilteringInfo);gl_FragColor=vec4(color*hdrScale,1.0);}`;
// Sideeffect
ShaderStore.ShadersStore[name] = shader;
/** @internal */
export const hdrFilteringPixelShader = { name, shader };
//# sourceMappingURL=hdrFiltering.fragment.js.map