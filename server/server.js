const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const multer = require('multer');
const bodyParser = require('body-parser'); 
// const mysql = require("mysql2");
const mysql = require('mysql2/promise');
const dbConfig = require("./config/db.config.js");
const jwtConfig = require("./config/jwt.config.js");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cookieParser = require('cookie-parser');
var connection = null;

// const connection = mysql.createConnection({
//     host: dbConfig.host,
//     user: dbConfig.user,
//     database: dbConfig.database,
//     password: dbConfig.password
// });

// connection.connect(function(err){
//     if (err) {
//         return console.error("Ошибка: " + err.message);
//     }
//     else {
//         console.log("Подключение к серверу MySQL успешно установлено");    
//     }
// }); 

async function  mysqlConnection() {
  if (connection === null) {
   connection = await mysql.createConnection({ 
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password
    });
  }
}

const schema = buildSchema(`
  type Token {
    userId: String!
    token: String!
  }

  type Query {
    hello: String
    login(email: String!, password: String!): Token!
    register(name: String!, email: String!, password: String!): Token!
  }
  
`);

const root = {
  hello: () => 'Привет, мир!',
//   login: ({ email, password }) => {
//     console.log('login');
//     var returnToken = {userId: '-5', token: 'Login error'}
//     try {
//     connection.query('SELECT * FROM Users WHERE email = \'' + email + '\'',
//                     function (err, result) {
//         if (err) returnToken = {userId: '-1', token: 'Login error'};
        
//         if (result.length === 0) {
//           returnToken.userId = '-1';
//           returnToken = {userId: '-1', token: 'User not found'};    
//         } else {
//           const isCorrectValue = bcrypt.compareSync(password, result[0].password);

//           if (!isCorrectValue) {
            
//             returnToken = {userId: '-1', token: 'Invalid password'};  
//             console.log(returnToken); 
//             console.log('3');   
//           } else {
//             const token = jwt.sign({id: result[0].id, name: result[0].name}, jwtConfig.secretKey, {expiresIn: "1h"});
//             console.log('2');

//             returnToken = {userId: 'id=' + result[0].id, token: 'token=' +  token}   
//             console.log(returnToken);         
//           }
         
//         }
        
//     }); 
  
//     console.log(returnToken);
//     return {userId: returnToken.userId, token: returnToken.token}
//   }
//   catch (e) {
//     console.log(e);
//   }
// }

login: async ({ email, password }) => {
  console.log('login');
  
  try {
    await mysqlConnection();
    const [result] = await connection.execute('SELECT * FROM Users WHERE email = \'' + email + '\'');
            
    if (result.length === 0) {
      return {userId: '-1', token: 'User not found'};
    }
      
    const isCorrectValue = bcrypt.compareSync(password, result[0].password);

    if (!isCorrectValue) {  
      return {userId: '-1', token: 'Invalid password'};   
    } else {
      const token = jwt.sign({id: result[0].id, name: result[0].name}, jwtConfig.secretKey, {expiresIn: "1h"});
      return {userId: 'id=' + result[0].id, token: 'token=' +  token}          
    }
  }
  catch (e) {
    console.log(e);
  }
},

register: async ({ name, email, password }) => {
  console.log('register');
  
  try {
    await mysqlConnection();
    const [result] = await connection.execute('SELECT * FROM Users WHERE email = \'' + email + '\'');
          
    if (result.length !== 0) {
      return {userId: '-1', token: 'Email already exist'};
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const passHash = bcrypt.hashSync(password, salt);

    const [insertUser] = await connection.execute('INSERT Users(name, email, password) VALUES (?,?,?)', 
    [
      name,
      email,
      passHash
    ]);

    const token = jwt.sign({id: insertUser.insertId, name: name}, jwtConfig.secretKey, {expiresIn: "1h"});
    return {userId: 'id=' + insertUser.insertId, token: 'token=' +  token} 
  }
  catch (e) {
    console.log(e);
  }
}

};


const app = express();
const port = 5000;
const urlencodedParser = express.urlencoded({extended: false});

app.use(cors());
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true, 
}));

app.listen(port, () => {
  console.log('Сервер GraphQL запущен на порте ' + port);
});





// const storage = multer.diskStorage ({
//     destination: (req, file, cb) =>{
//         cb(null, "public/uploads");
//     },
//     filename: (req, file, cb) =>{
//         cb(null, file.originalname);
//     }
// })
// const upload = multer({storage: storage});

// function middleware (req, res, next) {
//     if (req.method === "OPTIONS") {
//         next();
//     }

//     try {
//         var cookies = req.cookies; 

//         if (cookies && cookies.token) {
//             const decoderData = jwt.verify(cookies.token, jwtConfig.secretKey);            
//             console.log(decoderData);
//             console.log('--------------');
//             next();
//         } else {
//             return res.status(401).send({message: "Пользователь не авторизован"});
//         }   
//     } catch (e) {
//         console.log(e);
//         return res.status(401).send({message: "Пользователь не авторизован"});
//     }
// }



// app.use(bodyParser.json());
// app.use(cookieParser());
// app.use(express.static('public'));

// app.get('/api/:filename', (req, res) => {
//     res.status(200).sendFile(__dirname + '/public/uploads/' + req.params.filename, (err, file) => {
//         if (err) 
//             res.sendStatus(404)
//         else 
//             res.end(file);
//       });
// });

// app.get("/api", middleware, function(req, res){      
//     connection.query('SELECT * FROM Spending WHERE user_id = ' + req.cookies.user.id, function (err, result) {
//         if (err) res.sendStatus(400);
//         return res.status(200).send({"items": result});
//     });
// });

// app.delete("/api/:id", middleware, function(req, res){       
//     const id = req.params.id;
//     connection.query('DELETE FROM Spending WHERE spending_id=' + id 
//                         + ' AND user_id=' + req.cookies.user.id, function (err, result) {
//         if (err) res.sendStatus(400);
//         if (result.affectedRows === 0)
//             res.status(404).send({ message: 'Unable delete item' });
//         else
//             res.status(200).send({ message: 'Deleted item with id=' + id });       
//     });
// });

// app.post("/api", upload.single('fileToUpload'), urlencodedParser, middleware, function (req, res) {
      
//     if(!req.body) return res.sendStatus(400);     

//     connection.query('INSERT Spending(user_id, sum, date, category, description, income, filename) VALUES (?,?,?,?,?,?,?)',
//     [
//     req.cookies.user.id, 
//     req.body.sum * 100,
//     req.body.date,
//     req.body.category,
//     req.body.description,
//     req.body.type === 'income',
//     req.file ? req.file.originalname : null
//     ], function (err, result) {
//         if (err) throw err;
//         res.status(200).json({"spending_id": result.insertId});
//     }); 
// });

// app.post("/api/users/register", upload.single('fileToUpload'), urlencodedParser, function (req, res) {
      
//     if(!req.body) return res.sendStatus(400); 
    
//     var isDuplicateEmail = false;
//     connection.query('SELECT * FROM Users', function (err, result) {
//         if (err) return res.sendStatus(400);

//         result.forEach(item => {
//             if (item.email === req.body.email) {
//                 isDuplicateEmail = true;
//                 return res.status(409).send({ message: 'Email ' + item.email + ' already exist.' });    
//             }
//         });

//         if (!isDuplicateEmail) {
//             const salt = bcrypt.genSaltSync(saltRounds);
//             const passHash = bcrypt.hashSync(req.body.password, salt);
        
//             connection.query('INSERT Users(name, email, password) VALUES (?,?,?)',
//             [
//             req.body.name,
//             req.body.email,
//             passHash
//             ], function (err, result) {
//                 if (err) throw err;
//                 const token = jwt.sign({id: result.insertId, name: req.body.name}, jwtConfig.secretKey, {expiresIn: "1h"});

//                 res.cookie("token", token, {
//                                 httpOnly: true,
//                                 sameSite: "strict",
//                                 expires: new Date(Date.now() + 1 * 3600000)
//                       });

//                 res.cookie("user", { name: req.body.name, id: result.insertId }, {
//                         httpOnly: true,
//                         sameSite: "strict",
//                         expires: new Date(Date.now() + 1 * 3600000)
//                 });
//                 return res.status(201).send();

//             }); 
//         }
//     });

// });

// app.post("/api/users/exit", upload.single('fileToUpload'), urlencodedParser, function (req, res) {
      
//     if(!req.body) return res.sendStatus(400);   
    
//     res.status(200);
//     res.cookie('token', '', { maxAge: -1 });
//     res.cookie('user', '', { maxAge: -1 });
//     res.send();
// });

// app.put("/api", upload.single('fileToUpload'), urlencodedParser, middleware, function(req, res){
  
//     if(!req.body) return res.sendStatus(400);
    
//     console.log(req.body)
//     if (req.file !== null) {
//         connection.query('UPDATE Spending SET sum = ?, date = ?, category = ?, description = ?, income = ?, filename = ? WHERE spending_id = ?  AND user_id = ?',
//             [
//                 req.body.sum * 100,
//                 req.body.date,
//                 req.body.category,
//                 req.body.description,
//                 req.body.type === 'income',
//                 req.file ? req.file.originalname : null,
//                 req.body.spending_id,
//                 req.cookies.user.id
//             ], function (err, result) {
//                 if (err) throw err;
//                 res.status(200).send({ message: 'Update item with id=' + req.body.spending_id });
//             }); 
//     } else {
//         connection.query('UPDATE Spending SET sum = ?, date = ?, category = ?, description = ?, income = ? WHERE spending_id = ?  AND user_id = ?',
//         [
//             req.body.sum * 100,
//             req.body.date,
//             req.body.category,
//             req.body.description,
//             req.body.type === 'income',
//             req.body.spending_id, 
//             req.cookies.user.id
//         ], function (err, result) {
//             if (err) throw err;
//             res.status(200).send({ message: 'Update item with id=' + req.body.spending_id});
//         }); 
//     }
// });

// app.put("/api/deleteFile", upload.single('fileToUpload'), urlencodedParser, middleware, function(req, res){
  
//     if(!req.body) return res.sendStatus(400);
//     console.log(req.body)

//     connection.query('UPDATE Spending SET filename = null WHERE spending_id = ?  AND user_id = ?',
//         [
//             req.body.spending_id,
//             req.cookies.user.id
//         ], function (err, result) {
//             if (err) throw err;
//             res.status(200).send({ message: 'File delete from item with id=' + req.body.spending_id});
//         }); 

// });

// app.listen(port, () => {
//     console.log('Listening on port ', port);
// });