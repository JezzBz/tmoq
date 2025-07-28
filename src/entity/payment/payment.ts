import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { PaymentType, PaymentStatus } from "@/enums/payment";
import { Beneficiary } from "../beneficiary/beneficiary";
import { Deal } from "../deal/deal";

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    paymentId!: number;

    @Column({
        type: "enum",
        enum: PaymentType
    })
    type!: PaymentType;

    @Column({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status!: PaymentStatus;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @Column({ length: 3 })
    currency!: string;

    @Column({ nullable: true })
    description?: string;

    @ManyToOne(() => Beneficiary)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: number;

    @ManyToOne(() => Deal, { nullable: true })
    @JoinColumn({ name: "dealId" })
    deal?: Deal;

    @Column({ nullable: true })
    dealId?: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 