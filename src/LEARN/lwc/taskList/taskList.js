/**
 * Created by KostiantynMarchenkov on 7/24/2025.
 */

import {LightningElement, api} from 'lwc';
import {refreshApex} from "@salesforce/apex";

export default class TaskList extends LightningElement {

    columns = [{
        label: 'Task Name',
        fieldName: 'subject',
        type: 'text'
    },
        {
            label: 'Status',
            fieldName: 'status',
            type: 'text'
        },
        {
            type: 'button',
            typeAttributes: {
                name: 'edit',
                iconName: 'utility:edit'
            }
        }
    ];

    @api tasks;

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'edit') {
            const editEvent = new CustomEvent('edit', {
                detail: { row }
            });
            this.dispatchEvent(editEvent);
            console.log('Edit action initiated for:', row.subject);
        } else if (actionName === 'delete') {
            console.log('Delete action:', row.id);
        }
    }

    handleReloadAction() {
        const reloadEvent = new CustomEvent('reload', {
            detail: { handleReload: true }
        });
        this.dispatchEvent(reloadEvent);
    }
}