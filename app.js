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

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')))
app.use(express.static("public"))
app.use(fileUpload())
app.use(cookieParser())
app.set('view engine', 'ejs')

app.use(sessions({
    secret: util.getSessionsSecret(),
    saveUninitialized: true,
    resave: true 
}))

var session

app.get('/', (req, res) => {
    res.render('pages/accueil')
})

app.get('/login', (req, res) => {

    if (req.query.error){
        // To handle
    }

    if (req.session && Object.keys(req.session).includes('userid')){
        
        return res.redirect('/')
    }

    if (req.query){
        let username = req.query.username
        let password = req.query.password

        if (username && password && util.verify(username, password)){
            session = req.session
            session.userid = username
            session.active = true
            if (util.getDocNames().includes(username)){
                session.doc = true
            }
            else{
                session.doc = false
            }
            if (req.query.forward){
                return res.redirect(req.query.forward)
            }
            else{
                return res.redirect('/')
            }
            
        }
        if (username || password)
        {
            return res.redirect('/login?error=true')
        }
    }

    res.render("pages/login", {forward: req.query.forward})
})

app.get('/signup', (req, res) => {
    if (["firstname", "name", "username", "email", "password", "passwordconfirm", "numsecu"].every(el => Object.keys(req.query).includes(el))){
        let username = req.query.username
        delete req.query['username']
        delete req.query['passwordconfirm']
        if (req.query.password == req.query.passwordconfirm){
            util.addUser(username, req.query)
            return res.redirect('/login')
        }
        return res.redirect('/signup')
        
    }
    res.render('pages/sign_up')
})

app.get('/logout',(req, res) => {
    req.session.destroy()
    req.session = null

    console.log(req.session)
    delete session
    console.log(session)
    res.redirect('/')

  })

app.get('/me', (req, res) => {
    if (req.session.active){
        res.render("pages/historique")
    }
    else{
        res.redirect('/login?forward=/me')
    }
})

app.get("/portal", (req, res) => {
    if (req.session.active){
        if (req.session.doc){
            list = util.getPatients(req.session.userid)
        }
        else{
            list = util.getDocs(req.session.userid)
        }
        console.log(req.session.userid)
        if (req.query.username){
            documents = util.getDocuments(req.query.username)
        }
        else{
            documents = util.getDocuments(req.session.userid)
        }
        res.render("pages/portal", {doc: req.session.doc, list: list, documents: documents})
    }
    else{
        res.redirect('/login?forward=/portal')
    }
})

app.get("/download/:user/:file", (req, res) => {
    if (req.session.active && req.session.userid == req.params.user){
        res.type('pdf')
        res.send(util.getAESFile("download/" + req.params.user + "/" + req.params.file, req.params.user + "/" + req.params.file, req.session.userid))
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
                    util.writeUpload(file.name, data.encryptedData, req.body.person, file.md5, EAS_key)
                }
            }
            else{
                EAS_key = util.AES_genKey()
                data = util.AES_enc(req.files.uploads.data, EAS_key["key"], EAS_key["iv"])
                EAS_key.iv = data.iv
                util.writeUpload(req.files.uploads.name, data.encryptedData, req.body.person, req.files.uploads.md5, EAS_key)
            }
            
        }
        return res.redirect('/portal')
    }
    else{
        return res.redirect('/portal')
    }
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})