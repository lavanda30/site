# SHOP PLAN — Lavanda Website + Salesforce Integration

> Версія: 1.0 | Дата: 2026-03-26  
> Статус: Готово до реалізації

---

## 🎯 МЕТА

Створити повноцінний двошаровий веб-сайт для бренду **Lavanda**:

| Шар | Доступ | Що бачить |
|-----|--------|-----------|
| **Публічний** | Будь-хто | Лендінг, колекції, конфігуратор ціни, контакти |
| **Агентський** | Тільки авторизовані | CRM: Контакти + Штори зі збереженням у Salesforce |

Сайт живе як статичний HTML/JS, але **прямо інтегрований з Salesforce REST API** через Connected App. Дані завжди в Salesforce — змінено в SF → автоматично відображається на сайті.

---

## 🗑️ ЩО ВИДАЛЯЄМО (зроблено / потрібно прибрати)

### З репозиторію (файли)
```
src/networks/LavandaCurtains.network
src/networks/LavandaCurtains.network-meta.xml
src/sites/LavandaCurtains.site
src/sites/LavandaCurtains.site-meta.xml
src/navigationMenus/SFDC_Default_Navigation_LavandaCurtains.navigationMenu
src/navigationMenus/SFDC_Default_Navigation_LavandaCurtains.navigationMenu-meta.xml
src/navigationMenus/SFDC_Default_Navigation_LavandaCurtains.navigationMenu-meta.xml (meta copy)
src/lwc/lavandaPortalHome/           (весь каталог)
src/lwc/lavandaPortalConfigurator/   (весь каталог)
src/package.community-fix.xml
src/package.digitalexperience.xml
```

### З Salesforce Org
- Community/Experience **LavandaCurtains** — видалити через Setup → Digital Experiences → All Sites → Delete

---

## 🏗️ АРХІТЕКТУРА

```
website/
├── index.html          ← Публічний лендінг (ОНОВЛЕНИЙ)
├── styles.css          ← Стилі (ОНОВЛЕНІ)
├── script.js           ← Публічна логіка (ОНОВЛЕНА)
│
├── agent/
│   ├── index.html      ← Агентська сторінка (НОВА)
│   ├── styles.css      ← Агентські стилі (НОВІ)
│   └── app.js          ← CRM логіка + Salesforce API (НОВА)
│
└── shared/
    ├── sf-api.js       ← Salesforce REST API wrapper (НОВИЙ)
    ├── calculator.js   ← Логіка підрахунку штор = дзеркало Apex (НОВИЙ)
    └── curtain-image.js ← Canvas рендер картинки (НОВИЙ)
```

### Salesforce сторона
```
src/classes/
├── LavandaRestController.cls    ← Новий Apex REST endpoint (@RestResource)
│
src/connectedApps/
└── LavandaWebsite.connectedApp  ← Connected App для OAuth
```

---

## 🔐 АВТОРИЗАЦІЯ (OAuth 2.0 User-Agent Flow)

```
1. Агент натискає "Увійти" на сайті
2. Redirect на Salesforce OAuth: /services/oauth2/authorize
3. Агент вводить SF логін/пароль
4. SF повертає access_token у URL hash
5. Сайт зберігає token у sessionStorage
6. Всі API-запити йдуть з Bearer {token}
```

**Connected App налаштування:**
- Callback URL: `https://your-site.com/agent/` + `http://localhost:5500/agent/` (для dev)
- OAuth scopes: `api`, `refresh_token`
- CORS: дозволити домен сайту

---

## 📋 ПОЛЯ CURTAIN__C (повний mapping для сайту)

### Вхідні поля агента
| API Name | Мітка | Тип | Примітка |
|----------|-------|-----|----------|
| `Contact__c` | Контакт | Lookup | Master-Detail |
| `Type__c` | Тип | Picklist | Штора / Тюль |
| `Name__c` | Назва тканини | Text | |
| `Room__c` | Кімната | Text | |
| `CarnizWigth__c` | Ширина карнізу (см) | Text | Основний вхід |
| `CustomWigth__c` | Ширина тканини вручну (см) | Text | Перекриває CarnizWigth |
| `CoefficientZbirki__c` | Коефіцієнт збірки | Picklist | "Enigma 1:2" → split(':')[1] = 2.0 |
| `Zbirka__c` | Збірка | Picklist | Enigma/Sofora/Хвиля/Люверсна… |
| `zbirkaTasmu__c` | Назва збірки тасьми | Picklist | Picklist "zbirka" |
| `Height__c` | Висота (см) | Text | Тільки для картинки |
| `HeightPoint__c` | Точка висоти | Text | 'від краю до краю' / 'до тасьми' |
| `Tasma__c` | Тасьма | Text | Тип тасьми |
| `TasmaPlace__c` | Місце тасьми | Text | |
| `TasmaPrice__c` | Ціна тасьми (грн/м) | Text | |
| `PoshivPrice__c` | Ціна пошиву (грн/м) | Text | |
| `Price__c` | Ціна тканини (грн/м) | Text | |
| `Quantity__c` | Кількість | Text | Default: "1" |
| `Nisha__c` | Ніша | Text | |
| `Carniz__c` | Карніз | Picklist | gardinia/alutat/ks… |
| `Diameter__c` | Діаметр | Text | |
| `NavisPrice__c` | Ціна навісу (грн/м) | Text | |
| `Navis__c` | Навіс | Checkbox | |
| `Viizd__c` | Виїзд | Checkbox | +500 грн |
| `Delivery__c` | Доставка (грн) | Picklist | 120/150/180… |
| `DeliveryNumber__c` | К-ть доставок | Text | |
| `ManualPrice__c` | Ручна ціна | Number | Перекриває автопідрахунок |
| `CurtainDiscount__c` | Знижка | Picklist | 2-15% (парна=надбавка, непарна=знижка) |
| `ObrobkaNiz__c` | Обробка низу | Text | |
| `Description__c` | Коментар | Text | |
| `Status__c` | Статус | Picklist | |

### Розраховані поля (SF trigger → readonly на сайті)
| API Name | Мітка | Формула |
|----------|-------|---------|
| `Meterage__c` | Метраж тканини (м) | `(CarnizWigth * coeff / 100) + qty * 0.1` |
| `MeterageNaPoshiv__c` | Метраж на пошив | `roundMeterage(Meterage)` |
| `TasmaMetrage__c` | Метраж тасьми (м) | `roundMeterage(Meterage + qty * 0.1)` |
| `CurtainPriceSum__c` | Ціна тканини (грн) | `Meterage * Price` |
| `TasmaPriceSum__c` | Ціна тасьми (грн) | `TasmaMetrage * TasmaPrice` |
| `PoshivPriceSum__c` | Ціна пошиву (грн) | `Meterage * PoshivPrice` |
| `NavisPriceSum__c` | Ціна навісу (грн) | `Meterage * NavisPrice [+ 500 if Viizd]` |
| `GeneralPrice__c` | Загальна ціна (грн) | Сума всіх + знижка |

---

## ⚙️ ЛОГІКА ПІДРАХУНКУ (дзеркало CurtainCalculator.cls)

```javascript
// calculator.js — повне дзеркало Apex CurtainCalculator

const ZBIRKA_COEFF = {
  'Enigma 1:1,5': 1.5, 'Enigma 1:1,65': 1.65, 'Enigma 1:1,8': 1.8,
  'Enigma 1:2': 2, 'Enigma 1:2,5': 2.5, 'Enigma 1:3': 3,
  'Sofora 1:1,8': 1.8, 'Sofora 1:2': 2, 'Pinella': 1,
  'Хвиля 1:2': 2, 'Хвиля 1:1,5': 1.5, 'Люверсна': 2,
  'Глайдерна 1:2 + FES': 2
};

function roundMeterage(value) {
  const floored = Math.floor(value * 10) / 10;
  const fraction = parseFloat((floored - Math.floor(floored)).toFixed(1));
  if ([0.1, 0.2, 0.6].includes(fraction)) return floored;
  if ([0.3, 0.4, 0.5].includes(fraction)) return Math.floor(floored) + 0.5;
  if (fraction >= 0.7) return Math.floor(floored) + 1;
  return floored;
}

function calculate(c) {
  // 1. Метраж
  let meterage = 0;
  const qty = parseFloat(c.Quantity__c) || 1;
  if (c.CustomWigth__c) {
    meterage = parseFloat(c.CustomWigth__c) / 100;
  } else if (c.CarnizWigth__c && c.CoefficientZbirki__c) {
    const coeff = parseFloat(c.CoefficientZbirki__c.split(':')[1].replace(',', '.'));
    meterage = (parseFloat(c.CarnizWigth__c) * coeff / 100) + qty * 0.1;
  }
  meterage = Math.ceil(meterage * 10) / 10; // setScale(1, UP)

  // 2. Підрахунки
  const meterageNaPoshiv = roundMeterage(meterage);
  const tasmaMetrage = roundMeterage(meterage + qty * 0.1);
  const curtainPriceSum = c.Price__c ? meterage * parseFloat(c.Price__c) : 0;
  const tasmaPriceSum = c.TasmaPrice__c ? tasmaMetrage * parseFloat(c.TasmaPrice__c) : 0;
  const poshivPriceSum = c.PoshivPrice__c ? meterage * parseFloat(c.PoshivPrice__c) : 0;
  let navisPriceSum = 0;
  if (c.Navis__c && c.NavisPrice__c) {
    navisPriceSum = meterage * parseFloat(c.NavisPrice__c) + (c.Viizd__c ? 500 : 0);
  }
  const deliveryTotal = c.Delivery__c && c.DeliveryNumber__c
    ? parseFloat(c.Delivery__c) * parseFloat(c.DeliveryNumber__c) : 0;

  let finalPrice = curtainPriceSum + tasmaPriceSum + poshivPriceSum + navisPriceSum + deliveryTotal;

  // 3. Знижка (парне % → надбавка, непарне → знижка)
  const discount = parseInt(c.CurtainDiscount__c || c.contactDiscount || 0);
  if (discount) {
    finalPrice += discount % 2 === 0
      ? finalPrice * discount / 100
      : -finalPrice * discount / 100;
  }

  return {
    Meterage__c: String(meterage.toFixed(1)),
    MeterageNaPoshiv__c: String(meterageNaPoshiv),
    TasmaMetrage__c: String(tasmaMetrage),
    CurtainPriceSum__c: String(curtainPriceSum),
    TasmaPriceSum__c: String(tasmaPriceSum),
    PoshivPriceSum__c: String(poshivPriceSum),
    NavisPriceSum__c: String(navisPriceSum),
    GeneralPrice__c: finalPrice
  };
}
```

> ⚠️ **Важливо:** розрахунок на сайті — тільки для live-preview. Остаточний розрахунок завжди виконується в Salesforce Apex trigger при збереженні.

---

## 🖼️ РЕНДЕР КАРТИНКИ ШТОРКИ (canvas 850×600)

### Логіка (дзеркало curtainImageGenerator.js)

```
Фонове зображення вибирається по HeightPoint__c:
  'від краю до краю' → curtainLAVANDA (повна шторка)
  'до тасьми'        → curtainLAVANDA_niz (коротша)
  default            → curtainLAVANDA_centr

На canvas наносяться написи:
  ┌─────────────────────────────────────────────────────┐
  │ Тасьма, збірка, коеф, місце тасьми         Дата + Ім'я│
  │                                                      │
  │              [ТИП ШТОРКИ]              [Назва тканини]│
  │                                                      │
  │   ◄──── Ширина тканини (N шт × см) ────►  [Кімната] │
  │                                                      │
  │ ← висота+точка висоти (вертикально)     [Коментар]  │
  │                                                      │
  │           [Обробка низу]                            │
  └─────────────────────────────────────────────────────┘

Розмірна лінія: горизонтальна від x=84 до x=506, y=300
Таблиця праворуч: 3 горизонтальні лінії (y=200, 250, 300), x=580–825
```

### Формат ширини на картинці
```javascript
// Якщо quantity > 1:  "N шт. по XXX" (де XXX = Math.round(meterage/qty * 100))
// Якщо quantity = 1:  "1 шт., XXX"   (де XXX = Math.round(meterage * 100))
```

### Збереження
- Кнопка "Зберегти зображення" → `canvas.toDataURL('image/png')` → download link
- Кнопка "Зберегти в Salesforce" → base64 → REST API → `CurtainImageController.saveImageToFiles`

---

## 📱 АГЕНТСЬКА СТОРІНКА (`/agent/`)

### Структура UI
```
┌──────────────────────────────────────────────────────┐
│  LAVANDA CRM         [Ім'я агента]  [Вийти]          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  КОНТАКТИ                    │  ШТОРИ                │
│  ┌─────────────────────┐     │  ┌──────────────────┐ │
│  │ 🔍 Пошук...         │     │  │ [+ Нова штора]   │ │
│  │ ─────────────────── │     │  │                  │ │
│  │ Олена Петренко  ▶   │     │  │ ┌──────────────┐ │ │
│  │ Марина Коваль   ▶   │     │  │ │ Штора #1     │ │ │
│  │ [+ Новий контакт]   │     │  │ │ Спальня      │ │ │
│  └─────────────────────┘     │  │ │ 4 560 грн   │ │ │
│                               │  │ └──────────────┘ │ │
│                               │  └──────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Форма Штори
```
Тип:          [Штора ▼]  [Тюль ▼]
Кімната:      [_________]
Назва тканини:[_________]

Ширина карнізу (см): [_____]
  або вручну ширину тканини: [_____]

Тип збірки:   [Enigma 1:2 ▼]
Збірка тасьми:[Enigma ▼]
Тасьма:       [________]
Місце тасьми: [________]

Висота (см):  [____]  Точка: [від краю до краю ▼]
Обробка низу: [________]

Ціна тканини (грн/м): [____]
Тасьма (грн/м):       [____]  
Пошив (грн/м):        [____]
Кількість:            [1  ]

──── Розраховані поля (live preview) ────
Метраж тканини:   X.X м
Метраж на пошив:  X.X м
Метраж тасьми:    X.X м
Вартість тканини: XXXX грн
Вартість тасьми:  XXXX грн
Вартість пошиву:  XXXX грн
────────────────────────────
ЗАГАЛЬНА ЦІНА: XXXXX грн

[Попередній перегляд картинки]
[Зберегти в Salesforce]  [Скасувати]
```

---

## 🎨 ПУБЛІЧНА СТОРІНКА — ОНОВЛЕННЯ

### Що виправити в `website/index.html`

#### 1. Зменшення hero-секції
```css
/* Поточно: min-height: 100vh → занадто велика */
.hero { min-height: 55vh; }   /* Зменшити з 100vh до 55vh */
```

#### 2. Виправлення зображень продуктів (реальні фото штор)
```html
<!-- Поточно: диван замість шторки — виправити URLs -->
Оксамитові мрії     → https://images.unsplash.com/photo-1586023492125-27b2c045efd7 (оксамит бордовий)
Ранковий туман      → https://images.unsplash.com/photo-1589834390005-5d4d298b14ad (легкий тюль)
Льняна гармонія     → https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da (льон натуральний)
Скандинавський стиль → https://images.unsplash.com/photo-1555041469-a586c61ea9bc (білі портьєри)
```

#### 3. Розширення палітри кольорів (20+ кольорів, 2 рядки)

**Поточно:** 6 кольорів  
**Треба:** 20+ кольорів у 2 рядки

```javascript
const COLORS = [
  // Ряд 1 — Білі та молочні
  { id: 'white',        name: 'Білий',          hex: '#FFFFFF' },
  { id: 'milk',         name: 'Молочний',        hex: '#FAF9F6' },
  { id: 'ivory',        name: 'Слонова кістка',  hex: '#FFFFF0' },
  { id: 'cream',        name: 'Кремовий',        hex: '#FFFDD0' },
  { id: 'snow',         name: 'Сніжний',         hex: '#F8F8FF' },
  // Ряд 1 — Бежеві
  { id: 'beige',        name: 'Бежевий',         hex: '#F5EFE6' },
  { id: 'sand',         name: 'Пісочний',        hex: '#E8D5B7' },
  { id: 'wheat',        name: 'Пшеничний',       hex: '#F5DEB3' },
  { id: 'champagne',    name: 'Шампань',         hex: '#F7E7CE' },
  { id: 'linen',        name: 'Льняний',         hex: '#E8E0D0' },
  // Ряд 2 — Пастельні та кольорові
  { id: 'lavender',     name: 'Лавандовий',      hex: '#C8B6E2' },
  { id: 'powder',       name: 'Пудровий',        hex: '#E8C4C4' },
  { id: 'mint',         name: 'М'ятний',         hex: '#B5D5C5' },
  { id: 'sage',         name: 'Шавлія',          hex: '#8B9A7D' },
  { id: 'dustyblue',    name: 'Пильний блакит',  hex: '#B0C4DE' },
  { id: 'rose',         name: 'Трояндовий',      hex: '#D4A5A5' },
  { id: 'pearl',        name: 'Перлинний',       hex: '#EAE0D5' },
  { id: 'mocha',        name: 'Мокко',           hex: '#C4A882' },
  // Ряд 2 — Темніші
  { id: 'taupe',        name: 'Тоуп',            hex: '#B5A89A' },
  { id: 'stone',        name: 'Кам'яний',        hex: '#9E9289' },
  { id: 'graphite',     name: 'Графіт',          hex: '#2B2B2B' },
  { id: 'charcoal',     name: 'Вугільний',       hex: '#4A4A4A' },
];
```

#### 4. Прибрати поле висоти з конфігуратора

```html
<!-- Видалити блок -->
<div class="config-field">
  <label>Висота (см)</label>
  <input type="number" name="height" ...>
</div>
```

#### 5. Тип кріплення (замість "style")
```html
<!-- Зараз: eyelet/pencil/wave -->
<!-- Треба: -->
<select name="tapeType">
  <option value="luverna">Люверсна (коеф. ×2)</option>
  <option value="tasma" selected>Тасьма звичайна (коеф. ×1.5–2)</option>
</select>
<!-- При виборі Люверсна → коефіцієнт 2.0, при Тасьма → 1.5 -->
```

---

## 🔌 SALESFORCE REST API ENDPOINTS

### Новий Apex REST контролер (для майбутньої реалізації)

```apex
@RestResource(urlMapping='/lavanda/v1/*')
global with sharing class LavandaRestController {

  // GET /lavanda/v1/contacts → список контактів
  // POST /lavanda/v1/contacts → створити контакт
  // GET /lavanda/v1/contacts/{id}/curtains → штори контакту
  // POST /lavanda/v1/curtains → створити штору (тригер розрахує)
  // PATCH /lavanda/v1/curtains/{id} → оновити штору
  // POST /lavanda/v1/curtains/{id}/image → зберегти image (base64)
}
```

### Альтернатива (швидша реалізація)
Використовувати стандартний **Salesforce REST API** + **SOQL** через:
```
GET  /services/data/v63.0/sobjects/Contact__c/
POST /services/data/v63.0/sobjects/Contact__c/
GET  /services/data/v63.0/sobjects/Curtain__c/
POST /services/data/v63.0/sobjects/Curtain__c/
     → Trigger автоматично розрахує всі поля
PATCH /services/data/v63.0/sobjects/Curtain__c/{id}
GET  /services/data/v63.0/query/?q=SELECT+Id,Name...
```

---

## 📅 ПЛАН ВИКОНАННЯ (по кроках)

### Крок 1 — Очищення (ЗАРАЗ)
- [x] Видалити файли `LavandaCurtains` network/site/menu
- [x] Видалити LWC `lavandaPortalHome` та `lavandaPortalConfigurator`  
- [ ] Видалити community з org (Setup → Digital Experiences → Delete)
- [x] Оновити `.forceignore`

### Крок 2 — Оновлення публічного сайту
- [ ] Скоротити hero до 55vh
- [ ] Виправити зображення продуктів (реальні штори)
- [ ] Розширити палітру до 20+ кольорів у 2 рядки
- [ ] Прибрати поле висоти з конфігуратора
- [ ] Замінити тип кріплення на люверси/тасьма

### Крок 3 — Connected App в Salesforce
- [ ] Створити Connected App `LavandaWebsite` у Setup
- [ ] Увімкнути OAuth, вказати callback URL
- [ ] Додати CORS для домену сайту
- [ ] Отримати Consumer Key для JavaScript

### Крок 4 — Агентська сторінка `/agent/`
- [ ] Сторінка логіну через SF OAuth
- [ ] Список контактів (GET SOQL)
- [ ] Форма створення контакту (POST)
- [ ] Список штор для контакту
- [ ] Форма штори з live-preview розрахунку
- [ ] Рендер canvas картинки
- [ ] Збереження до Salesforce (POST → тригер → відповідь з розрахованими полями)

### Крок 5 — Canvas рендер (shared/curtain-image.js)
- [ ] Порт `curtainImageGenerator.js` у standalone JS (без LWC)
- [ ] Завантаження фонового зображення шторки (base64 або CDN)
- [ ] Всі написи та лінії з поточної LWC логіки
- [ ] Кнопка download PNG

---

## 🧪 ТЕСТУВАННЯ

| Сценарій | Очікуваний результат |
|----------|---------------------|
| Агент логіниться | OAuth redirect → token збережено → доступ до CRM |
| Агент створює контакт | З'являється в Salesforce + у списку на сайті |
| Агент створює штору | Trigger розраховує поля → відображаються на сайті |
| Зміна поля в Salesforce | Refresh сторінки сайту → нові дані |
| Рендер картинки | Canvas малює шторку + всі підписи |
| Скачати картинку | PNG файл завантажується |
| Зберегти в SF | File attached до Curtain__c.PicturesAttached__c = true |

---

## ⚠️ ВАЖЛИВІ ТЕХНІЧНІ НОТАТКИ

1. **Розрахунок знижки у CurtainCalculator:** парне % → **НАДБАВКА** (збільшує ціну), непарне → знижка. Це нестандартна логіка — дзеркалити точно.

2. **roundMeterage():** спеціальне округлення:
   - `.1, .2, .6` → без змін
   - `.3, .4, .5` → до `.5`  
   - `≥ .7` → до цілого вгору

3. **Метраж тасьми** завжди більший на `qty * 0.1` відносно метражу тканини (запас).

4. **CoefficientZbirki__c** — parses string like `"Enigma 1:2"` → `split(':')[1]` → `"2"` → parseFloat → 2.0. Замінювати кому: `"1,5"` → `"1.5"`.

5. **Фонове зображення шторки** — зараз `@salesforce/resourceUrl/...` (SF Static Resources). Для standalone сайту потрібно або embed як base64 або host як окремий файл.

6. **Salesforce Standard REST API** автоматично викликає тригер при POST/PATCH — розраховані поля повертаються при наступному GET. Тобто: POST curtain → тригер спрацював → GET curtain → поля заповнені.

