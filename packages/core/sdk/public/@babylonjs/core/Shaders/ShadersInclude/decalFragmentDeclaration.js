// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "decalFragmentDeclaration";
const shader = `#ifdef DECAL
uniform vec4 vDecalInfos;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const decalFragmentDeclaration = { name, shader };
//# sourceMappingURL=decalFragmentDeclaration.js.map