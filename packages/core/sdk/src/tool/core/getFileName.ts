import {split} from "lodash-es";

export function getFileName(value: string) {
    return split(value, '.', 2);
}