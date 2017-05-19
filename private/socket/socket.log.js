module.exports = exports = function(socket) {
    socket.on('recieveLoginStack', function(data, callback) { //init on client connect
        var lgSitem = {
            tokenId: data.tokenid,
            tokenData: data.tokendata,
            state: 'online'
        };
        var logInfo = aesHelper.decrypt(data.tokendata).split('##qb##');
        console.log('--------recieveLoginStack',data.tokenid, aesHelper.decrypt(logInfo[0]), aesHelper.decrypt(logInfo[1]));
        mongoHelper.insertLoginStack(lgSitem, (err, result) => {
            if (callback)
                callback(err, result);
        });
       // console.log('login---:', Object.keys(stackBONEVOLogedUser), Object.keys(stackBONEVOLogedUser).length, ' is online');
    });

    socket.on('removeStackWhenLogout', function(data, callback) { //logout update offline
        var lgSitem = {
            tokenId: data.tokenid,
            state: 'offline'
        };
        mongoHelper.updateOneFieldDB('loginStack', lgSitem, (err, result) => {
            if (callback)
                callback(err, result);
        });
       // console.log('logout---:', Object.keys(stackBONEVOLogedUser), Object.keys(stackBONEVOLogedUser).length, ' is online');
    });

    socket.on('checkExistLoginStack', function(data, callback) {
        console.log('----------checkExistLoginStack', data);
        mongoHelper.findLoginByTokenId('', callback);
    });

};