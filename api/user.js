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

    // Clean username - chỉ lấy phần trước dấu cách nếu có
    const cleanUsername = username.trim().split(' ')[0];

    try {
        // =============================================
        // CÁCH 1: Dùng API chính thức với timeout
        // =============================================
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        try {
            const response = await fetch(
                `https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(cleanUsername)}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data && data.Id) {
                    // Lấy thông tin chi tiết
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
                    } catch (e) {}

                    return res.json({
                        id: data.Id,
                        name: data.Username || cleanUsername,
                        displayName: detailData?.displayName || data.Username || cleanUsername,
                        created: detailData?.created || new Date().toISOString(),
                        avatar: avatarUrl
                    });
                }
            }
        } catch (e) {
            console.log('API 1 failed:', e.message);
        }

        // =============================================
        // CÁCH 2: Fallback dùng API search (có thể miss nhưng vẫn thử)
        // =============================================
        try {
            const searchRes = await fetch(
                `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(cleanUsername)}&limit=10`
            );
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.data && searchData.data.length > 0) {
                    // Tìm user gần đúng nhất
                    const user = searchData.data.find(
                        u => u.name.toLowerCase() === cleanUsername.toLowerCase()
                    ) || searchData.data[0];

                    if (user) {
                        const detailRes = await fetch(
                            `https://users.roblox.com/v1/users/${user.id}`
                        );
                        let detailData = null;
                        if (detailRes.ok) {
                            detailData = await detailRes.json();
                        }

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
                            displayName: detailData?.displayName || user.name,
                            created: detailData?.created || new Date().toISOString(),
                            avatar: avatarUrl
                        });
                    }
                }
            }
        } catch (e) {
            console.log('API 2 failed:', e.message);
        }

        // =============================================
        // CÁCH 3: Fallback cuối - dùng API cũ khác
        // =============================================
        try {
            const legacyRes = await fetch(
                `https://www.roblox.com/user.aspx?username=${encodeURIComponent(cleanUsername)}`
            );
            // API này không trả JSON, chỉ dùng để check user tồn tại
            // Nếu fetch thành công thì user tồn tại
            if (legacyRes.ok) {
                // Vẫn cần lấy ID, thử dùng cách khác
                const idRes = await fetch(
                    `https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(cleanUsername)}`
                );
                if (idRes.ok) {
                    const idData = await idRes.json();
                    if (idData && idData.Id) {
                        return res.json({
                            id: idData.Id,
                            name: cleanUsername,
                            displayName: cleanUsername,
                            created: new Date().toISOString(),
                            avatar: null
                        });
                    }
                }
            }
        } catch (e) {
            console.log('API 3 failed:', e.message);
        }

        // Không tìm thấy user
        return res.status(404).json({ 
            error: 'Không tìm thấy user. Vui lòng kiểm tra lại username!',
            username: cleanUsername
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: 'Lỗi server: ' + error.message,
            username: cleanUsername
        });
    }
}
