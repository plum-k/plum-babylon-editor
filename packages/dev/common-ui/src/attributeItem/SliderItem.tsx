import {FC, Fragment} from "react";
import {Form, Slider} from "antd";
import useItemUpdate from "./useItemUpdate.ts";
import BaseItemProps from "./BaseItemProps.ts";
import {SliderRangeProps, SliderSingleProps} from "antd/es/slider";

export interface ISliderItemProps extends BaseItemProps<SliderSingleProps | SliderRangeProps> {

}

const SliderItem: FC<ISliderItemProps> = (props: ISliderItemProps) => {
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

export default SliderItem;
