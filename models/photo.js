const mongoose = require('mongoose');
const moment = require('moment');

const Schema = mongoose.Schema;

const Photo = new Schema(
  {
    timestamp: { type: Date, default: Date.now(), required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visiblePublically: {type: Boolean, default: false, required: true },
    image: {type: String, required: true},
    labels: [{type:String, required:false}]
  },
);

Photo
  .virtual('formattedDate')
  .get(function () {
    return moment(this.timestamp).format('DD/MM/YYYY, h:mm a');
  });

module.exports = mongoose.model('Photo', Photo);