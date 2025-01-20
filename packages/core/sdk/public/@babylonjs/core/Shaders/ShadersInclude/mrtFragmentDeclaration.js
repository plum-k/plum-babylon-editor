// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "mrtFragmentDeclaration";
const shader = `#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
layout(location=0) out vec4 glFragData[{X}];
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const mrtFragmentDeclaration = { name, shader };
//# sourceMappingURL=mrtFragmentDeclaration.js.map