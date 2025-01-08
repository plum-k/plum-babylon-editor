import {FC, Fragment, useState} from "react";
import {ColorPicker, Form} from "antd";
import type {ColorPickerProps} from "antd/es/color-picker/interface";
import useItemUpdate from "./useItemUpdate.ts";
import BaseItemProps from "./BaseItemProps.ts";
import {AggregationColor} from "antd/es/color-picker/color";

export interface IColorItemProps extends BaseItemProps<ColorPickerProps> {
    okHandle?: (oldValue: string, value: AggregationColor, attributePath: string) => void;
}

const ColorItem: FC<IColorItemProps> = (props: IColorItemProps) => {
    const {convertData, fieldProps, okHandle, ...rest} = props
    const {isValue} = useItemUpdate({
        ...props,
        convertData: (value: any) => {
            return value.toHexString()
        }
    });

    const form = Form.useFormInstance(); // 获取当前的表单实例
    const [oldColor, setOldColor] = useState<string>('');

    function onChangeOpen() {
        const initValue = form.getFieldValue(props.name);
        setOldColor(initValue)
    }

    function onChangeComplete(value: AggregationColor) {
        okHandle && okHandle(oldColor, value, props.name)
    }

    return (
        <Fragment>
            {
                isValue &&
                <Form.Item {...rest}>
                    <ColorPicker
                        showText
                        onOpenChange={onChangeOpen}
                        onChangeComplete={onChangeComplete}
                        {...fieldProps}
                    />
                </Form.Item>
            }
        </Fragment>
    )
}

export default ColorItem;
