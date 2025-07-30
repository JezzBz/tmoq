import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { StepStatus } from "../../enums/deal";
import { Deal } from "./deal";
import { Deponent } from "./deponent";
import { Recipient } from "./recipient";

@Entity()
export class Step {
    @PrimaryGeneratedColumn("uuid")
    stepId!: string;

    @Column()
    title!: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @Column({ length: 3 })
    currency!: string;

    @Column({ type: "int", default: 1 })
    stepNumber!: number;

    @Column({
        type: "varchar",
        length: 50,
        default: StepStatus.DRAFT
    })
    status!: StepStatus;

    @ManyToOne(() => Deal, deal => deal.steps)
    @JoinColumn({ name: "dealId" })
    deal!: Deal;

    @Column()
    dealId!: string;

    @OneToMany(() => Deponent, deponent => deponent.step)
    deponents?: Deponent[];

    @OneToMany(() => Recipient, recipient => recipient.step)
    recipients?: Recipient[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ type: "datetime", nullable: true })
    startedAt?: Date;

    @Column({ type: "datetime", nullable: true })
    completedAt?: Date;

    @Column({ type: "datetime", nullable: true })
    cancelledAt?: Date;
} 