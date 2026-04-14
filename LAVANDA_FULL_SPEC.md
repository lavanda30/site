# LAVANDA — Повна специфікація системи управління шторами
### Версія: 1.0 · Дата: 29 березня 2026 · Автор: Костянтин Марченко

> **Мета документу:** Ця специфікація є повним технічним описом системи LAVANDA — від налаштування
> Salesforce-орга до рендерингу зображення штори на canvas. Будь-яка LLM або розробник,
> прочитавши цей документ, повинен бути здатний відтворити систему з нуля без додаткових запитань.

---

## ЗМІСТ

1. [Огляд системи](#1-огляд-системи)
2. [Архітектура проекту](#2-архітектура-проекту)
3. [Salesforce: налаштування орга](#3-salesforce-налаштування-орга)
4. [Об'єкт Contact__c — всі поля](#4-обєкт-contact__c--всі-поля)
5. [Об'єкт Curtain__c — всі поля](#5-обєкт-curtain__c--всі-поля)
6. [Логіка розрахунків (КРИТИЧНО)](#6-логіка-розрахунків-критично)
7. [Apex-тригери та хелпери](#7-apex-тригери-та-хелпери)
8. [Salesforce Flows](#8-salesforce-flows)
9. [REST API: які поля тягнути та як](#9-rest-api-які-поля-тягнути-та-як)
10. [Веб-сайт: структура файлів](#10-веб-сайт-структура-файлів)
11. [Веб-сайт: головна сторінка (index.html)](#11-веб-сайт-головна-сторінка)
12. [CRM-панель: agent-mode.js](#12-crm-панель-agent-modejs)
13. [CRM-панель: окремий портал /agent/](#13-crm-панель-окремий-портал-agent)
14. [Калькулятор: calculator.js](#14-калькулятор-calculatorjs)
15. [Рендеринг зображення: curtain-image.js](#15-рендеринг-зображення-curtain-imagejs)
16. [Стилі та дизайн-система](#16-стилі-та-дизайн-система)
17. [Відомі помилки та їх виправлення](#17-відомі-помилки-та-їх-виправлення)
18. [Чеклист розгортання з нуля](#18-чеклист-розгортання-з-нуля)

---

## 1. Огляд системи

LAVANDA — це система управління замовленнями на штори, яка складається з:

| Компонент | Технологія | Призначення |
|---|---|---|
| Salesforce org | Salesforce (custom objects) | Зберігання клієнтів та замовлень |
| Apex Trigger | Apex (before insert/update) | Автоматичний розрахунок цін при збереженні |
| Salesforce Flow | Flow Builder | Масовий оновлення статусів, дзеркалювання полів |
| Веб-сайт | Vanilla HTML/CSS/JS | Публічна презентація бренду LAVANDA |
| CRM-панель | Vanilla JS + Canvas API | Embedded-CRM всередині сайту + окремий агентський портал |
| OAuth 2.0 | Salesforce Connected App | Авторизація агентів без серверу |
| Canvas rendering | HTML5 Canvas 850×600 | Генерація зображення-кресленика штори |

### Загальний потік даних

```
Агент вводить дані у форму (браузер)
      ↓
JS calculator.js рахує live preview
      ↓
POST /sobjects/Curtain__c/ → Salesforce REST API
      ↓
Apex Trigger (before insert/update) → CurtainCalculator.calculateData()
      ↓
Поля GeneralPrice__c, Meterage__c тощо зберігаються в SF
      ↓
Сайт через GET /sobjects/Curtain__c/{id} отримує розраховані поля
      ↓
Canvas рендерить кресленик штори → зображення зберігається в ContentVersion
```

---

## 2. Архітектура проекту

```
lavanda/
├── src/                          ← Salesforce metadata (sfdx)
│   ├── classes/
│   │   ├── CurtainCalculator.cls       ← ГОЛОВНА логіка розрахунків
│   │   ├── CurtainTriggerHandler.cls   ← Диспетчер тригера
│   │   ├── CurtainTriggerHelper.cls    ← Утиліти (recalculate, populateFields)
│   │   ├── ContactTriggerHandler.cls   ← Диспетчер тригера контакту
│   │   └── ContactTriggerHelper.cls    ← Каскадне оновлення знижок
│   ├── triggers/
│   │   ├── CurtainTrigger.trigger      ← before/after insert+update
│   │   └── ContactTrigger.trigger      ← before/after insert+update
│   ├── flows/
│   │   ├── Mass_Status_Update.flow     ← Масове оновлення статусу + полів
│   │   └── Display_Curtain_Manufacturers.flow
│   └── objects/
│       ├── Contact__c.object           ← Клієнт (custom object)
│       └── Curtain__c.object           ← Штора (custom object, child of Contact__c)
│
└── website/                      ← Статичний веб-сайт (Netlify)
    ├── index.html                ← Головна сторінка + вбудована CRM
    ├── styles.css                ← Всі стилі сайту
    ├── script.js                 ← Логіка головної сторінки
    ├── _redirects                ← Netlify redirect rules (для OAuth callback)
    ├── Assets/                   ← Зображення штор, логотип, макети
    │   ├── макет штори до верхупетлі.jpg
    │   ├── макет штори до середини петлі.jpg
    │   ├── макет штори до низу петлі.jpg
    │   └── ...інші фото
    ├── shared/
    │   ├── sf-api.js             ← Salesforce REST API wrapper
    │   ├── calculator.js         ← Дзеркало CurtainCalculator.cls
    │   ├── curtain-image.js      ← Canvas рендеринг 850×600
    │   ├── agent-mode.js         ← Вбудована CRM для головної сторінки
    │   └── agent.css             ← Стилі CRM-панелі
    └── agent/
        ├── index.html            ← Окремий агентський портал
        ├── app.js                ← Логіка порталу
        └── styles.css            ← Стилі порталу
```

---

## 3. Salesforce: налаштування орга

### 3.1 Connected App (для OAuth)

**Setup → App Manager → New Connected App**

| Поле | Значення |
|---|---|
| Connected App Name | LAVANDA CRM |
| Enable OAuth Settings | ✓ |
| Callback URL | `https://your-netlify-site.netlify.app/` (точний збіг!) |
| Selected OAuth Scopes | `api`, `refresh_token` |
| Require Secret for Web Server Flow | ✗ (User-Agent Flow, без секрету) |

**Consumer Key** (client_id) → вставити в `website/shared/sf-api.js`:
```javascript
const SF_CONFIG = {
    consumerKey: 'YOUR_CONSUMER_KEY_HERE',
    loginUrl: 'https://login.salesforce.com',   // або https://test.salesforce.com для sandbox
    apiVersion: 'v63.0',
    callbackUrl: window.location.origin + '/'
};
```

### 3.2 OAuth Flow (User-Agent / Implicit)

1. Агент натискає "Увійти" → redirect на:
   ```
   https://login.salesforce.com/services/oauth2/authorize
     ?response_type=token
     &client_id={consumerKey}
     &redirect_uri={callbackUrl}
     &scope=api
   ```
2. Salesforce редиректить назад на `{callbackUrl}#access_token=...&instance_url=...`
3. `sf-api.js` → `handleCallback()` парсить hash, зберігає в `sessionStorage`
4. Подальші запити: `Authorization: Bearer {access_token}`

### 3.3 Netlify _redirects (обов'язково!)

```
/* /index.html 200
```
Без цього правила OAuth callback на `/` поверне 404.

---

## 4. Об'єкт Contact__c — всі поля

> **Важливо:** `Contact__c` — це **повністю кастомний** Salesforce object, НЕ стандартний Contact.

### 4.1 Стандартні поля

| API Name | Тип | Призначення |
|---|---|---|
| `Id` | ID | Унікальний ідентифікатор SF |
| `Name` | Text | **Ім'я клієнта** (стандартне поле nameField) — label: "Ім'я" |

### 4.2 Кастомні поля

| API Name | Тип SF | Label | Призначення |
|---|---|---|---|
| `ClientName__c` | Text(255) | **Телефон** | Телефон клієнта ⚠️ поле labeled "Телефон", але API name — ClientName__c |
| `Address__c` | Text(255) | Адреса | Повна адреса клієнта |
| `Description__c` | Text(255) | Коментар | Нотатки про клієнта |
| `GeneralDiscount__c` | Picklist | Спеціальні умови | Знижка/надбавка: 2,3,4,5,6,7,8,10,13,14,15 |
| `GeneralPrice__c` | Summary (SUM) | Сума всіх штор | Roll-up: SUM(Curtain__c.GeneralPrice__c) де GeneralPrice__c != null |
| `SelectedCurtains__c` | Summary (SUM) | Сума вибраних штор | Roll-up: SUM(Curtain__c.GeneralPrice__c) де Check__c = true |
| `FinalPrice__c` | Currency | Фінальна ціна | Узгоджена фінальна ціна (заповнюється вручну) |
| `Client_Status__c` | Formula (Text) | Статус клієнта | `IF(GeneralPrice__c < 10000, "🟢", IF(GeneralPrice__c <= 40000, "🟡", "🔴"))` |
| `Expenses__c` | Checkbox | Витрати | Позначка витрат |

### 4.3 Маппінг для веб-форми

```javascript
// Форма "Новий/редагувати контакт" — name-атрибути відповідають SF API names:
{
  "Name":               "Ім'я та прізвище клієнта",      // → SF: стандартне поле Name
  "ClientName__c":      "Телефон (+380...)",              // → SF: ClientName__c
  "GeneralDiscount__c": "Знижка (select: 2..15)",         // → SF: GeneralDiscount__c (picklist)
  "Address__c":         "Адреса",                         // → SF: Address__c
  "Description__c":     "Коментар"                        // → SF: Description__c
}
```

⚠️ **Поле `City__c` НЕ існує в SF** — не відправляти в API.

### 4.4 SOQL-запит для списку контактів

```soql
SELECT Id, Name, ClientName__c, Address__c, GeneralDiscount__c,
       Client_Status__c, GeneralPrice__c, Description__c, CreatedDate
FROM Contact__c
WHERE Name LIKE '%{search}%' OR ClientName__c LIKE '%{search}%'
ORDER BY CreatedDate DESC
LIMIT 50
```

### 4.5 Відображення контактів у списку

```javascript
// Поля для рядку контакту:
displayName   = c.Name           // Ім'я
phone         = c.ClientName__c  // Телефон (не Phone__c!)
status_badge  = c.Client_Status__c  // 🟢 / 🟡 / 🔴
// initials = перші 2 літери Name
```

---

## 5. Об'єкт Curtain__c — всі поля

> **Дочірній об'єкт Contact__c**. Relationship field: `Contact__c` (lookup).
> При REST API UPDATE — **ніколи не відправляти `Contact__c`** в тілі запиту
> (Salesforce блокує оновлення батьківського lookup після створення → 400 error).

### 5.1 Ідентифікаційні поля

| API Name | Тип | Примітка |
|---|---|---|
| `Id` | ID | SF ID |
| `Name` | Auto-set by trigger | Автоматично = label пікліста Type__c. Якщо не знайдено → "ШТОРА?" |
| `Name__c` | Text(255) | Назва тканини / артикул |
| `Type__c` | Picklist | **Штора** / **Тюль** |
| `Room__c` | Text | Кімната (Спальня, Вітальня тощо) |
| `Contact__c` | Lookup(Contact__c) | Батьківський контакт |
| `ContactName__c` | Formula | Ім'я контакту (для відображення) |
| `Status__c` | Picklist | На розгляді / Обрано клієнтом / Замовлено тканину / В цеху / Очікує видачі / Виконано |
| `Check__c` | Checkbox | Відмічено клієнтом (для SelectedCurtains__c roll-up) |
| `Description__c` | Text | Коментар |

### 5.2 Розмірні поля (Карниз 1)

| API Name | Тип SF | Label | Формат |
|---|---|---|---|
| `CarnizWigth__c` | Text | Ширина карнізу | Число в сантиметрах (напр. "300") |
| `CustomWigth__c` | Text | Ширина тканини вручну | Число в см — перекриває CarnizWigth якщо заповнено |
| `Height__c` | Text | Висота | Число в см |
| `HeightPoint__c` | Picklist | Точка виміру висоти | Пікліст значень (7 варіантів — детально в 5.4) |
| `Quantity__c` | Picklist | Кількість штор | "1" / "2" / "3" / "4" (текстовий!) |
| `Nisha__c` | Picklist | Ніша | yes / no |
| `Carniz__c` | Picklist | Тип карнізу | gardinia / alutat / ks / lux / ds / circle / metal / other |
| `Diameter__c` | Picklist | Діаметр труби | 2 / 2.5 / 3 / 1.5 / 3.5 / 4 / 4.5 / 5 |

### 5.3 Збірка та тасьма (Карниз 1)

| API Name | Тип SF | Значення |
|---|---|---|
| `CoefficientZbirki__c` | Text | **Головний коефіцієнт**: "Enigma 1:2", "Enigma 1:2,5" тощо. Використовується в розрахунку метражу. Парситься: split(':')[1] → float |
| `Zbirka__c` | Picklist | Тип збірки (інформаційно): Enigma 1:1,5 / 1:1,65 / 1:1,8 / 1:2 / 1:2,5 / 1:3 / Sofora 1:1,8 / Sofora 1:2 / Pinella / Хвиля 1:1,5 / Хвиля 1:2 / Люверсна / Глайдерна 1:2 + FES / Pinella 5 см звичайна рівномірна 1:2 / Pinella 5 см звичайна вафелька 1:2 |
| `zbirkaTasmu__c` | Text/Picklist | Збірка тасьми (інформаційно) |
| `Tasma__c` | Picklist | Тип тасьми: Прозора фіксована / ХБ фіксована / Не фіксована |
| `TasmaPlace__c` | Text | Місце тасьми (зверху, посередині) |

### 5.4 HeightPoint__c — допустимі значення пікліста

| Значення | Meaning | Y-позиція на canvas (850×600) |
|---|---|---|
| `від краю до краю` | Повна висота | yTop=32, yBot=555 |
| `до карнізу` | До карнізу | yTop=32, yBot=75 |
| `до гачка` | До гачка | yTop=32, yBot=120 |
| `до верхньої петлі` | До верху петлі | yTop=32, yBot=165 |
| `до другої петлі` | До середини петлі | yTop=32, yBot=310 |
| `до нижньої петлі` | До низу петлі | yTop=32, yBot=465 |
| `до тасьми` | До тасьми | yTop=32, yBot=420 |

> ⚠️ Значення `від підлоги` — **НЕ існує** в пікліcті SF! Не використовувати у формі.

### 5.5 Цінові поля (вхідні — Карниз 1)

| API Name | Тип SF | Пікліст значень | Призначення |
|---|---|---|---|
| `Price__c` | Text/Picklist | Довільне число (ціна за м тканини) | Ціна тканини (грн/м) |
| `TasmaPrice__c` | Picklist | 35/45/55/65/85/110/130/140/150/160/230 | Ціна тасьми (грн/м) |
| `PoshivPrice__c` | Picklist | 150/160/180/200/220/240/260/280/300/320/360 | Ціна пошиву (грн/м) |
| `NavisPrice__c` | Picklist | 120/140/160/180/200 | Ціна навісу (грн/м) |
| `Navis__c` | Checkbox | — | Чи є навіс |
| `Viizd__c` | Checkbox | — | Чи є виїзд (+500 грн до навісу) |
| `Delivery__c` | Picklist | 65/80/100/120/150/180/200/220 | Ціна доставки (грн за 1 раз) |
| `DeliveryNumber__c` | Picklist | 1/2/3/4 | Кількість доставок |
| `CurtainDiscount__c` | Picklist | 2/3/4/5/6/7/8/10/13/14/15 | Знижка/надбавка (ПАРНЕ=надбавка, НЕПАРНЕ=знижка) |
| `ManualPrice__c` | Currency | — | Ручна ціна (якщо задана — пропустити весь розрахунок) |

### 5.6 Розраховані поля (output — Карниз 1) — зберігаються Apex Trigger

| API Name | Тип SF | Формула |
|---|---|---|
| `Meterage__c` | Text | Метраж тканини (м) |
| `MeterageNaPoshiv__c` | Text | Метраж на пошив (м), округлено по спец. правилу |
| `TasmaMetrage__c` | Text | Метраж тасьми (м) |
| `CurtainPriceSum__c` | Text | Вартість тканини (грн) = Meterage × Price |
| `TasmaPriceSum__c` | Text | Вартість тасьми (грн) = TasmaMetrage × TasmaPrice |
| `PoshivPriceSum__c` | Text | Вартість пошиву (грн) = Meterage × PoshivPrice |
| `NavisPriceSum__c` | Text | Вартість навісу (грн) = Meterage × NavisPrice [+ 500 якщо Viizd] |
| `GeneralPrice__c` | Currency | **Загальна ціна штори** (після знижки/надбавки) |

### 5.7 Поля "Карниз 2" (дублікат для другого карниза)

Усі поля з суфіксом `2__c` — точна копія вищеописаних для другого карниза в тій самій кімнаті:
`CarnizWigth2__c`, `CustomWigth2__c`, `Height2__c`, `HeightPoint2__c`, `Quantity2__c`,
`CoefficientZbirki2__c` (або через `Zbirka2__c`), `Tasma2__c`, `TasmaPlace2__c`,
`Price2__c`, `TasmaPrice2__c`, `PoshivPrice2__c`, `NavisPrice2__c`, `Navis2__c`,
`Viizd2__c`, `Delivery2__c`, `DeliveryNumber2__c`, `CurtainDiscount2__c`,
`ManualPrice2__c`, `Meterage2__c`, `MeterageNaPoshiv2__c`, `TasmaMetrage2__c`,
`CurtainPriceSum2__c`, `TasmaPriceSum2__c`, `PoshivPriceSum2__c`, `NavisPriceSum2__c`,
`GeneralPrice2__c`, `Name2__c`, `Type2__c`, `Room2__c`, `Height2__c`, `Carniz2__c`,
`Nisha2__c`, `Zbirka2__c`, `zbirkaTasmu2__c` (якщо є), `ObrobkaNiz2__c`, `Description2__c`,
`Check2__c`, `Status2__c`.

> Карниз 2 розраховується якщо `CarnizWigth2__c != null` — через метод `calculateDataCarniz2()`.

### 5.8 Додаткові поля

| API Name | Тип | Призначення |
|---|---|---|
| `ObrobkaNiz__c` | Picklist | Обробка низу: Обтяжувач / 3x3W / 5x5W / 10x10W / 12x12W |
| `AdvancePaymentReceived__c` | Checkbox | Аванс отримано |
| `CurtainPaid__c` | Checkbox/Field | Штора оплачена |
| `PostpaidReceived__c` | Checkbox | Постоплата отримана |
| `Ordered__c` | Checkbox | Замовлено |
| `PicturesAttached__c` | Checkbox | Зображення прикріплено |
| `FinalPrice__c` | Currency | Фінальна погоджена ціна |
| `ContactDiscount__c` | Formula | Копія знижки з батьківського контакту |

### 5.9 SOQL для списку штор (для картки клієнта)

```soql
SELECT Id, Name, Name__c, Type__c, Room__c,
       GeneralPrice__c, Meterage__c, Status__c,
       CoefficientZbirki__c, CurtainDiscount__c,
       HeightPoint__c, Height__c, CreatedDate
FROM Curtain__c
WHERE Contact__c = '{contactId}'
ORDER BY CreatedDate DESC
```

### 5.10 Отримання повного запису для редагування

```
GET /services/data/v63.0/sobjects/Curtain__c/{id}
```
→ Повертає всі поля (включно з Price__c, TasmaPrice__c, Navis__c тощо).
**Завжди використовувати для відкриття форми редагування** — список повертає лише мінімальний набір.

---

## 6. Логіка розрахунків (КРИТИЧНО)

> Це точна копія `CurtainCalculator.cls` (Apex). JavaScript версія — `calculator.js`.
> **Обидва файли повинні містити ІДЕНТИЧНУ математику.**

### 6.1 Загальний алгоритм (1 карниз)

```
INPUT: CarnizWigth__c, CustomWigth__c, CoefficientZbirki__c,
       Quantity__c, Price__c, TasmaPrice__c, PoshivPrice__c,
       NavisPrice__c, Navis__c, Viizd__c,
       Delivery__c, DeliveryNumber__c, CurtainDiscount__c,
       ManualPrice__c (якщо задана — весь автоматичний розрахунок пропускається)

OUTPUT: Meterage__c, MeterageNaPoshiv__c, TasmaMetrage__c,
        CurtainPriceSum__c, TasmaPriceSum__c, PoshivPriceSum__c,
        NavisPriceSum__c, GeneralPrice__c
```

### 6.2 КРОК 1: Розрахунок метражу тканини

**Умова А: задано `CustomWigth__c` (пріоритет)**
```
rawMeterage = CustomWigth__c / 100
Meterage__c = ceil(rawMeterage × 10) / 10     ← округлення вгору до 1 знаку
```

**Умова Б: задано `CarnizWigth__c` + `CoefficientZbirki__c`**
```
// Парсимо коефіцієнт із рядка виду "Enigma 1:2" або "Sofora 1:1,8"
coeff = parseFloat( CoefficientZbirki__c.split(':')[1].replace(',', '.') )

qty   = parseFloat(Quantity__c) || 1

rawMeterage = (CarnizWigth__c × coeff / 100) + (qty × 0.1)
Meterage__c = ceil(rawMeterage × 10) / 10
```

> ⚠️ У старому коді був варіант через `Zbirka__c` і Map<String,Decimal>. **Поточний (правильний)**
> варіант — через `CoefficientZbirki__c` (text field, форматований як "Enigma 1:2").

### 6.3 КРОК 2: Спеціальне округлення (roundMeterage)

```
Ця функція застосовується до MeterageNaPoshiv та TasmaMetrage:

floored = floor(value × 10) / 10        ← зрізаємо до 1 знаку
fraction = floored - floor(floored)      ← дрібна частина

if fraction ∈ {0.1, 0.2, 0.6} → return floored          (не змінюємо)
if fraction ∈ {0.3, 0.4, 0.5} → return floor(floored)+0.5   (до .5)
if fraction >= 0.7              → return floor(floored)+1    (вгору до цілого)
if fraction == 0.0              → return floored             (ціле — не чіпаємо)
```

**Приклади:**
```
roundMeterage(3.1) = 3.1    roundMeterage(3.3) = 3.5
roundMeterage(3.6) = 3.6    roundMeterage(3.7) = 4.0
roundMeterage(3.4) = 3.5    roundMeterage(4.0) = 4.0
```

### 6.4 КРОК 3: Похідні метражі

```
MeterageNaPoshiv__c = roundMeterage(Meterage__c)
TasmaMetrage__c     = roundMeterage(Meterage__c + qty × 0.1)
```

### 6.5 КРОК 4: Цінові підсуми

```
CurtainPriceSum__c  = Meterage__c       × Price__c        (якщо Price__c > 0)
TasmaPriceSum__c    = TasmaMetrage__c   × TasmaPrice__c   (якщо TasmaPrice__c > 0)
PoshivPriceSum__c   = Meterage__c       × PoshivPrice__c  (якщо PoshivPrice__c > 0)

NavisPriceSum__c:
  if Navis__c = true AND NavisPrice__c > 0:
    NavisPriceSum__c = Meterage__c × NavisPrice__c + (Viizd__c ? 500 : 0)
  else:
    NavisPriceSum__c = 0
```

### 6.6 КРОК 5: Доставка

```
deliveryTotal:
  if Delivery__c > 0 AND DeliveryNumber__c > 0:
    deliveryTotal = Delivery__c × DeliveryNumber__c
  else:
    deliveryTotal = 0
```

### 6.7 КРОК 6: Фінальна ціна

```
sumBeforeDiscount = CurtainPriceSum__c + TasmaPriceSum__c +
                    PoshivPriceSum__c  + NavisPriceSum__c  + deliveryTotal

// Знижка:
discount = CurtainDiscount__c (int)  ← або parentContact.GeneralDiscount__c якщо CurtainDiscount пустий

if discount > 0:
  if discount % 2 == 0 → надбавка: finalPrice = sumBeforeDiscount × (1 + discount/100)
  if discount % 2 != 0 → знижка:   finalPrice = sumBeforeDiscount × (1 - discount/100)
else:
  finalPrice = sumBeforeDiscount

GeneralPrice__c = round(finalPrice)
```

### 6.8 КРОК 7: ManualPrice (ручна ціна)

```
if ManualPrice__c != null:
  // Пропустити весь розрахунок метражів та цін
  // Але все одно розрахувати Meterage__c із CustomWigth__c (якщо є)
  finalPrice = ManualPrice__c
  // Застосувати знижку/надбавку (так само як у КРОК 6)
  GeneralPrice__c = round(finalPrice)
```

### 6.9 Таблиця коефіцієнтів збірки

```javascript
{
  'Enigma 1:1,5':       1.5,
  'Enigma 1:1,65':      1.65,
  'Enigma 1:1,8':       1.8,
  'Enigma 1:2':         2.0,   // ← Default
  'Enigma 1:2,5':       2.5,
  'Enigma 1:3':         3.0,
  'Sofora 1:1,8':       1.8,
  'Sofora 1:2':         2.0,
  'Pinella':            1.0,
  'Хвиля 1:2':          2.0,
  'Хвиля 1:1,5':        1.5,
  'Люверсна':           2.0,
  'Глайдерна 1:2 + FES': 2.0
}
```

### 6.10 Повний приклад розрахунку

```
Вхід:
  CarnizWigth__c = "300" (300 см)
  CoefficientZbirki__c = "Enigma 1:2"
  Quantity__c = "2"
  Price__c = "800"
  TasmaPrice__c = "85"
  PoshivPrice__c = "200"
  NavisPrice__c = "160"
  Navis__c = true
  Viizd__c = false
  Delivery__c = "120"
  DeliveryNumber__c = "2"
  CurtainDiscount__c = "5"  ← непарне → знижка

Розрахунок:
  rawMeterage = (300 × 2 / 100) + (2 × 0.1) = 6.0 + 0.2 = 6.2
  Meterage__c = ceil(6.2 × 10) / 10 = 6.2

  MeterageNaPoshiv__c = roundMeterage(6.2) = 6.2 (fraction=0.2 → без змін)
  TasmaMetrage__c = roundMeterage(6.2 + 2×0.1) = roundMeterage(6.4) = 6.5 (fraction=0.4→0.5)

  CurtainPriceSum__c  = 6.2 × 800 = 4960
  TasmaPriceSum__c    = 6.5 × 85  = 552.5
  PoshivPriceSum__c   = 6.2 × 200 = 1240
  NavisPriceSum__c    = 6.2 × 160 + 0 = 992
  deliveryTotal       = 120 × 2 = 240

  sumBeforeDiscount = 4960 + 552.5 + 1240 + 992 + 240 = 7984.5
  discount = 5 (непарне → знижка)
  finalPrice = 7984.5 × (1 - 0.05) = 7984.5 × 0.95 = 7585.275

  GeneralPrice__c = round(7585.275) = 7585 грн
```

---

## 7. Apex-тригери та хелпери

### 7.1 Тригер на Curtain__c

```apex
// CurtainTrigger.trigger
trigger CurtainTrigger on Curtain__c (
    before insert, before update, before delete,
    after insert, after update, after delete, after undelete
) {
    CurtainTriggerHandler.run(
        Trigger.new, Trigger.old, Trigger.newMap, Trigger.oldMap,
        Trigger.isBefore, Trigger.isAfter,
        Trigger.isInsert, Trigger.isUpdate, Trigger.isDelete, Trigger.isUndelete
    );
}
```

### 7.2 Ланцюжок виклику тригера Curtain__c

```
BEFORE INSERT:
  1. CurtainCalculator.calculateData(newList)    ← розрахунок усіх цін
  2. CurtainTriggerHelper.populateFields(newList) ← Name = label of Type__c

BEFORE UPDATE:
  1. CurtainTriggerHelper.recalculateFields(newList)  → CurtainCalculator.calculateData()
  2. Для кожного зміненого запису:
     CurtainTriggerHelper.populateFields(updatedRecords) ← оновити Name
```

### 7.3 populateFields — автоматичне ім'я запису

```apex
// CurtainTriggerHelper.populateFields()
// Бере label з пікліста Type__c і встановлює як Name запису
// Якщо Type__c = "Штора" → Name = "Штора"
// Якщо Type__c = "Тюль"  → Name = "Тюль"
// Якщо не знайдено → Name = "ШТОРА?"
curt.Name = picklistMap.get(curt.Type__c) ?? 'ШТОРА?';
```

### 7.4 Тригер на Contact__c

```
AFTER UPDATE:
  Якщо GeneralDiscount__c змінився:
    ContactTriggerHelper.updateRelatedCurtainsDiscount(contact)
    → Знаходить всі Curtain__c WHERE Contact__c = :contact.Id
    → Встановлює CurtainDiscount__c = contact.GeneralDiscount__c
    → Database.update(relatedCurtains)
    → Це тригерить BEFORE UPDATE на кожній шторі → перерахунок GeneralPrice__c
```

### 7.5 Важливі нюанси тригерів

- **Всі числові поля** (`Meterage__c`, `CurtainPriceSum__c` тощо) зберігаються як **Text** у SF
  і обробляються через `Decimal.valueOf()` / `extractDecimal()`.
- Метод `extractDecimal(String value)` — видаляє всі нечислові символи крім крапки перед парсингом.
- **ManualPrice__c** (Currency) — якщо не `null`, весь автоматичний розрахунок **пропускається**.
  Застосовується лише знижка.
- `CarnizWigth2__c != null` → викликається `calculateDataCarniz2()` для другого карниза.

---

## 8. Salesforce Flows

### 8.1 Flow: Mass_Status_Update

**Тип:** Screen Flow
**Запуск:** з ListView Curtain__c (кнопка "Масовий статус")
**Призначення:** Масове оновлення полів для **виділених** штор

**Вхідні змінні (Screen-поля):**
- `Status__c` (picklist) — новий статус (або порожній = не змінювати)
- `Name__c` (text) — назва тканини
- `Height__c` (text) — висота
- `HeightPoint__c` (picklist) — точка виміру
- `Tasma__c` (picklist) — тасьма
- `CoefficientZbirki__c` (picklist → `formula_zbirka`) — тип збірки
- `PoshivPrice__c` (picklist) — ціна пошиву
- `CurtainDiscount__c` (picklist) — знижка
- `Description__c` (text) — коментар
- `ObrobkaNiz__c` (picklist) — обробка низу
- `Price__c` (text) — ціна тканини
- `Check__c` (checkbox) — відмітити

**Логіка формул (для кожного поля):**
```
formula_status    = IF(ISBLANK({!Status}),    {!Loop.Status__c},    {!Status})
formula_name      = IF(ISBLANK({!Name}),      {!Loop.Name__c},      {!Name})
formula_height    = IF(ISBLANK({!Height}),    {!Loop.Height__c},    {!Height})
formula_tasma     = IF(ISBLANK({!Tasma}),     {!Loop.Tasma__c},     {!Tasma})
formula_zbirka    = IF(ISBLANK({!Zbirka}),    {!Loop.CoefficientZbirki__c}, {!Zbirka})
formula_pricePoshiv = IF(ISBLANK({!PoshivPrice}), {!Loop.PoshivPrice__c}, {!PoshivPrice})
formula_discount  = IF(ISBLANK({!Discount}),  TEXT({!Loop.CurtainDiscount__c}), TEXT({!Discount}))
formula_comment   = IF(ISBLANK({!Comment}),   {!Loop.Description__c}, {!Comment})
formula_heightPoint = IF(ISBLANK({!HeightPoint}), {!Loop.HeightPoint__c}, {!HeightPoint})
formula_obrobkaNiz = IF(ISBLANK({!ObrobkaNiz}), {!Loop.ObrobkaNiz__c}, {!ObrobkaNiz})
formula_price     = IF(ISBLANK({!Price}),     {!Loop.Price__c},     {!Price})
formula_select    = {!SelectCheckbox}         ← пряме призначення
```

**Ключова логіка:** Якщо поле залишено порожнім у формі — **значення не змінюється** (зберігається поточне з Loop).

**Для карниза 2 (якщо `CarnizWigth2__c != null`):**
Ті самі поля з суфіксом `2`: `formula_name2`, `formula_height2`, `formula_tasma2` тощо.

**Decision: Carniz_2_Presented:**
```
IF Selected_Curtains_Loop.CarnizWigth2__c != null
  → Curtain_Fields_Carniz_2_Assignment (встановити поля _2)
  → Curtain_Object_Assignment
ELSE
  → Curtain_Object_Assignment
```

**Фінальна дія:** `Update Records` → `collection_curtainToUpdate`
→ Apex Trigger спрацьовує → перераховує GeneralPrice__c

### 8.2 Flow: Display_Curtain_Manufacturers

**Тип:** Screen Flow (допоміжний)
**Призначення:** Відображення виробників карнізів — інформаційний

---

## 9. REST API: які поля тягнути та як

### 9.1 Базова конфігурація

```javascript
// sf-api.js
const SF_CONFIG = {
    consumerKey: 'YOUR_CLIENT_ID',
    loginUrl: 'https://login.salesforce.com',
    apiVersion: 'v63.0',
    callbackUrl: window.location.origin + '/'
};

// Авторизація: sessionStorage
// KEY: 'lavanda_sf_token'    → access_token
// KEY: 'lavanda_sf_instance' → instance_url (напр. https://myorg.my.salesforce.com)
```

### 9.2 Endpoint шаблони

```javascript
// Базовий URL:
`${instanceUrl}/services/data/v63.0${path}`

// Contacts:
GET  /query/?q=SELECT...FROM Contact__c...
GET  /sobjects/Contact__c/{id}
POST /sobjects/Contact__c/          ← body: {Name, ClientName__c, ...}
PATCH /sobjects/Contact__c/{id}     ← body: поля що змінились (БЕЗ Id!)

// Curtains:
GET  /query/?q=SELECT...FROM Curtain__c WHERE Contact__c='{id}'...
GET  /sobjects/Curtain__c/{id}      ← ПОВНИЙ запис для редагування
POST /sobjects/Curtain__c/          ← body: {Contact__c, Type__c, ...} (БЕЗ розрахованих полів)
PATCH /sobjects/Curtain__c/{id}     ← body: змінені поля (⚠️ БЕЗ Contact__c!)

// Зображення:
POST /sobjects/ContentVersion/
  body: { Title, VersionData (base64), PathOnClient, FirstPublishLocationId: curtainId }
```

### 9.3 Критична помилка: Contact__c при UPDATE

```javascript
// ❌ НЕПРАВИЛЬНО — дає API 400 "Unable to update fields: Contact__c"
const data = { Contact__c: selectedContact.Id, Type__c: '...', ... };
await updateCurtain(curtainId, data);

// ✅ ПРАВИЛЬНО — Contact__c тільки при CREATE
const isUpdate = !!editingCurtainId;
const data = isUpdate ? {} : { Contact__c: selectedContact.Id };
// ... потім додати інші поля
await (isUpdate ? updateCurtain(id, data) : createCurtain(data));
```

### 9.4 Поля для POST (create) штори

```javascript
// Мінімально необхідні для збереження:
{
    Contact__c:          selectedContact.Id,  // ← тільки при CREATE
    Type__c:             "Штора",             // обов'язково (визначає Name)
    // Опціональні:
    Name__c:             "Артикул/назва тканини",
    Room__c:             "Спальня",
    CarnizWigth__c:      "300",
    CoefficientZbirki__c:"Enigma 1:2",
    Height__c:           "280",
    HeightPoint__c:      "до нижньої петлі",
    Quantity__c:         "1",
    Price__c:            "800",
    TasmaPrice__c:       "85",
    PoshivPrice__c:      "200",
    NavisPrice__c:       "160",
    Navis__c:            true,
    Viizd__c:            false,
    Delivery__c:         "120",
    DeliveryNumber__c:   "2",
    CurtainDiscount__c:  "5",
    Tasma__c:            "Прозора фіксована",
    TasmaPlace__c:       "зверху",
    ObrobkaNiz__c:       "Обтяжувач",
    Description__c:      "нотатки"
}
// Поля Meterage__c, GeneralPrice__c тощо НЕ відправляти — вони розраховуються trigger'ом
```

### 9.5 Отримати розраховані поля після збереження

```javascript
// Після POST/PATCH Apex Trigger розраховує поля.
// Зачекати ~2 сек, потім:
const updated = await getCurtain(savedId);
// updated.GeneralPrice__c, updated.Meterage__c — вже будуть розраховані
showToast('Розраховано: ' + updated.GeneralPrice__c + ' ₴');
```

---

## 10. Веб-сайт: структура файлів

```
website/
├── index.html          ← Головна сторінка (публічна + вбудована CRM)
├── styles.css          ← 2069 рядків CSS (design tokens + всі компоненти)
├── script.js           ← Preloader, Navigation, ScrollAnimations, ProductFilter,
│                         Configurator (цінова форма), Testimonials, Forms,
│                          SmoothScroll, AgentMode bootstrap
├── shared/
│   ├── sf-api.js       ← REST API wrapper (OAuth + CRUD)
│   ├── calculator.js   ← Математика розрахунків (дзеркало Apex)
│   ├── curtain-image.js← Canvas 850×600 рендеринг
│   ├── agent-mode.js   ← Вся логіка вбудованої CRM
│   └── agent.css       ← Стилі CRM-компонентів
└── agent/
    ├── index.html      ← Окремий портал агента
    ├── app.js          ← Логіка порталу (аналог agent-mode.js)
    └── styles.css      ← Стилі порталу
```

**Порядок підключення скриптів в `index.html`:**
```html
<script src="shared/sf-api.js"></script>
<script src="shared/calculator.js"></script>
<script src="shared/curtain-image.js"></script>
<script src="shared/agent-mode.js"></script>
<script src="script.js"></script>
```

**Порядок підключення скриптів в `agent/index.html`:**
```html
<script src="../shared/sf-api.js"></script>
<script src="../shared/calculator.js"></script>
<script src="../shared/curtain-image.js"></script>
<script src="app.js"></script>
```

---

## 11. Веб-сайт: головна сторінка

### 11.1 Секції index.html (по порядку)

1. **Preloader** — `.preloader` з анімованим лого
2. **Nav** — sticky navbar з логотипом LAVANDA, посилання на секції, кнопки агента
3. **Hero** — CSS curtain animation (2 div .curtain-left/.curtain-right), h1, кнопки CTA
4. **Brand Strip** — 4 статистики (500+ клієнтів, 10 років, ручна робота, під ключ)
5. **Categories** — grid 2×2 з фото із Assets/
6. **Inspiration Gallery** — masonry-like grid 5 зображень із Assets/
7. **Products** — grid 3×2 з фільтром (all/curtains/sheers/blinds/accessories)
8. **Configurator** — mini-калькулятор (вибір тканини, кольору, ширини, типу кріплення)
9. **Testimonials** — slider з 3 відгуків
10. **CTA** — форма зворотнього зв'язку з фоновим фото із Assets/
11. **CRM Section** — `<section id="crm">` — вбудована CRM (видима тільки після OAuth)
12. **Footer** — контакти, соцмережі

### 11.2 Assets — зображення (website/Assets/)

| Файл | Використання |
|---|---|
| `макет штори до верхупетлі.jpg` | Canvas background для HeightPoint = до верхньої петлі/до карнізу/до гачка |
| `макет штори до середини петлі.jpg` | Canvas background для до другої петлі/до тасьми |
| `макет штори до низу петлі.jpg` | Canvas background для до нижньої петлі/від краю до краю |
| `Лаванда лого.jpg` | Логотип бренду |
| `штори з тюлямі гарні багато.jpg` | Category Вітальня, Testimonial 1 |
| `штори спальня бежеві.jpg` | Category Спальня, Testimonial 2 |
| `тюль мансардне вікно.jpg` | Category Кухня, Product Хмарний вуаль |
| `тюль велика дім.jpg` | Category Тюлі, Product Ранковий туман |
| `штори з тюлямі гарні багато ракурс 2.jpg` | Gallery tall, CTA background |
| `штора і тюль гарні.jpg` | Gallery, Testimonial 3 |
| `штори з підвязками.jpg` | Gallery wide |
| `штори дитяча в ніші.jpg` | Gallery |
| `штори кімната.jpg` | Product Льняна гармонія |
| `штори люверси.jpg` | Product Штори-люверси |
| `римська штора відкрита.jpg` | Product Римська штора |
| `photo_2026-03-28_10-43-45.jpg` | Product Оксамитова розкіш |
| `photo_2026-03-28_10-44-51.jpg` | Резервне |
| `CurtainJPEG.jpg`, `CurtainJPEG_new.jpg` | Загальне фото штор |
| `римська штора у вікні.jpg` | Загальне |

**URL-кодування для HTML src атрибутів:**
```javascript
// Браузер обробляє автоматично, але якщо потрібно encode вручну:
'Assets/' + encodeURIComponent('штори кімната.jpg')
// = 'Assets/%D1%88%D1%82%D0%BE%D1%80%D0%B8%20%D0%BA%D1%96%D0%BC%D0%BD%D0%B0%D1%82%D0%B0.jpg'
```

---

## 12. CRM-панель: agent-mode.js

### 12.1 Призначення

`agent-mode.js` — Self-contained IIFE (`(function(){...}())`), реалізує повноцінну CRM
безпосередньо всередині `index.html`. Активується тільки після OAuth-авторизації.

### 12.2 Стейт

```javascript
const S = {
    contacts: [],           // список контактів (з getContacts SOQL)
    selectedContact: null,  // активний контакт
    curtains: [],           // штори активного контакту (з getCurtains SOQL)
    editingContactId: null, // null = новий, ID = редагування
    editingCurtainId: null  // null = нова, ID = редагування
};
```

### 12.3 Ініціалізація

```
DOMContentLoaded →
  handleCallback()       ← парсить OAuth hash з URL
  renderAuthState()      ← показує/ховає CRM nav-елементи
  if (isAuthenticated()):
    activateCRM()        ← getUserInfo() + loadContacts()
  bindNavEvents()
  bindContactDrawerEvents()
  bindCurtainDrawerEvents()
```

### 12.4 DOM ID-и (CRM section у index.html)

| ID | Призначення |
|---|---|
| `crm` | Коренева секція CRM |
| `crmContactsList` | Список контактів (ліва колонка) |
| `crmSearch` | Поле пошуку |
| `crmContactsCount` | Лічильник контактів |
| `crmNewContactBtn` | Кнопка "Новий контакт" |
| `crmEditContactBtn` | Кнопка "Редагувати контакт" |
| `crmSelectedName` | Ім'я вибраного контакту |
| `crmSelectedMeta` | Телефон + адреса + знижка |
| `crmCurtainsHd` | Заголовок панелі штор |
| `crmCurtainsGrid` | Картки штор |
| `crmCurtainsPlaceholder` | "Виберіть контакт" |
| `crmNewCurtainBtn` | Нова штора |
| `crmContactOverlay` | Overlay drawer контакту |
| `crmContactForm` | Форма контакту |
| `crmCurtainOverlay` | Overlay drawer штори |
| `crmCurtainForm` | Форма штори |
| `crmCurtainCanvas` | Canvas 850×600 |
| `crmCanvasSection` | Секція канвасу |
| `crmSaveCurtain` | Кнопка зберегти штору |
| `crmSaveCurtainTxt` | Текст кнопки |
| `crmSaveImgToSF` | Кнопка зберегти зображення в SF |
| `crmToasts` | Контейнер для toast повідомлень |
| `agentLoginBtn` | Кнопка "Агент" в nav |
| `agentLoggedIn` | Блок "Агент авторизований" |
| `agentUserName` | Ім'я агента |
| `agentLogoutBtn` | Вийти |
| `crmUserBadge` | Чіп з іменем агента всередині CRM |

### 12.5 Форма контакту (crmContactForm — name атрибути)

```html
name="Name"               ← SF: стандартне поле Name
name="ClientName__c"      ← SF: ClientName__c (телефон!)
name="GeneralDiscount__c" ← SF: GeneralDiscount__c (select, значення: 2..15)
name="Address__c"         ← SF: Address__c
name="Description__c"     ← SF: Description__c
```

### 12.6 Форма штори (crmCurtainForm — name атрибути та їх валідні значення)

```html
<!-- ОСНОВНА ІНФОРМАЦІЯ -->
name="Type__c"              select: Штора | Тюль
name="Room__c"              text: назва кімнати
name="Name__c"              text: назва тканини/артикул

<!-- РОЗМІРИ -->
name="CarnizWigth__c"       number (cm): ширина карнізу
name="CustomWigth__c"       number (cm): кастомна ширина (перекриває CarnizWigth)
name="Height__c"            number (cm): висота
name="HeightPoint__c"       select: від краю до краю | до карнізу | до гачка |
                                    до верхньої петлі | до другої петлі |
                                    до нижньої петлі | до тасьми
name="Quantity__c"          select: 1 | 2 | 3 | 4

<!-- ЗБІРКА -->
name="CoefficientZbirki__c" select: Enigma 1:1,5 | Enigma 1:1,65 | ... | Люверсна
name="Zbirka__c"            select: (інформаційно)
name="zbirkaTasmu__c"       select: (інформаційно)
name="Tasma__c"             select: Прозора фіксована | ХБ фіксована | Не фіксована
name="TasmaPlace__c"        text: зверху/посередині

<!-- ЦІНИ -->
name="Price__c"             number: ціна тканини грн/м
name="TasmaPrice__c"        select: 35|45|55|65|85|110|130|140|150|160|230
name="PoshivPrice__c"       select: 150|160|180|200|220|240|260|280|300|320|360
name="NavisPrice__c"        select: 120|140|160|180|200
name="Navis__c"             checkbox
name="Viizd__c"             checkbox (виїзд +500грн)
name="Delivery__c"          select: 65|80|100|120|150|180|200|220
name="DeliveryNumber__c"    select: 1|2|3|4
name="CurtainDiscount__c"   select: 2|3|4|5|6|7|8|10|13|14|15

<!-- ДОДАТКОВО -->
name="ObrobkaNiz__c"        select: Обтяжувач|3 x 3 W|5 х 5 W|10 x 10 W|12 x 12 W
name="Description__c"       textarea
name="Status__c"            select: На розгляді|Обрано клієнтом|Замовлено тканину|
                                    В цеху|Очікує видачі|Виконано
```

### 12.7 saveCurtain — правила формування payload

```javascript
const isEdit = !!S.editingCurtainId;

// Contact__c — ТІЛЬКИ при створенні!
const data = isEdit ? {} : { Contact__c: S.selectedContact.Id };

// Text поля
['Type__c','Room__c','Name__c','HeightPoint__c','CoefficientZbirki__c',
 'Zbirka__c','zbirkaTasmu__c','Tasma__c','TasmaPlace__c','Delivery__c',
 'CurtainDiscount__c','ObrobkaNiz__c','Status__c','Description__c'
].forEach(f => { if (rawData[f]) data[f] = rawData[f]; });

// Числові поля (теж відправляємо як string — SF конвертує)
['CarnizWigth__c','CustomWigth__c','Height__c','Quantity__c','Price__c',
 'TasmaPrice__c','PoshivPrice__c','NavisPrice__c','DeliveryNumber__c'
].forEach(f => { if (rawData[f]) data[f] = rawData[f]; });

// Чекбокси
data.Navis__c = rawData.Navis__c;  // boolean
data.Viizd__c = rawData.Viizd__c;

// Видалити порожні рядки
Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });
```

### 12.8 Live calculator preview

```javascript
// Спрацьовує на кожну зміну .crm-calc елементів у формі
// Викликає LavandaCalculator.calculate(formData)
// Оновлює DOM елементи:
ccMeterage         ← Meterage__c
ccMeterageNaPoshiv ← MeterageNaPoshiv__c
ccTasmaMetrage     ← TasmaMetrage__c
ccCurtainPrice     ← CurtainPriceSum__c
ccTasmaPrice       ← TasmaPriceSum__c
ccPoshivPrice      ← PoshivPriceSum__c
ccTotalPrice       ← GeneralPrice__c
```

---

## 13. CRM-панель: окремий портал /agent/

Портал `agent/index.html` + `agent/app.js` — функціональний аналог `agent-mode.js`,
але з окремим UI. Вся логіка ідентична, використовує ті самі `shared/` файли.

**Відмінності від agent-mode.js:**
- Окрема сторінка з header, sidebar (contacts), main (curtains)
- Drawer панелі для форм (modal overlay)
- Canvas секція — частина форми штори

**Стейт:** `const State = { contacts, selectedContact, curtains, editingContactId, editingCurtainId }`

---

## 14. Калькулятор: calculator.js

```javascript
// ПУБЛІЧНИЙ API:
window.LavandaCalculator = {
    calculate(curtainData) → { Meterage__c, MeterageNaPoshiv__c, TasmaMetrage__c,
                                CurtainPriceSum__c, TasmaPriceSum__c, PoshivPriceSum__c,
                                NavisPriceSum__c, GeneralPrice__c },
    roundMeterage(value) → Decimal,
    formatWidthLabel(meterage, qty) → "2 шт. по 300" або "1 шт., 620",
    ZBIRKA_COEFF → { 'Enigma 1:2': 2, ... }
}
```

**Вхідний об'єкт для `calculate()`:**
```javascript
{
    CarnizWigth__c:      "300",    // або CustomWigth__c
    CustomWigth__c:      "",
    CoefficientZbirki__c:"Enigma 1:2",
    Quantity__c:         "2",
    Price__c:            "800",
    TasmaPrice__c:       "85",
    PoshivPrice__c:      "200",
    NavisPrice__c:       "160",
    Navis__c:            true,     // boolean
    Viizd__c:            false,
    Delivery__c:         "120",
    DeliveryNumber__c:   "2",
    CurtainDiscount__c:  "5"
}
```

---

## 15. Рендеринг зображення: curtain-image.js

### 15.1 Canvas розміри та зони

```
Canvas: 850 × 600 px

Зони:
┌─────────────────────────────────────────────────────────────────────────┐
│                         ТАСЬМА / ЗБІРКА (y=50)                          │
│  Дата + Ім'я клієнта (x=702, y=50)                        (топ панель)  │
├────────────────────────────┬───┬────────────────────────────────────────┤
│                            │ ↕ │    Кімната (y=195)                     │
│   ЗОБРАЖЕННЯ МАКЕТУ        │ ↕ │  ──────────────────────                │
│   (фонове зображення з     │ ↕ │    Назва тканини (y=245)               │
│    Assets/ залежно від     │ ↕ │  ──────────────────────                │
│    HeightPoint__c)         │ ↕ │    Коментар (y=295)                    │
│                            │ ↕ │  ──────────────────────                │
│   x: 0-540                 │ ↕ │                                        │
├────────────────────────────┤↕↕↕│  x: 580-850 (інфо панель)             │
│   Тип штори (y=172)        │↕↕↕│                                        │
│   ─────── (y=300) ─────────│   │                                        │
│   Ширина+к-ть (y=295)      │ ↑ │                                        │
│                            │x=545-570                                   │
│   Обробка низу (y=550)     │(3 стрілки виміру висоти)                  │
└────────────────────────────┴───┴────────────────────────────────────────┘
```

### 15.2 Вибір фонового зображення

```javascript
const HEIGHT_POINT_IMAGES = {
    'від краю до краю':  'Assets/макет штори до низу петлі.jpg',
    'до карнізу':        'Assets/макет штори до верхупетлі.jpg',
    'до гачка':          'Assets/макет штори до верхупетлі.jpg',
    'до верхньої петлі': 'Assets/макет штори до верхупетлі.jpg',
    'до другої петлі':   'Assets/макет штори до середини петлі.jpg',
    'до нижньої петлі':  'Assets/макет штори до низу петлі.jpg',
    'до тасьми':         'Assets/макет штори до середини петлі.jpg',
};
// Default (якщо не заповнено): макет штори до середини петлі.jpg
```

Файли мають українські імена → потрібно URL-кодування:
```javascript
function _assetUrl(name) {
    return 'Assets/' + name.split('').map(c =>
        encodeURIComponent(c) === c ? c : encodeURIComponent(c)
    ).join('');
}
```

### 15.3 Три вертикальні стрілки виміру висоти

Замість однієї стрілки — завжди рендеряться **всі три** reference lines:

| Стрілка | x | yBot | Мітка | Стиль |
|---|---|---|---|---|
| до верхньої петлі | 545 | 165 | "до верхньої петлі" | активна — suцільна #7B5EA7; інакше — dashed rgba(70,70,70,0.32) |
| до другої петлі (середина) | 554 | 310 | "до середини петлі" | те саме |
| до нижньої петлі | 563 | 465 | "до нижньої петлі" | те саме |

Всі три: yTop = 32 (низ карнізу).

**Маппінг HeightPoint → активна стрілка:**
```javascript
{
    'від краю до краю':  'до нижньої петлі',
    'до карнізу':        'до верхньої петлі',
    'до гачка':          'до верхньої петлі',
    'до верхньої петлі': 'до верхньої петлі',
    'до другої петлі':   'до другої петлі',
    'до нижньої петлі':  'до нижньої петлі',
    'до тасьми':         'до другої петлі',
}
```

**Активна стрілка** — суцільна лінія лавандового кольору `#7B5EA7`, з тикми, стрілками та
підписом `"{height} см · {label}"` ротованим на -90°.

**Неактивні стрілки** — dashed `rgba(70,70,70,0.32)`, маленька крапка в кінці,
малий підпис вздовж лінії 9px Arial.

### 15.4 Текстові мітки на canvas

```javascript
// ctx.fillStyle = 'black'  (базовий)

// Тасьма + збірка (рядок 1, зверху):
text = [tasma, zbirka, coefficientzbirku, tasmaPlace].filter(Boolean).join(', ')
position: x = 290 - textWidth/2, y = 50
font: 21px/16px/14px Arial залежно від довжини рядку

// Дата + ім'я клієнта:
text = date + ' ' + contactName
position: x = 702 - textWidth/2, y = 50
font: 19px Arial

// Тип штори:
position: x = 295 - textWidth/2, y = 172
font: 21px Arial

// Ширина (горизонтальна мітка):
text = curtainWidth + ' см'    (напр: "2 шт. по 300 см")
position: x = 295 - textWidth/2, y = 295
font: 21px Arial
// + горизонтальна лінія: ctx.moveTo(84,300) → ctx.lineTo(506,300)

// Обробка низу:
position: x = 290 - textWidth/2, y = 550
font: 21px Arial

// ПРАВА ПАНЕЛЬ — роздільники:
ctx.moveTo(580,200) → ctx.lineTo(825,200)
ctx.moveTo(580,250) → ctx.lineTo(825,250)
ctx.moveTo(580,300) → ctx.lineTo(825,300)

// Кімната:
position: x = 702 - textWidth/2, y = 195

// Назва тканини:
position: x = 702 - textWidth/2, y = 245
font: 19/17/15/12px Arial залежно від довжини

// Коментар:
position: x = 702 - textWidth/2, y = 295
```

### 15.5 prepareData — перетворення Curtain__c в render data

```javascript
CurtainImage.prepareData(curtain, meterage, contactName) → {
    curtainWidth:      formatWidthLabel(meterage, qty), // "1 шт., 620" або "2 шт. по 310"
    curtainHeight:     curtain.Height__c,
    curtainHeightPoint:curtain.HeightPoint__c,
    zbirka:            curtain.zbirkaTasmu__c,
    coefficientzbirku: curtain.CoefficientZbirki__c,
    tasma:             curtain.Tasma__c,
    tasmaPlace:        curtain.TasmaPlace__c,
    curtainName:       curtain.Name__c,
    room:              curtain.Room__c,
    type:              curtain.Type__c,
    curtainNiz:        curtain.ObrobkaNiz__c,
    description:       curtain.Description__c,
    contactName:       contactName || curtain.ContactName__c,
    date:              new Date(curtain.CreatedDate).toLocaleDateString('uk-UA')
}
```

### 15.6 Збереження зображення в Salesforce

```javascript
// ContentVersion API
POST /sobjects/ContentVersion/
{
    Title: 'Curtain_2026-03-29',
    VersionData: canvas.toDataURL('image/png').split(',')[1],  // base64 без prefix
    PathOnClient: 'curtain_image.png',
    FirstPublishLocationId: curtainId  // прив'язка до запису штори
}
```

---

## 16. Стилі та дизайн-система

### 16.1 CSS Custom Properties (Design Tokens)

```css
:root {
    /* Кольори */
    --color-lavender:    #C8B6E2;   /* основний лавандовий */
    --color-deep-lavender:#7B5EA7;  /* темний лавандовий (акцент CRM) */
    --color-graphite:    #2B2B2B;   /* темний текст */
    --color-graphite-light:#4A4A4A;
    --color-white:       #FFFFFF;
    --color-milk:        #FAF9F6;   /* фон сторінки */
    --color-beige:       #F0EDE8;
    --color-sand:        #E8DCD0;

    /* Типографіка */
    --font-heading: 'Playfair Display', serif;
    --font-body:    'Inter', sans-serif;

    /* Spacing */
    --space-xs: 0.5rem;
    --space-sm: 1rem;
    --space-md: 1.5rem;
    --space-lg: 2.5rem;
    --space-xl: 4rem;

    /* Border Radius */
    --radius-sm:   4px;
    --radius-md:   8px;
    --radius-lg:   16px;
    --radius-full: 9999px;

    /* Shadows */
    --shadow-sm: 0 2px 8px rgba(43,43,43,0.08);
    --shadow-md: 0 8px 32px rgba(43,43,43,0.12);
    --shadow-lg: 0 16px 64px rgba(43,43,43,0.16);

    /* Transitions */
    --transition-base:   all 0.3s ease;
    --transition-slower: all 0.6s ease;
}
```

### 16.2 CSS класи компонентів (ключові)

**Головний сайт (styles.css):**
```css
/* Layout */
.container             /* max-width: 1280px, margin: auto, padding: 0 2rem */
.section-header        /* Заголовок секції */
.section-title         /* h2 з <em> для italic акценту */
.section-subtitle      /* Маленький текст над заголовком */

/* Hero */
.hero                  /* height: 55vh, position: relative */
.hero-bg .curtain-left/.curtain-right  /* CSS curtain animation */
.hero-overlay          /* rgba overlay */
.hero-title            /* Playfair Display, 4rem */

/* Categories */
.categories-grid       /* CSS Grid: 2 cols, 2 rows, auto rows */
.category-card         /* overflow:hidden, border-radius */
.category-card-large   /* grid-row: span 2 */
.category-card-wide    /* grid-column: span 2 */
.category-image img    /* object-fit: cover; width/height: 100% */

/* Products */
.products-grid         /* grid-template-columns: repeat(3, 1fr) */
.product-image         /* aspect-ratio: 4/4 */
.product-image img     /* object-fit: cover; object-position: center */

/* Gallery */
.inspiration-gallery   /* CSS Grid masonry-like */
.gallery-item-tall     /* grid-row: span 2 */
.gallery-item-wide     /* grid-column: span 2 */
.gallery-item img      /* object-fit: cover */

/* Buttons */
.btn                   /* base button */
.btn-primary           /* bg: graphite, color: white */
.btn-secondary         /* bg: transparent, border: white */
.btn-outline           /* border: graphite */

/* Configurator */
.config-form           /* форма вибору параметрів */
.fabric-option         /* тайл вибору тканини */
.color-option          /* тайл вибору кольору */
```

**CRM-панель (agent.css):**
```css
/* Секція */
#crm                       /* display:none; transition → visible після auth */
.crm-visible               /* display: block (додається через JS) */
.crm-layout                /* display: grid; grid-template: sidebar | main */

/* Контакти */
.crm-contact-item          /* Рядок контакту */
.crm-contact-item.active   /* Виділений контакт */
.crm-contact-avatar        /* 36px circle з ініціалами */

/* Штори */
.crm-curtain-card          /* Картка штори */
.crm-curtain-card.add-card /* Кнопка "Нова штора" (dashed border) */
.crm-type-badge            /* Бейдж Штора/Тюль */

/* Drawer (Modal) */
.crm-drawer-overlay        /* Full-screen overlay */
.crm-drawer                /* Slide-in panel (right) */
.crm-drawer.open           /* transform: translateX(0) */

/* Форма */
.crm-form-group            /* Label + Input group */
.crm-input                 /* Text input styling */
.crm-calc                  /* Inputs що тригерять live calculator */

/* Calculator preview */
.crm-calc-preview          /* Блок розрахунку */
.crm-calc-grid             /* 3-колонковий grid підсумків */
.crm-calc-total            /* Рядок загальної суми */

/* Canvas */
.crm-canvas-section        /* display:none → block після рендеру */

/* Toast */
.crm-toast                 /* position:fixed, bottom-right */
.crm-toast.success         /* зелений */
.crm-toast.error           /* червоний */

/* Spinner */
.crm-spinner               /* CSS animation rotate */
```

---

## 17. Відомі помилки та їх виправлення

### 17.1 ❌ API 400: Unable to create/update fields: Contact__c

**Причина:** У payload PATCH-запиту присутнє поле `Contact__c`.
Salesforce забороняє оновлювати lookup-поле батьківського запису після створення.

**Виправлення в обох файлах** (`agent-mode.js` та `agent/app.js`):
```javascript
// БУЛО (неправильно):
const data = { Contact__c: S.selectedContact.Id };

// СТАЛО (правильно):
const isEdit = !!S.editingCurtainId;
const data = isEdit ? {} : { Contact__c: S.selectedContact.Id };
```

### 17.2 ❌ Поля ціни не відображаються при редагуванні

**Причина:** `getCurtains()` повертає лише мінімальний набір полів для відображення карток.
При відкритті форми редагування — тільки ці мінімальні поля потрапляли у форму.
`Price__c`, `TasmaPrice__c`, `PoshivPrice__c`, `NavisPrice__c`, `Navis__c`, `Viizd__c` — відсутні.

**Виправлення:**
```javascript
// При кліку на картку штори — завантажити ПОВНИЙ запис
card.addEventListener('click', async () => {
    const fullRecord = await SalesforceAPI.getCurtain(card.dataset.id).catch(() => null);
    const curtain = fullRecord || S.curtains.find(c => c.Id === card.dataset.id);
    openCurtainDrawer(curtain);
});
```
> `GET /sobjects/Curtain__c/{id}` повертає ВСІ поля.

### 17.3 ❌ Невірне відображення контактів (порожні поля)

**Причина:** Використання неіснуючих полів `Name__c`, `Phone__c`, `Status__c`, `Discount__c`,
`City__c` замість реальних SF API-імен.

**Маппінг (правильний):**
```javascript
// Відображення:
c.Name           // Ім'я (НЕ c.Name__c!)
c.ClientName__c  // Телефон (НЕ c.Phone__c!)
c.Client_Status__c // Статус emoji (НЕ c.Status__c!)
c.GeneralDiscount__c // Знижка (НЕ c.Discount__c!)

// City__c — НЕ ІСНУЄ в SF! Не використовувати.
```

### 17.4 ❌ Неправильний HeightPoint у формі

**Причина:** В формі було значення `від підлоги` — якого немає в пікліcті SF.

**Правильні значення:**
```
від краю до краю | до карнізу | до гачка |
до верхньої петлі | до другої петлі | до нижньої петлі | до тасьми
```

### 17.5 ❌ Помилки у picklist полях при збереженні

**Причина:** Поля `Tasma__c`, `ObrobkaNiz__c`, `DeliveryNumber__c`, `Delivery__c`
мають restricted picklist values. Відправка довільних значень → 400 error.

**Правильні значення Delivery__c:** `65|80|100|120|150|180|200|220` (не 250!)
**Delivery через Picklist (не text input).**

### 17.6 ❌ Некоректний пошук контактів за телефоном

**Правильний SOQL:**
```sql
WHERE Name LIKE '%{search}%' OR ClientName__c LIKE '%{search}%'
```
(`ClientName__c` — це поле з телефоном, незважаючи на назву)

---

## 18. Чеклист розгортання з нуля

### Крок 1: Salesforce Org

- [ ] Створити кастомний об'єкт `Contact__c` з усіма полями з розділу 4
- [ ] Створити кастомний об'єкт `Curtain__c` з усіма полями з розділу 5
- [ ] Встановити relationship: `Curtain__c.Contact__c` → lookup на `Contact__c`
- [ ] Налаштувати Roll-up fields: `Contact__c.GeneralPrice__c`, `Contact__c.SelectedCurtains__c`
- [ ] Налаштувати Formula field: `Contact__c.Client_Status__c`
- [ ] Завантажити Apex classes: `CurtainCalculator`, `CurtainTriggerHandler`, `CurtainTriggerHelper`
- [ ] Завантажити Apex classes: `ContactTriggerHandler`, `ContactTriggerHelper`
- [ ] Завантажити тригери: `CurtainTrigger`, `ContactTrigger`
- [ ] Завантажити Flow: `Mass_Status_Update`
- [ ] Перевірити Field-Level Security: всі поля доступні для читання та запису поточному профілю

### Крок 2: Connected App

- [ ] Створити Connected App (Setup → App Manager)
- [ ] Увімкнути OAuth, Callback URL = `https://your-site.netlify.app/`
- [ ] Scopes: `api`, `refresh_token`
- [ ] Скопіювати Consumer Key

### Крок 3: Веб-сайт

- [ ] Клонувати репозиторій
- [ ] Вставити Consumer Key у `website/shared/sf-api.js` → `consumerKey`
- [ ] Перевірити `callbackUrl` (повинен точно збігатися з Callback URL в Connected App)
- [ ] Для sandbox: змінити `loginUrl` на `https://test.salesforce.com`
- [ ] Переконатися, що `website/_redirects` містить `/* /index.html 200`
- [ ] Задеплоїти на Netlify (або будь-який статичний хостинг)

### Крок 4: Перевірка

- [ ] Відкрити сайт → натиснути "Агент" → авторизація через Salesforce
- [ ] Після OAuth redirect — перевірити що `access_token` є в `sessionStorage`
- [ ] Створити контакт → перевірити в SF що запис з'явився
- [ ] Створити штору → перевірити через ~2 сек що `GeneralPrice__c` розрахований
- [ ] Редагувати штору → перевірити що немає помилки Contact__c
- [ ] Згенерувати canvas → завантажити зображення → зберегти в SF

### Крок 5: Тестові дані для перевірки розрахунку

```
CarnizWigth__c = "200"
CoefficientZbirki__c = "Enigma 1:2"
Quantity__c = "1"
Price__c = "500"

Очікуваний результат:
  rawMeterage = (200 × 2 / 100) + (1 × 0.1) = 4.0 + 0.1 = 4.1
  Meterage__c = ceil(4.1×10)/10 = 4.1
  MeterageNaPoshiv__c = roundMeterage(4.1) = 4.1 (fraction=0.1→без змін)
  CurtainPriceSum__c = 4.1 × 500 = 2050
  GeneralPrice__c = 2050 (без тасьми/пошиву/знижки)
```

---

## ДОДАТОК A: Швидка довідка — критичні правила

| # | Правило |
|---|---|
| 1 | При UPDATE Curtain — **ніколи не відправляти Contact__c** у тілі запиту |
| 2 | При відкритті форми редагування — **завжди завантажувати повний запис** через GET /sobjects/Curtain__c/{id} |
| 3 | `ClientName__c` — це **телефон**, не ім'я. Label у SF = "Телефон" |
| 4 | Ім'я контакту — стандартне поле `Name` (не `Name__c`!) |
| 5 | `CoefficientZbirki__c` — текстове поле формату "Enigma 1:2". Коефіцієнт = split(':')[1] |
| 6 | Всі числові SF-поля штори (Meterage__c, CurtainPriceSum__c тощо) — **Text тип**, не Number |
| 7 | Знижка парна → **надбавка**. Знижка непарна → **знижка** |
| 8 | `Quantity__c` — picklist зі значеннями "1","2","3","4" (рядок, не число) |
| 9 | Після POST/PATCH зачекати ~2 сек, потім отримати розраховані поля через GET |
| 10 | `_redirects` файл обов'язковий для коректного OAuth callback на Netlify |

---

*Документ складено на основі аналізу повного вихідного коду проекту LAVANDA.*
*Версія Salesforce API: v63.0. Дата: 29.03.2026.*

