// const mongoose = require('mongoose')
const User = require('./schemas/user')
const News = require('./schemas/news')
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
  const updatedUser = await User.updateOne({ userName: username }, { surName, firstName, middleName, hash, image })
  return updatedUser
}

module.exports.updateUserPermission = async (data) => {
  const { username, permission } = data
  const updatedUser = await User.findOneAndUpdate({ userName: username }, {permission})
  return updatedUser
}

module.exports.deleteUserById = async (id) => {
  return User.deleteOne({ _id: id })
}

module.exports.createNews = async (data) => {
  const { title, text, created_at, user } = data
  const newNews = new News({
    title,
    text,
    created_at,
    user,
    permission: {
      chat: { C: true, R: true, U: true, D: true },
      news: { C: true, R: true, U: true, D: true },
      settings: { C: true, R: true, U: true, D: true },
    },
  })
  const news = await newNews.save()
  return news
}

module.exports.getAllNews = async (userName) => {
  return News.find({ "user.username": userName })
}

module.exports.deleteNewsById = async (id) => {
  return News.deleteOne({ _id: id })
}

module.exports.updateNewsById = async (data) => {
  const { id, title, text } = data
  return News.findOneAndUpdate({ _id: id }, {title, text})
}
