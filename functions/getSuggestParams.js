export const getSuggestParams = (string) => {
    let params = new Object();
    string.split('&')
    .map(param => {
        const keys = param.split('=');
        params[keys[0]] = keys[1];
    });

    return params;
};