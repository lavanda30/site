/**
 * Created by Kostiantyn_Marchenko on 2/24/2025.
 */

public with sharing class CurtainCalculator {
    
    public final static Decimal NAVIS_PRICE = 500;
    
    public static List<Curtain__c> calculateData(List<Curtain__c> curtainObjects) {
        
        List<Curtain__c> curtainToWork = new List<Curtain__c>();
        for (Curtain__c curtainObject : curtainObjects) {
            
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
                if (curtainObject.Quantity__c != null) {
                    quantity = curtainObject.Quantity__c;
                } else {
                    quantity = '1';
                    curtainObject.Quantity__c = quantity;
                }
                curtainObject.Meterage__c = '';
                if (!String.isBlank(curtainObject.CustomWigth__c)) {
                    Decimal rawMeterage = ((Decimal.valueOf(curtainObject.CustomWigth__c) / 100));
                    curtainObject.Meterage__c = String.valueOf(rawMeterage.setScale(1, System.RoundingMode.UP));
                } else if (!String.isBlank(curtainObject.CarnizWigth__c)) {
                    String cleanedValue = curtainObject.CarnizWigth__c.replaceAll('\\+', '');
                    
                    if (!String.isBlank(cleanedValue) && !String.isBlank(curtainObject.Zbirka__c)) {
                        Decimal rawMeterage =
                                ((Decimal.valueOf(cleanedValue) * ZBIRKA_VALUES.get(curtainObject.Zbirka__c)) / 100) +
                                (Decimal.valueOf(quantity) * 0.1);
                        curtainObject.Meterage__c = String.valueOf(rawMeterage.setScale(1, System.RoundingMode.UP));
                    }
                }
                
                curtainObject.CurtainPriceSum__c = curtainObject.CurtainPriceSum__c == null ? '' : curtainObject.CurtainPriceSum__c;
                curtainObject.TasmaPriceSum__c = curtainObject.Tasma__c == null ? '' : curtainObject.TasmaPriceSum__c;
                curtainObject.PoshivPriceSum__c = curtainObject.Meterage__c == null ? '' : curtainObject.PoshivPriceSum__c;
                curtainObject.NavisPriceSum__c = curtainObject.Navis__c == false ? '' : curtainObject.NavisPriceSum__c;
                curtainObject.MeterageNaPoshiv__c = curtainObject.Meterage__c == '' ? '' : curtainObject.MeterageNaPoshiv__c;
                curtainObject.TasmaMetrage__c = curtainObject.Tasma__c == null ? '' : curtainObject.TasmaMetrage__c;
                if (!String.isBlank(curtainObject.Meterage__c)) {
                    curtainObject.MeterageNaPoshiv__c = String.valueOf(roundMeterage(Decimal.valueOf(curtainObject.Meterage__c)));
                    System.debug('curtainObject.MeterageNaPoshiv__c ' + curtainObject.MeterageNaPoshiv__c);
                    
                    if (String.isNotBlank(curtainObject.Price__c)) {
                        curtainObject.CurtainPriceSum__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage__c) *
                                Decimal.valueOf(curtainObject.Price__c));
                        System.debug('curtainObject.CurtainPriceSum__c ' + curtainObject.CurtainPriceSum__c);
                    }
                    
                    curtainObject.TasmaMetrage__c = String.valueOf(roundMeterage(
                            (Decimal.valueOf(curtainObject.Meterage__c) + (Decimal.valueOf(quantity) * 0.1))
                    ));
                    System.debug('curtainObject.TasmaMetrage__c ' + curtainObject.TasmaMetrage__c);
                    
                    if (String.isNotBlank(curtainObject.TasmaPrice__c)) {
                        curtainObject.TasmaPriceSum__c = String.valueOf(Decimal.valueOf(curtainObject.TasmaMetrage__c) *
                                Decimal.valueOf(curtainObject.TasmaPrice__c));
                        System.debug('curtainObject.TasmaPriceSum__c ' + curtainObject.TasmaPriceSum__c);
                    }
                    
                    
                    if (String.isNotBlank(curtainObject.PoshivPrice__c)) {
                        curtainObject.PoshivPriceSum__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage__c) *
                                Decimal.valueOf(curtainObject.PoshivPrice__c));
                        System.debug('curtainObject.PoshivPriceSum__c ' + curtainObject.PoshivPriceSum__c);
                    }
                    
                    if (curtainObject.Navis__c) {
                        if (curtainObject.Viizd__c) {
                            curtainObject.NavisPriceSum__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage__c) *
                                    Decimal.valueOf(curtainObject.NavisPrice__c) + NAVIS_PRICE);
                        } else {
                            curtainObject.NavisPriceSum__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage__c) *
                                    Decimal.valueOf(curtainObject.NavisPrice__c));
                        }
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
                curtainToWork.add(curtainObject);
            
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
                curtainToWork.add(curtainObject);
            }
            System.debug('curtainObject.FinalPrice__c ' + curtainObject.GeneralPrice__c);
            
            if (String.isNotBlank(curtainObject.CarnizWigth2__c)) {
                calculateDataCarniz2(curtainObject, parentContact);
            }
        }
        
        return curtainToWork;
    }
    
    public static void calculateDataCarniz2(Curtain__c curtainObject, Contact__c parentContact) {
        
        if (curtainObject.ManualPrice2__c == null) {
            
            String quantity;
            if (curtainObject.Quantity2__c != null) {
                quantity = curtainObject.Quantity2__c;
            } else {
                quantity = '1';
                curtainObject.Quantity2__c = quantity;
            }
            
            if (!String.isBlank(curtainObject.CustomWigth2__c)) {
                Decimal rawMeterage = ((Decimal.valueOf(curtainObject.CustomWigth2__c) / 100));
                curtainObject.Meterage2__c = String.valueOf(rawMeterage.setScale(1, System.RoundingMode.UP));
            } else if (!String.isBlank(curtainObject.CarnizWigth2__c) && !String.isBlank(curtainObject.Zbirka2__c)) {
                Decimal rawMeterage =
                        ((Decimal.valueOf(curtainObject.CarnizWigth2__c) * ZBIRKA_VALUES.get(curtainObject.Zbirka2__c)) / 100) +
                        (Decimal.valueOf(quantity) * 0.1);
                curtainObject.Meterage2__c = String.valueOf(rawMeterage.setScale(1, System.RoundingMode.UP));
            }
            
            if (!String.isBlank(curtainObject.Meterage2__c)) {
                curtainObject.MeterageNaPoshiv2__c = String.valueOf(roundMeterage(Decimal.valueOf(curtainObject.Meterage2__c)));
                System.debug('curtainObject.MeterageNaPoshiv2__c ' + curtainObject.MeterageNaPoshiv2__c);
                
                
                if (String.isNotBlank(curtainObject.Price2__c)) {
                    curtainObject.CurtainPriceSum2__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage2__c) *
                            Decimal.valueOf(curtainObject.Price2__c));
                    System.debug('curtainObject.CurtainPriceSum__c ' + curtainObject.CurtainPriceSum2__c);
                }
                
                curtainObject.TasmaMetrage2__c = String.valueOf(roundMeterage(
                        (Decimal.valueOf(curtainObject.Meterage2__c) + (Decimal.valueOf(quantity) * 0.1))
                ));
                System.debug('curtainObject.TasmaMetrage2__c ' + curtainObject.TasmaMetrage2__c);
                
                if (String.isNotBlank(curtainObject.TasmaPrice2__c)) {
                    curtainObject.TasmaPriceSum2__c = String.valueOf(Decimal.valueOf(curtainObject.TasmaMetrage2__c) *
                            Decimal.valueOf(curtainObject.TasmaPrice2__c));
                    System.debug('curtainObject.TasmaPriceSum2__c ' + curtainObject.TasmaPriceSum2__c);
                }
                
                curtainObject.PoshivPriceSum2__c = '';
                if (String.isNotBlank(curtainObject.PoshivPrice2__c)) {
                    curtainObject.PoshivPriceSum2__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage2__c) *
                            Decimal.valueOf(curtainObject.PoshivPrice2__c));
                    System.debug('curtainObject.PoshivPriceSum__c ' + curtainObject.PoshivPriceSum2__c);
                }
                
                if (curtainObject.Navis2__c) {
                    if (curtainObject.Viizd2__c) {
                        curtainObject.NavisPriceSum2__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage2__c) *
                                Decimal.valueOf(curtainObject.NavisPrice2__c) + NAVIS_PRICE);
                    } else {
                        curtainObject.NavisPriceSum2__c = String.valueOf(Decimal.valueOf(curtainObject.Meterage2__c) *
                                Decimal.valueOf(curtainObject.NavisPrice2__c));
                    }
                }
            }
            System.debug('curtainObject.NavisPriceSum2__c ' + curtainObject.NavisPriceSum2__c);
            
            Decimal deliveryPrice;
            if (!String.isBlank(curtainObject.Delivery2__c)) {
                if (!String.isBlank(curtainObject.DeliveryNumber2__c)) {
                    deliveryPrice = Decimal.valueOf(curtainObject.Delivery2__c) * Decimal.valueOf(curtainObject.DeliveryNumber2__c);
                } else {
                    deliveryPrice = Decimal.valueOf(curtainObject.Delivery2__c);
                }
            }
            
            Decimal finalPrice = 0;
//            System.debug('CurtainPriceSum2__c: ' + curtainObject.CurtainPriceSum2__c);
//            System.debug('TasmaPriceSum2__c: ' + curtainObject.TasmaPriceSum2__c);
//            System.debug('PoshivPriceSum2__c: ' + curtainObject.PoshivPriceSum2__c);
//            System.debug('NavisPriceSum_2_c: ' + curtainObject.NavisPriceSum2__c);
//            System.debug('Delivery_2_c: ' + curtainObject.Delivery2__c);
//            System.debug('DeliveryNumber_2_c: ' + curtainObject.DeliveryNumber2__c);
            
            finalPrice += !String.isBlank(curtainObject.CurtainPriceSum2__c) ? extractDecimal(curtainObject.CurtainPriceSum2__c) : 0;
            finalPrice += !String.isBlank(curtainObject.TasmaPriceSum2__c) ? extractDecimal(curtainObject.TasmaPriceSum2__c) : 0;
            finalPrice += !String.isBlank(curtainObject.PoshivPriceSum2__c) ? extractDecimal(curtainObject.PoshivPriceSum2__c) : 0;
            finalPrice += !String.isBlank(curtainObject.NavisPriceSum2__c) ? extractDecimal(curtainObject.NavisPriceSum2__c) : 0;
            finalPrice += !String.isBlank(curtainObject.Delivery2__c) && !String.isBlank(curtainObject.DeliveryNumber2__c) ?
                    Decimal.valueOf(curtainObject.Delivery2__c) * Decimal.valueOf(curtainObject.DeliveryNumber2__c) : 0;
            
            if (!String.isBlank(curtainObject.CurtainDiscount2__c) ||
                    (parentContact != null && !String.isBlank(parentContact.GeneralDiscount__c))) {
                Integer discountValue = !String.isBlank(curtainObject.CurtainDiscount2__c) ?
                        Integer.valueOf(curtainObject.CurtainDiscount2__c) : Integer.valueOf(parentContact.GeneralDiscount__c);
                
                if (Math.mod(discountValue, 2) == 0) {
                    finalPrice += (finalPrice * discountValue / 100);
                } else {
                    finalPrice -= (finalPrice * discountValue / 100);
                }
            }
            
            curtainObject.GeneralPrice2__c = finalPrice;
        
        } else {
            Decimal finalPrice = curtainObject.ManualPrice2__c;
            if (!String.isBlank(curtainObject.CurtainDiscount2__c) ||
                    (parentContact != null && !String.isBlank(parentContact.GeneralDiscount__c))) {
                Integer discountValue = !String.isBlank(curtainObject.CurtainDiscount2__c) ?
                        Integer.valueOf(curtainObject.CurtainDiscount2__c) : Integer.valueOf(parentContact.GeneralDiscount__c);
                
                if (Math.mod(discountValue, 2) == 0) {
                    finalPrice += (curtainObject.ManualPrice2__c * discountValue / 100);
                } else {
                    finalPrice -= (curtainObject.ManualPrice2__c * discountValue / 100);
                }
            }
            curtainObject.GeneralPrice2__c = finalPrice;
        
        }
        System.debug('curtainObject.FinalPrice__c ' + curtainObject.GeneralPrice__c);
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
            'Люверсна' => 2,
            'Глайдерна 1:2 + FES' => 2,
            'Хвиля 1:1,5' => 1.5
    };
    
    public static Decimal extractDecimal(String value) {
        if (value == null || value == '') {
            return 0;
        }
        String numericPart = value.replaceAll('[^0-9.]', '');
        
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