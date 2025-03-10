interface LocationMessage {
  type: 'location';
  userId: string;
  longitude: number;
  latitude: number;
}

interface JoinRoomMessage {
  type: 'joinRoom';
  user1Id: string;
  user2Id: string;
}

interface SendMessage {
  type: 'sendMessage';
  chatroomId: string;
  senderId: string;
  receiverId: string;
  content: string;
}

interface ViewMessages {
  type: 'viewMessages';
  chatroomId: string;
  userId: string;
}

interface near {
  type: 'near';
  longitude: number;
  latitude: number;
  maxDistance: number;
}

export type Message =
  | LocationMessage
  | JoinRoomMessage
  | SendMessage
  | ViewMessages
  | near;
