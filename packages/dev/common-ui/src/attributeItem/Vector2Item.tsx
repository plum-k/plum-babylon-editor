import {Col, Form, Row} from "antd";
import BaseItemProps from "./BaseItemProps.ts";
import {FC, Fragment} from "react";
import {InputNumberItem, ISliderItemProps} from "./index.ts";
import useItemUpdate from "./useItemUpdate.ts";

export interface IVector2ItemProps extends BaseItemProps {

}
export default function Vector2Item(props: IVector2ItemProps) {
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


