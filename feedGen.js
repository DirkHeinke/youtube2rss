var RSS = require("rss");

exports.genFeed = function (id, title, description, feed_url, site_url, image_url, pubDate, ttl, items) {
    var feed = new RSS({
        title: title,
        description: description,
        feed_url: feed_url,
        site_url: site_url,
        image_url: image_url,
        pubDate: pubDate,
        ttl: ttl
    });
    
    // console.log()
    for(var i=0; i<items.length; i++) {
        var item = items[i];
        feed.item({
            title: item.snippet.title,
            description: item.snippet.description,
            url: 'https://www.youtube.com/watch?v=' + item.snippet.resourceId.videoId,
            date: item.snippet.publishedAt,
            enclosure: item.enclosure
        });
    }
    
    return feed.xml();
}