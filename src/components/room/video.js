import './video.css';
import useWebRTC, {LOCAL} from '../../hooks/useWebRTC';

function Video({roomId}) {
  const {clients, provideMediaRef} = useWebRTC(roomId);
  // используем хук useWebRTC, который возвращает кортеж из пользователей и функцию для привязки медиа элемента и node
  return(
    <div className={`video `}>
      <div className={`video-${clients.length}`}>
        {clients.map((clientId, index) => {
          return(
            <div className='video-item' key={clientId} id={clientId}>
              <video
                className='video-item'
                ref={instance => {
                  provideMediaRef(clientId, instance);
                  // привязывает пользователя и node
                }}
                autoPlay
                playsInline
                muted={clientId === LOCAL}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Video;
