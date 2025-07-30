import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { DocumentType } from "../../enums/beneficiary";
import { Beneficiary } from "./beneficiary";

@Entity()
export class Document {
    @PrimaryGeneratedColumn()
    documentId!: number;

    @Column()
    type!: string;

    @Column({ nullable: true })
    serial?: string;

    @Column({ nullable: true })
    number?: string;

    @Column({ type: "date", nullable: true })
    issueDate?: Date;

    @Column({ nullable: true })
    issuer?: string;

    @Column({ type: "date", nullable: true })
    validUntil?: Date;

    @ManyToOne(() => Beneficiary, beneficiary => beneficiary.documents)
    @JoinColumn({ name: "beneficiaryId" })
    beneficiary!: Beneficiary;

    @Column()
    beneficiaryId!: number;
} 