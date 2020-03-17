////////////////////////////////
const fs = require('fs');
const path = require('path');
const ma = require('moving-averages').ma;

class Farmer{
  constructor(fileName, tickInterval, port, pair){
    this.Binance = require('binance-api-node').default;
    this.client = this.Binance();

    this.pair = pair || 'BTCUSDT';
    this.fileName = fileName;
    this.tickInterval = tickInterval * 60 * 1000;
    this.port = port;

    this.data = { arr: [] };
    this.lastTime = 0;
    if(fs.existsSync(this.fileName)){
      this.data = JSON.parse(fs.readFileSync(this.fileName));
        this.lastTime = this.data.arr[this.data.arr.length - 1].time;
    }

    this.updateRate = this.updateRate.bind(this);

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
      let m12 = this.MA(12);
      let m24 = this.MA(24);
      res.end(JSON.stringify(this.getInterceptions(m12, m24)));
    });

    this.app.get('/plots', (req, res) => {
      let m12 = this.MA(12);
      let m24 = this.MA(24);

      let page = `<html>`;
      page += `<head>
                      <script src="https://cdn.plot.ly/plotly-1.2.0.min.js"></script>
                  </head>`;
      page += `<body>`;
      page += `<h5>${this.pair}</h5>`;
      page += `<div id="tester" style="width:600px;height:250px;"></div>`;
      page += `<div>interceptions:<br>${this.getInterceptions(m12, m24).map((el) => { return el.val + '@' + el.index }).join('<br>')}</div>`;
      page += `<script>
          TESTER = document.getElementById('tester');
          Plotly.newPlot( TESTER, [
          {x: [${m12.map((el, i) => {return i;}).join(', ')}],
          y: [${m12.join(', ')}], name: "12" },
          {x: [${m24.map((el, i) => {return i;}).join(', ')}],
          y: [${m24.join(', ')}], name: "24" }

          ], {
          margin: { t: 0 } } );
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
  
  saveFile(data){
    fs.writeFile(this.fileName, JSON.stringify(this.data, null, '\t'), (err) => {
        if (err) throw err;
        console.log(`${this.data.arr.length} items saved`);
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
            res.push({val: arr1[i], index: i});
        }
    }
    return res;
  }

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
    this.data.arr.push({time: Date.now(), avg: avgPriceSrv, price: avgPriceWeighted});

    this.saveFile(this.data);
  }
}

exports.Farmer = Farmer;



/*{
  symbol: 'ETHBTC',
  priceChange: '-0.00112000',
  priceChangePercent: '-1.751',
  weightedAvgPrice: '0.06324784',
  prevClosePrice: '0.06397400',
  lastPrice: '0.06285500',
  lastQty: '0.63500000',
  bidPrice: '0.06285500',
  bidQty: '0.81900000',
  askPrice: '0.06291900',
  askQty: '2.93800000',
  openPrice: '0.06397500',
  highPrice: '0.06419100',
  lowPrice: '0.06205300',
  volume: '126240.37200000',
  quoteVolume: '7984.43091340',
  openTime: 1521622289427,
  closeTime: 1521708689427,
  firstId: 45409308, // First tradeId
  lastId: 45724293, // Last tradeId
  count: 314986 // Trade count
}*/





// console.log(MA(25));
// console.log(MA(10));






