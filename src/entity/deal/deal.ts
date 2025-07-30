import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { DealStatus } from "../../enums/deal";
import { Beneficiary } from "../beneficiary/beneficiary";
import { Payment } from "../payment/payment";
import { Step } from "./step";

@Entity()
export class Deal {
    @PrimaryGeneratedColumn("uuid")
    dealId!: string;

    @Column()
    title!: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number;

    @Column({ length: 3 })
    currency!: string;

    @Column({
        type: "varchar",
        length: 50,
        default: DealStatus.DRAFT
    })
    status!: DealStatus;

    @ManyToOne(() => Beneficiary)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: string;

    @OneToMany(() => Payment, payment => payment.deal)
    payments?: Payment[];

    @OneToMany(() => Step, step => step.deal)
    steps?: Step[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 