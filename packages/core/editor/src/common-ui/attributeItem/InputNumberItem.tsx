import {Fragment} from "react";
import {Form, InputNumber} from "antd";
import {useItemUpdate} from "./useItemUpdate";
import {BaseItemProps} from "./BaseItemProps";
import {Quaternion, Tools} from "@babylonjs/core";
import {get} from "lodash-es";
import {useObjectAttribute} from "../objectAttribute";

export interface IInputNumberItemProps extends BaseItemProps {
    // 值转为度数
    toDegrees?: boolean;
    // 是四元数
    isQuaternion?: boolean
}

export function InputNumberItem(props: IInputNumberItemProps) {
    const {syncChange, toDegrees, isQuaternion, virtual, ...rest} = props
    const {object, change} = useObjectAttribute(); // 获取与对象相关的属性

    const _convertData = (value) => {
        if (isQuaternion) {
            let rotationQuaternion = get(object, "rotationQuaternion") as Quaternion;
            if (rotationQuaternion === null) {
                rotationQuaternion = new Quaternion();
            }
            const eulerAngles = rotationQuaternion.toEulerAngles();
            let degrees = get(eulerAngles, props.name[props.name?.length - 1]);
            return Tools.ToDegrees(degrees)
        }
        if (toDegrees) {
            return Tools.ToDegrees(value)
        }
        return value
    }

    const isAutoConvertData = () => {
        if (isQuaternion) {
            return true
        }
        if (toDegrees) {
            return true
        }
        return false
    }

    const {isValue} = useItemUpdate({
        ...props,
        convertData: isAutoConvertData() ? _convertData : undefined
    });
    return (
        <Fragment>
            {
                isValue &&
                <Form.Item {...rest}>
                    <InputNumber size="small"/>
                </Form.Item>
            }
        </Fragment>
    )
}

