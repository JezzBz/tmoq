import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Step } from "./step";
import { Beneficiary } from "../beneficiary/beneficiary";
import { BankDetails } from "../bankDetails/bankDetails";

@Entity()
export class Recipient {
    @PrimaryGeneratedColumn()
    recipientId!: number;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @ManyToOne(() => Step, step => step.recipients)
    @JoinColumn({ name: "stepId" })
    step!: Step;

    @Column()
    stepId!: number;

    @ManyToOne(() => Beneficiary)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: number;

    @ManyToOne(() => BankDetails)
    @JoinColumn({ name: "bankDetailsId" })
    bankDetails!: BankDetails;

    @Column()
    bankDetailsId!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 