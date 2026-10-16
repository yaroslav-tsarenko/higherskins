# Руководство по интеграции платёжного шлюза PayNT / OPPWA (Copy & Pay)

Данный документ содержит полное описание архитектуры, нюансов, серверных и клиентских решений для интеграции платёжного шлюза **PayNT** (построенного на инфраструктуре **OPPWA / ACI Worldwide / PAY.ON**) по технологии **Copy & Pay (SAQ-A PCI DSS)**.

Используйте это руководство как готовую спецификацию и шаблон при внедрении платежей в других проектах.

---

## 1. Общая архитектура и принцип работы (3-Step Flow)

Технология **Copy & Pay** соответствует уровню безопасности **PCI DSS SAQ-A**. Это означает, что карточные данные (номер карты, срок действия, CVV) вводятся в защищённые iframe-поля шлюза и **никогда не попадают на сервер вашего приложения**, избавляя бизнес от сложной и дорогостоящей сертификации PCI DSS.

```
[ Клиент (Браузер) ]        [ Сервер вашего приложения ]           [ PayNT / OPPWA ]
        |                                 |                                 |
   1. Выбор оплаты картой                 |                                 |
        |---- POST /api/.../prepare ----->|                                 |
        |                                 |--- POST /v1/checkouts --------->|
        |                                 |    (amount, currency, etc.)     |
        |                                 |<-- { id, integrity, ... } ------|
        |<--- { checkoutId, scriptUrl } --|                                 |
        |                                                                   |
   2. Загрузка виджета и рендер формы                                        |
        |---- GET paymentWidgets.js?checkoutId={id} ----------------------->|
        |     (Ввод карты в iframe, клик "Pay now", 3D Secure челлендж)     |
        |                                                                   |
   3. Редирект после оплаты                                                 |
        |==== 302 Redirect на shopperResultUrl?resourcePath=... ===========>|
        |                                 |                                 |
   4. Проверка статуса транзакции         |                                 |
        |---- Загрузка страницы результ.->|                                 |
        |                                 |--- GET {baseUrl}{resourcePath} >|
        |                                 |<-- { result.code, amount, ... } |
        |                                 |                                 |
        |                                 | (Проверка кода, доставка заказа/|
        |                                 |  начисление баланса в БД)       |
        |<--- Страница успеха/ошибки -----|                                 |
```

---

## 2. Переменные окружения (.env)

Для работы шлюза требуются следующие параметры:

```env
# 1. Базовый адрес API
# Тестовая среда: https://eu-test.oppwa.com
# Боевая среда:   https://eu-prod.oppwa.com (или специализированный домен шлюза)
PAYNT_BASE_URL="https://eu-test.oppwa.com"

# 2. Идентификатор платёжного канала (Entity ID)
PAYNT_ENTITY_ID="8ac9a4c9a0ce496501a10b62873b1817"

# 3. Bearer Token (User API Access Token)
# Выдаётся в мерчант-портале PayNT / SetoPay для авторизации server-to-server запросов
PAYNT_BEARER_TOKEN="ВАШ_ТОКЕН_ИЗ_ЛАТИНСКИХ_БУКВ_И_ЦИФР"

# 4. Секрет подписи вебхука (опционально)
PAYNT_WEBHOOK_SECRET=""
```

### ⚠️ Критический нюанс: Ошибка `ByteString` при передаче заголовка Authorization
- **Проблема:** В Node.js / `fetch` HTTP-заголовки обязаны быть строками формата ByteString (символы с кодом ASCII от `0` до `255`).
- **Симптом ошибки:** `TypeError: Cannot convert argument to a ByteString because the character at index 7 has a value of 1042 which is greater than 255`. Код 1042 — это буква «В» кириллицы. Если в `.env` случайно скопирован текст на русском языке (например, плейсхолдер `"ВАШ_BEARER_TOKEN"`), заголовок `Authorization: Bearer В...` приводит к падению сервера с кодом 500.
- **Решение:** Добавляйте проверку токена перед отправкой:
  ```ts
  function getValidToken(): string {
    const token = (process.env.PAYNT_BEARER_TOKEN || "").trim();
    if (!token || /[^\x00-\x7F]/.test(token)) {
      throw new Error("PAYNT_BEARER_TOKEN не задан или содержит не-ASCII символы.");
    }
    return token;
  }
  ```

---

## 3. Шаг 1: Подготовка чекаута (Prepare Checkout)

Перед отображением формы оплаты сервер приложения делает `POST`-запрос на endpoint шлюза.

- **URL:** `${PAYNT_BASE_URL}/v1/checkouts`
- **Method:** `POST`
- **Content-Type:** `application/x-www-form-urlencoded` *(Важно: параметры передаются в теле запроса, а не в query URL)*
- **Headers:** `Authorization: Bearer ${PAYNT_BEARER_TOKEN}`

### Обязательные параметры:
| Параметр | Формат | Описание |
| :--- | :--- | :--- |
| `entityId` | String | ID канала (например, `8ac9a4c9a0ce...`) |
| `amount` | String | Сумма **строго с 2 знаками после запятой** (например, `20.00`) |
| `currency` | String | 3-буквенный код валюты в верхнем регистре (`EUR`, `GBP`, `USD`) |
| `paymentType` | String | Тип платежа: `DB` (прямое дебетование/списание) или `PA` (преавторизация) |
| `integrity` | String | `"true"` — шлюз вернёт SRI sha384-хеш для безопасного подключения JS-виджета |
| `merchantTransactionId` | String | Уникальный ID заказа в вашей БД (для сверки) |

### Рекомендуемые и обязательные параметры:
- `customer.email`
- `customer.givenName` (имя)
- `customer.surname` (фамилия)
- `customer.ip` — **⚠️ СТРОГО ОБЯЗАТЕЛЬНО для боевых каналов 3DS:** шлюз требует реальный публичный IPv4/IPv6 покупателя. Если параметр опущен или пуст, OPPWA отклоняет транзакцию с ошибкой: `Reference code: 100.900.400: request contains no ip number`.
  - Извлекайте IP из заголовков: `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`.
  - При локальной разработке (`127.0.0.1` или `::1`) обязательно подставляйте публичный fallback IP, иначе локальное тестирование не пройдет.
- `billing.street1`
- `billing.city`
- `billing.postcode`
- `billing.country` — **Критический нюанс:** OPPWA принимает страну **исключительно в виде двухбуквенного кода ISO 3166-1 alpha-2** (`GB`, `US`, `DE`, `ES`, `LV` и т.д.). Полные названия («United Kingdom») вызовут ошибку валидации. Используйте маппер стран.

### ⚠️ Критический нюанс: Куда передавать `shopperResultUrl`
В технологии **Copy & Pay** URL редиректа передаётся **ИСКЛЮЧИТЕЛЬНО** в атрибуте `action` HTML-формы:
`<form action="{shopperResultUrl}" class="paymentWidgets" data-brands="VISA MASTER AMEX"></form>`
**НЕ ПЕРЕДАВАЙТЕ** `shopperResultUrl` в теле серверного запроса `POST /v1/checkouts`! Если передать его и на сервере, и в форме, виджет при отправке вернёт ошибку:
`code: 200.300.404, message: "shopperResultUrl was already set and cannot be overwritten"`.

### ⚠️ Ошибка браузера HTTP 431 (Request Header Fields Too Large)
При локальной разработке на `localhost` браузер передаёт все куки, накопленные от других проектов на любых портах `localhost`. Если размер заголовков превышает лимит Node.js (16 КБ), сервер возвращает 431.
**Решение:**
1. Запускать Node с флагом: `NODE_OPTIONS='--max-http-header-size=65536' next dev`
2. Или очистить куки для `localhost` в DevTools -> Application -> Storage -> Clear site data.

### Ответ шлюза при успехе:
```json
{
  "result": {
    "code": "000.200.100",
    "description": "successfully created checkout"
  },
  "buildNumber": "...",
  "timestamp": "...",
  "ndc": "...",
  "id": "8ac7a4c98f...-checkoutId",
  "integrity": "sha384-..."
}
```

Клиенту возвращаются:
1. `checkoutId` = `data.id`
2. `integrity` = `data.integrity`
3. `scriptUrl` = `${PAYNT_BASE_URL}/v1/paymentWidgets.js?checkoutId=${data.id}`
4. `shopperResultUrl`

---

## 4. Шаг 2: Создание формы на фронтенде (Payment Widget)

### Как устроен виджет OPPWA
Виджет состоит из двух частей:
1. Тег `<script src="{scriptUrl}" integrity="{integrity}" crossorigin="anonymous">`
2. Тег формы `<form action="{shopperResultUrl}" class="paymentWidgets" data-brands="VISA MASTER AMEX"></form>`

Когда скрипт `paymentWidgets.js` загружается в браузере, он автоматически находит на странице форму с классом `.paymentWidgets` и рендерит внутрь защищённые iframe-поля для ввода карты и кнопку оплаты.

### Особенности работы в React / Next.js
1. **Порядок монтирования:** Тег `<form class="paymentWidgets">` должен уже находиться в DOM к моменту, когда загружается и выполняется скрипт. Поэтому форму рендерим в JSX, а скрипт внедряем через `useEffect`.
2. **Очистка (Cleanup):** При размонтировании компонента (например, если пользователь нажал «Назад» / отменил оплату) скрипт и сгенерированные DOM-элементы `.wpwl-container` необходимо удалять, чтобы избежать дублирования при повторном открытии.
3. **⚠️ Сохранение суммы и отложенная очистка корзины:**
   - **Не вызывайте `clear()` корзины при открытии формы!** Если очистить корзину при монтировании виджета, общая сумма в шапке (`total`) моментально станет `0.00`, а при нажатии кнопки «Назад» пользователь потеряет все товары.
   - Зафиксируйте сумму в состоянии чекаута (`payntData.totalEur`) и отображайте её.
   - Очищайте корзину только после успешной оплаты на странице подтверждения заказа (например, через клиентский хук `<CartClearer />` при `?new=1`).

### Конфигурация `window.wpwlOptions`
Перед внедрением скрипта в глобальный объект `window` передаются настройки:

```ts
(window as any).wpwlOptions = {
  locale: "en",
  style: "plain",            // Отключает встроенную несовместимую тему
  brandDetection: true,      // Автоматическое определение бренда карты (Visa/Mastercard)
  showCVVHint: true,         // Подсказка где искать CVV
  labels: {
    cvv: "CVC / CVV",
    cardHolder: "Cardholder Name",
  },
  onReady: function () {
    // Вызывается когда виджет полностью отрендерился — здесь скрываем лоадер/спиннер
  },
};
```

---

## 5. Стилизация виджета и адаптивная верстка (CSS)

### ⚠️ Проблема дефолтных стилей OPPWA:
По умолчанию OPPWA использует устаревшую верстку на `float: left`: лейблы полей (`.wpwl-label`) сжаты слева (30% ширины), а инпуты (`.wpwl-wrapper`) — справа (70%). В узких колонках заголовки ломаются в 3 строки («CARD<br>NUMBER»), а форма выглядит непрезентабельно.

### ✅ Готовое решение (CSS-модуль / globals.css):

```css
/* ============================================================
   PayNT / OPPWA Copy & Pay Widget Styles
   ============================================================ */
.wpwl-container {
  width: 100% !important;
}

/* Форма как Flex-контейнер */
.wpwl-form {
  display: flex !important;
  flex-direction: column !important;
  gap: 1.15rem !important;
  width: 100% !important;
  max-width: 100% !important;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  font-family: inherit !important;
}

/* Группа поля (сброс дефолтных float) */
.wpwl-group {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  clear: both !important;
  float: none !important;
}

/* Лейбл НАД полем ввода */
.wpwl-label {
  float: none !important;
  display: block !important;
  width: 100% !important;
  margin-bottom: 0.4rem !important;
  font-size: 0.75rem !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.06em !important;
  color: var(--color-muted, #6e7284) !important;
  text-align: left !important;
}

.wpwl-wrapper {
  float: none !important;
  display: block !important;
  width: 100% !important;
}

/* Селектор бренда карты и иконка */
.wpwl-wrapper-brand {
  display: flex !important;
  align-items: center !important;
  gap: 0.75rem !important;
}

/* Инпуты и iframes карточных данных */
.wpwl-control,
.wpwl-control-iframe {
  width: 100% !important;
  height: 2.85rem !important;
  background-color: var(--color-bg, #ffffff) !important;
  color: var(--color-ink, #1e2433) !important;
  border: 2px solid var(--color-line, #d9d2c2) !important;
  border-radius: 0.65rem !important;
  padding: 0.5rem 0.85rem !important;
  font-size: 0.95rem !important;
  outline: none !important;
  box-sizing: border-box !important;
  transition: all 0.15s ease !important;
}

.wpwl-control:focus,
.wpwl-control:focus-within {
  border-color: var(--color-primary, #2b5ce6) !important;
  box-shadow: 0 0 0 3px rgba(43, 92, 230, 0.15) !important;
}

/* Кнопка "Pay now" */
.wpwl-button-pay {
  float: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 3.25rem !important;
  margin-top: 0.75rem !important;
  background-color: var(--color-primary, #2b5ce6) !important;
  color: #ffffff !important;
  border: 2px solid transparent !important;
  border-radius: 0.65rem !important;
  font-weight: 700 !important;
  font-size: 1.05rem !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}

.wpwl-button-pay:hover {
  filter: brightness(1.08) !important;
}

/* Ошибки валидации */
.wpwl-has-error .wpwl-control {
  border-color: #e5484d !important;
}

.wpwl-has-error .wpwl-hint {
  color: #e5484d !important;
}

/* ДВУХКОЛОНОЧНЫЙ ГРИД НА ДЕСКТОПЕ:
   Номер карты и имя — на всю ширину.
   Срок действия (Expiry) и CVC — рядом в 2 колонки */
@media (min-width: 640px) {
  .wpwl-form {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    column-gap: 1.25rem !important;
    row-gap: 1.15rem !important;
  }
  .wpwl-group-brand,
  .wpwl-group-cardNumber,
  .wpwl-group-cardHolder,
  .wpwl-group-submit {
    grid-column: span 2 !important;
  }
  .wpwl-group-expiry {
    grid-column: span 1 !important;
  }
  .wpwl-group-cvv {
    grid-column: span 1 !important;
  }
}
```

---

## 6. Шаг 3: Проверка статуса платежа (Get Payment Status)

После отправки формы и прохождения покупателем 3D Secure челленджа шлюз перенаправляет браузер методом GET на:
```
{shopperResultUrl}?id={checkoutId}&resourcePath={resourcePath}
```

Пример `resourcePath`: `/v1/checkouts/8ac7a4.../payment`

### Серверный запрос проверки:
- **URL:** `${PAYNT_BASE_URL}${resourcePath}?entityId=${PAYNT_ENTITY_ID}`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer ${PAYNT_BEARER_TOKEN}`

### ⚠️ Правило ограничения частоты запросов (Throttling Rule):
> **Важно из документации:** Шлюз разрешает максимум **2 запроса проверки статуса в минуту** на один `checkoutId`.
> Не опрашивайте этот эндпоинт в цикле (polling)! Вызывайте его единожды при загрузке страницы-редиректа.

### Анализ кодов ответа (`result.code`):

Шлюз возвращает объект:
```json
{
  "id": "8ac7a4ca6d...",
  "paymentType": "DB",
  "paymentBrand": "VISA",
  "amount": "20.00",
  "currency": "GBP",
  "result": {
    "code": "000.100.110",
    "description": "Request successfully processed in 'Merchant in Integrator Mode'"
  },
  "merchantTransactionId": "order_123"
}
```

Для проверки успешности платежа используется регулярное выражение:
```ts
export function isPaymentSuccessful(code: string): boolean {
  if (!code) return false;
  // Успешные коды OPPWA:
  // 000.000.000 (успешно в боевом режиме)
  // 000.100.110 / 000.100.112 (успешно в интеграционном/тестовом режиме)
  // 000.300... / 000.600... (успешно с доп. условиями)
  return /^(000\.000\.|000\.100\.1|000\.[36])/.test(code);
}

export function isPaymentPending(code: string): boolean {
  if (!code) return false;
  return /^(000\.200)/.test(code);
}
```

Любые другие коды (например, `100.390...`, `800.100...`) означают отказ эмитента, ошибку 3DS или нехватку средств.

---

## 7. Принцип идемпотентности при обработке заказа

Пользователь может случайно перезагрузить страницу подтверждения или нажать кнопку «Назад». Чтобы избежать повторной доставки цифровых товаров или двойного начисления баланса:

1. **Проверяйте статус в БД перед выполнением действий:**
   ```ts
   const order = await prisma.order.findUnique({ where: { id: orderId } });
   if (order.status === "delivered" || order.status === "paid") {
     // Заказ уже был обработан — просто перенаправляем в личный кабинет
     return redirect(`/orders/${order.id}`);
   }
   ```
2. **Для пополнения баланса:** передавайте уникальный `reference` транзакции (например, `topup_${userId}_${timestamp}`) и проверяйте в таблице транзакций, не записан ли он уже.

---

## 8. Асинхронные Вебхуки (Server-to-Server Webhook)

Вебхук страхует сценарий, при котором покупатель ввёл SMS-код 3D Secure на сайте банка, оплата прошла, но вкладку магазина закрыли до автоматического редиректа браузера.

1. **Эндпоинт:** `POST /api/paynt/webhook`
2. **Обработка:**
   - Вебхук передаёт `resourcePath` или готовый payload с транзакцией.
   - Извлекается `merchantTransactionId`.
   - Если статус успешен и заказ в статусе `pending`, сервер автоматически переводит заказ в `paid` и выполняет доставку.

---

## 9. Пошаговый чек-лист для внедрения в новый проект

- [ ] **1. Задать переменные в `.env`:**
  - `PAYNT_BASE_URL` (test или prod)
  - `PAYNT_ENTITY_ID` (channel ID)
  - `PAYNT_BEARER_TOKEN` (только латиница и цифры!)
- [ ] **2. Создать клиент шлюза (`lib/paynt.ts`):**
  - Функции `prepareCheckout`, `getPaymentStatus`, `isPaymentSuccessful`.
  - Маппер стран `toCountryCode2` (конвертация в ISO 2-letter).
- [ ] **3. Создать серверный эндпоинт подготовки:**
  - Валидирует корзину/сумму.
  - Создаёт заказ в БД со статусом `pending`.
  - Вызывает `prepareCheckout` и отдаёт клиенту `checkoutId`, `scriptUrl`, `shopperResultUrl`.
- [ ] **4. Создать React-компонент виджета (`PayntWidget.tsx`):**
  - Настраивает `window.wpwlOptions`.
  - Подгружает `scriptUrl`.
  - Рендерит `<form class="paymentWidgets">`.
- [ ] **5. Добавить CSS-стили виджета в глобальные стили:**
  - Сброс float, лейблы над инпутами, адаптивная 2-колоночная сетка для срока и CVV.
- [ ] **6. Создать страницу обработки редиректа (`/checkout/result`):**
  - Принимает `resourcePath` из query params.
  - Запрашивает статус в PayNT.
  - При успехе переводит заказ в `paid`, запускает доставку/инвойс.
  - При отказе отображает понятный экран с кнопкой «Попробовать снова».
