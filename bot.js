// STEEM BOT FOR STEEM-VERSARY

const moment = require('moment');
const req = require('request');
const rp = require('request-promise-native');
const steem = require('steem');
const config = require('./config')


const BOT_ACCOUNT_NAME = config.username;
const BOT_ACCOUNT_WIF = config.wif
const API_MIN_VOTE_INTERVAL = 4000
const API_MIN_COMMENT_INTERVAL = 25000

let accountCreationLastYear;
let dailyUsersAfterOneYEar;

getAniversaryData()
  .then(data => processNamesToAccounts(data))
  .then(data => processActiveUsers(data))
  .then(data => getLatestPost(data))
      .then(data => {
        sendVotes(data).then(data => console.log(data))
        sendComments(data).then(data => console.log(data))
      })

function getAniversaryData(){
    // get list of relevant versary users from steemSQL
    let dateToday = new Date();
    let dateLastYear = new Date(dateToday.getTime() - (365 * 24 * 60 * 60 * 1000));
    let dateLastYearTomorrow = new Date(dateToday.getTime() + (24 * 60 * 60 * 1000) - (365 * 24 * 60 * 60 * 1000));
    let lastYeaToday = dateLastYear.getFullYear()+'/'+(dateLastYear.getMonth()+1)+'/'+dateLastYear.getDate();
    let lastYearTomorrow = dateLastYearTomorrow.getFullYear()+'/'+(dateLastYearTomorrow.getMonth()+1)+'/'+dateLastYearTomorrow.getDate() ;

    let sqlQuery = `SELECT * FROM TxAccountCreates WHERE timestamp >= '${lastYeaToday}' AND timestamp < '${lastYearTomorrow}' ORDER BY CONVERT(DATE, timestamp) DESC`
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
    accountCreationLastYear = users.length
    dailyUsersAfterOneYEar = activeUsers.length
    resolve(activeUsers);
  })
}

function getLatestPost(users){
  var userNames = users.map(user => user.name);
  return new Promise((resolvePosts, reject) => {
      let posts = [];
      userNames.forEach(function (userName,i,arr){
        posts.push( new Promise((resolve, reject) => {
          steem.api.getDiscussionsByAuthorBeforeDate(userName,null, new Date().toISOString().split('.')[0],1, (err, result) => {
              resolve( result )
          })
        }))
      });

      Promise.all(posts).then(data => resolvePosts(data))
  })
}

  function calcVoteWeight(posts){
    let totalActiveAuthors = posts.length;
    let votesPerDay = 10;
    let minVoteWeightPerUser = Math.floor( (votesPerDay/totalActiveAuthors) * 100 * 100 )
    return minVoteWeightPerUser > 10000 ? 10000 : minVoteWeightPerUser
  }

  function sendVotes(activePosts){

      let voteWeightPerUser = calcVoteWeight(activePosts);
      let votePromises = [];

      return new Promise((resolveVotes, reject) => {
          activePosts.forEach((post,i,arr) => {
              let urlParts  = post[0].url.split("/");
              let permalink = urlParts.pop();
              let author = post[0].author
              let voteWeight = voteWeightPerUser
                            console.log(author, permalink )
              votePromises.push(
                  new Promise((resolve, reject) => {
                      setTimeout( () => {
                        steem.broadcast.vote(BOT_ACCOUNT_WIF, BOT_ACCOUNT_NAME, author, permalink, voteWeight, function(err, result) {

                          resolve(result);
                        });
                      }, i * API_MIN_VOTE_INTERVAL )

                  })
              )
          })
          Promise.all(votePromises).then(data => resolveVotes(data))
      })
  }

  function randomString() {
    let string = ''
    let allowedChars = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 32; i++){
      string += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
    }
    return string;
}

  function sendComments(activePosts){
      let commentPromises = [];
      let commentTitle = 'Your Steem-Versay has arrived, Congratulations';
      let beneficiaries = [];
      beneficiaries.push({
        account: config.beneficiary,
        weight: 100*10
      });

      return new Promise((resolveComments, reject) => {
        activePosts.forEach((post,i,arr) => {
            let uniqueString = randomString();
            let urlParts  = post[0].url.split("/");
            let permalink = urlParts.pop();
            let author = post[0].author
            console.log(author, permalink )

            let operations = [
              ['comment',
              {
                parent_author: author,
                parent_permlink: permalink,
                author: BOT_ACCOUNT_NAME,
                permlink: uniqueString,
                title: commentTitle,
                body: `**Congratulations!** 🎉  Your Steemversay has arrived. One year ago today you made your steem account along with ${accountCreationLastYear} others. You are one of ${dailyUsersAfterOneYEar} users who have posted in the last week. Well done you. <br><br>I've upvoted your post, I hope it helps. Happy Steemversay ✌️; <br><br> p.s I'm a brand new bot and this is my first day of posting :)`,
                json_metadata : JSON.stringify({
                  tags: 'steem-versary',
                  app: 'steem-versary'
                })
              }
            ],
            ['comment_options', {
              author: BOT_ACCOUNT_NAME,
              permlink: uniqueString,
              max_accepted_payout: '100000.000 SBD',
              percent_steem_dollars: 10000,
              allow_votes: true,
              allow_curation_rewards: true,
              extensions: [
                [0, {
                  beneficiaries: beneficiaries
                }]
              ]
            }]
          ];
          commentPromises.push(
              new Promise((resolve, reject) => {
                  setTimeout( () => {

                      steem.broadcast.send(
                          { operations: operations, extensions: [] },
                          { posting: BOT_ACCOUNT_WIF },
                          (err, result) => {
                              resolve(result);
                          }
                      )

                  }, i * API_MIN_COMMENT_INTERVAL )
              })
          )
          })
          Promise.all(commentPromises).then(data => resolveComments(data))
      })
  }
