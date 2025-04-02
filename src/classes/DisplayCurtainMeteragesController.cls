/**
 * Created by Kostiantyn_Marchenkov on 3/3/2025.
 */

public class DisplayCurtainMeteragesController {
    
//    @AuraEnabled(Cacheable=true)
//    public static Map<String, String> getCurtainsWithFinalMeterages(String recordId) {
//        Map<String, String> curtainMeterageByName = new Map<String, String>();
//
//        List<Curtain__c> curtains = [
//                SELECT Name__c, Meterage__c
//                FROM Curtain__c
//                WHERE Contact__c = :recordId
//        ];
//
//        for(Curtain__c curtain : curtains) {
//            if (!curtainMeterageByName.containsKey(curtain.Name__c)) {
//                curtainMeterageByName.put(curtain.Name__c, curtain.Meterage__c + ' + ');
//            } else {
//                String existingValue = curtainMeterageByName.get(curtain.Name__c);
//                curtainMeterageByName.put(curtain.Name__c, existingValue + curtain.Meterage__c + ' + ');
//            }
//        }
//
//        for (String key : curtainMeterageByName.keySet()) {
//            String value = curtainMeterageByName.get(key);
//            if (value.endsWith(' + ')) {
//            curtainMeterageByName.put(key, value.substring(0, value.length() - 3));
//        }
//    }
//
//        System.debug(curtainMeterageByName);
//        return curtainMeterageByName;
//    }
    
    @AuraEnabled(Cacheable=true)
    public static Map<String, Map<String, String>> getCurtainsWithFinalMeterages(String recordId) {
        Map<String, Map<String, String>> curtainDataByName = new Map<String, Map<String, String>>();
        
        List<Curtain__c> curtains = [
                SELECT Name__c, Meterage__c, Status__c
                FROM Curtain__c
                WHERE Contact__c = :recordId
        ];
        
        for (Curtain__c curtain : curtains) {
            if (!curtainDataByName.containsKey(curtain.Name__c)) {
                curtainDataByName.put(curtain.Name__c, new Map<String, String>{
                        'meterage' => curtain.Meterage__c + ' + ',
                        'status' => curtain.Status__c
                });
            } else {
                String existingValue = curtainDataByName.get(curtain.Name__c).get('meterage');
                curtainDataByName.get(curtain.Name__c).put('meterage', existingValue + curtain.Meterage__c + ' + ');
            }
        }
        
        for (String key : curtainDataByName.keySet()) {
            String value = curtainDataByName.get(key).get('meterage');
            if (value.endsWith(' + ')) {
                curtainDataByName.get(key).put('meterage', value.substring(0, value.length() - 3));
            }
        }
        
        System.debug(curtainDataByName);
        return curtainDataByName;
    }


}