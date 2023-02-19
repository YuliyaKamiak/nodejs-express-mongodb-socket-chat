// const mongoose = require('mongoose')
const User = require('./schemas/user')
const News = require('./schemas/news')
const Chat = require('./schemas/chat')
const helper = require('../helpers/serialize')

module.exports.getUserByName = async (userName) => {
  return User.findOne({ userName })
}
module.exports.getUserById = async (id) => {
  return User.findById({ _id: id })
}
module.exports.getUsers = async () => {
  return User.find()
}

module.exports.createUser = async (data) => {
  const { username, surName, firstName, middleName, password } = data
  const newUser = new User({
    userName: username,
    surName,
    firstName,
    middleName,
    image:
      'https://icons-for-free.com/iconfiles/png/512/profile+user+icon-1320166082804563970.png',
    permission: {
      chat: { C: true, R: true, U: true, D: true },
      news: { C: true, R: true, U: true, D: true },
      settings: { C: true, R: true, U: true, D: true },
    },
  })
  newUser.setPassword(password)
  const user = await newUser.save()
  return user
}

module.exports.updateUser = async (data) => {
  const { username, surName, firstName, middleName, newPassword, image } = data
  const user = await User.findOne({ userName: username })
  const hash = user.setPassword(newPassword)
  const updatedUser = await User.findOneAndUpdate({ userName: username }, { surName, firstName, middleName, hash, image })
  return updatedUser
}

module.exports.updateUserPermission = async (data) => {
  const { username, permission } = data
  const updatedUser = await User.findOneAndUpdate({ userName: username }, {permission})
  return updatedUser
}

module.exports.deleteUserById = async (id) => {
  return User.findOneAndDelete({ _id: id })
}

module.exports.createNews = async (data) => {
  const { title, text, created_at, userId } = data
  const newNews = new News({
    title,
    text,
    created_at,
    userId,
    permission: {
      chat: { C: true, R: true, U: true, D: true },
      news: { C: true, R: true, U: true, D: true },
      settings: { C: true, R: true, U: true, D: true },
    },
  })
  const news = await newNews.save()
  return news
}

module.exports.getAllNews = async () => {
  return News.find()
}

module.exports.deleteNewsById = async (id) => {
  return News.findOneAndDelete({ _id: id })
}

module.exports.updateNewsById = async (data) => {
  const { id, title, text } = data
  return News.findOneAndUpdate({ _id: id }, {title, text})
}

module.exports.createChatRoom = async(data) => {
  const { roomId, senderId, recipientId, message } = data
  const newChatRoom = new Chat({
    roomId,
    chatObjects: [
      {
        senderId,
        recipientId,
        text: message,
      }
    ]
  })
  const chatRoom = await newChatRoom.save()
  return chatRoom
}

module.exports.addChatObjectByChatRoom = async(data) => {
  const { senderId, recipientId, message } = data

  let chatRoom = await this.getChatRoomByUsersId(senderId, recipientId)
  return await Chat.findOneAndUpdate({ _id: chatRoom._id },{ $push: { chatObjects: { senderId, recipientId, text: message } }})
}

module.exports.getChatRoomByUsersId = async (senderId, recipientId) => {
  let findStraight = await Chat.findOne({    chatObjects : { $elemMatch: {  senderId : senderId, recipientId: recipientId } }   })
  if (findStraight) return findStraight

  let findBack = await Chat.findOne({    chatObjects : { $elemMatch: {  senderId : recipientId, recipientId: senderId } }   })
  return findBack
}
