const mongoose = require('mongoose')
const Schema = mongoose.Schema

const chatSchema = new Schema(
  {
    roomId: {
      type: String,
    },
    chatObjects: [{
      senderId: {
        type: String,
      },
      recipientId: {
        type: String,
      },
      text: {
        type: String,
      },
    }]
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)


const Chat = mongoose.model('chat', chatSchema)

module.exports = Chat
