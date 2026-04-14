document.writeln('Hello')
document.write(' World!')
console.error('Hello World!');
console.warn('Hello World!');

let num;
let counter= 0;

num = 42;

let arr = [];
arr.push(num, num +1, "Hello");
arr[3] = "World";
console.log(arr);

function handleClick(element) {
    // let res = confirm('Are you sure?');
    counter++;
    console.log('Counter: ' + counter);
    element.innerHTML = 'Clicked: ' + counter;
    // console.log(res);
}

function onSubmit(element) {


    console.log('Form submitted');
}













// for (let i = 0; i < arr.length; i++) {
//     console.log(arr[i]);
// }
//
// while (num > 30) {
//     console.log(num)
//     num-=2;
// }

// do {
//     num--;
//     console.log(num);
// } while (num > 35);

// function info(value) {
//     console.log('Hello ' + value);
// }
//
// function sum(a, b) {
//     let sum =  a + b;
//     info(sum);
//     console.log('Sum is: ' + sum);
// }

// info("Dima");
// sum(10, 20);