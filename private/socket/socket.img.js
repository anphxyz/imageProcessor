module.exports = exports = function(socket) {
    var request = require('request');


    socket.on('uInfo', function(data) { //init on client connect
        data.region = typeof data.region != 'undefined' ? aesHelper.decrypt(data.region) : data.regionR;
        data.fo100 = aesHelper.decrypt(data.fo100);
        data.localFolder = './public/tempUpload/';
        socket.join(data.rId);
        socket.uInfo = data;
        console.log(socket.uInfo.rId, 'joined-------------------------------------------------');
    });

    socket.on('makeThumbnailSlider', function(data) {
        try {
            request({
                url: data.url,
                encoding: null
            }, function(error, response, body) {
                if (error) throw error;
                if (!error && response.statusCode == 200) {
                    var lwip = require('lwip'),
                        obj = {
                            lwip: lwip,
                            body: body,
                            fileType: path.extname(data.url).length > 0 ? path.extname(data.url) : '.jpg',
                            data: data,
                            socket: socket
                        };
                    lwipOpenSlider(obj);
                }
            });
        } catch (e) {
            console.log('ERR: cropImgAndSaveImageToS3', e);
        }

    });

    socket.on('cropImgAndSaveImageToS3', function(data) {
        try {
            request({
                url: data.url,
                encoding: null
            }, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var lwip = require('lwip'),
                        fileType = path.extname(data.url).length > 0 ? path.extname(data.url) : '.jpg';

                    var obj = {
                        lwip: lwip,
                        body: body,
                        fileType: fileType,
                        data: data,
                        socket: socket
                    };
                    lwipOpen(obj);
                }
            });
        } catch (e) {
            console.log('ERR: cropImgAndSaveImageToS3', e);
        }
    });
    socket.on('getBase64FromUrl', function(data) {
        try {
            // console.log('____getBase64FromUrl');
            var fileType = path.extname(data.url),
                fileName = getFileNameFromUrl(data.url);
            request({
                url: data.url,
                encoding: null
            }, function(error, response, body) {
                if (err) throw err;
                if (!error && response.statusCode == 200) {
                    socket.emit('responseBase64', {
                        base64: 'data:image/' + fileType + ";base64," + body.toString('base64'),
                        id: data.id
                    });
                }
            });
        } catch (e) {
            console.log('ERR: getBase64FromUrl', e);
        }
    });
    socket.on('disconnect', function() {
        console.log('-------------------------------------------------------disconnected!');
    });


    function download(request, uri, filename, callback) {
        request.head(uri, function(err, res, body) {
            // console.log('content-type:', res.headers['content-type']);
            // console.log('content-length:', res.headers['content-length']);
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    };

    function getFileNameFromUrl(url) {
        var arr = url.split('\/');
        return arr.length > 0 ? arr[arr.length - 1] : 'newFile';
    }

    function lwipOpenSlider(obj) {
        if (obj['fileType'].indexOf('?') > -1) { //fix param facebook
            obj['fileType'] = obj['fileType'].split('?')[0];
        }
        obj['lwip'].open(obj['body'], obj['fileType'].substring(1), function(err, image) {
            if (err != null) { //bi lỗi jpg decode
                if (obj['fileType'] == '.jpg') {
                    obj['fileType'] = '.png';
                    lwipOpenSlider(obj);
                } else if (obj['fileType'] == '.png') {
                    obj['fileType'] = '.jpg';
                    lwipOpenSlider(obj);
                } else throw err;
            } else {
                var data = obj['data'],
                    d = new Date(),
                    n = d.getTime(),
                    fileName = getFileNameFromUrl(data.url) + n,
                    pathName = 'thum-' + crypto.createHash('md5').update(fileName).digest("hex") + obj['fileType'],
                    fo100 = aesHelper.decrypt(data.fo100),
                    folder = (fo100 || 0) + ((typeof data.siteid != 'undefined' && data.siteid > 0) ? '/' + data.siteid : ''),
                    //
                    naW = image.width(),
                    naH = image.height(),
                    percent = naW > naH ? 120 / naH : 120 / naW;
                image.batch()
                    .scale(percent)
                    .crop(120, 120)
                    .writeFile('./public/tempUpload/' + pathName, function(err) {
                        if (err) throw err;
                        var region = aesHelper.decrypt(data.region);
                        s3manager.init(CONST, region);
                        s3manager.upload(pathName, folder, function(res) {

                            obj['socket'].emit('reponseMakeThumbnailSlider', {
                                thumbUrl: res.s3Url,
                                id: data.id
                            });
                        });
                    });
            }
        });
    }


    function lwipOpen(obj) {
        if (obj['fileType'].indexOf('?') > -1) { //fix param facebook
            obj['fileType'] = obj['fileType'].split('?')[0];
        }
        obj['lwip'].open(obj['body'], obj['fileType'].substring(1), function(err, image) {
            if (err != null) { //bi lỗi jpg decode
                if (obj['fileType'] == '.jpg') {
                    obj['fileType'] = '.png';
                    lwipOpen(obj);
                } else if (obj['fileType'] == '.png') {
                    obj['fileType'] = '.jpg';
                    lwipOpen(obj);
                } else throw err;
            } else {
                var data = obj['data'],
                    d = new Date(),
                    n = d.getTime(),
                    fileName = getFileNameFromUrl(data.url) + n,
                    pathName = crypto.createHash('md5').update(fileName).digest("hex") + obj['fileType'],
                    fo100 = aesHelper.decrypt(data.fo100),
                    folder = (fo100 || 0) + ((typeof data.siteid != 'undefined' && data.siteid > 0) ? '/' + data.siteid : '');

                image.batch()
                    .rotate(parseInt(data.deg || 0))
                    .scale(data.percent || 1)
                    .crop(data.left, data.top, data.right, data.bot)
                    .writeFile('./public/tempUpload/' + pathName, function(err) {

                        if (err) throw err;
                        var region = aesHelper.decrypt(data.region);
                        s3manager.init(CONST, region);
                        s3manager.upload(pathName, folder, function(res) {

                            obj['socket'].emit('reponseS3UploadImage', {
                                type: data.type,
                                s3Url: res.s3Url,
                                id: data.id
                            });
                        });
                    });
            }
        });
    }
};