// Cloudflare Worker (مجاني) — يعيد أرقام المتابعين لتطبيق My Life
// المتغيرات (Settings > Variables and Secrets):
//   TT_USER      اسم تيك توك بدون @   (اختياري، الافتراضي abdellah_tech0)
//   META_TOKEN   توكن صفحة فيسبوك طويل الأمد (Secret) — لفيسبوك وإنستغرام
//   FB_PAGE_ID   رقم صفحة فيسبوك Abdellah Tech
//   IG_USER_ID   رقم حساب إنستغرام الاحترافي المرتبط بالصفحة
// كل منصة تفشل تُرجَع null، والتطبيق يبقيها يدوية.

export default {
  async fetch(req, env) {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers });

    const out = { youtube: null, instagram: null, facebook: null, tiktok: null };

    // TikTok: الصفحة العامة (قد تتغير أو تُحجب أحياناً)
    try {
      const user = env.TT_USER || 'abdellah_tech0';
      const r = await fetch(`https://www.tiktok.com/@${user}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const html = await r.text();
      const m = html.match(/"followerCount"\s*:\s*(\d+)/);
      if (m) out.tiktok = Number(m[1]);
    } catch (e) {}

    // Facebook Page + Instagram: Graph API الرسمي
    if (env.META_TOKEN) {
      const g = async (id, fields) => {
        const r = await fetch(
          `https://graph.facebook.com/v21.0/${id}?fields=${fields}&access_token=${env.META_TOKEN}`
        );
        return r.json();
      };
      try {
        if (env.FB_PAGE_ID) {
          const j = await g(env.FB_PAGE_ID, 'followers_count,fan_count');
          out.facebook = j.followers_count ?? j.fan_count ?? null;
        }
      } catch (e) {}
      try {
        if (env.IG_USER_ID) {
          const j = await g(env.IG_USER_ID, 'followers_count');
          out.instagram = j.followers_count ?? null;
        }
      } catch (e) {}
    }

    return new Response(JSON.stringify(out), { headers });
  },
};
