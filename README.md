// STEEM BOT FOR STEEM-VERSARY

steemversary bot rewards steem users on every year after the creation of their account on steemversary day.

### How To
steemversary is a javascript powered bot, while there is no reason why it can't be adapted ot comiled for the browser this repo supports a node.js enviroment.

change ```config.example.js``` to ```config.js``` and add your username and private posting key

e.g
```
let config = {
  username : 'yourusernamehere',
  postingKey : 'yourprivatepostingkeyhere'
}
```

Run the bot with
```
npm install
node bot.js
```


### How to contribute
steemversary bot needs steempower to be effective, if you can spare steem power please cosider delegating for a short time. Your name can be added as a supporter to it's message.


### upcoming update
- more stats for steemversary users
- easier way for steem delegation through steem-versary website
