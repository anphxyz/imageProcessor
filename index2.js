var express = require('express'),
    app = express();
//define global variable
global.fs = require('fs');
global.path = require('path');
global.url = require('url');
global.crypto = require('crypto');
global.zlib = require('zlib');
global.CONST = require('./private/helper/constant');
global.bodyParser = require('body-parser');
global.s3manager = require('./private/s3/S3Manager');
global.aesHelper = require('./private/helper/aesHelper');
global.mongoHelper = require('./private/mongo/mongoHelper');
global.async = require('async');
//https
// var options = {
//         key: fs.readFileSync('/etc/ssl/private/bonevo.net.key'),
//         cert: fs.readFileSync('/etc/ssl/certs/bonevo.net.crt'),
//         ca: fs.readFileSync('/etc/ssl/certs/Intermediate_CA_Bundle.crt')
//     },
//     server = require('https').createServer(options, app);
//http
server = require('http').createServer(app);
// parse application/json
app.use(bodyParser.json());
//public folder
app.use(express.static('public'));
require('./private/socket/socket.root.js')(server);
require('./private/express/express.main.js')(app);
server.listen(3005);



/////////////////////////////////////////////////
var CronJob = require('cron').CronJob,
    cleannerBusy = false,
    job = new CronJob('00 00 03 * * 0-6', function() {
            // Runs every day at 3AM
            var currentdate = new Date(),
                datetime = "Last Sync: " + currentdate.getDate() + "/" + (currentdate.getMonth() + 1) + "/" + currentdate.getFullYear() + " @ " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
            console.log(datetime + '_______cleannerInterval: started' + cleannerBusy);
            var dirPath = './public/tempUpload/';
            if (!cleannerBusy) {
                cleannerBusy = true;
                try {
                    var files = fs.readdirSync(dirPath);
                } catch (e) {
                    return;
                }
                if (files.length > 0)
                    for (var i = 0; i < files.length; i++) {
                        var filePath = dirPath + files[i];
                        console.log(i + '__delete: ' + filePath);
                        if (fs.statSync(filePath).isFile())
                            fs.unlinkSync(filePath);
                        else
                            rmDir(filePath);
                    }
            }
            console.log('_______cleannerInterval: done');
        }, function() {
            /* This function is executed when the job stops */
        },
        true, /* Start the job right now */
        /* Time zone of this job. */
        'Asia/Ho_Chi_Minh'
    );