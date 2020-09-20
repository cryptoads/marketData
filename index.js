const https = require("https");

const AWS = require('aws-sdk');
//const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
 
// function saveItem(msObj){
//     return dynamodb.putItem(
//         {
//             TableName: "marketShare",
//             Item: {
//                 timestamp:{
//                     N: Date.now().toString()
//                 },
//                 bt: {
//                     N: msObj.bt.toString()
//                 },
//                 ct: {
//                     N: msObj.ct.toString()
//                 },
//                 msp: {
//                     N: msObj.msp.toString()
//                 },
//                 mspRounded: {
//                     S: msObj.mspRounded
//                 }
//             }
//         }
//     ).promise();
// }

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data;
            res.on("data", chunk => {
                data = data ? data + chunk : chunk;
            })
            res.on("error", err => reject(err))
            res.on("end", () => {
                let json = JSON.parse(data.toString())
                resolve(json);
            })
        })
    })
}


//https://s3.amazonaws.com/data.ledgerx.com/json/2020-09-19.json
async function getBakktTotal() {
    let url = "https://www.theice.com/marketdata/DelayedMarkets.shtml?getContractsAsJson=&productId=23808&hubId=26066";
    let data = await makeRequest(url);
    let total = 0;
    data.forEach(quote => {
        total += quote.volume
    });
    console.log("Bakkt: ", total);
    return (total);
}

async function getCMETotal() {
    let url = "https://www.cmegroup.com/CmeWS/mvc/Quotes/Future/8478/G";
    let data = await makeRequest(url);
    let total = 0;
    data.quotes.forEach(quote => {
        total += Number.parseInt(quote.volume.split(",").join(''))
    });

    console.log("CME: ", total);
    return (total);
}

async function main() {
    let ct = await getCMETotal();
    let bt = await getBakktTotal();
    ct *= 5; //adjust for 5 BTC lot size
    let msp = bt / (ct + bt) * 100;
    console.log(typeof ct);
    console.log(typeof bt);
    console.log(msp);
    console.log(msp.toFixed(2));
    return { bt, ct, msp, mspRounded: msp.toFixed(2) }
}

exports.handler = async (event) => {

    const response = await main();
    // await saveItem(response);

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET"
        },
        body: JSON.stringify(response)

    };
};
