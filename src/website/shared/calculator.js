/**
 * calculator.js — Дзеркало CurtainCalculator.cls (Apex)
 * Точна копія логіки розрахунку метражу і ціни штор
 */

// API values від Curtain__c.object (Zbirka__c field + CoefficientZbirki__c global value set)
const ZBIRKA_COEFF = {
    'Enigma 1:1,5': 1.5,
    'Enigma 1:1,65': 1.65,
    'Enigma 1:1,8': 1.8,
    'Enigma 1:2': 2,
    'Enigma 1:2,5': 2.5,
    'Enigma 1:3': 3,
    'Sofora 1:1,8': 1.8,
    'Sofora 1:2': 2,
    'Pinella': 1,
    'Хвиля 1:1,5': 1.5,
    'Хвиля 1:2': 2,
    'Люверсна': 2,
    'Глайдерна 1:2 + FES': 2,
    'Pinella 5 см звичайна рівномірна 1:2': 2,
    'Pinella 5 см звичайна вафелька 1:2': 2
};

/**
 * Парсить коефіцієнт збірки з будь-якого формату:
 * "Enigma 1:1,5" → 1.5
 * "Sofora 1:2"   → 2
 * "1:1.5"        → 1.5  (короткий формат з SF)
 * "1:1,5"        → 1.5
 * "2"            → 2    (просто число)
 */
function parseCoeff(raw) {
    if (!raw) return 2;
    const s = String(raw);
    // Якщо є в словнику — беремо одразу
    if (ZBIRKA_COEFF[s] != null) return ZBIRKA_COEFF[s];
    // Якщо формат "X:Y" — беремо після двокрапки
    if (s.includes(':')) {
        const after = s.split(':').pop().replace(',', '.').trim();
        const n = parseFloat(after);
        if (!isNaN(n)) return n;
    }
    // Просто число
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? 2 : n;
}

/**
 * Спеціальне округлення метражу (дзеркало Apex logic)
 * .1, .2, .6 → без змін
 * .3, .4, .5 → до .5
 * >= .7      → до цілого вгору
 */
function roundMeterage(value) {
    const floored = Math.floor(value * 10) / 10;
    const fraction = parseFloat((floored - Math.floor(floored)).toFixed(1));
    if ([0.1, 0.2, 0.6].includes(fraction)) return floored;
    if ([0.3, 0.4, 0.5].includes(fraction)) return Math.floor(floored) + 0.5;
    if (fraction >= 0.7) return Math.floor(floored) + 1;
    return floored;
}

/**
 * Головна функція розрахунку
 * @param {Object} c - об'єкт Curtain__c з полями
 * @returns {Object} розраховані поля
 */
function calculate(c) {
    // 1. Метраж
    let meterage = 0;
    const qty = parseFloat(c.Quantity__c) || 1;

    if (c.CustomWigth__c && parseFloat(c.CustomWigth__c) > 0) {
        meterage = parseFloat(c.CustomWigth__c) / 100;
    } else if (c.CarnizWigth__c && c.CoefficientZbirki__c) {
        const coeff = parseCoeff(c.CoefficientZbirki__c);
        meterage = (parseFloat(c.CarnizWigth__c) * coeff / 100) + qty * 0.1;
    }

    // setScale(1, UP) — округлення вгору до 1 знака
    meterage = Math.ceil(meterage * 10) / 10;

    // 2. Підрозрахунки
    const meterageNaPoshiv = roundMeterage(meterage);
    const tasmaMetrage = roundMeterage(meterage + qty * 0.1);

    const price = parseFloat(c.Price__c) || 0;
    const tasmaPrice = parseFloat(c.TasmaPrice__c) || 0;
    const poshivPrice = parseFloat(c.PoshivPrice__c) || 0;
    const navisPrice = parseFloat(c.NavisPrice__c) || 0;

    const curtainPriceSum = price > 0 ? meterage * price : 0;
    const tasmaPriceSum = tasmaPrice > 0 ? tasmaMetrage * tasmaPrice : 0;
    const poshivPriceSum = poshivPrice > 0 ? meterage * poshivPrice : 0;

    let navisPriceSum = 0;
    if (c.Navis__c && navisPrice > 0) {
        navisPriceSum = meterage * navisPrice + (c.Viizd__c ? 500 : 0);
    }

    const deliveryQty = parseFloat(c.DeliveryNumber__c) || 0;
    const deliveryCost = parseFloat(c.Delivery__c) || 0;
    const deliveryTotal = deliveryCost > 0 && deliveryQty > 0
        ? deliveryCost * deliveryQty : 0;

    let finalPrice = curtainPriceSum + tasmaPriceSum + poshivPriceSum + navisPriceSum + deliveryTotal;

    // 3. Знижка: ПАРНЕ % → надбавка, НЕПАРНЕ → знижка
    const discount = parseInt(c.CurtainDiscount__c || c.contactDiscount || 0);
    if (discount > 0) {
        if (discount % 2 === 0) {
            finalPrice += finalPrice * discount / 100;  // надбавка
        } else {
            finalPrice -= finalPrice * discount / 100;  // знижка
        }
    }

    return {
        Meterage__c: parseFloat(meterage.toFixed(1)),
        MeterageNaPoshiv__c: meterageNaPoshiv,
        TasmaMetrage__c: tasmaMetrage,
        ManualPrice__c: parseFloat(c.ManualPrice__c) || null,
        CurtainPriceSum__c: Math.round(curtainPriceSum),
        TasmaPriceSum__c: Math.round(tasmaPriceSum),
        PoshivPriceSum__c: Math.round(poshivPriceSum),
        NavisPriceSum__c: Math.round(navisPriceSum),
        GeneralPrice__c: Math.round(finalPrice)
    };
}

/**
 * Форматує ширину для картинки
 * qty > 1: "N шт. по XXX" (де XXX = Math.round(meterage/qty * 100))
 * qty = 1: "1 шт., XXX"   (де XXX = Math.round(meterage * 100))
 */
function formatWidthLabel(meterage, qty) {
    qty = parseFloat(qty) || 1;
    if (qty > 1) {
        return qty + ' шт. по ' + Math.round((meterage / qty) * 100);
    }
    return '1 шт., ' + Math.round(meterage * 100);
}

// Export for module or global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculate, roundMeterage, formatWidthLabel, parseCoeff, ZBIRKA_COEFF };
} else {
    window.LavandaCalculator = { calculate, roundMeterage, formatWidthLabel, parseCoeff, ZBIRKA_COEFF };
}
