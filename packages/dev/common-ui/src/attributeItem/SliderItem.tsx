import {FC, Fragment} from "react";
import {Form, Slider} from "antd";
import useItemUpdate from "./useItemUpdate.ts";
import BaseItemProps from "./BaseItemProps.ts";
import {SliderRangeProps, SliderSingleProps} from "antd/es/slider";
import {ISelectItemProps} from "./SelectItem.tsx";

export interface ISliderItemProps extends BaseItemProps<SliderSingleProps | SliderRangeProps> {

}
export default function SliderItem(props: ISliderItemProps) {
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

