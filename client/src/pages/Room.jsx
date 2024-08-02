import React, { useEffect, useCallback, useState , useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import { useMediaQuery } from 'react-responsive';
import { BsCameraVideoFill, BsCameraVideoOffFill } from "react-icons/bs";
import { IoMdMic, IoMdMicOff } from "react-icons/io";
import { MdCall } from "react-icons/md";
import { MdCallEnd } from "react-icons/md";
import PuffLoader from "react-spinners/PuffLoader";
import { ToastContainer, toast , Bounce} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const override = {
  display: "block",
  margin: "auto auto",
  color:"#9d2dba",
  borderColor: "red",
};

const RoomPage = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [media, setMedia] = useState({
    audio: true,
    video: true,
  });

  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });

  ///////////////////////////////Functions to handle media devices////////////////////////////////
  const handleCamera = useCallback(() => {
    setMedia((prevMedia) => {
      const newVideoState = !prevMedia.video;
      if (myStream) {
        const videoTrack = myStream.getTracks().find(track => track.kind === 'video');
        if (videoTrack) {
          videoTrack.enabled = newVideoState;
        }
      }
      return { ...prevMedia, video: newVideoState };
    });
  }, [myStream]);

  const handleMike = useCallback(() => {
    setMedia((prevMedia) => {
      const newAudioState = !prevMedia.audio;
      if (myStream) {
        const audioTrack = myStream.getTracks().find(track => track.kind === 'audio');
        if (audioTrack) {
          audioTrack.enabled = newAudioState;
        }
      }
      return { ...prevMedia, audio: newAudioState };
    });
  }, [myStream]);
 

  const handleMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia(media);
    setMyStream(stream);
    return stream;
  }, [media]);

  const sendStreams = useCallback((stream) => {
    if (stream) {
      for (const track of stream.getTracks()) {
        peer.peer.addTrack(track, stream);
      }
    }
  }, []);

  ///////////////////////Functios to handle user connections ////////////////////////
  const handleUserJoined = useCallback(({ userName, id }) => {
    setLoading(!loading);
    toast.success(` ${userName} joined room`, {
      toastId: "user joined",
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });
    console.log(` ${userName} joined room`);
    setRemoteSocketId(id);
  }, [loading]);

  const handleCallUser = useCallback(async () => {
    setInCall(true);
    const stream = await handleMedia();
    sendStreams(stream);
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
  }, [handleMedia, remoteSocketId, sendStreams, socket]);



  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setInCall(true)
      setLoading(!loading);
      const stream = await handleMedia();
      setRemoteSocketId(from);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
      sendStreams(stream);
    },
    [handleMedia, sendStreams, socket, loading]
  );

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
    }, []
  );

  const handleRoomFull = useCallback(
    ()=>{
      toast.warning(`Room is full`, {
        position: "top-center",
        toastId: "room full",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });

      setTimeout(()=>{
        navigate('/')
      },2000)
    },[]
  )

  //////////////////////////// Renegotiating to send stream data ////////////////////////

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
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

  //////////////////////////// Fucntions to disconnect connections ////////////////////

  const cleanupStreams = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      setMyStream(null);
    }
    
    setRemoteStream(null);

  }, [myStream, remoteStream]);

  const handleEndCall = useCallback(() => {
    setInCall(false);
    cleanupStreams()
    peer.peer.close();
    setRemoteSocketId(null);
    toast.info("Call Ended", {
      toastId: "callend",
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });
    socket.emit("user:endcall",{to:remoteSocketId});
    setLoading(true);
    window.location.reload();
  }, [myStream, remoteStream, socket, remoteSocketId, cleanupStreams]);

  const handCallEnded = useCallback(()=>{
    setInCall(false);
    cleanupStreams();
    console.log('call ended')
    peer.peer.close();
    setRemoteSocketId(null);
    toast.info("Call Ended", {
      toastId: "callend",
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });

    setLoading(true);
    window.location.reload();
  },[myStream, remoteStream, cleanupStreams]);

  useEffect(() => {
    peer.peer.addEventListener("track", (ev) => {
      const [remoteStream] = ev.streams;
      setRemoteStream(remoteStream);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on('disconnet', handleEndCall);
    socket.on("user:endcall", handCallEnded)
    socket.on("room:full", handleRoomFull);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off('disconnet', handleEndCall);
      socket.off("user:endcall", handCallEnded)
      socket.off("room:full", handleRoomFull);
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
      <ToastContainer />
      <h4 className="text-white text-center text-3xl p-5 ">
        {!remoteSocketId && "Waiting for the user to Connect"}
      </h4>
      <PuffLoader
        color="#ff6666"
        loading={loading}
        cssOverride={override}
        size={150}
        aria-label="Loading Spinner"
        data-testid="loader"
      />

      {/* Remote Stream Video Player  */}
      <div className="">
        {remoteStream && (
          <div className="my-auto md:pb-14">
            <ReactPlayer
              playing
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

        {/* Local Stream Video Player  */}
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
                float: "right",
                borderRadius: "50px"
              }}
            />
            {/* {!media.video && <BsCameraVideoOffFill size={'60px'} color="white" className="absolute mx-[calc(40%)]" />} */}
          </div>
        )}
      </div>


      {/* Media Control container  */}
      <div id="controls" className="absolute w-full bottom-0 bg-white/10 p-5 h-[10vh]">
        {/* {myStream && <button onClick={() => sendStreams(myStream)}>Send Stream</button>} */}

        {remoteSocketId && (
          <ul className="relative flex justify-around md:justify-center md:space-x-32 items-center px-20">
            <li onClick={handleCamera}>
              {!media.video ? (
                <BsCameraVideoFill size={30} />
              ) : (
                <BsCameraVideoOffFill size={30} />
              )}
            </li>
            <li>
              {!inCall && <button onClick={handleCallUser}>
                <MdCall size={30} />
              </button>}
              {inCall && <button onClick={handleEndCall}>
                <MdCallEnd color="red" size={30} />
              </button>}
            </li>
            <li onClick={handleMike}>
              {!media.audio ? (
                <IoMdMic size={30} />
              ) : (
                <IoMdMicOff size={30} />
              )}
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
