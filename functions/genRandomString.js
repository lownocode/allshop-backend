export const genRandomString = (length) => {
    let string = "";
    const possible = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890";

    for(let i = 0; i < length; i++) {
        string += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return string;
};