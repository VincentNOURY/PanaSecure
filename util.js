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

function isUserInDoc(username){
    return Object.keys(readFile("data/documents.json")).includes(username)
}


function isIterable(obj) {
    if (obj == null) {
      return false
    }
    return typeof obj[Symbol.iterator] === 'function'
  }

function writeUpload(name, data, dest, md5, EAS_key){
    fs.writeFileSync(`download/${dest}/${name}`, data, "hex")
    documents = readFile('data/documents.json')
    if (isUserInDoc(dest)){
        documents[dest][`${dest}/${name}`] = {name: name, path: `${dest}/${name}`,md5: md5}
    }
    else{
        documents[dest] = {}
        documents[dest][`${dest}/${name}`] = {name: name, path: `${dest}/${name}`,md5: md5}
    }
    fs.writeFileSync("data/documents.json", JSON.stringify(documents))
    keys = readFile('data/keys.json')
    keys[`${dest}/${name}`] = EAS_key
    fs.writeFileSync("data/keys.json", JSON.stringify(keys))
}

function getAESFile(path, name, userid){
    key = readFile("data/keys.json")[name]
    md5 = readFile("data/documents.json")[userid][name].md5
    file = fs.readFileSync(path, "hex")
    console.log(path)
    var md = forge.md.md5.create()
    md.update(file)
    md52 = md.digest().toHex()
    console.log(md52)
    console.log(md5)
    console.log(md5 == md52)
    return AES_dec(file, key['key'], key['iv'])
}

module.exports = {getSessionsSecret, getAESFile, verify, addUser, isIterable, getPatients, getDocs, writeUpload, getDocuments, RSA_generateKeyPair, RSA_encrypt, RSA_decrypt, getDocNames, AES_enc, AES_dec, AES_genKey} // AES_generateKey, AES_encrypt, AES_decrypt,

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

/*function AES_generateKey() {
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
}*/

function AES_enc(text, key, iv) {
    var crypto = require('crypto');
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
   }
   
function AES_dec(text, key, iv) {
    var crypto = require('crypto');
    iv = Buffer.from(iv, 'hex');
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    decipher.setAutoPadding(false);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
}

function AES_genKey(){
    var crypto = require('crypto');
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    return {key: key, iv: iv}
}


