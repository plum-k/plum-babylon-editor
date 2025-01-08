import {FC, Fragment} from "react";
import {Form} from "antd";
import BaseItemProps from "./BaseItemProps.ts";
import useItemUpdate from "./useItemUpdate.ts";
import {isBoolean} from "lodash-es";
import {useObjectAttribute} from "../objectAttribute";

export interface ITextItemProps extends BaseItemProps {
    valueSource?: "fun" | "value";
    funName?: string;
}

const TextItem: FC<ITextItemProps> = (props: ITextItemProps) => {
    const {funName, virtual, valueSource, ...rest} = {valueSource: "value", ...props};
    const {name} = rest
    const form = Form.useFormInstance();
    const {object} = useObjectAttribute(); // 获取与对象相关的属性
    const Text = () => {
        if (valueSource === "value") {
            let value = form.getFieldValue(name)
            if (isBoolean(value)) {
                value = value ? "开启" : "关闭"
            }
            return <Fragment>{value}</Fragment>
        } else {
            let value = object[funName]();
            return <Fragment>{value}</Fragment>
        }
    }
    const {isValue} = useItemUpdate(props);
    return (
        <Fragment>
            {
                isValue &&
                <Form.Item {...rest}>
                    <Text/>
                </Form.Item>}
        </Fragment>
    )
}

export default TextItem;
