// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "sceneFragmentDeclaration";
const shader = `uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
uniform mat4 view;uniform mat4 projection;uniform vec4 vEyePosition;
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const sceneFragmentDeclaration = { name, shader };
//# sourceMappingURL=sceneFragmentDeclaration.js.map