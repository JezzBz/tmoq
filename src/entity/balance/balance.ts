import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from "typeorm";
import { Beneficiary } from "../beneficiary/beneficiary";

@Entity()
export class Balance {
    @PrimaryGeneratedColumn()
    balanceId!: number;

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

    @ManyToOne(() => Beneficiary)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: number;

    @UpdateDateColumn()
    updatedAt!: Date;
} 