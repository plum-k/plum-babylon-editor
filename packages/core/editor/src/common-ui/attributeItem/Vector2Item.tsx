import {Col, Form, Row} from "antd";
import {BaseItemProps} from "./BaseItemProps";
import {Fragment} from "react";
import {InputNumberItem, useItemUpdate} from "./index";

export interface IVector2ItemProps extends BaseItemProps {
    basePropertyName: Array<string>;
}

export function Vector2Item(props: IVector2ItemProps) {
    const {basePropertyName, convertData, isVertical, ...rest} = {isVertical: true, ...props}
    const {isValue} = useItemUpdate(props);
    return (
        <Fragment>
            {
                isValue &&
                <Form.Item {...rest}>
                    {
                        isVertical ? <Fragment>
                                <InputNumberItem syncChange label={"x"} name={[...basePropertyName, "x"]}/>
                                <InputNumberItem syncChange label={"x"} name={[...basePropertyName, "y"]}/>
                            </Fragment>
                            : <Row>
                                <Col span={"8"}>
                                    <InputNumberItem syncChange label={"x"} name={[...basePropertyName, "x"]}/>
                                </Col>
                                <Col span={"8"}>
                                    <InputNumberItem syncChange label={"y"} name={[...basePropertyName, "y"]}/>
                                </Col>
                            </Row>

                    }
                </Form.Item>}
        </Fragment>
    )
}


