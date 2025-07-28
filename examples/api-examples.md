# Примеры использования API

## 1. Управление бенефициарами

### Создание физического лица
```bash
curl -X POST http://localhost:3000/api/v1/beneficiaries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "Иван",
    "lastName": "Иванов",
    "middleName": "Иванович",
    "birthDate": "1990-01-01",
    "birthPlace": "Москва",
    "citizenship": "РФ",
    "phoneNumber": "+79001234567"
  }'
```

### Создание юридического лица
```bash
curl -X POST http://localhost:3000/api/v1/beneficiaries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "LEGAL_ENTITY",
    "name": "ООО Рога и Копыта",
    "inn": "1234567890",
    "ogrn": "1234567890123",
    "kpp": "123456789",
    "phoneNumber": "+74951234567"
  }'
```

### Получение списка бенефициаров
```bash
curl -X GET http://localhost:3000/api/v1/beneficiaries
```

### Получение бенефициара по ID
```bash
curl -X GET http://localhost:3000/api/v1/beneficiaries/1
```

## 2. Управление банковскими реквизитами

### Добавление банковского счета
```bash
curl -X POST http://localhost:3000/api/v1/bank-details \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 1,
    "type": "ACCOUNT",
    "accountNumber": "40702810123456789012",
    "bankName": "Сбербанк России",
    "bic": "044525225",
    "isDefault": true
  }'
```

### Добавление банковской карты
```bash
curl -X POST http://localhost:3000/api/v1/bank-details \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 1,
    "type": "CARD",
    "cardNumber": "1234567890123456",
    "cardHolderName": "IVAN IVANOV",
    "expiryDate": "2025-12-31"
  }'
```

## 3. Управление балансами

### Создание баланса
```bash
curl -X POST http://localhost:3000/api/v1/balances \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 1,
    "amount": 10000.00,
    "currency": "RUB"
  }'
```

### Пополнение баланса
```bash
curl -X POST http://localhost:3000/api/v1/balances/1/add-funds \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000.00,
    "currency": "RUB",
    "description": "Пополнение счета"
  }'
```

### Получение информации о балансе
```bash
curl -X GET http://localhost:3000/api/v1/balances/1
```

## 4. Управление сделками

### Создание сделки
```bash
curl -X POST http://localhost:3000/api/v1/deals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Покупка недвижимости",
    "description": "Покупка квартиры в Москве",
    "amount": 5000000.00,
    "currency": "RUB",
    "beneficiaryId": 1
  }'
```

### Подтверждение сделки
```bash
curl -X POST http://localhost:3000/api/v1/deals/1/confirm
```

### Получение сделки с этапами
```bash
curl -X GET http://localhost:3000/api/v1/deals/1
```

## 5. Управление этапами сделок

### Создание этапа
```bash
curl -X POST http://localhost:3000/api/v1/steps \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": 1,
    "title": "Оплата аванса",
    "description": "Перечисление аванса продавцу",
    "amount": 1000000.00,
    "currency": "RUB"
  }'
```

### Добавление депонента на этап
```bash
curl -X POST http://localhost:3000/api/v1/steps/1/deponents \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 1,
    "amount": 1000000.00,
    "currency": "RUB"
  }'
```

### Добавление реципиента на этап
```bash
curl -X POST http://localhost:3000/api/v1/steps/1/recipients \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 2,
    "amount": 1000000.00,
    "currency": "RUB"
  }'
```

### Завершение этапа
```bash
curl -X POST http://localhost:3000/api/v1/steps/1/complete
```

## 6. Управление платежами

### Создание платежа
```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": 1,
    "amount": 1000000.00,
    "currency": "RUB",
    "description": "Оплата аванса по сделке"
  }'
```

### Обработка платежа
```bash
curl -X POST http://localhost:3000/api/v1/payments/1/process
```

### Идентификация пополнения
```bash
curl -X POST http://localhost:3000/api/v1/payments/identify-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000000.00,
    "currency": "RUB",
    "description": "Пополнение счета"
  }'
```

## 7. Управление переводами

### Создание перевода
```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "fromBeneficiaryId": 1,
    "toBeneficiaryId": 2,
    "amount": 50000.00,
    "currency": "RUB",
    "description": "Перевод средств"
  }'
```

### Выполнение перевода
```bash
curl -X POST http://localhost:3000/api/v1/transfers/1/execute
```

### Проверка возможности перевода
```bash
curl -X POST http://localhost:3000/api/v1/transfers/check-possibility \
  -H "Content-Type: application/json" \
  -d '{
    "fromBeneficiaryId": 1,
    "toBeneficiaryId": 2,
    "amount": 50000.00,
    "currency": "RUB"
  }'
```

## 8. Получение статистики

### Статистика по платежам
```bash
curl -X GET http://localhost:3000/api/v1/payments/statistics
```

### Статистика по переводам
```bash
curl -X GET http://localhost:3000/api/v1/transfers/statistics
```

### Статистика по балансам
```bash
curl -X GET http://localhost:3000/api/v1/balances/statistics
```

## 9. Полный сценарий работы

### 1. Создание бенефициаров
```bash
# Создаем покупателя
curl -X POST http://localhost:3000/api/v1/beneficiaries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "Покупатель",
    "lastName": "Иванов",
    "phoneNumber": "+79001234567"
  }'

# Создаем продавца
curl -X POST http://localhost:3000/api/v1/beneficiaries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "Продавец",
    "lastName": "Петров",
    "phoneNumber": "+79001234568"
  }'
```

### 2. Создание банковских реквизитов
```bash
# Реквизиты покупателя
curl -X POST http://localhost:3000/api/v1/bank-details \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 1,
    "type": "ACCOUNT",
    "accountNumber": "40702810123456789012",
    "bankName": "Сбербанк России",
    "bic": "044525225"
  }'

# Реквизиты продавца
curl -X POST http://localhost:3000/api/v1/bank-details \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 2,
    "type": "ACCOUNT",
    "accountNumber": "40702810987654321098",
    "bankName": "ВТБ",
    "bic": "044525745"
  }'
```

### 3. Создание балансов
```bash
# Баланс покупателя
curl -X POST http://localhost:3000/api/v1/balances \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 1,
    "amount": 10000000.00,
    "currency": "RUB"
  }'

# Баланс продавца
curl -X POST http://localhost:3000/api/v1/balances \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 2,
    "amount": 0.00,
    "currency": "RUB"
  }'
```

### 4. Создание сделки
```bash
curl -X POST http://localhost:3000/api/v1/deals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Покупка квартиры",
    "description": "Покупка квартиры в центре Москвы",
    "amount": 8000000.00,
    "currency": "RUB",
    "beneficiaryId": 1
  }'
```

### 5. Создание этапа с авансом
```bash
curl -X POST http://localhost:3000/api/v1/steps \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": 1,
    "title": "Оплата аванса",
    "description": "Перечисление аванса 10%",
    "amount": 800000.00,
    "currency": "RUB"
  }'
```

### 6. Добавление участников этапа
```bash
# Депонент (покупатель)
curl -X POST http://localhost:3000/api/v1/steps/1/deponents \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 1,
    "amount": 800000.00,
    "currency": "RUB"
  }'

# Реципиент (продавец)
curl -X POST http://localhost:3000/api/v1/steps/1/recipients \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryId": 2,
    "amount": 800000.00,
    "currency": "RUB"
  }'
```

### 7. Выполнение перевода
```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "fromBeneficiaryId": 1,
    "toBeneficiaryId": 2,
    "amount": 800000.00,
    "currency": "RUB",
    "description": "Аванс по сделке покупки квартиры"
  }'

curl -X POST http://localhost:3000/api/v1/transfers/1/execute
```

### 8. Завершение этапа
```bash
curl -X POST http://localhost:3000/api/v1/steps/1/complete
```

## 10. Обработка ошибок

### Пример ошибки валидации
```bash
curl -X POST http://localhost:3000/api/v1/beneficiaries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INDIVIDUAL"
  }'
```

### Пример ошибки недостаточного баланса
```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "fromBeneficiaryId": 1,
    "toBeneficiaryId": 2,
    "amount": 999999999.00,
    "currency": "RUB"
  }'
```

Все примеры предполагают, что сервер запущен на `http://localhost:3000`. Измените URL при необходимости. 