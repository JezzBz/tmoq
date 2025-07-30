import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Step } from "./step";
import { Beneficiary } from "../beneficiary/beneficiary";

@Entity()
export class Deponent {
    @PrimaryGeneratedColumn("uuid")
    deponentId!: string;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @ManyToOne(() => Step, step => step.deponents)
    @JoinColumn({ name: "stepId" })
    step!: Step;

    @Column()
    stepId!: string;

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