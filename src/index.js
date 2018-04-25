import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initializeDb from './db';
import middleware from './middleware';
import api from './api';
import config from './config.json';
import {socketing} from './socketing'
import {build} from './lib/build'

let app = express();

const port = process.env.PORT || 3333;
const host = process.env.HOST || 'localhost';

app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

// 3rd party middleware
app.use(cors({
	exposedHeaders: config.corsHeaders
}));

app.use(bodyParser.json({
	limit : config.bodyLimit
}));

// connect to db
initializeDb( db => {
  if (process.argv.findIndex((c) => c === 'build') > -1) {
    build(db)
  } else {
    var io = require('socket.io')(app.server);

    // internal middleware
    app.use(middleware({ config, db }));

    // api router
    app.use('/api', api({ config, db, io }));

    app.server.listen(process.env.PORT || config.port, () => {
      console.log(`Started on port ${app.server.address().port}`);
    });
    socketing({_db: db, _io: io})
  }
});

export default app;
