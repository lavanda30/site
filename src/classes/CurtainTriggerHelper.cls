/**
 * Created by Kostiantyn_Marchenko on 2/25/2025.
 */

public class CurtainTriggerHelper{
    public static void recalculateFields(Curtain__c curtainObject) {
        System.debug('recalculateFields');
        CurtainCalculator.calculateData(curtainObject);
    }
}