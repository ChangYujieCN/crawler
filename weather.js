const eventproxy = require('eventproxy');
const superagent = require('superagent')
require('superagent-charset')(superagent)
const cheerio = require('cheerio');
const url = require('url');
const path = require('path')
const weatherUrl = 'http://www.tianqihoubao.com/lishi/nanjing/month/';
const fs = require('fs')
const moment = require('moment')
const Flat1 = (arr) => {
    return [].concat.apply([], arr);
}
let weatherUrls = []


for (let i = 2015; i < 2018; i++) {
    for (let j = 1; j < 13; j++) {
        if (i > 2015) {
            if (j < 10) {
                j = '0' + j
            }
            weatherUrls.push(weatherUrl + i + j + '.html')
        }
        else if (i === 2015 && j > 9) {
            weatherUrls.push(weatherUrl + i + j + '.html')
        }
    }
}
let ep = new eventproxy();
ep.after('article_html', weatherUrls.length, function (topics) {
    topics = topics.map(function (topicPair) {
        let topicHtml = topicPair[1];
        let txtUrl = topicPair[0]
        let $ = cheerio.load(topicHtml, {decodeEntities: false});
        let infos = $('table tr')
        infos = infos.slice(1)
        let monthInfo = []
        infos.each(function (index, element) {
            let date, weather, temperature, wind
            date = $(element).children().eq(0).text().trim()
            weather = $(element).children().eq(1).text().trim()
            temperature = $(element).children().eq(2).text().trim()
            wind = $(element).children().eq(3).text().trim()
            monthInfo.push({date, weather, temperature, wind})
        })
        return (monthInfo);
    });

    topics = Flat1(topics)
    topics.forEach(v => {
        v.date = moment(v.date, "YYYY年MM月DD日").format()
    })
    topics.sort(function (a, b) {
        return Date.parse(a.date) - Date.parse(b.date)
    })
    fs.writeFile(path.resolve(__dirname, 'weather.json'), JSON.stringify(topics), function (err) {
        if (err) {
            throw err
        }
        console.log('成功')
    })
});

weatherUrls.forEach(function (menuUrl) {
    superagent.get(menuUrl)
        .charset('gb2312')
        .end(function (err, res) {
            console.log('fetch ' + menuUrl + ' successful');
            ep.emit('article_html', [menuUrl, res.text]);
        });
});