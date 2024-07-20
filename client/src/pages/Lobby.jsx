import React, { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../context/SocketProvider';
import { useNavigate } from 'react-router-dom';
import Hero from '../Components/Hero'
import copyImg from '../assets/copy.svg';

const Lobby = () => {
  const [userName, setUserName] = useState('');
  const [room, setRoom] = useState('');
  const socket = useSocket();
  
  const navigate = useNavigate();
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    socket.emit('room:join', { userName, room });
    navigate(`/room/${room}`);
  }, [userName, room, socket, navigate]);

  const generateRoomId = useCallback(() => {
    const roomId = Math.random().toString(36).substring(2, 15);
    setRoom(roomId);
  }, []);

  const copyRoomID = useCallback(() => {
    navigator.clipboard.writeText(room);
  }, [room]);

 
  return (
    <div className='min-h-screen flex-row md:flex'>
      <Hero />
      <form onSubmit={handleSubmit} className='md:w-max m-auto text-2xl text-white'>
        <label htmlFor='userName' className='text-center block md:inline-block'>Enter Username</label>
        <input
          type='text'
          className='md:my-0 my-1 md:mx-2 rounded-md p-2 text-black mx-auto block md:inline-block'
          required
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder='User name'
        />
        <br />
        <button className='p-2 my-3 md:my-2 rounded-md border-2 border-white mx-auto block md:inline-block' type='button' onClick={generateRoomId}>Generate Room Code</button>
        <span className='my-5 md:my-0 text-center md:mx-2 block md:inline-block'>Or</span>
        <div className='flex justify-center items-center md:inline-flex mr-5'>
          <input
            type='text'
            className='md:mx-2 w-max rounded-md p-2 text-black mx-auto block'
            required
            placeholder='Enter the room id'
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button type='button' onClick={copyRoomID} className='-ml-10 active:scale-50 '>
            <img src={copyImg} height={25} width={25} alt='' />
          </button>
        </div>
        <button type='submit' className='text-white my-5 mx-auto p-2 rounded-md border-2 border-white block md:inline-block'>Join</button>
      </form>
    </div>
  );
};

export default Lobby;
