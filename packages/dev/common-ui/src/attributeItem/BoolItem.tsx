import {FC, Fragment} from "react";
import {Checkbox, Form} from "antd";
import useItemUpdate from "./useItemUpdate.ts";
import BaseItemProps from "./BaseItemProps.ts";

export interface IBoolItemProps extends BaseItemProps {
}

const BoolItem: FC<IBoolItemProps> = (props: IBoolItemProps) => {
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

export default BoolItem;
