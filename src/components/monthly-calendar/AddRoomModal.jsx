import React from 'react';
import RoomModal from '../room/RoomModal';

export default function AddRoomModal({ open, onClose, defaultFloor = 1 }) {
  return <RoomModal open={open} onClose={onClose} defaultFloor={defaultFloor} />;
}
