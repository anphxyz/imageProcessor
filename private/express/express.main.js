module.exports = exports = function (app) {
    var expressImage = require('./image.uploader.js'),
        auth = require('./auth.js');
    // allow CORS
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    //scross login	
    auth(app);
    // upload tool
    expressImage(app);
};