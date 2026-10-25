/**
 * useWebRTCStream.js
 *
 * Real-time WebRTC camera streaming between student and teacher.
 * - Transport layer: WebRTC peer-to-peer (no video through database).
 * - Signaling: existing FastAPI WebSocket (/ws/engagement/{sessionId}).
 * - Privacy: Student is explicitly alerted when teacher is viewing.
 */

import { useState, useRef, useCallback, useEffect } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTCStream({
  sessionId,
  role = "student", // "student" | "teacher"
  userId,
  mediaStream,
  wsRef, // ref to active classroom WebSocket
}) {
  const [isLiveSharing, setIsLiveSharing] = useState(false);
  const [teacherViewing, setTeacherViewing] = useState(false);
  const [activeTeacherId, setActiveTeacherId] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected | connecting | connected | error

  const peerConnectionRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Send signaling message via existing WebSocket
  const sendSignal = useCallback((message) => {
    if (wsRef && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, [wsRef]);

  // Clean up existing peer connection
  const cleanupPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setConnectionStatus("disconnected");
  }, []);

  // ─── STUDENT METHODS ────────────────────────────────────────────────────────
  const startLiveSharing = useCallback(() => {
    if (!mediaStream) return;
    setIsLiveSharing(true);
    sendSignal({
      type: "live_stream_started",
      user_id: userId,
    });
  }, [mediaStream, userId, sendSignal]);

  const stopLiveSharing = useCallback(() => {
    setIsLiveSharing(false);
    setTeacherViewing(false);
    setActiveTeacherId(null);
    cleanupPeerConnection();
    sendSignal({
      type: "live_stream_stopped",
      user_id: userId,
    });
  }, [userId, sendSignal, cleanupPeerConnection]);

  // Handle incoming signaling for student
  const handleStudentSignal = useCallback(async (msg) => {
    if (!isLiveSharing && msg.type !== "teacher_join_live") return;

    if (msg.type === "teacher_join_live") {
      // Teacher wants to view this student's camera — create Offer
      const teacherId = msg.from_teacher_id || "teacher";
      setActiveTeacherId(teacherId);
      setTeacherViewing(true);
      setConnectionStatus("connecting");

      cleanupPeerConnection();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add student's video tracks
      if (mediaStream) {
        mediaStream.getVideoTracks().forEach((track) => {
          pc.addTrack(track, mediaStream);
        });
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal({
            type: "webrtc_ice_candidate",
            target_teacher_id: teacherId,
            candidate: e.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setConnectionStatus("connected");
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          setConnectionStatus("disconnected");
          setTeacherViewing(false);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal({
        type: "webrtc_offer",
        target_teacher_id: teacherId,
        sdp: pc.localDescription,
      });
    } else if (msg.type === "webrtc_answer") {
      if (peerConnectionRef.current && msg.sdp) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        setConnectionStatus("connected");
      }
    } else if (msg.type === "webrtc_ice_candidate") {
      if (peerConnectionRef.current && msg.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } catch (e) {}
      }
    } else if (msg.type === "teacher_leave_live") {
      setTeacherViewing(false);
      setActiveTeacherId(null);
      cleanupPeerConnection();
    }
  }, [isLiveSharing, mediaStream, sendSignal, cleanupPeerConnection]);

  // ─── TEACHER METHODS ────────────────────────────────────────────────────────
  const joinStudentLive = useCallback(async (targetStudentUserId) => {
    cleanupPeerConnection();
    setConnectionStatus("connecting");

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal({
          type: "webrtc_ice_candidate",
          target_user_id: targetStudentUserId,
          candidate: e.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setConnectionStatus("connected");
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setConnectionStatus("disconnected");
      }
    };

    // Notify student to create WebRTC offer
    sendSignal({
      type: "teacher_join_live",
      target_user_id: targetStudentUserId,
      from_teacher_id: userId,
    });
  }, [userId, sendSignal, cleanupPeerConnection]);

  const leaveStudentLive = useCallback((targetStudentUserId) => {
    sendSignal({
      type: "teacher_leave_live",
      target_user_id: targetStudentUserId,
      from_teacher_id: userId,
    });
    cleanupPeerConnection();
  }, [userId, sendSignal, cleanupPeerConnection]);

  // Handle incoming signaling for teacher
  const handleTeacherSignal = useCallback(async (msg) => {
    if (msg.type === "webrtc_offer" && peerConnectionRef.current && msg.sdp) {
      const pc = peerConnectionRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({
        type: "webrtc_answer",
        target_user_id: msg.from_user_id,
        sdp: pc.localDescription,
      });
    } else if (msg.type === "webrtc_ice_candidate" && peerConnectionRef.current && msg.candidate) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } catch (e) {}
    } else if (msg.type === "live_stream_stopped") {
      cleanupPeerConnection();
    }
  }, [sendSignal, cleanupPeerConnection]);

  return {
    isLiveSharing,
    teacherViewing,
    activeTeacherId,
    remoteStream,
    remoteVideoRef,
    connectionStatus,
    startLiveSharing,
    stopLiveSharing,
    joinStudentLive,
    leaveStudentLive,
    handleStudentSignal,
    handleTeacherSignal,
  };
}

export default useWebRTCStream;
