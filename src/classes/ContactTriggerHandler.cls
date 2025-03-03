/**
 * Created by Kostiantyn_Marchenkov on 2/26/2025.
 */

public class ContactTriggerHandler {
    public static void run(List<Contact__c> newList, List<Contact__c> oldList,
            Map<Id, Contact__c> newMap, Map<Id, Contact__c> oldMap,
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
    
    public static void beforeInsert(List<Contact__c> newList) {
    }
    
    public static void beforeUpdate(List<Contact__c> newList, Map<Id, Contact__c> oldMap) {
        System.debug('beforeUpdateCon');
        List<Contact__c> contacts = new List<Contact__c>();
        List<Contact__c> contactsUpdateFinalPrice = new List<Contact__c>();
        for (Contact__c contact : newList) {
            
            if(contact.GeneralPrice__c != null && contact.FinalPrice__c == null &&
                    contact.GeneralPrice__c != oldMap.get(contact.Id).GeneralPrice__c) {
                contactsUpdateFinalPrice.add(contact);
            }
        }
        
        if(!contactsUpdateFinalPrice.isEmpty()) {
            ContactTriggerHelper.updateFields(contactsUpdateFinalPrice);
        }
        
    }
    
    public static void beforeDelete(List<Contact__c> oldList) {
    }
    
    public static void afterInsert(List<Contact__c> newList) {
    }
    
    public static void afterUpdate(List<Contact__c> newList, Map<Id, Contact__c> oldMap) {
        System.debug('afterUpdateCon');
        List<Contact__c> contacts = new List<Contact__c>();
//        List<Contact__c> contactsUpdateFinalPrice = new List<Contact__c>();
        for (Contact__c contact : newList) {
            System.debug(oldMap.get(contact.Id).GeneralDiscount__c);
            if (contact.GeneralDiscount__c != oldMap.get(contact.Id).GeneralDiscount__c) {
                contacts.add(contact);
            }
            
//            if(contact.GeneralPrice__c != null && contact.FinalPrice__c == null &&
//                    contact.GeneralPrice__c != oldMap.get(contact.Id).GeneralPrice__c) {
//                contactsUpdateFinalPrice.add(contact);
//            }
        }
        System.debug(contacts);
        if (!contacts.isEmpty()) {
            System.debug('updateRelatedCurtainsDiscount');
            ContactTriggerHelper.updateRelatedCurtainsDiscount(contacts[0]);
        }
        
//        if(!contactsUpdateFinalPrice.isEmpty()) {
//            ContactTriggerHelper.updateFields(contactsUpdateFinalPrice);
//        }
    }
    
    public static void afterDelete(List<Contact__c> oldList) {
    }
    
    public static void afterUndelete(List<Contact__c> newList) {
    }
}