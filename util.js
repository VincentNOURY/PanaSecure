const fs = require('fs')
function getSessionsSecret(){
    return JSON.parse(fs.readFileSync("config/config.json")).sessions_secret
}

function verify(username, password){
    return JSON.parse(fs.readFileSync("data/accounts.json"))[username].password == password
}

function addUser(username, data){
    let users = JSON.parse(fs.readFileSync("data/accounts.json"))
    if (! Object.keys(users).includes(username)){
        users[username] = data
    }
    fs.writeFile("data/accounts.json", JSON.stringify(users), (err) => {if (err) throw err})
}

module.exports = {getSessionsSecret, verify, addUser}