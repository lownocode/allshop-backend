const app_secret_key = "hgDp5dPrFpFeEe2jkSo6";

function validateAppUrl(url) {
    const query_params = url.slice(url.indexOf("?") + 1).split("&")
    .reduce((a, x) => {
        const data = x.split("=");
        a[data[0]] = data[1];
        return a;
    }, {});

    const sign_params = {};
    
    Object.keys(query_params)
    .sort()
    .forEach((key) => {
        if (!key.startsWith("vk_")) return;
        sign_params[key] = query_params[key];
    });
    
    const sign_str = Object.keys(sign_params)
    .reduce((a, x) => {
        a.push(x + "=" + sign_params[x]);
        return a;
    }, []).join("&");
    
    let sign = require("crypto")
    .createHmac("sha256", app_secret_key)
    .update(sign_str);

    sign = sign.digest("binary");
    sign = require("buffer").Buffer.from(sign, "binary").toString("base64");
    sign = sign.split("+").join("-");
    sign = sign.split("/").join("_");
    sign = sign.replace(/=+$/, '');

    let status = sign === query_params["sign"];
    let readStatus = {
        status: status,
        sign: sign,
        vk: query_params['sign']
    };

    return readStatus;
};

function getUrlVars(url) {
    var hash;
    var myJson = {};
    var hashes = url.slice(url.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        myJson[hash[0]] = hash[1];
    }

    return myJson;
};

module.exports = {
    validateAppUrl: validateAppUrl,
    getUrlVars: getUrlVars
};