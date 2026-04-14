# LAVANDA — Контекст для Claude (новий чат)

> Цей файл — повний опис проекту для початку роботи з нового чату.
> Читай його ПЕРШИМ перед будь-якими змінами.
> Оновлено: 07.04.2026

---

## 👤 Клієнт

**Костянтин Марченко** — власник майстерні штор LAVANDA
Локація: ЖК Чайка, вул. Лобановського 30А, Бучанський р-н (біля Києва/Бучі)
Телефон відображення: **+38 (067) 867-06-79**
Email нотифікацій: **lavandashtory@gmail.com** (EmailJS)
Instagram: @shtory_chayka
Живий сайт: **https://lavanda-curtains.netlify.app/**
Salesforce org: https://lavanda-curtains.my.salesforce.com
Google Reviews: https://www.google.com/search?kgmid=/g/11vl0txv0h&q=Штори+Lavanda#lrd=0x40d4cba8f09b4a5d:0x1056dab1fb5e490f,1,,,,

---

## 📁 Структура файлів

```
C:\Users\Kostiantyn_Marchenko\WebstormProjects\LAVANDA\lavanda\
├── CLAUDE_CONTEXT.md              ← ЦЕЙ ФАЙЛ — читати першим!
├── LAVANDA_FULL_SPEC.md           ← Специфікація Salesforce об'єктів
├── src\
│   ├── classes\                   ← Apex класи (CurtainCalculator.cls)
│   ├── objects\                   ← SF custom objects metadata
│   ├── triggers\                  ← SF triggers
│   └── website\                   ← ★ ПУБЛІЧНИЙ САЙТ — основна робота тут
│       ├── index.html             ← Головна сторінка (~59 KB)
│       ├── script.js              ← JS сайту v3.2 (~21 KB)
│       ├── styles.css             ← Оригінальний CSS (32 KB) ← НЕ ПЕРЕЗАПИСУВАТИ!
│       ├── styles-v3.css          ← Нові стилі (11 KB) ← дописувати сюди
│       ├── _redirects             ← Netlify: /* /index.html 200
│       ├── Assets\                ← Фотографії штор + JPG-макети
│       │   ├── макет штори до верхупетлі.jpg
│       │   ├── макет штори до середини петлі.jpg
│       │   └── макет штори до низу петлі.jpg
│       └── shared\
│           ├── sf-api.js          ← Salesforce OAuth + REST API wrapper
│           ├── calculator.js      ← Калькулятор ціни (дзеркало CurtainCalculator.cls)
│           ├── curtain-image.js   ← Canvas рендер технічної картки v4.0
│           ├── lavanda-notify.js  ← Telegram + EmailJS нотифікації
│           ├── agent-mode.js      ← Вбудована CRM (IIFE)
│           └── agent.css          ← Стилі CRM панелі
```

---

## 🎨 CSS Design Tokens (з styles.css)

```css
--color-lavender:      #C8B6E2
--color-lavender-dark: #9A8BB3   /* accent, використовується в JS */
--color-graphite:      #2B2B2B
--color-milk:          #FAF9F6
--color-beige:         #F5EFE6
--font-heading:        'Playfair Display', Georgia, serif
--font-body:           'Inter', sans-serif
```

**КРИТИЧНО:** `styles.css` — 32 KB оригінал. **НІКОЛИ не перезаписувати повністю**.
Всі нові стилі → дописувати в кінець `styles-v3.css`.

---

## 🌐 Архітектура сайту (секції index.html)

| # | Секція | ID | Опис |
|---|--------|----|------|
| 1 | Preloader | — | Анімований логотип LAVANDA |
| 2 | Navigation | #nav | CRM-посилання видиме лише після SF login |
| 3 | Hero | #hero | CSS анімація штор, 55vh |
| 4 | Brand Strip | — | 11 700+ клієнтів · 25+ років · Якісні матеріали · Пошив |
| 5 | Categories | #collections | 4 категорії (вітальня, спальня, кухня, комплект) |
| 6 | Products | #products | 6 карток без ціни, з "Розрахувати →" |
| 7 | Configurator | #configurator | Калькулятор онлайн (5 кроків) |
| 8 | Testimonials | #testimonials | 3 Google відгуки + посилання на всі |
| 9 | CTA | #contact | Форма консультації |
| 10 | CRM | #crm | Вбудована CRM (видима лише після SF login) |
| 11 | Footer | — | Контакти, соцмережі, Google Reviews |

### Порядок підключення скриптів (в кінці body — порядок важливий!):
```html
<script src="shared/lavanda-notify.js"></script>  <!-- 1. Нотифікації -->
<script src="script.js"></script>                   <!-- 2. Основний JS -->
<script src="shared/sf-api.js"></script>            <!-- 3. SF API -->
<script src="shared/calculator.js"></script>        <!-- 4. Калькулятор -->
<script src="shared/curtain-image.js"></script>     <!-- 5. Canvas рендер -->
<script src="shared/agent-mode.js"></script>        <!-- 6. CRM логіка -->
```

---

## 🧮 Конфігуратор (публічний калькулятор)

### 5 кроків:
1. **Тип виробу**: Штора | Гардина / Тюль
   - Штора — яскрава кольорова іконка (CSS градієнт червоний→фіолетовий)
   - Гардина — сіточка (mesh pattern, CSS repeating-linear-gradient)
2. **Колір тканини**: 20 кольорів, сітка 10×2
3. **Ширина карниза**: число в см (input[type=number])
4. **Збірка тасьми**: SVG-іконки з коефіцієнтом
   - Тасьма × 1.5 / × 2.0 / × 2.5 / × 3.0 (однакова SVG вертикальних ліній)
   - Люверси × 2.0 (SVG з кружечками зверху)
5. **Якість тканини**: слайдер Економ → Преміум (5 позицій, підказка прихована від клієнта)

### Логіка ціни (прихована від клієнта, лише для розрахунку):
```js
PRICE_MAP = {
    curtain: [500, 600, 700, 900, 1100],  // ₴/м за 5 рівнів якості
    gardina: [400, 500, 600, 750, 900],
}
SEWING     = 200  // ₴/м пошив
TAPE_PRICE = 90   // ₴/м тасьма

метраж = (ширина × коефіцієнт / 100) + 0.1
ціна   = метраж × (price_level + SEWING + TAPE_PRICE)
```

### Popup результату (після кнопки "Отримати розрахунок"):
- Красивий модал з логотипом LAVANDA
- Показує: тип, колір (+ кольорова крапка), ширина, збірка, рівень якості, метраж
- Велика ціна на градієнтному фоні (#F8F5FF → #F0EDE8)
- Примітка: "* Точна ціна залежить від детального прорахунку..."
- Поля: ім'я + телефон
- Кнопка → Telegram + EmailJS → підтвердження "Менеджер зателефонує 📞"

---

## 📲 Нотифікації (shared/lavanda-notify.js)

### Поточна конфігурація (вже налаштовано):
```js
TELEGRAM_BOT_TOKEN = '7443802771:AAHEUMZjKVRCT6eSsRSG0wPUD8XeCdHZGJk'
TELEGRAM_CHAT_ID   = '1027792488'        // chat_id Костянтина ✅
EMAILJS_SERVICE    = 'service_8tvcgm2'  // ✅
EMAILJS_TEMPLATE   = 'template_7tqrb3k' // ✅
EMAIL_TO           = 'lavandashtory@gmail.com' // ✅
```

### EmailJS SDK в index.html <head>:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<script>
    (function(){ if(window.emailjs) emailjs.init('YOUR_PUBLIC_KEY'); })();
</script>
```
⚠️ `YOUR_PUBLIC_KEY` — ще не замінено! Взяти на emailjs.com → Account → API Keys

### Виклик з коду:
```js
LavandaNotify.send({
    type: 'calculator',  // або 'consultation'
    name, phone,
    fabric, color, width, gather, level, meters, total  // для calculator
    // або:
    interest  // для consultation
})
```

### Обидві форми підключені:
- Конфігуратор → `type: 'calculator'` (після popup)
- CTA форма → `type: 'consultation'` (після submit)

---

## 🏢 Salesforce інтеграція

### CRM активується після OAuth login:
- Кнопка "Агент" у навігації → SF OAuth redirect
- Після login: показується CRM секція + nav link

### Об'єкти:

**Contact__c** (кастомний):
- `Name` — ім'я клієнта
- `ClientName__c` — **телефон** (назва оманлива!)
- `Address__c` — адреса
- `GeneralDiscount__c` — загальна знижка %

**Curtain__c** (дочірній до Contact__c):
| Поле | Тип | Опис |
|------|-----|------|
| `Contact__c` | Lookup | **НЕ слати при PATCH** → 400 error! |
| `Type__c` | Picklist | "Штора" або "Тюль" |
| `Room__c` | Text | кімната |
| `Name__c` | Text | назва/артикул тканини |
| `CarnizWigth__c` | Number | ширина карнізу (см) |
| `CustomWigth__c` | Number | ширина тканини вручну |
| `Height__c` | Number | висота (см) |
| `HeightPoint__c` | Picklist | точка висоти (enum!) |
| `Quantity__c` | Number | кількість шт. |
| `CoefficientZbirki__c` | Picklist | тип збірки |
| `zbirkaTasmu__c` | Picklist | збірка тасьми |
| `Tasma__c` | Picklist | тип тасьми |
| `TasmaPlace__c` | Text | місце тасьми |
| `Price__c` | Number | ціна тканини ₴/м |
| `TasmaPrice__c` | Number | ціна тасьми ₴/м |
| `PoshivPrice__c` | Number | ціна пошиву ₴/м |
| `NavisPrice__c` | Number | ціна навісу ₴/м |
| `Navis__c` | Checkbox | навіс |
| `Viizd__c` | Checkbox | виїзд (+500 ₴) |
| `Delivery__c` | Picklist | доставка ₴ |
| `DeliveryNumber__c` | Number | к-ть доставок |
| `CurtainDiscount__c` | Picklist | знижка % |
| `ObrobkaNiz__c` | Picklist | обробка низу |
| `Status__c` | Picklist | статус замовлення |
| `Description__c` | Textarea | коментар |
| `ManualPrice__c` | Number | ручна ціна (пропускає Apex розрахунок) |

### Поля що РОЗРАХОВУЄ Apex Trigger (не вводити вручну!):
`Meterage__c`, `MeterageNaPoshiv__c`, `TasmaMetrage__c`,
`CurtainPriceSum__c`, `TasmaPriceSum__c`, `PoshivPriceSum__c`,
`NavisPriceSum__c`, `GeneralPrice__c`

### КРИТИЧНІ правила:
1. **PATCH (edit)** → НЕ включати `Contact__c` у тіло запиту → 400 error
2. **Відкриття форми редагування** → обов'язково GET `/sobjects/Curtain__c/{id}` (список має мінімум полів!)
3. **HeightPoint__c** valid values ТІЛЬКИ:
   - `від краю до краю` / `до карнізу` / `до гачка`
   - `до верхньої петлі` / `до другої петлі` / `до нижньої петлі` / `до тасьми`
   - ❌ "від підлоги" — НЕ існує в SF!
4. **Delivery__c** valid values: 65/80/100/120/150/180/200/220 (не 250!)

### Логіка знижки (дзеркало Apex):
- **Парне %** (2,4,6,8,10,14) → надбавка (`ціна × (1 + %/100)`)
- **Непарне %** (3,5,7,13,15) → знижка (`ціна × (1 - %/100)`)

---

## 🖼️ Canvas рендер (shared/curtain-image.js v4.0)

Повністю програмний — без залежності від JPG файлів. Canvas: **900×620 px**

### Структура технічної картки:
```
┌─ [ТЕМНА ШАПКА] Тасьма · Збірка · Коефіцієнт ─────── Дата | Клієнт ─┐
│                                              ┌──────────────────────── │
│  ╔═══════════════════════════╗              │ Кімната                  │
│  ║  Тканина зі складками    ║              │──────────────────────── │
│  ║  (або сіточка для тюлю)  ║              │ Назва тканини            │
│  ║                           ║  ┤ стрілки  │──────────────────────── │
│  ║  [ТИП] посередині        ║  ┤ висоти   │ Коментар                 │
│  ║                           ║  ┤ (фіолет  │──────────────────────── │
│  ║  ←── ШИРИНА (см) ──→     ║  ┤ + сірі)  │ Стаття/Статус           │
│  ║                           ║              │──────────────────────── │
│  ╚═══════════════════════════╝              │ [ШИРИНА badge]           │
│                                              └──────────────────────── │
│  [ОБРОБКА НИЗУ] ─────────────────────────── [ТИП]                      │
└─────────────────────────────────────────────────────────────────────── ┘
```

### prepareData(curtain, meterage, contactName) — маппінг:
```js
curtainWidth       ← CarnizWigth__c або CustomWigth__c
curtainHeight      ← Height__c
curtainHeightPoint ← HeightPoint__c
zbirka             ← zbirkaTasmu__c
coefficientzbirku  ← CoefficientZbirki__c
tasma              ← Tasma__c
tasmaPlace         ← TasmaPlace__c
curtainName        ← Name__c
room               ← Room__c
type               ← Type__c
curtainNiz         ← ObrobkaNiz__c
description        ← Description__c
article            ← Status__c
contactName        ← параметр
date               ← CreatedDate або today
```

---

## 📐 Live-розрахунок CRM (shared/calculator.js)

Точна копія `CurtainCalculator.cls` Apex. **НЕ ЗМІНЮВАТИ без синхронізації з Apex!**

```
Meterage = ceil((carnizWidth × coeff / 100 + qty × 0.1) × 10) / 10

roundMeterage(value):
  fraction .1/.2/.6 → залишити
  fraction .3/.4/.5 → округлити до .5
  fraction ≥ .7     → округлити вгору до цілого

TasmaMetrage = roundMeterage(meterage + qty × 0.1)

GeneralPrice = curtainPrice + tasmaPrice + poshivPrice + navisPrice + delivery
Знижка: парне % = надбавка, непарне % = знижка
```

### ZBIRKA_COEFF (допустимі значення CoefficientZbirki__c):
```
Enigma 1:1,5 → 1.5  |  Enigma 1:1,65 → 1.65  |  Enigma 1:1,8 → 1.8
Enigma 1:2   → 2    |  Enigma 1:2,5  → 2.5    |  Enigma 1:3   → 3
Sofora 1:1,8 → 1.8  |  Sofora 1:2    → 2
Pinella → 1  |  Хвиля 1:2 → 2  |  Хвиля 1:1,5 → 1.5
Люверсна → 2  |  Глайдерна 1:2 + FES → 2
```

---

## 🔧 Що ще НЕ ЗРОБЛЕНО (pending tasks)

### ⚠️ Критично:
1. **EmailJS Public Key** — в `index.html` ще стоїть `'YOUR_PUBLIC_KEY'`
   - emailjs.com → Account → API Keys → Public Key
   - Вставити в `<head>`: `emailjs.init('ваш_ключ')`

### 📋 Заплановано:
2. **Фото для сайту** — Костянтин хотів реалістичні фото розкішних інтер'єрів зі шторами
   - Референс: https://rh.com/us/en/ (RH — розкішний стиль)
   - Місце: нова "Inspiration" секція або в hero background

3. **Покращення Canvas** — поточний рендер v4.0 програмний, але може потребувати
   доопрацювання після реального тестування з SF даними

4. **Мобільна адаптація** — перевірити конфігуратор і CRM на мобільних пристроях

---

## 🚀 Деплой

```bash
cd C:\Users\Kostiantyn_Marchenko\WebstormProjects\LAVANDA\lavanda
git add src/website/
git commit -m "опис змін"
git push
```
Netlify підхоплює push на main → автодеплой ~1-2 хвилини.

---

## 🛠️ Salesforce API методи (sf-api.js)

```js
SalesforceAPI.login()                          // OAuth redirect
SalesforceAPI.handleCallback()                 // обробляє #access_token= з URL
SalesforceAPI.isAuthenticated()               // → bool
SalesforceAPI.getUserInfo()                   // → {display_name, email}
SalesforceAPI.getContacts(search)             // GET Contact__c list
SalesforceAPI.getContact(id)                  // GET один Contact
SalesforceAPI.createContact(data)             // POST Contact
SalesforceAPI.updateContact(id, data)         // PATCH Contact (без Contact__c!)
SalesforceAPI.getCurtains(contactId)          // GET Curtain__c по контакту
SalesforceAPI.getCurtain(id)                  // GET один Curtain (повний набір полів)
SalesforceAPI.createCurtain(data)             // POST Curtain
SalesforceAPI.updateCurtain(id, data)         // PATCH Curtain (БЕЗ Contact__c!)
SalesforceAPI.saveImageToSalesforce(id, b64)  // POST ContentVersion (PNG картки)
```

---

## 🛑 Правила для Claude (обов'язково дотримуватись!)

1. **ЗАВЖДИ читати файл перед редагуванням** — ніколи не писати по пам'яті
2. **styles.css** — тільки дописувати в кінець через `styles-v3.css`, не перезаписувати
3. **index.html (59 KB)** — при редагуванні: читати → запам'ятовувати → перезаписувати повністю
4. **str_replace** — часто не знаходить точний match у великих файлах → краще write_file
5. **MCP може зависнути** на файлах >50 KB → якщо таймаут, попросити перезапустити MCP
6. **calculator.js** — НЕ змінювати логіку! Точна копія Apex → будь-яке відхилення = баг у розрахунку
7. **При помилці запису** — перевірити що файл не пошкоджено (read перших/останніх рядків)

---

## 💬 Стиль комунікації з Костянтином

- Мова: **суміш української і російської**, частіше російська
- Часто надсилає **голосові повідомлення** (Claude.ai транскрибує)
- Любить конкретику, не любить зайві уточнення
- Краще зробити і показати, ніж питати дозволу
- "нормально" / "добре" = задоволений
- "треба поправити" / описує проблему = фіксуй без зайвих запитань
- Технічний рівень: **Salesforce Middle Developer**, вчить англійську

---

*Версія сайту: 3.2 | Canvas: 4.0 | Оновлено: 07.04.2026*
