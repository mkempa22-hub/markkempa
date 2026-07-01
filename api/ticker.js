// Vercel serverless function — live ticker data (deploy-time).
// Set env var FINNHUB_KEY (free at finnhub.io) in the Vercel project.
// Returns { stocks:[{sym,price,changePct}], news:[string] } — used by the portfolio ticker.
export default async function handler(req, res) {
  const SYMS = ["HIMS","TDOC","OSCR","DOCS","PRVA","AGL","HCAT","PHR","TEM","OMDA","UNH","HUM","ELV","GDRX"];
  const key = process.env.FINNHUB_KEY;
  let stocks = [];
  try {
    if (key) {
      const out = await Promise.all(SYMS.map(async (s) => {
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`);
        const j = await r.json();
        return { sym: s, price: j.c, changePct: j.dp };
      }));
      stocks = out.filter((x) => x.price);
    }
  } catch (e) { /* fall through to client fallback */ }

  let news = [];
  try {
    // Live digital-health funding / M&A headlines via Google News RSS (server-side, no CORS).
    const q = encodeURIComponent('"digital health" (funding OR "Series" OR raises OR acquires OR acquisition)');
    const rs = await fetch(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`);
    const xml = await rs.text();
    news = [...xml.matchAll(/<title>([\s\S]*?)<\/title>/g)]
      .map((m) => m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim())
      .slice(1, 9);
  } catch (e) { /* fall through */ }

  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  res.status(200).json({ stocks, news });
}
