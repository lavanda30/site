/**
 * Created by Kostiantyn_Marchenko on 2/25/2025.
 */

trigger CurtainTrigger on Curtain__c (before insert, before update, before delete, after insert, after update,
        after delete, after undelete) {
    CurtainTriggerHandler.run(Trigger.new, Trigger.old, Trigger.newMap, Trigger.oldMap, Trigger.isBefore,
            Trigger.isAfter, Trigger.isInsert, Trigger.isUpdate, Trigger.isDelete, Trigger.isUndelete);
}