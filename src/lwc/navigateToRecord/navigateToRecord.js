/**
 * Created by KostiantynMarchenkov on 4/1/2025.
 */

import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { FlowNavigationFinishEvent } from 'lightning/flowSupport';

export default class NavigateToRecord extends NavigationMixin(LightningElement) {
    @api recordId;

    connectedCallback() {
        this.navigateToRecord()
    }

    navigateToRecord() {
        if (this.recordId) {
            this[NavigationMixin.GenerateUrl]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.recordId,
                    actionName: 'view'
                },
            }).then(url => {
                window.open(url, "_self");
                this.finishFlow();
            });
        }
    }

    finishFlow() {
        this.dispatchEvent(new FlowNavigationFinishEvent());
    }
}