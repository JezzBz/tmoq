import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Step } from "./step";
import { Beneficiary } from "../beneficiary/beneficiary";
import { BankDetails } from "../bankDetails/bankDetails";

@Entity()
export class Recipient {
    @PrimaryGeneratedColumn("uuid")
    recipientId!: string;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @ManyToOne(() => Step, step => step.recipients)
    @JoinColumn({ name: "stepId" })
    step!: Step;

    @Column()
    stepId!: string;

    @ManyToOne(() => Beneficiary)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: string;

    @ManyToOne(() => BankDetails)
    @JoinColumn({ name: "bankDetailsId" })
    bankDetails!: BankDetails;

    @Column()
    bankDetailsId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 