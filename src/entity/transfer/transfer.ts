import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { TransferType } from "../../enums/transfer";
import { PaymentStatus } from "../../enums/payment";

@Entity()
export class Transfer {
    @PrimaryGeneratedColumn("uuid")
    transferId!: string;

    @Column()
    fromAccountId!: string;

    @Column()
    toAccountId!: string;

    @Column({
        type: "varchar",
        length: 50
    })
    type!: TransferType;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @Column({ length: 3 })
    currency!: string;

    @Column({
        type: "varchar",
        length: 50,
        default: PaymentStatus.PENDING
    })
    status!: PaymentStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ nullable: true })
    description?: string;

    @Column({ type: "datetime", nullable: true })
    executedAt?: Date;

    @Column({ nullable: true })
    fromBeneficiaryId?: string;

    @Column({ nullable: true })
    toBeneficiaryId?: string;

    @Column({ nullable: true })
    accountNumber?: string;

    @Column({ type: "datetime", nullable: true })
    failedAt?: Date;

    @Column({ nullable: true })
    failureReason?: string;

    @Column({ type: "datetime", nullable: true })
    cancelledAt?: Date;
} 