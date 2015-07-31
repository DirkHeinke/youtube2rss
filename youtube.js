var google = require('googleapis');
var youtube = google.youtube('v3');

var youtubeKey = process.env.YT_KEY;
if(!youtubeKey) {
    console.log('No YouTube API Key. Set env YT_KEY');
    process.exit(1);
}

exports.getFeedMeta = function (playlistId, cb) {
    youtube.playlists.list({
        "auth": youtubeKey,
        "part": "snippet",
        "id": playlistId
    }, function (err, data) {
        if (!err && data.items.length == 0) {
            err = new Error('Nothing found');   // Fake error ;)
        }
        cb(err, data);
    });
};

exports.getFeedItems = function (playlistId, cb) {
    youtube.playlistItems.list({
        "auth": youtubeKey,
        "part": "snippet",
        "playlistId": playlistId
    }, function (err, data) {
        if (!err && data.items.length == 0) {
            err = new Error('Nothing found');   // Fake error ;)
        }
        cb(err, data);
    });
};