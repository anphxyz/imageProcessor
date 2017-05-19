module.exports = exports = {
    getConnection: function(callback) {
        var mongodb = require('mongodb'),
            mongoClient = mongodb.MongoClient,
            url = 'mongodb://crosslogin:qb12345@dev.mongo.bonevo.net:27017/crosslogin';
        // Use connect method to connect to the Server
        mongoClient.connect(url, (err, db) => {
            if (err) {
                console.log('Unable to connect to the mongoDB server. Error:', err);
                callback(err);
            } else {
                callback(null, db);
                db.close();
            }
        });
    },

    // insert login stack
    insertLoginStack: function(data, callback) {
        this.findLoginByTokenId(data.tokenId, (err, rs) => {
            if (err != null)
                console.log('insertLoginStack-ERR', err);
            else { //đã có trong db -> update || không cần làm gì
                console.log('-------1-------insertLoginStack', rs != null ? 'update' : 'insert');
                if (rs != null) { // có thì ktra rồi update
                    console.log('-------2-------insertLoginStack', rs.tokenData != data.tokenData || rs.state != data.state ? 'has change' : 'no change');
                    if (rs.tokenData != data.tokenData || rs.state != data.state) {
                        this.updateOneFieldDB('loginStack', data, (err, result) => {
                            if (callback)
                                callback(err, result);
                        });
                    }
                } else { //chua co thi them vao thoi
                    this.insertDB('loginStack', data, (err, result) => {
                        if (callback)
                            callback(err, result);
                    });
                }
            }
        });
    },
    //find by token id
    findLoginByTokenId: function(tokenId, callback, requireOnline) {
        requireOnline = requireOnline || false;
        var condition = {
            "tokenId": tokenId
        };
        if (requireOnline) //chi tim online
            condition.state = "online";

        console.log('findLoginByTokenId----------------condition: ', condition);
        this.getConnection((err, db) => {
            if (err) throw err;
            var cursor = db.collection('loginStack').find({
                    "tokenId": tokenId
                }),
                stackObj;

            cursor.each(function(err, doc) {
                stackObj = doc;
                callback(err, stackObj);
                return false;

            });
        });
    },
    //insert to db with colection name
    insertDB: function(collectionName, data, callback) {
        console.log('----------------------insertDB', data);
        this.getConnection((err, db) => {
            if (err) throw err;
            db.collection(collectionName).insertOne(data, (err, result) => {
                callback(err, result);
            });
        });
    },
    //insert to db with colection name, key where
    updateOneFieldDB: function(collectionName, data, callback) {
        console.log('------------------------updateOneFieldDB', data);
        this.getConnection((err, db) => {
            if (err) throw err;
            var keyArr = Object.keys(data),
                jsonWhere = {},
                jsonSet = {};
            //đầu tiên là điều kiện where
            jsonWhere[keyArr[0]] = data[keyArr[0]];
            //thứ 2 là value sets
            jsonSet[keyArr[1]] = data[keyArr[1]];

            db.collection(collectionName).updateOne(jsonWhere, {
                $set: jsonSet
            }, (err, result) => {
                callback(err, result);
            });
        });
    },
    //remove loginstack
    getLstLoginStackOnline: function(data) {
        this.getConnection((err, db) => {
            if (err) throw err;
            var cursor = db.collection('loginStack').find({
                    "state": "online"
                }),
                stackObj = [];

            cursor.each(function(err, doc) {
                if (err) throw err;
                if (doc != null) {
                    stackObj.push(doc);
                } else {
                    callback(err, stackObj);
                }
            });
        });
    }
}