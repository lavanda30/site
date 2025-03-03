/**
 * Created by Kostiantyn_Marchenkov on 3/3/2025.
 */

import {LightningElement, api, track, wire} from 'lwc';
import curtains from '@salesforce/apex/DisplayCurtainMeteragesController.getCurtainsWithFinalMeterages';
import './displayCurtainMeterages.css';

export default class DisplayCurtainMeterages extends LightningElement {
    @api recordId;
    @track curtainData = [];


    @wire(curtains, {recordId: '$recordId'})
    wiredCurtains({data, error}) {
        console.log(this.recordId);
        if (data) {
            this.curtainData = Object.keys(data).map(name => {
                let formula = data[name];
                let total = formula.split('+').reduce((sum, num) => sum + parseFloat(num.trim()), 0);
                return {name, formula, total};
            });
        } else if (error) {
            console.error('Error loading curtains:', error);
        }
    }

    columns = [
        {label: 'Назва тканини', fieldName: 'name', type: 'text'},
        {label: 'Метраж кожної тканини', fieldName: 'formula', type: 'text'},
        {label: 'Загальний метраж', fieldName: 'total', type: 'number'}
    ];
}