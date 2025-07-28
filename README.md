# T-MOQ API - Тестовая среда

Это тестовая среда для сервиса управления бенефициарами, сделками, платежами и переводами.

## Установка и запуск

### Предварительные требования
- Node.js (версия 16 или выше)
- npm или yarn

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка и запуск в продакшене
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Проверка состояния сервера

### Бенефициары (Beneficiaries)
- `GET /api/v1/beneficiaries` - Получить список бенефициаров
- `GET /api/v1/beneficiaries/:id` - Получить бенефициара по ID
- `POST /api/v1/beneficiaries` - Создать нового бенефициара
- `PUT /api/v1/beneficiaries/:id` - Обновить бенефициара
- `DELETE /api/v1/beneficiaries/:id` - Удалить бенефициара

### Сделки (Deals)
- `GET /api/v1/deals` - Получить список сделок
- `GET /api/v1/deals/:id` - Получить сделку по ID
- `POST /api/v1/deals` - Создать новую сделку
- `PUT /api/v1/deals/:id` - Обновить сделку
- `DELETE /api/v1/deals/:id` - Удалить сделку
- `POST /api/v1/deals/:id/confirm` - Подтвердить сделку
- `POST /api/v1/deals/:id/cancel` - Отменить сделку
- `POST /api/v1/deals/:id/complete` - Завершить сделку

### Платежи (Payments)
- `GET /api/v1/payments` - Получить список платежей
- `GET /api/v1/payments/:id` - Получить платеж по ID
- `POST /api/v1/payments` - Создать новый платеж
- `PUT /api/v1/payments/:id` - Обновить платеж
- `DELETE /api/v1/payments/:id` - Удалить платеж
- `POST /api/v1/payments/:id/process` - Обработать платеж
- `POST /api/v1/payments/:id/retry` - Повторить неуспешный платеж
- `POST /api/v1/payments/:id/cancel` - Отменить платеж

### Этапы сделок (Steps)
- `GET /api/v1/steps` - Получить список этапов
- `GET /api/v1/steps/:id` - Получить этап по ID
- `POST /api/v1/steps` - Создать новый этап
- `PUT /api/v1/steps/:id` - Обновить этап
- `DELETE /api/v1/steps/:id` - Удалить этап
- `POST /api/v1/steps/:id/start` - Начать этап
- `POST /api/v1/steps/:id/complete` - Завершить этап
- `POST /api/v1/steps/:id/cancel` - Отменить этап

### Банковские реквизиты (Bank Details)
- `GET /api/v1/bank-details` - Получить список банковских реквизитов
- `GET /api/v1/bank-details/:id` - Получить банковские реквизиты по ID
- `POST /api/v1/bank-details` - Создать новые банковские реквизиты
- `PUT /api/v1/bank-details/:id` - Обновить банковские реквизиты
- `DELETE /api/v1/bank-details/:id` - Удалить банковские реквизиты
- `POST /api/v1/bank-details/:id/set-default` - Установить как реквизиты по умолчанию

### Балансы (Balances)
- `GET /api/v1/balances` - Получить список балансов
- `GET /api/v1/balances/:id` - Получить баланс по ID
- `POST /api/v1/balances` - Создать новый баланс
- `PUT /api/v1/balances/:id` - Обновить баланс
- `DELETE /api/v1/balances/:id` - Удалить баланс
- `POST /api/v1/balances/:id/add-funds` - Пополнить баланс
- `POST /api/v1/balances/:id/withdraw-funds` - Снять средства с баланса

### Переводы (Transfers)
- `GET /api/v1/transfers` - Получить список переводов
- `GET /api/v1/transfers/:id` - Получить перевод по ID
- `POST /api/v1/transfers` - Создать новый перевод
- `PUT /api/v1/transfers/:id` - Обновить перевод
- `DELETE /api/v1/transfers/:id` - Удалить перевод
- `POST /api/v1/transfers/:id/execute` - Выполнить перевод
- `POST /api/v1/transfers/:id/retry` - Повторить неуспешный перевод
- `POST /api/v1/transfers/:id/cancel` - Отменить перевод

## Структура проекта

```
src/
├── config/
│   ├── database.ts      # Конфигурация базы данных
│   └── services.ts      # Инициализация сервисов
├── entity/              # Сущности базы данных
│   ├── beneficiary/     # Бенефициары
│   ├── deal/           # Сделки
│   ├── payment/        # Платежи
│   ├── balance/        # Балансы
│   ├── transfer/       # Переводы
│   └── bankDetails/    # Банковские реквизиты
├── services/           # Бизнес-логика
│   ├── base.service.ts # Базовый сервис
│   ├── beneficiary.service.ts
│   ├── deal.service.ts
│   ├── payment.service.ts
│   ├── step.service.ts
│   ├── bankDetails.service.ts
│   ├── balance.service.ts
│   └── transfer.service.ts
├── routes/             # API маршруты
├── enums/              # Перечисления
└── server.ts           # Основной файл сервера
```

## База данных

Проект использует SQLite для тестовой среды. База данных автоматически создается при первом запуске.

### Основные сущности:
- **Beneficiary** - Бенефициары (физ. и юр. лица)
- **Deal** - Сделки
- **Step** - Этапы сделок
- **Payment** - Платежи
- **Balance** - Балансы виртуальных счетов
- **Transfer** - Переводы между счетами
- **BankDetails** - Банковские реквизиты

## Функциональность

### Управление бенефициарами
- Создание, редактирование, удаление бенефициаров
- Управление адресами и документами
- Управление банковскими реквизитами
- Поддержка физ. лиц, юр. лиц и ИП

### Управление сделками
- Создание и управление сделками
- Этапы сделок с депонентами и реципиентами
- Статусы: черновик, подтверждена, завершена, отменена

### Платежная система
- Создание и обработка платежей
- Идентификация пополнений
- Повтор неуспешных платежей
- Статистика по платежам

### Виртуальные счета
- Управление балансами бенефициаров
- Холды средств
- Переводы между счетами
- Контроль остатков

### Банковские реквизиты
- Поддержка счетов и карт
- Реквизиты по умолчанию
- Валидация данных
- Запросы на добавление карт

## Тестирование

Для тестирования API можно использовать:
- Postman
- curl
- Любой HTTP клиент

### Пример создания бенефициара:
```bash
curl -X POST http://localhost:3000/api/v1/beneficiaries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INDIVIDUAL",
    "firstName": "Иван",
    "lastName": "Иванов",
    "phoneNumber": "+79001234567"
  }'
```

## Логирование

Сервер использует morgan для логирования HTTP запросов. Все запросы логируются в консоль.

## Безопасность

- Helmet для защиты заголовков
- CORS настройки
- Валидация входных данных
- Проверка прав доступа (в разработке) 