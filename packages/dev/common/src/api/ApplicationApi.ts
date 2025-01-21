
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
    static getAll = () => {
        return req.get<Array<IApplication>>({
            url: `/application`
        })
    }
    static remove = (id: number) => {
        return req.delete<Array<IApplication>>({
            url: `/application/${id}`
        })
    }
}

