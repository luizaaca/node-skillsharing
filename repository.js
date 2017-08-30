var mongoClient = require("mongodb").MongoClient;

var Repo = module.exports = function (mongoUri) {
    this.context = function (data, callback) {
        mongoClient.connect(mongoUri, function (err, db) {
            if (err) throw err;
            db.collection(data.collection, callback);
        });
    };
};

Repo.prototype.insert = function (data) {
    this.context(data, function (err, collection) {
        if (err) throw err;
        collection.insert(data.body);
    });
};

Repo.prototype.update = function (data) {
    this.context(data, function (err, collection) {
        if (err) throw err;
        collection.updateOne({ title: data.body.title }, { $set: { comments: data.body.comments } });
    });
};

Repo.prototype.get = function (data, callback) {
    this.context(data, function (err, collection) {
        if (err) throw err;
        if (data.body)
            collection.find({ title: data.body.title }).toArray(function (err, items) {
                if (err) throw err;

                callback(items);
            });

        collection.find({}).toArray(function (err, items) {
            if (err) throw err;

            callback(items);
        });
    });
};