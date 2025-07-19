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
    const handleJoinRoom = (roomId, nickname) => {
        socket.join(roomId);
        chatRooms[roomId].users[socket.id] = nickname;
        
        socket.emit('room_joined', { 
            roomId, 
            history: chatRooms[roomId].messages,
            nickname
        });

        socket.to(roomId).emit('user_joined', nickname);
    };

    socket.on('create_room', ({ roomId, nickname }) => {
        if (!chatRooms[roomId]) {
            chatRooms[roomId] = { messages: [], users: {} };
            handleJoinRoom(roomId, nickname);
        }
    });

    socket.on('join_room', ({ roomId, nickname }) => {
        if (chatRooms[roomId]) {
            handleJoinRoom(roomId, nickname);
        } else {
            socket.emit('error_message', 'This chat room does not exist.');
        }
    });

    socket.on('send_message', (data) => {
        const { roomId, message } = data;
        const room = chatRooms[roomId];
        const nickname = room?.users[socket.id];

        if (room && nickname) {
            const messageData = {
                senderId: socket.id,
                nickname: nickname,
                text: message,
                timestamp: new Date().toLocaleTimeString()
            };
            room.messages.push(messageData);
            socket.to(roomId).emit('receive_message', messageData);
        }
    });

    socket.on('disconnect', () => {
        for (const roomId in chatRooms) {
            const room = chatRooms[roomId];
            if (room.users[socket.id]) {
                const nickname = room.users[socket.id];
                delete room.users[socket.id];
                
                socket.to(roomId).emit('user_left', nickname);

                if (Object.keys(room.users).length === 0) {
                    delete chatRooms[roomId];
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`TwinZone server is running on http://localhost:${PORT}`);
});
