var toShow = {pair: 'BTCUSDT', price: 0, candles: [], walls: {sell: [], buy:[]}};

const binance = new require('node-binance-api')(/*{
      APIKEY: '<key>',
      APISECRET: '<secret>'
    }*/);

binance.websockets.depth([toShow.pair], (depth) => {
	// let {e:eventType, E:eventTime, s:symbol, u:updateId, b:bidDepth, a:askDepth} = depth;
	let firstBid, firstAsk;

    let sumSell = 0;
    toShow.walls.sell = [];
    for(let i = 0; i < depth.a.length; i++){
    	let price = Number(depth.a[i][0]);
        firstAsk = firstAsk || price;
        let res = {price: Number(price), sum: sumSell + Number(depth.a[i][1])};
        toShow.walls.sell.push(res);
        sumSell += Number(depth.a[i][1]);
    }

    let sumBuy = 0;
    toShow.walls.buy = [];
    for(let i = 0; i < depth.b.length; i++){
    	let price = Number(depth.b[i][0]);
        firstBid = firstBid || price;
        let res = {price: Number(price), sum: sumBuy + Number(depth.b[i][1])};
        toShow.walls.buy.push(res);
        sumBuy += Number(depth.b[i][1]);
    }
    toShow.price = (Number(firstAsk) + Number(firstBid)) / 2;
	socket && socket.send(`${JSON.stringify(toShow)}`)
});

binance.websockets.chart(toShow.pair, "1m", (symbol, interval, chart) => {
	toShow.candles = [];
	for(var k in chart){
		let el = {};
		el.open = Number(chart[k].open);
		el.high = Number(chart[k].high);
		el.low = Number(chart[k].low);
		el.close = Number(chart[k].close);
		el.volume = Number(chart[k].volume);
		el.bull = el.open < el.close;
		toShow.candles.push(el);
	}
	socket && socket.send(`${JSON.stringify(toShow)}`)
});

const express = require('express');
const app = express();
// const ws = require('./ws')
app.get('/', function (req, res) {
   res.sendfile(__dirname + '/html/test.html');
});
app.listen(3002, function () {
   console.log('up and running on 3002!')
})

var WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({port: 3003})

var socket;

wss.on('connection', function (ws) {
	socket = ws;
	socket.on('message', function (message) {
		console.log('received: %s', message)
	})
})
