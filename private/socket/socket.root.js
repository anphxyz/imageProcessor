module.exports = exports = function(server) {
    var onLoged, onNotLog;

    io = require('socket.io').listen(server);
    io.sockets.on('connection', onConnection);

    function onConnection(socket) {
        var params = socket.handshake.query;
        if (params.stateLog === 'loged') {
            onLoged = require('./socket.img.js')
            onLoged(socket);
        } else if (params.stateLog === 'notlog') {
            onNotLog = require('./socket.log.js')
            onNotLog(socket);
        }

    };
}