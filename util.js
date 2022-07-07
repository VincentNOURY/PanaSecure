const fs = require('fs')
const forge = require('node-forge')
const path = require('path')
const crypto = require('crypto')
let postgressdata = readFile("config/config.json").postgresdata
const options = {
    client: 'pg',
    connection: {
        user: process.env.db_user || postgressdata.user,
        port: process.env.db_port || postgressdata.port,
        host: process.env.db_host || postgressdata.host,
        database: process.env.db_database || postgressdata.database,
        password: process.env.db_password || postgressdata.password
    }
}

const knex = require('knex')(options);
const salt = process.env.salt || readFile("config/config.json").salt
const salt_files = process.env.salt_files || readFile("config/config.json").salt_files

function getSessionsSecret() {
    return JSON.parse(fs.readFileSync("config/config.json")).sessions_secret
}

async function verify(numsecu, password) {
    password = hashPassword(password)
    pass = await knex('users').where({ numsecu: numsecu }).select('password').first().catch(err => console.log(err))
    if (!pass) {
        return false
    }
    return pass.password == password
}

async function addDocTo(user, doc) {
    docs = (await knex('users').where({ numsecu: user }).select('docs').first()).docs
    if (!docs.includes(parseInt(doc))) {
        docs.push(doc)
        await knex('users').where({ numsecu: user }).update({ docs: docs }).catch(err => console.log(err))
    }
    patients = (await knex('users').where({ numsecu: doc }).select('patients').first()).patients
    if (!patients.includes(parseInt(user))) {
        patients.push(user)
        await knex('users').where({ numsecu: doc }).update({ patients: patients }).catch(err => console.log(err))
    }
}

async function getName(numsecu) {
    info = await knex('users').where({ numsecu: numsecu }).select("prenom", "nom").first()
    return info
}

function readFile(path) {
    return JSON.parse(fs.readFileSync(path))
}

async function getPatients(numsecu) {
    nums = (await knex('users').where({ numsecu: numsecu }).select('patients').first()).patients
    list = []
    for (num of nums) {
        list.push((await knex('users').where({ numsecu: num }).select().first()))
    }
    return list
}

async function isExp(id, numsecu){
    nums = (await knex('files').where({id: id}).select('exp'))
    return numsecu == nums.exp
}

async function getDocs(numsecu) {
    nums = (await knex('users').where({ numsecu: numsecu }).select('docs').first()).docs
    list = []
    for (num of nums) {
        list.push((await knex('users').where({ numsecu: num }).select().first()))
    }
    return list
}

async function addUser(data) {
    data['isdoc'] = false
    data['docs'] = []
    data['patients'] = []
    let test = false
    data.password = hashPassword(data.password)
    await knex('users').insert(data).then(data => { test = true }).catch(err => { test = false; console.log(err) })
    fs.mkdir(path.join(__dirname, 'download', JSON.stringify(parseInt(data.numsecu))), (err) => { if (err) { return console.error(err) } })
    return test
}

function hashPassword(password) {
    let pwd = forge.md.sha256.create()
    pwd.update(salt + password)
    return pwd.digest().toHex()
}

async function getDocNames() {
    return await knex('users').where({ isdoc: true }).first()
}

async function getDocuments(exp, numsecu) {
    return await knex('files').where({ dest: numsecu, exp: exp })
}

async function makeDoc(numsecu) {
    result = false;
    await knex('users').where({ numsecu: numsecu }).update({ isdoc: true, patients: [] }).then(data => { result = true }).catch(err => { tesult = false; console.log(err) })
    return result
}

async function isDoc(numsecu) {
    return (await knex('users').where({ numsecu: numsecu }).select("isdoc").first()).isdoc
}


function isIterable(obj) {
    if (obj == null) {
        return false
    }
    return typeof obj[Symbol.iterator] === 'function'
}

async function writeUpload(name_rec, data, dest, md5, AES_key, exp, password) {
    name_file = name_rec
    if (fs.existsSync(`download/${dest}/${name_file}`)) {
        cp = 0
        do {
            cp += 1
            name_temp = name_rec.split('.')
            name_file = name_temp.slice(0, name_temp.length - 1) + " - " + cp + "." + name_temp[name_temp.length - 1]
        } while (fs.existsSync(`download/${dest}/${name_file}`))
    }
    fs.writeFileSync(`download/${dest}/${name_file}`, data, "hex")
    result = false
    await knex('files').insert({ name: name_file, path: `${dest}/${name_file}`, md5: md5, dest: dest, exp: exp, key: cypherKey(JSON.stringify(AES_key), password) })
        .then(data => { result = true }).catch(err => { result = false; console.log(err) })
    return result
}

async function getAESFile(id, numsecu, password) {
    file = await knex('files').where({ id: id }).select().first()
    if (numsecu == file.dest || numsecu == file.exp) {
        key = decypherKey(file.key, password).toString().replace(/\\n/g, "\\n")  
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f")
        .replace(/[\u0000-\u0019]+/g,"")
        try{
            key = JSON.parse(key.toString().trim())
        }
        catch (e){
            return []
        }
        
        data = fs.readFileSync("download/" + file.path, "hex")
        dec_file = AES_dec(data, key['key'], Buffer.from(key['iv'], 'hex'))
        return [file.name, dec_file]
    }
}

function cypherKey(key, password){
    let pwd = forge.md.sha256.create()
    pwd.update(salt_files + password)
    return JSON.stringify(AES_enc(key, pwd.digest().toHex().substring(0, 32), pwd.digest().toHex().substring(0, 16)))
}

function decypherKey(key, password){
    key = JSON.parse(key)
    let pwd = forge.md.sha256.create()
    pwd.update(salt_files + password)
    return AES_dec(key.encryptedData, pwd.digest().toHex().substring(0, 32), key.iv)
}

async function delFile(id){
    let path_file = "download/" + (await knex('files').where({id: id}).select("path").first()).path
    if (fs.existsSync(path_file)){
        fs.rm(path_file, (err => {console.log(err)}))
    }
    await knex('files').where({id: id}).del()
}

module.exports = { getSessionsSecret, makeDoc, isExp, getName, delFile, cypherKey, decypherKey, addDocTo, isDoc, getAESFile, verify, addUser, isIterable, getPatients, getDocs, writeUpload, getDocuments, RSA_generateKeyPair, RSA_encrypt, RSA_decrypt, getDocNames, AES_enc, AES_dec, AES_genKey } // AES_generateKey, AES_encrypt, AES_decrypt,

// generate an RSA key pair asynchronously
function RSA_generateKeyPair() {
    var rsa = forge.pki.rsa
    var keypair = rsa.generateKeyPair({ bits: 2048, workers: 2 }, function (err, keypair) {
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

function AES_enc(text, key, iv) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function AES_dec(text, key, iv) {
    //iv = Buffer.from(iv, 'hex');
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    decipher.setAutoPadding(false);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
}

function AES_genKey() {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    return { key: key, iv: iv }
}

// To use in /signup to generate static ECDH key pair for any new account, and upload public key on server
function ECDH_genKeyPair() {
    var crypto = require('crypto');
    // Creating ECDH with curve name
    var ecdh = crypto.createECDH('secp521r1');
    ecdh.generateKeys();

    // Prints Public key
    // console.log("Public Key: ", ecdh.getPublicKey());

    // Prints Private Key
    // console.log("Private Key :", ecdh.getPrivateKey());

    return { publicKey: ecdh.getPublicKey(), privateKey: ecdh.getPrivateKey() }
}

// generates an AES key
// To use in /upload, for the sender to encrypt file
// To use for the receiver when decrypting file
function ECDH_computeSecret(privateKey_1, publicKey_2) {
    var crypto = require('crypto');
    var ecdh = crypto.createECDH('secp521r1');
    var secret = ecdh.computeSecret(publicKey_2, privateKey_1);
    return secret
}


