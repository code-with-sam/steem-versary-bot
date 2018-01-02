// STEEM BOT FOR STEEM-VERSARY

const moment = require('moment');
const req = require('request');
const rp = require('request-promise-native');


// get list of relevant versary users from steemSQL
let dateToday = new Date();
let dateLastYear = new Date(dateToday.getTime() - (365 * 24 * 60 * 60 * 1000));
let dateLastYearTomorrow = new Date(dateToday.getTime() + (24 * 60 * 60 * 1000) - (365 * 24 * 60 * 60 * 1000));
let lastYeaToday = dateLastYear.getFullYear()+'/'+(dateLastYear.getMonth()+1)+'/'+dateLastYear.getDate();
let lastYearTomorrow = dateLastYearTomorrow.getFullYear()+'/'+(dateLastYearTomorrow.getMonth()+1)+'/'+dateLastYearTomorrow.getDate() ;

let sqlQuery = `SELECT * FROM TxAccountCreates WHERE timestamp >= '${lastYeaToday}' AND timestamp < '${lastYearTomorrow}' ORDER BY CONVERT(DATE, timestamp) DESC`

function getAniversaryData(){
// {url:'https://sql.steemhelpers.com/ap', formData: {query: sqlQuery}}
      rp.post( {
        url: 'https://sql.steemhelpers.com/api',
        form : { query : sqlQuery },
        method: 'POST'
      })
      .then(function (data) {
          console.log(data)
      })
      .catch(function (err) {
          // POST failed...
      });
}

getAniversaryData()
  // .then(data => console.log(data))


// get latest post of each user who has post in the last 6 days

// calculate vote share per user

// vote with bot account
