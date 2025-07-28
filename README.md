# T-MOQ API

Система управления сделками, платежами и переводами между бенефициарами.

## Установка и запуск

```bash
# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Запуск сервера
npm start
```

## API Endpoints

### Бенефициары (Beneficiaries)

- `GET /api/v1/beneficiaries` - Получить список бенефициаров
- `GET /api/v1/beneficiaries/:id` - Получить бенефициара по ID
- `POST /api/v1/beneficiaries` - Создать бенефициара
- `PUT /api/v1/beneficiaries/:id` - Обновить бенефициара
- `DELETE /api/v1/beneficiaries/:id` - Удалить бенефициара
- `GET /api/v1/beneficiaries/:id/addresses` - Получить адреса бенефициара
- `POST /api/v1/beneficiaries/:id/addresses` - Добавить адрес бенефициару
- `GET /api/v1/beneficiaries/:id/documents` - Получить документы бенефициара
- `POST /api/v1/beneficiaries/:id/documents` - Добавить документ бенефициару

### Сделки (Deals)

- `GET /api/v1/deals` - Получить список сделок
- `GET /api/v1/deals/:id` - Получить сделку по ID
- `POST /api/v1/deals` - Создать сделку
- `PUT /api/v1/deals/:id` - Обновить сделку
- `DELETE /api/v1/deals/:id` - Удалить сделку
- `POST /api/v1/deals/:id/confirm` - Подтвердить сделку
- `POST /api/v1/deals/:id/complete` - Завершить сделку
- `POST /api/v1/deals/:id/cancel` - Отменить сделку
- `GET /api/v1/deals/:id/steps` - Получить этапы сделки
- `GET /api/v1/deals/:id/payments` - Получить платежи сделки

### Платежи (Payments)

- `GET /api/v1/payments` - Получить список платежей
- `GET /api/v1/payments/:id` - Получить платеж по ID
- `POST /api/v1/payments` - Создать платеж
- `PUT /api/v1/payments/:id` - Обновить платеж
- `DELETE /api/v1/payments/:id` - Удалить платеж
- `POST /api/v1/payments/:id/process` - Обработать платеж
- `POST /api/v1/payments/:id/retry` - Повторить неуспешный платеж
- `POST /api/v1/payments/:id/cancel` - Отменить платеж
- `POST /api/v1/payments/identify-deposit` - Идентифицировать пополнение
- `POST /api/v1/payments/execute-to-beneficiary` - Выполнить платеж в пользу бенефициара
- `GET /api/v1/payments/statistics` - Получить статистику платежей

### Переводы (Transfers)

- `GET /api/v1/transfers` - Получить список переводов
- `GET /api/v1/transfers/:id` - Получить перевод по ID
- `POST /api/v1/transfers` - Создать перевод
- `PUT /api/v1/transfers/:id` - Обновить перевод
- `DELETE /api/v1/transfers/:id` - Удалить перевод
- `POST /api/v1/transfers/:id/execute` - Выполнить перевод
- `POST /api/v1/transfers/:id/retry` - Повторить неуспешный перевод
- `POST /api/v1/transfers/:id/cancel` - Отменить перевод
- `GET /api/v1/transfers/beneficiary/:beneficiaryId` - Получить переводы бенефициара
- `GET /api/v1/transfers/:id/info` - Получить информацию о переводе
- `POST /api/v1/transfers/check-possibility` - Проверить возможность перевода
- `GET /api/v1/transfers/statistics` - Получить статистику переводов

### Банковские реквизиты (Bank Details)

- `GET /api/v1/bank-details` - Получить список банковских реквизитов
- `GET /api/v1/bank-details/:id` - Получить банковские реквизиты по ID
- `POST /api/v1/bank-details` - Создать банковские реквизиты
- `PUT /api/v1/bank-details/:id` - Обновить банковские реквизиты
- `DELETE /api/v1/bank-details/:id` - Удалить банковские реквизиты
- `GET /api/v1/bank-details/beneficiary/:beneficiaryId` - Получить банковские реквизиты бенефициара
- `POST /api/v1/bank-details/:id/set-default` - Установить реквизиты по умолчанию
- `POST /api/v1/bank-details/card-request` - Создать запрос на карту
- `POST /api/v1/bank-details/:id/approve-card` - Одобрить запрос на карту
- `POST /api/v1/bank-details/:id/reject-card` - Отклонить запрос на карту

### Балансы (Balances)

- `GET /api/v1/balances` - Получить список балансов
- `GET /api/v1/balances/:id` - Получить баланс по ID
- `POST /api/v1/balances` - Создать баланс
- `PUT /api/v1/balances/:id` - Обновить баланс
- `DELETE /api/v1/balances/:id` - Удалить баланс
- `GET /api/v1/balances/beneficiary/:beneficiaryId` - Получить баланс бенефициара
- `POST /api/v1/balances/:id/add-funds` - Пополнить баланс
- `POST /api/v1/balances/:id/withdraw-funds` - Снять средства
- `POST /api/v1/balances/:id/create-hold` - Создать холд
- `POST /api/v1/balances/holds/:holdId/release` - Освободить холд
- `POST /api/v1/balances/holds/:holdId/execute` - Выполнить холд
- `GET /api/v1/balances/:id/info` - Получить информацию о балансе
- `GET /api/v1/balances/statistics` - Получить статистику балансов

### Этапы сделок (Steps)

- `GET /api/v1/steps` - Получить список этапов
- `GET /api/v1/steps/:id` - Получить этап по ID
- `POST /api/v1/steps` - Создать этап
- `PUT /api/v1/steps/:id` - Обновить этап
- `DELETE /api/v1/steps/:id` - Удалить этап
- `POST /api/v1/steps/:id/start` - Начать этап
- `POST /api/v1/steps/:id/complete` - Завершить этап
- `POST /api/v1/steps/:id/cancel` - Отменить этап
- `GET /api/v1/steps/:id/deponents` - Получить депонентов этапа
- `POST /api/v1/steps/:id/deponents` - Добавить депонента
- `GET /api/v1/steps/:id/recipients` - Получить реципиентов этапа
- `POST /api/v1/steps/:id/recipients` - Добавить реципиента
- `POST /api/v1/steps/:id/change-recipient` - Изменить реципиента
- `PUT /api/v1/steps/recipients/:recipientId/bank-details` - Обновить банковские реквизиты реципиента
- `GET /api/v1/steps/:id/payment-possibility` - Проверить возможность проведения платежей
- `GET /api/v1/steps/statistics` - Получить статистику этапов

## Примеры использования

### Создание бенефициара

```bash
curl -X POST http://localhost:3000/api/v1/beneficiaries \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Иван",
    "lastName": "Иванов",
    "email": "ivan@example.com",
    "phone": "+79001234567",
    "type": "INDIVIDUAL"
  }'
```

### Создание сделки

```bash
curl -X POST http://localhost:3000/api/v1/deals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Сделка №1",
    "description": "Описание сделки",
    "amount": 100000,
    "currency": "RUB",
    "beneficiaryId": 1
  }'
```

### Создание платежа

```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DEAL",
    "amount": 100000,
    "currency": "RUB",
    "description": "Оплата по сделке",
    "dealId": 1,
    "beneficiaryId": 1
  }'
```

### Создание перевода

```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "fromBeneficiaryId": 1,
    "toBeneficiaryId": 2,
    "amount": 5000,
    "currency": "RUB",
    "description": "Перевод средств"
  }'
```

## Структура ответов

### Успешный ответ
```json
{
  "message": "Операция выполнена успешно",
  "data": {...},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Ответ с ошибкой
```json
{
  "error": "Описание ошибки",
  "message": "Детальное сообщение об ошибке"
}
```

## Коды ошибок

- `400` - Неверный запрос (Bad Request)
- `404` - Не найдено (Not Found)
- `500` - Внутренняя ошибка сервера (Internal Server Error)

## Примечания

- Все суммы передаются в копейках (для рублей) или в минимальных единицах валюты
- Даты передаются в формате ISO 8601
- ID всех сущностей являются целыми числами
- Статусы и типы передаются в виде строковых констант

## Health Check

```bash
curl http://localhost:3000/health
```

Ответ:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
``` 