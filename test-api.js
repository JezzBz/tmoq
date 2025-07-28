const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Функция для выполнения HTTP запросов
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Тестовые функции
async function testHealthCheck() {
  console.log('🔍 Тестирование health check...');
  try {
    const response = await makeRequest('GET', '/health');
    console.log('✅ Health check:', response.status, response.data);
    return response.status === 200;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testCreateBeneficiary() {
  console.log('🔍 Тестирование создания бенефициара...');
  try {
    const beneficiaryData = {
      type: 'INDIVIDUAL',
      firstName: 'Тест',
      lastName: 'Пользователь',
      phoneNumber: '+79001234567'
    };
    
    const response = await makeRequest('POST', '/api/v1/beneficiaries', beneficiaryData);
    console.log('✅ Создание бенефициара:', response.status, response.data);
    return response.status === 201;
  } catch (error) {
    console.log('❌ Создание бенефициара failed:', error.message);
    return false;
  }
}

async function testGetBeneficiaries() {
  console.log('🔍 Тестирование получения списка бенефициаров...');
  try {
    const response = await makeRequest('GET', '/api/v1/beneficiaries');
    console.log('✅ Получение бенефициаров:', response.status, response.data);
    return response.status === 200;
  } catch (error) {
    console.log('❌ Получение бенефициаров failed:', error.message);
    return false;
  }
}

async function testCreateBalance() {
  console.log('🔍 Тестирование создания баланса...');
  try {
    const balanceData = {
      beneficiaryId: 1,
      amount: 10000.00,
      currency: 'RUB'
    };
    
    const response = await makeRequest('POST', '/api/v1/balances', balanceData);
    console.log('✅ Создание баланса:', response.status, response.data);
    return response.status === 201;
  } catch (error) {
    console.log('❌ Создание баланса failed:', error.message);
    return false;
  }
}

async function testCreateDeal() {
  console.log('🔍 Тестирование создания сделки...');
  try {
    const dealData = {
      title: 'Тестовая сделка',
      description: 'Описание тестовой сделки',
      amount: 50000.00,
      currency: 'RUB',
      beneficiaryId: 1
    };
    
    const response = await makeRequest('POST', '/api/v1/deals', dealData);
    console.log('✅ Создание сделки:', response.status, response.data);
    return response.status === 201;
  } catch (error) {
    console.log('❌ Создание сделки failed:', error.message);
    return false;
  }
}

// Основная функция тестирования
async function runTests() {
  console.log('🚀 Начинаем тестирование API...\n');
  
  const tests = [
    testHealthCheck,
    testCreateBeneficiary,
    testGetBeneficiaries,
    testCreateBalance,
    testCreateDeal
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    const result = await test();
    if (result) {
      passedTests++;
    }
    console.log(''); // Пустая строка для разделения
  }
  
  console.log('📊 Результаты тестирования:');
  console.log(`✅ Пройдено: ${passedTests}/${totalTests}`);
  console.log(`❌ Провалено: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Все тесты прошли успешно!');
  } else {
    console.log('⚠️  Некоторые тесты провалились. Проверьте логи выше.');
  }
}

// Запуск тестов
runTests().catch(console.error); 