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

    this.tickInterval = 3 * 1000;
    this.port = port || 3000;

    this._candle = '1m';
    this._candlesNum = 40;

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
                      <!--script src="https://cdn.plot.ly/plotly-1.2.0.min.js"></script-->
                  </head>`;
      page += `<body style="background-color:#1D1D1D;">`;
      page += `<h5 style="color:#ffff00;">${this.pair}</h5>`;
      page += `<canvas id="canv" width="1060" height="700" style="border:1px solid #ff00ff;"></canvas>`;
      page += `<script>
Array.prototype.last = function(){
  return this[this.length - 1];
}

var canvas = document.getElementById("canv");
var ctx = canvas.getContext('2d');
ctx.fillStyle = '#1D1D1D';
ctx.rect(0, 0, 1060, 700);
ctx.fill();

var DRAW_BOTTOM = 680;
var buys = ${JSON.stringify(this.toShow.walls.buy)};
var sells = ${JSON.stringify(this.toShow.walls.sell)};
var candles = ${JSON.stringify(this.toShow.candles)};
var startPrice = ${this.toShow.price};

var maxCandle = 0;
var minCandle = 0;
candles.forEach(el => {
  maxCandle = maxCandle ? (maxCandle < el.high ? el.high : maxCandle) : el.high;
  minCandle = minCandle ? (minCandle > el.low ? el.low : minCandle) : el.low;
});


var dPriceBuy = buys[0].price - buys.last().price;
var dPriceSell = sells.last().price - sells[0].price;
var dPrice = Math.max(dPriceSell, dPriceBuy);

var dSum = Math.max(buys.last().sum, sells.last().sum);

var priceY = DRAW_BOTTOM - DRAW_BOTTOM * (candles.last().close - minCandle) / (maxCandle - minCandle);
var wallsCenterY = priceY;
var wallPriceScale = (DRAW_BOTTOM / 2) / dPrice;
var wallVolScale = 500 / dSum;

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
ctx.moveTo(500, wallsCenterY);
var lastY = 0;
for (var i = 0; i < buys.length; i++) {
  lastY = wallsCenterY + (startPrice - buys[i].price) * wallPriceScale;
  var x = 500 - buys[i].sum * wallVolScale;
  ctx.lineTo(x, lastY);
}
ctx.lineTo(500, lastY);
ctx.fill();
ctx.stroke();
ctx.closePath();

 
/*
 * Green / Right / Sell wall
 */
ctx.beginPath();
ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
ctx.moveTo(500, wallsCenterY);

var lastY = 0;
for (var i = 0; i < sells.length; i++) {
  lastY = wallsCenterY - (sells[i].price - startPrice) * wallPriceScale;
  var x = 500 - sells[i].sum * wallVolScale;
  ctx.lineTo(x, lastY);
}
ctx.lineTo(500, lastY);
ctx.fill();
ctx.stroke();
ctx.closePath();


 
/*
 * Candles
 */
var space = 6;
var candleWidth = 500 / candles.length - space;

var dPrice = maxCandle - minCandle;
var priceScale = DRAW_BOTTOM / dPrice;

candles.forEach((el, i) => {
  ctx.beginPath();
  ctx.strokeStyle = el.bull ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)';
  ctx.fillStyle = el.bull ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)';

  var startX = 560 + i * (space + candleWidth) + space / 2;
  var centerX = startX + candleWidth / 2;

  ctx.moveTo(centerX, DRAW_BOTTOM - ((el.high - minCandle) * priceScale));
  ctx.lineTo(centerX, DRAW_BOTTOM - (el.bull ? (el.close - minCandle) * priceScale : (el.open - minCandle) * priceScale));
  ctx.moveTo(centerX, DRAW_BOTTOM - (el.bull ? (el.open - minCandle) * priceScale : (el.close - minCandle) * priceScale));
  ctx.lineTo(centerX, DRAW_BOTTOM - ((el.low - minCandle) * priceScale));

  ctx.rect(startX, DRAW_BOTTOM - (el.bull ? (el.open - minCandle) * priceScale : (el.close - minCandle) * priceScale), candleWidth, -Math.abs(el.close - el.open) * priceScale);
 
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
});
 

/*
 * Captions
 */
 
ctx.fillStyle = 'yellow';
ctx.font = '13px monospace';

ctx.fillText('vol ' + dSum.toFixed(2), 0, 10);

//depth scale
ctx.fillText(startPrice.toFixed(2), 500 - 57, DRAW_BOTTOM / 2);
ctx.fillText(buys.last().price.toFixed(2), 500 - 57, DRAW_BOTTOM + 10);
ctx.fillText(sells.last().price.toFixed(2), 500 - 57, 10);

//candles scale
ctx.fillText(maxCandle.toFixed(2), 500, 10);
ctx.fillText(minCandle.toFixed(2), 500, DRAW_BOTTOM + 10);

//curr price
ctx.strokeStyle = 'rgba(0, 125, 125, 1)';
ctx.fillStyle = 'rgba(0, 125, 125, 1)';

ctx.fillText(candles.last().close.toFixed(2), 500, priceY);
ctx.beginPath();
ctx.moveTo(1060, priceY);
ctx.lineTo(560, priceY);
ctx.stroke();
ctx.closePath();


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