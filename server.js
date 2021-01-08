const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const {getCurrentUser, userJoin, userLeave, getRoomUsers} = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)


//Set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'Walrus Bot';


//Run when client connects
io.on('connection', socket => {

  socket.on('joinRoom', ({username, room})=> {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    //Welcome current user
  socket.emit('message', formatMessage(botName, 'Welcome! Send message what do you thing!'))

  //Broadcast when a user connects
  socket.broadcast.to(user.room)
  .emit('message', formatMessage(botName, `A ${user.username} has joined the chat`));

    //send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users:getRoomUsers(user.room)
    })

  })

  //listen for chatmessage
  socket.on('chatMessage', (msg)=> {
    const user = getCurrentUser(socket.id)

    io.to(user.room).emit('message', formatMessage(user.username, msg))
  })

  //Runs when client disconnects
  socket.on('disconnect', ()=>{
    const user = userLeave(socket.id)

    if(user){
      io.to(user.room).emit('message', formatMessage(botName, `A ${user.username} has left the chat`))

      //send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users:getRoomUsers(user.room)
    })
    }
  })
})

const PORT = 4500 || process.env.PORT

server.listen(PORT, ()=> console.log(`server run on ${PORT}`))
