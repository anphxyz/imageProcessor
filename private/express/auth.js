module.exports = exports = function (app) {
    app.post('/getTokenData', (req, bigRes) => {
        console.log('--------------post /getTokenData->body: ', req.body);
        var tokenId = req.body.tokenId;

        mongoHelper.findLoginByTokenId(tokenId, function (err, oUser) {
            if (err) throw err;
            console.log('-----------oUser != null', oUser != null);
            if (oUser != null) {
                var logInfo = aesHelper.decrypt(oUser.tokenData).split('##qb##'),
                    // Build the post string from an object
                    post_data = JSON.stringify({
                        'username': logInfo[0],
                        'password': logInfo[1],
                        'src': logInfo[2]
                    }),
                    // An object of options to indicate where to post to
                    post_options = {
                        host: CONST.BON_SERVICE_ROOT,
                        path: CONST.BON_LOGIN,
                        method: 'POST',
                        headers: {
                            'Content-Length': post_data.length,
                            'Content-Type': 'application/json'
                        }
                    },
                    // Set up the request
                    post_req = http.request(post_options, function (res) {
                        // console.log('---STATUS: ' + res.statusCode);
                        //  console.log('---HEADERS: ' + JSON.stringify(res.headers));
                        var msg = '';
                        res.setEncoding('utf8');
                        res.on('data', function (chunk) {
                            msg += chunk;
                        });
                        res.on('data', function () {
                            console.log('---BODY: ' + msg);
                            bigRes.send(msg);
                        });
                    });
                // post the data
                console.log(post_data, 'post_data--------', aesHelper.decrypt(logInfo[1]));
                post_req.write(post_data);
                post_req.end();
            } else {
                bigRes.send({
                    "status": "error",
                    "elements": { "msg": "user not login bonevo" }
                });
            }
        }, true);
    });
};