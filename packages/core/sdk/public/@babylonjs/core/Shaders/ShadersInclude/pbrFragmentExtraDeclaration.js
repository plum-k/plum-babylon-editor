// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
import "./mainUVVaryingDeclaration.js";
const name = "pbrFragmentExtraDeclaration";
const shader = `varying vec3 vPositionW;
#if DEBUGMODE>0
varying vec4 vClipSpacePosition;
#endif
#include<mainUVVaryingDeclaration>[1..7]
#ifdef NORMAL
varying vec3 vNormalW;
#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
varying vec3 vEnvironmentIrradiance;
#endif
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const pbrFragmentExtraDeclaration = { name, shader };
//# sourceMappingURL=pbrFragmentExtraDeclaration.js.map