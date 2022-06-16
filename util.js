const fs = require('fs')
function getSessionsSecret(){
    return JSON.parse(fs.readFileSync("config/config.json")).sessions_secret
}

function verify(username, password){
    return JSON.parse(fs.readFileSync("data/accounts.json"))[username] == password
}

function addUser(username, password){
    let users = JSON.parse(fs.readFileSync("data/accounts.json"))
    if (! users.includes(username)){
        users.username = password
    }
    fs.writeFile("data/accounts.json", users, (err) => {if (err) throw err})
}

module.exports = {getSessionsSecret, verify, addUser}