import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BankDetailsType } from "@/enums/bankDetails";
import { Beneficiary } from "../beneficiary/beneficiary";

@Entity()
export class BankDetails {
    @PrimaryGeneratedColumn()
    bankDetailsId!: number;

    @Column({
        type: "enum",
        enum: BankDetailsType
    })
    type!: BankDetailsType;

    @Column({ default: false })
    isDefault!: boolean;

    @Column({ nullable: true })
    bik?: string;

    @Column({ nullable: true })
    accountNumber?: string;

    @Column({ nullable: true })
    cardNumber?: string;

    @Column({ nullable: true })
    sbpId?: string;

    @ManyToOne(() => Beneficiary)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 