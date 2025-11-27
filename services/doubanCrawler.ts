// --- START OF FILE services/doubanCrawler.ts ---

import { ReviewItem } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- 修改后的 parseDoubanPage ---

const parseDoubanPage = (html: string, category: 'movie' | 'book' | 'music'): ReviewItem[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const data: ReviewItem[] = [];

    // 检查反爬或权限标题
    const title = doc.querySelector('title')?.textContent || "";
    if (title.includes("禁止访问") || title.includes("登录豆瓣")) {
         console.warn(`[Douban Block] 标题提示异常: ${title}`);
    }

    // --- 核心修复：同时查找 .item (电影网格) 和 .subject-item (书/音列表) ---
    const items = doc.querySelectorAll(".item, .subject-item");

    items.forEach((item) => {
        try {
            // 1. 标题兼容性处理：
            // 电影(.item)通常在 .title a
            // 书音(.subject-item)通常在 .info h2 a
            const titleEl = item.querySelector(".title a") || item.querySelector(".info h2 a");
            const title = titleEl?.textContent?.trim() || "";

            // 2. 评分提取 (保持原有逻辑，通用性较好)
            let rating = 0;
            const ratingSpan = item.querySelector('[class^="rating"]');
            if (ratingSpan) {
                const match = ratingSpan.className.match(/rating(\d)-t/);
                if (match) rating = parseInt(match[1]);
            }

            // 3. 评论兼容性处理：
            // 书/音的评论有时在 .short-note .comment，有时直接在 .short-note 中
            const commentEl = item.querySelector(".comment") || item.querySelector(".short-note");
            const comment = commentEl?.textContent?.trim() || "";

            // 4. 日期提取 (通常 .date 是通用的，但有时需要去 .info 里找)
            const dateEl = item.querySelector(".date");
            const date = dateEl?.textContent?.trim() || "";

            // 5. 标签提取
            const tags: string[] = [];
            const tagEl = item.querySelector(".tags");
            if (tagEl && tagEl.textContent) {
                const tagText = tagEl.textContent.replace('标签: ', '').trim();
                if (tagText) tags.push(...tagText.split(/\s+/));
            }

            // 只有当标题存在时才推入数据
            if(title) {
                data.push({ title, rating, comment, date, category, tags });
            }
        } catch(e) {
            console.error("解析单条数据失败", e);
        }
    });
    return data;
};

// --- 唯一的抓取通道：走本地 Node 服务 (即使用你的 IP) ---
const fetchViaLocalServer = async (targetUrl: string, cookie: string): Promise<string> => {
    // 指向你的 proxy.js 地址
    const localProxy = `/fetch`;
    
    // 哪怕没有 cookie，也要传个空字符串过去，proxy.js 会处理
    const encodedCookie = encodeURIComponent(cookie || '');
    const encodedUrl = encodeURIComponent(targetUrl);
    
    try {
        // 直接请求本地服务器
        const response = await fetch(`${localProxy}?url=${encodedUrl}&cookie=${encodedCookie}`);
        
        if (!response.ok) {
            // 解析错误信息
            const errText = await response.text().catch(() => '');
            if (response.status === 403) throw new Error("403 Forbidden: IP被豆瓣限制或Cookie无效");
            if (response.status === 418) throw new Error("418 I'm a teapot: 豆瓣认为你是机器人，IP暂时被封");
            throw new Error(`请求失败 (Status ${response.status}): ${errText}`);
        }
        
        const html = await response.text();
        return html;
    } catch (e: any) {
        if (e.message.includes("Failed to fetch") || e.message.includes("Connection refused")) {
            throw new Error("❌ 无法连接本地代理！请确保在终端运行了 'node proxy.js'");
        }
        throw e;
    }
};

// --- 主入口 ---
export const crawlUserReviews = async (
    uid: string,
    userCookie: string, 
    onLog: (msg: string) => void
): Promise<ReviewItem[]> => {
    const categories = ['movie'] as const;
    const allReviews: ReviewItem[] = [];

    onLog(`🔌 模式: 本地直连 (My IP)`);
    onLog(`📡 确保后台已运行 'node proxy.js'`);

    if (!userCookie) {
        onLog(`⚠️ 未检测到 Cookie，将以游客身份访问 (只能抓取公开可见内容，频率受限)`);
    } else {
        onLog(`🍪 已加载 Cookie，将以登录身份访问`);
    }

    for (const cat of categories) {
        const subdomain = cat === 'movie' ? 'movie' : cat === 'book' ? 'book' : 'music';
        
        // 分页设置：
        // 如果有 Cookie，一般能爬更多；没有 Cookie 很容易被限流，我们这里保守一点
        const maxPages = 4;
        
        let start = 0;
        
        for (let page = 1; page <= maxPages; page++) {
            const url = `https://${subdomain}.douban.com/people/${uid}/collect?start=${start}&sort=time&rating=all&filter=all&mode=grid`;

            try {
                // 不再有任何代理池选择，只有一条路：走 Local Proxy
                onLog(`⚡ [${cat.toUpperCase()}] P${page} 请求中...`);
                
                // 等待时间：如果有 Cookie，可以是 1-2秒；没有 Cookie 建议 2-3秒以上
                const delay = userCookie ? 1500 : 3000;
                if (page > 1) await sleep(delay); 

                const html = await fetchViaLocalServer(url, userCookie);

                // 检查内容是否包含用户ID (简单的反反爬验证)
                if (html.includes("检测到有异常请求") || html.includes("登录豆瓣")) {
                     throw new Error("豆瓣反爬拦截 (IP 频率过高)");
                }

                const items = parseDoubanPage(html, cat);
                if (items.length === 0) {
                    if (page === 1) onLog(`ℹ️ ${cat} 暂无数据或数据私密`);
                    break;
                }

                onLog(`✅ 捕获 ${items.length} 条数据`);
                allReviews.push(...items);
                start += 15;

            } catch (err: any) {
                onLog(`⛔ ${cat} 停止: ${err.message}`);
                break; // 只要出错，为了安全，直接跳过该类别的后续页
            }
        }
    }
    
    if (allReviews.length === 0) throw new Error("数据为空。可能是 IP 被封、UID 错误或用户开启了隐私保护。");
    
    return allReviews;
};