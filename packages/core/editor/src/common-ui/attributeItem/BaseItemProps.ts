import {FormItemProps} from "antd/es/form/FormItem";

/**
 * BaseItemProps 接口定义了一组通用的属性，用于表单项组件。
 * @template T - 表示字段属性的类型，可以是任意类型，默认为 unknown。
 */
export interface BaseItemProps<T extends unknown = unknown> extends FormItemProps {
    /**
     * 可选的函数，用于将输入值转换为特定格式。
     * @param value - 输入的原始值。
     * @returns 转换后的值。
     */
    convertData?: (value: any) => any;

    /**
     * 用于传递给表单项的额外字段属性。
     * @type T - 字段属性的类型。
     */
    fieldProps?: T;

    /**
     * 值是虚拟值
     * @default false
     */
    virtual?: boolean;

    /**
     * 父级属性名称
     */
    basePropertyName?: Array<string>
    /**
     * 指示是否同步表单项的值变化。
     * @default false
     */
    syncChange?: boolean;
}