/**
 * Created by Kostiantyn_Marchenko on 2/25/2025.
 */

public class CurtainTriggerHandler {
    public static void run(List<Curtain__c> newList, List<Curtain__c> oldList,
            Map<Id, Curtain__c> newMap, Map<Id, Curtain__c> oldMap,
            Boolean isBefore, Boolean isAfter, Boolean isInsert,
            Boolean isUpdate, Boolean isDelete, Boolean isUndelete) {
        
        if (isBefore) {
            if (isInsert) beforeInsert(newList);
            if (isUpdate) beforeUpdate(newList, oldMap);
            if (isDelete) beforeDelete(oldList);
        }
        
        if (isAfter) {
            if (isInsert) afterInsert(newList);
            if (isUpdate) afterUpdate(newList, oldMap);
            if (isDelete) afterDelete(oldList);
            if (isUndelete) afterUndelete(newList);
        }
    }
    
    public static void beforeInsert(List<Curtain__c> newList) {
        CurtainCalculator.calculateData(newList);
        CurtainTriggerHelper.populateFields(newList);
    }
    
    public static void beforeUpdate(List<Curtain__c> newList, Map<Id, Curtain__c> oldMap) {
        System.debug('beforeUpdate1');
        CurtainTriggerHelper.recalculateFields(newList);
        List<Curtain__c> updatedRecords = new List<Curtain__c>();
        
        for(Curtain__c record : newList) {
            Curtain__c oldRecord = oldMap.get(record.Id);
            
            if (record.Type__c != oldRecord.Type__c && record.Type__c != null) {
                updatedRecords.add(record);
                
            }
        }
        
        if (!updatedRecords.isEmpty()) {
            CurtainTriggerHelper.populateFields(updatedRecords);
        }
        
    }
    
    public static void beforeDelete(List<Curtain__c> oldList) {
    }
    
    public static void afterInsert(List<Curtain__c> newList) {
    }
    
    public static void afterUpdate(List<Curtain__c> newList, Map<Id, Curtain__c> oldMap) {
        System.debug('afterUpdate1');
    }
    
    public static void afterDelete(List<Curtain__c> oldList) {
    }
    
    public static void afterUndelete(List<Curtain__c> newList) {
    }
}