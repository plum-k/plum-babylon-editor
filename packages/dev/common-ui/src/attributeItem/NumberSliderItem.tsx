import {FC, Fragment} from "react";
import {Col, Form, InputNumber, Row, Slider} from "antd";
import useItemUpdate from "./useItemUpdate.ts";
import BaseItemProps from "./BaseItemProps.ts";
import {Tools} from "@babylonjs/core";

export interface INumberSliderItemProps extends BaseItemProps {
    max?: number;
    min?: number;
    step?: number;
    // 值转为度数
    toDegrees?: boolean;
}

const NumberSliderItem: FC<INumberSliderItemProps> = (props: INumberSliderItemProps) => {
    const {syncChange, name, min, max, step, toDegrees, ...rest} = props;
    const {isValue} = useItemUpdate({
        ...props,
        convertData: (value) => {
            if (toDegrees) {
                return Tools.ToDegrees(value)
            }
            return value
        }
    });
    return (
        <Fragment>
            {
                isValue &&
                <Form.Item {...rest}>
                    <Row>
                        <Col span={4}>
                            <Form.Item name={name}>
                                <InputNumber style={{width: "40px"}} size="small" controls={false} min={min} max={max}
                                             step={step}/>
                            </Form.Item>
                        </Col>
                        <Col span={12} style={{marginLeft: "10px"}}>
                            <Form.Item name={name}>
                                <Slider min={min} max={max} step={step}/>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form.Item>
            }
        </Fragment>
    )
}

export default NumberSliderItem;
