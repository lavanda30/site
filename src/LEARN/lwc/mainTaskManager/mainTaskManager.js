/**
 * Created by KostiantynMarchenkov on 7/24/2025.
 */

import {LightningElement, wire, track} from 'lwc';
import getTasks from '@salesforce/apex/TaskController.getTasks';
import updateTask from '@salesforce/apex/TaskController.updateTask';
import {refreshApex} from '@salesforce/apex';

export default class MainTaskManager extends LightningElement {

    tasks = [];
    error;
    @track editingTask = null;

    @wire(getTasks)
    wiredTasks({error, data}) {
        if (data) {
            this.tasks = data.map(task => ({
                id: task.Id,
                subject: task.Subject,
                status: task.Status
            }));
            console.log('Tasks fetched:', JSON.stringify(this.tasks));
        } else if (error) {
            this.error = error;
            console.error('Error fetching tasks:', error);
        }
    }

    handleFieldChange(event) {
        const fieldName = event.target.name;
        console.log('fieldName ' + fieldName);
        this.editingTask[fieldName] = event.target.value;
        console.log('Editing task after field change:', JSON.stringify(this.editingTask));
    }

    handleEdit(event) {
        console.log('Edit event received:', JSON.stringify(event.detail.row));
        console.log('Edit event 1111:', event.detail.row.subject);
        this.editingTask = {...event.detail.row};
        console.log('Editing task:', JSON.stringify(this.editingTask));
    }

    handleCancel() {
        this.editingTask = null;
    }

    handleSave() {
        console.log('Saving task:', JSON.stringify(this.editingTask));
        console.log('this.editingTask.Id' + this.editingTask.id);
        updateTask({
            taskId: this.editingTask.id,
            status: this.editingTask.status,
            subject: this.editingTask.subject
        })
            .then(() => {
                this.editingTask = null;
            })
            .catch(error => {
                console.error('Error updating task:', error);
            });
    }

    handleReloadAction(event) {
        console.log(event.detail.handleReload)
        if(event.detail.handleReload) {
            console.log('Reloading tasks...' + JSON.stringify(this.tasks));
            refreshApex(this.wiredTasks);
            // this.tasks = [...this.wiredTasks.data.map(task => ({
            //     id: task.Id,
            //     subject: task.Subject,
            //     status: task.Status
            // }))];
            console.log('Reloading tasks...' + JSON.stringify(this.tasks));
        }
    }
}