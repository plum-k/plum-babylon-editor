import {HtmlMesh} from "@babylonjs/addons";

export function isHtmlMesh(value: any): value is HtmlMesh {
    return value instanceof HtmlMesh;
}


