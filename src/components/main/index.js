import './main.css';
import { useState, useRef, useEffect } from "react";
import { useHistory } from "react-router";
import { v4 } from 'uuid';
import socket from "../../socket";
import ACTIONS from "../../socket/actions";

export default function Main () {
  const history = useHistory()
  const [rooms, setRooms] = useState([]);
  const [isJoin, setJoin] = useState(true)
  const rootNode = useRef();
  const inputUsernameForJoin = useRef();
  const inputUsernameForCreate = useRef();
  const inputRoomname = useRef();
  const selectRef = useRef()
  const contentRef = useRef()

  useEffect(() => {
    socket.emit(ACTIONS.GET_LIST_ROOM)
  }, [])

  // ACTIONS.GET_LIST_ROOM отправляет запрос на сервер на получение списка комнат

  useEffect(() => {
    socket.on(ACTIONS.GET_LIST_ROOM, ({rooms = []} = {}) => {
        if(rootNode.current) {
          setRooms(rooms)
        }
    })
  }, [])

  // ACTIONS.GET_LIST_ROOM обработчик события, при получения списка комнат вызывает функцию setRooms, в которую передвет аргумент rooms

  const createNewRoom = (username, roomname) => {
    if (username && roomname) {
      const newRoomId = v4()
      socket.emit(ACTIONS.CREATE_NEW_ROOM, {
        roomId: newRoomId,
        username,
        roomname,
      })
      history.push(`/room/${newRoomId}`);
      inputRoomname.current.value = '';
      inputUsernameForCreate.current.value = '';
    }
  }

  // функция createNewRoom отправляет событие на сервер на добавление новой комнаты и отправляет пользователя в комнату по новому roomId
  // и очищает inputs

  const join = (roomId, username) => {
    if (username) {
      socket.emit(ACTIONS.ADD_NEW_USER, {
        roomId,
        username
      })
      history.push(`/room/${roomId}`)
      inputUsernameForJoin.current.value = '';
    }
  }

  // функция join отправляет событие на сервер на добавление нового пользователя в комнату и отправляет пользователя в комнату
  // и очищает inputs

  const getContentRefJoin = () => {
    return(
      <>
        <div>
          <label htmlFor='join_username'>Username:</label>
          <input
            id='join_username'
            className='join_input'
            type='text'
            ref={inputUsernameForJoin}
          />
        </div>
        <div>
          <label>Room: </label>
          <select
            className='join_select'
            ref={selectRef}
          >
            {rooms.map(room => (
              <option
                id={room.roomId}
                key={room.roomId}
              >
                {room.roomname}
              </option>
            ))}
          </select>
        </div>
        <button
          className='join_btn'
          onClick={() => {
            if(selectRef.current.selectedOptions.length) {
              join(selectRef.current.selectedOptions[0].id, inputUsernameForJoin.current.value.trim())
            }
        }}>join</button>
      </>
    )
  }

  // функция getContentRefJoin предназначена для отрисовки контента в окне для добавления пользователя в комнату

  const getContentRefCreate = () => {
    return(
      <>
        <div>
          <label htmlFor='create_username'>Username:</label>
          <input
            id='create_username'
            className='create_input'
            type='text'
            ref={inputUsernameForCreate}
          />
        </div>
        <div>
          <label htmlFor='create_roomname'>Roomname:</label>
          <input
            id='create_roomname'
            className='create_input'
            type='text'
            ref={inputRoomname}
          />
        </div>
        <button
          className='create_btn'
          onClick={() => {
          createNewRoom(inputUsernameForCreate.current.value.trim(), inputRoomname.current.value.trim())
        }}>create</button>
      </>
    )
  }

  // функция getContentRefCreate предназначена для отрисовки контента в окне для создания комнаты

  return (
     <div className='wrapper' ref={rootNode}>
      <h1 className='logo'>Rooms</h1>
      <div className='window'>
        <button
          onClick={() => {
            setJoin(true)
          }}
          className='window_btn'
        >JOIN</button>
        <button
          onClick={() => {
            setJoin(false)
          }}
          className='window_btn'
        >CREATE</button>
        <div
          ref={contentRef}
          className='window_form'
        >
          {isJoin ?
            getContentRefJoin() :
            getContentRefCreate()
            // проверяем если пользователь нажал на кнопку Join, то отрисовываем контент для добавления пользователя в комнату,
            // если на кнопку Create, то отрисовываем контент для создания комнаты
          }
        </div>
      </div>
    </div>
  )
}
