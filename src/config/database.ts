import { DataSource } from 'typeorm';
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

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: true, // В продакшене должно быть false
  logging: true,
  entities: [
    Beneficiary,
    Address,
    Document,
    Deal,
    Step,
    Deponent,
    Recipient,
    Payment,
    BankDetails,
    Balance,
    Hold,
    Transfer
  ],
  subscribers: [],
  migrations: [],
});

// Инициализация подключения к базе данных
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
}; 