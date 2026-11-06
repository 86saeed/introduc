/* =====================================================================
   اتصال درگاه پرداخت (نقطه‌ی اتصال آماده برای شما)

   جریان کار:
   1) کاربر در پروفایل مبلغ را وارد می‌کند و «پرداخت آنلاین» را می‌زند.
   2) Payment.start() یک رکورد پرداخت (وضعیت «در انتظار») می‌سازد و کاربر را
      به «آدرس درگاه» می‌فرستد. آدرس از پنل ادمین > تنظیمات می‌آید و این
      جانشین‌ها را پشتیبانی می‌کند:  {paymentId} {amount} {callback} {phone}
      (مبلغ به «تومان» است؛ اگر درگاه ریال می‌خواهد در سرور خودتان ×۱۰ کنید.)
      معمولاً این آدرس یک endpoint روی سرور شماست که پرداخت را در درگاه
      (زرین‌پال، آیدی‌پی، …) می‌سازد و کاربر را به صفحه‌ی بانک می‌برد.
   3) درگاه کاربر را به payment-result.html برمی‌گرداند (آدرس بازگشت).
      نام پارامترها را در parseCallback() با درگاه خودتان هماهنگ کنید.
   4) Payment.settle() پرداخت را تأیید می‌کند:
        - اگر «آدرس تأیید (verify)» تنظیم باشد، به سرور شما POST می‌زند و فقط
          وقتی پاسخ {"ok":true} باشد کیف پول شارژ می‌شود (روش امن).
        - اگر حالت آزمایشی روشن باشد، بدون تأیید شارژ می‌شود (فقط تست).
        - در غیر این صورت وضعیت «نیازمند بررسی» می‌شود و مدیر از پنل ادمین
          پس از اطمینان از واریز، دستی شارژ می‌کند.

   هشدار امنیتی: شارژ بر اساس پارامترهای آدرس بازگشت به‌تنهایی امن نیست
   (هر کسی می‌تواند آن را جعل کند). تأیید نهایی باید در سرور شما و با
   API تأیید درگاه انجام شود.
   ===================================================================== */
const Payment = (() => {
  const KEY = "shahrak_payments";
  const list = () => _ls(KEY, []);
  const save = l => { try { localStorage.setItem(KEY, JSON.stringify(l.slice(-300))); return true; } catch { return false; } };
  const okUrl = u => /^(https?:\/\/\S+|[\w./-]+\.html(\?\S*)?)$/.test(u);
  const callbackUrl = () => new URL("payment-result.html", location.href).href;
  const enabled = () => { const S = getSettings(); return !!(S.gatewayEnabled && S.gatewayUrl && okUrl(S.gatewayUrl)); };

  function start(amount, user) {
    const S = getSettings();
    if (!enabled()) return false;
    const id = "pay" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const l = list();
    l.push({ id, user: user.phone, name: user.name, amount, status: "pending", date: new Date().toISOString() });
    if (!save(l)) return false;
    const url = S.gatewayUrl
      .replace(/\{paymentId\}/g, encodeURIComponent(id)).replace(/\{amount\}/g, String(amount))
      .replace(/\{callback\}/g, encodeURIComponent(callbackUrl())).replace(/\{phone\}/g, encodeURIComponent(user.phone));
    location.href = url;
    return true;
  }

  /* نام پارامترهای برگشتی درگاه خودتان را اینجا تنظیم کنید */
  function parseCallback(q) {
    const status = (q.get("status") || q.get("Status") || "").toLowerCase();
    return {
      paymentId: q.get("paymentId") || q.get("order_id") || "",
      ok: ["ok", "success", "1", "true", "100"].includes(status),
      ref: q.get("ref") || q.get("RefID") || q.get("track_id") || q.get("Authority") || "",
      raw: Object.fromEntries(q)
    };
  }

  function credit(p, note) {
    if (p.credited) return;
    if (walletApply(p.user, p.amount, "charge", note, "system", p.id)) { p.credited = true; p.status = "paid"; }
    else p.status = "needs_review";
  }

  async function settle(cb) {
    const l = list(), p = l.find(x => x.id === cb.paymentId);
    if (!p) return { state: "unknown" };
    if (p.status === "pending") {
      p.ref = cb.ref || p.ref || "";
      const S = getSettings();
      if (!cb.ok) p.status = "failed";
      else if (S.verifyUrl) {
        try {
          const r = await fetch(S.verifyUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId: p.id, amount: p.amount, phone: p.user, ref: cb.ref, params: cb.raw }) });
          const j = await r.json();
          if (j && j.ok && (j.amount == null || +j.amount === p.amount)) credit(p, "شارژ از درگاه (پیگیری " + (cb.ref || p.id) + ")");
          else p.status = "failed";
        } catch { p.status = "needs_review"; }      // خطای شبکه: مدیر دستی بررسی کند
      }
      else if (S.testMode) credit(p, "شارژ آزمایشی درگاه");
      else p.status = "needs_review";
      save(l);
    }
    return { state: p.status, p };
  }

  async function renderResult(box) {
    const fa = n => Number(n).toLocaleString("fa-IR"), fd = s => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
    const esc = s => String(s).replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
    box.innerHTML = '<div class="shop-wrap co-done"><i class="fa-solid fa-spinner fa-spin" style="color:var(--blue)"></i><h1>در حال بررسی پرداخت…</h1></div>';
    const r = await settle(parseCallback(new URLSearchParams(location.search)));
    const M = {
      paid: ["fa-circle-check", "#16a34a", "پرداخت موفق بود", `مبلغ ${r.p ? fa(r.p.amount) : ""} تومان به کیف پول شما اضافه شد.`],
      needs_review: ["fa-hourglass-half", "#d98a00", "پرداخت ثبت شد", "پرداخت شما دریافت شد و در انتظار تأیید است. اگر کیف پول شارژ نشد، از بخش پشتیبانی پیگیری کنید."],
      failed: ["fa-circle-xmark", "#e5484d", "پرداخت ناموفق بود", "اگر مبلغی از حساب شما کسر شده، معمولاً تا چند ساعت برمی‌گردد؛ در غیر این صورت به پشتیبانی اطلاع دهید."],
      pending: ["fa-hourglass-half", "#d98a00", "پرداخت هنوز کامل نشده", "نتیجه‌ی پرداخت از درگاه دریافت نشده است."],
      unknown: ["fa-circle-question", "#5d6b7e", "پرداخت پیدا نشد", "این لینک معتبر نیست یا پرداخت قبلاً در مرورگر دیگری ثبت شده است."]
    }[r.state] || [];
    box.innerHTML = `<div class="shop-wrap co-done"><i class="fa-solid ${M[0]}" style="color:${M[1]}"></i><h1>${M[2]}</h1><p>${M[3]}</p>
      ${r.p ? `<p>کد پرداخت: <b dir="ltr">${esc(r.p.id)}</b>${r.p.ref ? `<br>شماره پیگیری: <b dir="ltr">${esc(fd(r.p.ref))}</b>` : ""}</p>` : ""}
      <a class="about-cta" href="profile.html">بازگشت به پروفایل</a> <a class="about-cta" style="background:#fff;color:var(--blue);border:1px solid var(--blue)" href="support.html">پشتیبانی</a></div>`;
  }
  return { start, enabled, settle, parseCallback, renderResult, callbackUrl, list, save, okUrl };
})();
