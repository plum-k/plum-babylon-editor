export enum EFolder {
    FOLDER,
    FILE
}

export interface IFolder {
    name: string;
    type: EFolder
}
