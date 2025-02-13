import {endsWith, get, includes, isEmpty, isNil, PropertyPath, startsWith} from "lodash-es";

export interface ICondition {
    propertyPath: PropertyPath;
    operator: SearchOperator,
    value: string
}

export enum ESearchMode {
    MatchAll = 'all',     // 所有条件都需满足
    MatchAny = 'any',     // 任一条件满足
    MatchNone = 'none'    // 所有条件均不满足
}

// 定义运算符枚举
export enum SearchOperator {
    Has,                 // 存在
    NotHas,             // 不存在
    In,                   // 包含
    NotIn,               // 不包含
    NotEqual,             // 不等于
    Equal,                // 等于
    GreaterThan,           // 大于
    GreaterThanOrEqual,   // 大于等于
    LessThan,              // 小于
    LessThanOrEqual,      // 小于等于
    StartWith,     // 以...开头
    EndWith           // 以...结尾
}

export class Search {
    conditions: Array<ICondition> = []
    searchMode: ESearchMode = ESearchMode.MatchAll

    constructor(conditions: Array<ICondition>, searchMode: ESearchMode = ESearchMode.MatchAll) {
        this.conditions = conditions;  // 设置表达式
        this.searchMode = searchMode
    }

    // 根据表达式计算结果
    isCondition(obj: object, condition: ICondition): boolean {
        if (isNil(obj) || isEmpty(obj)) {
            return false; // 检查对象是否有效
        }
        const {propertyPath, operator, value} = condition;
        const property = get(obj, propertyPath); // 获取属性值
        switch (operator) {
            case SearchOperator.Has:
                return !isNil(property); // 检查属性是否存在
            case SearchOperator.NotHas:
                return isNil(property); // 检查属性是否不存在
            case SearchOperator.In:
                return includes(property, value); // 检查值是否在数组中, 字符串是否包含子字符串
            case SearchOperator.NotIn:
                return !includes(property, value); // 检查值是否不在数组中
            case SearchOperator.NotEqual:
                return property !== value; // 检查不等于
            case SearchOperator.Equal:
                return property === value; // 检查等于
            case SearchOperator.GreaterThan:
                return property > value; // 检查大于
            case SearchOperator.GreaterThanOrEqual:
                return property >= value; // 检查大于等于
            case SearchOperator.LessThan:
                return property < value; // 检查小于
            case SearchOperator.LessThanOrEqual:
                return property <= value; // 检查小于等于
            case SearchOperator.StartWith:
                return startsWith(property, value); // 以...开头
            case SearchOperator.EndWith:
                return endsWith(property, value); // 以...结尾
        }
    }


    // 验证对象是否符合搜索条件
    matching(obj: object): boolean {
        const conditions = this.conditions || [];
        const results: boolean[] = [];
        conditions.forEach((condition) => {
            let isCondition = this.isCondition(obj, condition)
            if (isCondition) {
                results.push(isCondition); // 执行搜索
            }
        });
        switch (this.searchMode) {
            case ESearchMode.MatchAll:
                return results.length === conditions.length; // 所有条件都需满足
            case ESearchMode.MatchAny:
                return results.length >= 1; // 任一条件满足
            case ESearchMode.MatchNone:
                return results.length === 0; // 所有条件均不满足
        }
    }
}

