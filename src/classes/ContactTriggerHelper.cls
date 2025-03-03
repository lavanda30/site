/**
 * Created by Kostiantyn_Marchenkov on 2/26/2025.
 */

public class ContactTriggerHelper {
    
    public static void updateRelatedCurtainsDiscount(Contact__c contact) {
        List<Curtain__c> relatedCurtains = [
                SELECT CurtainDiscount__c
                FROM Curtain__c
                WHERE Contact__c = :contact.Id
        ];
        System.debug('relatedCurtains ' + relatedCurtains);
        if (!relatedCurtains.isEmpty()) {
            for (Curtain__c curtain : relatedCurtains) {
                System.debug((String) contact.GeneralDiscount__c);
                curtain.CurtainDiscount__c = (String) contact.GeneralDiscount__c;
                System.debug(curtain.CurtainDiscount__c);
            }
        }
        System.debug('relatedCurtains 2 ' + relatedCurtains);
        Database.update(relatedCurtains);
    }
    
    public static void updateFields(List<Contact__c> contacts) {
        for (Contact__c contact : contacts) {
            contact.FinalPrice__c = contact.GeneralPrice__c;
        }
        
//        update contacts;
    }
}