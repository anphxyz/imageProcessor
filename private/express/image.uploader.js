module.exports = exports = function (app) {
    var multer = require('multer'),
        replaceExt = require('replace-ext'),
        storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, './public/tempUpload/')
            },
            filename: function (req, file, cb) {
                crypto.pseudoRandomBytes(16, function (err, raw) {
                    cb(null, 'lib-' + raw.toString('hex') + Date.now() + path.extname(file.originalname));
                });
            }
        }),
        storageApps = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, './public/tempUpload/')
            },
            filename: function (req, file, cb) {
                if (file.originalname.indexOf('QBRANDOMNAME') > -1)
                    crypto.pseudoRandomBytes(16, function (err, raw) {
                        cb(null, 'qbrandom-' + raw.toString('hex') + Date.now() + path.extname(file.originalname));
                    });
                else cb(null, file.originalname);
            }
        }),
        storageMemory = multer.memoryStorage();

    app.post('/multerUploadApps', multer({ storage: storageMemory }).any(), function (req, res) {
        let uInfo = req.body;
        uInfo.region = uInfo.region ? aesHelper.decrypt(uInfo.region) : 'AS';
        let folder = uInfo.folder || uInfo.fo100,
            file = req.files[0],
            fileBuffer = file.buffer,
            xTypeData = fileType(fileBuffer),
            fileName = file.originalname;
        //init S3
        s3manager.init(CONST, uInfo.region);
        //use random name
        if (file.originalname.indexOf('QBRANDOMNAME') > -1)
            fileName = 'qbrandom-' + getRandomStr(32);
        else if (fileName.indexOf('.') > 0) {
            let fnArr = fileName.split('.');
            fnArr.length = fnArr.length - 1;
            fileName = fnArr.join('.');
        }
        s3manager.uploadBuffer({
            fileBuffer: fileBuffer,
            pathName: folder + '/' + fileName + '.' + xTypeData.ext,
            mimetype: xTypeData.mime
        }, result => {
            res.send({
                "status": "success",
                "elements": result
            });
        });
    });
    //new
    app.post('/multiUploadTargetSize', multer({ storage: storageMemory }).any(), function (req, res) {
        var uInfo = req.body,
            start = new Date(),
            tS = +uInfo.thumbSize,
            thumbSize = (tS && tS > 0) ? tS : 480,
            folder = uInfo.folder || uInfo.fo100,
            from = uInfo.from || 'mobile';
        uInfo.region = uInfo.region && uInfo.region.length > 0 ? aesHelper.decrypt(uInfo.region) : 'AS';

        s3manager.init(CONST, uInfo.region);

        async.concat(req.files, function (file, concatCallback) {
            let xTypeData = fileType(file.buffer),
                fileName = file.originalname;//default name
            if (file.originalname.indexOf('QBRANDOMNAME') > -1)
                fileName = 'qbrandom-' + getRandomStr(32);
            else if (fileName.indexOf('.') > 0) {//xac dinh duoi file
                let fnArr = fileName.split('.');
                fnArr.length = fnArr.length - 1;
                fileName = fnArr.join('.');
            }
            fileName = fileName !== 'avartaoohhay' ? fileName + '.' + xTypeData.ext : fileName;
            async.parallel([
                callback => {
                    if (from === 'web') resizeImageBuffer({
                        buffer: file.buffer,
                        targetWidth: 720,
                        pathName: folder + '/' + fileName,//toi path nay
                        xTypeData: xTypeData
                    }, function (rs) {
                        callback(null, rs);
                    });
                    else s3manager.uploadBuffer({
                        fileBuffer: file.buffer,
                        pathName: folder + '/' + fileName,
                        mimetype: xTypeData.mime
                    }, rs => {
                        callback(null, rs);
                    });
                },
                callback => {
                    resizeImageBuffer({
                        buffer: file.buffer,
                        targetWidth: thumbSize,
                        pathName: folder + '/' + 's' + thumbSize + '-' + fileName,//toi path nay
                        xTypeData: xTypeData
                    }, function (rs) {
                        callback(null, rs);
                    });
                }
            ], (err, rs) => {
                if (err) throw err;
                concatCallback(err, {
                    clfUrl: rs[0].clfUrl,//hinh to
                    clfThumbUrl: rs[1].clfUrl// hinh nho
                });
            }); //end parallel
        }, (err, result) => {
            if (err) throw err;
            console.log(result, 'response------------', new Date() - start);
            res.send({
                status: 'success',
                elements: result
            }); //end concat
            console.log('____multiUploadTargetSize_end', new Date() - start);
        });
    });

    function resizeImageBuffer(input, callback) {
        try {
            require('lwip').open(input.buffer, input.xTypeData.ext, function (err, image) {
                if (err) throw er;
                var naW = image.width(),
                    naH = image.height(),
                    newW = input.targetWidth,
                    newH = newW / naW * naH;

                image.batch()
                    .resize(newW, newH, 'lanczos')
                    .toBuffer(input.xTypeData.ext, (err, fileBuffer) => {
                        if (err) throw err;
                        s3manager.uploadBuffer({
                            fileBuffer: fileBuffer,//luu bufer nay
                            pathName: input.pathName,
                            mimetype: input.xTypeData.mime//day la mime cua buffer
                        }, rs => {
                            callback(rs);
                        });
                    });
            });
        } catch (error) {
            console.log('resizeImageWithTargetWidth:->', error);
        }
    }


    function getRandomStr(len) {
        len = len || 16;
        let $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            chars = $chars.split(''),
            str = "",
            size = chars.length;

        for (let i = 0; i < len; i++) {
            let lastNumber = Math.floor(Math.random() * size);
            str += chars[lastNumber];
        }
        return str + (+new Date());
    }

    ////POST/////
    app.post('/multerUpload', multer({ storage: storage }).any(), function (req, res) {
        var uInfo = req.body,
            folder,
            start = new Date();
        console.log(uInfo, '--------multerUpload------------------------');
        uInfo.fo100 = aesHelper.decrypt(uInfo.fo100);
        uInfo.region = uInfo.region = uInfo.region ? aesHelper.decrypt(uInfo.region) : 'AS';
        if (typeof uInfo.trial != 'undefined') {
            folder = uInfo.trial == 'off' ? uInfo.fo100 : uInfo.siteid;
        } else {
            folder = uInfo.fo100;
        }
        s3manager.init(CONST, uInfo.region);

        for (var i = 0; i < req.files.length; i++) {
            var file = req.files[i];
            s3manager.upload(file.filename, folder, function (res) {
                uInfo.targetSocket = uInfo.targetSocket || 'reponseS3UploadLibrary';
                var data = {
                    targetSocket: uInfo.targetSocket,
                    rId: uInfo.rId,
                    originalSrc: res.pathName,
                    filename: 'thumb-' + res.pathName,
                    folder: res.folder,
                    imgUrl: res.s3Url
                }
                makeThumbnail(data);
            });
        }
        res.status(200).end();
    });



    ////POST: single upload, no thumb/////
    app.post('/multerSingleUploadNoThumb', multer({
        storage: storage
    }).any(), function (req, res) {
        var uInfo = req.body;
        console.log('____multerSingleUploadNoThumb', uInfo);
        uInfo.fo100 = aesHelper.decrypt(uInfo.fo100);
        var folder = uInfo.fo100,
            file = req.files[0];

        s3manager.init(CONST, uInfo.region);
        s3manager.upload(file.filename, folder, function (res) {
            io.to(uInfo.rId).emit('reponseS3UploadTopic', {
                imgUrl: res.s3Url,
                id: uInfo.id

            });
        });
        res.status(200).end();
    });


    function makeThumbnail(data) {
        var defSize = {
            w: 180,
            h: 135
        }
        require('lwip').open('./public/tempUpload/' + data.originalSrc, function (err, image) {
            if (err) throw err;
            if (image != null) {
                var naW = image.width(),
                    naH = image.height(),
                    newW = naW < naH ? defSize.w : parseInt((naW / naH) * defSize.w),
                    newH = naH < naW ? defSize.h : parseInt((naH / naW) * defSize.h);

                image.batch()
                    .resize(newW, newH, 'lanczos')
                    .crop(defSize.w, defSize.h)
                    .writeFile('./public/tempUpload/' + data.filename, function (err) {
                        if (err) throw err;
                        s3manager.upload(data.filename, data.folder, function (res) {
                            io.to(data.rId).emit(data.targetSocket, {
                                imgUrl: data.imgUrl,
                                thumbUrl: res.s3Url
                            });
                        });
                    });
            }
        });
    }

}