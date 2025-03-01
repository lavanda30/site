/**
 * Created by Kostiantyn_Marchenko on 2/26/2025.
 */

trigger ContactTrigger on Contact__c (before insert, before update, before delete, after insert, after update,
        after delete, after undelete) {
    ContactTriggerHandler.run(Trigger.new, Trigger.old, Trigger.newMap, Trigger.oldMap, Trigger.isBefore,
            Trigger.isAfter, Trigger.isInsert, Trigger.isUpdate, Trigger.isDelete, Trigger.isUndelete);
}