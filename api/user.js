// ============================================================
// CHECK ROBLOX USER - VIA PROXY (/api/user)
// ============================================================
async function checkRobloxUser() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();

    if (!username) {
        showToast('⚠️ Vui lòng nhập username Roblox', 'error');
        return;
    }

    const btn = document.getElementById('confirmBtn');
    btn.disabled = true;
    const loadingBar = document.getElementById('loadingBar');
    const loadFill = document.getElementById('loadFill');
    const loadText = document.getElementById('loadText');

    loadingBar.classList.add('show');
    loadFill.style.width = '0%';
    loadText.textContent = '🔍 Đang kiểm tra Roblox User...';

    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 10 + 5;
        if (progress > 90) progress = 90;
        loadFill.style.width = progress + '%';
    }, 150);

    try {
        // Gọi API với username (không phân biệt hoa thường)
        const res = await fetch(`/api/user?username=${encodeURIComponent(username)}`);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Không tìm thấy user');
        }

        const user = await res.json();

        clearInterval(progressInterval);
        loadFill.style.width = '100%';

        const userData = {
            id: user.id,
            username: user.name,
            displayName: user.displayName || user.name,
            created: user.created || new Date().toISOString(),
            avatar: user.avatar || null
        };

        // Hiển thị lên giao diện
        document.getElementById('userNameDisplay').textContent = userData.displayName;
        document.getElementById('userIdDisplay').textContent = 'ID: ' + userData.id;
        document.getElementById('userCreatedDisplay').textContent = 
            'Tham gia: ' + new Date(userData.created).toLocaleDateString('vi-VN');

        // Hiển thị avatar
        const avatarEl = document.getElementById('userAvatar');
        if (userData.avatar) {
            const img = document.createElement('img');
            img.src = userData.avatar;
            img.onerror = () => {
                avatarEl.textContent = userData.displayName.charAt(0).toUpperCase();
                avatarEl.style.background = 'linear-gradient(135deg, #ffb700, #f57c00)';
                avatarEl.style.display = 'flex';
                avatarEl.style.alignItems = 'center';
                avatarEl.style.justifyContent = 'center';
            };
            img.onload = () => {
                avatarEl.innerHTML = '';
                avatarEl.appendChild(img);
                avatarEl.style.background = 'none';
                avatarEl.style.display = 'block';
            };
            avatarEl.innerHTML = '';
            avatarEl.appendChild(img);
        } else {
            avatarEl.textContent = userData.displayName.charAt(0).toUpperCase();
            avatarEl.style.background = 'linear-gradient(135deg, #ffb700, #f57c00)';
            avatarEl.style.display = 'flex';
            avatarEl.style.alignItems = 'center';
            avatarEl.style.justifyContent = 'center';
        }

        currentUser = userData;
        verifiedUserData = userData;
        isVerified = true;

        loadText.textContent = '✅ Tìm thấy Roblox User!';

        document.getElementById('userCard').classList.add('show');

        const statusBox = document.getElementById('userStatusBox');
        statusBox.classList.add('show');
        document.getElementById('statusUsername').textContent = userData.displayName;
        document.getElementById('statusUserId').textContent = 'ID: ' + userData.id;
        const badge = document.getElementById('statusBadge');
        badge.className = 'status-badge success';
        badge.textContent = '✅ Tìm thấy tài khoản';

        const statusAvatar = document.getElementById('statusAvatarImg');
        if (userData.avatar) {
            statusAvatar.src = userData.avatar;
        } else {
            statusAvatar.src = '';
        }

        setTimeout(() => {
            loadingBar.classList.remove('show');
            btn.disabled = false;
            showToast('✅ Tìm thấy: ' + userData.displayName, 'success');
            updateCartUI();
            updateZaloAmount();
        }, 400);

    } catch (error) {
        console.error('Error:', error);
        clearInterval(progressInterval);
        loadFill.style.width = '100%';
        loadText.textContent = '❌ ' + (error.message || 'Không tìm thấy user!');
        showToast('❌ ' + (error.message || 'Không tìm thấy Roblox User!'), 'error');
        isVerified = false;
        verifiedUserData = null;

        document.getElementById('userCard').classList.remove('show');

        const statusBox = document.getElementById('userStatusBox');
        statusBox.classList.add('show');
        document.getElementById('statusUsername').textContent = username;
        document.getElementById('statusUserId').textContent = 'ID: Không tìm thấy';
        const badge = document.getElementById('statusBadge');
        badge.className = 'status-badge error';
        badge.textContent = '❌ Không tìm thấy tài khoản';

        setTimeout(() => {
            loadingBar.classList.remove('show');
            btn.disabled = false;
        }, 1500);
    }
}
