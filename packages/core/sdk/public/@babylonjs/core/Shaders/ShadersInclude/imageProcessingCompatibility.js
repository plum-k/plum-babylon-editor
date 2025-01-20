// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore.js";
const name = "imageProcessingCompatibility";
const shader = `#ifdef IMAGEPROCESSINGPOSTPROCESS
gl_FragColor.rgb=pow(gl_FragColor.rgb,vec3(2.2));
#endif
`;
// Sideeffect
ShaderStore.IncludesShadersStore[name] = shader;
/** @internal */
export const imageProcessingCompatibility = { name, shader };
//# sourceMappingURL=imageProcessingCompatibility.js.map