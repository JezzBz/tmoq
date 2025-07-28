import { AppDataSource } from './database';
import { BeneficiaryService } from '../services/beneficiary.service';
import { DealService } from '../services/deal.service';
import { PaymentService } from '../services/payment.service';
import { StepService } from '../services/step.service';
import { BankDetailsService } from '../services/bankDetails.service';
import { BalanceService } from '../services/balance.service';
import { TransferService } from '../services/transfer.service';
import { Beneficiary } from '../entity/beneficiary/beneficiary';
import { Address } from '../entity/beneficiary/address';
import { Document } from '../entity/beneficiary/document';
import { Deal } from '../entity/deal/deal';
import { Step } from '../entity/deal/step';
import { Deponent } from '../entity/deal/deponent';
import { Recipient } from '../entity/deal/recipient';
import { Payment } from '../entity/payment/payment';
import { BankDetails } from '../entity/bankDetails/bankDetails';
import { Balance } from '../entity/balance/balance';
import { Hold } from '../entity/balance/hold';
import { Transfer } from '../entity/transfer/transfer';

// Получение репозиториев
const getRepositories = () => {
  return {
    beneficiaryRepository: AppDataSource.getRepository(Beneficiary),
    addressRepository: AppDataSource.getRepository(Address),
    documentRepository: AppDataSource.getRepository(Document),
    dealRepository: AppDataSource.getRepository(Deal),
    stepRepository: AppDataSource.getRepository(Step),
    deponentRepository: AppDataSource.getRepository(Deponent),
    recipientRepository: AppDataSource.getRepository(Recipient),
    paymentRepository: AppDataSource.getRepository(Payment),
    bankDetailsRepository: AppDataSource.getRepository(BankDetails),
    balanceRepository: AppDataSource.getRepository(Balance),
    holdRepository: AppDataSource.getRepository(Hold),
    transferRepository: AppDataSource.getRepository(Transfer),
  };
};

// Инициализация сервисов
export const initializeServices = () => {
  const repositories = getRepositories();

  const balanceService = new BalanceService(
    repositories.balanceRepository,
    repositories.holdRepository,
    repositories.beneficiaryRepository
  );

  const beneficiaryService = new BeneficiaryService(
    repositories.beneficiaryRepository,
    repositories.addressRepository,
    repositories.documentRepository,
    repositories.bankDetailsRepository
  );

  const bankDetailsService = new BankDetailsService(
    repositories.bankDetailsRepository,
    repositories.beneficiaryRepository
  );

  const dealService = new DealService(
    repositories.dealRepository,
    repositories.stepRepository,
    repositories.deponentRepository,
    repositories.recipientRepository,
    repositories.paymentRepository,
    repositories.beneficiaryRepository
  );

  const stepService = new StepService(
    repositories.stepRepository,
    repositories.dealRepository,
    repositories.deponentRepository,
    repositories.recipientRepository,
    repositories.beneficiaryRepository
  );

  const paymentService = new PaymentService(
    repositories.paymentRepository,
    repositories.dealRepository
  );

  const transferService = new TransferService(
    repositories.transferRepository,
    repositories.beneficiaryRepository,
    balanceService
  );

  return {
    beneficiaryService,
    dealService,
    paymentService,
    stepService,
    bankDetailsService,
    balanceService,
    transferService,
  };
};

// Экспорт сервисов для использования в роутах
export const services = initializeServices(); 