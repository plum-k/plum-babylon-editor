// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "uvVariableDeclaration";
const shader = `#if !defined(UV{X}) && defined(MAINUV{X})
vec2 uv{X}=vec2(0.,0.);
#endif
#ifdef MAINUV{X}
vMainUV{X}=uv{X};
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const uvVariableDeclaration = { name, shader };
//# sourceMappingURL=uvVariableDeclaration.js.map