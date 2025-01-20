// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "fresnelFunction";
const shader = `#ifdef FRESNEL
float computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)
{float fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);return clamp(fresnelTerm,0.,1.);}
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const fresnelFunction = { name, shader };
//# sourceMappingURL=fresnelFunction.js.map