export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Thiếu username' });
    }

    try {
        // Gọi Roblox API search - KHÔNG phân biệt hoa thường
        const response = await fetch(
            `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`
        );

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy user' });
        }

        // Tìm user trùng khớp KHÔNG phân biệt hoa thường
        const user = data.data.find(
            u => u.name.toLowerCase() === username.toLowerCase()
        );

        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy user chính xác' });
        }

        // Lấy thêm thông tin chi tiết
        const detailRes = await fetch(`https://users.roblox.com/v1/users/${user.id}`);
        const detail = await detailRes.json();

        // Lấy avatar
        let avatarUrl = null;
        try {
            const avatarRes = await fetch(
                `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png`
            );
            const avatarData = await avatarRes.json();
            if (avatarData.data && avatarData.data.length > 0) {
                avatarUrl = avatarData.data[0].imageUrl;
            }
        } catch (e) {
            console.error('Avatar fetch error:', e);
        }

        return res.json({
            id: user.id,
            name: user.name,
            displayName: detail.displayName || user.name,
            created: detail.created,
            avatar: avatarUrl
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Lỗi server' });
    }
}
