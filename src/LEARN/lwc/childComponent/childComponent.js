/**
 * Created by KostiantynMarchenkov on 7/17/2025.
 */

import {LightningElement, api} from 'lwc';

export default class ChildComponent extends LightningElement {
    @api valueFromParent = '';
    @api placeholder = '';
}