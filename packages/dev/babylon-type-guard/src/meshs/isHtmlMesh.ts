import {type HtmlMesh} from "@babylonjs/addons";
import { invoke} from "lodash-es";
export function isHtmlMesh(value: any): value is HtmlMesh {
    return invoke(value, "getClassName") === "HtmlMesh";
}


