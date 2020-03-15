////////////////////////////////
const fs = require('fs');
const path = require('path');
const Binance = require('binance-api-node').default;
// require('es6-promise/auto');
////////////////////////////////
//for unsigned
const client = Binance();

const saveFile = (data) =>{
    fs.writeFile('data.json', JSON.stringify(data, null, '\t'), (err) => {
        if (err) throw err;
        console.log(`creds saved`);
    });
}

//we`re gonna need it
const pingLoop = () => {
    client.time().then(time => {
        console.log(time);
        pingLoop();
    });
}
// pingLoop();
let data = { arr: [] };
if(fs.existsSync('data.json')){
	data = JSON.parse(fs.readFileSync('data.json'));
}

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

async function updateRate() {
    let res = await client.dailyStats({ symbol: 'BTCUSDT' });
    data.arr.push({time: res.closeTime, price: res.lastPrice});
    saveFile(data);
}
// updateRate();
setInterval(updateRate, 24 * 60 * 60 * 1000);


const express = require('express');
const app = express();
const port = 80;

app.get('/', (req, res) => process(req, res));
app.post('/', (req, res) => process(req, res));

const process = (req, res) => {
    res.end('<h2>nothing to see here!</h2>');
}

app.get('/data', (req, res) => {
    res.end(data.arr.map((el) => { return '$' + el.price + ' at ' + el.time}).join('\n'));    
});

app.listen(port, () => console.log(`up and running at ${port}!`));

//Date,Open,High,Low,Close,Adj Close,Volume
/*
let str = `2019-03-15,3926.663330,3968.542969,3914.015381,3960.911133,3960.911133,9394210604
2019-03-16,3963.900146,4077.036377,3961.657471,4048.725830,4048.725830,9856166973
2019-03-17,4047.719482,4054.122070,4006.411133,4025.229004,4025.229004,8221625399
2019-03-18,4029.968506,4071.556641,4009.117188,4032.507324,4032.507324,9646954186
2019-03-19,4032.691895,4082.216064,4023.812500,4071.190186,4071.190186,9344919956
2019-03-20,4070.793945,4089.461914,4031.110840,4087.476318,4087.476318,10175916388
2019-03-21,4083.953857,4097.359863,4005.151367,4029.326904,4029.326904,10831212661
2019-03-22,4028.514648,4053.906738,4021.542480,4023.968262,4023.968262,9252935969
2019-03-23,4022.713379,4049.882568,4015.964600,4035.826416,4035.826416,9578850549
2019-03-24,4035.163574,4040.699707,4006.192871,4022.168213,4022.168213,9144851064
2019-03-25,4024.112793,4038.840820,3934.031250,3963.070557,3963.070557,10359818882
2019-03-26,3969.228760,3985.080811,3944.753174,3985.080811,3985.080811,10707678814
2019-03-27,3984.244873,4087.066162,3977.810547,4087.066162,4087.066162,10897131934
2019-03-28,4087.584473,4094.902100,4040.266357,4069.107178,4069.107178,9353915899
2019-03-29,4068.299805,4113.500977,4034.097168,4098.374512,4098.374512,10918665556
2019-03-30,4092.136230,4296.806641,4053.909668,4106.660156,4106.660156,9732688060
2019-03-31,4105.456055,4113.023438,4094.100830,4105.404297,4105.404297,9045122442
2019-04-01,4105.362305,4164.953125,4096.901367,4158.183105,4158.183105,10157794170
2019-04-02,4156.919434,4905.954590,4155.316895,4879.877930,4879.877930,21315047816
2019-04-03,4879.958008,5307.003418,4876.621094,4973.021973,4973.021973,22899891582
2019-04-04,4971.307617,5063.159668,4836.793945,4922.798828,4922.798828,18251810239
2019-04-05,4922.806152,5053.509766,4919.491699,5036.681152,5036.681152,16837325387
2019-04-06,5036.792969,5205.821777,4992.222168,5059.817383,5059.817383,16929795193
2019-04-07,5062.793945,5235.186523,5050.412109,5198.896973,5198.896973,16655416140
2019-04-08,5199.835449,5318.836426,5148.211914,5289.770996,5289.770996,17154113634
2019-04-09,5289.917969,5289.917969,5167.418945,5204.958496,5204.958496,14722104361
2019-04-10,5204.105469,5421.651367,5193.382324,5324.551758,5324.551758,15504590933
2019-04-11,5325.081543,5354.225586,5017.296387,5064.487793,5064.487793,16555616019
2019-04-12,5061.200684,5103.274414,4955.852539,5089.539063,5089.539063,13675206312
2019-04-13,5088.850098,5127.122070,5061.589355,5096.586426,5096.586426,10823289598
2019-04-14,5095.758789,5184.016113,5053.568359,5167.722168,5167.722168,10391952498
2019-04-15,5167.321777,5196.606934,5024.069336,5067.108398,5067.108398,12290155060
2019-04-16,5066.577637,5238.945313,5055.194824,5235.559570,5235.559570,11618660197
2019-04-17,5236.135254,5274.275391,5219.205566,5251.937988,5251.937988,12438480676
2019-04-18,5251.480469,5319.986328,5250.506836,5298.385742,5298.385742,13256489918
2019-04-19,5298.154297,5336.680176,5233.335449,5303.812500,5303.812500,13780238655
2019-04-20,5304.160645,5358.490723,5295.877930,5337.886230,5337.886230,13169647522
2019-04-21,5335.878906,5359.924805,5257.339355,5314.531250,5314.531250,13731844222
2019-04-22,5312.494629,5422.687500,5280.276855,5399.365234,5399.365234,14601631647
2019-04-23,5399.365723,5633.802246,5389.408691,5572.361816,5572.361816,15867308107
2019-04-24,5571.508301,5642.044434,5418.263184,5464.866699,5464.866699,17048033399
2019-04-25,5466.524414,5542.238281,5181.338867,5210.515625,5210.515625,15330283408
2019-04-26,5210.304688,5383.634277,5177.368652,5279.348145,5279.348145,16812108039
2019-04-27,5279.471191,5310.750000,5233.635742,5268.291016,5268.291016,13111274675
2019-04-28,5271.746582,5326.231934,5255.683594,5285.139160,5285.139160,12819992055
2019-04-29,5284.858398,5311.274902,5216.487793,5247.352539,5247.352539,13735490672
2019-04-30,5247.726074,5363.257324,5224.189941,5350.726563,5350.726563,13878964573
2019-05-01,5350.914551,5418.003906,5347.645996,5402.697266,5402.697266,13679528236
2019-05-02,5402.422852,5522.262695,5394.217285,5505.283691,5505.283691,14644460907
2019-05-03,5505.552246,5865.881836,5490.201660,5768.289551,5768.289551,18720780005
2019-05-04,5769.202637,5886.893555,5645.469238,5831.167480,5831.167480,17567780765
2019-05-05,5831.068359,5833.862793,5708.035156,5795.708496,5795.708496,14808830722
2019-05-06,5791.693359,5802.957520,5653.687500,5746.807129,5746.807129,15737171804
2019-05-07,5745.599121,5988.178223,5741.395996,5829.501465,5829.501465,18026409032
2019-05-08,5849.481445,5989.980957,5794.715820,5982.457520,5982.457520,15320605299
2019-05-09,5982.316406,6183.039063,5982.316406,6174.528809,6174.528809,16784645410
2019-05-10,6175.822754,6434.617676,6161.519043,6378.849121,6378.849121,19419875367
2019-05-11,6379.666992,7333.002930,6375.698730,7204.771484,7204.771484,28867562329
2019-05-12,7203.507324,7503.872070,6815.770996,6972.371582,6972.371582,27773333679
2019-05-13,6971.178223,8047.413086,6898.282227,7814.915039,7814.915039,28677672181
2019-05-14,7807.884277,8268.712891,7696.391113,7994.416016,7994.416016,32031452226
2019-05-15,7989.374512,8216.423828,7899.106934,8205.167969,8205.167969,28344112919
2019-05-16,8194.500977,8320.824219,7729.608398,7884.909180,7884.909180,33167197581
2019-05-17,7886.925781,7929.145508,7038.124512,7343.895508,7343.895508,30066644905
2019-05-18,7341.664551,7447.271973,7251.504395,7271.208008,7271.208008,21354286561
2019-05-19,7267.962891,8261.941406,7267.962891,8197.689453,8197.689453,25902422039
2019-05-20,8196.923828,8200.967773,7678.781738,7978.309082,7978.309082,23843404339
2019-05-21,7977.969238,8062.167969,7843.339844,7963.327637,7963.327637,25127245056
2019-05-22,7956.291992,7997.612305,7615.987305,7680.066406,7680.066406,24719473174
2019-05-23,7677.269043,7943.791504,7533.196777,7881.846680,7881.846680,24457107820
2019-05-24,7881.695313,8140.719727,7824.448730,7987.371582,7987.371582,25919126990
2019-05-25,7991.885254,8117.925781,7965.976074,8052.543945,8052.543945,22256813106
2019-05-26,8055.206055,8687.520508,7924.670410,8673.215820,8673.215820,26677970091
2019-05-27,8674.072266,8907.174805,8668.705078,8805.778320,8805.778320,27949839563
2019-05-28,8802.757813,8807.016602,8634.721680,8719.961914,8719.961914,24226919266
2019-05-29,8718.591797,8755.852539,8482.728516,8659.487305,8659.487305,23473479966
2019-05-30,8661.760742,9008.314453,8221.273438,8319.472656,8319.472656,29246528551
2019-05-31,8320.286133,8586.659180,8172.550781,8574.501953,8574.501953,25365190957
2019-06-01,8573.839844,8625.600586,8481.578125,8564.016602,8564.016602,22488303543
2019-06-02,8565.473633,8809.303711,8561.235352,8742.958008,8742.958008,20266216022
2019-06-03,8741.747070,8743.500000,8204.185547,8208.995117,8208.995117,22004511436
2019-06-04,8210.985352,8210.985352,7564.488770,7707.770996,7707.770996,24609731548
2019-06-05,7704.343262,7901.849121,7668.668457,7824.231445,7824.231445,21760923463
2019-06-06,7819.633301,7937.340820,7571.471191,7822.023438,7822.023438,19474611077
2019-06-07,7826.901367,8126.153320,7788.373535,8043.951172,8043.951172,19141423230
2019-06-08,8036.774902,8076.891113,7837.610840,7954.127930,7954.127930,16522722809
2019-06-09,7949.674805,7975.974121,7583.219727,7688.077148,7688.077148,16610726547
2019-06-10,7692.284668,8031.909668,7586.730957,8000.329590,8000.329590,18689275117
2019-06-11,8004.243652,8026.394043,7772.803711,7927.714355,7927.714355,17107279931
2019-06-12,7925.434082,8196.648438,7862.359863,8145.857422,8145.857422,19034432883
2019-06-13,8145.545410,8311.567383,8087.061035,8230.923828,8230.923828,18669407147
2019-06-14,8230.898438,8710.636719,8183.393066,8693.833008,8693.833008,19831162905
2019-06-15,8689.746094,8859.127930,8618.395508,8838.375000,8838.375000,18371033226
2019-06-16,8841.440430,9335.867188,8814.556641,8994.488281,8994.488281,23348550310
2019-06-17,8988.923828,9416.407227,8988.923828,9320.352539,9320.352539,15562951918
2019-06-18,9335.466797,9348.374023,9004.901367,9081.762695,9081.762695,15848210535
2019-06-19,9078.727539,9299.621094,9070.395508,9273.521484,9273.521484,15546809946
2019-06-20,9273.060547,9594.419922,9232.484375,9527.160156,9527.160156,17846823783
2019-06-21,9525.074219,10144.556641,9525.074219,10144.556641,10144.556641,20624008643
2019-06-22,10175.923828,11157.345703,10107.035156,10701.691406,10701.691406,29995204860
2019-06-23,10696.691406,11246.144531,10556.095703,10855.371094,10855.371094,20998326501
2019-06-24,10853.744141,11065.896484,10610.427734,11011.102539,11011.102539,19271652364
2019-06-25,11007.202148,11790.916992,11007.202148,11790.916992,11790.916992,24879684533
2019-06-26,11778.581055,13796.489258,11755.597656,13016.231445,13016.231445,45105733173
2019-06-27,13017.125000,13311.144531,10491.852539,11182.806641,11182.806641,39977475222
2019-06-28,11162.167969,12445.174805,10914.495117,12407.332031,12407.332031,35087757765
2019-06-29,12400.763672,12400.910156,11508.378906,11959.371094,11959.371094,29923961127
2019-06-30,11931.991211,12178.383789,10799.008789,10817.155273,10817.155273,27256473494
2019-07-01,10796.930664,11206.439453,10089.314453,10583.134766,10583.134766,29378589324
2019-07-02,10588.683594,10912.188477,9737.884766,10801.677734,10801.677734,31015895222
2019-07-03,10818.156250,11968.078125,10818.156250,11961.269531,11961.269531,30796494293
2019-07-04,11972.718750,12006.075195,11166.569336,11215.437500,11215.437500,25920294033
2019-07-05,11203.102539,11395.661133,10874.964844,10978.459961,10978.459961,23838480210
2019-07-06,10982.543945,11620.964844,10982.543945,11208.550781,11208.550781,21092024306
2019-07-07,11217.616211,11541.620117,11148.804688,11450.846680,11450.846680,19369044276
2019-07-08,11446.596680,12345.833008,11393.374023,12285.958008,12285.958008,23482551458
2019-07-09,12284.326172,12779.131836,12233.261719,12573.812500,12573.812500,28167921522
2019-07-10,12571.537109,13129.529297,11710.978516,12156.512695,12156.512695,33627574244
2019-07-11,12139.713867,12144.623047,11158.922852,11358.662109,11358.662109,28595327690
2019-07-12,11354.299805,11905.487305,11179.144531,11815.986328,11815.986328,23534692796
2019-07-13,11813.126953,11841.957031,10908.479492,11392.378906,11392.378906,21042616383
2019-07-14,11381.020508,11451.204102,10234.576172,10256.058594,10256.058594,22486000001
2019-07-15,10257.838867,11052.766602,9992.006836,10895.089844,10895.089844,25384047206
2019-07-16,10896.653320,10996.632813,9448.106445,9477.641602,9477.641602,24151199069
2019-07-17,9471.213867,9963.134766,9163.134766,9693.802734,9693.802734,24569921548
2019-07-18,9698.502930,10736.842773,9376.798828,10666.482422,10666.482422,25187024648
2019-07-19,10653.956055,10716.980469,10229.628906,10530.732422,10530.732422,20727426309
2019-07-20,10525.819336,11048.662109,10451.276367,10767.139648,10767.139648,20206615154
2019-07-21,10777.529297,10841.887695,10389.599609,10599.105469,10599.105469,17130580467
2019-07-22,10596.948242,10651.791016,10154.921875,10343.106445,10343.106445,16334414913
2019-07-23,10346.748047,10346.748047,9883.594727,9900.767578,9900.767578,17851916994
2019-07-24,9887.730469,9908.796875,9614.306641,9811.925781,9811.925781,17398734321
2019-07-25,9809.096680,10154.253906,9773.957031,9911.841797,9911.841797,15821952090
2019-07-26,9913.126953,9916.517578,9717.982422,9870.303711,9870.303711,14495714483
2019-07-27,9871.165039,10167.320313,9411.521484,9477.677734,9477.677734,16817809536
2019-07-28,9491.626953,9575.544922,9252.296875,9552.860352,9552.860352,13738687092
2019-07-29,9548.178711,9681.648438,9472.948242,9519.145508,9519.145508,13791445323
2019-07-30,9522.329102,9701.759766,9437.335938,9607.423828,9607.423828,13829811132
2019-07-31,9604.050781,10085.627930,9598.097656,10085.627930,10085.627930,16631520647
2019-08-01,10077.442383,10446.919922,9922.019531,10399.668945,10399.668945,17165337857
2019-08-02,10402.042969,10657.953125,10371.013672,10518.174805,10518.174805,17489094081
2019-08-03,10519.278320,10946.781250,10503.504883,10821.726563,10821.726563,15352685060
2019-08-04,10821.632813,11009.207031,10620.278320,10970.184570,10970.184570,16530894786
2019-08-05,10960.735352,11895.091797,10960.735352,11805.653320,11805.653320,23875988832
2019-08-06,11811.544922,12273.821289,11290.731445,11478.168945,11478.168945,23635107659
2019-08-07,11476.193359,12036.990234,11433.701172,11941.968750,11941.968750,22194988641
2019-08-08,11954.040039,11979.419922,11556.167969,11966.407227,11966.407227,19481591729
2019-08-09,11953.469727,11970.458008,11709.745117,11862.936523,11862.936523,18339989959
2019-08-10,11861.556641,11915.655273,11323.898438,11354.024414,11354.024414,18125355447
2019-08-11,11349.740234,11523.579102,11248.294922,11523.579102,11523.579102,15774371517
2019-08-12,11528.189453,11528.189453,11320.951172,11382.616211,11382.616211,13647198229
2019-08-13,11385.052734,11420.049805,10830.327148,10895.830078,10895.830078,16681503536
2019-08-14,10889.487305,10889.556641,10028.135742,10051.704102,10051.704102,19990838299
2019-08-15,10038.421875,10437.411133,9675.316406,10311.545898,10311.545898,22899115082
2019-08-16,10319.419922,10524.349609,9855.478516,10374.338867,10374.338867,20228207096
2019-08-17,10358.722656,10452.625000,10086.698242,10231.744141,10231.744141,13778035685
2019-08-18,10233.005859,10487.070313,10119.094727,10345.810547,10345.810547,12999813869
2019-08-19,10350.283203,10916.053711,10313.204102,10916.053711,10916.053711,16038264603
2019-08-20,10916.346680,10947.041992,10618.960938,10763.232422,10763.232422,15053082175
2019-08-21,10764.572266,10798.729492,9962.721680,10138.049805,10138.049805,19473084767
2019-08-22,10142.521484,10232.996094,9831.462891,10131.055664,10131.055664,17097508856
2019-08-23,10136.309570,10442.443359,10078.192383,10407.964844,10407.964844,15627023886
2019-08-24,10407.644531,10418.020508,9982.296875,10159.960938,10159.960938,15451030650
2019-08-25,10160.737305,10304.622070,10008.789063,10138.517578,10138.517578,14153856609
2019-08-26,10126.299805,10512.328125,10126.299805,10370.820313,10370.820313,18438654079
2019-08-27,10372.826172,10381.328125,10087.300781,10185.500000,10185.500000,14762609502
2019-08-28,10203.426758,10279.366211,9716.656250,9754.422852,9754.422852,17603790323
2019-08-29,9756.786133,9756.786133,9421.629883,9510.200195,9510.200195,17045878500
2019-08-30,9514.844727,9656.124023,9428.302734,9598.173828,9598.173828,13595263986
2019-08-31,9597.539063,9673.220703,9531.799805,9630.664063,9630.664063,11454806419
2019-09-01,9630.592773,9796.755859,9582.944336,9757.970703,9757.970703,11445355859
2019-09-02,9757.473633,10396.591797,9730.650391,10346.760742,10346.760742,17248102293
2019-09-03,10345.725586,10736.104492,10308.547852,10623.540039,10623.540039,19384917988
2019-09-04,10621.180664,10762.644531,10434.709961,10594.493164,10594.493164,16742664768
2019-09-05,10588.183594,10627.269531,10516.417969,10575.533203,10575.533203,14551239507
2019-09-06,10578.198242,10898.761719,10292.299805,10353.302734,10353.302734,19536574782
2019-09-07,10353.931641,10558.673828,10348.918945,10517.254883,10517.254883,15307366476
2019-09-08,10518.114258,10595.637695,10409.090820,10441.276367,10441.276367,13670567492
2019-09-09,10443.228516,10450.311523,10144.929688,10334.974609,10334.974609,17595943367
2019-09-10,10336.408203,10394.353516,10020.573242,10115.975586,10115.975586,14906809639
2019-09-11,10123.035156,10215.948242,9980.776367,10178.372070,10178.372070,15428063426
2019-09-12,10176.819336,10442.253906,10099.242188,10410.126953,10410.126953,15323563925
2019-09-13,10415.362305,10441.489258,10226.596680,10360.546875,10360.546875,14109864674
2019-09-14,10345.403320,10422.133789,10291.694336,10358.048828,10358.048828,13468713124
2019-09-15,10356.465820,10387.035156,10313.092773,10347.712891,10347.712891,12043433567
2019-09-16,10347.222656,10386.867188,10189.744141,10276.793945,10276.793945,15160167778
2019-09-17,10281.513672,10296.771484,10199.739258,10241.272461,10241.272461,15304603363
2019-09-18,10247.795898,10275.928711,10191.469727,10198.248047,10198.248047,16169268880
2019-09-19,10200.496094,10295.668945,9851.692383,10266.415039,10266.415039,19937691247
2019-09-20,10266.318359,10285.872070,10132.186523,10181.641602,10181.641602,14734189639
2019-09-21,10183.648438,10188.097656,10000.708008,10019.716797,10019.716797,13425266806
2019-09-22,10024.115234,10074.444336,9922.533203,10070.392578,10070.392578,13199651698
2019-09-23,10067.962891,10074.238281,9727.143555,9729.324219,9729.324219,15144925408
2019-09-24,9729.321289,9804.317383,8370.801758,8620.566406,8620.566406,25002886688
2019-09-25,8603.428711,8744.828125,8325.396484,8486.993164,8486.993164,21744728352
2019-09-26,8487.669922,8515.685547,7895.629395,8118.967773,8118.967773,19258205289
2019-09-27,8113.101074,8271.520508,7965.922852,8251.845703,8251.845703,16408941155
2019-09-28,8251.273438,8285.617188,8125.431641,8245.915039,8245.915039,14141152736
2019-09-29,8246.037109,8261.707031,7990.497070,8104.185547,8104.185547,13034629108
2019-09-30,8104.226563,8314.231445,7830.758789,8293.868164,8293.868164,17115474183
2019-10-01,8299.720703,8497.692383,8232.679688,8343.276367,8343.276367,15305343412
2019-10-02,8344.212891,8393.041992,8227.695313,8393.041992,8393.041992,13125712442
2019-10-03,8390.774414,8414.227539,8146.437012,8259.992188,8259.992188,13668823409
2019-10-04,8259.494141,8260.055664,8151.236816,8205.939453,8205.939453,13139456229
2019-10-05,8210.149414,8215.526367,8071.120605,8151.500488,8151.500488,12200497197
2019-10-06,8149.876953,8161.410156,7958.850586,7988.155762,7988.155762,13160830305
2019-10-07,7989.120605,8308.450195,7905.766113,8245.623047,8245.623047,18009742607
2019-10-08,8246.849609,8332.714844,8185.763184,8228.783203,8228.783203,15592264032
2019-10-09,8229.840820,8627.706055,8169.298828,8595.740234,8595.740234,19384942333
2019-10-10,8585.280273,8625.272461,8471.933594,8586.473633,8586.473633,17618660671
2019-10-11,8585.262695,8721.780273,8316.181641,8321.756836,8321.756836,19604381101
2019-10-12,8315.665039,8415.242188,8313.340820,8336.555664,8336.555664,14532641604
2019-10-13,8336.902344,8470.988281,8276.612305,8321.005859,8321.005859,13808286058
2019-10-14,8320.832031,8390.208984,8284.130859,8374.686523,8374.686523,15151387859
2019-10-15,8373.458008,8410.714844,8182.706543,8205.369141,8205.369141,15220412631
2019-10-16,8204.674805,8216.812500,7985.089844,8047.526855,8047.526855,16071646995
2019-10-17,8047.812500,8134.831543,8000.942871,8103.911133,8103.911133,14313052244
2019-10-18,8100.933594,8138.413574,7902.164063,7973.207520,7973.207520,15651592610
2019-10-19,7973.803711,8082.629395,7944.776855,7988.560547,7988.560547,13797825640
2019-10-20,7997.807129,8281.818359,7949.439453,8222.078125,8222.078125,15504249442
2019-10-21,8225.115234,8296.694336,8196.416016,8243.720703,8243.720703,15868748865
2019-10-22,8243.402344,8296.651367,8074.462891,8078.203125,8078.203125,16803377856
2019-10-23,8076.228516,8092.999512,7469.322754,7514.671875,7514.671875,21942878957
2019-10-24,7509.728027,7532.867676,7446.988770,7493.488770,7493.488770,16268708848
2019-10-25,7490.703125,8691.540039,7479.984375,8660.700195,8660.700195,28705065488
2019-10-26,8667.577148,10021.744141,8662.622070,9244.972656,9244.972656,44496255608
2019-10-27,9241.707031,9749.529297,9112.541992,9551.714844,9551.714844,32593129500
2019-10-28,9565.101563,9805.118164,9256.148438,9256.148438,9256.148438,30948255331
2019-10-29,9248.440430,9516.180664,9232.648438,9427.687500,9427.687500,28426779937
2019-10-30,9422.462891,9426.874023,9085.370117,9205.726563,9205.726563,27706531577
2019-10-31,9202.458008,9383.161133,9028.717773,9199.584961,9199.584961,26583653946
2019-11-01,9193.992188,9275.657227,9132.047852,9261.104492,9261.104492,24324691031
2019-11-02,9259.783203,9377.486328,9249.587891,9324.717773,9324.717773,21242676385
2019-11-03,9324.787109,9379.806641,9141.251953,9235.354492,9235.354492,21132220847
2019-11-04,9235.607422,9505.051758,9191.485352,9412.612305,9412.612305,26170255634
2019-11-05,9413.004883,9457.417969,9256.931641,9342.527344,9342.527344,26198609047
2019-11-06,9340.864258,9423.237305,9305.909180,9360.879883,9360.879883,23133895764
2019-11-07,9352.393555,9368.476563,9202.353516,9267.561523,9267.561523,22700383838
2019-11-08,9265.368164,9272.759766,8775.534180,8804.880859,8804.880859,24333037836
2019-11-09,8809.468750,8891.818359,8793.163086,8813.582031,8813.582031,17578630605
2019-11-10,8812.489258,9103.826172,8806.162109,9055.526367,9055.526367,20587919881
2019-11-11,9056.917969,9081.279297,8700.608398,8757.788086,8757.788086,20265510765
2019-11-12,8759.751953,8853.768555,8685.427734,8815.662109,8815.662109,20309769107
2019-11-13,8812.033203,8836.841797,8761.651367,8808.262695,8808.262695,17545755404
2019-11-14,8811.936523,8826.943359,8692.551758,8708.094727,8708.094727,19084739974
2019-11-15,8705.708008,8730.873047,8484.843750,8491.992188,8491.992188,21796856471
2019-11-16,8491.166016,8591.997070,8473.973633,8550.760742,8550.760742,16495389808
2019-11-17,8549.470703,8727.789063,8500.967773,8577.975586,8577.975586,18668638896
2019-11-18,8573.980469,8653.280273,8273.573242,8309.286133,8309.286133,21579470673
2019-11-19,8305.134766,8408.516602,8099.963379,8206.145508,8206.145508,21083613815
2019-11-20,8203.613281,8237.240234,8010.511719,8027.268066,8027.268066,20764300436
2019-11-21,8023.644531,8110.098145,7597.381836,7642.750000,7642.750000,22514243371
2019-11-22,7643.569336,7697.382813,6936.706543,7296.577637,7296.577637,34242315784
2019-11-23,7296.164551,7442.258789,7151.417969,7397.796875,7397.796875,21008924417
2019-11-24,7398.633789,7408.577148,7029.289063,7047.916992,7047.916992,30433517289
2019-11-25,7039.977051,7319.856934,6617.166992,7146.133789,7146.133789,42685231261
2019-11-26,7145.159180,7320.230469,7098.572266,7218.371094,7218.371094,21129505542
2019-11-27,7220.880859,7619.693359,6974.174316,7531.663574,7531.663574,23991412764
2019-11-28,7536.820313,7730.072754,7454.121582,7463.105957,7463.105957,19050116751
2019-11-29,7466.727051,7781.179688,7460.756348,7761.243652,7761.243652,19709695455
2019-11-30,7764.057129,7836.102051,7515.849609,7569.629883,7569.629883,17158194786
2019-12-01,7571.616211,7571.616211,7291.341797,7424.292480,7424.292480,18720708479
2019-12-02,7424.036133,7474.818848,7233.399414,7321.988281,7321.988281,17082040705
2019-12-03,7323.975586,7418.858887,7229.356934,7320.145508,7320.145508,14797485769
2019-12-04,7320.125000,7539.784668,7170.922852,7252.034668,7252.034668,21664240918
2019-12-05,7253.241699,7743.431641,7232.676758,7448.307617,7448.307617,18816085231
2019-12-06,7450.561523,7546.996582,7392.175293,7546.996582,7546.996582,18104466306
2019-12-07,7547.265625,7589.951660,7525.711426,7556.237793,7556.237793,15453520564
2019-12-08,7551.338867,7634.606445,7476.091309,7564.345215,7564.345215,15409908086
2019-12-09,7561.795410,7618.091797,7365.985352,7400.899414,7400.899414,17872021272
2019-12-10,7397.134277,7424.022949,7246.043945,7278.119629,7278.119629,18249031194
2019-12-11,7277.197754,7324.156250,7195.527344,7217.427246,7217.427246,16350490689
2019-12-12,7216.738770,7266.639648,7164.741211,7243.134277,7243.134277,18927080224
2019-12-13,7244.662109,7293.560547,7227.122559,7269.684570,7269.684570,17125736940
2019-12-14,7268.902832,7308.836426,7097.208984,7124.673828,7124.673828,17137029729
2019-12-15,7124.239746,7181.075684,6924.375977,7152.301758,7152.301758,16881129804
2019-12-16,7153.663086,7171.168945,6903.682617,6932.480469,6932.480469,20213265949
2019-12-17,6931.315430,6964.075195,6587.974121,6640.515137,6640.515137,22363804217
2019-12-18,6647.698242,7324.984863,6540.049316,7276.802734,7276.802734,31836522778
2019-12-19,7277.590820,7346.602539,7041.381836,7202.844238,7202.844238,25904604415
2019-12-20,7208.636719,7257.921875,7086.124023,7218.816406,7218.816406,22633815180
2019-12-21,7220.593750,7223.226074,7112.735840,7191.158691,7191.158691,19312552168
2019-12-22,7191.188477,7518.033203,7167.179199,7511.588867,7511.588867,23134537956
2019-12-23,7508.902344,7656.176270,7326.192383,7355.628418,7355.628418,27831788041
2019-12-24,7354.393066,7535.716797,7269.528809,7322.532227,7322.532227,22991622105
2019-12-25,7325.755859,7357.020020,7220.991211,7275.155762,7275.155762,21559505148
2019-12-26,7274.799316,7388.302734,7200.386719,7238.966797,7238.966797,22787010034
2019-12-27,7238.141113,7363.529297,7189.934082,7290.088379,7290.088379,22777360995
2019-12-28,7289.031250,7399.041016,7286.905273,7317.990234,7317.990234,21365673026
2019-12-29,7317.647461,7513.948242,7279.865234,7422.652832,7422.652832,22445257701
2019-12-30,7420.272949,7454.824219,7276.308105,7292.995117,7292.995117,22874131671
2019-12-31,7294.438965,7335.290039,7169.777832,7193.599121,7193.599121,21167946112
2020-01-01,7194.892090,7254.330566,7174.944336,7200.174316,7200.174316,18565664996
2020-01-02,7202.551270,7212.155273,6935.270020,6985.470215,6985.470215,20802083465
2020-01-03,6984.428711,7413.715332,6914.996094,7344.884277,7344.884277,28111481031
2020-01-04,7345.375488,7427.385742,7309.514160,7410.656738,7410.656738,18444271274
2020-01-05,7410.451660,7544.497070,7400.535645,7411.317383,7411.317383,19725074094
2020-01-06,7410.452148,7781.867188,7409.292969,7769.219238,7769.219238,23276261598
2020-01-07,7768.682129,8178.215820,7768.227539,8163.692383,8163.692383,28767291326
2020-01-08,8161.935547,8396.738281,7956.774414,8079.862793,8079.862793,31672559264
2020-01-09,8082.295898,8082.295898,7842.403809,7879.071289,7879.071289,24045990465
2020-01-10,7878.307617,8166.554199,7726.774902,8166.554199,8166.554199,28714583843
2020-01-11,8162.190918,8218.359375,8029.642090,8037.537598,8037.537598,25521165085
2020-01-12,8033.261719,8200.063477,8009.059082,8192.494141,8192.494141,22903438381
2020-01-13,8189.771973,8197.788086,8079.700684,8144.194336,8144.194336,22482910687
2020-01-14,8140.933105,8879.511719,8140.933105,8827.764648,8827.764648,44841784107
2020-01-15,8825.343750,8890.117188,8657.187500,8807.010742,8807.010742,40102834649
2020-01-16,8812.481445,8846.460938,8612.095703,8723.786133,8723.786133,31313981930
2020-01-17,8725.209961,8958.122070,8677.316406,8929.038086,8929.038086,36372139320
2020-01-18,8927.211914,9012.198242,8827.332031,8942.808594,8942.808594,32337772626
2020-01-19,8941.445313,9164.362305,8620.080078,8706.245117,8706.245117,34217320471
2020-01-20,8704.631836,8745.590820,8560.473633,8657.642578,8657.642578,26422375678
2020-01-21,8658.991211,8755.706055,8544.520508,8745.894531,8745.894531,24097418512
2020-01-22,8744.210938,8792.994141,8636.747070,8680.875977,8680.875977,22600204050
2020-01-23,8680.650391,8687.747070,8333.637695,8406.515625,8406.515625,25770680778
2020-01-24,8405.567383,8514.666992,8266.840820,8445.434570,8445.434570,24397913025
2020-01-25,8440.119141,8458.453125,8296.218750,8367.847656,8367.847656,19647331548
2020-01-26,8364.410156,8602.401367,8325.498047,8596.830078,8596.830078,22177678795
2020-01-27,8597.308594,8977.726563,8597.308594,8909.819336,8909.819336,28647338393
2020-01-28,8912.524414,9358.589844,8908.447266,9358.589844,9358.589844,34398744402
2020-01-29,9357.470703,9406.431641,9269.467773,9316.629883,9316.629883,30682598115
2020-01-30,9316.016602,9553.125977,9230.897461,9508.993164,9508.993164,32378792850
2020-01-31,9508.313477,9521.706055,9230.776367,9350.529297,9350.529297,29432489719
2020-02-01,9346.357422,9439.323242,9313.239258,9392.875000,9392.875000,25922656496
2020-02-02,9389.820313,9468.797852,9217.824219,9344.365234,9344.365234,30835736946
2020-02-03,9344.683594,9540.372070,9248.633789,9293.521484,9293.521484,30934096508
2020-02-04,9292.841797,9331.265625,9112.811523,9180.962891,9180.962891,29893183716
2020-02-05,9183.416016,9701.299805,9163.704102,9613.423828,9613.423828,35222060874
2020-02-06,9617.821289,9824.619141,9539.818359,9729.801758,9729.801758,37628823715
2020-02-07,9726.002930,9834.716797,9726.002930,9795.943359,9795.943359,34522718159
2020-02-08,9793.070313,9876.749023,9678.910156,9865.119141,9865.119141,35172043761
2020-02-09,9863.894531,10129.435547,9850.392578,10116.673828,10116.673828,35807884663
2020-02-10,10115.559570,10165.765625,9784.563477,9856.611328,9856.611328,39386548074
2020-02-11,9855.891602,10210.052734,9729.334961,10208.236328,10208.236328,37648059388
2020-02-12,10202.387695,10393.611328,10202.387695,10326.054688,10326.054688,43444303830
2020-02-13,10323.960938,10457.626953,10116.161133,10214.379883,10214.379883,49356071372
2020-02-14,10211.550781,10321.996094,10125.534180,10312.116211,10312.116211,43338264161
2020-02-15,10313.856445,10341.555664,9874.427734,9889.424805,9889.424805,43865054831
2020-02-16,9889.179688,10053.968750,9722.386719,9934.433594,9934.433594,43374780305
2020-02-17,9936.560547,9938.815430,9507.637695,9690.142578,9690.142578,45998298412
2020-02-18,9691.230469,10161.935547,9632.382813,10141.996094,10141.996094,47271023953
2020-02-19,10143.798828,10191.675781,9611.223633,9633.386719,9633.386719,46992019709
2020-02-20,9629.325195,9643.216797,9507.900391,9608.475586,9608.475586,44925260236
2020-02-21,9611.782227,9723.014648,9589.743164,9686.441406,9686.441406,40930547512
2020-02-22,9687.707031,9698.231445,9600.728516,9663.181641,9663.181641,35838025154
2020-02-23,9663.318359,9937.404297,9657.791016,9924.515625,9924.515625,41185185761
2020-02-24,9921.583008,9951.746094,9537.042969,9650.174805,9650.174805,45080496648
2020-02-25,9651.312500,9652.737305,9305.021484,9341.705078,9341.705078,42515259129
2020-02-26,9338.290039,9354.778320,8704.426758,8820.522461,8820.522461,50420050761
2020-02-27,8825.093750,8932.892578,8577.199219,8784.494141,8784.494141,45470195695
2020-02-28,8788.728516,8890.456055,8492.932617,8672.455078,8672.455078,44605450442
2020-02-29,8671.212891,8775.631836,8599.508789,8599.508789,8599.508789,35792392544
2020-03-01,8599.758789,8726.796875,8471.212891,8562.454102,8562.454102,35349164300
2020-03-02,8563.264648,8921.308594,8532.630859,8869.669922,8869.669922,42857674408
2020-03-03,8865.387695,8901.598633,8704.990234,8787.786133,8787.786133,42386715820
2020-03-04,8788.541992,8843.366211,8712.431641,8755.246094,8755.246094,34746706368
2020-03-05,8760.285156,9142.054688,8757.253906,9078.762695,9078.762695,39698054597
2020-03-06,9078.308594,9167.695313,9032.079102,9122.545898,9122.545898,40826885650
2020-03-07,9121.600586,9163.220703,8890.744141,8909.954102,8909.954102,36216930369
2020-03-08,8908.206055,8914.343750,8105.252930,8108.116211,8108.116211,39973102120
2020-03-09,8111.146484,8177.793457,7690.098145,7923.644531,7923.644531,46936995808
2020-03-10,7922.146973,8136.945313,7814.763184,7909.729492,7909.729492,42213940993
2020-03-11,7910.089844,7950.814453,7642.812500,7911.430176,7911.430176,38682762604
2020-03-12,7913.616211,7929.116211,4860.354004,4970.788086,4970.788086,53980357243
2020-03-13,5017.831055,5838.114746,4106.980957,5563.707031,5563.707031,74156772074
2020-03-14,5573.077637,5625.226563,5125.069336,5200.366211,5200.366211,36154506007
2020-03-15,5171.513672,5548.492676,5169.283203,5331.754883,5331.754883,31621668864`;

let arr = str.split('\n').map((entry) => { return {time: new Date(entry.split(',')[0]).getTime(), price: entry.split(',')[4]}});
arr.push({
            "time": 1584281833969,
            "price": "5302.18000000"
        });
data.arr = arr;
saveFile(data);*/