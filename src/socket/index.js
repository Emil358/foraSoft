import {io} from 'socket.io-client';

const options = {
  "force new connection": true,        // следует ли повторно использовать существующее соединение
  reconnectionAttempts: "Infinity",    // количество попыток переподключения перед отказом
  timeout : 10000,                     // тайм-аут соединения перед срабатыванием error события
  transports : ["websocket"]           // список транспортов, по которым нужно осуществить соединение
}

const uri = window.location.port === 4000 ? '/' : 'http://localhost:4000'

const socket = io(uri, options);

export default socket;
