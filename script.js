const API = 'http://localhost:3000';
let token = null;
let currentUserId = null;
let currentUserLogin = null;
let currentFriendId = null;

// DOM элементы
const authDiv = document.getElementById('auth');
const messengerDiv = document.getElementById('messenger');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const avatarBtn = document.getElementById('avatarBtn');
const avatarImg = document.getElementById('avatarImg');
const userLoginSpan = document.getElementById('userLogin');
const feedBtn = document.getElementById('feedBtn');
const friendsBtn = document.getElementById('friendsBtn');
const searchBtn = document.getElementById('searchBtn');
const chatsBtn = document.getElementById('chatsBtn');
const profileModal = document.getElementById('profileModal');
const saveProfileBtn = document.getElementById('saveProfileBtn');

// Функции API
async function request(url, options = {}) {
    const res = await fetch(API + url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function register() {
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    try {
        await request('/api/register', { method: 'POST', body: JSON.stringify({ login, password }) });
        alert('Регистрация успешна, теперь войдите');
    } catch(e) { alert(e.message); }
}

async function login() {
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    try {
        const data = await request('/api/login', { method: 'POST', body: JSON.stringify({ login, password }) });
        token = data.token;
        currentUserId = data.user.id;
        currentUserLogin = data.user.login;
        localStorage.setItem('token', token);
        authDiv.style.display = 'none';
        messengerDiv.style.display = 'flex';
        loadUserProfile();
        loadFeed();
    } catch(e) { alert('Ошибка входа'); }
}

async function loadUserProfile() {
    const user = await request('/api/user');
    userLoginSpan.innerText = user.login;
    if (user.avatar) avatarImg.src = API + user.avatar;
    else avatarImg.src = 'https://via.placeholder.com/80';
}

async function updateProfile() {
    const newLogin = document.getElementById('editLogin').value;
    const newPassword = document.getElementById('editPassword').value;
    const avatarFile = document.getElementById('editAvatar').files[0];
    let avatarUrl = null;
    if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const res = await fetch(API + '/api/upload-avatar', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        avatarUrl = data.avatarUrl;
    }
    await request('/api/user/update', {
        method: 'POST',
        body: JSON.stringify({ login: newLogin, password: newPassword, avatar: avatarUrl })
    });
    alert('Профиль обновлён');
    loadUserProfile();
    profileModal.style.display = 'none';
}

async function loadFeed() {
    const posts = await request('/api/posts');
    const container = document.getElementById('postsList');
    container.innerHTML = posts.map(p => `
        <div class="post-card">
            <strong>${p.author}</strong>
            <p>${p.text}</p>
            ${p.imageUrl ? `<img src="${API}${p.imageUrl}">` : ''}
            <div>❤️ ${p.likes}</div>
        </div>
    `).join('');
}

async function createPost() {
    const text = document.getElementById('postText').value;
    const image = document.getElementById('postImage').files[0];
    const formData = new FormData();
    formData.append('text', text);
    if (image) formData.append('image', image);
    const res = await fetch(API + '/api/posts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    if (res.ok) { loadFeed(); document.getElementById('postText').value = ''; }
}

async function searchUsers() {
    const query = document.getElementById('searchInput').value;
    const users = await request(`/api/users/search?q=${query}`);
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = users.map(u => `
        <div>
            <span>${u.login}</span>
            <button onclick="addFriend(${u.id})">➕ Добавить</button>
        </div>
    `).join('');
}

async function addFriend(friendId) {
    await request('/api/friends/add', { method: 'POST', body: JSON.stringify({ friendId }) });
    alert('Друг добавлен');
    loadFriends();
}

async function loadFriends() {
    const user = await request('/api/user');
    const allUsers = await request('/api/users/search?q=');
    const friends = allUsers.filter(u => user.friends.includes(u.id));
    const container = document.getElementById('friendsList');
    container.innerHTML = friends.map(f => `<div>${f.login} <button onclick="startChat(${f.id})">💬 Написать</button></div>`).join('');
}

async function loadChats() {
    const user = await request('/api/user');
    const allUsers = await request('/api/users/search?q=');
    const friends = allUsers.filter(u => user.friends.includes(u.id));
    const chatsList = document.getElementById('chatsList');
    chatsList.innerHTML = friends.map(f => `<div><strong>${f.login}</strong> <button onclick="startChat(${f.id})">Открыть чат</button></div>`).join('');
}

async function startChat(friendId) {
    currentFriendId = friendId;
    document.getElementById('chatWindow').style.display = 'block';
    const messages = await request(`/api/messages/${friendId}`);
    const container = document.getElementById('chatMessages');
    container.innerHTML = messages.map(m => `<div class="message ${m.from === currentUserId ? 'my-message' : 'friend-message'}">${m.text}</div>`).join('');
}

async function sendMessage() {
    const text = document.getElementById('messageInput').value;
    if (!text || !currentFriendId) return;
    await request('/api/messages/send', { method: 'POST', body: JSON.stringify({ to: currentFriendId, text }) });
    document.getElementById('messageInput').value = '';
    startChat(currentFriendId);
}

// UI переключения
function showFeed() { showSection('feed'); loadFeed(); }
function showFriends() { showSection('friends'); loadFriends(); }
function showSearch() { showSection('search'); }
function showChats() { showSection('chats'); loadChats(); }
function showSection(id) {
    ['feed','friends','search','chats'].forEach(s => document.getElementById(s).style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

// Инициализация событий
loginBtn.onclick = login;
registerBtn.onclick = register;
logoutBtn.onclick = () => { localStorage.removeItem('token'); location.reload(); };
avatarBtn.onclick = () => profileModal.style.display = 'flex';
document.querySelector('.close').onclick = () => profileModal.style.display = 'none';
saveProfileBtn.onclick = updateProfile;
document.getElementById('createPostBtn').onclick = createPost;
document.getElementById('doSearch').onclick = searchUsers;
document.getElementById('sendMsgBtn').onclick = sendMessage;
feedBtn.onclick = showFeed;
friendsBtn.onclick = showFriends;
searchBtn.onclick = showSearch;
chatsBtn.onclick = showChats;

// Автологин
const savedToken = localStorage.getItem('token');
if (savedToken) {
    token = savedToken;
    authDiv.style.display = 'none';
    messengerDiv.style.display = 'flex';
    loadUserProfile();
    loadFeed();
} else {
    authDiv.style.display = 'flex';
    messengerDiv.style.display = 'none';
}