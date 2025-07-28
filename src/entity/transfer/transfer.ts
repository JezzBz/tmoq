import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { TransferType } from "@/enums/transfer";
import { PaymentStatus } from "@/enums/payment";

@Entity()
export class Transfer {
    @PrimaryGeneratedColumn()
    transferId!: number;

    @Column()
    fromAccountId!: string;

    @Column()
    toAccountId!: string;

    @Column({
        type: "enum",
        enum: TransferType
    })
    type!: TransferType;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @Column({ length: 3 })
    currency!: string;

    @Column({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status!: PaymentStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 