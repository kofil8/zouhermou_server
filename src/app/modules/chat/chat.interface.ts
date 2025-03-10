export interface userId {
  id: string;
}
export interface IChatroom {
  id: string;
  roomName: string;
  productId: string;
  roomMembers: [userId];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  id: string;
  chatroomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
