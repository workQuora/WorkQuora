const Message = require('../models/Message');
const User = require('../models/User');
const { createNotification } = require('../utils/notification');

const chatSocketHandler = (io) => {
  io.on('connection', (socket) => {
    
    // User joins their personal room automatically if userId is attached
    if (socket.userId) {
      socket.join(socket.userId);
      console.log(`👤 User ${socket.userId} joined personal socket room`);

      // 1. Mark all pending "sent" messages as "delivered" since user is now online
      (async () => {
        try {
          const undelivered = await Message.find({ receiver: socket.userId, status: 'sent' });
          if (undelivered.length > 0) {
            await Message.updateMany(
              { receiver: socket.userId, status: 'sent' },
              { $set: { status: 'delivered' } }
            );

            // Group by job & sender to notify active senders
            const groups = {};
            for (const msg of undelivered) {
              const key = `${msg.job}_${msg.sender}`;
              groups[key] = { jobId: msg.job.toString(), senderId: msg.sender };
            }

            for (const key in groups) {
              const { jobId, senderId } = groups[key];
              io.to(senderId).emit('messages_delivered', { jobId, receiverId: socket.userId });
            }
          }
        } catch (err) {
          console.error('Error updating message delivery status on reconnect:', err);
        }
      })();
    }

    // Support setup event if frontend calls it
    socket.on('setup', (userData) => {
      if (userData?._id) {
        socket.join(userData._id);
        socket.emit('connected');
      }
    });

    // User joins a conversation room (format: jobId_otherUserId)
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data || {};
        if (!roomId || typeof roomId !== 'string') {
          socket.emit('error', { message: 'Invalid room' });
          return;
        }
        const parts = roomId.split('_');
        if (parts.length !== 2) {
          socket.emit('error', { message: 'Malformed roomId' });
          return;
        }
        socket.join(roomId);
        console.log(`💬 Socket ${socket.id} joined room: ${roomId}`);

        // 2. Mark messages in this room as read automatically
        if (socket.userId) {
          const [jobId, otherUserId] = parts;
          const mongoose = require('mongoose');
          const validJobId = mongoose.Types.ObjectId.isValid(jobId) ? jobId : '000000000000000000000000';
          const unread = await Message.find({
            job: validJobId,
            sender: otherUserId,
            receiver: socket.userId,
            status: { $ne: 'read' }
          });

          if (unread.length > 0) {
            await Message.updateMany(
              { job: validJobId, sender: otherUserId, receiver: socket.userId },
              { $set: { status: 'read', isRead: true } }
            );
            // Notify the sender that their messages have been read
            io.to(otherUserId).emit('messages_read', { jobId: validJobId, readerId: socket.userId });
          }
        }
      } catch (err) {
        console.error('join_room error:', err);
        socket.emit('error', { message: 'Server error' });
      }
    });

    // User leaves a conversation room
    socket.on('leave_room', (data) => {
      try {
        const { roomId } = data || {};
        if (roomId) {
          socket.leave(roomId);
          console.log(`🚪 Socket ${socket.id} left room: ${roomId}`);
        }
      } catch (err) {
        console.error('leave_room error:', err);
      }
    });

    // Support mark_read event explicitly
    socket.on('mark_read', async (data) => {
      try {
        const { jobId, senderId } = data || {};
        const myId = socket.userId;
        if (!myId || !jobId || !senderId) return;
        const mongoose = require('mongoose');
        const validJobId = mongoose.Types.ObjectId.isValid(jobId) ? jobId : '000000000000000000000000';
        const unread = await Message.find({
          job: validJobId,
          sender: senderId,
          receiver: myId,
          status: { $ne: 'read' }
        });

        if (unread.length > 0) {
          await Message.updateMany(
            { job: validJobId, sender: senderId, receiver: myId },
            { $set: { status: 'read', isRead: true } }
          );
          io.to(senderId).emit('messages_read', { jobId: validJobId, readerId: myId });
        }
      } catch (err) {
        console.error('Error in mark_read socket event:', err);
      }
    });

    // Support join_chat event for backwards compatibility
    socket.on('join_chat', (room) => {
      try {
        if (room) {
          socket.join(room);
          console.log(`💬 Socket ${socket.id} joined room: ${room}`);
        }
      } catch (err) {
        console.error('join_chat error:', err);
      }
    });

    // Handle incoming chat messages
    socket.on('send_message', async (data) => {
      try {
        const { jobId, receiverId, text, fileUrl, fileType, location } = data || {};
        // Find sender from socket context (auth middleware)
        const senderId = socket.userId;
        if (!senderId) {
          return console.error('Socket send_message error: senderId not resolved');
        }

        // Check if either user has blocked the other
        const senderUserObj = await User.findById(senderId).select('blockedUsers');
        const receiverUserObj = await User.findById(receiverId).select('blockedUsers');
        if (
          (senderUserObj && senderUserObj.blockedUsers && senderUserObj.blockedUsers.includes(receiverId)) ||
          (receiverUserObj && receiverUserObj.blockedUsers && receiverUserObj.blockedUsers.includes(senderId))
        ) {
          console.log(`🚫 Message blocked: ${senderId} and ${receiverId} have blocked each other`);
          return;
        }

        // Check if receiver is currently online
        const recipientSockets = io.sockets.adapter.rooms.get(receiverId);
        const isOnline = recipientSockets && recipientSockets.size > 0;

        // Create the message in MongoDB
        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          job: jobId,
          text: text || '',
          fileUrl: fileUrl || null,
          fileType: fileType || 'text',
          location: location || undefined,
          status: isOnline ? 'delivered' : 'sent',
        });

        // Resolve sender name
        const sender = await User.findById(senderId).select('name');
        const senderName = sender ? sender.name : 'User';

        const messagePayload = {
          ...message.toObject(),
          _id: message._id.toString(),
          senderId,
          senderName,
          timestamp: message.createdAt.toISOString(),
        };

        // Room IDs
        const roomId = `${jobId}_${receiverId}`;
        const reverseRoomId = `${jobId}_${senderId}`;

        // Emit to the conversation rooms so active chat panels get it
        io.to(roomId).emit('receive_message', messagePayload);
        io.to(reverseRoomId).emit('receive_message', messagePayload);

        // Also emit to the receiver's personal user room
        io.to(receiverId).emit('receive_message', messagePayload);

        // Emit status update back to sender
        if (isOnline) {
          io.to(senderId).emit('messages_delivered', { jobId, receiverId });
        }

        // 3. Create a Notification for the message if the receiver does NOT have the chat open
        const receiverActiveRoom = `${jobId}_${senderId}`;
        const roomSockets = io.sockets.adapter.rooms.get(receiverActiveRoom);
        
        let isReceiverInRoom = false;
        if (roomSockets && roomSockets.size > 0 && recipientSockets) {
          for (const sId of recipientSockets) {
            if (roomSockets.has(sId)) {
              isReceiverInRoom = true;
              break;
            }
          }
        }

        if (!isReceiverInRoom) {
          let notificationText = text;
          if (fileType === 'image') notificationText = '📷 Sent a photo';
          else if (fileType === 'video') notificationText = '🎥 Sent a video';
          else if (fileType === 'audio') notificationText = '🎵 Sent an audio message';
          else if (fileType === 'location') notificationText = '📍 Shared a location';
          else if (fileType === 'document') notificationText = '📁 Shared a document';

          await createNotification({
            recipient: receiverId,
            sender: senderId,
            type: 'new_message',
            message: `${senderName}: ${notificationText}`,
            relatedId: message._id,
            onModel: 'Message',
            io,
          });
        }
        
        console.log(`✉️ Message sent from ${senderName} to user ${receiverId} (Status: ${message.status})`);
      } catch (err) {
        console.error('Socket message sending failed:', err);
      }
    });

    // Handle typing status updates
    socket.on('typing_status', (data) => {
      try {
        const { roomId, userId, isTyping } = data || {};
        if (!roomId || typeof roomId !== 'string') return;
        
        // Broadcast to other users in this conversation room
        socket.to(roomId).emit('typing_status', { roomId, userId, isTyping });

        // Broadcast to reverse conversation room
        const parts = roomId.split('_');
        if (parts.length === 2) {
          const [jobId, otherUserId] = parts;
          const reverseRoom = `${jobId}_${userId}`;
          socket.to(reverseRoom).emit('typing_status', { roomId: reverseRoom, userId, isTyping });
        }
      } catch (err) {
        console.error('typing_status error:', err);
      }
    });

    // Legacy typing events compatibility
    socket.on('typing', (room) => {
      try {
        if (room) socket.in(room).emit('typing');
      } catch (err) {
        console.error('typing error:', err);
      }
    });
    socket.on('stop_typing', (room) => {
      try {
        if (room) socket.in(room).emit('stop_typing');
      } catch (err) {
        console.error('stop_typing error:', err);
      }
    });

    // --- WebRTC Calling Signaling ---
    socket.on('call_user', async (data) => {
      try {
        const { to, offer, isVideo, callerName, jobId } = data || {};
        const from = socket.userId;
        if (!from || !to) return;

        // Check if either user has blocked the other
        const senderUserObj = await User.findById(from).select('blockedUsers');
        const receiverUserObj = await User.findById(to).select('blockedUsers');
        if (
          (senderUserObj && senderUserObj.blockedUsers && senderUserObj.blockedUsers.includes(to)) ||
          (receiverUserObj && receiverUserObj.blockedUsers && receiverUserObj.blockedUsers.includes(from))
        ) {
          console.log(`🚫 Call blocked: ${from} and ${to} have blocked each other`);
          socket.emit('call_declined');
          return;
        }

        console.log(`📞 Socket ${socket.id} calling user ${to} (isVideo: ${isVideo})`);
        io.to(to).emit('incoming_call', { from, offer, isVideo, callerName, jobId });
      } catch (err) {
        console.error('call_user error:', err);
      }
    });

    socket.on('answer_call', (data) => {
      try {
        const { to, answer } = data || {};
        const from = socket.userId;
        if (!from || !to) return;
        console.log(`📞 Socket ${socket.id} answered call to ${to}`);
        io.to(to).emit('call_accepted', { from, answer });
      } catch (err) {
        console.error('answer_call error:', err);
      }
    });

    socket.on('decline_call', (data) => {
      try {
        const { to } = data || {};
        if (!to) return;
        console.log(`📞 Socket ${socket.id} declined call to ${to}`);
        io.to(to).emit('call_declined');
      } catch (err) {
        console.error('decline_call error:', err);
      }
    });

    socket.on('end_call', (data) => {
      try {
        const { to } = data || {};
        if (!to) return;
        console.log(`📞 Socket ${socket.id} ended call with ${to}`);
        io.to(to).emit('call_ended');
      } catch (err) {
        console.error('end_call error:', err);
      }
    });

    socket.on('ice_candidate', (data) => {
      try {
        const { to, candidate } = data || {};
        const from = socket.userId;
        if (!from || !to) return;
        io.to(to).emit('ice_candidate', { from, candidate });
      } catch (err) {
        console.error('ice_candidate error:', err);
      }
    });
  });
};

module.exports = chatSocketHandler;