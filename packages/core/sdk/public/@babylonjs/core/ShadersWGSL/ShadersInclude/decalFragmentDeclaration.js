// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "decalFragmentDeclaration";
const shader = `#ifdef DECAL
uniform vDecalInfos: vec4f;
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const decalFragmentDeclarationWGSL = { name, shader };
//# sourceMappingURL=decalFragmentDeclaration.js.map