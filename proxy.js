import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/fetch', async (req, res) => {
    const { url, cookie } = req.query;

    if (!url) {
        return res.status(400).send('Missing URL');
    }

    // 动态提取目标 Host
    let targetHost = '';
    try {
        targetHost = new URL(url).hostname;
    } catch (e) {
        targetHost = 'www.douban.com';
    }

    console.log(`[Proxy] Requesting: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Cookie': cookie || '',
                'Referer': `https://${targetHost}/`,
                // 不要设置 Host，让 axios 自动处理
            },
            // 【核心修改 1】：禁止自动跟随重定向！
            // 这样如果豆瓣把书跳回电影，我们能立刻知道，而不是抓错数据
            maxRedirects: 0,

            // 【核心修改 2】：允许 3xx 状态码被视为“有效响应”以便我们处理，而不是直接抛错
            validateStatus: function (status) {
                return status >= 200 && status < 400;
            },
        });

        // 【核心修改 3】：检查是否发生了重定向 (301, 302)
        if (response.status === 301 || response.status === 302) {
            console.warn(`[Proxy Warning] ${url} 被重定向到了: ${response.headers.location}`);
            // 返回一个特定的错误标记，告诉前端这地方没权限
            return res.status(403).send('Douban Redirected: 豆瓣要求重定向（通常因为未登录或无权限），请尝试填写 Cookie。');
        }

        res.send(response.data);

    } catch (error) {
        // 如果 maxRedirects: 0 生效且 validateStatus 没拦截住，这里会捕获
        if (error.response && (error.response.status === 301 || error.response.status === 302)) {
             console.warn(`[Proxy Warning] 重定向拦截: ${url}`);
             return res.status(403).send('Douban Redirected: 请尝试填写 Cookie 以访问此数据。');
        }

        console.error(`[Proxy Error] ${error.message}`);
        if (error.response) {
            res.status(error.response.status).send(error.response.data || 'Proxy Error');
        } else {
            res.status(500).send('Network Error');
        }
    }
});

app.listen(PORT, () => {
    console.log(`✅ 本地中转服务已启动: http://localhost:${PORT}`);
    console.log(`👉 提示：如果遇到 "Douban Redirected" 错误，请在网页端填入 Cookie。`);
});