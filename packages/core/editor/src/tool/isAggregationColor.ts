import {AggregationColor} from "antd/es/color-picker/color";
import {isObject} from "lodash-es";

export function isAggregationColor(value: unknown): value is  AggregationColor {
    return isObject(value) && value.constructor.name === "AggregationColor2"
}