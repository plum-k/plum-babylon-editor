import {HtmlMesh} from "babylon-htmlmesh";

export function isHtmlMesh(value: any): value is HtmlMesh {
    return value instanceof HtmlMesh;
}


