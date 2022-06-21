const express = require('express')
const app = express()
const port = 3000
const util = require('./util')
const sessions = require('express-session')
const cookieParser = require('cookie-parser')
const { fileLoader } = require('ejs')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser())
app.set('view engine', 'ejs')

app.use(sessions({
    secret: util.getSessionsSecret(),
    saveUninitialized: true,
    resave: true 
}))

var session

app.get('/', (req, res) => {
    res.send(req.session)
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
    if (["firstname", "name", "username", "email", "password", "passwordconfirm"].every(el => Object.keys(req.query).includes(el))){
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

app.get("/portal/patient", (req, res) => {
    if (req.session.active){
        if (req.session.doc){
            list = util.getPatients(req.session.userid)
        }
        else{
            list = util.getDocs(req.session.userid)
        }
        if (req.query.username){
            documents = util.getDocuments(req.session.userid)
        }
        else{
            documents = util.getDocuments()
        }
        res.render("pages/portal", {doc: req.session.doc, list: list, documents: documents})
    }
    else{
        res.redirect('/login?forward=/portal/patient')
    }
})

app.get("/download/:user/:file", (req, res) => {
    console.log(req.params.file)
    if (req.session.active && req.session.userid == req.params.user){
        res.sendFile(__dirname + "/download/" + req.params.user + "/" + req.params.file)
    }
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})