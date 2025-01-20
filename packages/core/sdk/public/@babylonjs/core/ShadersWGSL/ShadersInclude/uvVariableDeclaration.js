// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "uvVariableDeclaration";
const shader = `#ifdef MAINUV{X}
#if !defined(UV{X})
var uv{X}: vec2f=vec2f(0.,0.);
#else
var uv{X}: vec2f=vertexInputs.uv{X};
#endif
vertexOutputs.vMainUV{X}=uv{X};
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStoreWGSL[name] = shader;
/** @internal */
export const uvVariableDeclarationWGSL = { name, shader };
//# sourceMappingURL=uvVariableDeclaration.js.map