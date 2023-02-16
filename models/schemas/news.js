const mongoose = require('mongoose')
const Schema = mongoose.Schema

const newsSchema = new Schema(
  {
    created_at: {
      type: Date,
    },
    text: {
      type: String,
    },
    title: {
      type: String,
    },
    user: {
      type: Object,
    },
    permission: {
      chat: { C: Boolean, R: Boolean, U: Boolean, D: Boolean },
      news: { C: Boolean, R: Boolean, U: Boolean, D: Boolean },
      settings: { C: Boolean, R: Boolean, U: Boolean, D: Boolean },
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)


const News = mongoose.model('news', newsSchema)

module.exports = News
