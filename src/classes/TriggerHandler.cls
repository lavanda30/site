/**
 * Created by Kostiantyn_Marchenko on 2/25/2025.
 */

public with sharing abstract class TriggerHandler {
    
    @TestVisible
    private List<SObject> newList;
    @TestVisible
    private List<SObject> oldList;
    @TestVisible
    private Map<Id,SObject> newMap;
    @TestVisible
    private Map<Id,SObject> oldMap;
    
    public virtual void afterInsert(Map<Id,SObject> newMap) {}
    
    public virtual void afterUpdate(Map<Id,SObject> newMap, Map<Id,SObject> oldMap) {}
    
    public virtual void afterDelete(Map<Id,SObject> oldMap) {}
    
    public virtual void afterUndelete(Map<Id,SObject> newMap) {}
    
    public virtual void beforeInsert(List<SObject> newList) {}
    
    public virtual void beforeUpdate(Map<Id,SObject> newMap, Map<Id,SObject> oldMap) {}
    
    public virtual void beforeDelete(Map<Id,SObject> oldMap) {}
}