const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chatRooms = {};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('create_room', (roomId) => {
        if (!chatRooms[roomId]) {
            chatRooms[roomId] = []; 
            socket.join(roomId);
            console.log(`User ${socket.id} created and joined room: ${roomId}`);
            socket.emit('room_joined', { roomId, history: chatRooms[roomId] });
        }
    });

    socket.on('join_room', (roomId) => {
        if (chatRooms[roomId]) {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room: ${roomId}`);
            socket.emit('room_joined', { roomId, history: chatRooms[roomId] });
        } else {
            socket.emit('error_message', 'This chat room does not exist.');
        }
    });

    socket.on('send_message', (data) => {
        const { roomId, message } = data;
        if (chatRooms[roomId]) {
            const messageData = {
                senderId: socket.id,
                text: message,
                timestamp: new Date().toLocaleTimeString()
            };
            chatRooms[roomId].push(messageData);
            io.to(roomId).emit('receive_message', messageData);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        socket.rooms.forEach(roomId => {
            if (roomId !== socket.id) { 
                const room = io.sockets.adapter.rooms.get(roomId);
                if (!room || room.size === 0) {
                    delete chatRooms[roomId];
                    console.log(`Room ${roomId} is empty and has been destroyed.`);
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`TwinZone server is running on http://localhost:${PORT}`);
});
