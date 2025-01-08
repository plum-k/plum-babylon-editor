import useItemUpdate from "./useItemUpdate.ts";
import {Fragment} from "react";
import {Form, Input, InputProps} from "antd";
import BaseItemProps from "./BaseItemProps.ts";

export interface IInputItemProps extends BaseItemProps<InputProps> {

}

export function InputItem(props: IInputItemProps) {
    const {syncChange, fieldProps, ...rest} = props
    const {isValue} = useItemUpdate(props);
    return (
        <Fragment>
            {
                isValue &&
                <Form.Item {...rest}>
                    <Input {...fieldProps}/>
                </Form.Item>
            }
        </Fragment>
    )
}

