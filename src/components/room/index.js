import './room.css'
import { useEffect, useState} from 'react';
import { useHistory, useParams } from 'react-router';
import socket from '../../socket';
import ACTIONS from '../../socket/actions';
import Chat from "./chat";
import UsersList from './usersList';
import Video from "./video";
import Modal from './modal';

function Room () {
  const {id: roomId} = useParams();
  const [username, setUsername] = useState(undefined);
  const history = useHistory();


  useEffect(() => {
    socket.on(ACTIONS.NOT_FOUND_PAGE, () => {
      history.push('/404')
    })
  }, [])

  // ACTIONS.NOT_FOUND_PAGE обработчик события служит для проверки существование комнаты,
  // если комната не существует, то отправляем пользователя на страницу notFound

  useEffect(() => {
    socket.emit(ACTIONS.GET_USERNAME, {roomId})
  }, [])

  // ACTIONS.GET_USERNAME отправляем событие на сервер для получения имени

  useEffect(() => {
    socket.on(ACTIONS.SET_USERNAME, ({name}) => {
      setUsername(name);
    })
  }, [])

  // ACTIONS.SET_USERNAME обработчик события при получения имени вызывает функцию setUsername и передает параметр name
  // если обработчик события не сработал то отрисовываем модальное окно, для ввода имени
  // тем самым проверяем если пользователь зашел по ссылки, то ему нужно ввести свое имя для того, чтобы войти в комнату

  if(!username) {
    return(
      <Modal roomId={roomId} />
    )
  }

  return (
    <div className='room'>
      <UsersList />
      <Chat roomId={roomId} username={username} />
      <Video roomId={roomId} />
    </div>
  )
}
export default Room;
