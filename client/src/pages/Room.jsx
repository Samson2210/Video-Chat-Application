import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import { useMediaQuery } from 'react-responsive';
import { BsCameraVideoFill, BsCameraVideoOffFill } from "react-icons/bs";
import { IoMdMic, IoMdMicOff } from "react-icons/io";
import { MdCall } from "react-icons/md";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [media, setMedia] = useState({
    audio: false,
    video: true,
  });

  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })

  const handleUserJoined = useCallback(({ userName, id }) => {
    console.log(` ${userName} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCamera = useCallback(() => {
    setMedia((prevMedia) => {
      const newVideoState = !prevMedia.video;
      if (myStream) {
       
        const videoTrack = myStream.getTracks().find(track => track.kind === 'video');
        if (videoTrack){
           videoTrack.enabled = newVideoState;
          }
      }
      return { ...prevMedia, video: newVideoState };
    });
  }
  ,[myStream])

  const handleMike = useCallback(() => {

    setMedia((prevMedia) => {
      const newAudioState = !prevMedia.audio;
      if (myStream) {
        const audioTrack = myStream.getTracks().find(track => track.kind === 'audio');
        if (audioTrack)
          audioTrack.enabled = newAudioState;
      }
      return { ...prevMedia, audio: newAudioState };
    })

  }, [myStream])

  const handleMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia(media);
    setMyStream(stream);
    
    console.log(myStream);
  })

  // useEffect(()=>{
  //   if(myStream){
  //     sendStreams();
  //   }

  // },[myStream]);

  const handleCallUser = useCallback(async () => {
    handleMedia();
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      handleMedia();
      setRemoteSocketId(from);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
    },[]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);



  useEffect(() => {
    // handleMedia();
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track",  (ev) => {
      const [remoteStream] =  ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream);
      console.log(remoteStream)
    });

    // return () => {
    //   peer.peer.removeEventListener("track",  (ev) => {
    //     const remoteStream = ev.streams;
    //     console.log("GOT TRACKS!!");
    //     setRemoteStream(remoteStream[0]);
    //     console.log('setting stream')
    //   });
    // }
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <div className="min-h-screen relative">
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      <div className="">
      {remoteStream && (
        <div className="my-auto md:pb-14">
          <ReactPlayer
            playing
            muted
            height={isTabletOrMobile ? "640px" : "100%"}
            width={isTabletOrMobile ? "360px" : "60%"}
            url={remoteStream}
            style={{
              padding: "10px",
              margin: "auto"
            }}
          />
        </div>
      )}

      {myStream && (
          <div className="absolute bottom-28  md:right-11  ">
            <ReactPlayer
              playing
              muted
              height={isTabletOrMobile ? "50%" : "20%"}
              width={isTabletOrMobile ? "50%" : "35%"}
              url={myStream}
              style={{
                padding: "10px",
                float:"right",
                borderRadius: "50px"
              }}
            />
            {!media.video && <BsCameraVideoOffFill size={'60px'} color="white" className="absolute mx-[calc(40%)]" />}
          </div>
      
      )
      }
      </div>
      <div id="controls" className="absolute w-full bottom-0 bg-white/10 p-5 ">
        {myStream && <button onClick={sendStreams}>Send Stream</button>}

        <ul className="relative flex justify-around md:justify-center md:space-x-32 items-center px-20 ">
          <li onClick={handleCamera} >{!media.video? <BsCameraVideoFill size={isTabletOrMobile ? 20 : 30} />:<BsCameraVideoOffFill size={isTabletOrMobile ? 20 : 30} />}</li>
          <li>{remoteSocketId && <button onClick={handleCallUser}><MdCall size={isTabletOrMobile ? 20 : 30} /></button>}</li>
          <li onClick={handleMike}>{!media.audio? <IoMdMic size={isTabletOrMobile ? 20 : 30} />:<IoMdMicOff size={isTabletOrMobile ? 20 : 30}/>}</li>
        </ul>
      </div>
    </div>
  );
};

export default RoomPage;