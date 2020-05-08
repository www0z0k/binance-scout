var toShow = {
	type: 'main', 
	pair: 'BTCUSDT', 
	price: 0, 
	candles: [], 
	balances: {},
	orders : {sell: [], buy: []},
	ordersOld : [],
	walls: {sell: [], buy:[]}};
var currencies = ['USDT', 'BTC'];

var depthLim = 200;
var TF = '1m';

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

var sockets = [];
function send(msg){
	for (let i = 0; i < sockets.length; i++) {
		sockets[i].send(msg);
	}
}

wss.on('connection', function (ws) {
	sockets.push(ws);
	console.log('connected:', sockets.length);
	ws.on('message', function (message) {
		try{
			message = JSON.parse(message);
			if(message.action){
				switch(message.action){
					case 'login':
						start(message.key, message.secret);
					break;
					case 'cancelOrder':
						cancelOrder(message.id);
					break;
					case 'sell':
						console.log(message);
						binance.sell(toShow.pair, message.amount, message.price);
					break;
					case 'buy':
						console.log(message);
						binance.buy(toShow.pair, message.amount, message.price);
					case 'depths-limits':
						depthLim = message.value;
					break;
					case 'tf':
						TF = message.tf;
						restartChart();
						toShow.tf = TF;
					break;
									
				}
			}
		}catch(er){
			console.log('simple msg', message);
		}
	})

	ws.on('close', function (arg) {
		console.log('closed:', arg);
  		// let tmp = sockets.slice();
  		sockets = sockets.filter(el => el._closeCode != arg);
	})
})

Number.prototype.toFixed = function(len){
	var parts = this.toString().split('.');
	return parts.length == 1 ? parts[0] : (parts[0] + '.' + parts[1].slice(0, len));
}
var chartTFID = '';
var binance;

const restartChart = () => {
	binance.websockets.terminate(chartTFID);
	chartTFID = binance.websockets.chart(toShow.pair, TF, (symbol, interval, chart) => {
		toShow.candles = [];
		for(var k in chart){
			let el = {};
			el.open = Number(chart[k].open);
			el.high = Number(chart[k].high);
			el.low = Number(chart[k].low);
			el.close = Number(chart[k].close);
			el.volume = Number(chart[k].volume);
			el.time = Number(k);
			el.bull = el.open < el.close;
			toShow.candles.push(el);
		}
		toShow.tf = TF;
		send(`${JSON.stringify(toShow)}`);
	}, 1000);
	console.log('opened', chartTFID);
}

const start = (key, secret) => {
	binance = new require('node-binance-api')({
	      APIKEY: key || '',
	      APISECRET: secret || ''
	    });
	if(key && secret){
		setInterval(() => {
			if(binance){
				getBalance();
				getOrdersAll();
			}
		}, 2500)
	}

	binance.websockets.depthCache([toShow.pair], (s, depth) => {
		let firstBid, firstAsk;

		let bids = binance.sortBids(depth.bids, depthLim);
		let asks = binance.sortAsks(depth.asks, depthLim);
	
	    let sumSell = 0;
	    toShow.walls.sell = [];
	    for(let k in asks){
	    	let price = Number(k);
	        firstAsk = firstAsk || price;
	        let res = {price: price, sum: sumSell + Number(asks[k])};
	        toShow.walls.sell.push(res);
	        sumSell += Number(asks[k]);
	    }

	    let sumBuy = 0;
	    toShow.walls.buy = [];
	    for(let k in bids){
	    	let price = Number(k);
	        firstBid = firstBid || price;
	        let res = {price: price, sum: sumBuy + Number(bids[k])};
	        toShow.walls.buy.push(res);
	        sumBuy += Number(bids[k]);
	    }
	    toShow.price = (Number(firstAsk) + Number(firstBid)) / 2;
		send(`${JSON.stringify(toShow)}`)
	});

	restartChart();
/*
  "e": "trade",     // Event type
  "E": 123456789,   // Event time
  "s": "BNBBTC",    // Symbol
  "t": 12345,       // Trade ID
  "p": "0.001",     // Price
  "q": "100",       // Quantity
  "b": 88,          // Buyer order ID
  "a": 50,          // Seller order ID
  "T": 123456785,   // Trade time
  "m": true,        // Is the buyer the market maker?
  "M": true         // Ignore
*/

	binance.websockets.trades([toShow.pair], (trade) => {
		trade.type = 'trade';
		send(`${JSON.stringify(trade)}`);
	});
}



const getBalance = () => {
	binance && binance.balance((error, balances) => {
	  if ( error ) return console.error(error);
	  toShow.balances = {};
	  for(let c in balances){
	  	if(currencies.indexOf(c) > -1){
	  		toShow.balances[c] = {};
	  		toShow.balances[c].avail = Number(balances[c].available);
	  		toShow.balances[c].ordered = Number(balances[c].onOrder);
	  	}
	  }
	});
}
const cancelOrder = (id) => {
	binance.cancel(toShow.pair, id, (error, response, symbol) => {
		console.info(symbol+" cancel response:", response);
	});
}
const getOrders = () => {
	binance.openOrders(toShow.pair, (error, openOrders, symbol) => {
	  	toShow.orders = {sell: [], buy: []};
		for (let i = 0; i < openOrders.length; i++) {
			openOrders[i].price = Number(openOrders[i].price);
			openOrders[i].origQty = Number(openOrders[i].origQty);
			if(openOrders[i].side == 'SELL'){
				toShow.orders.sell.push(openOrders[i]);
			}else{
				toShow.orders.buy.push(openOrders[i]);
			}
		}
	});
}

const getOrdersAll = () => {
	binance.allOrders(toShow.pair, (error, orders, symbol) => {
	  	toShow.orders = {sell: [], buy: []};
	  	toShow.ordersOld = [];
		for (let i = 0; i < orders.length; i++) {
	  		let order = orders[i];
	  		order.price = Number(order.price);
	  		order.origQty = Number(order.origQty);
	  		order.cummulativeQuoteQty = Number(order.cummulativeQuoteQty);
	  		if(order.status == 'CANCELED'){
	  			//do nothing
	  		}else if(order.status == 'FILLED'){
	  			toShow.ordersOld.push(order);
	  		}else if(order.status == 'NEW'){
	  			if(order.side == 'SELL'){
					toShow.orders.sell.push(order);
				}else{
					toShow.orders.buy.push(order);
				}
	  		}
	  	}
	});
}
/*
  {
    symbol: 'BTCUSDT',
    orderId: 1600294962,
    orderListId: -1,
    clientOrderId: 'vwg8A4Z0kbOW17TuS7Fupa',
    price: '6234.01000000',
    origQty: '0.00183100',
    executedQty: '0.00183100',
    cummulativeQuoteQty: '11.41447231',
    status: 'FILLED',
    timeInForce: 'GTC',
    type: 'LIMIT',
    side: 'SELL',
    stopPrice: '0.00000000',
    icebergQty: '0.00000000',
    time: 1584965934778,
    updateTime: 1584965940406,
    isWorking: true,
    origQuoteOrderQty: '0.00000000'
  },
*/