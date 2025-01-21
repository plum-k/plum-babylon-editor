import {Fragment} from "react";
import {Checkbox, Form} from "antd";
import {useItemUpdate} from "./useItemUpdate";
import {BaseItemProps} from "./BaseItemProps";

export interface IBoolItemProps extends BaseItemProps {
}

export function BoolItem(props: IBoolItemProps) {
    const {virtual, ...rest} = props;
    const {isValue} = useItemUpdate(props);
    return (
        <Fragment>
            {
                isValue &&
                <Form.Item valuePropName="checked" {...rest}>
                    <Checkbox/>
                </Form.Item>
            }
        </Fragment>
    )
}

