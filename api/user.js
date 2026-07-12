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
        // CÁCH DUY NHẤT CHÍNH XÁC: Gọi API lấy user bằng username
        // =============================================
        
        // Cách 1: Dùng API mới nhất
        const exactRes = await fetch(
            `https://users.roblox.com/v1/users/${encodeURIComponent(username)}`
        );
        
        if (exactRes.ok) {
            const exactData = await exactRes.json();
            if (exactData && exactData.id) {
                const user = {
                    id: exactData.id,
                    name: exactData.name,
                    displayName: exactData.displayName || exactData.name,
                    created: exactData.created
                };

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
                } catch (e) {}

                return res.json({
                    id: user.id,
                    name: user.name,
                    displayName: user.displayName || user.name,
                    created: user.created,
                    avatar: avatarUrl
                });
            }
        }

        // Cách 2: Fallback dùng API cũ (legacy) nếu cách 1 lỗi
        try {
            const legacyRes = await fetch(
                `https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(username)}`
            );
            
            if (legacyRes.ok) {
                const legacyData = await legacyRes.json();
                if (legacyData && legacyData.Id) {
                    const detailRes = await fetch(
                        `https://users.roblox.com/v1/users/${legacyData.Id}`
                    );
                    if (detailRes.ok) {
                        const detailData = await detailRes.json();
                        const user = {
                            id: detailData.id,
                            name: detailData.name,
                            displayName: detailData.displayName || detailData.name,
                            created: detailData.created
                        };

                        let avatarUrl = null;
                        try {
                            const avatarRes = await fetch(
                                `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png`
                            );
                            const avatarData = await avatarRes.json();
                            if (avatarData.data && avatarData.data.length > 0) {
                                avatarUrl = avatarData.data[0].imageUrl;
                            }
                        } catch (e) {}

                        return res.json({
                            id: user.id,
                            name: user.name,
                            displayName: user.displayName || user.name,
                            created: user.created,
                            avatar: avatarUrl
                        });
                    }
                }
            }
        } catch (e) {}

        // Không tìm thấy user
        return res.status(404).json({ error: 'Không tìm thấy user' });

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Lỗi server' });
    }
}
