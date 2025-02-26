/**
 * Created by Kostiantyn_Marchenko on 12/2/2024.
 */

public with sharing class curtainFormController {
    
    @AuraEnabled
    public static void createContact(String jsonDataFromForm) {
        System.debug('jsonDataFromForm ' + jsonDataFromForm);
        try {
            Map<String, Object> dataFromForm = (Map<String, Object>) JSON.deserializeUntyped(jsonDataFromForm);
            
            List<Contact__c> contacts = new List<Contact__c>();
            
            String name = (String) ((Map<String, Object>) dataFromForm.get('clientData')).get('name');
            String phone = (String) ((Map<String, Object>) dataFromForm.get('clientData')).get('phone');
            String discount = (String) ((Map<String, Object>) dataFromForm.get('clientData')).get('discount');
            String description = (String) ((Map<String, Object>) dataFromForm.get('clientData')).get('descrioption');
            String address = (String) ((Map<String, Object>) dataFromForm.get('clientData')).get('address');
            System.debug('phone ' + phone);
            List<Contact__c> existingContacts = [
                    SELECT Id, Name,ClientName__c, Description__c, GeneralDiscount__c, Address__c
                    FROM Contact__c
                    WHERE Name = :phone
                    LIMIT 1
            ];
            System.debug('existingContact ' + existingContacts);
            if (!existingContacts.isEmpty()) {
                existingContacts[0].ClientName__c = name;
                existingContacts[0].Description__c += (description != null ? '; ' + description : '');
                existingContacts[0].GeneralDiscount__c = discount;
                existingContacts[0].Address__c = address;
                
                update existingContacts;
                
                contacts.add(existingContacts[0]);
            } else {
                Contact__c newContact = new Contact__c();
                newContact.ClientName__c = name;
                newContact.Name = phone;
                newContact.GeneralDiscount__c = discount;
                newContact.Description__c = description;
                newContact.Address__c = address;
                
                Database.insert(newContact);
                
                contacts.add(newContact);
                System.debug(newContact);
            }
            
            List<Object> blocks = (List<Object>) dataFromForm.get('blocks');
            
            List<Curtain__c> curtains = new List<Curtain__c>();
            for (Contact__c contact : contacts) {
                for (Object blockObj : blocks) {
                    Map<String, Object> block = (Map<String, Object>) blockObj;
                    System.debug('Block: ' + JSON.serializePretty(block));
                    System.debug((String) block.get('label'));
                    Curtain__c curtain = new Curtain__c(
                            Room__c = (String) block.get('room'),
                            Type__c = (String) block.get('type'),
                            Quantity__c = String.isBlank((String)block.get('quantity')) ? '1' : (String)block.get('quantity'),
                            Name__c = (String) block.get('label'),
                            Price__c = (String) block.get('price'),
                            PriceType__c =  String.isBlank((String) block.get('priceType')) ? 'грн.' : (String) block.get('priceType'),
                            Nisha__c = (String) block.get('nisha'),
                            Carniz__c = (String) block.get('carniz'),
                            Diameter__c = (String) block.get('diameter'),
                            CarnizWigth__c = (String) block.get('carniz_wigth'),
                            HeightPoint__c = (String) block.get('heightPoint'),
                            Height__c = (String) block.get('height'),
                            Tasma__c = (String) block.get('tasma'),
                            Zbirka__c = (String) block.get('zbirka'),
                            TasmaPrice__c = (String) block.get('tasmaPrice'),
                            PoshivPrice__c = (String) block.get('poshiv'),
                            Delivery__c = (String) block.get('delivery'),
                            DeliveryNumber__c = (String) block.get('deliveryNumber'),
                            NavisPrice__c = (String) block.get('navisPrice'),
                            Navis__c = (Boolean) block.get('navis'),
                            Viizd__c = (Boolean) block.get('viizd'),
                            CustomWigth__c = (String) block.get('custom_wigth'),
                            CurtainDiscount__c = (String) block.get('curtainDiscount'),
                            Contact__c = contact.Id
                    );
                    
                    curtains.add(curtain);
                    System.debug('Curtains ' + curtains);
                
                }
            }
            
            insert curtains;
            
            System.debug('Curtains ' + curtains);
            CurtainCalculator.calculateData(curtains[0]);
            update curtains;
        } catch (Exception ex) {
            System.debug(ex);
        }
    }
}