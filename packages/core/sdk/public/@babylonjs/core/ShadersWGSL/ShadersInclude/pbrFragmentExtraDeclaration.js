// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
import "./mainUVVaryingDeclaration.js";
const name = "pbrFragmentExtraDeclaration";
const shader = `varying vPositionW: vec3f;
#if DEBUGMODE>0
varying vClipSpacePosition: vec4f;
#endif
#include<mainUVVaryingDeclaration>[1..7]
#ifdef NORMAL
varying vNormalW: vec3f;
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
varying vEnvironmentIrradiance: vec3f;
#endif
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const pbrFragmentExtraDeclarationWGSL = { name, shader };
//# sourceMappingURL=pbrFragmentExtraDeclaration.js.map