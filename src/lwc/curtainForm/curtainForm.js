import { LightningElement, track } from 'lwc';
import sendJSONToApex from '@salesforce/apex/curtainFormController.createContact';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import curtain from '@salesforce/resourceUrl/curtain';

export default class CurtainForm extends LightningElement {
    curtainUrl = curtain;

    // Данные клиента
    @track clientData = {
        name: '',
        phone: '',
        status: 'medium',
        description: '',
        address: '',
    };

    // Блоки замеров
    @track blocks = [];

    get buttonLabel() {
        return this.blocks.length > 0 ? 'Розрахувати' : 'Зберегти';
    }

    // Опции для picklist
    discount = [
        { value: 'none', label: 'Виберіть значення' },
        { value: '2', label: '2 %' },
        { value: '3', label: '3 %' },
        { value: '4', label: '4 %' },
        { value: '5', label: '5 %' },
        { value: '6', label: '6 %' },
        { value: '7', label: '7 %' },
        { value: '8', label: '8 %' },
        { value: '10', label: '10 %' },
        { value: '13', label: '13 %' },
        { value: '14', label: '14 %' },
        { value: '15', label: '15 %' },
    ];

    nisha = [
        { value: 'none', label: 'Виберіть значення' },
        { value: 'yes', label: 'Так' },
        { value: 'no', label: 'Ні' },
    ];

    carniz = [
        { value: 'none', label: 'Виберіть значення' },
        { value: 'gardinia', label: 'Gardinia' },
        { value: 'alutat', label: 'Alutat' },
        { value: 'ks', label: 'KS' },
        { value: 'lux', label: 'Lux S-M' },
        { value: 'ds', label: 'DS' },
        { value: 'circle', label: 'Круглий' },
        { value: 'metal', label: 'Металічний П-обр крючок' },
        { value: 'other', label: 'Інший' },
    ];

    diameter = [
        { value: 'none', label: 'Виберіть значення' },
        { value: '2', label: '2 см' },
        { value: '2_5', label: '2,5 см' },
        { value: '3', label: '3 см' },
    ];

    highPoint = [
        { value: 'none', label: 'Виберіть значення' },
        { value: 'do_carnizu', label: 'до карнізу' },
        { value: 'do_gachka', label: 'до гачка' },
        { value: 'do_petli', label: 'до петлі' },
        { value: 'do_virobu', label: 'готового виробу' },
    ];

    type = [
        { value: 'none', label: 'Виберіть значення' },
        { value: 'shtora', label: 'Штора' },
        { value: 'tul', label: 'Тюль' },
    ];

    tasma = [
        { value: 'none', label: 'Виберіть значення' },
        { value: 'fixProzora', label: 'Прозора фіксвана' },
        { value: 'fixHB', label: 'ХБ фіксована' },
        { value: 'notfix', label: 'Не фіксована' },
    ];

    zbirka = [
        { value: 'none', label: 'Виберіть значення' },
        { value: 'enigma_15', label: 'Enigma 1:1,5' },
        { value: 'enigma_18', label: 'Enigma 1:1,8' },
        { value: 'enigma_2', label: 'Enigma 1:2' },
        { value: 'enigma_25', label: 'Enigma 1:2,5' },
        { value: 'enigma_3', label: 'Enigma 1:3' },
        { value: 'sofora_18', label: 'Sofora 1:1,8' },
        { value: 'sofora_2', label: 'Sofora 1:2' },
        { value: 'pinella', label: 'Pinella' },
        { value: 'hvulya', label: 'Хвиля 1:2' },
        { value: 'luversna', label: 'Люверсна' },
    ];

    quantity = [
        { value: '1', label: '1 штука' },
        { value: '2', label: '2 штуки' },
        { value: '3', label: '3 штуки' },
    ];

    poshiv = [
        { value: '150', label: '150 грн' },
        { value: '180', label: '180 грн' },
        { value: '200', label: '200 грн' },
    ];

    tasmaPrice = [
        { value: '85', label: '85 грн' },
        { value: '110', label: '110 грн' },
        { value: '140', label: '140 грн' },
    ];

    delivery = [
        { value: '120', label: '120 грн' },
        { value: '150', label: '150 грн' },
        { value: '180', label: '180 грн' },
        { value: '200', label: '200 грн' },
        { value: '220', label: '220 грн' },
    ];

    deliveryNumber = [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
    ];

    navisPrice = [
        { value: '120', label: '120 грн м.п.' },
        { value: '140', label: '140 грн м.п.' },
        { value: '160', label: '160 грн м.п.' },
        { value: '180', label: '180 грн м.п.' },
        { value: '200', label: '200 грн м.п.' },
    ];

    curtainDiscount = [
        { value: 'none', label: 'Виберіть значення' },
        { value: '2', label: '2 %' },
        { value: '3', label: '3 %' },
        { value: '4', label: '4 %' },
        { value: '5', label: '5 %' },
        { value: '6', label: '6 %' },
        { value: '7', label: '7 %' },
        { value: '8', label: '8 %' },
        { value: '10', label: '10 %' },
        { value: '13', label: '13 %' },
        { value: '14', label: '14 %' },
        { value: '15', label: '15 %' },
    ];

    // Динамические состояния
    // selectedStatus = 'medium';
    ficsovanaTasma = true;
    circleCarniz = true;
    navis = false;
    viizd = false;

    // Общий обработчик ввода
    handleInputChange(event) {
        const field = event.target.dataset.field;
        const blockIndex = event.target.dataset.index;
        const fieldValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

        if (blockIndex !== undefined) {
            // Создаем новый массив, чтобы обновление было реактивным
            this.blocks = this.blocks.map((block, index) =>
                index == blockIndex ? { ...block, [field]: fieldValue } : block
            );

            // Динамическая логика отображения
            if (field === 'carniz') {
                this.blocks = this.blocks.map((block, index) =>
                    index == blockIndex ? { ...block, circleCarniz: fieldValue !== 'circle' } : block
                );
            }

            if (field === 'tasma') {
                this.blocks = this.blocks.map((block, index) =>
                    index == blockIndex ? { ...block, ficsovanaTasma: fieldValue === 'notfix' } : block
                );
            }
        } else {
            this.clientData = { ...this.clientData, [field]: fieldValue };
        }
    }

    // Добавление нового блока
    addBlock() {
        const lastBlock = this.blocks[this.blocks.length - 1] || {};
        const newBlock = {
            name: this.blocks.name,
            id: this.blocks.length,
            room: lastBlock.room || '',
            type: lastBlock.type || '',
            label: lastBlock.label || '',
            price: lastBlock.price || '',
            nisha: lastBlock.nisha || '',
            carniz: lastBlock.carniz || '',
            diameter: lastBlock.diameter || '',
            carniz_wigth: lastBlock.carniz_wigth || '',
            heightPoint: lastBlock.heightPoint || '',
            height: lastBlock.height || '',
            tasma: lastBlock.tasma || '',
            zbirka: lastBlock.zbirka || '',
            navisPrice: lastBlock.navisPrice || '',
            tasmaPrice: lastBlock.tasmaPrice || '',
            navis: lastBlock.navis ?? false,
            viizd: lastBlock.viizd ?? false,
            circleCarniz: false,
            ficsovanaTasma: false,
        };
        this.blocks = [...this.blocks, newBlock];
    }

    // Удаление блока
    removeBlock(event) {
        const blockId = parseInt(event.target.dataset.id, 10);
        this.blocks = this.blocks.filter((block) => block.id !== blockId);
    }

    // Сохранение данных
    handleSaveButton() {
        // Получаем ссылки на обязательные поля
        // const nameField = this.template.querySelector('lightning-input[data-field="name"]');
        const phoneField = this.template.querySelector('lightning-input[data-field="phone"]');

        // Проверяем валидность каждого из полей
        let isValid = true;
        // if (!nameField.value) {
        //     nameField.setCustomValidity("Будь ласка, введіть ім'я");
        //     nameField.reportValidity();
        //     isValid = false;
        // } else {
        //     nameField.setCustomValidity("");
        // }

        if (!phoneField.value) {
            phoneField.setCustomValidity("Будь ласка, введіть мобільний телефон");
            phoneField.reportValidity();
            isValid = false;
        } else {
            phoneField.setCustomValidity("");
        }

        // Если хотя бы одно поле некорректно, не отправляем данные
        if (!isValid) {
            this.showToast('Помилка', 'Будь ласка, заповніть обов’язкові поля', 'error');
            return;
        }

        // Формируем payload и отправляем на сервер
        const payload = {
            clientData: this.clientData,
            blocks: this.blocks,
        };

        sendJSONToApex({jsonDataFromForm: JSON.stringify(payload)})
            .then((result) => {
                console.log(result);
                if(result.length == 0) {
                    this.showToast('Помилка', 'Не вдалося зберегти дані', 'error');
                    console.log(error);
                } else {
                    this.showToast('Успіх!', 'Дані створено успішно', 'success');
                }

            })
            .catch((error) => {
                console.error('Ошибка:', error);
                this.showToast('Помилка', 'Не вдалося зберегти дані', 'error');
            });
    }

    // Показ уведомления
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }
}