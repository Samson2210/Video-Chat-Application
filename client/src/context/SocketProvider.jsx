import React, { createContext, useContext, useEffect, useMemo } from 'react'
import {io} from 'socket.io-client'

const SocketContext = createContext(null)

export const useSocket = ()=>{
    const socket = useContext(SocketContext);
    socket.connect();
    return socket;
}

export const SocketProvider = (props)=>{

    const socket  = useMemo(()=>io(`${import.meta.env.VITE_URL||'localhost:8000'}`,{autoConnect: false}),[]);
    return(
    <SocketContext.Provider value={socket}>
        {props.children}
    </SocketContext.Provider>
    )
}