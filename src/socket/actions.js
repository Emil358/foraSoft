const ACTIONS = {
  ADD_PEER: 'add-peer',
  REMOVE_PEER: 'remove-peer',
  JOIN: 'join',
  LEAVE: 'leave',
  GET_LIST_ROOM: 'get-list-room',
  SHARE_ICE: 'share-ice',
  SHARE_SDP: 'share-sdp',
  ICE_CANDIDATE: 'ice-candidate',
  SESSION_DESCRIPTION: 'session-description',
  SEND_MSG: 'send-message',
  GET_MSG: 'get-msg',
  GET_LIST_USERS: 'get-list-users',
  ADD_NEW_USER: 'add-new-user',
  CREATE_NEW_ROOM: 'create-new-room',
  GET_USERNAME: 'get-username',
  SET_USERNAME: 'set-username',
  NOT_FOUND_PAGE: 'not-found-page'
}

module.exports = ACTIONS
