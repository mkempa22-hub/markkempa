// Vercel serverless — "Chat with the Board Pack" LLM Q&A (deploy-time).
// Set env OPENAI_API_KEY in the Vercel project. Answers grounded in the board-pack context below.
const PACK = `Cleardose Health, Inc. — Series B board pack, Q2 2026 (synthetic GL).
Hybrid model: SaaS subscription + patient FFS (telehealth, CCM) + value-based-care capitation. Multi-state (MI OH WI IN IL MN PA FL TX AZ). Payors: UnitedHealthcare, Humana, Cigna, Clover, Self-Pay.
Q2-2026 revenue $3.85M (VBC ~$1.35M, SaaS ~$1.29M/ARR $5.28M, telehealth ~$0.81M, CCM ~$0.41M). Gross margin ~50% (COGS $1.91M). Opex $4.45M. Net loss -$2.4M.
Cash $2.4M, burn ~$0.8M/mo, ~3 months runway — raise needed now. VBC members 8,555 (2.5x since Jan-25). SaaS 138 customers, churn ~1.5-2%/mo.
Patient collection rate slipped 74% -> 62%; DSO up to 16.9 days; patient AR ~$514K. Headcount 83. Marketing ~$150K/mo. ARR up 75% since Jan-25.`;
export default async function handler(req, res) {
  try {
    const { q } = req.body || {};
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(200).json({ answer: "LLM not configured.", source: null });
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a CFO's analyst. Answer ONLY from the board pack provided. Be concise (2-3 sentences), cite the relevant section, and never invent figures." },
          { role: "user", content: `BOARD PACK:\n${PACK}\n\nQUESTION: ${q}` }
        ],
        temperature: 0.2
      })
    });
    const j = await r.json();
    res.status(200).json({ answer: j.choices?.[0]?.message?.content || "No answer.", source: "Board pack (LLM)" });
  } catch (e) { res.status(200).json({ answer: "Error reaching the model.", source: null }); }
}
