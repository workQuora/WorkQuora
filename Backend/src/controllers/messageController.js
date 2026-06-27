const Message = require('../models/Message');
const User = require('../models/User');
const storageService = require('../services/storageService');

// POST /messages/upload
exports.uploadChatFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const chatId = req.body.jobId || 'direct'; // or any identifier

    // Upload to Cloudinary (resource_type auto-detects images, videos, audio, documents)
    const result = await storageService.uploadFile(req.file.buffer, `chat-media/${chatId}`, {
      resource_type: 'auto',
    });

    // Categorise file type
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'audio';
    }

    res.status(200).json({
      success: true,
      fileUrl: result.secureUrl,
      publicId: result.publicId,
      fileType,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error('Chat file upload failed:', error);
    next(error);
  }
};

// POST /messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, jobId, text } = req.body;
    if (!receiverId || !jobId || !text)
      return res.status(400).json({ success: false, message: 'receiverId, jobId and text required' });

    // Check if either user has blocked the other
    const senderUserObj = await User.findById(req.user.id).select('blockedUsers');
    const receiverUserObj = await User.findById(receiverId).select('blockedUsers');
    if (
      (senderUserObj && senderUserObj.blockedUsers && senderUserObj.blockedUsers.includes(receiverId)) ||
      (receiverUserObj && receiverUserObj.blockedUsers && receiverUserObj.blockedUsers.includes(req.user.id))
    ) {
      return res.status(403).json({ success: false, message: 'Message blocked. Users have blocked each other.' });
    }

    // Enforce Chat Rules:
    // - Client can initiate chat with any worker anytime.
    // - Worker CANNOT initiate chat first.
    // - Worker can only send a message after EITHER: (a) Client accepted their bid, OR (b) Client sent the first message.
    if (req.user.role === 'FREELANCER') {
      const Proposal = require('../models/Proposal');
      
      const clientInitiated = await Message.exists({
        sender: receiverId,
        receiver: req.user.id,
        job: jobId
      });

      const proposalAccepted = await Proposal.exists({
        job: jobId,
        freelancer: req.user.id,
        status: 'accepted'
      });

      if (!clientInitiated && !proposalAccepted) {
        return res.status(403).json({
          success: false,
          message: "Workers cannot initiate a chat unless the Client initiates it or accepts their bid."
        });
      }
    }

    const io = req.app.get('io');
    const recipientSockets = io ? io.sockets.adapter.rooms.get(receiverId) : null;
    const isOnline = recipientSockets && recipientSockets.size > 0;

    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      job: jobId,
      text,
      status: isOnline ? 'delivered' : 'sent',
    });

    const messagePayload = {
      ...message.toObject(),
      _id: message._id.toString(),
      senderId: req.user.id,
      senderName: req.user.name,
      timestamp: message.createdAt.toISOString(),
    };

    if (io) {
      const roomId = `${jobId}_${receiverId}`;
      const reverseRoomId = `${jobId}_${req.user.id}`;

      // Emit to conversation rooms so active chat screens update
      io.to(roomId).emit('receive_message', messagePayload);
      io.to(reverseRoomId).emit('receive_message', messagePayload);

      // Emit to receiver's personal user room
      io.to(receiverId).emit('receive_message', messagePayload);

      // Emit status update to sender
      if (isOnline) {
        io.to(req.user.id).emit('messages_delivered', { jobId, receiverId });
      }

      // Check if receiver is in the active chat room
      const receiverActiveRoom = `${jobId}_${req.user.id}`;
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
        const { createNotification } = require('../utils/notification');
        await createNotification({
          recipient: receiverId,
          sender: req.user.id,
          type: 'new_message',
          message: `${req.user.name}: ${text}`,
          relatedId: message._id,
          onModel: 'Message',
          io,
        });
      }
    }

    res.status(201).json({ success: true, data: messagePayload });
  } catch (error) { next(error); }
};

// GET /messages/:jobId/:otherUserId
exports.getMessages = async (req, res, next) => {
  try {
    const { jobId, otherUserId } = req.params;
    
    // Ensure jobId is a valid ObjectId, otherwise fallback to prevent Mongoose cast errors
    const mongoose = require('mongoose');
    const validJobId = mongoose.Types.ObjectId.isValid(jobId) ? jobId : '000000000000000000000000';

    const messages = await Message.find({
      job: validJobId,
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id },
      ],
    }).sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { job: validJobId, sender: otherUserId, receiver: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, data: messages });
  } catch (error) { next(error); }
};

// GET /messages/conversations
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).populate('job', 'title').sort({ createdAt: -1 });

    const convMap = new Map();
    for (const msg of messages) {
      const otherUserId = msg.sender.toString() === userId.toString() ? msg.receiver.toString() : msg.sender.toString();
      
      // Handle fallback if the job reference is null or invalid
      let jobId = '000000000000000000000000';
      if (msg.populated && msg.populated('job')) {
        jobId = msg.populated('job').toString();
      } else if (msg.job && msg.job._id) {
        jobId = msg.job._id.toString();
      } else if (msg.job) {
        jobId = msg.job.toString();
      }

      const key = `${jobId}_${otherUserId}`;

      if (!convMap.has(key)) {
        let otherUserName = otherUserId;
        let otherUserProfilePic = null;
        let otherUserAvatar = null;
        try {
          const u = await User.findById(otherUserId).select('name profilePic avatar');
          if (u) {
            otherUserName = u.name;
            otherUserProfilePic = u.profilePic;
            otherUserAvatar = u.avatar;
          }
        } catch {}

        convMap.set(key, {
          jobId,
          otherUserId,
          jobTitle:        msg.job?.title || '',
          name:            otherUserName,
          profilePic:      otherUserProfilePic || otherUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserName}`,
          lastMessage:     msg.text,
          lastMessageTime: new Date(msg.createdAt).toLocaleDateString('en-IN'),
          unreadCount:     0,
        });
      }
      if (msg.receiver.toString() === userId.toString() && !msg.isRead) convMap.get(key).unreadCount += 1;
    }

    res.status(200).json({ success: true, conversations: Array.from(convMap.values()) });
  } catch (error) { next(error); }
};