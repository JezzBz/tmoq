const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Тестовые данные
const testBeneficiary = {
  type: 'FL_RESIDENT',
  firstName: 'Иван',
  middleName: 'Иванович',
  lastName: 'Иванов',
  isSelfEmployed: false,
  birthDate: '1990-01-01',
  birthPlace: 'г. Москва',
  citizenship: 'RU',
  phoneNumber: '+79991234567',
  email: 'ivan.ivanov@example.com',
  inn: '123456789012'
};

const testBankDetails = {
  type: 'PAYMENT_DETAILS',
  isDefault: true,
  bik: '044525974',
  kpp: '773401001',
  inn: '123456789012',
  name: 'Иванов Иван Иванович',
  bankName: 'АО "ТБанк"',
  accountNumber: '11223344556677889900',
  corrAccountNumber: '30101810145250000974'
};

// Функция для генерации UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Тесты API
async function testAPI() {
  console.log('🚀 Начинаем тестирование API...\n');

  try {
    // 1. Тест GET /api/v1/beneficiaries
    console.log('1. Тестируем GET /api/v1/beneficiaries');
    const beneficiariesResponse = await axios.get(`${BASE_URL}/beneficiaries?limit=10&offset=0`);
    console.log('✅ Получен список бенефициаров:', beneficiariesResponse.data);
    console.log('');

    // 2. Тест POST /api/v1/beneficiaries
    console.log('2. Тестируем POST /api/v1/beneficiaries');
    const createBeneficiaryResponse = await axios.post(`${BASE_URL}/beneficiaries`, testBeneficiary);
    console.log('✅ Создан бенефициар:', createBeneficiaryResponse.data);
    const beneficiaryId = createBeneficiaryResponse.data.beneficiaryId;
    console.log('');

    // 3. Тест GET /api/v1/beneficiaries/{beneficiaryId}
    console.log('3. Тестируем GET /api/v1/beneficiaries/{beneficiaryId}');
    const getBeneficiaryResponse = await axios.get(`${BASE_URL}/beneficiaries/${beneficiaryId}`);
    console.log('✅ Получен бенефициар:', getBeneficiaryResponse.data);
    console.log('');

    // 4. Тест POST /api/v1/beneficiaries/{beneficiaryId}/bank-details
    console.log('4. Тестируем POST /api/v1/beneficiaries/{beneficiaryId}/bank-details');
    const idempotencyKey = generateUUID();
    const createBankDetailsResponse = await axios.post(
      `${BASE_URL}/beneficiaries/${beneficiaryId}/bank-details`,
      testBankDetails,
      {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      }
    );
    console.log('✅ Созданы банковские реквизиты:', createBankDetailsResponse.data);
    const bankDetailsId = createBankDetailsResponse.data.bankDetailsId;
    console.log('');

    // 5. Тест GET /api/v1/beneficiaries/{beneficiaryId}/bank-details
    console.log('5. Тестируем GET /api/v1/beneficiaries/{beneficiaryId}/bank-details');
    const getBankDetailsResponse = await axios.get(`${BASE_URL}/beneficiaries/${beneficiaryId}/bank-details?limit=10&offset=0`);
    console.log('✅ Получены банковские реквизиты:', getBankDetailsResponse.data);
    console.log('');

    // 6. Тест GET /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}
    console.log('6. Тестируем GET /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}');
    const getSpecificBankDetailsResponse = await axios.get(`${BASE_URL}/beneficiaries/${beneficiaryId}/bank-details/${bankDetailsId}`);
    console.log('✅ Получены конкретные банковские реквизиты:', getSpecificBankDetailsResponse.data);
    console.log('');

    // 7. Тест POST /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}/set-default
    console.log('7. Тестируем POST /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}/set-default');
    const setDefaultResponse = await axios.post(`${BASE_URL}/beneficiaries/${beneficiaryId}/bank-details/${bankDetailsId}/set-default`);
    console.log('✅ Установлены реквизиты по умолчанию, статус:', setDefaultResponse.status);
    console.log('');

    // 8. Тест POST /api/v1/beneficiaries/{beneficiaryId}/add-card-requests
    console.log('8. Тестируем POST /api/v1/beneficiaries/{beneficiaryId}/add-card-requests');
    const addCardRequestResponse = await axios.post(
      `${BASE_URL}/beneficiaries/${beneficiaryId}/add-card-requests`,
      { terminalKey: '1573803282696E2C' },
      {
        headers: {
          'Idempotency-Key': generateUUID()
        }
      }
    );
    console.log('✅ Создан запрос на добавление карты:', addCardRequestResponse.data);
    console.log('');

    // 9. Тест PUT /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}
    console.log('9. Тестируем PUT /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}');
    const updateBankDetailsData = {
      ...testBankDetails,
      accountNumber: '99887766554433221100'
    };
    const updateBankDetailsResponse = await axios.put(
      `${BASE_URL}/beneficiaries/${beneficiaryId}/bank-details/${bankDetailsId}`,
      updateBankDetailsData
    );
    console.log('✅ Обновлены банковские реквизиты:', updateBankDetailsResponse.data);
    console.log('');

    // 10. Тест PUT /api/v1/beneficiaries/{beneficiaryId}
    console.log('10. Тестируем PUT /api/v1/beneficiaries/{beneficiaryId}');
    const updateBeneficiaryData = {
      ...testBeneficiary,
      firstName: 'Петр',
      lastName: 'Петров'
    };
    const updateBeneficiaryResponse = await axios.put(
      `${BASE_URL}/beneficiaries/${beneficiaryId}`,
      updateBeneficiaryData
    );
    console.log('✅ Обновлен бенефициар:', updateBeneficiaryResponse.data);
    console.log('');

    // 11. Тест DELETE /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}
    console.log('11. Тестируем DELETE /api/v1/beneficiaries/{beneficiaryId}/bank-details/{bankDetailsId}');
    const deleteBankDetailsResponse = await axios.delete(`${BASE_URL}/beneficiaries/${beneficiaryId}/bank-details/${bankDetailsId}`);
    console.log('✅ Удалены банковские реквизиты, статус:', deleteBankDetailsResponse.status);
    console.log('');

    console.log('🎉 Все тесты прошли успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.response?.data || error.message);
    console.error('Статус:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Запуск тестов
testAPI(); 