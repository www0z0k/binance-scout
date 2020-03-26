////////////////////////////////
const fs = require('fs');
const path = require('path');
const ma = require('moving-averages').ma;

class Farmer{
  constructor(fileName, tickInterval, port, pair, ma1, ma2){
    this.Binance = require('binance-api-node').default;
    this.client = this.Binance();

    this.pair = pair || 'BTCUSDT';
    this.fileName = fileName;
    this.tickInterval = tickInterval * 60 * 1000;
    this.port = port;
    this.ma1 = ma1 || 12;
    this.ma2 = ma2 || 24;

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
      let m12 = this.MA(this.ma1);
      let m24 = this.MA(this.ma2);
      res.end(JSON.stringify(this.getInterceptions(m12, m24)));
    });

    this.app.get('/interceptions12-24-100', (req, res) => {
      let m12 = this.MA(this.ma1);
      let m24 = this.MA(this.ma2);
      let m100 = this.MA(100);
      res.end(JSON.stringify(this.getThreeInterceptions(m12, m24, m100)));
    });

    this.app.get('/plots', (req, res) => {
      let m12 = this.MA(this.ma1);
      let m24 = this.MA(this.ma2);
      let m100 = this.MA(100);

      let page = `<html>`;
      page += `<head>
                      <script src="https://cdn.plot.ly/plotly-1.2.0.min.js"></script>
                  </head>`;
      page += `<body>`;
      page += `<h5>${this.pair}</h5>`;
      page += `<div id="tester" style="width:600px;height:350px;"></div>`;
      // page += `<div>3x interceptions:<br>${this.getThreeInterceptions(m12, m24, m100).map((el) => { return el.val + '@' + el.index }).join('<br>')}</div>`;
      page += `<div>interceptions:<br>${this.getInterceptions(m12, m24).map((el) => { return el.val + '@' + el.index }).reverse().join('<br>')}</div>`;
      page += `<script>
          TESTER = document.getElementById('tester');
          Plotly.newPlot( TESTER, [
          {x: [${m12.map((el, i) => {return i;}).join(', ')}],
          y: [${m12.join(', ')}], name: "${this.ma1}" },
          {x: [${m24.map((el, i) => {return i;}).join(', ')}],
          y: [${m24.join(', ')}], name: "${this.ma2}" },
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

  getThreeInterceptions (arr1, arr2, arr3) {
    let res = [];
    let diffs = [];
    
    if(arr1.length != arr2.length){
        console.log('lengths mismatch');
        return res;
    }

    for (var i = 0; i < arr1.length; i++) {
        let diff12 = arr1[i] < arr2[i]
        let diff13 = arr1[i] < arr3[i];
        let diff23 = arr2[i] < arr3[i];

        diffs.push([diff12, diff13, diff23]);

        if(i > 0){
          let prev = diffs[i - 1];
          if(diff12 != prev[0] && diff13 != prev[1] && diff23 != prev[2]){
            res.push({val: arr1[i], index: i});
          }
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