/**
 * Created by Kostiantyn_Marchenkov on 3/1/2025.
 */

import {LightningElement, api, wire} from 'lwc';
import curtain from '@salesforce/resourceUrl/curtainLAVANDA';
import curtainCentr from '@salesforce/resourceUrl/curtainLAVANDA_centr';
import curtainNiz from '@salesforce/resourceUrl/curtainLAVANDA_niz';
import getCurtain from '@salesforce/apex/CurtainImageController.getCurtainRecord';
import saveImageToFiles from '@salesforce/apex/CurtainImageController.saveImageToFiles';

export default class CurtainImageGenerator extends LightningElement {
    @api recordId;
    @api curtainWidth;
    @api curtainHeight;
    @api curtainHeightPoint;
    @api zbirka;
    @api tasma;
    @api tasmaPlace;
    @api curtainName;
    @api room;
    @api type;
    @api curtainNiz;
    @api quantity;
    @api contactName;
    @api description;
    @api generateButton = false;

    @api curtainUrl = curtainCentr;

    @wire(getCurtain, {recordId: '$recordId'})
    wiredCurtain({data, error}) {
        console.log(this.recordId);
        if (data) {
            console.log('11111111111 ' + data.Meterage__c)
            this.curtainWidth = data.Quantity__c > 1
                ? data.Quantity__c + ' шт. по ' + Math.round((data.Meterage__c / data.Quantity__c) * 100)
                : '1 шт., ' + Math.round(data.Meterage__c * 100);
            console.log('data.Meterage__c: ' + data.Meterage__c);
            if (data.Meterage__c != null) {
                this.generateButton = true;
            }
            this.curtainHeight = data.Height__c ? data.Height__c : '- висота -';
            this.curtainHeightPoint = data.HeightPoint__c ? data.HeightPoint__c : '- точка висоти -';
            this.zbirka = data.Zbirka__c ? data.Zbirka__c : '- збірка -';
            this.tasma = data.Tasma__c ? data.Tasma__c : '- тасьма -';
            this.tasmaPlace = data.TasmaPlace__c ? data.TasmaPlace__c : '- місце тасьми -';
            this.curtainName = data.Name__c ? data.Name__c : '- назва тканини- ';
            this.room = data.Room__c ? data.Room__c : '- кімната- ';
            this.type = data.Type__c ? data.Type__c : '- тип -';
            this.quantity = data.Quantity__c ? data.Quantity__c : '- кількість -';
            this.date = new Date(data.CreatedDate).toLocaleDateString('ru-RU');
            this.curtainNiz = data.ObrobkaNiz__c ? data.ObrobkaNiz__c : '- обробка низу -';
            this.contactName = data.ContactName__c ? data.ContactName__c : '- імя замовника -';
            this.description = data.Description__c ? data.Description__c : '';

            if (this.curtainHeightPoint === 'від краю до краю') {
                this.curtainUrl = curtain;
            } else if (this.curtainHeightPoint === 'до тасьми') {
                this.curtainUrl = curtainNiz;
            }
            this.drawCurtainWithDimensions()
        } else if (error) {
            console.log(error)
        }
    }

    renderedCallback() {
        // console.log(this.recordId;)
        if (this.curtainHeightPoint === 'від краю до краю') {
            this.curtainUrl = curtain;
        } else if (this.curtainHeightPoint === 'до тасьми') {
            this.curtainUrl = curtainNiz;
        }

        if (this.curtainHeight && this.curtainWidth) {
            this.drawCurtainWithDimensions();
        }
    }

    drawCurtainWithDimensions() {
        const canvas = this.template.querySelector('canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = this.curtainUrl;

        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Рисуем размеры
            ctx.fillStyle = 'black';
            ctx.font = '21px Arial';

            ctx.font = '21px Arial';

// Текст (вертикальный, центр правой стороны)
            ctx.save();
            ctx.translate(545, 280); // Центр правой стороны
            ctx.rotate(-Math.PI / 2); // Поворачиваем текст на -90 градусов
            const text1 = this.curtainHeight + ' см,' + '   ' + this.curtainHeightPoint;
            const text1Width = ctx.measureText(text1).width;
            ctx.fillText(text1, -text1Width / 2, 0); // Центрируем текст
            ctx.restore();

// Текст (горизонтальный, центр нижней стороны)
            const text2 = this.curtainWidth + ' см';
            const text2Width = ctx.measureText(text2).width;
            ctx.fillText(text2, 295 - text2Width / 2, 295); // Центрируем по ширине

// Текст тип шторы(горизонтальный, центр нижней стороны)
            const textType = this.type;
            const text6Type = ctx.measureText(textType).width;
            ctx.fillText(textType, 295 - text6Type / 2, 172); // Центрируем по ширине

// Текст тасьма (горизонтальный, центр нижней стороны)
            const textTasma = this.tasma + ', ' + this.zbirka + ', ' + this.tasmaPlace;
            if (textTasma.length > 39 && textTasma.length <= 45) {
                ctx.font = '16px Arial';
            } else if (textTasma.length > 45) {
                ctx.font = '14px Arial';
            }
            const text3Tasma = ctx.measureText(textTasma).width;
            ctx.fillText(textTasma, 290 - text3Tasma / 2, 50); // Центрируем по ширине

// Текст назва заказа (горизонтальный, центр нижней стороны)
            ctx.font = '21px Arial';
            const textOrder = this.date + ' ' + this.contactName;

            const text0Order = ctx.measureText(textOrder).width;
            ctx.fillText(textOrder, 702 - text0Order / 2, 50); // Центрируем по ширине

// Текст низ штори (горизонтальный, центр нижней стороны)
            const textNiz = this.curtainNiz;
            const text4Niz = ctx.measureText(textNiz).width;
            ctx.fillText(textNiz, 290 - text4Niz / 2, 550); // Центрируем по ширине

// Текст назва ткани (горизонтальный, центр нижней стороны)
            const textName = this.curtainName;
            if (textName.length > 20 && textName.length <= 27) {
                ctx.font = '17px Arial';
            } else if (textName.length > 27 && textName.length <= 32) {
                ctx.font = '15px Arial';
            } else if (textName.length > 32) {
                ctx.font = '12px Arial';
            }
            const text4Name = ctx.measureText(textName).width;
            ctx.fillText(textName, 702 - text4Name / 2, 245); // Центрируем по ширине

// Текст назва комнаты (горизонтальный, центр нижней стороны)
            ctx.font = '21px Arial';
            const textRoom = this.room;
            const text4Room = ctx.measureText(textRoom).width;
            ctx.fillText(textRoom, 702 - text4Room / 2, 195); // Центрируем по ширине
// Текст коментар (горизонтальный, центр нижней стороны)
            ctx.font = '21px Arial';
            const textDescription = this.description;
            const text5Description = ctx.measureText(textDescription).width;
            ctx.fillText(textDescription, 702 - text5Description / 2, 295); // Центрируем по ширине


//Горизонтальная линия для размера
            ctx.moveTo(84, 300);
            ctx.lineTo(506, 300);
            ctx.stroke();

//Горизонтальная линия 1
            ctx.moveTo(580, 200);
            ctx.lineTo(825, 200);
            ctx.stroke();
//Горизонтальная линия 2
            ctx.moveTo(580, 250);
            ctx.lineTo(825, 250);
            ctx.stroke();
//Горизонтальная линия 3
            ctx.moveTo(580, 300);
            ctx.lineTo(825, 300);
            ctx.stroke();

            /**
             ctx.save();
             ctx.translate(470, 250); // Центр правой стороны
             ctx.rotate(-Math.PI / 2); // Поворачиваем текст на -90 градусов
             const text1 = this.curtainHeight + ' см' + '    ' + this.curtainHeightPoint;
             const text1Width = ctx.measureText(text1).width;
             ctx.fillText(text1, -text1Width / 2, 0); // Центрируем текст
             ctx.restore();

             // Текст (горизонтальный, центр нижней стороны)
             const text2 = this.curtainWidth + ' см';
             const text2Width = ctx.measureText(text2).width;
             ctx.fillText(text2, 270 - text2Width / 2, 270); // Центрируем по ширине


             ctx.beginPath();
             ctx.moveTo(473, 40);
             ctx.lineTo(473, 475);
             ctx.stroke();

             ctx.moveTo(70, 273);
             ctx.lineTo(424, 273);
             ctx.stroke();

             ctx.moveTo(420, 475);
             ctx.lineTo(480, 475);
             ctx.stroke();

             ctx.moveTo(425, 40);
             ctx.lineTo(480, 40);
             ctx.stroke();

             **/
        };
    }

    handleSaveImage() {
        const canvas = this.template.querySelector('canvas');
        const imgData = canvas.toDataURL('image/png').split(',')[1];

        saveImageToFiles({base64Image: imgData, recordId: this.recordId})
            .then(() => {
                console.log('Image saved successfully');
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
}