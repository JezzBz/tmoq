import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { PaymentType, PaymentStatus } from "../../enums/payment";
import { Beneficiary } from "../beneficiary/beneficiary";
import { Deal } from "../deal/deal";
import { BankDetails } from "../bankDetails/bankDetails";

@Entity()
export class Payment {
    @PrimaryGeneratedColumn("uuid")
    paymentId!: string;

    @Column({
        type: "varchar",
        length: 50
    })
    type!: PaymentType;

    @Column({
        type: "varchar",
        length: 50,
        default: PaymentStatus.PENDING
    })
    status!: PaymentStatus;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @Column({ length: 3 })
    currency!: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    purpose?: string;

    @Column({ nullable: true })
    accountNumber?: string;

    @Column({ nullable: true })
    operationId?: string;

    @Column({ nullable: true })
    errorMessage?: string;

    @Column({ nullable: true })
    uin?: string;

    @Column({ type: "json", nullable: true })
    tax?: any;

    @Column({ nullable: true })
    stepId?: string;

    @Column({ nullable: true })
    recipientId?: string;

    @ManyToOne(() => Beneficiary)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: string;

    @ManyToOne(() => Deal, { nullable: true })
    @JoinColumn({ name: "dealId" })
    deal?: Deal;

    @Column({ nullable: true })
    dealId?: string;

    @ManyToOne(() => BankDetails, { nullable: true })
    @JoinColumn({ name: "bankDetailsId" })
    bankDetails?: BankDetails;

    @Column({ nullable: true })
    bankDetailsId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ type: "datetime", nullable: true })
    processedAt?: Date;
} 