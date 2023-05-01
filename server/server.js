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
const cookie = require("cookie");
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

  type Spending {
    user_id: Int!
    spending_id: Int!
    sum: Int!
    date: String!
    category: String!
    description: String!
    income: Boolean!
    filename: String
  }

  type Query {
    hello: String
    login(email: String!, password: String!): Token!
    register(name: String!, email: String!, password: String!): Token!
    getData: [Spending!]
  }
  
`);

const root = {
  hello: () => 'Привет, мир!',

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
  },

  getData: async (args, req) => {
    console.log('getData');
    
    const cookies = req.cookies;
    console.log(cookies);
    if (cookies && cookies.id) {
      await mysqlConnection();
      const [result] = await connection.execute('SELECT * FROM Spending WHERE user_id = ' + cookies.id);
      console.log(result[0]); 
      return result;   
    } else {
      return null;
    }
  }

};

// const authMiddleware = (socket, next) => {
//   console.log('checkAuth.');

//   try {
//       const cookies = cookie.parse(socket.handshake?.headers?.cookie === undefined ? "" : socket.handshake.headers.cookie);
//       if (cookies && cookies.token) {      
//           const decoderData = jwt.verify(cookies.token, jwtConfig.secretKey);            
//           console.log(decoderData);
//           next();             
//       } else {
//           next(new Error('Authentication error'));
//       }
//   } catch (e) {
//       console.log(e);
//       next(new Error('Authentication error'));
//   }     
// };


const app = express();
const port = 5000;
const urlencodedParser = express.urlencoded({extended: false});

var corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true // <-- REQUIRED backend setting
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());

app.use('/graphql', (req, res, next) => {
  if (!req.body.query.includes('login') && !req.body.query.includes('register'))
  {
     console.log('checkAuth.');
    try {
      const cookies = req.cookies;
      console.log('auth: ' + cookies);
      if (cookies && cookies.token) {     
        const decoderData = jwt.verify(cookies.token, jwtConfig.secretKey);            
        console.log(decoderData);
        next();             
      } else {
        return res.sendStatus(403);
      }
    } catch (e) {
      console.log(e);
      return res.sendStatus(403);
    }     
  } else {
    next();
  }
});

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