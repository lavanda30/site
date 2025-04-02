/**
 * Created by Kostiantyn_Marchenkov on 3/3/2025.
 */

// import { LightningElement, api, track, wire } from 'lwc';
// import curtains from '@salesforce/apex/DisplayCurtainMeteragesController.getCurtainsWithFinalMeterages';
// import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import { NavigationMixin } from 'lightning/navigation';
//
// export default class DisplayCurtainMeterages extends NavigationMixin(LightningElement) {
//     @api recordId;
//     @track curtainData = [];
//     @track selectedRows = [];
//
//     @wire(curtains, { recordId: '$recordId' })
//     wiredCurtains({ data, error }) {
//         console.log(this.recordId);
//         if (data) {
//             this.curtainData = Object.keys(data).map(name => {
//                 let formula = data[name];
//                 let status = data[Status]
//                 let total = formula.split('+').reduce((sum, num) => sum + parseFloat(num.trim()), 0);
//                 return { name, formula, total, status};
//             });
//         } else if (error) {
//             console.error('Error loading curtains:', error);
//         }
//     }
//
//     columns = [
//         { label: 'Назва тканини', fieldName: 'name', type: 'text' },
//         { label: 'Метраж кожної тканини', fieldName: 'formula', type: 'text' },
//         { label: 'Загальний метраж', fieldName: 'total', type: 'number' },
//         { label: 'Статус', fieldName: 'status', type: 'text' }
//     ];
//
//     handleRowSelection(event) {
//         this.selectedRows = event.detail.selectedRows;
//     }
//
//     handleCheckboxChange(event) {
//         const rowName = event.target.dataset.id;
//         this.curtainData = this.curtainData.map(row =>
//             row.name === rowName ? { ...row, ordered: event.target.checked } : row
//         );
//         this.handleSendToFlow();
//     }
//
//     handleSendToFlow() {
//         const selectedData = this.curtainData.map(row => ({
//             name: row.name,
//             formula: row.formula,
//             total: row.total,
//             status: row.status
//         }));
//
//         const flowNavigationEvent = new CustomEvent('flownavigation', {
//             detail: { selectedData }
//         });
//         this.dispatchEvent(flowNavigationEvent);
//     }
// }
import { LightningElement, api, track, wire } from 'lwc';
import curtains from '@salesforce/apex/DisplayCurtainMeteragesController.getCurtainsWithFinalMeterages';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class DisplayCurtainMeterages extends NavigationMixin(LightningElement) {
    @api recordId;
    @track curtainData = [];
    @track selectedRows = [];

    @wire(curtains, { recordId: '$recordId' })
    wiredCurtains({ data, error }) {
        console.log(this.recordId);
        if (data) {
            this.curtainData = Object.keys(data).map(name => {
                let formula = data[name].meterage;
                let status = data[name].status;
                let total = formula.split('+').reduce((sum, num) => sum + parseFloat(num.trim()), 0);
                return { name, formula, total, status };
            });
        } else if (error) {
            console.error('Error loading curtains:', error);
        }
    }

    columns = [
        { label: 'Назва тканини', fieldName: 'name', type: 'text' },
        { label: 'Метраж кожної тканини', fieldName: 'formula', type: 'text' },
        { label: 'Загальний метраж', fieldName: 'total', type: 'number' },
        { label: 'Статус', fieldName: 'status', type: 'text' }
    ];

    handleRowSelection(event) {
        this.selectedRows = event.detail.selectedRows;
    }

    handleCheckboxChange(event) {
        const rowName = event.target.dataset.id;
        this.curtainData = this.curtainData.map(row =>
            row.name === rowName ? { ...row, ordered: event.target.checked } : row
        );
        this.handleSendToFlow();
    }

    handleSendToFlow() {
        const selectedData = this.curtainData.map(row => ({
            name: row.name,
            formula: row.formula,
            total: row.total,
            status: row.status
        }));

        const flowNavigationEvent = new CustomEvent('flownavigation', {
            detail: { selectedData }
        });
        this.dispatchEvent(flowNavigationEvent);
    }
}

