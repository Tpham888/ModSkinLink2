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
        // =============================================
        // API CHÍNH XÁC NHẤT: api.roblox.com
        // API này tìm được BẤT KỲ user nào!
        // =============================================
        const response = await fetch(
            `https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(username)}`
        );

        if (!response.ok) {
            return res.status(404).json({ error: 'Không tìm thấy user' });
        }

        const data = await response.json();

        // Kiểm tra có dữ liệu không
        if (!data || !data.Id) {
            return res.status(404).json({ error: 'Không tìm thấy user' });
        }

        // Lấy thông tin chi tiết từ ID
        const detailRes = await fetch(
            `https://users.roblox.com/v1/users/${data.Id}`
        );

        let detailData = null;
        if (detailRes.ok) {
            detailData = await detailRes.json();
        }

        // Lấy avatar
        let avatarUrl = null;
        try {
            const avatarRes = await fetch(
                `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${data.Id}&size=150x150&format=Png`
            );
            const avatarData = await avatarRes.json();
            if (avatarData.data && avatarData.data.length > 0) {
                avatarUrl = avatarData.data[0].imageUrl;
            }
        } catch (e) {
            console.error('Avatar fetch error:', e);
        }

        // Trả về kết quả
        return res.json({
            id: data.Id,
            name: data.Username || username,
            displayName: detailData?.displayName || data.Username || username,
            created: detailData?.created || new Date().toISOString(),
            avatar: avatarUrl
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
}
