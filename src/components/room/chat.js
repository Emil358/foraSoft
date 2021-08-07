import './chat.css';
import { useEffect, useRef, useState } from 'react'
import socket from '../../socket';
import ACTIONS from '../../socket/actions';
import Send from '../elements/send';

function Chat({roomId, username}) {
  const [messages, setMessages] = useState([]);
  const inputRef = useRef({})

  useEffect(() => {
    socket.on(ACTIONS.GET_MSG, (message) => {
      setMessages([...messages, message]);
    })
  });

  // ACTIONS.GET_MSG обработчик события при получении сообщения вызывает функцию setMessages, передавая параметр message

  const getTime = () => {
    const date = new Date()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`
  }

  // функция getTime возвращает время в строковом формате ('00:00')

  const sendMessage = (text) => {
    if(text) {
      socket.emit(ACTIONS.SEND_MSG, {
        room: roomId,
        userId: socket.id,
        username,
        time: getTime(),
        text
      })
    }
  }

  //функция sendMessage отпрвляет событие на сервер с новым сообщением

  const fromAnotherUser = (message) => {
    return (
      <>
        <h3>{message.time}</h3>
        <h2>{message.username}</h2>
      </>
    )
  }

  // функция fromAnotherUser служит для отрисовки времени и имени от других пользователей

  const fromMe = (message) => {
    return (
      <>
        <h2>{message.username}</h2>
        <h3>{message.time}</h3>
      </>
    )
  }

  // функция fromAnotherUser служит для отрисовки времени и имени от данного пользователя

  return (
    <div className='chat'>
      <div>
        <ul id="chat">
          {messages.map((message, index) => (
            <li key={index} className={message.userId === socket.id ? "me" : "you"}>
              <div className="entete">
                {message.userId === socket.id ?
                  fromAnotherUser(message) :
                  fromMe(message)
                  // проверяем, если сообщение пришло от нас то отрисовываем его как от нас,
                  // в противном случае как от других пользователей
                }
              </div>
              <div className="message">
                {message.text}
              </div>
            </li>
          ))}
        </ul>
        <footer>
          <textarea
            placeholder="Type your message"
            ref={inputRef}
            type='text'
          />
          <button
            onClick={() => {
              sendMessage(inputRef.current.value.trim())
              inputRef.current.value = '';
            }}
          >
            <Send/>
          </button>
        </footer>
      </div>
  </div>

  )
}
export default Chat;
