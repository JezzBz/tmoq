import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Beneficiary } from "../beneficiary/beneficiary";

@Entity()
export class Hold {
    @PrimaryGeneratedColumn()
    holdId!: number;

    @Column()
    accountId!: string;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @Column({ length: 3 })
    currency!: string;

    @Column({ nullable: true })
    reason?: string;

    @Column({ default: 'ACTIVE' })
    status!: string;

    @ManyToOne(() => Beneficiary)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: number;

    @Column({ type: "timestamp", nullable: true })
    expiresAt?: Date;

    @Column({ type: "datetime", nullable: true })
    releasedAt?: Date;

    @Column({ type: "datetime", nullable: true })
    executedAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;
} 