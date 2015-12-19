'use strict';

const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('config');
const PORT = process.env['PORT'] || config.get('port') || 3000;

/**
 * Load models
 */
const loadModels = require('./load_models');
loadModels();

const initPassport = require('./passport');
const initExpress = require('./express');
const setRoutes = require('./routes.js');

/**
 * Create App
 */
let app = express();

initPassport(passport);
initExpress(app, passport);
setRoutes(app, passport);

connect()
  .on('error', console.log)
  .on('disconnected', connect)
  .once('open', listen);

function listen () {
  app.listen(PORT);
  console.log(`Express app started on port ${PORT}.`);
}

function connect () {
  let options = { server: { socketOptions: { keepAlive: 1 } } };
  let db = (process.env['MONGO_PORT_27017_ADDR'] && process.env['$MONGO_PORT_27017_TCP_PORT']) ?
    `mongodb://${process.env['$MONGO_PORT_27017_TCP_ADDR']}:${process.env['$MONGO_PORT_27017_TCP_PORT']}/yehd`:
    config.get('db');
  return mongoose.connect(db, options).connection;
}
