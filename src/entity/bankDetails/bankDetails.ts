import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BankDetailsType } from "../../enums/bankDetails";
import { Beneficiary } from "../beneficiary/beneficiary";

@Entity()
export class BankDetails {
    @PrimaryGeneratedColumn("uuid")
    bankDetailsId!: string;

    @Column({
        type: "varchar",
        length: 50
    })
    type!: BankDetailsType;

    @Column({ default: false })
    isDefault!: boolean;

    @Column({ default: 'PENDING' })
    status!: string;

    @Column({ nullable: true })
    bankName?: string;

    @Column({ nullable: true })
    bik?: string;

    @Column({ nullable: true })
    bic?: string;

    @Column({ nullable: true })
    kpp?: string;

    @Column({ nullable: true })
    inn?: string;

    @Column({ nullable: true })
    name?: string;

    @Column({ nullable: true })
    accountNumber?: string;

    @Column({ nullable: true })
    corrAccountNumber?: string;

    @Column({ nullable: true })
    cardNumber?: string;

    @Column({ nullable: true })
    cardId?: string;

    @Column({ nullable: true })
    cardHolderName?: string;

    @Column({ type: "date", nullable: true })
    expiryDate?: Date;

    @Column({ nullable: true })
    sbpId?: string;

    @Column({ nullable: true })
    phoneNumber?: string;

    @Column({ nullable: true })
    bankId?: string;

    @Column({ nullable: true })
    terminalKey?: string;

    @Column({ type: "datetime", nullable: true })
    approvedAt?: Date;

    @Column({ type: "datetime", nullable: true })
    rejectedAt?: Date;

    @Column({ nullable: true })
    rejectionReason?: string;

    @ManyToOne(() => Beneficiary)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 