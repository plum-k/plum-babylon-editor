import {Fragment} from "react";
import {Form, Slider} from "antd";
import {useItemUpdate} from "./useItemUpdate";
import {BaseItemProps} from "./BaseItemProps";
import {SliderRangeProps, SliderSingleProps} from "antd/es/slider";

export interface ISliderItemProps extends BaseItemProps<SliderSingleProps | SliderRangeProps> {

}

export function SliderItem(props: ISliderItemProps) {
    const {syncChange, fieldProps, ...rest} = props
    const {isValue} = useItemUpdate(props);
    return (
        <Fragment>
            {
                isValue &&
                <Form.Item {...rest}>
                    <Slider {...fieldProps}/>
                </Form.Item>
            }
        </Fragment>
    )
}

