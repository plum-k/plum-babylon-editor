export enum EFolder {
    FOLDER,
    FILE
}

export interface IFileInfo {
    name: string;
    type: EFolder;
    rawName: string;
    parent: string;
}
