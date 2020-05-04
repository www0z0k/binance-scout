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

var dSum = Math.max(buys.last().sum, sells.last().sum);

var absMin = Math.min(sells[0].price, buys.last().price, minCandle)
var absMax = Math.max(buys[0].price, sells.last().price, maxCandle)

var dPrice = absMax - absMin;

function getPriceY(pr){
  return DRAW_BOTTOM - DRAW_BOTTOM * (pr - absMin) / (absMax - absMin);
}

var priceY = getPriceY(candles.last().close);

var wallsCenterY = priceY;
var wallPriceScale = DRAW_BOTTOM / dPrice;
var wallVolScale = 500 / dSum;

//Delimiter
ctx.beginPath();
ctx.strokeStyle = 'rgba(180, 180, 180, 1)';
ctx.lineWidth = 0.3;
ctx.moveTo(500, 0);
ctx.lineTo(500, 700);

var scaleStep = 10;
if(dPrice > 499){
  scaleStep = 100;
}else if(dPrice > 250){
  scaleStep = 40;
}

for(var i = Math.ceil(absMin / 10) * 10; i < absMax; i += scaleStep){
  ctx.moveTo(560, getPriceY(i));
  ctx.lineTo(1060, getPriceY(i));
  ctx.fillStyle = 'green';
  ctx.font = '11px monospace';
  ctx.fillText(i, 520, getPriceY(i) + 1);
}

ctx.stroke();
ctx.closePath();

ctx.lineWidth = 1;

/*
 * Red / Bottom / Buy wall
 */
ctx.beginPath();
ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
ctx.moveTo(500, wallsCenterY);
var lastBottomY = 0;
for (var i = 0; i < buys.length; i++) {
  lastBottomY = wallsCenterY + (startPrice - buys[i].price) * wallPriceScale;
  var x = 500 - buys[i].sum * wallVolScale;
  ctx.lineTo(x, lastBottomY);
}
ctx.lineTo(500, lastBottomY);
ctx.fill();
ctx.stroke();
ctx.closePath();

 
/*
 * Green / Top / Sell wall
 */
ctx.beginPath();
ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
ctx.moveTo(500, wallsCenterY);

var lastTopY = 0;
for (var i = 0; i < sells.length; i++) {
  lastTopY = wallsCenterY - (sells[i].price - startPrice) * wallPriceScale;
  var x = 500 - sells[i].sum * wallVolScale;
  ctx.lineTo(x, lastTopY);
}
ctx.lineTo(500, lastTopY);
ctx.fill();
ctx.stroke();
ctx.closePath();


 
/*
 * Candles
 */
var space = 6;
var candleWidth = 500 / candles.length - space;

var priceScale = DRAW_BOTTOM / dPrice;

candles.forEach((el, i) => {
  ctx.beginPath();
  ctx.strokeStyle = el.bull ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)';
  ctx.fillStyle = el.bull ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)';

  var startX = 560 + i * (space + candleWidth) + space / 2;
  var centerX = startX + candleWidth / 2;

  ctx.moveTo(centerX, DRAW_BOTTOM - ((el.high - absMin) * priceScale));
  ctx.lineTo(centerX, DRAW_BOTTOM - (el.bull ? (el.close - absMin) * priceScale : (el.open - absMin) * priceScale));
  ctx.moveTo(centerX, DRAW_BOTTOM - (el.bull ? (el.open - absMin) * priceScale : (el.close - absMin) * priceScale));
  ctx.lineTo(centerX, DRAW_BOTTOM - ((el.low - absMin) * priceScale));

  ctx.rect(startX, DRAW_BOTTOM - (el.bull ? (el.open - absMin) * priceScale : (el.close - absMin) * priceScale), candleWidth, -Math.abs(el.close - el.open) * priceScale);
 
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
ctx.fillText(buys.last().price.toFixed(2), 500, lastBottomY + 10);
ctx.fillText(sells.last().price.toFixed(2), 500, lastTopY + 10);

//candles scale
ctx.fillText(maxCandle.toFixed(2), 500, getPriceY(maxCandle) + 10);
ctx.fillText(minCandle.toFixed(2), 500, getPriceY(minCandle) + 10);

//curr price
ctx.strokeStyle = 'rgba(0, 125, 125, 1)';
ctx.fillStyle = 'rgba(0, 125, 125, 1)';

ctx.fillText(candles.last().close.toFixed(2), 500, priceY + 5);
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