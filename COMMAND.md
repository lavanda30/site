# 🪻 LAVANDA - Система управління замовленнями штор

> **Дата створення документа:** 26 березня 2026  
> **Версія:** 1.0  
> **Тип проекту:** Salesforce CRM + E-commerce Website

---

## 📋 Загальний опис проекту

**LAVANDA** — це комплексна система для бізнесу з продажу штор та домашнього текстилю. Проект складається з двох основних частин:

1. **Salesforce CRM** — бекенд система для управління клієнтами, замовленнями та розрахунками
2. **E-commerce Website** — публічний сайт для клієнтів (у розробці)

---

## 🗂️ Структура проекту

```
lavanda/
├── src/                          # Salesforce metadata
│   ├── classes/                  # Apex класи
│   ├── triggers/                 # Apex тригери
│   ├── lwc/                      # Lightning Web Components
│   ├── flows/                    # Salesforce Flows
│   ├── objects/                  # Кастомні об'єкти
│   ├── layouts/                  # Layouts
│   ├── flexipages/               # Lightning Pages
│   ├── tabs/                     # Tabs
│   └── ...
├── website/                      # Публічний сайт
│   ├── index.html               # Головна сторінка (українська)
│   ├── styles.css               # Стилі
│   └── script.js                # JavaScript логіка
└── COMMAND.md                   # ЦЕЙ ФАЙЛ
```

---

## 🎯 Основні кастомні об'єкти Salesforce

### 1. Contact__c (Контакт)
**API Name:** `Contact__c`  
**Label:** Контакт  
**Plural Label:** Контакти

**Призначення:** Зберігає інформацію про клієнтів магазину штор.

#### Поля:

| API Name | Label | Тип | Опис |
|----------|-------|-----|------|
| `Name` | Ім'я | Text | Ім'я клієнта (Name field) |
| `ClientName__c` | Телефон | Text(255) | Номер телефону клієнта |
| `Address__c` | Адреса | Text(255) | Адреса доставки |
| `Description__c` | Коментар | Text(255) | Додаткові примітки |
| `Expenses__c` | Витрати | Checkbox | Чи є додаткові витрати |
| `FinalPrice__c` | Фінальна ціна | Currency | Затверджена з клієнтом ціна |
| `GeneralDiscount__c` | Спеціальні умови | Picklist | Знижка (2-15%) |
| `GeneralPrice__c` | Сумма всіх штор | Roll-Up Summary | SUM всіх Curtain__c.GeneralPrice__c |
| `SelectedCurtains__c` | Сума вибраних штор | Roll-Up Summary | SUM де Check__c = true |
| `Client_Status__c` | Статус Клієнта | Formula | Емодзі 🟢🟡🔴 на основі GeneralPrice__c |

**Зв'язки:**
- Master в Master-Detail з `Curtain__c`

---

### 2. Curtain__c (Штора)
**API Name:** `Curtain__c`  
**Label:** Штора  
**Plural Label:** Curtains

**Призначення:** Детальна інформація про кожну штору в замовленні з розрахунком вартості.

#### Основні поля:

| API Name | Label | Тип | Опис |
|----------|-------|-----|------|
| `Contact__c` | Контакт | Master-Detail | Зв'язок з Contact__c |
| `Name__c` | Назва | Text(255) | Назва тканини/штори |
| `Type__c` | Тип | Picklist | Тип виробу (Штора/Тюль) |
| `Room__c` | Кімната | Picklist | Кімната призначення |
| `Quantity__c` | Кількість | Text | Кількість полотен |

#### Розміри та параметри:

| API Name | Label | Тип | Опис |
|----------|-------|-----|------|
| `Height__c` | Висота (см) | Text(255) | Висота штори |
| `HeightPoint__c` | Точка Висоти | Picklist | Звідки міряти висоту |
| `CarnizWigth__c` | Ширина Карнізу (см) | Text(255) | Ширина карнізу |
| `CustomWigth__c` | Ширина тканини (см) | Text(255) | Кастомна ширина |
| `Carniz__c` | Карніз | Picklist | Тип карнізу (Gardinia, Alutat, KS, etc.) |
| `Diameter__c` | Діаметр Карнізу | Picklist | Діаметр в см |
| `Nisha__c` | Ніша | Picklist | Чи є ніша |

#### Тасьма та пошив:

| API Name | Label | Тип | Опис |
|----------|-------|-----|------|
| `Tasma__c` | Тасьма | Picklist | Тип тасьми |
| `TasmaPrice__c` | Ціна тасьми | Text | Ціна за метр |
| `TasmaMetrage__c` | Метраж тасьми | Text | Розрахований метраж |
| `TasmaPriceSum__c` | Сума за тасьму | Text | Загальна вартість тасьми |
| `Zbirka__c` | Збірка | Picklist | Тип збірки |
| `CoefficientZbirki__c` | Коефіціент Збірки | Picklist | Коефіцієнт (1:1.5, 1:2, etc.) |
| `PoshivPrice__c` | Ціна пошиву | Text | Ціна за метр |
| `PoshivPriceSum__c` | Сума за пошив | Text | Загальна вартість пошиву |

#### Ціни та розрахунки:

| API Name | Label | Тип | Опис |
|----------|-------|-----|------|
| `Price__c` | Ціна за метр | Text | Ціна тканини за метр |
| `Meterage__c` | Метраж тканини | Text | Розрахований метраж |
| `MeterageNaPoshiv__c` | Метраж на пошив | Text | Метраж для пошиву |
| `CurtainPriceSum__c` | Ціна за тканину | Text | Загальна вартість тканини |
| `ManualPrice__c` | Відома ціна | Currency | Ручне введення ціни |
| `GeneralPrice__c` | Загальна сумма | Currency | Фінальна ціна штори |
| `CurtainDiscount__c` | Спеціальні умови | Picklist | Знижка на штору |

#### Доставка та навіс:

| API Name | Label | Тип | Опис |
|----------|-------|-----|------|
| `Delivery__c` | Доставка | Picklist | Вартість доставки |
| `DeliveryNumber__c` | Кількість доставок | Picklist | 1-4 |
| `Navis__c` | Навіс | Checkbox | Чи потрібен навіс |
| `NavisPrice__c` | Ціна навісу | Text | Ціна за метр |
| `NavisPriceSum__c` | Сума за навіс | Text | Загальна вартість |
| `Viizd__c` | Виїзд | Checkbox | Чи потрібен виїзд (+500 грн) |

#### Статуси:

| API Name | Label | Тип | Опис |
|----------|-------|-----|------|
| `Check__c` | Вибрати | Checkbox | Включити в замовлення |
| `CurtainPaid__c` | Тканину оплачено | Checkbox | Статус оплати тканини |
| `AdvancePaymentReceived__c` | Аванс отримано | Checkbox | Статус авансу |

---

## ⚡ Apex Classes

### 1. CurtainCalculator.cls
**Основний клас розрахунку вартості штор**

```apex
// Константи
public final static Decimal NAVIS_PRICE = 500; // Додаткова вартість при виїзді

// Основний метод
public static List<Curtain__c> calculateData(List<Curtain__c> curtainObjects)
```

**Логіка розрахунку:**
1. Розраховує `Meterage__c` на основі `CustomWigth__c` або `CarnizWigth__c * CoefficientZbirki__c`
2. Розраховує `MeterageNaPoshiv__c` (з округленням)
3. Розраховує `CurtainPriceSum__c` = Meterage * Price
4. Розраховує `TasmaMetrage__c` та `TasmaPriceSum__c`
5. Розраховує `PoshivPriceSum__c`
6. Розраховує `NavisPriceSum__c` (+ 500 грн якщо Viizd__c = true)
7. Розраховує доставку
8. Застосовує знижки
9. Формує `GeneralPrice__c`

---

### 2. curtainFormController.cls
**Контролер для LWC форми створення замовлень**

```apex
@AuraEnabled
public static List<Curtain__c> createContact(String jsonDataFromForm)
```

**Функціонал:**
- Отримує JSON з LWC форми
- Створює або оновлює Contact__c
- Створює Curtain__c записи
- Викликає CurtainCalculator для розрахунків

---

### 3. ContactDeepClone.cls
**Invocable method для глибокого клонування контакта**

```apex
@InvocableMethod(label='Contact Deep Clone')
public static List<Id> contactDeepClone(List<String> recordIds)
```

**Функціонал:**
- Клонує Contact__c з новим ім'ям (додає "_V2", "_V3", etc.)
- Клонує всі пов'язані Assortment__c
- Клонує всі пов'язані Curtain__c

---

### 4. CurtainTriggerHandler.cls / CurtainTriggerHelper.cls
**Trigger framework для Curtain__c**

**Events:**
- `beforeInsert`: calculateData + populateFields
- `beforeUpdate`: recalculateFields + populateFields

---

### 5. DisplayCurtainMeteragesController.cls
**Контролер для відображення метражів**

---

### 6. CurtainImageController.cls
**Контролер для генерації зображень штор**

---

## 🔄 Triggers

### CurtainTrigger.trigger
```apex
trigger CurtainTrigger on Curtain__c (before insert, before update, before delete, 
    after insert, after update, after delete, after undelete)
```
Делегує логіку до `CurtainTriggerHandler`

### ContactTrigger.trigger
Тригер для Contact__c

---

## ⚡ Lightning Web Components

### 1. curtainForm
**Головна форма для створення замовлень**
- Введення даних клієнта
- Динамічне додавання блоків штор
- Розрахунок та відправка на сервер

### 2. displayCurtainMeterages
**Відображення метражів**

### 3. curtainImageGenerator
**Генератор зображень штор**

### 4. clientCheck
**Перевірка клієнта**

### 5. orderSummaryCard
**Картка підсумку замовлення**

### 6. baseInfoCard / displayResult / navigateToRecord
**Допоміжні компоненти**

---

## 🌊 Flows

### 1. Display_Curtain_Manufacturers.flow
**Screen Flow для відображення виробників**

### 2. Mass_Status_Update.flow
**Масове оновлення статусів**

---

## 🌐 Website (E-commerce)

**Розташування:** `/website/`

**Файли:**
- `index.html` - Головна сторінка (українська мова)
- `styles.css` - Стилі (CSS Variables, responsive)
- `script.js` - JavaScript логіка

**Особливості дизайну:**
- Кольорова палітра: Lavender (#C8B6E2), Beige (#F5EFE6), Milk (#FAF9F6), Graphite (#2B2B2B)
- Шрифти: Playfair Display (заголовки), Inter (текст)
- Mobile-first responsive design
- Ціни в гривнях (₴)

**Секції сайту:**
1. Hero з анімацією штор
2. Категорії (Вітальня, Спальня, Кухня, Тюлі)
3. Галерея натхнення
4. Каталог товарів з фільтрацією
5. Конфігуратор штор з розрахунком ціни
6. Відгуки клієнтів
7. Форма консультації
8. Footer

---

## 📝 Інструкції для AI асистента

### При роботі з Apex:
1. Завжди враховувати логіку `CurtainCalculator` при зміні полів
2. Тригер обробляє before insert/update — розрахунки автоматичні
3. Константа `NAVIS_PRICE = 500` для виїзду

### При роботі з LWC:
1. Головний контролер `curtainFormController`
2. JSON структура для форми: `{ clientData: {...}, blocks: [...] }`

### При роботі з Website:
1. Всі тексти українською
2. Ціни в гривнях з форматуванням `toLocaleString('uk-UA') + ' ₴'`
3. Зберігати компактний дизайн

### Розрахунок ціни штори:
```
GeneralPrice = CurtainPriceSum + TasmaPriceSum + PoshivPriceSum + NavisPriceSum + Delivery - Discounts
```

---

## 🚀 Плани розвитку

1. **Інтеграція Website з Salesforce**
   - API для отримання даних про товари
   - Форма замовлення → Contact__c + Curtain__c

2. **Розширення функціоналу**
   - Особистий кабінет клієнта
   - Історія замовлень
   - Онлайн оплата

3. **Аналітика**
   - Reports & Dashboards
   - Статистика продажів

---

## 📞 Контакти

**Розробник:** Kostiantyn Marchenko  
**Проект:** LAVANDA  
**Дата початку:** 2024

---

*Цей документ оновлюється при кожній значній зміні проекту.*

