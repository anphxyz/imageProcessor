var AWS, CONST,
    regionList = { DE: 'eu-central-1', AS: 'ap-southeast-1', EU: 'eu-west-1', NA: 'sa-east-1', US: 'us-west-1' },
    bucketList = {
        AS: 'as-oohhay',
        AU: 'au-oohhay',
        DE: 'de-oohhay',
        EU: 'eu-oohhay',
        NA: 'na-oohhay',
        US: 'us-oohhay'
    },
    cloudfrontLst = {
        'as-oohhay': 'd2g7dc0hcuz3eo.cloudfront.net',
        'au-oohhay': 'd2p729ugpxtyfh.cloudfront.net',
        'de-oohhay': 'dwb8bma0pr0to.cloudfront.net',
        'eu-oohhay': 'd3da30y70ds7j5.cloudfront.net',
        'na-oohhay': 'd6c4vop3h18s9.cloudfront.net',
        'us-oohhay': 'd3376tpt4fcj7g.cloudfront.net'
    },
    bucketName;




////////////////////testing//////////////////////
//    s3manager.init(CONST);
// s3manager.upload('196c68b8cb22fda4a86abff30d864789.jpg', 666, function(url){
//  console.log(url);
// });
////////////////////testing//////////////////////
exports.init = function (cnst, region) {
    try {
        CONST = cnst;
        AWS = require('aws-sdk');
        AWS.config.update({
            accessKeyId: CONST.AWS_KEY,
            secretAccessKey: CONST.AWS_KEY_SECRECT,
            region: regionList[region],
            s3_signature_version: 'v4'
        });

        bucketName = bucketList[region] || bucketList['AS'];
        inited = true;
    } catch (e) {
        console.log('ERR: S3init', e);
    }
}

exports.listAll = function () {
    var s3 = new AWS.S3();
    s3.listBuckets(function (err, data) {
        if (err) {
            console.log("Error:", err);
        } else {
            for (var index in data.Buckets) {
                var bucket = data.Buckets[index];
                console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
            }
        }
    });
}
//pathName:link to local folder
// folder: folder at S3,
//callback(data['Location']);
exports.upload = function (pathName, folder, callback) {
    try {
        var linkImg = './public/tempUpload/' + pathName;
        // compressUsingGM(linkImg, function() {
        compressImg(linkImg, function () {
            var fs = require('fs'),
                zlib = require('zlib'),
                fileBuffer = fs.readFileSync(linkImg),
                mimetype = getContentTypeByFile(linkImg),
                s3obj = new AWS.S3({
                    params: {
                        Bucket: bucketName,
                        Key: folder + '/' + pathName,
                        ACL: 'public-read',
                        ContentType: mimetype
                    }
                });
            s3obj.upload({
                Body: fileBuffer
            }).on('httpUploadProgress', function (evt) {
                //console.log('__upload done', evt);
            }).send(function (err, data) {
                if (err) throw err;
                var urlObj = url.parse(data.Location, true);
                callback({
                    s3Url: data.Location.replace(urlObj.hostname, cloudfrontLst[bucketName]),
                    s3RealUrl: data.Location,
                    pathName: pathName,
                    folder: folder
                });
            });
        });
    } catch (e) {
        console.log('ERR: S3 upload: ', e)
    }
}

exports.uploadBuffer = function (input, callback) {
    try {
        var s3obj = new AWS.S3({
            params: {
                Bucket: bucketName,
                Key: input.pathName,
                ACL: 'public-read',
                ContentType: input.mimetype
            }
        });
        s3obj.upload({ Body: input.fileBuffer }).on('httpUploadProgress', function (evt) {
        }).send(function (err, data) {
            if (err) throw err;
            var urlObj = url.parse(data.Location, true);
            callback({
                clfUrl: data.Location.replace(urlObj.hostname, cloudfrontLst[bucketName]),
                s3Url: data.Location
            });
        });
    } catch (e) {
        console.log('ERR: S3 upload: ', e)
    }
}

function getContentTypeByFile(fileName) {
    var rc = 'application/octet-stream',
        fn = fileName.toLowerCase();

    if (fn.indexOf('.html') >= 0) rc = 'text/html';
    else if (fn.indexOf('.css') >= 0) rc = 'text/css';
    else if (fn.indexOf('.json') >= 0) rc = 'application/json';
    else if (fn.indexOf('.js') >= 0) rc = 'application/x-javascript';
    else if (fn.indexOf('.png') >= 0) rc = 'image/png';
    else if (fn.indexOf('.jpg') >= 0) rc = 'image/jpg';

    return rc;
}

var compressUsingGM = function (src, callback) {
    var gm = require('gm').subClass({ imageMagick: true }),
        type = '';

    switch (path.extname(src).toLowerCase()) {
        case '.jpg':
            type = 'JPEG';
            break;
        case '.png':
            type = 'Lossless';
            break;
        case '.gif':
            break;
        case '.svg':
            break;
        default:
            break
    }
    console.log('------------pre-compress:-> ', getFilesizeInBytes(src));
    gm(src).quality(70).compress(type)
        .write(src, function (err) {
            if (err) throw err;
            console.log('---------------compressUsingGM done', src, getFilesizeInBytes(src));
            callback();
        });

}

var compressImg = function (src, callback) {
    var Imagemin = require('imagemin'),
        useFunc = '';
    switch (path.extname(src)) {
        case '.jpg':
            useFunc = Imagemin.jpegtran({
                progressive: true
            });
            break;
        case '.png':
            useFunc = Imagemin.optipng({
                optimizationLevel: 3
            });
            break;
        case '.gif':
            useFunc = Imagemin.gifsicle({
                interlaced: true
            });
            break;
        case '.svg':
            useFunc = Imagemin.svgo();
            break;
        default:
            useFunc = Imagemin.jpegtran({
                progressive: true
            });
            break;
    }
    console.log('------------pre-compress:-> ', getFilesizeInBytes(src));
    new Imagemin()
        .src(src)
        .use(useFunc)
        .run(function (err, files) {
            if (err) throw err;
            fs.writeFile(src, files[0].contents, function (err) {
                if (err) throw err;
                console.log('---------------compress done', src, getFilesizeInBytes(src));
                callback(src);
            });
        });
}
var getFilesizeInBytes = function (filename) {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}