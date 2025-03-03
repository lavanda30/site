/**
 * Created by Kostiantyn_Marchenkov on 3/3/2025.
 */

public class DisplayCurtainMeteragesController {
    
    @AuraEnabled(Cacheable=true)
    public static Map<String, String> getCurtainsWithFinalMeterages(String recordId) {
        Map<String, String> curtainMeterageByName = new Map<String, String>();
        
        List<Curtain__c> curtains = [
                SELECT Name__c, Meterage__c
                FROM Curtain__c
                WHERE Contact__c = :recordId
        ];
        
        for(Curtain__c curtain : curtains) {
            if (!curtainMeterageByName.containsKey(curtain.Name__c)) {
                curtainMeterageByName.put(curtain.Name__c, curtain.Meterage__c + ' + ');
            } else {
                String existingValue = curtainMeterageByName.get(curtain.Name__c);
                curtainMeterageByName.put(curtain.Name__c, existingValue + curtain.Meterage__c + ' + ');
            }
        }
        
        for (String key : curtainMeterageByName.keySet()) {
            String value = curtainMeterageByName.get(key);
            if (value.endsWith(' + ')) {
            curtainMeterageByName.put(key, value.substring(0, value.length() - 3));
        }
    }
        
        System.debug(curtainMeterageByName);
        return curtainMeterageByName;
    }

}