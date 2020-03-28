////////////////////////////////
const fs = require('fs');
const path = require('path');
const ma = require('moving-averages').ma;

class CandlesFarmer{
  constructor(fileName, port, pair, ma1, ma2){
    this.Binance = require('binance-api-node').default;
    this.client = this.Binance();

    this.pair = pair || 'BTCUSDT';
    this.fileName = fileName;
    // this.tickInterval = 30 * 1000;
    this.tickInterval = 60 * 1000;
    this.port = port;
    this.ma1 = ma1 || 12;
    this.ma2 = ma2 || 24;

    this.data = { arr: [] };
    this.lastTime = 0;
    // this.lastId = 0;
    if(fs.existsSync(this.fileName)){
      this.data = JSON.parse(fs.readFileSync(this.fileName));
      this.lastTime = this.data.arr[this.data.arr.length - 1].time;
      // this.lastId = this.data.arr[this.data.arr.length - 1].lastId;
    }

    this.updateRate = this.updateRate.bind(this);
    this.futuresCalc = this.futuresCalc.bind(this);

    if(!this.lastTime || Date.now() - this.lastTime > this.tickInterval){
      this.updateRate();
      setInterval(this.updateRate, this.tickInterval);
    }else{
      setTimeout(() => {
        this.updateRate();
        setInterval(this.updateRate, this.tickInterval);
      }, this.tickInterval - (Date.now() - this.lastTime));
    }

    //init srv here
    this.express = require('express');
    this.app = this.express();

    this.app.get('/', (req, res) => this.process(req, res));
    this.app.post('/', (req, res) => this.process(req, res));

    this.process = (req, res) => {
        res.end('<h2>nothing to see here!</h2>');
    }

    // console.log(getInterceptions(MA(25), MA(100)));

    this.app.get('/interceptions12-24', (req, res) => {
      let m12 = this.MA(req.query.ma1 || this.ma1);
      let m24 = this.MA(req.query.ma2 || this.ma2);
      res.end(JSON.stringify(this.getInterceptions(m12, m24)));
    });

    this.app.get('/get-last', (req, res) => {
      let q = req.query.q || 6;
      res.end(JSON.stringify(this.getLastSum(q)));
    });

    this.app.get('/plots', (req, res) => {
      let m12 = this.MA(req.query.ma1 || this.ma1);
      let m24 = this.MA(req.query.ma2 || this.ma2);
      let m100 = this.MA(100);

      let page = `<html>`;
      page += `<head>
                      <script src="https://cdn.plot.ly/plotly-1.2.0.min.js"></script>
                  </head>`;
      page += `<body>`;
      page += `<h5>${this.pair}</h5>`;
      page += `<p>30 seconds</p>`;
      page += `<div id="tester" style="width:600px;height:350px;"></div>`;
      page += `<div>interceptions:<br>${this.getInterceptions(m12, m24).map((el) => { return el.val + '@' + el.index + ' b: ' + el.bought + ' s: ' + el.sold }).reverse().join('<br>')}</div>`;
      page += `<script>
          TESTER = document.getElementById('tester');
          Plotly.newPlot( TESTER, [
          {x: [${m12.map((el, i) => {return i;}).join(', ')}],
          y: [${m12.join(', ')}], name: "${req.query.ma1 || this.ma1}" },
          {x: [${m24.map((el, i) => {return i;}).join(', ')}],
          y: [${m24.join(', ')}], name: "${req.query.ma2 || this.ma2}" },
          //{x: [${m100.map((el, i) => {return i;}).join(', ')}],
          //y: [${m100.join(', ')}], name: "100" }

          ], {
          margin: { t: 0 } } );
          setTimeout(function(){
            location.reload();
          }, 60000);
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
  
  getLastSum(q){
    let bought = 0;
    let sold = 0;
    this.data.arr.slice(this.data.arr.length - q).forEach(el => {
      bought += el.bought;
      sold += el.sold;
    })
    return {bought, sold};
  }

  getRangeSum(q, to){
    let bought = 0;
    let sold = 0;
    this.data.arr.slice(q, to).forEach(el => {
      bought += el.bought;
      sold += el.sold;
    })
    return {bought, sold};
  }

  saveFile(data){
    fs.writeFile(this.fileName, JSON.stringify(this.data, null, '\t'), (err) => {
        if (err) throw err;
        console.log(`${this.data.arr.length} items saved ${this.pair} @ ${this.tickInterval / 60000}minutes`);
    });
  }

  MA(size, field) {
    field = field || 'price';
    let src = this.data.arr.slice().map((el) => { return Number(el[field]); });
    // console.log(src);
    return ma(src, size);
  }

  getInterceptions (arr1, arr2) {
    let res = [];
    let diffs = [];
    
    if(arr1.length != arr2.length){
        console.log('lengths mismatch');
        return res;
    }

    for (var i = 0; i < arr1.length; i++) {
        let diff = arr1[i] < arr2[i];
        diffs.push(diff);
        if(i > 0 && diffs[i - 1] != diff){
            let stat = this.getRangeSum(i - 3, i);
            res.push({val: arr1[i], index: i, sold: stat.sold, bought: stat.bought});
        }
    }
    return res;
  }


  /*
  ASKS - more than current
  BIDS - less than current
  */
  async futuresCalc(curr, d1, d2){
    d1 = d1 || 7.5;
    d2 = d2 || 15;
    // console.log(this.pair);
    let res = await this.client.futuresBook({ symbol: this.pair });
    
    let sellMass = 0;
    let sellMass2 = 0;
    let sellStops = [];

    let buyMass = 0;
    let buyMass2 = 0;
    let buyStops = [];
    
    for (let i = 0; i < res.asks.length; i++) {
        // if(Number(res.asks[i].quantity) >= Number(valByID('threshold'))){
            // sellStops.push({price: Number(res.asks[i].price), quantity: Number(res.asks[i].quantity)});
        // }
        sellMass += res.asks[i].price - curr < d1 ? Number(res.asks[i].quantity) : 0;
        sellMass2 += res.asks[i].price - curr < d2 ? Number(res.asks[i].quantity) : 0;
    }
    for (let i = 0; i < res.bids.length; i++) {
        // if(Number(res.bids[i].quantity) >= Number(valByID('threshold'))){
            // buyStops.push({price: Number(res.bids[i].price), quantity: Number(res.bids[i].quantity)});
        // }
        buyMass += curr - res.bids[i].price < d1 ? Number(res.bids[i].quantity) : 0;
        buyMass2 += curr - res.bids[i].price < d2 ? Number(res.bids[i].quantity) : 0;
    }

    return {sellMass, sellMass2, buyMass, buyMass2};
  }




/*
    id: 28457,
    price: '4.00000100',
    qty: '12.00000000',
    time: 1499865549590,
    isBuyerMaker: true,
    isBestMatch: true,
*/
  async updateRate() {
    let avgPriceSrv = await this.client.avgPrice({symbol: this.pair});
    avgPriceSrv = Number(avgPriceSrv.price);
    let res = await this.client.trades({symbol: this.pair});
    let totalPrice = 0;
    res.forEach(el => totalPrice += Number(el.price));

    let totalPriceForWeight = 0;
    let totalDividerForWeight = 0;
    let weightBase = Number(res[0].qty);  
//{"id":268893991,"price":"4523.21000000","qty":"0.01888200","quoteQty":"85.40725122","time":1584356745682,"isBuyerMaker":true,"isBestMatch":true}
    res.forEach(el => {
        let k = Number(el.qty) / weightBase;
        totalPriceForWeight += Number(el.price) * k;        
        totalDividerForWeight += k;
    });

    let avgPriceWeighted = (totalPriceForWeight / totalDividerForWeight);

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
    let candles = await this.client.candles({symbol: this.pair, interval: '1m', limit: 1});
    let sum = 0;
    let sum1 = 0;
    let lastPrice = 0;
    /*candles.forEach(el => {
      let delta = Number(el.close) - Number(el.open);
      sum += delta * Number(el.volume);
      
      sum1 = delta * Number(el.volume);

      // let deltaEx = Number(el.close) - Number(el.open);
      lastPrice = el.close;
    });*/

    let el = candles[0];

    let fut = await this.futuresCalc(avgPriceWeighted);
    // let fut = await this.futuresCalc(el.close);

    console.log('delta [' + (Number(el.close) - Number(el.open)) + '] deltaMax [' + (Number(el.high) - Number(el.low)) + '] volume [' + el.quoteAssetVolume + ', ' + el.baseAssetVolume + '] : price ' + el.close, 
      '[ fut+', fut.sellMass + '/' + fut.sellMass2 + ']', '[ fut-', fut.buyMass + '/' + fut.buyMass2 + ']', ' | avg', avgPriceWeighted);
    // console.log('trend 3 [' + sum + '] trend 1 [' + sum1 + '] : price ' + lastPrice, ' | avg', avgPriceWeighted);

    // this.data.arr.push({time: Date.now(), avg: avgPriceSrv, price: avgPriceWeighted});

    // this.saveFile(this.data);
  }
}

exports.CandlesFarmer = CandlesFarmer;