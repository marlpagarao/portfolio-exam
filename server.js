if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }
  
  const express = require('express')
  const path = require('path')
  const app = express()
  const bcrypt = require('bcrypt')
  var passport = require('passport')
  const flash = require('express-flash')
  const session = require('express-session')
  const methodOverride = require('method-override')
  const bodyParser = require('body-parser');
  const mysql = require('mysql')
  const ejs = require('ejs');
  const moment = require("moment");

  
  
  const initializePassport = require('./passport-config')
  initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
  )
  
  const users = []

  //define sql connection
  
  app.set('view-engine', 'ejs')
  app.use(express.urlencoded({ extended: false }))
  app.use(flash())
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(methodOverride('_method'))
  app.use(express.static(__dirname + '/public'));

  app.use((req, res, next)=>{
    res.locals.moment = moment;
    next();
  });

  app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name })
  })
  
  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
  })

  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))
  
  app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
  })

  
  app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
        id: Date.now().toString(),
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
      })
      res.redirect('/login')
    } catch {
      res.redirect('/register')
    }
  })
  
  app.delete('/logout', function (req, res, next) {
    req.logOut(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/login');
    })
  })

  //for db

  const connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'node_exam'
});

connection.connect(function(error){
    if(!!error) console.log(error);
    else console.log('Database Connected!');
}); 

//set views file
app.set('views',path.join(__dirname,'views'));
			
//set view engine
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



app.get('/user_index',(req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM career";
    let query = connection.query(sql, (err, rows) => {
        if(err) throw err;
        res.render('user_index', {
            title : 'CRUD Operation using NodeJS / ExpressJS / MySQL',
            users : rows
        });
    });
});


app.get('/add',(req, res) => {
    res.render('user_add', {
        title : 'CRUD Operation using NodeJS / ExpressJS / MySQL'
    });
});

app.post('/save',(req, res) => { 
    let data = {name: req.body.name, desc: req.body.desc, target: req.body.target, completed: req.body.completed,};
    let sql = "INSERT INTO career SET ?";
    let query = connection.query(sql, data,(err, results) => {
      if(err) throw err;
      res.redirect('/user_index');
    });
});

app.get('/edit/:userId',(req, res) => {
    const userId = req.params.userId;
    let sql = `SELECT * from career where id = ${userId}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.render('user_edit', {
            title : 'CRUD Operation using NodeJS / ExpressJS / MySQL',
            user : result[0]
        });
    });
});


// app.post('/update',(req, res) => {
//     const userId = req.body.id;
//     let sql = "UPDATE career SET name='"+req.body.name+"', desc='"+req.body.desc+"', target='"+req.body.target+"', completed='"+req.body.completed+"' WHERE id = "+userId;
//     let query = connection.query(sql,(err, results) => {
//       if(err) throw err;
//       res.redirect('/user_index');
//     });
// });

app.post('/update',(req, res) => {
    var userId = req.body.id;
    let sql = "UPDATE career SET `name` = ?, `desc`= ?, `target`= ?, `completed` = ? WHERE id = ?";
    let query = connection.query(sql,
        [req.body.name,
        req.body.desc,
        req.body.target,
        req.body.completed,
        userId],
        (err, results) => {
      if(err) throw err;
      res.redirect('/user_index');
    });
});


app.get('/delete/:userId',(req, res) => {
    const userId = req.params.userId;
    let sql = `DELETE from career where id = ${userId}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.redirect('/user_index');
    });
});
  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/login')
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()
  }
  
  app.listen(3000)