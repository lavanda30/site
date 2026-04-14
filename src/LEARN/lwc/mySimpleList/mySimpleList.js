/**
 * Created by KostiantynMarchenkov on 7/10/2025.
 */

import {LightningElement, wire, api} from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
import {getRecord} from 'lightning/uiRecordApi'

export default class MySimpleList extends LightningElement {
    list = [];
    value = '';
    accountName = '';

    connectedCallback() {
        this.list = ['MIlk', 'Bread', 'tomato'];
        console.log('List initialized:', this.list[0]);
    }

    @wire(getAccounts)
    wiredAccounts({error, data}) {
        if (data) {
            console.log('Data received:', data);
            this.list = data.map(account => {
                return {
                    name: account.Name,
                    phone: account.Phone,
                }
            });
            console.log('Accounts fetched:', this.list);
            this.accountName = this.list.length > 0 ? this.list[0].name : '';
            this.value = this.accountName;
        } else if (error) {
            console.error('Error fetching accounts:', error);
        }
    }

    handleChange(event) {
        // let value1 = event.target.value;
        this.value = event.target.value ? event.target.value.toUpperCase() : this.accountName;
    }
}