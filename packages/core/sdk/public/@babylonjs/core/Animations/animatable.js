import { Bone } from "../Bones/bone.js";
import { AddAnimationExtensions } from "./animatable.core.js";
import { Scene } from "../scene.js";
export * from "./animatable.core.js";
// Connect everything!
AddAnimationExtensions(Scene, Bone);
//# sourceMappingURL=animatable.js.map