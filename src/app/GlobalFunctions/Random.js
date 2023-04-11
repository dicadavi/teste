// //Can change 7 to 2 for longer results.
// function random(params) {
// let r = (Math.random() + 1).toString(36).substring(7);
// return r
// }

function random(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}


module.exports = {random}