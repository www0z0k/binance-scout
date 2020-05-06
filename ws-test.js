var toShow = {
	pair: 'BTCUSDT', 
	price: 0, 
	candles: [], 
	balances: {},
	orders : {sell: [], buy: []},
	ordersOld : [],
	walls: {sell: [], buy:[]}};
var currencies = ['USDT', 'BTC'];

var depthLim = 200;

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
				}
			}
		}catch(er){
			console.log('simple msg', message);
		}
	})
})

Number.prototype.toFixed = function(len){
	var parts = this.toString().split('.');
	return parts.length == 1 ? parts[0] : (parts[0] + '.' + parts[1].slice(0, len));
}

var binance;
const start = (key, secret) => {
	binance = new require('node-binance-api')({
	      APIKEY: key || '',
	      APISECRET: secret || ''
	    });
	if(key && secret){
		setInterval(() => {
			if(binance){
				getBalance();
				// getOrders();
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
			el.time = Number(k);
			el.bull = el.open < el.close;
			toShow.candles.push(el);
		}
		socket && socket.send(`${JSON.stringify(toShow)}`);
	});
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
1588760934540 1588760934652 1588760934650
1588760934541 1588760934652 1588760934650
1588760934576 1588760934677 1588760934677
1588760934589 1588760934711 1588760934709
1588760934611 1588760934731 1588760934730
1588760934633 1588760934754 1588760934753
1588760934656 1588760934754 1588760934753
1588760934681 1588760934779 1588760934778
1588760934682 1588760934786 1588760934785
1588760934682 1588760934800 1588760934799
1588760934690 1588760934800 1588760934799
1588760934691 1588760934805 1588760934803
1588760934711 1588760934828 1588760934828
1588760934737 1588760934858 1588760934857
1588760934739 1588760934858 1588760934857
1588760934739 1588760934860 1588760934859
1588760934759 1588760934879 1588760934877
1588760934782 1588760934902 1588760934901

console.log(Date.now(), trade.E, trade.T);
*/
/*
	binance.websockets.trades([toShow.pair], (trade) => {
		console.log(Date.now(), trade.E, trade.T);
	});
*/
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
		for (var i = 0; i < openOrders.length; i++) {
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
		for (var i = 0; i < orders.length; i++) {
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