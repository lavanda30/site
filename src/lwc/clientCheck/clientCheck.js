/**
 * Created by Kostiantyn_Marchenko on 12/2/2024.
 */

import {LightningElement} from 'lwc';

export default class ClientCheck extends LightningElement {
    showCheckingForm = false;

    handleChange() {
        this.showCheckingForm = !this.showCheckingForm;
    }

}