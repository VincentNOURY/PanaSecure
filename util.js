const fs = require('fs')
const forge = require('node-forge')


function getSessionsSecret(){
    return JSON.parse(fs.readFileSync("config/config.json")).sessions_secret
}

function verify(username, password){
    return JSON.parse(fs.readFileSync("data/accounts.json"))[username].password == password
}

function readFile(path){
    return JSON.parse(fs.readFileSync(path))
}

function getPatients(docName){
    return readFile("data/patients.json")[docName]
}

function getDocs(patName){
    return readFile("data/docteurs.json")[patName]
}

function addUser(username, data){
    let users = JSON.parse(fs.readFileSync("data/accounts.json"))
    if (! Object.keys(users).includes(username)){
        users[username] = data
    }
    fs.writeFile("data/accounts.json", JSON.stringify(users), (err) => {if (err) throw err})
}

function getDocNames(){
    return Object.keys(readFile("data/patients.json"))
}

function getDocuments(username){
    return readFile("data/documents.json")[username]
}

module.exports = {getSessionsSecret, verify, addUser, getPatients, getDocs, getDocuments, RSA_generateKeyPair, RSA_encrypt, RSA_decrypt, AES_generateKey, AES_encrypt, AES_decrypt, getDocNames}

// generate an RSA key pair asynchronously
function RSA_generateKeyPair() {
    var rsa = forge.pki.rsa
    var keypair = rsa.generateKeyPair({bits: 2048, workers: 2}, function(err, keypair) {
        // keypair.privateKey, keypair.publicKey
    });
    return keypair
}

function RSA_encrypt(plaintext, publicKey) {
    var ciphertext = publicKey.encrypt(plaintext);
    return ciphertext
}

function RSA_decrypt(ciphertext, privateKey) {
    var plaintext = privateKey.decrypt(ciphertext);
    return plaintext
}

function AES_generateKey() {
    var key = forge.random.getBytesSync(16);
    var iv = forge.random.getBytesSync(16);
    return ({key, iv})
}

function AES_encrypt(plaintext, key, iv) {
    var cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({iv: iv});
    cipher.update(forge.util.createBuffer(plaintext));
    cipher.finish();

    var ciphertext = cipher.output;
    return ciphertext
}

function AES_decrypt(ciphertext, key, iv) {
    var decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({iv: iv});
    decipher.update(ciphertext);
    var result = decipher.finish(); // check 'result' for true/false

    var plaintext = decipher.output;
    return plaintext
}
