'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * Score Schema
 */

const ScoreSchema = new Schema({
  username: { type: String, default: '' },
  question: { type: String, default: '' },
  score: { type: Number, default: 0 },
  submitted: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'submitted' }
});

mongoose.model('Score', ScoreSchema);
