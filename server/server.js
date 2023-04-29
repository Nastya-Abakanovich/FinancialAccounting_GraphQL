const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const bodyParser = require('body-parser'); 
const mysql = require("mysql2");
const dbConfig = require("./config/db.config.js");
const jwtConfig = require("./config/jwt.config.js");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cookieParser = require('cookie-parser');

const connection = mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password
});

connection.connect(function(err){
    if (err) {
        return console.error("Ошибка: " + err.message);
    }
    else {
        console.log("Подключение к серверу MySQL успешно установлено");    
    }
}); 

const app = express();
const port = 5000;
const urlencodedParser = express.urlencoded({extended: false});

const storage = multer.diskStorage ({
    destination: (req, file, cb) =>{
        cb(null, "public/uploads");
    },
    filename: (req, file, cb) =>{
        cb(null, file.originalname);
    }
})
const upload = multer({storage: storage});

function middleware (req, res, next) {
    if (req.method === "OPTIONS") {
        next();
    }

    try {
        var cookies = req.cookies; 

        if (cookies && cookies.token) {
            const decoderData = jwt.verify(cookies.token, jwtConfig.secretKey);            
            console.log(decoderData);
            console.log('--------------');
            next();
        } else {
            return res.status(401).send({message: "Пользователь не авторизован"});
        }   
    } catch (e) {
        console.log(e);
        return res.status(401).send({message: "Пользователь не авторизован"});
    }
}



app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

app.get('/api/:filename', (req, res) => {
    res.status(200).sendFile(__dirname + '/public/uploads/' + req.params.filename, (err, file) => {
        if (err) 
            res.sendStatus(404)
        else 
            res.end(file);
      });
});

app.get("/api", middleware, function(req, res){      
    connection.query('SELECT * FROM Spending WHERE user_id = ' + req.cookies.user.id, function (err, result) {
        if (err) res.sendStatus(400);
        return res.status(200).send({"items": result});
    });
});

app.delete("/api/:id", middleware, function(req, res){       
    const id = req.params.id;
    connection.query('DELETE FROM Spending WHERE spending_id=' + id 
                        + ' AND user_id=' + req.cookies.user.id, function (err, result) {
        if (err) res.sendStatus(400);
        if (result.affectedRows === 0)
            res.status(404).send({ message: 'Unable delete item' });
        else
            res.status(200).send({ message: 'Deleted item with id=' + id });       
    });
});

app.post("/api", upload.single('fileToUpload'), urlencodedParser, middleware, function (req, res) {
      
    if(!req.body) return res.sendStatus(400);     

    connection.query('INSERT Spending(user_id, sum, date, category, description, income, filename) VALUES (?,?,?,?,?,?,?)',
    [
    req.cookies.user.id, 
    req.body.sum * 100,
    req.body.date,
    req.body.category,
    req.body.description,
    req.body.type === 'income',
    req.file ? req.file.originalname : null
    ], function (err, result) {
        if (err) throw err;
        res.status(200).json({"spending_id": result.insertId});
    }); 
});

app.post("/api/users/register", upload.single('fileToUpload'), urlencodedParser, function (req, res) {
      
    if(!req.body) return res.sendStatus(400); 
    
    var isDuplicateEmail = false;
    connection.query('SELECT * FROM Users', function (err, result) {
        if (err) return res.sendStatus(400);

        result.forEach(item => {
            if (item.email === req.body.email) {
                isDuplicateEmail = true;
                return res.status(409).send({ message: 'Email ' + item.email + ' already exist.' });    
            }
        });

        if (!isDuplicateEmail) {
            const salt = bcrypt.genSaltSync(saltRounds);
            const passHash = bcrypt.hashSync(req.body.password, salt);
        
            connection.query('INSERT Users(name, email, password) VALUES (?,?,?)',
            [
            req.body.name,
            req.body.email,
            passHash
            ], function (err, result) {
                if (err) throw err;
                const token = jwt.sign({id: result.insertId, name: req.body.name}, jwtConfig.secretKey, {expiresIn: "1h"});

                res.cookie("token", token, {
                                httpOnly: true,
                                sameSite: "strict",
                                expires: new Date(Date.now() + 1 * 3600000)
                      });

                res.cookie("user", { name: req.body.name, id: result.insertId }, {
                        httpOnly: true,
                        sameSite: "strict",
                        expires: new Date(Date.now() + 1 * 3600000)
                });
                return res.status(201).send();

            }); 
        }
    });

});

app.post("/api/users/login", upload.single('fileToUpload'), urlencodedParser, function (req, res) {
      
    if(!req.body) return res.sendStatus(400); 

    connection.query('SELECT * FROM Users WHERE email = \'' + req.body.email + '\'',
    function (err, result) {
        if (err) return res.sendStatus(400);
        if (result.length === 0) {
            return res.status(403).send({ message: 'User not found.' });    
        } else {
            console.log(result);
            const isCorrectValue = bcrypt.compareSync(req.body.password, result[0].password);

            if (!isCorrectValue) {
                return res.status(400).send({ message: 'Invalid password.' });
            } else {
                const token = jwt.sign({id: result[0].id, name: result[0].name}, jwtConfig.secretKey, {expiresIn: "1h"});

                res.cookie("token", token, {
                                httpOnly: true,
                                sameSite: "strict",
                                expires: new Date(Date.now() + 1 * 3600000)
                      });

                res.cookie("user", { name: result[0].name, id: result[0].id }, {
                        httpOnly: true,
                        sameSite: "strict",
                        expires: new Date(Date.now() + 1 * 3600000)
                });
                return res.status(200).send({ user_name: result[0].name });
            }
        }
    });
});

app.post("/api/users/exit", upload.single('fileToUpload'), urlencodedParser, function (req, res) {
      
    if(!req.body) return res.sendStatus(400);   
    
    res.status(200);
    res.cookie('token', '', { maxAge: -1 });
    res.cookie('user', '', { maxAge: -1 });
    res.send();
});

app.put("/api", upload.single('fileToUpload'), urlencodedParser, middleware, function(req, res){
  
    if(!req.body) return res.sendStatus(400);
    
    console.log(req.body)
    if (req.file !== null) {
        connection.query('UPDATE Spending SET sum = ?, date = ?, category = ?, description = ?, income = ?, filename = ? WHERE spending_id = ?  AND user_id = ?',
            [
                req.body.sum * 100,
                req.body.date,
                req.body.category,
                req.body.description,
                req.body.type === 'income',
                req.file ? req.file.originalname : null,
                req.body.spending_id,
                req.cookies.user.id
            ], function (err, result) {
                if (err) throw err;
                res.status(200).send({ message: 'Update item with id=' + req.body.spending_id });
            }); 
    } else {
        connection.query('UPDATE Spending SET sum = ?, date = ?, category = ?, description = ?, income = ? WHERE spending_id = ?  AND user_id = ?',
        [
            req.body.sum * 100,
            req.body.date,
            req.body.category,
            req.body.description,
            req.body.type === 'income',
            req.body.spending_id, 
            req.cookies.user.id
        ], function (err, result) {
            if (err) throw err;
            res.status(200).send({ message: 'Update item with id=' + req.body.spending_id});
        }); 
    }
});

app.put("/api/deleteFile", upload.single('fileToUpload'), urlencodedParser, middleware, function(req, res){
  
    if(!req.body) return res.sendStatus(400);
    console.log(req.body)

    connection.query('UPDATE Spending SET filename = null WHERE spending_id = ?  AND user_id = ?',
        [
            req.body.spending_id,
            req.cookies.user.id
        ], function (err, result) {
            if (err) throw err;
            res.status(200).send({ message: 'File delete from item with id=' + req.body.spending_id});
        }); 

});

app.listen(port, () => {
    console.log('Listening on port ', port);
});