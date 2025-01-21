import {Fragment} from "react";
import {ColorItem, InputNumberItem, Vector3Item} from "../../../../common-ui";
import {LightShadowAttribute} from "./LightShadowAttribute.tsx";

export function SpotLightAttribute() {
    return (
        <Fragment>
            <InputNumberItem name={["intensity"]} label="强度"/>
            <ColorItem name={["diffuse"]} label="漫反射颜色"/>
            <ColorItem name={["specular"]} label="镜面颜色"/>
            <Vector3Item name={["position"]} label="位置" basePropertyName={["position"]}/>
            <Vector3Item name={["direction"]} label="方向" basePropertyName={["direction"]} isQuaternion/>
            <InputNumberItem name={["angle"]} label="角度"/>
            <InputNumberItem name={["innerAngle"]} label="内角"/>
            <InputNumberItem name={["exponent"]} label="指数"/>
            <LightShadowAttribute/>
        </Fragment>
    )
}
