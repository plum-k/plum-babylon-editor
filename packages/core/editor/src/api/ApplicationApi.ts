import {IApplication} from "../interface";
import {req} from "./request";

export class ApplicationApi {
    static getById = (id: string) => {
        return req.get<IApplication>({
            url: `/application/${id}`
        })
    }
    static getPage = (page: string, size: number) => {
        return req.get<Array<IApplication>>({
            url: `/application/${page}/${size}`
        })
    }

    static create = (data: Partial<IApplication>) => {
        return req.post({
            data,
            url: `/application`
        })
    }
    static createApp = (data: Partial<IApplication>) => {
        return req.post({
            data,
            url: `/application/createApp`
        })
    }
    static edit = (data: Partial<IApplication>) => {
        return req.put({
            url: `/application`,
            data
        })
    }
    static getAll = (parentId: number | null = null) => {
        return req.get<Array<IApplication>>({
            url: `/application`,
            params: {parentId}
        })
    }
    static getAllDir = () => {
        return req.get<Array<IApplication>>({
            url: `/application/getAllDir`
        })
    }


    static remove = (id: number) => {
        return req.delete<Array<IApplication>>({
            url: `/application/${id}`
        })
    }
}

