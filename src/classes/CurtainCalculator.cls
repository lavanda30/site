/**
 * Created by Kostiantyn_Marchenko on 2/24/2025.
 */

public with sharing class CurtainCalculator {
    
    public static Curtain__c calculateData(Curtain__c curtainObject) {
        
        Contact__c parentContact = new Contact__c();
        if (!String.isBlank(curtainObject.Contact__c)) {
            parentContact = [
                    SELECT GeneralDiscount__c
                    FROM Contact__c
                    WHERE Id = :curtainObject.Contact__c
            ];
        }
        
        if (curtainObject.ManualPrice__c == null) {
            
            String quantity;
            if (!String.isBlank(curtainObject.Quantity__c)) {
                quantity = curtainObject.Quantity__c;
            } else {
                quantity = '1';
            }
            
            if (!String.isBlank(curtainObject.CustomWigth__c)) {
                Decimal rawMeterage =
                        ((Decimal.valueOf(curtainObject.CustomWigth__c) * ZBIRKA_VALUES.get(curtainObject.Zbirka__c)) / 100) +
                        (Decimal.valueOf(quantity) * 0.1);
                
                // Округление Meterage__c в большую сторону до одного знака после запятой
                curtainObject.Meterage__c = String.valueOf(rawMeterage.setScale(1, System.RoundingMode.UP));
            } else {
                Decimal rawMeterage =
                        ((Decimal.valueOf(curtainObject.CarnizWigth__c) * ZBIRKA_VALUES.get(curtainObject.Zbirka__c)) / 100) +
                        (Decimal.valueOf(quantity) * 0.1);
                
                // Округление Meterage__c в большую сторону до одного знака после запятой
                curtainObject.Meterage__c = String.valueOf(rawMeterage.setScale(1, System.RoundingMode.UP));
            }
            
            System.debug('curtainObject.Meterage__c ' + curtainObject.Meterage__c);

// Округление MeterageNaPoshiv__c по методу roundMeterage
            curtainObject.MeterageNaPoshiv__c = String.valueOf(roundMeterage(Decimal.valueOf(curtainObject.Meterage__c)));
            System.debug('curtainObject.MeterageNaPoshiv__c ' + curtainObject.MeterageNaPoshiv__c);
            
            
            curtainObject.CurtainPriceSum__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage__c) *
                    Decimal.valueOf(curtainObject.Price__c));
            System.debug('curtainObject.CurtainPriceSum__c ' + curtainObject.CurtainPriceSum__c);
            
            curtainObject.TasmaMetrage__c = String.valueOf(roundMeterage(
                    (Decimal.valueOf(curtainObject.Meterage__c) + (Decimal.valueOf(quantity) * 0.1))
            ));
            System.debug('curtainObject.TasmaMetrage__c ' + curtainObject.TasmaMetrage__c);
            
            curtainObject.TasmaPriceSum__c = String.valueOf(Decimal.valueOf(curtainObject.TasmaMetrage__c) *
                    Decimal.valueOf(curtainObject.TasmaPrice__c));
            System.debug('curtainObject.TasmaPriceSum__c ' + curtainObject.TasmaPriceSum__c);
            
            curtainObject.PoshivPriceSum__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage__c) *
                    Decimal.valueOf(curtainObject.PoshivPrice__c));
            System.debug('curtainObject.PoshivPriceSum__c ' + curtainObject.PoshivPriceSum__c);
            
            if (curtainObject.Navis__c) {
                if (curtainObject.Viizd__c) {
                    curtainObject.NavisPriceSum__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage__c) *
                            Decimal.valueOf(curtainObject.NavisPrice__c) + 500);
                } else {
                    curtainObject.NavisPriceSum__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage__c) *
                            Decimal.valueOf(curtainObject.NavisPrice__c));
                }
            }
            System.debug('curtainObject.NavisPriceSum__c ' + curtainObject.NavisPriceSum__c);
            
            Decimal deliveryPrice;
            if (!String.isBlank(curtainObject.Delivery__c)) {
                if (!String.isBlank(curtainObject.DeliveryNumber__c)) {
                    deliveryPrice = Decimal.valueOf(curtainObject.Delivery__c) * Decimal.valueOf(curtainObject.DeliveryNumber__c);
                } else {
                    deliveryPrice = Decimal.valueOf(curtainObject.Delivery__c);
                }
            
            }
            
            Decimal finalPrice = 0;
            System.debug('CurtainPriceSum__c: ' + curtainObject.CurtainPriceSum__c);
            System.debug('TasmaPriceSum__c: ' + curtainObject.TasmaPriceSum__c);
            System.debug('PoshivPriceSum__c: ' + curtainObject.PoshivPriceSum__c);
            System.debug('NavisPriceSum__c: ' + curtainObject.NavisPriceSum__c);
            System.debug('Delivery__c: ' + curtainObject.Delivery__c);
            System.debug('DeliveryNumber__c: ' + curtainObject.DeliveryNumber__c);
            
            finalPrice += !String.isBlank(curtainObject.CurtainPriceSum__c) ? extractDecimal(curtainObject.CurtainPriceSum__c) : 0;
            finalPrice += !String.isBlank(curtainObject.TasmaPriceSum__c) ? extractDecimal(curtainObject.TasmaPriceSum__c) : 0;
            finalPrice += !String.isBlank(curtainObject.PoshivPriceSum__c) ? extractDecimal(curtainObject.PoshivPriceSum__c) : 0;
            finalPrice += !String.isBlank(curtainObject.NavisPriceSum__c) ? extractDecimal(curtainObject.NavisPriceSum__c) : 0;
            finalPrice += !String.isBlank(curtainObject.Delivery__c) && !String.isBlank(curtainObject.DeliveryNumber__c) ?
                    Decimal.valueOf(curtainObject.Delivery__c) * Decimal.valueOf(curtainObject.DeliveryNumber__c) : 0;
            
            
            if (!String.isBlank(curtainObject.CurtainDiscount__c) ||
                    (parentContact != null && !String.isBlank(parentContact.GeneralDiscount__c))) {
                Integer discountValue = !String.isBlank(curtainObject.CurtainDiscount__c) ?
                        Integer.valueOf(curtainObject.CurtainDiscount__c) : Integer.valueOf(parentContact.GeneralDiscount__c);
                
                if (Math.mod(discountValue, 2) == 0) {
                    finalPrice += (finalPrice * discountValue / 100);
                } else {
                    finalPrice -= (finalPrice * discountValue / 100);
                }
            }
            
            curtainObject.GeneralPrice__c = finalPrice;
        
        } else {
            Decimal finalPrice = curtainObject.ManualPrice__c;
            if (!String.isBlank(curtainObject.CurtainDiscount__c) ||
                    (parentContact != null && !String.isBlank(parentContact.GeneralDiscount__c))) {
                Integer discountValue = !String.isBlank(curtainObject.CurtainDiscount__c) ?
                        Integer.valueOf(curtainObject.CurtainDiscount__c) : Integer.valueOf(parentContact.GeneralDiscount__c);
                
                if (Math.mod(discountValue, 2) == 0) {
                    finalPrice += (curtainObject.ManualPrice__c * discountValue / 100);
                } else {
                    finalPrice -= (curtainObject.ManualPrice__c * discountValue / 100);
                }
            }
            
            curtainObject.GeneralPrice__c = finalPrice;
        }
        System.debug('curtainObject.FinalPrice__c ' + curtainObject.GeneralPrice__c);
        
        return curtainObject;
    }
    
    public static final Map<String, Decimal> ZBIRKA_VALUES = new Map<String, Decimal>{
            'Enigma 1:1,5' => 1.5,
            'Enigma 1:1,8' => 1.8,
            'Enigma 1:2' => 2,
            'Enigma 1:2,5' => 2.5,
            'Enigma 1:3' => 3,
            'Sofora 1:1,8' => 1.8,
            'Sofora 1:2' => 2,
            'Pinella' => 1,
            'Хвиля 1:2' => 2,
            'Люверсна' => 2
    };
    
    public static Decimal extractDecimal(String value) {
        if (value == null || value == '') {
            return 0;
        }
        String numericPart = value.replaceAll('[^0-9.]', ''); // Оставляем только цифры и точку
        System.debug('numericPart ' +numericPart);
        return Decimal.valueOf(numericPart);
    }
    
    public static Decimal roundMeterage(Decimal value) {
        Decimal floored = value.setScale(1, System.RoundingMode.DOWN); // Оставляем 1 знак после запятой
        Decimal fraction = floored - floored.intValue(); // Получаем дробную часть
        
        if (fraction == 0.1 || fraction == 0.2 || fraction == 0.6) {
            return floored; // Не изменяем число
        } else if (fraction == 0.3 || fraction == 0.4 || fraction == 0.5) {
            return floored.intValue() + 0.5; // Округляем к 0.5
        } else if (fraction >= 0.7) {
            return floored.intValue() + 1; // Округляем вверх
        } else {
            return floored; // По умолчанию возвращаем число без изменений
        }
    }

}