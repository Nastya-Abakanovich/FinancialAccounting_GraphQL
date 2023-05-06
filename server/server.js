const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser'); 
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const fs = require('fs');
var path = require('path');
const dbConfig = require("./config/db.config.js");
const jwtConfig = require("./config/jwt.config.js");
const bcrypt = require('bcrypt');
const saltRounds = 10;
var connection = null;

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
  scalar Upload

  type Token {
    userId: String!
    token: String!
  }

  type File {
    filename: String!
    file: String!
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
    login(email: String!, password: String!): Token!
    register(name: String!, email: String!, password: String!): Token!
    getData: [Spending!]   
    getFile(id: Int!): File   
  }

  type Mutation {
    deleteFile(id: Int!): Boolean!
    delete(id: Int!): Boolean!
    add(sum: Int!, category: String!, description: String!, date: String!, type: Boolean!, filename: String, fileToUpload: String): Spending
    update(sum: Int!, category: String!, description: String!, date: String!, type: Boolean!, spending_id: Int!, filename: String, fileToUpload: String): Spending
  }
  
`);

const root = {
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
    if (cookies && cookies.id) {
      await mysqlConnection();
      const [result] = await connection.execute('SELECT * FROM Spending WHERE user_id = ' + cookies.id);
      return result;   
    } else {
      return null;
    }
  },

  delete: async ({id}, req) => {
    console.log('delete');
    
    const cookies = req.cookies;
    if (cookies && cookies.id) {
      await mysqlConnection();
      const [selectResult] = await connection.execute('SELECT filename FROM Spending WHERE user_id = ' + cookies.id  
                                                      + ' AND spending_id = ' + id);
      const [result] = await connection.execute('DELETE FROM Spending WHERE spending_id=' + id 
                                                + ' AND user_id=' + cookies.id);
      if (result.affectedRows === 0)
        return false;
      else {
        try {
          if (selectResult[0].filename !== null) {
          // var fileName = './public/uploads/' + id + path.extname(selectResult[0].filename);
          fs.unlinkSync('./public/uploads/' + id + path.extname(selectResult[0].filename));
          console.log('file exists');
          }
        } catch {
          console.error('file does not exists');
        }
        return true;
      }  
    } else {
      return false;
    }
  },

  deleteFile: async ({id}, req) => {
    console.log('deleteFile');
    
    const cookies = req.cookies;
    if (cookies && cookies.id) {
      await mysqlConnection();
      const [selectResult] = await connection.execute('SELECT filename FROM Spending WHERE user_id = ' + cookies.id + ' AND spending_id = ' + id);
      const [result] = await connection.execute('UPDATE Spending SET filename = null WHERE spending_id = ?  AND user_id = ?',
        [
        id,
        cookies.id
        ]);
      console.log('Before delete file');
      try {
        fs.unlinkSync('./public/uploads/' + id + path.extname(selectResult[0].filename));
        console.log('After delete file');
        return true;
      } catch (err) {
        console.log('No After delete file');
        console.error(err);
        return true;
      }        
          
    } else {
      return false;
    }
  },

  add: async ({sum, category, description, date, type, filename, fileToUpload}, req) => {
      console.log('add');
      
      const cookies = req.cookies;
      if (cookies && cookies.id) {
        await mysqlConnection();
        try {
          const [result] = await connection.execute('INSERT Spending(user_id, sum, date, category, description, income, filename) VALUES (?,?,?,?,?,?,?)',
            [
                cookies.id, 
                sum * 100,
                new Date(date * 1),
                category,
                description,
                type,
                filename
            ]);

          if (fileToUpload !== null) {
            const buffer = Buffer.from(fileToUpload, 'base64');
            await fs.promises.writeFile('./public/uploads/' + result.insertId  + path.extname(filename), buffer);
          }; 

          return {
            user_id: cookies.id,
            spending_id: result.insertId,
            sum: sum,
            date: date,
            category: category,
            description: description,
            income: type,
            filename: filename
          } 
        } catch (err) {
          console.error(err);
          return null;
        }     
      } else {
        return null;
      }
    },

    getFile: async ({id}, req) => {
      console.log('getFile');
      
      const cookies = req.cookies;
      if (cookies && cookies.id) {
        await mysqlConnection();
        const [result] = await connection.execute('SELECT filename FROM Spending WHERE user_id = ' + cookies.id + ' AND spending_id = ' + id);
        return {filename: result[0].filename, 
                file: fs.readFileSync('./public/uploads/' + id + path.extname(result[0].filename)).toString('base64')};           
      } else {
        return null;
      }
    },

    update: async ({sum, category, description, date, type, spending_id, filename, fileToUpload}, req) => {
      console.log('update');
      
      const cookies = req.cookies;
      if (cookies && cookies.id) {
        await mysqlConnection();
        try {

          if (fileToUpload !== null) {
            const [selectResult] = await connection.execute('SELECT filename FROM Spending WHERE user_id = ' + cookies.id + ' AND spending_id = ' 
            + spending_id);

            if (selectResult[0].filename !== null) {
              fs.unlinkSync('./public/uploads/' + spending_id + path.extname(selectResult[0].filename));
            }

            const [result] = await connection.execute('UPDATE Spending SET sum = ?, date = ?, category = ?, description = ?, income = ?, filename = ? ' +
            'WHERE spending_id = ?  AND user_id = ?',
            [
              sum * 100,
              new Date(date * 1),
              category,
              description,
              type,
              filename,
              spending_id,
              cookies.id
            ]);
                
            const buffer = Buffer.from(fileToUpload, 'base64');
            await fs.promises.writeFile('./public/uploads/' + spending_id  + path.extname(filename), buffer); 
          } else {

            const [result] = await connection.execute('UPDATE Spending SET sum = ?, date = ?, category = ?, description = ?, income = ? ' +
            'WHERE spending_id = ?  AND user_id = ?',
            [
              sum * 100,
              new Date(date * 1),
              category,
              description,
              type,
              spending_id,
              cookies.id
            ]);   
          }

          return {
            user_id: cookies.id,
            spending_id: spending_id,
            sum: sum,
            date: date,
            category: category,
            description: description,
            income: type,
            filename: filename
          }
        } catch (err) {
          console.error(err);
          return null;
        }     
      } else {
        return null;
      }
    }
};

const app = express();
const port = 5000;

var corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true 
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.static('public'));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));

app.use('/graphql', (req, res, next) => {
  if (!req.body.query?.includes('login') && !req.body.query?.includes('register'))
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