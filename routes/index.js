const express = require('express');
const cheerio = require('cheerio')
const router = express.Router();
const fs = require('fs')
const superagent = require('superagent')
const eventproxy = require('eventproxy')
const url = require('url')
const cnodeUrl = 'https:/cnodejs.org'
/* GET home page. */
router.get('/', function (req, res, next) {
    const cetUrl = 'http://cet4-6.xdf.cn/201705/10659048.html';

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
                menuUrls.push(href);
            });
            console.log(menuUrls)
            let ep = new eventproxy();

            ep.after('article_html', menuUrls.length, function (topics) {
                topics = topics.map(function (topicPair) {
                    let topicHtml = topicPair[1];
                    let $ = cheerio.load(topicHtml);
                    return ({
                        articleText: $('.air_con').text()
                    });
                });

                console.log('final:');
                console.log(topics);

            });
            menuUrls.forEach(function (menuUrl) {
                superagent.get(menuUrl)
                    .end(function (err, res) {
                        console.log('fetch ' + menuUrl + ' successful');
                        ep.emit('article_html', [menuUrl, res.text]);
                    });
            });
        });
})

module.exports = router;
