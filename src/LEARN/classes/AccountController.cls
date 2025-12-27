/**
 * Created by KostiantynMarchenkov on 7/15/2025.
 */

public with sharing class AccountController {
    
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [SELECT Id, Name, Phone FROM Account LIMIT 5];
    }

}