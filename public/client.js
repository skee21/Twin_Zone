document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const welcomeScreen = document.getElementById('welcome-screen');
    const nicknameScreen = document.getElementById('nickname-screen');
    const chatScreen = document.getElementById('chat-screen');
    
    const createRoomBtn = document.getElementById('create-room-btn');
    const nicknameForm = document.getElementById('nickname-form');
    const nicknameInput = document.getElementById('nickname-input');

    const messagesContainer = document.getElementById('messages-container');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const shareUrlInput = document.getElementById('share-url');
    const copyUrlBtn = document.getElementById('copy-url-btn');
    
    const modal = document.getElementById('modal');
    const modalText = document.getElementById('modal-text');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    let currentRoomId = null;
    let myNickname = null;
    const potentialRoomId = window.location.search.substring(1);

    const showModal = (message) => {
        modalText.textContent = message;
        modal.classList.remove('hidden');
    };

    const addNotificationToUI = (text) => {
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification');
        notificationElement.textContent = text;
        messagesContainer.appendChild(notificationElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const addMessageToUI = (msg, isMine) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message', isMine ? 'mine' : 'theirs');

        const senderElement = document.createElement('div');
        senderElement.classList.add('message-sender');
        senderElement.textContent = isMine ? 'You' : msg.nickname;

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message-bubble');

        const textElement = document.createElement('span');
        textElement.classList.add('message-text');
        textElement.textContent = msg.text;

        const timestampElement = document.createElement('span');
        timestampElement.classList.add('message-timestamp');
        timestampElement.style.display = 'block'; 
        timestampElement.style.textAlign = 'right';
        timestampElement.textContent = msg.timestamp;

        messageBubble.appendChild(textElement);
        messageBubble.appendChild(timestampElement);

        messageWrapper.appendChild(senderElement);
        messageWrapper.appendChild(messageBubble);
        messagesContainer.appendChild(messageWrapper);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const showChatRoom = (roomId, history) => {
        currentRoomId = roomId;
        nicknameScreen.classList.add('hidden');
        welcomeScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        
        shareUrlInput.value = window.location.href;
        messageInput.focus();

        messagesContainer.innerHTML = '';
        history.forEach(msg => {
            addMessageToUI(msg, msg.senderId === socket.id);
        });
    };

    createRoomBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        nicknameScreen.classList.remove('hidden');
        nicknameInput.focus();
    });

    nicknameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        myNickname = nicknameInput.value.trim();
        if (!myNickname) return;

        if (potentialRoomId) {
            socket.emit('join_room', { roomId: potentialRoomId, nickname: myNickname });
        } else {
            const newRoomId = 'room-' + Math.random().toString(36).substr(2, 9);
            history.pushState({ roomId: newRoomId }, `Chat Room ${newRoomId}`, `?${newRoomId}`);
            socket.emit('create_room', { roomId: newRoomId, nickname: myNickname });
        }
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText && currentRoomId) {
            const messageData = {
                senderId: socket.id,
                nickname: myNickname,
                text: messageText,
                timestamp: new Date().toLocaleTimeString()
            };
            
            addMessageToUI(messageData, true);
            
            socket.emit('send_message', { roomId: currentRoomId, message: messageText });
            messageInput.value = '';
        }
    });

    copyUrlBtn.addEventListener('click', () => {
        shareUrlInput.select();
        document.execCommand('copy');
        copyUrlBtn.textContent = 'Copied!';
        setTimeout(() => { copyUrlBtn.textContent = 'Copy'; }, 2000);
    });

    modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));

    socket.on('room_joined', ({ roomId, history }) => {
        showChatRoom(roomId, history);
        addNotificationToUI('You have joined the chat!');
    });

    socket.on('receive_message', (msg) => {
        addMessageToUI(msg, false);
    });
    
    socket.on('user_joined', (nickname) => {
        addNotificationToUI(`${nickname} has joined the chat.`);
    });

    socket.on('user_left', (nickname) => {
        addNotificationToUI(`${nickname} has left the chat.`);
    });

    socket.on('error_message', (message) => {
        showModal(message);
    });

    if (potentialRoomId) {
        welcomeScreen.classList.add('hidden');
        nicknameScreen.classList.remove('hidden');
        nicknameInput.focus();
    }
});
