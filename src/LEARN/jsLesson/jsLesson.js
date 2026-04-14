/**
 * Created by KostiantynMarchenkov on 7/4/2025.
 */

import {LightningElement} from 'lwc';

export default class JsLesson extends LightningElement {
    connectedCallback() {
        // document.write('Hello World!');
        console.error('Hello World!');
        console.warn('Hello World!');
    }
}