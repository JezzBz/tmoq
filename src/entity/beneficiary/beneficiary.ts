import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BenefeciaryType } from "../../enums/benefeciaryType";
import { Address } from "./address";
import { Document } from "./document";

@Entity()
export class Beneficiary {
    @PrimaryGeneratedColumn("uuid")
    beneficiaryId!: string;

    @Column({
        type: "varchar",
        length: 50
    })
    type!: BenefeciaryType;

    @Column({ nullable: true })
    firstName?: string;

    @Column({ nullable: true })
    middleName?: string;

    @Column({ nullable: true })
    lastName?: string;

    @Column({ nullable: true })
    isSelfEmployed?: boolean;

    @Column({ type: "date", nullable: true })
    birthDate?: Date;

    @Column({ nullable: true })
    birthPlace?: string;

    @Column({ nullable: true })
    citizenship?: string;

    @Column({ nullable: true })
    phoneNumber?: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    name?: string; // для UL/ИП

    @Column({ nullable: true })
    inn?: string;

    @Column({ nullable: true })
    ogrn?: string;

    @Column({ nullable: true })
    kpp?: string;

    @Column({ nullable: true })
    snils?: string;

    @Column({ nullable: true })
    registrationDate?: Date;

    @Column({ nullable: true })
    opf?: string;

    @Column({ nullable: true })
    nza?: string;

    @Column({ nullable: true })
    registrationNumber?: string;

    @Column({ nullable: true })
    kio?: string;

    @OneToMany(() => Address, address => address.beneficiary)
    addresses?: Address[];

    @OneToMany(() => Document, document => document.beneficiary)
    documents?: Document[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 