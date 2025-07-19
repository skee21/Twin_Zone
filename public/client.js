document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatScreen = document.getElementById('chat-screen');
    const createRoomBtn = document.getElementById('create-room-btn');
    const messagesContainer = document.getElementById('messages-container');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const shareUrlInput = document.getElementById('share-url');
    const copyUrlBtn = document.getElementById('copy-url-btn');
    const modal = document.getElementById('modal');
    const modalText = document.getElementById('modal-text');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    let currentRoomId = null;

    const showModal = (message) => {
        modalText.textContent = message;
        modal.classList.remove('hidden');
    };

    const hideModal = () => {
        modal.classList.add('hidden');
    };

    const addMessageToUI = (msg, isMine) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', isMine ? 'mine' : 'theirs');

        const textElement = document.createElement('div');
        textElement.classList.add('message-text');
        textElement.textContent = msg.text;

        const timestampElement = document.createElement('div');
        timestampElement.classList.add('message-timestamp');
        timestampElement.textContent = msg.timestamp;

        messageElement.appendChild(textElement);
        messageElement.appendChild(timestampElement);
        messagesContainer.appendChild(messageElement);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const showChatRoom = (roomId, history) => {
        currentRoomId = roomId;
        welcomeScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        shareUrlInput.value = window.location.href;

        messagesContainer.innerHTML = '';
        history.forEach(msg => {
            addMessageToUI(msg, msg.senderId === socket.id);
        });
    };

    createRoomBtn.addEventListener('click', () => {
        const roomId = 'room-' + Math.random().toString(36).substr(2, 9);
        history.pushState({ roomId }, `Chat Room ${roomId}`, `?${roomId}`);
        socket.emit('create_room', roomId);
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message && currentRoomId) {
            socket.emit('send_message', { roomId: currentRoomId, message });
            messageInput.value = '';
        }
    });

    copyUrlBtn.addEventListener('click', () => {
        shareUrlInput.select();
        document.execCommand('copy');
        copyUrlBtn.textContent = 'Copied!';
        setTimeout(() => { copyUrlBtn.textContent = 'Copy'; }, 2000);
    });

    modalCloseBtn.addEventListener('click', hideModal);

    socket.on('room_joined', ({ roomId, history }) => {
        showChatRoom(roomId, history);
    });

    socket.on('receive_message', (msg) => {
        addMessageToUI(msg, msg.senderId === socket.id);
    });

    socket.on('error_message', (message) => {
        showModal(message);
    });

    const potentialRoomId = window.location.search.substring(1);
    if (potentialRoomId) {
        socket.emit('join_room', potentialRoomId);
    }
});
