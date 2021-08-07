import './modal.css'
import { useRef } from 'react';
import socket from '../../socket';
import ACTIONS from '../../socket/actions';

function Modal({roomId}) {

  const addNewUser = (username) => {
    if(username) {
      socket.emit(ACTIONS.ADD_NEW_USER, {
        roomId,
        username
      })

      socket.emit(ACTIONS.GET_USERNAME, {roomId})
      inputUsername.current.value = '';
    }
  }

  // функция addNewUser отправляет событие на сервер для добавления пользователя в комнату и событие для получения username
  // и очищает input

  const inputUsername = useRef();
  return (
    <div className='wrapper'>
      <div className='form'>
        <label htmlFor="username">Username: </label>
        <input
          id='username'
          className='form_input'
          type='text'
          ref={inputUsername}
        />
        <button
          className='form_button'
          onClick={() => {
            addNewUser(inputUsername.current.value.trim())
          }}
        >send</button>
      </div>
    </div>
  )
}

export default Modal;
