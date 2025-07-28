import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

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

    @Column({ type: "timestamp", nullable: true })
    expiresAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;
} 