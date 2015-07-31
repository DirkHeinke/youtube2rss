var express = require("express");
var mongoose = require("mongoose");
var moment = require("moment");
var app = express();
var feedGen = require("./feedGen.js");
var youtube = require("./youtube.js");

var Schema = mongoose.Schema;

// detect link
if(process.env.MONGO_PORT) {
    mongoose.connect('mongodb://mongo/ytrss');
} else {
    mongoose.connect('mongodb://localhost/ytrss');
}

var db = mongoose.connection;

db.on('error', function (err) {
    console.log('Can not access DB.', err);
    process.exit(1);
});

db.once('open', function () {
    console.log('Connected to mongo');
});

var feedSchema = new Schema({
    id: { type: String, unique: true},
    title: String,
    image: String,
    updated: { type: Date, default: Date.now },
    feed: { }
});

var Feed = mongoose.model('Feed', feedSchema);

app.get('/', function(req, res) {
    res.send('To get an RSS feed to an YouTube Playlist, call http://' +
            req.headers.host +
            '/feed/PLAYLISTID <br><br> GitHub: https://github.com/DirkHeinke/youtube2rss'
    );
});

app.put('/feed/:id', function (req, res) {
    var id = req.params.id;

    collectFeed(id, function (err) {
        console.log(err);
        // only log, no user notification ;)
    });

    res.send('OK');
});

app.get('/feed/:id', function (req, res) {
    var id = req.params.id;
    console.log('Request for', id);

    sendFeed(id, res);
});


function sendFeed(id, res) {
    Feed.find({id: id}, function (err, feeds) {
        if(err) {
            res.status(404).end();
        } else {
            if(feeds.length == 1) {
                console.log('Cached', id);
                res.header("Content-Type", "text/xml");
                res.send(feeds[0].feed);
            } else {
                console.log('New feed', id);
                collectFeed(id, function (err) {
                    if(!err) {
                        sendFeed(id, res);
                    } else {
                        res.status(404).end();
                    }
                });
            }
        }
    });
}

function collectFeed(id, cb) {
    youtube.getFeedMeta(id, function (err, data) {
        if(err) {
            cb(err)
        } else {
            var items;

            for (var i = 0; i < data.items.length; i++) {
                if (data.items[i].id == id) {
                    items = data.items[i];
                    break;
                }
            }

            var channelTitle = items.snippet.channelTitle;
            var title = items.snippet.localized.title;
            var image = items.snippet.thumbnails.high.url;

            youtube.getFeedItems(id, function (err, data) {
                if(err) {
                    cb(err)
                } else {
                    var feed = feedGen.genFeed(
                        id,
                        channelTitle + ": " + title,
                        'Feed of the YouTube Playlist: ' + title,
                        'feedUrl',
                        'https://www.youtube.com/playlist?list=' + id,
                        image,
                        Date.now(),
                        60 * 30,
                        data.items);

                    var f = {
                        id: id,
                        title: channelTitle,
                        image: image,
                        feed: feed,
                        updated: Date.now()
                    };

                    Feed.findOneAndUpdate(
                        {'id': id},
                        f,
                        {upsert: true},
                        function (err) {
                            if (err) {
                                console.log("Error while saving to DB", err);
                            }
                            cb();
                        }
                    );
                }
            });
        }
    });
}

app.get('/update', function (req, res) {
    console.log('Updating manual');
    res.send('Okay');
    updateFeeds()
});



function updateFeeds() {
    var past = moment().subtract(1, 'h');

    Feed.find({
        updated: {
            $lt: past
        }
    }, function (err, feeds) {
        for(var i=0; i < feeds.length; i++) {
            collectFeed(feeds[i].id, function (err) {
                if(err) {
                    console.log(err);
                }
            });
        }
    })
}

setInterval(function () {
    updateFeeds();
}, 60000);

var server = app.listen(8080, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});