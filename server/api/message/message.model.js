'use strict';

import mongoose from 'mongoose';

var MessageSchema = new mongoose.Schema({
  tweet_id: String,
  user_id: String,
  text : String,
  channels : [String],
  keywords : [String],
  type: String,
  in_reply_to_tweet_id: String,
  in_reply_to_user_id: String,
  created_at: Date,
  lang: String,
  quoted_status_id: String,
  timeCollected: Date,
  thing: {type: mongoose.Schema.Types.ObjectId, ref: 'Thing'}

  //retweeted_status
});

export default mongoose.model('Message', MessageSchema);
