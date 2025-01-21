import {get, hasIn, isArray, isNil, set} from "lodash-es";
import {useEffect, useState} from "react";
import {Form} from "antd";
import {BaseItemProps} from "./BaseItemProps";
import {useObjectAttribute} from "../objectAttribute";
import {isCamera} from "@plum-render/babylon-sdk";

export interface IItemUpdateConfig {
    setDefaultValue?: () => any; // 可选的转换数据配置函数
}

let defaultConfig: IItemUpdateConfig = {}

export const useItemUpdate = (props: BaseItemProps, config: IItemUpdateConfig = defaultConfig) => {
    let {name, convertData, virtual, basePropertyName, syncChange} =
        {
            virtual: false,
            syncChange: true,
            ...props
        };

    const form = Form.useFormInstance(); // 获取当前的表单实例
    const {object, change} = useObjectAttribute(); // 获取与对象相关的属性
    const [isValue, setIsValue] = useState(false); // 状态，用于跟踪值是否存在

    const setValue = (object: any) => {
        // todo 用于临时调试
        if (isArray(name) && name[0] === "isEnable") {
            // debugger
        }
        let value = get(object, name); // 获取对象中对应 name 的值
        if (value == null && config?.setDefaultValue) {
            value = config?.setDefaultValue();
            set(object, name, value)
        }
        // 如果属性存在
        if (!isNil(convertData)) {
            value = convertData(value); // 如果提供了转换函数，则转换值
        }
        form.setFieldValue(name, value); // 设置表单字段的值
    }

    // 更新函数，用于设置表单字段的值
    const update = (object: any) => {
        if (!isNil(basePropertyName)) {
            let isHasIn = hasIn(object, basePropertyName); // 检查对象中是否存在该属性
            setIsValue(isHasIn); // 更新值存在状态
        } else {
            let isHasIn = hasIn(object, name); // 检查对象中是否存在该属性
            if (isHasIn) {
                setValue(object)
            } else {
                // 这里可以添加处理属性不存在的情况（如清空字段等）
            }
            setIsValue(isHasIn); // 更新值存在状态
        }
    }

    // 使用 useEffect 监听对象的变化
    useEffect(() => {
        if (isArray(name) && name[0] === "isEnable") {
            // debugger
        }
        if (isNil(object)) {
            setIsValue(false); // 如果对象为 null 或 undefined，设置值存在状态为 false
        } else {
            if (virtual) {

                setIsValue(true);
            } else {
                update(object); // 如果对象存在，则调用更新函数
            }
        }
    }, [object]); // 依赖于 object，只有当 object 变化时重新运行

    // 状态改变的时候, 刷新值
    useEffect(() => {
        if (isValue && syncChange) {
            change?.subscribe((event) => {
                // 如果是相机，直接更新, name 为空的不更新
                if (isCamera(object) && isArray(name)) {
                    setValue(object)
                } else {
                    const {attributePath} = event;
                    if (isNil(name) || !isArray(name)) {

                    } else {
                        if (name[0] === attributePath[0]) {
                            setValue(object)
                        }
                    }
                }
            })
        }
    }, [isValue, syncChange])

    return {isValue}; // 返回值状态
}

