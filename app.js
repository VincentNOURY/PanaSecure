const express = require('express')
const app = express()
const port = 3000
const util = require('./util')
const sessions = require('express-session')
const cookieParser = require('cookie-parser')
const favicon = require('serve-favicon')
const path = require('path')
const { fileLoader } = require('ejs')
const fileUpload = require('express-fileupload')
const server = app.listen(3000, () => {
    console.log(`Listening on port ${port}`)
})
const io = require('socket.io')(server)

var room;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')))
app.use(express.static("public"))
app.use(fileUpload())
app.use(cookieParser())
app.set('view engine', 'ejs')

app.use(sessions({
    secret: process.env.sessions_secret || util.getSessionsSecret(),
    saveUninitialized: true,
    resave: true 
}))

var session

app.get('/', (req, res) => {
    res.render('pages/accueil', {active: req.session.active})
})

app.get('/login', async (req, res) => {

    if (req.query.error){
        // To handle
    }

    if (req.session && Object.keys(req.session).includes('userid')){
        
        return res.redirect('/')
    }

    if (req.query){
        let numsecu = req.query.numsecu
        let password = req.query.password

        if (numsecu && password && await util.verify(numsecu, password)){
            session = req.session
            session.userid = numsecu
            session.active = true
            if (req.query.forward){
                return res.redirect(req.query.forward)
            }
            else{
                return res.redirect('/')
            }
            
        }
        if (numsecu || password)
        {
            return res.redirect('/login?error=true')
        }
    }

    res.render("pages/login", {forward: req.query.forward, active: req.session.active})
})

app.get('/signup', async (req, res) => {
    if (["prenom", "nom", "email", "password", "passwordconfirm", "numsecu"].every(el => Object.keys(req.query).includes(el))){
        if (req.query.password == req.query.passwordconfirm){
            delete req.query['passwordconfirm']
            if (await util.addUser(req.query)){
                return res.redirect('/login')
            }
            return res.redirect('/signup')
            
        }
        return res.redirect('/signup')
        
    }
    res.render('pages/sign_up', {active: req.session.active})
})

app.get('/logout',(req, res) => {
    req.session.destroy()
    req.session = null

    delete session
    res.redirect('/')

  })

app.get('/message', async (req, res) => {
    if (req.session.active){
        userid = req.session.userid
        doc = await util.isDoc(userid)
        if (! req.query.room ){
            if (doc){
                list = await util.getPatients(userid)
            } else {
                list = await util.getDocs(userid)
            }
            return res.render('pages/contacts', {list: list, doc: doc, admin: parseInt(userid) == 0, self: userid, active: req.session.active})
        }
        else{
            room = req.query.room
            infos = await util.getName(userid)
            return res.render("pages/message", {roomname: room, prenom: infos.prenom, nom: infos.nom, active: req.session.active})
        }
        
    }
    else{
        res.redirect('/login?forward=/message')
    }
})

app.get("/portal", async (req, res) => {
    if (req.session.active){
        if (! req.query.numsecu ){
            if (await util.isDoc(req.session.userid)){
                num = await util.getPatients(req.session.userid)
            }
            else{
                num = await util.getDocs(req.session.userid)
            }
            if (num.length > 0){
                return res.redirect(`/portal?numsecu=${num[0].numsecu}`)
            }
            else{
                return res.redirect("/portal?numsecu=0")
            }
        }
        if (await util.isDoc(req.session.userid)){
            list = await util.getPatients(req.session.userid)
        }
        else{
            list = await util.getDocs(req.session.userid)
        }
        if (parseInt(req.query.numsecu) == 0)
        {
            documents = []
        }
        else{
            documents = await util.getDocuments(parseInt(req.query.numsecu), req.session.userid)
        }
        sent = await util.getDocuments(req.session.userid, parseInt(req.query.numsecu))
        res.render("pages/portal", {doc: await util.isDoc(req.session.userid), list: list, documents: documents, sent: sent, active: req.session.active, admin: parseInt(req.session.userid) == 0})
    }
    else{
        res.redirect('/login?forward=/portal')
    }
})

app.get("/download/:id", async (req, res) => {
    if (req.session.active){
        file = await util.getAESFile(req.params.id, req.session.userid)
        if (["jpg", "jpeg", "png"].includes(file[0].split('.')[file[0].split('.').length - 1])){
            res.send(`<head><title>${file[0]}</title><body><img src="data:image/jpeg;base64,${file[1].toString('base64')}"></body>`)
        }
        else{
            res.type('application/pdf')
            res.send(file[1])
        }
        }
})

app.post('/upload', async (req, res) => {
    if (req.session.active){
        if (!req.files){
            return res.status(400).send("No files were uploaded.")
        }
        else{
            if (util.isIterable(req.files.uploads)){
                for(file of req.files.uploads){
                    EAS_key = util.AES_genKey()
                    data = util.AES_enc(file.data, EAS_key["key"], EAS_key["iv"])
                    EAS_key.iv = data.iv
                    util.writeUpload(file.name, data.encryptedData, req.body.person, file.md5, EAS_key, req.session.userid)
                }
            }
            else{
                EAS_key = util.AES_genKey()
                data = util.AES_enc(req.files.uploads.data, EAS_key["key"], EAS_key["iv"])
                EAS_key.iv = data.iv
                util.writeUpload(req.files.uploads.name, data.encryptedData, req.body.person, req.files.uploads.md5, EAS_key, req.session.userid)
            }
            
        }
        return res.redirect('/portal')
    }
    else{
        return res.redirect('/portal')
    }
})

app.get('/add', async (req, res) => {
    if (req.session.active){
        return res.render('pages/add_patient', {doc: await util.isDoc(req.session.userid), active: req.session.active})
    }
    return res.redirect('/login?forward=/add')
})

app.post('/add', async (req, res) => {
    if (req.session.active && parseInt(req.session.userid) == 0){
        await util.makeDoc(req.body.numsecu)
    }
    else if (req.session.active && await util.isDoc(req.session.userid)){
        await util.addDocTo(req.body.numsecu, req.session.userid)
        return res.redirect('/portal')
    }
    return res.redirect('/login?forward=/add')
})

io.on('connection', (socket) => {
    socket.join(parseInt(room))

    socket.on('join', (msg) => {
        io.to(msg.room).emit('message', msg.msg)
    })

    socket.on('message', (msg) => {
        io.to(parseInt(msg.room)).emit('message', msg.msg)
    })
})