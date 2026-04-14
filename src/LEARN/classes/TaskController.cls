/**
 * Created by KostiantynMarchenkov on 7/24/2025.
 */

public with sharing class TaskController {
    
    @AuraEnabled(Cacheable=true)
    public static List<Task> getTasks() {
        return [SELECT Id, Subject, Status, Priority FROM Task LIMIT 10];
    }

    @AuraEnabled
    public static void createTask(String subject, String status, String priority) {
        Task newTask = new Task(
            Subject = subject,
            Status = status,
            Priority = priority
        );
        insert newTask;
    }
    
    @AuraEnabled
    public static Task updateTask(String taskId, String status, String subject) {
        try {
            System.debug('Updating task with ID: ' + taskId);
            System.debug('New status: ' + status);
            System.debug('New subject: ' + subject);
            
            Task taskToUpdate = [SELECT Id, Subject, Status, Priority FROM Task WHERE Id = :taskId LIMIT 1];
            
            taskToUpdate.Status = status;
            taskToUpdate.Subject = subject;
            
            update taskToUpdate;
        return taskToUpdate;
        
        } catch (Exception e) {
            throw new AuraHandledException('Error updating task: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void deleteTasks(List<String> taskIds) {
        List<Task> tasksToDelete = [SELECT Id FROM Task WHERE Id IN :taskIds LIMIT 100];
        
        if(!tasksToDelete.isEmpty()) {
            delete tasksToDelete;
        }
    }
}