import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {FindManyOptions, FindOptionsWhere, Repository} from "typeorm";
import {Application} from "./entities/application.entity";
import {Page} from "../../dto/Page";

@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
    ) {
    }

    async findOne(id: number) {
        return await this.applicationRepository.findOneBy({id: id});
    }

    async remove(id: number) {
        await this.applicationRepository.delete(id);
    }

    async findAll(where?: FindOptionsWhere<Application>) {
        return await this.applicationRepository.findBy(where);
    }

    async create(entity: Application) {
        return await this.applicationRepository.save(entity);
    }

    async deleteById(id: number) {
        await this.applicationRepository.delete(id);
    }

    async edit(entity: Application) {
        await this.applicationRepository.update({id: entity.id}, entity);
    }

    async page(page, size, option?: any) {
        let db = this.applicationRepository.createQueryBuilder('entity')
            .skip((page - 1) * size)
            .take(size);
        if (option?.relation) {
            db = db.leftJoinAndSelect(`entity.${option.relation}`, option.relation);
        }
        const records = await db.getMany();
        const count = await db.getCount();
        return new Page<any>(
            records,
            count,
            Number(size),
            Number(page),
            Math.ceil(count / size),
        );
    }
}
