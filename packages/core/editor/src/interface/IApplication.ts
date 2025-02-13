export enum EAppType {
    DIR = "DIR",
    BABYLON = "BABYLON",
}

export interface IApplication {
    id: number
    name: string; // 应用名称，字符串类型
    appType: EAppType; // 应用类型，枚举类型
    resourcePath?: string; // 资源路径，字符串类型，可选
    thumbnailBase64?: string; // 缩略图的 Base64 编码字符串，可选
    parentId: number | null; // 父级 ID，字符串类型，可选;
    createTime: Date;
    updateTime: Date;
}