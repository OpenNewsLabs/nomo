var http      = require('http');
var request   = require('request');
var simplexml = require('xml-simple');
var publicApi = [];

function scrape(title, url){
  var amoUrl = 'http://d:1337/?q=' + url
  request(amoUrl, function (err, res, body){
    if(body !== undefined){
      var obj = JSON.parse(body);
      obj.title = title;
      obj.url = url;
      console.log(obj);
      publicApi.push(obj);
    }
  });
}

function delquote(str){
  return (str=str.replace(/["']{1}/gi,""));
}

function getStory(url){

  var options = {
    host: 'xml.zeit.de',
    port: 80,
    path: url.split('http://xml.zeit.de')[1]
  }, body = "";

  var req = http.request(options, function(res) {
    res.setEncoding('binary');
    if(res.statusCode === 200){
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end', function () {
        simplexml.parse(body, function(e, p) {
          var newstr = p.body.title.replace("’", "");
          var noHyphenString = newstr.replace("–", "-");
          scrape(noHyphenString, url.replace("xml.", "www."));
        });
      });
    }
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  req.end();
}

function init(){
  publicApi = [];
  request('http://xml.zeit.de/index', function (err, res, body){
    if(!err && res.statusCode === 200){
      simplexml.parse(body, function(e, p) {
        var parsed = p.feed.reference;
        for( i = 0; i < parsed.length; i++ ){
          getStory(parsed[i]['@'].href);
        }
      });
    }
  })
}

function main(){
  setInterval(function(){
    init();
  }, 600000);
  init();
}

main();

http.createServer(function (req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/json;charset=ISO-8859-1',
    'Access-Control-Allow-Origin' : '*'
  });
  res.end(JSON.stringify(publicApi), 'binary');
}).listen(1338, '0.0.0.0');
