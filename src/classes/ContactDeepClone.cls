public with sharing class ContactDeepClone {
    
    @InvocableMethod(label='Contact Deep Clone')
    public static List<Id> contactDeepClone(List<String> recordIds) {
        // Получаем исходный контакт по ID
        List<Contact__c> contactsToClone = [
                SELECT
                        Id,
                        Name,
                        Address__c,
                        Expenses__c,
                        Description__c,
                        GeneralDiscount__c,
                        SelectedCurtains__c,
                        GeneralPrice__c,
                        ClientName__c,
                        FinalPrice__c
                FROM Contact__c
                WHERE Id = :recordIds[0]
                LIMIT 1
        ];
        
        // Генерируем новое имя для контакта
        String newName = cloneContactName(contactsToClone[0].Name);
        
        // Клонируем сам контакт (не копируем ID, копируем все поля)
        Contact__c clonedContact = contactsToClone[0].clone(false, true); // false - не копируем ID, true - копируем все поля
        clonedContact.Name = newName; // Присваиваем новому контакту имя с увеличенной приставкой
        
        // Сохраняем клонированный контакт
        insert clonedContact;
        
        // Получаем все связанные записи Assortment__c для клонированного контакта
        List<Assortment__c> assortmentsToClone = [
                SELECT Id, Name, Price__c, Size__c, Contact__c
                FROM Assortment__c
                WHERE Contact__c = :contactsToClone[0].Id
        ];
        
        // Клонируем связанные записи Assortment__c
        List<Assortment__c> clonedAssortments = new List<Assortment__c>();
        for (Assortment__c assortment : assortmentsToClone) {
            Assortment__c clonedAssortment = assortment.clone(false, true); // false - не копируем ID, true - копируем все поля
            clonedAssortment.Contact__c = clonedContact.Id; // Привязываем к новому контакту
            clonedAssortments.add(clonedAssortment);
        }
        
        // Сохраняем клонированные ассортименты
        if (!clonedAssortments.isEmpty()) {
            insert clonedAssortments;
        }
        
        // Получаем все связанные записи Curtain__c для клонированного контакта
        List<Curtain__c> curtainsToClone = [
                SELECT
                        Id,
                        Name,
                        CreatedById,
                        LastModifiedById,
                        AdvancePaymentReceived__c,
                        PriceType__c,
                        Check__c,
                        Height__c,
                        Viizd__c,
                        ManualPrice__c,
                        Delivery__c,
                        Diameter__c,
                        GeneralPrice__c,
                        FinalPrice__c,
                        Zbirka__c,
                        ContactDiscount__c,
                        Carniz__c,
                        Description__c,
                        Contact__c,
                        Quantity__c,
                        DeliveryNumber__c,
                        Room__c,
                        MeterageNaPoshiv__c,
                        TasmaMetrage__c,
                        Meterage__c,
                        Navis__c,
                        Name__c,
                        Nisha__c,
                        ObrobkaNiz__c,
                        PostpaidReceived__c,
                        TasmaPlace__c,
                        CurtainDiscount__c,
                        Status__c,
                        Tasma__c,
                        Type__c,
                        CurtainPaid__c,
                        HeightPoint__c,
                        PicturesAttached__c,
                        NavisPriceSum__c,
                        PoshivPriceSum__c,
                        TasmaPriceSum__c,
                        CurtainPriceSum__c,
                        NavisPrice__c,
                        PoshivPrice__c,
                        TasmaPrice__c,
                        Price__c,
                        CarnizWigth__c,
                        CustomWigth__c,
                        ContactName__c
                FROM Curtain__c
                WHERE Contact__c = :contactsToClone[0].Id
        ];
        
        
        // Клонируем связанные записи Curtain__c
        List<Curtain__c> clonedCurtains = new List<Curtain__c>();
        
        for (Curtain__c curtain : curtainsToClone) {
            String newCurtainName = cloneContactName(curtain.Room__c);
            Curtain__c clonedCurtain = curtain.clone(false, true); // false - не копируем ID, true - копируем все поля
            clonedCurtain.Contact__c = clonedContact.Id; // Привязываем к новому контакту
            clonedCurtain.Room__c = newCurtainName; // Привязываем к новому контакту
            clonedCurtains.add(clonedCurtain);
        }
        
        // Сохраняем клонированные занавески
        if (!clonedCurtains.isEmpty()) {
            insert clonedCurtains;
        }
        
        // Возвращаем ID нового контакта в список
        return new List<Id>{clonedContact.Id};
    }
    
    // Метод для генерации имени нового контакта
    private static String cloneContactName(String originalName) {
        // Проверяем, есть ли уже приставка "Пропозиція" в имени
        Integer index = originalName.indexOf('Пропозиція');
        if (index != -1) {
            // Если есть, увеличиваем номер
            Integer proposalNumber = Integer.valueOf(originalName.substring(index + 11).trim()) + 1;
            return originalName.substring(0, index) + 'Пропозиція ' + proposalNumber;
        } else {
            // Если нет, добавляем "Пропозиція 2"
            return originalName + ' Пропозиція 2';
        }
    }
}
