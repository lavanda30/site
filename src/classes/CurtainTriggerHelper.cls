/**
 * Created by Kostiantyn_Marchenkov on 2/25/2025.
 */

public class CurtainTriggerHelper{
    public static void recalculateFields(List<Curtain__c> curtainObjects) {
        System.debug('recalculateFields');
        CurtainCalculator.calculateData(curtainObjects);
    }
    
    public static void populateFields(List<Curtain__c> curtains) {
        Schema.DescribeFieldResult fieldDesc = Curtain__c.Type__c.getDescribe();
        Map<String, String> picklistMap = new Map<String, String>();
        
        for (Schema.PicklistEntry entry : fieldDesc.getPicklistValues()) {
            picklistMap.put(entry.getValue(), entry.getLabel());
        }
        
        for (Curtain__c curt : curtains) {
            if (picklistMap.containsKey(curt.Type__c)) {
                curt.Name = picklistMap.get(curt.Type__c);
            } else {
                curt.Name = 'ШТОРА';
            }
        }
    }

}