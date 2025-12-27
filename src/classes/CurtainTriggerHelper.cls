/**
 * Created by Kostiantyn_Marchenkov on 2/25/2025.
 */

public class CurtainTriggerHelper {
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
//                if (String.isNotBlank(curt.CarnizWigth2__c)) {
//                    curt.ManualPrice2__c = curt.ManualPrice2__c == null ? curt.ManualPrice__c : curt.ManualPrice2__c;
//                    curt.Delivery2__c = curt.Delivery2__c == null ? curt.Delivery__c : curt.Delivery2__c;
//                    curt.Height2__c = curt.Height2__c == null ? curt.Height__c : curt.Height2__c;
//                    curt.CarnizWigth2__c = curt.CarnizWigth2__c == null ? curt.CarnizWigth__c : curt.CarnizWigth2__c;
//                    curt.Price2__c = curt.Price2__c == null ? curt.Price__c : curt.Price2__c;
//                    curt.Carniz2__c = curt.Carniz2__c == null ? curt.Carniz__c : curt.Carniz2__c;
//                    curt.PoshivPrice2__c = curt.PoshivPrice2__c == null ? curt.PoshivPrice__c : curt.PoshivPrice2__c;
//                    curt.TasmaPrice2__c = curt.TasmaPrice2__c == null ? curt.TasmaPrice__c : curt.TasmaPrice2__c;
//                    curt.NavisPrice2__c = curt.NavisPrice2__c == null ? curt.NavisPrice__c : curt.NavisPrice2__c;
//                    curt.HeightPoint2__c = curt.HeightPoint2__c == null ? curt.HeightPoint__c : curt.HeightPoint2__c;
//                    curt.Meterage2__c = curt.Meterage2__c == null ? curt.Meterage__c : curt.Meterage2__c;
//                    curt.TasmaMetrage2__c = curt.TasmaMetrage2__c ;
//                    curt.TasmaPlace2__c = curt.TasmaPlace2__c == null ? curt.TasmaPlace__c : curt.TasmaPlace2__c;
//                    curt.ObrobkaNiz2__c = curt.ObrobkaNiz2__c == null ? curt.ObrobkaNiz__c : curt.ObrobkaNiz2__c;
//                    curt.Type2__c = curt.Type2__c == null ? curt.Type__c : curt.Type2__c;
//                    curt.Tasma2__c = curt.Tasma2__c == null ? curt.Tasma__c : curt.Tasma2__c;
//                    curt.Zbirka2__c = curt.Zbirka2__c == null ? curt.Zbirka__c : curt.Zbirka2__c;
//                    curt.CurtainDiscount2__c = curt.CurtainDiscount2__c == null ? curt.CurtainDiscount__c : curt.CurtainDiscount2__c;
//                    curt.Nisha2__c = curt.Nisha2__c == null ? curt.Nisha__c : curt.Nisha2__c;
//                    curt.Name2__c = curt.Name2__c == null ? curt.Name__c : curt.Name2__c;
//                    curt.Room2__c = curt.Room2__c == null ? curt.Room__c : curt.Room2__c;
//                    curt.DeliveryNumber2__c = curt.DeliveryNumber2__c == null ? curt.DeliveryNumber__c : curt.DeliveryNumber2__c;
//                    curt.Quantity2__c = curt.Quantity2__c == null ? curt.Quantity__c : curt.Quantity2__c;
//                    curt.ContactDiscount2__c = curt.ContactDiscount2__c == null ? curt.ContactDiscount__c : curt.ContactDiscount2__c;
//                    curt.Description2__c = curt.Description2__c == null ? curt.Description__c : curt.Description2__c;
//                    curt.Carniz2__c = curt.Carniz2__c == null ? curt.Carniz__c : curt.Carniz2__c;
//                    curt.GeneralPrice2__c = curt.GeneralPrice2__c == null ? curt.GeneralPrice__c : curt.GeneralPrice2__c;
//                    curt.Diameter2__c = curt.Diameter2__c == null ? curt.Diameter__c : curt.Diameter2__c;
//                }
            } else {
                curt.Name = 'ШТОРА?';
            }
        }
    }

}