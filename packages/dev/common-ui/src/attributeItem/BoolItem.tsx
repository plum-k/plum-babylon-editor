import {FC, Fragment} from "react";
import {Checkbox, Form} from "antd";
import useItemUpdate from "./useItemUpdate.ts";
import BaseItemProps from "./BaseItemProps.ts";
import {IVector3ItemProps} from "./Vector3Item.tsx";

export interface IBoolItemProps extends BaseItemProps {
}
export default function BoolItem(props: IBoolItemProps) {
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

