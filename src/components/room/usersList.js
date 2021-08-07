import './usersList.css';
import React, { useEffect, useState } from "react";
import socket from "../../socket";
import ACTIONS from "../../socket/actions";
import Exit from '../elements/exit';
import { useHistory } from 'react-router';


function UsersList () {
  const [usersList, setUserList] = useState([]);
  const history = useHistory()

  useEffect(() => {
    socket.on(ACTIONS.GET_LIST_USERS, ({usersList}) => {
      setUserList(usersList)
    })
  }, [])

  // ACTIONS.GET_LIST_USERS обработчик события получает список пользователей в комнате и вызывает функцию setUserList с параметром usersList

  return(
    <React.Fragment>
      <div className="userslist">
        <ul className="userslist_list">
          <li className="userslist_list-item">
            <button
              className="userslist_list-item-exit"
              onClick={() => {
                socket.emit(ACTIONS.LEAVE)
                history.push('/')
                // при нажатии на кнопку отправляем событие на сервер
                // и отправляем пользователя на главную страницу
              }}
            >
              <Exit />
            </button>
          </li>
          {usersList.map(user => (
            <li className="userslist_list-item" key={user.userId}>
              <div className="userslist_list-item-circle">{user.username[0]}</div>
              <span className="userslist_list-item-username">{user.username}</span>
            </li>
          ))}
        </ul>
      </div>
    </React.Fragment>
  )
}

export default UsersList;
