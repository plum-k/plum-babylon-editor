import {Col, Form, Row} from "antd";
import {BaseItemProps} from "./BaseItemProps";
import {Fragment} from "react";
import {InputNumberItem} from "./index";
import {useItemUpdate} from "./useItemUpdate";

export interface IVector3ItemProps extends BaseItemProps {
    isVertical?: boolean;
    basePropertyName: Array<string>;
    // 值转为度数
    toDegrees?: boolean;
    // 是四元数
    isQuaternion?: boolean
}

export function Vector3Item(props: IVector3ItemProps) {
    const {basePropertyName, convertData, isVertical, toDegrees, isQuaternion, ...rest} = {isVertical: true, ...props}
    const {isValue} = useItemUpdate(props);

    return (
        <Fragment>
            {
                isValue &&
                <Form.Item {...rest}>
                    {
                        isVertical ? <Fragment>
                                <InputNumberItem label={"x"} name={[...basePropertyName, "x"]} toDegrees={toDegrees}
                                                 isQuaternion={isQuaternion}/>
                                <InputNumberItem label={"y"} name={[...basePropertyName, "y"]} toDegrees={toDegrees}
                                                 isQuaternion={isQuaternion}/>
                                <InputNumberItem label={"z"} name={[...basePropertyName, "z"]} toDegrees={toDegrees}
                                                 isQuaternion={isQuaternion}/>
                            </Fragment>
                            : <Row>
                                <Col span={"8"}>
                                    <InputNumberItem label={"x"} name={[...basePropertyName, "x"]} toDegrees={toDegrees}
                                                     isQuaternion={isQuaternion}/>
                                </Col>
                                <Col span={"8"}>
                                    <InputNumberItem label={"y"} name={[...basePropertyName, "y"]} toDegrees={toDegrees}
                                                     isQuaternion={isQuaternion}/>
                                </Col>
                                <Col span={"8"}>
                                    <InputNumberItem label={"z"} name={[...basePropertyName, "z"]} toDegrees={toDegrees}
                                                     isQuaternion={isQuaternion}/>
                                </Col>
                            </Row>
                    }
                </Form.Item>}
        </Fragment>
    )
}

