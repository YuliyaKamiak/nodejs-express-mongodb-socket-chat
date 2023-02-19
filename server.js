const express = require('express')
const path = require('path')
const app = express()
const http = require('http')
const server = http.createServer(app)
const wss = require('socket.io').listen(server)
const db = require('./models')

require('./models/connection')

// parse application/json
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(function (_, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  )
  next()
})
app.use(express.static(path.join(__dirname, 'build')))
app.use(express.static(path.join(__dirname, 'upload')))

require('./auth/passport')

app.use('/api', require('./routes'))

app.use('*', (_req, res) => {
  const file = path.resolve(__dirname, 'build', 'index.html')
  res.sendFile(file)
})

app.use((err, _, res, __) => {
  console.log(err.stack)
  res.status(500).json({
    code: 500,
    message: err.message,
  })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, function () {
  console.log('Environment', process.env.NODE_ENV)
  console.log(`Server running. Use our API on port: ${PORT}`)
})

//wss code ------------------------

const connectUsers = {} //online users

wss.on('connection', (socket) => {
  const socketId = socket.id

  socket.on('users:connect', async (data) => {
    const user = { ...data, socketId, activeRoom: null }

    connectUsers[socketId] = user

    //trigger 'users:list' event on the client
    socket.emit('users:list', Object.values(connectUsers)) //Sending yourself all users who are online
    socket.broadcast.emit('users:add', user) // Send yourself (current connection) to other users
  })
  socket.on('message:add', async (data) => {
    const { senderId, recipientId } = data

    socket.emit('message:add', data) //send data to yourself client

    socket.broadcast.to(data.roomId).emit('message:add', data)
    await addHistory(senderId, recipientId, data.text)
  })
  socket.on('message:history', async (data) => {
    let currentChat = await db.getChatRoomByUsersId(data.userId, data.recipientId)
    if (currentChat) {
      socket.emit('message:history', currentChat.chatObjects)
    } else {
      socket.emit('message:history', [])
    }

  })
  socket.on('disconnect', (data) => {
    delete connectUsers[socketId]
    socket.broadcast.emit('users:leave', socketId)
  })
})

async function addHistory(senderId, recipientId, message) {
  const data = {
    senderId,
    recipientId,
    message
  }
  let currentChat = await db.getChatRoomByUsersId(senderId, recipientId)
  if (currentChat) {
    await db.addChatObjectByChatRoom(data)
  } else {
    await db.createChatRoom(data)
  }
}

module.exports = { app: app, server: server }
