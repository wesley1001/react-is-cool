describe("MongoDB", function() {
    it("is there a server running", function(next) {

        var mongoose = require('mongoose');

        mongoose.connect('mongodb://127.0.0.1:27017/reactiscool')

        var db = mongoose.connection;

        db.on('error', function(err) {
            expect("open").toBe(err);
            next();
        });

        db.once('open', function (callback) {
            expect(true).toBe(true);
            next()
        });
    });
});