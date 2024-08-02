import { Server } from "socket.io";

const io = new Server(8000, {
    cors: true,
  });
  
  const usernameToSocketIdMap = new Map();
  const socketidToUsernameMap = new Map();
  
  io.on("connection", (socket) => {
    console.log(`Socket Connected`, socket.id);
    socket.on("room:join", (data) => {
      const { userName, room } = data;

      //check if the room is full(only 2 users should be present in a room)
      const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;

      //if room is full
      if(roomSize >= 2){
        io.to(socket.id).emit('room:full');
        return ;
      }

      // console.log(userName," ", room , socket.id);
      usernameToSocketIdMap.set(userName, socket.id);
      socketidToUsernameMap.set(socket.id, userName);
      io.to(room).emit("user:joined", { userName, id: socket.id });
      socket.join(room);
      io.to(socket.id).emit("room:join", data);
    });
  
    socket.on("user:call", ({ to, offer }) => {
      io.to(to).emit("incomming:call", { from: socket.id, offer });
    });
  
    socket.on("call:accepted", ({ to, ans }) => {
      io.to(to).emit("call:accepted", { from: socket.id, ans });
    });
  
    socket.on("peer:nego:needed", ({ to, offer }) => {
      // console.log("peer:nego:needed", offer);
      io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });
  
    socket.on("peer:nego:done", ({ to, ans }) => {
      // console.log("peer:nego:done", ans);
      io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });

    socket.on("user:endcall",({to})=>{
      io.to(to).emit("user:endcall",{from:socket.id});
    })

    socket.on('disconnect', () => {
      console.log('Socket Disconnected:', socket.id);
      const username = socketidToUsernameMap.get(socket.id);
      usernameToSocketIdMap.delete(username);
      socketidToUsernameMap.delete(socket.id);
      // console.log(usernameToSocketIdMap)
      // console.log(socketidToUsernameMap)
    });

    socket
  });