/**
 * Created by Kostiantyn_Marchenkov on 3/1/2025.
 */

import { LightningElement, api } from 'lwc';
import curtain from '@salesforce/resourceUrl/curtain';
import saveImageToFiles from '@salesforce/apex/CurtainImageController.saveImageToFiles';

export default class CurtainImageGenerator extends LightningElement {
    @api recordId;
    curtainUrl = curtain;

    renderedCallback() {
        this.drawCurtainWithDimensions();
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
            ctx.font = '20px Arial';

            ctx.font = '20px Arial';

// Текст "320 cm" (вертикальный, центр правой стороны)
            ctx.save();
            ctx.translate(370, 200); // Центр правой стороны
            ctx.rotate(-Math.PI / 2); // Поворачиваем текст на -90 градусов
            const text1 = '320 cm';
            const text1Width = ctx.measureText(text1).width;
            ctx.fillText(text1, -text1Width / 2, 0); // Центрируем текст
            ctx.restore();

// Текст "321 cm" (горизонтальный, центр нижней стороны)
            const text2 = '321 cm';
            const text2Width = ctx.measureText(text2).width;
            ctx.fillText(text2, 180 - text2Width / 2, 380); // Центрируем по ширине


            // ctx.beginPath();
            // ctx.moveTo(50, 30);
            // ctx.lineTo(50, 350);
            // ctx.stroke();
            //
            // ctx.moveTo(30, 300);
            // ctx.lineTo(350, 300);
            // ctx.stroke();
        };
    }

    handleSaveImage() {
        const canvas = this.template.querySelector('canvas');
        const imgData = canvas.toDataURL('image/png').split(',')[1];

        saveImageToFiles({ base64Image: imgData, recordId: this.recordId })
            .then(() => {
                console.log('Image saved successfully');
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
}