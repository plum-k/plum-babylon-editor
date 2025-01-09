import {Fragment} from "react";
import {Form} from "antd";
import BaseItemProps from "./BaseItemProps.ts";
import useItemUpdate from "./useItemUpdate.ts";
import {isBoolean} from "lodash-es";
import {useObjectAttribute} from "../objectAttribute";

export interface ITextItemProps extends BaseItemProps {
    valueSource?: "fun" | "value";
    /**
     * 函数名
     */
    funName?: string;
    /**
     * 后缀
     */
    suffix?: string;
    /**
     * 显示小数点后的位数
     */
    decimalSeparator?: number;
}

export default function TextItem(props: ITextItemProps) {
    const {funName, virtual, valueSource, suffix, decimalSeparator, ...rest} = {valueSource: "value", ...props};
    const {name} = rest
    const form = Form.useFormInstance();
    const {object} = useObjectAttribute(); // 获取与对象相关的属性
    const Text = () => {
        if (valueSource === "value") {
            let value = form.getFieldValue(name)
            if (isBoolean(value)) {
                value = value ? "开启" : "关闭"
            }
            if (decimalSeparator) {
                value = value.toFixed(decimalSeparator)
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
                    {suffix}
                </Form.Item>}
        </Fragment>
    )
}

