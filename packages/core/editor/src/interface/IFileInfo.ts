export enum EFolder {
    FOLDER,
    FILE
}

export interface IFileInfo {
    name: string;
    type: EFolder
}
