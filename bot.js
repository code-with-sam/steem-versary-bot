// STEEM BOT FOR STEEM-VERSARY

const moment = require('moment');
const req = require('request');
const rp = require('request-promise-native');
const steem = require('steem');
const prettyjson = require('prettyjson');


// get list of relevant versary users from steemSQL
let dateToday = new Date();
let dateLastYear = new Date(dateToday.getTime() - (365 * 24 * 60 * 60 * 1000));
let dateLastYearTomorrow = new Date(dateToday.getTime() + (24 * 60 * 60 * 1000) - (365 * 24 * 60 * 60 * 1000));
let lastYeaToday = dateLastYear.getFullYear()+'/'+(dateLastYear.getMonth()+1)+'/'+dateLastYear.getDate();
let lastYearTomorrow = dateLastYearTomorrow.getFullYear()+'/'+(dateLastYearTomorrow.getMonth()+1)+'/'+dateLastYearTomorrow.getDate() ;

let sqlQuery = `SELECT * FROM TxAccountCreates WHERE timestamp >= '${lastYeaToday}' AND timestamp < '${lastYearTomorrow}' ORDER BY CONVERT(DATE, timestamp) DESC`

function getAniversaryData(){
    return rp.post( {
      url: 'https://sql.steemhelpers.com/api',
      form : { query : sqlQuery },
      method: 'POST'
    })
}

function processNamesToAccounts(data){
  let json = JSON.parse(data)
  let userNames = json.rows.map(user => user.new_account_name)
  return new Promise((resolve, reject) => {
    steem.api.getAccounts(userNames, (err, response) => {
      resolve(response)
    })
  })
}

function processActiveUsers(users){
  return new Promise((resolve, reject) => {

    let now = moment().valueOf();
    let sixDaysInSeconds = ( 6 * 24 * 60 * 60 * 1000)
    let activeUsers = users.filter( user => {
        return moment(user.last_root_post).valueOf() >= (now - sixDaysInSeconds)
    })
    resolve(activeUsers);
  })
}

function getLatestPost(users){
  return new Promise((resolvePosts, reject) => {
      let posts = [];
      users.forEach(function (userName,i,arr){
        posts.push( new Promise((resolve, reject) => {
          steem.api.getDiscussionsByAuthorBeforeDate(userName,null, new Date().toISOString().split('.')[0],1, (err, result) => {
              resolve( result )
          })
        }))
      });

      Promise.all(posts).then(data => resolvePosts(data))
  })
}

// get latest post of each user who has post in the last 6 days
getAniversaryData()
  .then(data => processNamesToAccounts(data))
  .then(data => processActiveUsers(data))
  .then(data => {
    let activeUsers = data;
    let activeUsersCount = data.length;
    let votesPerDay = 10;
    let activeNames = activeUsers.map(user => user.name );
    let voteWeightPerUser = Math.floor( (votesPerDay/activeUsersCount) * 100 * 100 )


    console.log(activeNames);
    getLatestPost(activeNames).then(data => {
          data.forEach( (post) => {
            console.log(post[0].url)
            console.log(post[0].author)


          })
        })

  })

// calculate vote share per user

// vote with bot account
