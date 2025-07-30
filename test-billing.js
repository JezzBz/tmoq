const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Тестовые данные
const testPayment = {
  type: 'REGULAR',
  beneficiaryId: '61f656e0-0a86-4ec2-bd43-232499f7ad66',
  accountNumber: '40702810110011000777',
  bankDetailsId: '49e46893-9a7e-409b-8c79-647aecaae555',
  amount: 100,
  purpose: 'Назначение платежа'
};

const testTransfer = {
  accountNumber: '40702810110011000777',
  from: {
    beneficiaryId: '61f656e0-0a86-4ec2-bd43-232499f7ad66'
  },
  to: {
    beneficiaryId: '023428b8-f490-4456-a58e-d97460db3923'
  },
  amount: 100,
  purpose: 'Назначение платежа'
};

const testAmountDistribution = [
  {
    beneficiaryId: '61f656e0-0a86-4ec2-bd43-232499f7ad66',
    amount: 100
  },
  {
    beneficiaryId: '75c0d3c4-1a5b-11ec-8669-0326f772aecb',
    amount: 50
  }
];

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testBillingAPI() {
  console.log('🚀 Начинаем тестирование API биллинга...\n');

  try {
    // 2.1 GET /api/v1/payments
    console.log('1. Тестируем GET /api/v1/payments');
    const paymentsResponse = await axios.get(`${BASE_URL}/payments`, {
      params: {
        beneficiaryId: '61f656e0-0a86-4ec2-bd43-232499f7ad66',
        accountNumber: '40702810110011000777',
        offset: 0,
        limit: 10
      }
    });
    console.log('✅ Получен список платежей:', paymentsResponse.data);

    // 2.2 POST /api/v1/payments
    console.log('\n2. Тестируем POST /api/v1/payments');
    const createPaymentResponse = await axios.post(`${BASE_URL}/payments`, testPayment, {
      headers: {
        'Idempotency-Key': generateUUID()
      }
    });
    console.log('✅ Создан платеж:', createPaymentResponse.data);

    // 2.3 GET /api/v1/virtual-accounts/holds
    console.log('\n3. Тестируем GET /api/v1/virtual-accounts/holds');
    const holdsResponse = await axios.get(`${BASE_URL}/virtual-accounts/holds`, {
      params: {
        accountNumber: '40702810110011000777',
        beneficiaryId: '61f656e0-0a86-4ec2-bd43-232499f7ad66',
        offset: 0,
        limit: 10
      }
    });
    console.log('✅ Получен список холдов:', holdsResponse.data);

    // 2.4 GET /api/v1/incoming-transactions
    console.log('\n4. Тестируем GET /api/v1/incoming-transactions');
    const incomingTransactionsResponse = await axios.get(`${BASE_URL}/incoming-transactions`, {
      params: {
        accountNumber: '40702810110011000777',
        offset: 0,
        limit: 10
      }
    });
    console.log('✅ Получен список входящих транзакций:', incomingTransactionsResponse.data);

    // 2.5 POST /api/v1/payments/{paymentId}/retry
    console.log('\n5. Тестируем POST /api/v1/payments/{paymentId}/retry');
    const retryResponse = await axios.post(`${BASE_URL}/payments/${createPaymentResponse.data.paymentId}/retry`);
    console.log('✅ Повтор платежа:', retryResponse.data);

    // 2.6 POST /api/v1/incoming-transactions/{operationId}/identify
    console.log('\n6. Тестируем POST /api/v1/incoming-transactions/{operationId}/identify');
    const operationId = incomingTransactionsResponse.data.results[0]?.operationId || generateUUID();
    const identifyResponse = await axios.post(`${BASE_URL}/incoming-transactions/${operationId}/identify`, {
      amountDistribution: testAmountDistribution
    });
    console.log('✅ Идентификация транзакции:', identifyResponse.data);

    // 2.7 GET /api/v1/virtual-accounts/transfers/{transferId}
    console.log('\n7. Тестируем GET /api/v1/virtual-accounts/transfers/{transferId}');
    const transferId = generateUUID();
    try {
      const transferResponse = await axios.get(`${BASE_URL}/virtual-accounts/transfers/${transferId}`);
      console.log('✅ Получен перевод:', transferResponse.data);
    } catch (error) {
      console.log('❌ Перевод не найден (ожидаемо для тестового ID)');
    }

    // 2.8 GET /api/v1/virtual-accounts/transfers
    console.log('\n8. Тестируем GET /api/v1/virtual-accounts/transfers');
    const transfersResponse = await axios.get(`${BASE_URL}/virtual-accounts/transfers`, {
      params: {
        accountNumber: '40702810110011000777',
        fromBeneficiaryId: '61f656e0-0a86-4ec2-bd43-232499f7ad66',
        offset: 0,
        limit: 10
      }
    });
    console.log('✅ Получен список переводов:', transfersResponse.data);

    // 2.9 POST /api/v1/virtual-accounts/transfers
    console.log('\n9. Тестируем POST /api/v1/virtual-accounts/transfers');
    const createTransferResponse = await axios.post(`${BASE_URL}/virtual-accounts/transfers`, testTransfer, {
      headers: {
        'Idempotency-Key': generateUUID()
      }
    });
    console.log('✅ Создан перевод:', createTransferResponse.data);

    // 2.10 GET /api/v1/payments/{paymentId}
    console.log('\n10. Тестируем GET /api/v1/payments/{paymentId}');
    const paymentResponse = await axios.get(`${BASE_URL}/payments/${createPaymentResponse.data.paymentId}`);
    console.log('✅ Получен платеж:', paymentResponse.data);

    // 2.11 GET /api/v1/virtual-accounts/balances
    console.log('\n11. Тестируем GET /api/v1/virtual-accounts/balances');
    const balancesResponse = await axios.get(`${BASE_URL}/virtual-accounts/balances`, {
      params: {
        accountNumber: '40702810110011000777',
        beneficiaryId: '61f656e0-0a86-4ec2-bd43-232499f7ad66',
        offset: 0,
        limit: 10
      }
    });
    console.log('✅ Получены балансы:', balancesResponse.data);

    console.log('\n🎉 Все тесты биллинга прошли успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании API биллинга:', {
      error: error.response?.data || error.message,
      status: error.response?.status,
      url: error.config?.url
    });
  }
}

// Запускаем тесты
testBillingAPI(); 