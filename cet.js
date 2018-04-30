const eventproxy = require('eventproxy');
const superagent = require('superagent');
const cheerio = require('cheerio');
const url = require('url');
const path = require('path')
const cetUrl = 'http://cet4-6.xdf.cn/201705/10659048.html';
const fs = require('fs')
superagent.get(cetUrl)
    .end(function (err, res) {
        if (err) {
            return console.error(err);
        }
        let menuUrls = [];
        let $ = cheerio.load(res.text);
        $('.air_con td a').each(function (index, element) {
            let $element = $(element)
            let href = $element.attr('href')
            let title = $element.text()
            menuUrls.push({href, title});
        });
        console.log(menuUrls)
        let ep = new eventproxy();

        ep.after('article_html', menuUrls.length, function (topics) {
            topics = topics.map(function (topicPair) {
                let topicHtml = topicPair[1];
                let txtTitle = topicPair[0]
                let $ = cheerio.load(topicHtml);
                return ({
                    txtTitle,
                    articleText: $('.air_con').text()
                });
            });

            console.log('final:');
            console.log(topics);
            fs.writeFile(path.resolve(__dirname, 'a.json'), JSON.stringify(topics), function (err) {
                if (err) {
                    throw err
                }
                console.log('成功')
            })
        });

        menuUrls.forEach(function (menuUrl) {
            superagent.get(menuUrl.href)
                .end(function (err, res) {
                    console.log('fetch ' + menuUrl.href + ' successful');
                    ep.emit('article_html', [menuUrl.title, res.text]);
                });
        });
    });
