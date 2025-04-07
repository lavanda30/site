/**
 * Created by Kostiantyn_Marchenkov on 3/1/2025.
 */

public with sharing class CurtainImageController {
    @AuraEnabled
    public static void saveImageToFiles(String base64Image, Id recordId) {
        if (String.isBlank(base64Image)) {
            throw new AuraHandledException('Empty image data');
        }
        
        Curtain__c curtain = [
                SELECT PicturesAttached__c
                FROM Curtain__c
                WHERE Id = :recordId
        ];
        
        ContentVersion file = new ContentVersion();
        file.Title = 'Curtain Image';
        file.PathOnClient = 'curtain.png';
        file.VersionData = EncodingUtil.base64Decode(base64Image);
        file.FirstPublishLocationId = recordId;
        System.debug(file);
        Database.SaveResult result = Database.insert(file);
        
        if (result.isSuccess()) {
            curtain.PicturesAttached__c = true;
            update curtain;
        }
    
    }
    
    @AuraEnabled(Cacheable=true)
    public static Curtain__c getCurtainRecord(String recordId) {
        System.debug('recordId ' +recordId);
        Curtain__c curtain = [
                SELECT Height__c, HeightPoint__c, Meterage__c, CustomWigth__c, Zbirka__c, Tasma__c, ObrobkaNiz__c,
                        TasmaPlace__c, Name__c, Room__c, CreatedDate, toLabel(Type__c), Quantity__c, ContactName__c,
                        Description__c
                FROM Curtain__c
                WHERE Id = :recordId
                LIMIT 1
        ];
        System.debug(curtain.Description__c);
        
        return curtain;
    }
}