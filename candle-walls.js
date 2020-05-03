////////////////////////////////
const fs = require('fs');
const path = require('path');
// const ma = require('moving-averages').ma;

class CandlesAndWalls{
  constructor(port, pair){
    // this.Binance = require('binance-api-node').default;
    // this.client = this.Binance();

    this.binance = new require('node-binance-api')(/*{
      APIKEY: '<key>',
      APISECRET: '<secret>'
    }*/);

    this.pair = pair || 'BTCUSDT';

    this.tickInterval = 4 * 1000;
    this.port = port || 3000;

    this._candle = '1m';
    this._candlesNum = 25;

    //Wall price limit? Max volume limit?
    // this._wallMaxDelta = 15;
    
    this.updateRate = this.updateRate.bind(this);
    setInterval(this.updateRate, this.tickInterval);

    //init srv here
    this.express = require('express');
    this.app = this.express();

    this.app.get('/', (req, res) => this.process(req, res));
    this.app.post('/', (req, res) => this.process(req, res));


    this.toShow = {pair: this.pair, price: 0, candles: [], walls: {sell: [], buy:[]}};
    
    this.updateRate();

    this.app.get('/download', (req, res) => {
      res.end(JSON.stringify(this.toShow));
    });

    this.app.get('/show', (req, res) => {

      let page = `<html>`;
      page += `<head>
                      <script src="https://cdn.plot.ly/plotly-1.2.0.min.js"></script>
                  </head>`;
      page += `<body>`;
      page += `<h5>${this.pair}</h5>`;
      page += `<canvas id="canv" width="1000" height="700" style="border:1px solid blue;"></canvas>`;
      page += `<script>
Array.prototype.last = function(){
  return this[this.length - 1];
}

var canvas = document.getElementById("canv");
var ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, 1000, 700);
var buys = ${JSON.stringify(this.toShow.walls.buy)};
var sells = ${JSON.stringify(this.toShow.walls.sell)};
var startPrice = ${this.toShow.price};


var dPriceBuy = buys[0].price - buys.last().price;
var dPriceSell = sells.last().price - sells[0].price;
var dPrice = Math.max(dPriceSell, dPriceBuy);

var dSum = Math.max(buys.last().sum, sells.last().sum);

var wallsCenterX = 250;
var wallPriceScale = 250 / dPrice;
var wallVolScale = 680 / dSum;

//Delimiter
ctx.beginPath();
ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
ctx.moveTo(500, 0);
ctx.lineTo(500, 700);
ctx.stroke();
ctx.closePath();

ctx.lineWidth = 1;

/*
 * Red / Left / Buy wall
 */
ctx.beginPath();
ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
ctx.moveTo(0, 680);
ctx.moveTo(250, 680);
var lastX = 0;
for (var i = 0; i < buys.length; i++) {
  lastX = 250 - (startPrice - buys[i].price) * wallPriceScale;
  var y = 680 - buys[i].sum * wallVolScale;
  ctx.lineTo(lastX, y);
}
ctx.lineTo(lastX, 680);
ctx.fill();
ctx.stroke();
ctx.closePath();

 
/*
 * Green / Right / Sell wall
 */
ctx.beginPath();
ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
ctx.moveTo(250, 680);

for (var i = 0; i < sells.length; i++) {
  lastX = 250 + (sells[i].price - startPrice) * wallPriceScale;
  var y = 680 - sells[i].sum * wallVolScale;
  ctx.lineTo(lastX, y);
}
ctx.lineTo(lastX, 680);
ctx.fill();
ctx.stroke();
ctx.closePath();


 
/*
 * Candles
 */
var space = 6;
var candles = ${JSON.stringify(this.toShow.candles)};
var candleWidth = 500 / candles.length - space;

var maxCandle, minCandle;
candles.forEach(el => {
  maxCandle = maxCandle ? (maxCandle < el.high ? el.high : maxCandle) : el.high;
  minCandle = minCandle ? (minCandle > el.low ? el.low : minCandle) : el.low;
});
var dPrice = maxCandle - minCandle;
var priceScale = 680 / dPrice;

candles.forEach((el, i) => {
  ctx.beginPath();
  ctx.strokeStyle = el.bull ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)';
  ctx.fillStyle = el.bull ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)';

  var startX = 500 + i * (space + candleWidth) + space / 2;
  var centerX = startX + candleWidth / 2;

  ctx.moveTo(centerX, 680 - ((el.high - minCandle) * priceScale));
  ctx.lineTo(centerX, 680 - (el.bull ? (el.close - minCandle) * priceScale : (el.open - minCandle) * priceScale));
  ctx.moveTo(centerX, 680 - (el.bull ? (el.open - minCandle) * priceScale : (el.close - minCandle) * priceScale));
  ctx.lineTo(centerX, 680 - ((el.low - minCandle) * priceScale));

  ctx.rect(startX, 680 - (el.bull ? (el.open - minCandle) * priceScale : (el.close - minCandle) * priceScale), candleWidth, -Math.abs(el.close - el.open) * priceScale);
 
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
});
 

/*
 * Captions
 */
 
ctx.fillStyle = 'rgba(0, 0, 0, 1)';
ctx.font = '16px sans';

ctx.fillText('vol ' + dSum.toFixed(2), 0, 20);

ctx.fillText(startPrice.toFixed(2), 250 - 27, 690);
ctx.fillText(buys.last().price.toFixed(2), 250 - wallPriceScale * dPriceBuy, 690);
ctx.fillText(sells.last().price.toFixed(2), 250 + wallPriceScale * dPriceSell - 53, 690);

ctx.fillText(maxCandle.toFixed(2), 500, 20);
ctx.fillText(minCandle.toFixed(2), 500, 690);

          setTimeout(function(){
            location.reload();
          }, ${this.tickInterval});
      </script>`;
      page += `</body>`;
      page += `</html>`;
      res.end(page);
    });

    this.app.get('/data', (req, res) => {
        res.end(this.data.arr.map((el) => { return '$' + el.price + ' at ' + el.time}).join('\n'));    
    });

    this.app.listen(this.port, () => console.log(`up and running at ${this.port}!`));
  }
  
  process(req, res){
    res.end('<h2>nothing to see here!</h2>');
  }

  async updateRate() {
  /*
    openTime: 1508328900000,
    open: '0.05655000',
    high: '0.05656500',
    low: '0.05613200',
    close: '0.05632400',
    volume: '68.88800000',
    closeTime: 1508329199999,
    quoteAssetVolume: '2.29500857',
    trades: 85,
    baseAssetVolume: '40.61900000',
  */
    this.binance.candlesticks(this.pair, this._candle, (error, candles, symbol) => {
      this.toShow.candles = candles.map(arr => {
        // let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = arr;
        let el = {};
        el.open = Number(arr[1]);
        el.high = Number(arr[2]);
        el.low = Number(arr[3]);
        el.close = Number(arr[4]);
        el.volume = Number(arr[5]);
        el.bull = el.open < el.close;
        // console.log(el);
        return el;
      });      
    }, {limit: this._candlesNum/*, endTime: Date.now()*/});

  /*
    ASKS - more than current (sells)
    BIDS - less than current (buys)

    price, quantity
  */
    this.binance.depth(this.pair, (error, depth, symbol) => {
      let firstBid, firstAsk;


      let sumSell = 0;
      this.toShow.walls.sell = [];
      for(let price in depth.asks){
        firstAsk = firstAsk || price;
        let res = {price: Number(price), sum: sumSell + Number(depth.asks[price])};
        this.toShow.walls.sell.push(res);
        sumSell += Number(depth.asks[price]);
      }

      let sumBuy = 0;
      this.toShow.walls.buy = [];
      for(let price in depth.bids){
        firstBid = firstBid || price;
        let res = {price: Number(price), sum: sumBuy + Number(depth.bids[price])};
        this.toShow.walls.buy.push(res);
        sumBuy += Number(depth.bids[price]);
      }
      this.toShow.price = (Number(firstAsk) + Number(firstBid)) / 2;    
    });
  }
}

exports.CandlesAndWalls = CandlesAndWalls;