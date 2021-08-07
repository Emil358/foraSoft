import { useEffect, useRef, useCallback } from "react";
import socket from "../socket";
import ACTIONS from "../socket/actions";
import useStateWithCallback from "./useStateWithCallback";
import freeice from 'freeice';

export const LOCAL = 'LOCAL'

function useWebRTC(roomId) {
  const [clients, setClients] = useStateWithCallback([]);

  const peerConnections = useRef({})
  const localMediaStream = useRef(null);
  const peerMediaElements = useRef({
    [LOCAL]: null,
  });

  const addNewClient = useCallback((newClient, cb) => {
    setClients(list => {
      if(!list.includes(newClient)){
        return [...list, newClient]
      }
      return list
    }, cb)
  }, [setClients])

  useEffect(() => {
    const startMediaStream = async() => {
      localMediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 1280,
          height: 720
        }
      });
      addNewClient(LOCAL, () => {
        const localVideoElement = peerMediaElements.current[LOCAL];
        if(localVideoElement){
          localVideoElement.volume = 0;
          localVideoElement.srcObject = localMediaStream.current;
        }
      })
    }

    startMediaStream()
      .then(() => {socket.emit(ACTIONS.JOIN, {room: roomId})})
      .catch((err) => {console.error(`Error: get user media(${err})`)});

    return () => {
      localMediaStream.current.getTracks().forEach(track => track.stop());
      socket.emit(ACTIONS.LEAVE);
    }
  }, [roomId, addNewClient])

  // вызываем асинхронно функцию, в которой захватывается видео и аудио данного пользователя, которые присваиваются к localMediaStream
  // после выполнения функция отправляем событие на сервер ACTIONS.JOIN с roomId

  useEffect(() => {
    socket.on(ACTIONS.ADD_PEER, async ({userId, createOffer}) => {
      if(userId in peerConnections.current) {                      // проверяем не было ли уже установлено соединение
        return console.log('You are already connetc to room')
      }



      peerConnections.current[userId] = new RTCPeerConnection({    // создаем обьект RTCPeerConnection, в который передаем ice-сервера для чтобы обойти NAT, используя модуль freeice
        iceServers: freeice()
      })

      peerConnections.current[userId].onicecandidate = event => {  // утсанавливаем обработчик события на получения iceCandidate, когда получаем отправляем свой iceCandidate
        if(event.candidate) {
          socket.emit(ACTIONS.SHARE_ICE, {
            userId,
            iceCandidate: event.candidate,
          })
        }
      }

      let tracks = 0
      peerConnections.current[userId].ontrack = ({streams: [remoteStreams]}) => {
        tracks++;
        if(tracks === 2) { // 2 добавляем другого пользователя только тогда, когда получим и видео, и аудио
          tracks = 0;
          addNewClient(userId, () => {
            if(peerMediaElements.current[userId]){
              peerMediaElements.current[userId].srcObject = remoteStreams;
            } else {
              let settled = false;
              const interval = setInterval(() => {
                if(peerMediaElements.current[userId]) {
                  peerMediaElements.current[userId].srcObject = remoteStreams
                  settled = true
                }
                if(settled) {
                  clearInterval(interval)
                }
              }, 1000)
            }
          })
        }
      }

      localMediaStream.current.getTracks().forEach(track => {
        peerConnections.current[userId].addTrack(track, localMediaStream.current)
      })

      if(createOffer) {
        const offer = await peerConnections.current[userId].createOffer();
        await peerConnections.current[userId].setLocalDescription(offer)
        socket.emit(ACTIONS.SHARE_SDP, {
          userId,
          sessionDescription: offer,
        })
      }
    })

    return () => {
      socket.off(ACTIONS.ADD_PEER)
    }
  }, [addNewClient]);

  // ACTIONS.ADD_PEER обработчик события для установления p2p соединения

  useEffect(() => {
    socket.on(ACTIONS.ICE_CANDIDATE, ({userId, iceCandidate}) => {
      peerConnections.current[userId]?.addIceCandidate(
        new RTCIceCandidate(iceCandidate)
      )
    })

    return () => {
      socket.off(ACTIONS.ICE_CANDIDATE);
    }
  }, [])

  // ACTIONS.ICE_CANDIDATE обработчик события при получении iceCandidate сохроняем его

  useEffect(() => {
    socket.on(ACTIONS.SESSION_DESCRIPTION, async ({userId, sessionDescription: remoteDescription}) => {
      await peerConnections.current[userId]?.setRemoteDescription(
        new RTCSessionDescription(remoteDescription)
      )

      if(remoteDescription.type === 'offer') {
        const answer = await peerConnections.current[userId].createAnswer();
        await peerConnections.current[userId].setLocalDescription(answer);
        socket.emit(ACTIONS.SHARE_SDP, {
          userId,
          sessionDescription: answer,
        });
      }
    })

    return () => {
      socket.off(ACTIONS.SESSION_DESCRIPTION);
    }
  })

  // ACTIONS.SESSION_DESCRIPTION обработчик события при получении remoteDescription сохроняем его,
  // если тип remoteDescription offer, то создаем answer и отправляем его

  useEffect(() => {
    socket.on(ACTIONS.REMOVE_PEER, ({userId}) => {

      if(peerConnections.current[userId]) {
        peerConnections.current[userId].close()
      }

      delete peerConnections.current[userId];
      delete peerMediaElements.current[userId];

      setClients(list => list.filter(user => user !== userId))
    })

    return () => {
      socket.off(ACTIONS.REMOVE_PEER)
    }
  }, [setClients])

  // ACTIONS.REMOVE_PEER обработчик служит для рызрыва p2p соединения
  // удаляет пользователя из peerConnections и peerMediaElements

  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
  }, [])

  return {
    clients,
    provideMediaRef
  }
}

export default useWebRTC;
