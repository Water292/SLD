'use strict';

import mongoose from 'mongoose';

var StatSchema = new mongoose.Schema({
  created_at: {type: Date, required: true, min: Date('2016-01-01')},
  level: {type: Number, required: true, min:1, max: 2},
  data: {type: mongoose.Schema.Types.Mixed, default: []}
});

var ThingSchema = new mongoose.Schema({
  name: {type: String, required: true, trim: true},
  status: {type: String, trim: true},
  created_at: {type: Date, min: Date('2016-01-01'), required: true},
  end_at: {type: Date, required: true},
  duration: {type: Number, min: 1, required: true},
  keywords: {type: String, default: [] },
  intervalTime: {type: Number, min: 1, required: true},
  IntervalType: {type: String, required: true},
  stats: [StatSchema],
  levels: {type: Number, max: 2, min: 1, required: true}
});

export default mongoose.model('Thing', ThingSchema);
