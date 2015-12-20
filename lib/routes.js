'use strict';

const co = require('co');
const promisifyAll = require('bluebird').promisifyAll;
const fs = promisifyAll(require('fs'));
const path = require('path');

const mongoose = require('mongoose');
const User = mongoose.model('User');
const Score = mongoose.model('Score');
const Errors = require('./errors');
const sha3_512 = require('js-sha3').sha3_512;

const appRoot = require('app-root-path');
const questionsPath = appRoot + '/questions';

const START = new Date(process.env['START_DATE'] || Date.now());
const END = new Date(process.env['END_DATE'] || 100000000 * 60 * 60 * 24 * 1000);

/*
 *  Generic require login routing middleware
 */

let requiresLogin = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  else return next(new Errors.Login('Login is required.'));
};

let checkCompetitionTime = (req, res, next) => {
  let now = Date.now();
  if (START <= now && now <= END) return next();
  else return next(new Errors.API('It is not on competition time.'));
};

let checkStartedCompetition = (req, res, next) => {
  let now = Date.now();
  if (START <= now) return next();
  else return next(new Errors.API('It is not on competition time.'));
};

/**
 * Expose routes
 */

module.exports = function (app, passport) {

  app.get('/questionList.json', checkStartedCompetition, (req, res, next) => { co(function*() {
    let filesAndFolders = yield fs.readdirAsync(questionsPath);
    let folders = filesAndFolders.filter((file) => {
      let stat = fs.statSync(path.resolve(questionsPath, file));
      return stat.isDirectory();
    });
    folders = folders.filter((f) => f.match(/^[^-]+-[^-]+-.+$/));
    res.json(folders);
  }).catch(next); });

  // user routes
  app.get('/api/status', (req, res) => {
    res.json({'status': 'ok'});
  });

  app.post('/api/auth',
    passport.authenticate(
      'local',
      {
        failureRedirect: '/api/error/auth'
      }
    ),
    (req, res) => res.json({'status': 'ok'})
  );

  app.post('/api/signup', (req, res, next) => { co(function*(){
    const user = new User(req.body);
    yield user.save();
    res.json({'status': 'ok'});
  }).catch(next); });

  app.get('/api/user', requiresLogin, (req, res, next) => { co(function*() {
    res.json({
      'status': 'ok',
      'user': Object.assign(req.user, { _id: undefined })
    });
  }).catch(next); });

  app.get('/api/users', (req, res, next) => { co(function*() {
    let users = yield User.find().select('username score -_id').exec();
    res.json({'status': 'ok', 'users': users});
  }).catch(next); });

  app.get('/api/scores', (req, res, next) => { co(function*() {
    let data = yield Score.find()
      .select('username score question submitted -_id')
      .sort({ submitted: 'desc' }).exec();
    res.json({'status': 'ok', 'scores': data});
  }).catch(next); });

  app.post('/api/scores', (req, res, next) => { co(function*() {
    let data = yield Score.find(req.body)
      .select('username score question submitted -_id')
      .sort({ submitted: 'desc' }).exec();
    res.json({'status': 'ok', 'scores': data});
  }).catch(next); });

  app.post('/api/submit', requiresLogin, checkCompetitionTime, (req, res, next) => { co(function*() {
    if (!req.get('Content-Type').includes('application/json')) {
      throw new Errors.BadRequest('Should to set "Content-Type: application/json".');
    }
    if (!req.body.question || !req.body.flag) {
      throw new Errors.BadRequest('Require question name and flag.');
    }

    let questionPath = path.resolve(questionsPath, req.body.question);
    if (!questionPath.includes(questionsPath)) {
      throw new Errors.BadRequest('Invalid question name.');
    }
    yield fs.statAsync(questionPath)
      .catch(() => { throw new Errors.NotFound('Question is not found.'); });

    let flagPath = path.resolve(questionPath, 'flag.sha3-512');
    let trueFlagHash = yield fs.readFileAsync(flagPath)
      .then((hash) => hash.toString().replace(/\s/g, '').toLowerCase())
      .catch((err) => {
        console.error(err.stack || err);
        throw new Errors.Internal();
      });

    let userFlagHash = sha3_512(req.body.flag).replace(/\s/g, '').toLowerCase();

    if (trueFlagHash === userFlagHash) {
      let questionName = path.relative(questionsPath, questionPath).replace(/\//g, '');
      let score = parseInt(questionName.split('-')[1], 10) || 0;

      if (!(yield Score.findOne({ question: questionName }).exec())) {
        score = parseInt(score * 1.1, 10);
      }

      let query = {
        username: req.user.username,
        question: questionName
      };

      let scoreInfo = yield Score.findOne(query).exec();

      if (!scoreInfo) {
        yield Score.findOneAndUpdate(
          query,
          { score: score },
          { upsert: true }
        ).exec();
        yield User.findByIdAndUpdate(
          req.user.id,
          { score: req.user.score + score }
        ).exec();
        res.json({'status': 'ok'});
      } else {
        res.json({'status': 'ok', 'message': 'Already submitted.'});
      }
    } else {
      throw new Errors.InvalidFlag();
    }

  }).catch(next); });

  app.get('/api/logout', (req, res) => {
    req.logout();
    res.json({'status': 'ok'});
  });

  app.get('/api/error/:reason', (req, res, next) => {
    if (req.params.reason === 'auth') {
      next(new Errors.Login('Username or Password is invalid.'));
    } else {
      next(new Errors.API('Internal Server Error.'));
    }
  });

  app.all('/api/teapot', (req, res, next) => {
    next(new Errors.Teapot());
  });

  app.all('/api/*', function(req, res, next) {
    next(new Errors.NotImplemented());
  });

  app.all('*', function(req, res, next) {
    next(new Errors.NotFound());
  });

  // Error Handling
  app.use(function(err, req, res, next) {
    if (err.statusCode) {
      res.status(err.statusCode);
    } else if (err.name === 'ValidationError') {
      res.status(400);
      let message = [];
      for (let key in err.errors) {
        message.push(err.errors[key].message);
      }
      err.message = message.join('\n');
    } else {
      res.status(500);
    }

    res.json({
      status: 'error',
      errorName: err.name,
      message: err.message
    });

    next();
  });
};
