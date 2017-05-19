module.exports = exports = {

    AES_KEY: 'fjk393shs323fh2j',
    AES_IV: 'zxcmjasdhksahd33',


    decrypt: function(cipherData) {
        var CryptoJS = require("crypto-js"),
            key = CryptoJS.enc.Utf8.parse(CONST.AES_KEY),
            iv = CryptoJS.enc.Utf8.parse(CONST.AES_IV),
            decrypted = CryptoJS.AES.decrypt(cipherData, key, {
                iv: iv
            });
        return decrypted.toString(CryptoJS.enc.Utf8);
    },
    encrypt: function(message) {
        varCryptoJS = require("crypto-js"),
        key = CryptoJS.enc.Utf8.parse(CONST.AES_KEY),
        iv = CryptoJS.enc.Utf8.parse(CONST.AES_IV);
        cipherData = CryptoJS.AES.encrypt(message, key, {
            iv: iv
        });
        return cipherData.toString();
    }
}