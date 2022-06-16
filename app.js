const express = require('express')
const app = express()
const port = 3000
const util = require('./util')
const sessions = require('express-session')
const cookieParser = require('cookie-parser')

app.use(cookieParser())

const oneWeek = 1000 * 60 * 60 * 24 * 7
app.use(sessions({
    secret: util.getSessionsSecret(),
    saveUninitialized:true,
    cookie: { maxAge: oneWeek },
    resave: false 
}))

var session

app.get('/', (req, res) => {
    session = req.session
    res.send('attend l\'html')
})

app.get('/login', (req, res) => {

    if (req.query.error){
        // To handle
    }

    if (req.body){
        let username = req.body.username
        let password = req.body.hashed

        if (username && password && util.verify(username, password)){
            session = req.session
            session.userid = username
            res.redirect('/')
        }
        if (username || password)
        {
            res.redirect('/login?error=true')
        }
    }

    //res.render(template)
    res.send('test')
})

app.get('/signup', (req, res) => {
    if (req.body){
        util.addUser(req.body.username, req.body.password)
        res.redirect('/login')
    }
    //res.render()
    res.send('test@')
})

app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})