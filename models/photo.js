const mongoose = require('mongoose');
const moment = require('moment');

const Schema = mongoose.Schema;

const PhotoSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now(), required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visiblePublically: {type: Boolean, default: false, required: true },
    image: {type: String, required: true},
    tags: [{type:String, required:false}]
  },
);

PhotoSchema
  .virtual('formattedDate')
  .get(function () {
    return moment(this.timestamp).format('MMM Do YY');
  });

PhotoSchema
  .virtual('formattedTime')
  .get(function () {
    return moment(this.timestamp).calendar();
  });

PhotoSchema
.virtual('url')
.get(function(){
  return '/photo/' + this._id;
});

module.exports = mongoose.model('Photo', PhotoSchema);