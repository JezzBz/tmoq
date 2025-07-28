import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { AddressType } from "../../enums/beneficiary";
import { Beneficiary } from "./beneficiary";

@Entity()
export class Address {
    @PrimaryGeneratedColumn()
    addressId!: number;

    @Column({
        type: "enum",
        enum: AddressType
    })
    type!: AddressType;

    @Column()
    address!: string;

    @ManyToOne(() => Beneficiary, beneficiary => beneficiary.addresses)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: number;
} 