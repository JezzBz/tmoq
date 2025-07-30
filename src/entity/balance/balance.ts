import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn, CreateDateColumn } from "typeorm";
import { Beneficiary } from "../beneficiary/beneficiary";

@Entity()
export class Balance {
    @PrimaryGeneratedColumn("uuid")
    balanceId!: string;

    @Column()
    accountId!: string;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @Column({ length: 3 })
    currency!: string;

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    holds!: number;

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    available!: number;

    @Column({ nullable: true })
    description?: string;

    @ManyToOne(() => Beneficiary)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ type: "datetime", nullable: true })
    lastUpdated?: Date;
} 