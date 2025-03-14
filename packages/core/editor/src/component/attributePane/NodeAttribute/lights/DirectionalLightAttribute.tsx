import {Fragment} from "react";
import {ColorItem, InputNumberItem, Vector3Item} from "../../../../common-ui";
import {LightShadowAttribute} from "./LightShadowAttribute.tsx";

export function DirectionalLightAttribute() {
    return (
        <Fragment>
            <InputNumberItem name={["intensity"]} label="强度"/>
            <Vector3Item basePropertyName={["position"]} label="位置"/>
            <Vector3Item basePropertyName={["direction"]} label="方向" toDegrees/>
            <ColorItem name={["diffuse"]} label="漫反射颜色"/>
            <ColorItem name={["specular"]} label="镜面颜色"/>
            <LightShadowAttribute/>
        </Fragment>
    )
}
