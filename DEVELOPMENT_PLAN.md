# 🚀 LAVANDA - План розвитку проекту

> **Дата створення:** 26 березня 2026  
> **Версія:** 1.0  
> **Статус:** В розробці

---

## 📑 Зміст

1. [Аналіз існуючого коду](#-аналіз-існуючого-коду)
2. [План розвитку Experience Cloud Portal](#-план-розвитку-experience-cloud-portal)
3. [Архітектура порталу](#-архітектура-порталу)
4. [Етапи реалізації](#-етапи-реалізації)
5. [Технічні специфікації](#-технічні-специфікації)

---

## 🔍 Аналіз існуючого коду

### ⚠️ Потенційні проблеми в Apex

#### 1. CurtainCalculator.cls

| # | Проблема | Рядок | Опис | Рекомендація |
|---|----------|-------|------|--------------|
| 1 | **SOQL в циклі** | 14-19 | Запит до Contact__c виконується всередині циклу for | Винести запити за межі циклу, зібрати всі Contact__c.Id та зробити один запит |
| 2 | **Дублювання коду** | 9-160, 170-290 | Логіка `calculateData` та `calculateDataCarniz2` майже ідентична | Рефакторинг: створити приватний метод з параметрами для обох випадків |
| 3 | **Магічні числа** | 42, 66, 204 | Константа `0.1` використовується без пояснення | Винести в константу з описовою назвою (напр. `METERAGE_ADDITION_PER_QUANTITY`) |
| 4 | **String замість Number** | Багато полів | Поля Price__c, Meterage__c зберігаються як Text | Розглянути міграцію на Number/Currency поля |
| 5 | **Відсутність null-перевірок** | 88-92 | `NavisPrice__c` може бути null при Navis__c = true | Додати перевірку `String.isNotBlank(curtainObject.NavisPrice__c)` |
| 6 | **Складна логіка знижок** | 121-130 | Парні знижки додаються, непарні віднімаються - незрозуміла бізнес-логіка | Додати коментарі або рефакторити для ясності |
| 7 | **Багато System.debug** | Увесь файл | Debug statements в production коді | Видалити або обгорнути в `if(Test.isRunningTest())` |
| 8 | **Закоментований код** | 320-655 | Велика кількість закоментованого коду | Видалити або перенести в окремий branch |

#### 2. curtainFormController.cls

| # | Проблема | Рядок | Опис | Рекомендація |
|---|----------|-------|------|--------------|
| 1 | **Помилка в назві поля** | 20 | `descrioption` замість `description` | Виправити typo |
| 2 | **Пошук по Name замість Phone** | 23-27 | `WHERE Name = :phone` - неправильна логіка | Змінити на `WHERE ClientName__c = :phone` |
| 3 | **Catch без обробки** | 99-101 | Exception просто логується, помилка не повертається клієнту | Кидати AuraHandledException з повідомленням |
| 4 | **Немає транзакційності** | 30-50 | Insert/Update без SavePoint | Обгорнути в Database.setSavepoint/rollback |
| 5 | **Database.insert з allOrNone=false** | 95 | Часткові insert можуть призвести до неконсистентних даних | Розглянути allOrNone=true з proper error handling |

#### 3. ContactDeepClone.cls

| # | Проблема | Рядок | Опис | Рекомендація |
|---|----------|-------|------|--------------|
| 1 | **Hardcoded object Assortment__c** | 34-48 | Assortment__c не існує в поточній схемі (тільки Contact__c та Curtain__c) | Видалити або закоментувати цей блок |
| 2 | **Немає перевірки на пустий список** | 6-20 | Якщо recordIds пустий - буде exception | Додати перевірку `if(recordIds.isEmpty()) return null;` |
| 3 | **Index out of bounds** | 127 | `originalName.substring(index + 11)` може вийти за межі | Додати перевірку довжини |

#### 4. CurtainTriggerHandler.cls / CurtainTriggerHelper.cls

| # | Проблема | Рядок | Опис | Рекомендація |
|---|----------|-------|------|--------------|
| 1 | **Неефективне порівняння** | 42-45 | `if (record != oldRecord)` порівнює всі поля | Порівнювати тільки релевантні поля |
| 2 | **Закоментований код** | Helper: 21-55 | Багато закоментованого коду | Видалити |

---

### ⚠️ Потенційні проблеми в Flows

#### 1. Display_Curtain_Manufacturers.flow
- ✅ Простий flow, критичних проблем не виявлено
- ℹ️ Використовує LWC компонент `c:displayCurtainMeterages`

#### 2. Mass_Status_Update.flow
- ⚠️ Велика кількість assignment елементів (можлива оптимізація)
- ⚠️ Немає обробки помилок (Error Handling)
- ℹ️ Рекомендується додати Fault Connector

---

### 📊 Загальні рекомендації по коду

1. **Створити Unit Tests** - покриття тестами CurtainCalculator та curtainFormController
2. **Додати Custom Labels** - винести hardcoded strings
3. **Впровадити Error Logging** - створити кастомний об'єкт для логування помилок
4. **Code Review** - провести повний code review перед production

---

## 🌐 План розвитку Experience Cloud Portal

### Концепція

Створити **Customer Portal** на базі Salesforce Experience Cloud, який буде реплікою поточного HTML сайту, але з повною інтеграцією з Salesforce CRM.

### Порівняння: HTML Site vs Experience Cloud Portal

| Функція | HTML Site | Experience Cloud |
|---------|-----------|------------------|
| Hero секція | ✅ Статична | ✅ CMS Content + LWC |
| Категорії | ✅ Статичні картки | ✅ Dynamic з Custom Object |
| Галерея | ✅ Статичні фото | ✅ Salesforce Files + CMS |
| Каталог товарів | ✅ Статичний | ✅ Dynamic з Curtain__c / Product2 |
| Фільтрація | ✅ JavaScript | ✅ LWC + SOQL |
| Конфігуратор | ✅ JavaScript | ✅ LWC + Apex Calculator |
| Форма замовлення | ✅ HTML форма | ✅ LWC → Contact__c + Curtain__c |
| Особистий кабінет | ❌ Немає | ✅ User Profile + Orders |
| Авторизація | ❌ Немає | ✅ Salesforce Auth |

---

## 🏗️ Архітектура порталу

### Компоненти системи

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXPERIENCE CLOUD PORTAL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   CMS        │  │   LWC        │  │   Apex       │          │
│  │   Content    │  │   Components │  │   Services   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                            │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
│  │  │ Contact__c │  │ Curtain__c │  │ Product__c │        │   │
│  │  └────────────┘  └────────────┘  └────────────┘        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Структура сторінок порталу

```
/                           → Home Page (Hero, Categories, Featured)
/collections                → All Collections
/collections/:category      → Category Page (Вітальня, Спальня, etc.)
/products                   → Product Catalog
/products/:id               → Product Detail Page
/configurator               → Curtain Configurator
/inspiration                → Gallery / Inspiration
/about                      → About Us
/contact                    → Contact Form
/account                    → User Dashboard (protected)
/account/orders             → Order History (protected)
/account/profile            → Profile Settings (protected)
```

---

## 📋 Етапи реалізації

### Фаза 1: Підготовка (1-2 тижні)

#### 1.1 Створення Experience Cloud Site
- [ ] Створити новий Experience Cloud site (Template: Build Your Own / Aura)
- [ ] Налаштувати Theme: кольори (Lavender #C8B6E2, Beige #F5EFE6, Milk #FAF9F6, Graphite #2B2B2B)
- [ ] Завантажити шрифти (Playfair Display, Inter) як Static Resource
- [ ] Налаштувати Navigation Menu

#### 1.2 Розширення Data Model
- [ ] Створити `Product__c` Custom Object (або використати Product2)

```
Product__c:
├── Name (Text)
├── Description__c (Rich Text)
├── Price__c (Currency)
├── Category__c (Lookup to Category__c)
├── Images__c (Rich Text / Content)
├── Is_Featured__c (Checkbox)
├── Is_Active__c (Checkbox)
├── Sort_Order__c (Number)
└── SKU__c (Text, External ID)
```

- [ ] Створити `Category__c` Custom Object

```
Category__c:
├── Name (Text)
├── Description__c (Text Area)
├── Image_URL__c (URL)
├── Sort_Order__c (Number)
├── Is_Active__c (Checkbox)
└── Slug__c (Text) - для URL
```

- [ ] Створити `Testimonial__c` Custom Object

```
Testimonial__c:
├── Customer_Name__c (Text)
├── Customer_Title__c (Text)
├── Customer_City__c (Text)
├── Quote__c (Long Text)
├── Rating__c (Number 1-5)
├── Image_URL__c (URL)
├── Room_Image_URL__c (URL)
├── Is_Active__c (Checkbox)
└── Sort_Order__c (Number)
```

#### 1.3 Налаштування CMS
- [ ] Створити CMS Workspace "LAVANDA Content"
- [ ] Створити Content Types: Hero Banner, Feature Card
- [ ] Завантажити контент (тексти, зображення)

---

### Фаза 2: Базові LWC компоненти (2-3 тижні)

#### 2.1 Shared Components

```
lwc/
├── lavandaHeader/
│   ├── lavandaHeader.html      # Logo, Nav, Mobile Menu
│   ├── lavandaHeader.js
│   ├── lavandaHeader.css
│   └── lavandaHeader.js-meta.xml
│
├── lavandaFooter/
│   ├── lavandaFooter.html      # Links, Social, Newsletter
│   └── ...
│
├── lavandaButton/
│   ├── lavandaButton.html      # Primary, Secondary, Outline variants
│   └── ...
│
├── lavandaCard/
│   ├── lavandaCard.html        # Reusable card component
│   └── ...
│
├── lavandaModal/
│   └── ...
│
└── lavandaLoader/
    └── ...
```

#### 2.2 Home Page Components

```
lwc/
├── lavandaHero/
│   ├── lavandaHero.html
│   │   <!-- Fullscreen hero with curtain animation -->
│   │   <!-- CMS-driven content -->
│   └── ...
│
├── lavandaCategoriesGrid/
│   ├── lavandaCategoriesGrid.html
│   │   <!-- Dynamic grid from Category__c -->
│   ├── lavandaCategoriesGrid.js
│   │   // @wire getCategoriesForPortal
│   └── ...
│
├── lavandaFeaturedProducts/
│   ├── lavandaFeaturedProducts.html
│   │   <!-- Products where Is_Featured__c = true -->
│   └── ...
│
├── lavandaInspirationGallery/
│   └── ...
│
├── lavandaTestimonialsSlider/
│   ├── lavandaTestimonialsSlider.html
│   │   <!-- Carousel from Testimonial__c -->
│   └── ...
│
└── lavandaCta/
    └── ...
```

#### 2.3 Catalog Components

```
lwc/
├── lavandaProductCatalog/
│   ├── lavandaProductCatalog.html
│   │   <!-- Main catalog with filters and grid -->
│   ├── lavandaProductCatalog.js
│   │   // Filter logic, pagination
│   └── ...
│
├── lavandaProductCard/
│   ├── lavandaProductCard.html
│   │   <!-- Card with image, name, price, quick actions -->
│   └── ...
│
├── lavandaProductFilter/
│   ├── lavandaProductFilter.html
│   │   <!-- Category, Price Range, Color filters -->
│   └── ...
│
├── lavandaProductDetail/
│   ├── lavandaProductDetail.html
│   │   <!-- Full product page -->
│   └── ...
│
└── lavandaProductGallery/
    └── ...
```

---

### Фаза 3: Конфігуратор штор (2 тижні)

#### 3.1 Curtain Configurator LWC

```
lwc/
├── lavandaConfigurator/
│   ├── lavandaConfigurator.html
│   ├── lavandaConfigurator.js
│   ├── lavandaConfigurator.css
│   └── lavandaConfigurator.js-meta.xml
│
├── configuratorPreview/
│   │   <!-- Live curtain preview with selected color/fabric -->
│   └── ...
│
├── configuratorFabricPicker/
│   │   <!-- Fabric selection: Velvet, Linen, Silk, Cotton -->
│   └── ...
│
├── configuratorColorPicker/
│   │   <!-- Color swatches -->
│   └── ...
│
├── configuratorDimensions/
│   │   <!-- Width/Height inputs -->
│   └── ...
│
├── configuratorStylePicker/
│   │   <!-- Eyelet, Pencil, Wave -->
│   └── ...
│
└── configuratorPriceSummary/
    │   <!-- Real-time price calculation -->
    └── ...
```

#### 3.2 Apex Service для конфігуратора

```apex
/**
 * CurtainConfiguratorService.cls
 * Service class for the public configurator
 */
public without sharing class CurtainConfiguratorService {
    
    // Prices in UAH
    private static final Map<String, Decimal> FABRIC_PRICES = new Map<String, Decimal>{
        'velvet' => 3200,
        'linen' => 2400,
        'silk' => 4000,
        'cotton' => 1800
    };
    
    private static final Map<String, Decimal> STYLE_PRICES = new Map<String, Decimal>{
        'eyelet' => 0,
        'pencil' => 800,
        'wave' => 1400
    };
    
    @AuraEnabled(cacheable=true)
    public static List<FabricOption> getFabricOptions() {
        // Return available fabrics with images
    }
    
    @AuraEnabled(cacheable=true)
    public static List<ColorOption> getColorOptions() {
        // Return available colors
    }
    
    @AuraEnabled
    public static PriceCalculation calculatePrice(String fabric, String color, 
                                                   Decimal width, Decimal height, 
                                                   String style) {
        // Use existing CurtainCalculator logic
        Decimal area = (width / 100) * (height / 100);
        Decimal basePrice = 2000; // Base price
        Decimal fabricPrice = FABRIC_PRICES.get(fabric) * area;
        Decimal stylePrice = STYLE_PRICES.get(style);
        
        return new PriceCalculation(basePrice + fabricPrice + stylePrice);
    }
    
    @AuraEnabled
    public static Id createQuoteRequest(ConfiguratorInput input, ContactInfo contactInfo) {
        // Create Contact__c and Curtain__c records
        // Similar to existing curtainFormController
    }
    
    // Inner classes for data transfer
    public class FabricOption {
        @AuraEnabled public String value;
        @AuraEnabled public String label;
        @AuraEnabled public String imageUrl;
        @AuraEnabled public Decimal pricePerMeter;
    }
    
    public class ColorOption {
        @AuraEnabled public String value;
        @AuraEnabled public String label;
        @AuraEnabled public String hexCode;
    }
    
    public class PriceCalculation {
        @AuraEnabled public Decimal totalPrice;
        @AuraEnabled public String formattedPrice;
        
        public PriceCalculation(Decimal price) {
            this.totalPrice = price;
            this.formattedPrice = price.format() + ' ₴';
        }
    }
    
    public class ConfiguratorInput {
        @AuraEnabled public String fabric;
        @AuraEnabled public String color;
        @AuraEnabled public Decimal width;
        @AuraEnabled public Decimal height;
        @AuraEnabled public String style;
    }
    
    public class ContactInfo {
        @AuraEnabled public String name;
        @AuraEnabled public String phone;
        @AuraEnabled public String email;
        @AuraEnabled public String message;
    }
}
```

---

### Фаза 4: Особистий кабінет (2 тижні)

#### 4.1 Authentication Setup
- [ ] Налаштувати Customer Community License або External Identity
- [ ] Створити Registration Handler
- [ ] Налаштувати Login Page (branded)
- [ ] Налаштувати Password Reset Flow

#### 4.2 Account Components

```
lwc/
├── lavandaAccountDashboard/
│   │   <!-- Welcome message, order stats, quick links -->
│   └── ...
│
├── lavandaOrderHistory/
│   │   <!-- List of Contact__c records for current user -->
│   │   <!-- Each Contact__c = one order with Curtain__c items -->
│   └── ...
│
├── lavandaOrderDetail/
│   │   <!-- Order details with all Curtain__c items -->
│   │   <!-- Status tracking -->
│   └── ...
│
├── lavandaProfileSettings/
│   │   <!-- Update name, phone, address -->
│   └── ...
│
└── lavandaAddressBook/
    │   <!-- Manage delivery addresses -->
    └── ...
```

#### 4.3 Apex Service для кабінету

```apex
/**
 * CustomerPortalService.cls
 */
public with sharing class CustomerPortalService {
    
    @AuraEnabled(cacheable=true)
    public static List<OrderSummary> getCustomerOrders() {
        Id userId = UserInfo.getUserId();
        User currentUser = [SELECT ContactId FROM User WHERE Id = :userId];
        
        // Map User to Contact__c via email or external field
        List<Contact__c> orders = [
            SELECT Id, Name, CreatedDate, GeneralPrice__c, 
                   (SELECT Name__c, GeneralPrice__c, Status__c FROM Curtains__r)
            FROM Contact__c
            WHERE CustomerUser__c = :userId
            ORDER BY CreatedDate DESC
        ];
        
        // Transform to OrderSummary
    }
    
    @AuraEnabled
    public static void updateProfile(ProfileInput input) {
        // Update user profile
    }
}
```

---

### Фаза 5: Форми та інтеграції (1-2 тижні)

#### 5.1 Contact/Consultation Form

```
lwc/
├── lavandaConsultationForm/
│   │   <!-- Name, Email, Phone, Preferred Time, Message -->
│   │   <!-- Creates Lead or Contact__c -->
│   └── ...
│
└── lavandaNewsletterForm/
    │   <!-- Email subscription -->
    └── ...
```

#### 5.2 Email Templates
- [ ] Order Confirmation Template
- [ ] Order Status Update Template
- [ ] Welcome Email Template
- [ ] Consultation Request Confirmation

#### 5.3 Опціональні інтеграції
- [ ] Google Analytics 4 (via Static Resource)
- [ ] Facebook Pixel
- [ ] LiqPay / Fondy Payment Gateway

---

### Фаза 6: Тестування та запуск (1-2 тижні)

#### 6.1 Testing Checklist
- [ ] Unit Tests для всіх Apex classes (мін. 75%)
- [ ] LWC Jest Tests для критичних компонентів
- [ ] UAT з реальними користувачами
- [ ] Performance Testing
- [ ] Mobile Responsive Testing (iOS Safari, Android Chrome)
- [ ] Cross-browser Testing (Chrome, Firefox, Safari, Edge)

#### 6.2 Pre-Launch Checklist
- [ ] SEO: Meta tags, sitemap.xml, robots.txt
- [ ] SSL Certificate
- [ ] Custom Domain setup (lavanda.ua)
- [ ] CDN налаштування (якщо потрібно)
- [ ] Error monitoring setup
- [ ] Backup & Recovery Plan
- [ ] Load testing

---

## 🎨 Технічні специфікації

### Design System Variables

```css
/* lavandaDesignTokens.css - Static Resource */

:root {
    /* ===== Colors ===== */
    --lavanda-primary: #C8B6E2;
    --lavanda-primary-light: #E8DDE8;
    --lavanda-primary-dark: #9A8BB3;
    --lavanda-beige: #F5EFE6;
    --lavanda-milk: #FAF9F6;
    --lavanda-graphite: #2B2B2B;
    --lavanda-graphite-light: #4A4A4A;
    --lavanda-white: #FFFFFF;
    --lavanda-error: #DC3545;
    --lavanda-success: #28A745;
    
    /* ===== Typography ===== */
    --font-heading: 'Playfair Display', Georgia, serif;
    --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    
    /* ===== Spacing ===== */
    --space-xs: 0.375rem;   /* 6px */
    --space-sm: 0.75rem;    /* 12px */
    --space-md: 1rem;       /* 16px */
    --space-lg: 1.5rem;     /* 24px */
    --space-xl: 2rem;       /* 32px */
    --space-2xl: 3rem;      /* 48px */
    
    /* ===== Border Radius ===== */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 16px;
    --radius-full: 50%;
    
    /* ===== Shadows ===== */
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 8px 40px rgba(0, 0, 0, 0.12);
    
    /* ===== Transitions ===== */
    --transition-fast: 0.2s ease;
    --transition-base: 0.3s ease;
    --transition-slow: 0.5s ease;
}
```

### LWC Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Page Component | lavanda[Page]Page | lavandaHomePage |
| Section Component | lavanda[Section] | lavandaHero |
| UI Component | lavanda[Element] | lavandaButton |
| Service Component | [feature]Service | configuratorService |

### Apex Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Service Class | *Service.cls | CurtainConfiguratorService.cls |
| Controller | *Controller.cls | PortalController.cls |
| Selector | *Selector.cls | ProductSelector.cls |
| Trigger Handler | *TriggerHandler.cls | CurtainTriggerHandler.cls |
| Test Class | *Test.cls | CurtainConfiguratorServiceTest.cls |

### Folder Structure

```
force-app/main/default/
├── applications/
│   └── LAVANDA_Portal.app
├── classes/
│   ├── services/
│   │   ├── CurtainConfiguratorService.cls
│   │   ├── CustomerPortalService.cls
│   │   └── ProductCatalogService.cls
│   ├── selectors/
│   │   ├── ProductSelector.cls
│   │   ├── CategorySelector.cls
│   │   └── TestimonialSelector.cls
│   ├── controllers/
│   │   └── PortalController.cls
│   └── tests/
│       ├── CurtainConfiguratorServiceTest.cls
│       └── CustomerPortalServiceTest.cls
├── lwc/
│   ├── shared/
│   │   ├── lavandaHeader/
│   │   ├── lavandaFooter/
│   │   ├── lavandaButton/
│   │   └── lavandaCard/
│   ├── home/
│   │   ├── lavandaHero/
│   │   ├── lavandaCategoriesGrid/
│   │   └── lavandaTestimonialsSlider/
│   ├── catalog/
│   │   ├── lavandaProductCatalog/
│   │   ├── lavandaProductCard/
│   │   └── lavandaProductFilter/
│   ├── configurator/
│   │   ├── lavandaConfigurator/
│   │   └── configuratorPreview/
│   └── account/
│       ├── lavandaAccountDashboard/
│       └── lavandaOrderHistory/
├── experiences/
│   └── LAVANDA_Portal1/
├── objects/
│   ├── Product__c/
│   ├── Category__c/
│   └── Testimonial__c/
├── staticresources/
│   ├── lavandaStyles/
│   ├── lavandaFonts/
│   └── lavandaImages/
└── contentassets/
```

---

## 📅 Timeline

| Фаза | Тривалість | Період | Deliverables |
|------|------------|--------|--------------|
| **Фаза 1** | 2 тижні | Квітень 1-14, 2026 | Site setup, Data model, CMS |
| **Фаза 2** | 3 тижні | Квітень 15 - Травень 5, 2026 | Base LWC components |
| **Фаза 3** | 2 тижні | Травень 6-19, 2026 | Configurator |
| **Фаза 4** | 2 тижні | Травень 20 - Червень 2, 2026 | User account |
| **Фаза 5** | 2 тижні | Червень 3-16, 2026 | Forms, integrations |
| **Фаза 6** | 2 тижні | Червень 17-30, 2026 | Testing, launch prep |
| **🚀 LAUNCH** | - | **Липень 1, 2026** | Go Live! |

---

## ✅ Чек-лист перед початком розробки

### Salesforce Setup
- [ ] Отримати Experience Cloud ліцензії (Customer Community або Customer Community Plus)
- [ ] Увімкнути Digital Experiences в org
- [ ] Налаштувати My Domain

### Data Preparation
- [ ] Виправити критичні Apex issues (SOQL в циклі)
- [ ] Створити тестові дані для Product__c, Category__c
- [ ] Підготувати зображення для каталогу

### Design
- [ ] Фіналізувати UI mockups (Figma)
- [ ] Підготувати всі зображення в потрібних розмірах
- [ ] Отримати шрифти (Playfair Display, Inter)

### Team
- [ ] Визначити відповідальних за кожну фазу
- [ ] Налаштувати середовище розробки (scratch orgs / sandboxes)
- [ ] Налаштувати CI/CD (GitHub Actions / Copado)

---

## 📚 Корисні ресурси

- [Experience Cloud Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.exp_cloud_lwr.meta/exp_cloud_lwr/)
- [LWC Developer Guide](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)
- [Salesforce CMS Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.salesforce_cms.meta/salesforce_cms/)
- [LWC Recipes (GitHub)](https://github.com/trailheadapps/lwc-recipes)
- [Experience Cloud Templates](https://help.salesforce.com/s/articleView?id=sf.community_designer_overview.htm)

---

## 📝 Історія змін

| Дата | Версія | Опис змін |
|------|--------|-----------|
| 26.03.2026 | 1.0 | Початкова версія плану |

---

*Цей документ буде оновлюватися по мірі розвитку проекту. Останнє оновлення: 26 березня 2026.*

