import { Repository } from 'typeorm';
import { BaseService } from './base.service';
import { Beneficiary } from '../entity/beneficiary/beneficiary';
import { Address } from '../entity/beneficiary/address';
import { Document } from '../entity/beneficiary/document';
import { BankDetails } from '../entity/bankDetails/bankDetails';
import { BenefeciaryType } from '../enums/benefeciaryType';

export class BeneficiaryService extends BaseService<Beneficiary> {
  private addressRepository: Repository<Address>;
  private documentRepository: Repository<Document>;
  private bankDetailsRepository: Repository<BankDetails>;

  constructor(
    beneficiaryRepository: Repository<Beneficiary>,
    addressRepository: Repository<Address>,
    documentRepository: Repository<Document>,
    bankDetailsRepository: Repository<BankDetails>
  ) {
    super(beneficiaryRepository);
    this.addressRepository = addressRepository;
    this.documentRepository = documentRepository;
    this.bankDetailsRepository = bankDetailsRepository;
  }

  async findById(id: string): Promise<Beneficiary | null> {
    return await this.repository.findOne({
      where: { beneficiaryId: id },
      relations: ['addresses', 'documents']
    });
  }

  async findAndCount(options: any): Promise<[Beneficiary[], number]> {
    return await this.repository.findAndCount(options);
  }

  async createBeneficiary(data: Partial<Beneficiary>): Promise<Beneficiary> {
    // Валидация данных
    this.validateBeneficiaryData(data);
    
    const beneficiary = this.repository.create(data);
    return await this.repository.save(beneficiary);
  }

  async updateBeneficiary(id: string, data: Partial<Beneficiary>): Promise<Beneficiary | null> {
    // Валидация данных
    this.validateBeneficiaryData(data);
    
    await this.repository.update({ beneficiaryId: id }, data);
    return await this.findById(id);
  }

  async deleteBeneficiary(id: string): Promise<boolean> {
    const result = await this.repository.delete({ beneficiaryId: id });
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с адресами
  async getAddresses(beneficiaryId: string): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { beneficiary: { beneficiaryId } }
    });
  }

  async addAddress(beneficiaryId: string, addressData: Partial<Address>): Promise<Address> {
    const beneficiary = await this.findById(beneficiaryId);
    if (!beneficiary) {
      throw new Error('Beneficiary not found');
    }

    const address = this.addressRepository.create({
      ...addressData,
      beneficiary
    });
    return await this.addressRepository.save(address);
  }

  async updateAddress(addressId: number, addressData: Partial<Address>): Promise<Address | null> {
    await this.addressRepository.update(addressId, addressData);
    return await this.addressRepository.findOne({ where: { addressId } });
  }

  async deleteAddress(addressId: number): Promise<boolean> {
    const result = await this.addressRepository.delete(addressId);
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с документами
  async getDocuments(beneficiaryId: string): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { beneficiary: { beneficiaryId } }
    });
  }

  async addDocument(beneficiaryId: string, documentData: Partial<Document>): Promise<Document> {
    const beneficiary = await this.findById(beneficiaryId);
    if (!beneficiary) {
      throw new Error('Beneficiary not found');
    }

    const document = this.documentRepository.create({
      ...documentData,
      beneficiary
    });
    return await this.documentRepository.save(document);
  }

  async updateDocument(documentId: number, documentData: Partial<Document>): Promise<Document | null> {
    await this.documentRepository.update(documentId, documentData);
    return await this.documentRepository.findOne({ where: { documentId } });
  }

  async deleteDocument(documentId: number): Promise<boolean> {
    const result = await this.documentRepository.delete(documentId);
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с банковскими реквизитами
  async getBankDetails(beneficiaryId: string): Promise<BankDetails[]> {
    return await this.bankDetailsRepository.find({
      where: { beneficiary: { beneficiaryId } }
    });
  }

  async addBankDetails(beneficiaryId: string, bankDetailsData: Partial<BankDetails>): Promise<BankDetails> {
    const beneficiary = await this.findById(beneficiaryId);
    if (!beneficiary) {
      throw new Error('Beneficiary not found');
    }

    const bankDetails = this.bankDetailsRepository.create({
      ...bankDetailsData,
      beneficiary
    });
    return await this.bankDetailsRepository.save(bankDetails);
  }

  async updateBankDetails(bankDetailsId: string, bankDetailsData: Partial<BankDetails>): Promise<BankDetails | null> {
    await this.bankDetailsRepository.update(bankDetailsId, bankDetailsData);
    return await this.bankDetailsRepository.findOne({ where: { bankDetailsId } });
  }

  async deleteBankDetails(bankDetailsId: string): Promise<boolean> {
    const result = await this.bankDetailsRepository.delete(bankDetailsId);
    return result.affected ? result.affected > 0 : false;
  }

  async setDefaultBankDetails(beneficiaryId: string, bankDetailsId: string): Promise<boolean> {
    // Сначала сбрасываем все реквизиты как не по умолчанию
    await this.bankDetailsRepository.update(
      { beneficiary: { beneficiaryId } },
      { isDefault: false }
    );

    // Устанавливаем выбранные реквизиты как по умолчанию
    const result = await this.bankDetailsRepository.update(
      { bankDetailsId, beneficiary: { beneficiaryId } },
      { isDefault: true }
    );

    return result.affected ? result.affected > 0 : false;
  }

  // Поиск и фильтрация
  async findByType(type: BenefeciaryType): Promise<Beneficiary[]> {
    return await this.repository.find({
      where: { type },
      relations: ['addresses', 'documents']
    });
  }

  async findByInn(inn: string): Promise<Beneficiary | null> {
    return await this.repository.findOne({
      where: { inn },
      relations: ['addresses', 'documents']
    });
  }

  async findByPhone(phoneNumber: string): Promise<Beneficiary | null> {
    return await this.repository.findOne({
      where: { phoneNumber },
      relations: ['addresses', 'documents']
    });
  }

  // Валидация данных
  private validateBeneficiaryData(data: Partial<Beneficiary>): void {
    if (data.type === BenefeciaryType.FL_RESIDENT || data.type === BenefeciaryType.FL_NONRESIDENT) {
      if (!data.firstName || !data.lastName) {
        throw new Error('First name and last name are required for individual beneficiaries');
      }
    } else if (data.type === BenefeciaryType.UL_RESIDENT || data.type === BenefeciaryType.UL_NONRESIDENT || 
               data.type === BenefeciaryType.IP_RESIDENT || data.type === BenefeciaryType.IP_NONRESIDENT) {
      if (!data.name || !data.inn) {
        throw new Error('Company name and INN are required for legal entities and individual entrepreneurs');
      }
    }
  }
} 