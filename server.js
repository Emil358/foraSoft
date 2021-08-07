require('dotenv').config()
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server);
const path = require('path');
const { validate, version } = require('uuid');

const PORT = process.env.PORT || 3000;
const ACTIONS = require('./src/socket/actions');
const NODE_ENV = process.env.NODE_ENV || 'production';

const roomsInfo = new Map()
// в roomsInfo хранится информация о комнатах,
// где ключом выступает id комнаты, который был сформирован uuid, а значением обьект,
// в котором есть ключи roomname(string) и users(array),
// в котором каждый элемент это обьект с ключами username(string) и id(string)

const getClientRooms = () => {
  const roomsAdapter = Array.from(io.sockets.adapter.rooms.keys()).filter(roomId => validate(roomId) && version(roomId) === 4)
  const rooms = [];
  for (let entry of roomsInfo) {
    if(roomsAdapter.includes(entry[0])){
      rooms.push({
        roomId: entry[0],
        roomname: entry[1].roomname
      })
    }else{
      roomsInfo.delete(entry[0])
    }
  }
  return rooms;
}
// функция getClientRoom возвращает массив комнат в которых находятся users
// комната существует, если в ней есть хотя бы один user
// если в комнате был один пользователь, и он перезагрузил страницу, то комната удалится, это не ошибка
const shareRooms = () => {
  io.emit(ACTIONS.GET_LIST_ROOM, {
    rooms: getClientRooms()
  })
}
// shareRooms отправляет всем сокетам массив с комнатами

io.on('connection', socket => {

  socket.on(ACTIONS.GET_LIST_ROOM, shareRooms)
  // при присоединении пользователь сам отправляет запрос серверу на получение списка комнат,
  // это сделано для того, чтобы если пользователь выходит из комнаты, обновлялся список комнат

  const addNewUser = ({roomId, username}) => {
    if(roomsInfo.has(roomId)) {
      roomsInfo.get(roomId).users.push({
        username,
        userId: socket.id
      })
    } else {
      io.to(socket.id).emit(ACTIONS.NOT_FOUND_PAGE)
    }
  }

  // addNewUser проверяет существет ли комната, если существует, то добавляет пользователя в массив пользователей по ключу,
  // в противном случае отправлет пользователю событие о том, что комната не существует

  socket.on(ACTIONS.CREATE_NEW_ROOM, ({roomId, roomname, username}) => {
    roomsInfo.set(roomId, {
      roomname,
      users: []
    })

    addNewUser({roomId, username})
  })

  // ACTIONS.CREATE_NEW_ROOM обработчик события добавляет новый элемент в Map,
  // в котором ключом выступает roomId, а элементом обьект с ключами roomnme(string) и users(array)
  // и вызывает функцию addNewUser, передавая аргументы roomId и username

  socket.on(ACTIONS.ADD_NEW_USER, addNewUser);

  // ACTIONS.ADD_NEW_USER обработчик события вызывает функцию addNewUser, передавая аргументы roomId и username

  socket.on(ACTIONS.GET_USERNAME, ({roomId}) => {
    if(roomsInfo.has(roomId)){
      const clients = roomsInfo.get(roomId).users

      clients.forEach(user => {
        if(user.userId === socket.id) {
          io.to(socket.id).emit(ACTIONS.SET_USERNAME, {name: user.username})
        }
      })
    } else {
      socket.emit(ACTIONS.NOT_FOUND_PAGE)
    }
  })

  // ACTIONS.GET_USERNAME обработчик события проверяет существует ли комната в roomsInfo,
  // если существует, то находит пользователя в массиве пользователей, и отправляет ему username
  // в противном случае отправлет пользователю событие о том, что комната не существует

  const shareListUsers = (roomId) => {
    if(roomsInfo.has(roomId)){

      const users = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      roomsInfo.get(roomId).users = roomsInfo.get(roomId).users.filter(user => users.includes(user.userId));

      users.forEach(id => {
        io.to(id).emit(ACTIONS.GET_LIST_USERS,{
          usersList: roomsInfo.get(roomId).users,
        })
      })
    }
  }

  // функция shareListUsers принимает параметр roomId, и отправляет всем пользователям в этой комнате, новый список пользователей

  socket.on(ACTIONS.JOIN, data => {
    const {room: roomId} = data;
    const {rooms: joinedRooms} = socket;

    if(Array.from(joinedRooms).includes(roomId)) {
      return console.log(`You are alredy joined to room`);
    }

    const users = roomsInfo.get(roomId).users || [];

    users.forEach(user => {

      if(user.userId === socket.id) {
        return
      }

      io.to(user.userId)
        .emit(ACTIONS.ADD_PEER, {
          userId: socket.id,
          createOffer: false,
        });

      io.to(socket.id)
        .emit(ACTIONS.ADD_PEER, {
          userId: user.userId,
          createOffer: true,
        });
    })

    socket.join(roomId);
    shareListUsers(roomId);
    shareRooms();
  });

  // ACTIONS.JOIN обработчик события отправляет всем пользователям в этой комнате событие на p2p соединение
  // в последующем присоединяет пользователя к комнате, обновляет список пользователей в этой комнате, и отправляет всем сокетам новый список комнат

  socket.on(ACTIONS.SEND_MSG, data => {
    const {room: roomId} = data;
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
    clients.forEach(userId => {
      io.to(userId).emit(ACTIONS.GET_MSG, data)
    })
  });

  // ACTIONS.SEND_MSG обработчик события отправляет всем пользователям в комнате событие на новое сообщение

  socket.on(ACTIONS.SHARE_ICE, ({userId, iceCandidate}) => {
    io.to(userId).emit(ACTIONS.ICE_CANDIDATE, {
      userId: socket.id,
      iceCandidate,
    })
  });

  // ACTIONS.SHARE_ICE обработчик события отправляет пользователю событие на новый iceCandidate

  socket.on(ACTIONS.SHARE_SDP, ({userId, sessionDescription}) => {
    io.to(userId).emit(ACTIONS.SESSION_DESCRIPTION, {
      userId: socket.id,
      sessionDescription,
    })
  })

  // ACTIONS.SHARE_SDP обработчик события отправляет пользователю событие на новый sessionDescription

  const leaveRoom = () => {
    const {rooms} = socket

    Array.from(rooms)
      .filter(roomId => validate(roomId) && version(roomId) === 4)
      .forEach(roomId => {
        socket.leave(roomId)
        shareListUsers(roomId)

        if(!roomsInfo.get(roomId).users.length){
          roomsInfo.delete(roomId)
          return;
        }
        const users = roomsInfo.get(roomId).users;
        users.forEach(user => {
          io.to(user.userId)
            .emit(ACTIONS.REMOVE_PEER, {
              userId: socket.id
            });
          io.to(socket.id)
          .emit(ACTIONS.REMOVE_PEER, {
            userId: user.userId
          });
        })

      })
    shareRooms()
  };

  // функция leaveRoom находит комнаты в которых есть сокет, и отправляет всем сокетам в этих комнатах событие на отключение p2p соединения
  // обновляет список пользователей и список комнат

  socket.on(ACTIONS.LEAVE, leaveRoom);
  socket.on("disconnect", () => {
    let clients = [];
    let roomId;

    for (let room_id of roomsInfo.keys()) {
      roomsInfo.get(room_id).users
        // eslint-disable-next-line no-loop-func
        .forEach((user) => {
          if(user.userId === socket.id) {
            clients = roomsInfo.get(room_id).users;

            roomId = room_id;
          }
          if(
            !roomsInfo.get(room_id).users.length ||
            (roomsInfo.get(room_id).users[0].userId === socket.id &&
            roomsInfo.get(room_id).users.length === 1)
          ){
            roomsInfo.delete(room_id);
          }
        })
    }

    clients
      .filter(user => user.userId !== socket.id)
      .forEach(user => {
        io.to(user.userId)
          .emit(ACTIONS.REMOVE_PEER, {
            userId: socket.id
          })
        io.to(user.userId)
          .emit(ACTIONS.GET_LIST_USERS, {
            usersList: clients.filter(user => user.userId !== socket.id)
          })
      })
    shareListUsers(roomId)
    shareRooms()
  })
  // action 'disconect' обработчик события
  // так как сокет отсоединился и список комнат, в которых есть сокет очистился
  // то обработчик события находит пользователя в roomsInfo, и всем пользователям отправляем собитые на отключение p2p соединения
  // если пользователей в комнате нет никого, кроме самого сокета, то удаляет комнату
  // обновляет список комнат и список пользователей
})


if(NODE_ENV === 'production'){

  const publicPath = path.join(__dirname, 'build')
  const client = path.join(__dirname, 'build', 'index.html');

  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    res.sendFile(client)
  })

}
server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
})
