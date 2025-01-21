import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';

export enum EAppType {
    DIR = "DIR",
    BABYLON = "BABYLON",
}

@Entity()
export class Application {
    fileName: string

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
    @Column({
        type: 'enum',
        enum: EAppType,
        default: EAppType.DIR,
    })
    appType: EAppType;

    @Column({nullable: true})
    resourcePath: string;
    @Column({nullable: true})
    thumbnailBase64: string;
    @Column({nullable: true})
    parentId: string;

    @CreateDateColumn()
    createTime: Date;
    @UpdateDateColumn()
    updateTime: Date;
}
