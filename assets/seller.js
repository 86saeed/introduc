/* پنل فروشنده — فقط فرانت (داده‌ها فعلاً در localStorage؛ بک‌اند بعداً جایگزین می‌شود) */
/* ابزار توسعه: برای حذف دکمه‌ی «اطلاعات تستی» مقدار را false کنید */
const DEV_TOOLS = true;

window.renderSeller = function () {
  const box = $("sellerView"), u = session(), dlg = $("sModal");
  if (!u) {
    box.innerHTML = `<div class="shop-wrap co-empty"><i class="fa-solid fa-store"></i><h1>برای ساخت فروشگاه وارد شوید</h1><p><a class="about-cta" href="${loginUrl(here(), true)}">ورود / ثبت‌نام</a></p></div>`;
    return;
  }
  /* ---------- ابزارها ---------- */
  const sw = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { flash("حافظه مرورگر پر است؛ تصاویر را کوچک‌تر یا کمتر کنید."); return false; } };
  function flash(t) { let el = $("slToast"); if (!el) { el = document.createElement("div"); el.id = "slToast"; el.className = "sl-toast"; el.setAttribute("role", "status"); document.body.appendChild(el); } el.textContent = t; el.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => (el.hidden = true), 2800); }
  const sImg = (file, max) => new Promise((res, rej) => {
    const r = new FileReader(); r.onerror = rej;
    r.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/webp", 0.82)); }; im.src = r.result; };
    r.readAsDataURL(file);
  });
  const nidOk = s => { if (!/^\d{10}$/.test(s) || /^(\d)\1{9}$/.test(s)) return false; const d = s.split("").map(Number), r = d.slice(0, 9).reduce((a, v, i) => a + v * (10 - i), 0) % 11; return r < 2 ? d[9] === r : d[9] === 11 - r; };
  const shebaOk = s => { if (!/^IR\d{24}$/.test(s)) return false; const n = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => c.charCodeAt(0) - 55); let r = 0; for (const ch of n) r = (r * 10 + +ch) % 97; return r === 1; };
  const maskSheba = s => s ? s.slice(0, 4) + "••••••••••••••••" + s.slice(-4) : "";
  const num = v => +toEn(v || "0").replace(/\D/g, "");
  const getS = () => sellerOf(u.phone);
  const saveSeller = s => { const a = getSellers(); a[s.id] = s; return sw(SELLERS_KEY, a); };
  const kycAll = () => _ls(KYC_KEY, {});
  const myProds = id => _ls(SPROD_KEY, []).filter(p => p.shopId === id);
  const myOrders = s => _ls("shahrak_orders", []).map(ensureSubs).filter(o => o.subs[s.id]).reverse();
  const fld = (label, name, val = "", extra = "") => `<label>${label}<input name="${name}" value="${esc(val)}" ${extra}></label>`;
  const stTag = st => `<span class="o-state st-${st === "delivered" ? "delivered" : st === "canceled" || st === "returned" ? "canceled" : st === "shipped" ? "shipped" : "pending"}">${ORDER_ST[st]}</span>`;
  let tab = ["home", "products", "orders", "wallet", "theme"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
  let docs = {}, tmp = {};

  /* ---------- فرم درخواست فروشگاه + احراز هویت ---------- */
  function drawApply(prev) {
    const K = prev ? kycAll()[prev.id] || {} : {}, st = getSettings();
    docs = { ...(K.docs || {}) };
    box.innerHTML = `<div class="shop-wrap"><h1 class="co-title">${prev ? "ویرایش و ارسال مجدد درخواست" : "ساخت فروشگاه"}</h1>
      ${prev && prev.rejectReason ? `<p class="note-bad"><b>دلیل رد درخواست قبلی:</b> ${esc(prev.rejectReason)}</p>` : ""}
      ${prev ? "" : `<div class="sl-intro"><div><i class="fa-solid fa-percent"></i><b>کارمزد فروش ${fa(st.commissionRate)}٪</b><span>فقط از فروش‌های تحویل‌شده کم می‌شود</span></div><div><i class="fa-solid fa-shield-halved"></i><b>پرداخت امن</b><span>پول مشتری تا تحویل نزد پلتفرم می‌ماند</span></div><div><i class="fa-solid fa-building-columns"></i><b>برداشت به حساب بانکی</b><span>کارمزد برداشت ${fa(st.withdrawFeeRate)}٪ (حداقل ${fa(st.withdrawMinFee)} تومان)</span></div></div>`}
      ${DEV_TOOLS && !prev ? '<p><button type="button" class="add-btn" data-s="fake"><i class="fa-solid fa-flask"></i> پر کردن فرم با اطلاعات تستی</button></p>' : ""}
      <form id="apForm" class="co-card sl-form" novalidate>
        <h2>۱. اطلاعات فروشگاه</h2>
        <div class="g2">${fld("نام فروشگاه *", "name", prev && prev.name)}${fld("دسته‌بندی *", "cat", prev && prev.cat, 'placeholder="مثلاً موبایل و لوازم جانبی"')}</div>
        <div class="g2">${fld("محله", "area", prev && prev.area)}${fld("تلفن فروشگاه *", "phone", prev && prev.phone, 'inputmode="tel"')}</div>
        ${fld("آدرس *", "address", prev && prev.address)}${fld("ساعت کاری", "hours", prev && prev.hours, 'placeholder="هر روز ۹ تا ۲۱"')}
        <label>توضیح فروشگاه<textarea name="desc" rows="2">${esc(prev ? prev.desc : "")}</textarea></label>
        <h2>۲. احراز هویت</h2>
        <div class="g2">${fld("نام و نام خانوادگی صاحب فروشگاه *", "fullname", K.fullname || u.name)}${fld("کد ملی *", "nid", K.nid, 'inputmode="numeric" maxlength="10"')}</div>
        <div class="g2"><label>نوع فعالیت<select name="type"><option value="real" ${K.type !== "legal" ? "selected" : ""}>حقیقی</option><option value="legal" ${K.type === "legal" ? "selected" : ""}>حقوقی (شرکت)</option></select></label>${fld("شناسه ملی شرکت (فقط حقوقی)", "companyId", K.companyId, 'inputmode="numeric"')}</div>
        <div class="docs">
          ${[["idCard", "تصویر کارت ملی *"], ["selfie", "عکس سلفی همراه کارت ملی *"], ["license", "مجوز کسب‌وکار / اینماد (اختیاری)"]].map(([k, l]) => `<div class="doc"><b>${l}</b><input type="file" accept="image/*" data-doc="${k}" aria-label="${l}"><div id="dp-${k}" class="dp"></div></div>`).join("")}
        </div>
        <h2>۳. حساب بانکی برای برداشت</h2>
        <div class="g2">${fld("شماره شبا *", "sheba", K.sheba || "IR", 'dir="ltr" style="text-align:right" placeholder="IR000000000000000000000000"')}${fld("نام صاحب حساب *", "shebaName", K.shebaName || u.name)}</div>
        <p class="sp-hint">حساب باید به نام خود شما باشد. مدارک فقط برای احراز هویت بررسی می‌شود. (در این نسخه‌ی نمایشی، اطلاعات فقط روی همین مرورگر ذخیره می‌شود.)</p>
        <label class="pay"><input type="checkbox" name="agree"> قوانین فروشندگان و کارمزدها را می‌پذیرم.</label>
        <p class="form-err" id="apErr" role="alert"></p>
        <button class="btn-green wide" type="submit"><i class="fa-solid fa-paper-plane"></i> ${prev ? "ارسال مجدد برای بررسی" : "ارسال درخواست برای بررسی"}</button>
      </form></div>`;
    paintDocs();
  }
  const paintDocs = () => ["idCard", "selfie", "license"].forEach(k => { const el = $("dp-" + k); if (el) el.innerHTML = docs[k] ? `<img src="${docs[k]}" alt=""><button type="button" class="dp-x" data-s="rmdoc" data-k="${k}">حذف</button>` : ""; });

  function drawStatus(s) {
    const M = { pending: ["fa-hourglass-half", "#d98a00", "درخواست شما در حال بررسی است", "مدیر مدارک را بررسی می‌کند. پس از تأیید، پنل فروشگاه شما فعال می‌شود."], rejected: ["fa-circle-xmark", "#e5484d", "درخواست شما رد شد", s.rejectReason || ""], suspended: ["fa-ban", "#e5484d", "فروشگاه شما معلق شده است", s.rejectReason || "برای اطلاع از دلیل با پشتیبانی تماس بگیرید."] }[s.status];
    box.innerHTML = `<div class="shop-wrap"><div class="co-card sl-status"><i class="fa-solid ${M[0]}" style="color:${M[1]}"></i><h1>${M[2]}</h1><p>${esc(M[3])}</p>
      <dl class="kv"><dt>فروشگاه</dt><dd>${esc(s.name)}</dd><dt>وضعیت</dt><dd>${SELLER_ST[s.status]}</dd><dt>تاریخ ثبت</dt><dd>${new Date(s.createdAt).toLocaleDateString("fa-IR")}</dd></dl>
      <div class="sl-actions">${s.status === "rejected" ? '<button class="btn-green" data-s="reapply">ویرایش و ارسال مجدد</button>' : ""}<a class="add-btn big" href="support.html">تماس با پشتیبانی</a></div></div></div>`;
  }

  /* ---------- داشبورد ---------- */
  function drawDash(s) {
    const tabs = [["home", "نمای کلی", "chart-pie"], ["products", "محصولات", "box"], ["orders", "سفارش‌ها", "receipt"], ["wallet", "کیف پول و برداشت", "wallet"], ["theme", "تم و اطلاعات", "palette"]];
    box.innerHTML = `<div class="shop-wrap" style="--blue:${s.c};--blue-soft:${s.t1}">
      <div class="sl-head"><span class="store-ico">${storeLogo(s)}</span><div><h1>${esc(s.name)}</h1><span class="sp-hint">پنل فروشنده</span></div><a class="btn-more" href="store.html?id=${s.id}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> مشاهده فروشگاه</a></div>
      ${s.blocked ? `<p class="note-bad"><b>فروشگاه شما توسط مدیریت مسدود شده است</b>${s.blockReason ? ": " + esc(s.blockReason) : ""}. تا رفع مسدودی، سفارش جدید نمی‌پذیرد. برای پیگیری با پشتیبانی تماس بگیرید.</p>` : ""}
      <nav class="tabs sl-tabs" aria-label="بخش‌های پنل">${tabs.map(([k, l, i]) => `<a href="#${k}" data-s="tab" data-k="${k}" class="tab ${tab === k ? "active" : ""}"><i class="fa-solid fa-${i}"></i> ${l}</a>`).join("")}</nav>
      <div id="slBody">${({ home: vHome, products: vProducts, orders: vOrders, wallet: vWallet, theme: vTheme })[tab](s)}</div></div>`;
  }
  const draw = () => { const s = getS(); if (!s) return drawApply(); if (s.status !== "approved") return drawStatus(s); drawDash(s); if ($("thPrev")) paintPrev(); };

  function vHome(s) {
    const w = walletOf("store:" + s.id), O = myOrders(s), mine = O.map(o => ({ o, sub: o.subs[s.id] }));
    const escrow = w.pending || 0;
    const done = mine.filter(x => x.sub.settled), sales = done.reduce((a, x) => a + x.sub.total, 0), comm = done.reduce((a, x) => a + (x.sub.commission || 0), 0);
    const pend = mine.filter(x => x.sub.status === "pending").length;
    const st = (i, n, l) => `<div class="sl-stat"><i class="fa-solid fa-${i}"></i><b>${fa(n)}</b><span>${l}</span></div>`;
    return `<div class="sl-cards">${st("wallet", w.balance, "موجودی قابل برداشت (تومان)")}${st("hourglass-half", escrow, "در انتظار تحویل — غیرقابل برداشت (تومان)")}${st("receipt", pend, "سفارش در انتظار ارسال")}${st("sack-dollar", sales, "فروش تسویه‌شده (تومان)")}${st("percent", comm, "کارمزد پرداخت‌شده (تومان)")}${st("box", myProds(s.id).length, "محصول")}</div>
      <p class="sp-hint">نرخ کارمزد فروش شما: <b>${fa(commissionOf(s.id))}٪</b> — از مبلغ هر سفارش پس از تحویل به مشتری کم می‌شود.</p>
      <h2 class="pf-h" style="margin-top:20px">آخرین سفارش‌ها</h2>${O.length ? O.slice(0, 4).map(o => orderCard(s, o)).join("") : '<div class="co-card pf-empty"><p>هنوز سفارشی ندارید.</p></div>'}`;
  }

  /* ---------- محصولات و تخفیف ---------- */
  function vProducts(s) {
    const P = myProds(s.id);
    return `<div class="sl-bar"><button class="btn-green" data-s="pedit" data-id=""><i class="fa-solid fa-plus"></i> محصول جدید</button>
      <form id="bulkForm" class="sl-bulk"><label class="sr">درصد تخفیف</label><input name="pct" inputmode="numeric" placeholder="٪ تخفیف" aria-label="درصد تخفیف برای همه محصولات"><button class="add-btn" type="submit">اعمال روی همه</button><button class="add-btn" type="button" data-s="nodisc">حذف همه تخفیف‌ها</button></form></div>
      ${P.length ? `<div class="sl-tw"><table><thead><tr><th>محصول</th><th>قیمت نهایی</th><th>تخفیف</th><th>موجودی</th><th></th></tr></thead><tbody>${P.map(p => `<tr><td><div class="who"><img class="th" src="${p.images[0] || "assets/products/placeholder.svg"}" alt="">${esc(p.name)}</div></td><td>${fa(p.price)}${p.old ? `<br><small class="old">${fa(p.old)}</small>` : ""}</td><td>${p.discount ? fa(p.discount) + "٪" : "—"}</td><td>${p.stock == null ? "نامحدود" : fa(p.stock)}</td><td><div class="acts"><button class="add-btn" data-s="pedit" data-id="${p.id}">ویرایش</button><button class="add-btn del" data-s="pdel" data-id="${p.id}">حذف</button></div></td></tr>`).join("")}</tbody></table></div>` : '<div class="co-card pf-empty"><i class="fa-solid fa-box-open"></i><p>هنوز محصولی اضافه نکرده‌اید.</p></div>'}`;
  }
  function productForm(id) {
    const s = getS(), p = myProds(s.id).find(x => x.id === id) || { images: [], specs: [], details: {} };
    tmp = { images: [...p.images].filter(x => !x.endsWith("placeholder.svg")) };
    const base = p.base || p.price || "";
    dlg.innerHTML = `<form class="sm-form" id="pForm" data-id="${id}" novalidate><h2>${id ? "ویرایش" : "افزودن"} محصول</h2>
      ${fld("نام محصول *", "name", p.name)}
      <div class="g2">${fld("قیمت اصلی (تومان) *", "price", base, 'inputmode="numeric"')}${fld("درصد تخفیف (۰ تا ۹۰)", "disc", p.discount || 0, 'inputmode="numeric"')}</div>
      <p class="sp-hint" id="finalP"></p>
      ${fld("موجودی (خالی = نامحدود)", "stock", p.stock == null ? "" : p.stock, 'inputmode="numeric"')}
      <label>توضیح کوتاه<textarea name="desc" rows="2">${esc(p.desc)}</textarea></label>
      <label>ویژگی‌های مهم (هر خط یک مورد)<textarea name="specs" rows="3">${esc((p.specs || []).join("\n"))}</textarea></label>
      <label>مشخصات فنی (هر خط «عنوان: مقدار»)<textarea name="details" rows="3">${esc(Object.entries(p.details || {}).map(([k, v]) => k + ": " + v).join("\n"))}</textarea></label>
      <label>تصاویر (اولی عکس اصلی است)<input type="file" accept="image/*" multiple data-img="prod"></label><div class="imgs" id="pImgs"></div>
      <p class="form-err" id="mErr" role="alert"></p>
      <div class="sm-foot"><button class="btn-green" type="submit">ذخیره</button><button class="add-btn" type="button" data-s="close">انصراف</button></div></form>`;
    dlg.showModal(); paintImgs(); finalPrice();
  }
  const paintImgs = () => { const el = $("pImgs"); if (el) el.innerHTML = tmp.images.map((src, i) => `<div class="it"><img src="${src}" alt=""><button type="button" data-s="rmimg" data-k="${i}" aria-label="حذف">×</button></div>`).join(""); };
  const finalPrice = () => { const f = $("pForm"); if (!f) return; const b = num(f.price.value), d = Math.min(90, num(f.disc.value)); $("finalP").textContent = b ? `قیمت نهایی برای مشتری: ${fa(Math.round(b * (100 - d) / 100))} تومان` : ""; };

  /* ---------- سفارش‌ها ---------- */
  function orderCard(s, o) {
    const sub = o.subs[s.id], items = o.items.filter(i => i.shopId === s.id), rate = commissionOf(s.id), fee = sub.commission != null ? sub.commission : Math.round(sub.total * rate / 100);
    return `<details class="order" ${sub.status === "pending" ? "open" : ""}><summary><span>سفارش <b>${fd(o.code)}</b></span><span class="o-date">${new Date(o.date).toLocaleDateString("fa-IR")}</span>${stTag(sub.status)}<b>${fa(sub.total)} تومان</b></summary>
      <ul class="co-items">${items.map(i => `<li><span>${esc(i.name)} × ${fa(i.q)}</span><b>${fa(i.price * i.q)}</b></li>`).join("")}</ul>
      <p class="o-ship"><i class="fa-solid fa-user"></i> ${esc(o.ship.name)} · <span dir="ltr">${fd(o.ship.phone)}</span></p>
      <p class="o-ship"><i class="fa-solid fa-location-dot"></i> ${esc(o.ship.city)}، ${esc(o.ship.address)} · کد پستی ${fd(o.ship.zip || "—")}</p>
      ${sub.tracking ? `<p class="o-ship"><i class="fa-solid fa-truck-fast"></i> ${esc(sub.tracking.carrier)} — کد رهگیری: <b dir="ltr">${esc(fd(sub.tracking.code))}</b></p>` : ""}
      <p class="o-ship"><i class="fa-solid fa-money-bill"></i> ${o.pay === "wallet" ? "پرداخت از کیف پول — مبلغ تا تحویل به مشتری نزد پلتفرم می‌ماند" : "پرداخت در محل"} · کارمزد ${sub.commission != null ? "" : "تخمینی "}${fa(fee)} تومان${sub.net != null ? ` · واریز به کیف پول شما: ${fa(sub.net)}` : ""}</p>
      ${retBlock(sub, o)}
      <div class="sl-actions">${sub.status === "pending" ? `<button class="btn-green" data-s="ship" data-code="${o.code}"><i class="fa-solid fa-truck-fast"></i> ثبت ارسال</button>` : ""}${["pending", "shipped"].includes(sub.status) ? `<button class="add-btn del" data-s="cancel" data-code="${o.code}">لغو سفارش</button>` : ""}${sub.status === "shipped" ? (sub.dispute && sub.dispute.status === "open" ? '<span class="note-bad" style="margin:0;padding:6px 12px">مشتری اختلاف ثبت کرده؛ پلتفرم در حال بررسی است.</span>' : `<span class="sp-hint">منتظر تأیید مشتری هستیم${autoLeft(sub) ? ` — تأیید خودکار تا ${fa(autoLeft(sub))} روز دیگر` : ""}.</span>`) : ""}${sub.held && !["delivered", "canceled"].includes(sub.status) ? '<span class="sp-hint"><i class="fa-solid fa-lock"></i> مبلغ در انتظار تحویل است.</span>' : ""}</div></details>`;
  }
  const RETLBL = { requested: "درخواست مرجوعی ثبت شده", approved: "تأیید شده؛ منتظر ارسال کالا از مشتری", shipped_back: "کالا از سمت مشتری ارسال شده", rejected: "رد شده", escalated: "ارجاع‌شده به پشتیبانی", done: "تکمیل شد" };
  function retBlock(sub, o) {
    const r = sub.ret; if (!r) return sub.status === "delivered" && !sub.settled && sub.settleAt ? `<p class="o-ship"><i class="fa-solid fa-hourglass-half"></i> مهلت مرجوعی مشتری: ${fa(returnDaysLeft(sub))} روز دیگر؛ پس از آن پول به کیف پول شما می‌آید.</p>` : "";
    return `<div class="ret-box"><b><i class="fa-solid fa-rotate-left"></i> مرجوعی: ${RETLBL[r.status]}</b><p>دلیل مشتری: ${esc(r.reason)}</p>${r.tracking ? `<p>${esc(r.tracking.carrier)} — کد رهگیری: <b dir="ltr">${esc(fd(r.tracking.code))}</b></p>` : ""}${r.rejectReason ? `<p>دلیل رد: ${esc(r.rejectReason)}</p>` : ""}
      <div class="sl-actions">${r.status === "requested" ? `<button class="btn-green" data-s="retok" data-code="${o.code}">تأیید مرجوعی</button><button class="add-btn del" data-s="retno" data-code="${o.code}">رد مرجوعی</button><span class="sp-hint">اگر پاسخ ندهید، پس از ${fa(getSettings().returnAutoDays)} روز تأیید می‌شود.</span>` : ""}${r.status === "shipped_back" ? `<button class="btn-green" data-s="retrecv" data-code="${o.code}">کالا را دریافت کردم (بازگشت وجه به مشتری)</button>` : ""}</div></div>`;
  }
  function vOrders(s) { const O = myOrders(s); return O.length ? O.map(o => orderCard(s, o)).join("") : '<div class="co-card pf-empty"><i class="fa-solid fa-receipt"></i><p>هنوز سفارشی برای فروشگاه شما ثبت نشده است.</p></div>'; }

  /* ---------- کیف پول و برداشت ---------- */
  function vWallet(s) {
    const w = walletOf("store:" + s.id), K = kycAll()[s.id] || {}, st = getSettings();
    const W = _ls(WD_KEY, []).filter(x => x.storeId === s.id).reverse();
    return `<section class="wallet-hero"><div class="glass wallet-glass"><div class="wl-top"><span class="wl-title"><i class="fa-solid fa-wallet"></i> کیف پول فروشگاه</span></div>
      <div class="wl-bal"><span>موجودی قابل برداشت</span><b>${fa(w.balance)}</b><small>تومان</small></div>
      <div class="wl-hold"><i class="fa-solid fa-lock"></i><span>در انتظار تحویل (غیرقابل برداشت)</span><b>${fa(w.pending || 0)}</b><small>تومان</small></div>
      <p class="wl-note"><i class="fa-solid fa-circle-info"></i> پول سفارش‌ها همان لحظه از مشتری کم و اینجا «در انتظار» نشان داده می‌شود. پس از تأیید تحویل (یا تأیید خودکار ${fa(getSettings().autoConfirmDays)} روز پس از ارسال) و پایان مهلت مرجوعی (${fa(getSettings().returnDays)} روز) و کسر کارمزد ${fa(commissionOf(s.id))}٪، به موجودی قابل برداشت می‌آید.</p></div></section>
      <div class="co-grid"><form class="co-card" id="wdForm" novalidate><h2>برداشت به حساب بانکی</h2>
        <label>مبلغ برداشت (تومان)<input name="amount" inputmode="numeric" autocomplete="off" placeholder="حداقل ${fa(st.minWithdraw)}"></label>
        <div class="wd-brk" id="wdBrk" aria-live="polite"></div>
        <p class="sp-hint">واریز به شبا: <b dir="ltr">${esc(maskSheba(K.sheba))}</b> (${esc(K.shebaName || "")})</p>
        <p class="sp-hint">کارمزد برداشت: ${fa(st.withdrawFeeRate)}٪ مبلغ (حداقل ${fa(st.withdrawMinFee)} تومان). کارمزد از مبلغ برداشت کم می‌شود.</p>
        <p class="form-err" id="wdErr" role="alert"></p><button class="btn-green wide" type="submit">ثبت درخواست برداشت</button></form>
        <div class="co-card"><h2>درخواست‌های برداشت</h2>${W.length ? `<ul class="co-items">${W.map(x => `<li><span>${new Date(x.date).toLocaleDateString("fa-IR")} · ${fa(x.amount)} (واریزی ${fa(x.net)})${x.ref ? ` · پیگیری ${esc(fd(x.ref))}` : ""}</span><span class="o-state st-${x.status === "paid" ? "delivered" : x.status === "rejected" ? "canceled" : "pending"}">${WD_ST[x.status]}</span></li>`).join("")}</ul>` : '<p class="sp-hint">هنوز برداشتی ثبت نکرده‌اید.</p>'}</div></div>
      <h2 class="pf-h" style="margin-top:20px">تراکنش‌ها</h2>${w.tx.length ? `<div class="sl-tw"><table><tbody>${w.tx.slice(0, 25).map(t => `<tr><td>${new Date(t.date).toLocaleDateString("fa-IR")}</td><td>${TX_LABELS[t.type] || ""}</td><td class="${t.held ? "hold" : t.amount > 0 ? "pos" : "neg"}">${t.amount > 0 ? "+" : "−"}${fa(Math.abs(t.amount))}${t.held ? " (امانت)" : ""}</td><td>${esc(t.note || "")}</td></tr>`).join("")}</tbody></table></div>` : '<div class="co-card pf-empty"><p>تراکنشی ثبت نشده است.</p></div>'}`;
  }
  const brk = amt => { const f = withdrawFee(amt), st = getSettings(); return amt ? `<div><span>مبلغ درخواستی</span><b>${fa(amt)}</b></div><div><span>کارمزد برداشت (${fa(st.withdrawFeeRate)}٪، حداقل ${fa(st.withdrawMinFee)})</span><b class="neg">− ${fa(f)}</b></div><div class="tot"><span>مبلغ خالص واریزی به حساب شما</span><b>${fa(Math.max(0, amt - f))} تومان</b></div>` : ""; };

  /* ---------- تم و اطلاعات ---------- */
  const PAL = ["#087cff", "#5b4bdb", "#1c8a55", "#e0541a", "#d6336c", "#0f766e", "#b8860b", "#334155"];
  function vTheme(s) {
    tmp = { logo: s.logo || "", cover: s.cover || "", c: s.c };
    const th = s.theme || {};
    return `<form class="co-card sl-form" id="thForm" novalidate>
      <h2>رنگ و ظاهر فروشگاه</h2>
      <div class="pal" role="group" aria-label="رنگ اصلی">${PAL.map(c => `<button type="button" class="chip ${c === s.c ? "on" : ""}" style="background:${c}" data-s="color" data-c="${c}" aria-label="رنگ ${c}"></button>`).join("")}<label class="chip-in">رنگ دلخواه<input type="color" name="color" value="${s.c}"></label></div>
      <div class="g2"><label>گوشه‌ی کارت‌ها<select name="radius"><option value="lg" ${th.radius === "lg" || !th.radius ? "selected" : ""}>گرد</option><option value="md" ${th.radius === "md" ? "selected" : ""}>معمولی</option><option value="sharp" ${th.radius === "sharp" ? "selected" : ""}>تیز</option></select></label>
        <label>پیام ویژه بالای فروشگاه<input name="banner" maxlength="120" value="${esc(th.banner || "")}" placeholder="مثلاً: ارسال رایگان تا پایان هفته"></label></div>
      <div class="g2"><label>لوگو<input type="file" accept="image/*" data-img="logo"></label><label>کاور (بنر)<input type="file" accept="image/*" data-img="cover"></label></div>
      <div id="thPrev" class="th-prev"></div>
      <h2>اطلاعات فروشگاه</h2>
      <div class="g2">${fld("نام فروشگاه", "name", s.name)}${fld("دسته‌بندی", "cat", s.cat)}</div>
      <div class="g2">${fld("محله", "area", s.area)}${fld("تلفن", "phone", s.phone, 'inputmode="tel"')}</div>
      ${fld("آدرس", "address", s.address)}${fld("ساعت کاری", "hours", s.hours)}
      <label>توضیح<textarea name="desc" rows="2">${esc(s.desc)}</textarea></label>
      <label class="pay"><input type="checkbox" name="open" ${s.open ? "checked" : ""} ${s.blocked ? "disabled" : ""}> فروشگاه الان باز است ${s.blocked ? "(مسدود شده توسط مدیریت؛ قابل تغییر نیست)" : ""}</label>
      <p class="form-err" id="thErr" role="alert"></p><button class="btn-green wide" type="submit">ذخیره تغییرات</button></form>`;
  }
  function paintPrev() {
    const el = $("thPrev"); if (!el) return;
    const t = themeFrom(tmp.c);
    el.style.cssText = `--blue:${t.c};--blue-soft:${t.t1}`;
    el.innerHTML = `<div class="pv-cover" style="background:linear-gradient(145deg,${t.t1},${t.t2})">${tmp.cover ? `<img src="${tmp.cover}" alt="">` : ""}</div><div class="pv-row"><span class="store-ico">${tmp.logo ? `<img src="${tmp.logo}" alt="">` : '<i class="fa-solid fa-store"></i>'}</span><b>پیش‌نمایش</b><span class="pv-btn">افزودن</span><span class="pv-badge">۲۰٪ تخفیف</span></div>`;
  }

  /* ---------- داده‌ی فیک برای تست (کد ملی و شبای معتبر از نظر الگوریتم، نه واقعی) ---------- */
  function fillFake() {
    const f = $("apForm"); if (!f) return;
    const d9 = "123456789", r = d9.split("").reduce((a, v, i) => a + v * (10 - i), 0) % 11, nid = d9 + (r < 2 ? r : 11 - r);
    const bban = "0170000000" + "0000000000" + "12"; let m = 0; for (const c of bban + "182700") m = (m * 10 + +c) % 97;
    const sheba = "IR" + String(98 - m).padStart(2, "0") + bban;
    const img = t => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250"><rect width="400" height="250" fill="#eef2f8"/><rect x="20" y="20" width="360" height="210" rx="14" fill="#fff" stroke="#cbd5e1"/><text x="200" y="135" font-size="26" text-anchor="middle" fill="#64748b">${t}</text></svg>`);
    const v = { name: "فروشگاه تستی شهرک", cat: "لوازم دیجیتال", area: "مرکز شهر", phone: "01135241234", address: "بهشهر، خیابان امام، پلاک ۱۲", hours: "هر روز ۹ تا ۲۱", fullname: u.name, nid, companyId: "", sheba, shebaName: u.name };
    Object.entries(v).forEach(([k, val]) => { if (f[k]) f[k].value = val; });
    f.desc.value = "فروشگاه آزمایشی برای تست پنل فروشنده."; f.type.value = "real"; f.agree.checked = true;
    docs = { idCard: img("TEST ID CARD"), selfie: img("TEST SELFIE") }; paintDocs();
    flash("اطلاعات تستی پر شد؛ فقط «ارسال درخواست» را بزنید.");
  }

  function shipModal(code) {
    dlg.innerHTML = `<form class="sm-form" id="shipForm" data-code="${code}" novalidate><h2><i class="fa-solid fa-truck-fast"></i> ثبت ارسال سفارش ${fd(code)}</h2>
      <label>روش ارسال<select name="carrier"><option>پست پیشتاز</option><option>تیپاکس</option><option>پیک موتوری</option><option>باربری</option><option>سایر</option></select></label>
      <label>کد رهگیری مرسوله *<input name="track" autocomplete="off" dir="ltr" style="text-align:right" placeholder="مثلاً ۲۴۱۲۳۴۵۶۷۸۹۰"></label>
      <p class="sp-hint">مشتری این کد را در سفارش‌هایش می‌بیند.</p>
      <p class="form-err" id="mErr" role="alert"></p>
      <div class="sm-foot"><button class="btn-green" type="submit">ثبت ارسال</button><button class="add-btn" type="button" data-s="close">انصراف</button></div></form>`;
    dlg.showModal();
  }

  /* ---------- رویدادها ---------- */
  box.addEventListener("click", async e => {
    const b = e.target.closest("[data-s]"); if (!b) return;
    const a = b.dataset.s, s = getS();
    if (a === "tab") { e.preventDefault(); tab = b.dataset.k; history.replaceState(null, "", "#" + tab); draw(); }
    else if (a === "reapply") drawApply(s);
    else if (a === "fake") fillFake();
    else if (a === "rmdoc") { delete docs[b.dataset.k]; paintDocs(); }
    else if (a === "pedit") productForm(b.dataset.id);
    else if (a === "pdel") { if (!await UI.confirm("این محصول برای همیشه حذف می‌شود.", { title: "حذف محصول", ok: "حذف کن", danger: true })) return; sw(SPROD_KEY, _ls(SPROD_KEY, []).filter(p => p.id !== b.dataset.id)); draw(); flash("محصول حذف شد."); }
    else if (a === "nodisc") { const all = _ls(SPROD_KEY, []); all.filter(p => p.shopId === s.id).forEach(p => { if (p.base) { p.price = p.base; } delete p.old; p.discount = 0; }); sw(SPROD_KEY, all); draw(); flash("تخفیف‌ها حذف شد."); }
    else if (a === "ship") shipModal(b.dataset.code);
    else if (a === "retok") { if (await UI.confirm("پس از تأیید، مشتری کالا را با کد رهگیری برای شما می‌فرستد.", { title: "تأیید مرجوعی", ok: "تأیید مرجوعی", icon: "rotate-left" })) { orderReturnDecide(b.dataset.code, s.id, "approve"); draw(); flash("مرجوعی تأیید شد."); } }
    else if (a === "retno") { const v = await UI.form({ title: "رد مرجوعی", message: "دلیل رد را برای مشتری بنویسید. او می‌تواند موضوع را به پشتیبانی ارجاع دهد.", tone: "red", icon: "ban", ok: "رد مرجوعی", danger: true, fields: [{ name: "why", label: "دلیل رد", type: "textarea", min: 5 }] }); if (v) { orderReturnDecide(b.dataset.code, s.id, "reject", v.why); draw(); flash("مرجوعی رد شد."); } }
    else if (a === "retrecv") { if (await UI.confirm("با تأیید دریافت، مبلغ سفارش به کیف پول مشتری برمی‌گردد و از امانت شما خارج می‌شود.", { title: "دریافت کالای مرجوعی", ok: "دریافت کردم", icon: "box-open" })) { orderReturnReceive(b.dataset.code, s.id); draw(); flash("مبلغ به مشتری برگشت."); } }
    else if (a === "cancel") {
      if (!await UI.confirm("اگر سفارش با کیف پول پرداخت شده باشد، مبلغ به مشتری برمی‌گردد.", { title: "لغو سفارش", ok: "لغو سفارش", danger: true })) return;
      orderSetSub(b.dataset.code, s.id, "canceled"); draw(); flash("سفارش لغو شد.");
    }
    else if (a === "color") { tmp.c = b.dataset.c; $("thForm").color.value = tmp.c; document.querySelectorAll(".pal .chip").forEach(c => c.classList.toggle("on", c === b)); paintPrev(); }
  });
  dlg.addEventListener("click", e => {
    const b = e.target.closest("[data-s]");
    if (e.target === dlg || (b && b.dataset.s === "close")) dlg.close();
    else if (b && b.dataset.s === "rmimg") { tmp.images.splice(+b.dataset.k, 1); paintImgs(); }
  });
  dlg.addEventListener("input", finalPrice);
  box.addEventListener("input", e => {
    if (e.target.closest("#wdForm") && e.target.name === "amount") $("wdBrk").innerHTML = brk(num(e.target.value));
    if (e.target.name === "color") { tmp.c = e.target.value; document.querySelectorAll(".pal .chip").forEach(c => c.classList.remove("on")); paintPrev(); }
  });
  const onFile = async e => {
    const t = e.target, f = t.files && t.files[0]; if (!f) return;
    const err = $("mErr") || $("thErr") || $("apErr");
    try {
      for (const file of [...t.files]) {
        if (!file.type.startsWith("image/")) { if (err) err.textContent = "فقط فایل تصویر قابل قبول است."; continue; }
        if (t.dataset.doc) { docs[t.dataset.doc] = await sImg(file, 1200); paintDocs(); }
        else if (t.dataset.img === "prod") { tmp.images.push(await sImg(file, 800)); paintImgs(); }
        else { tmp[t.dataset.img] = await sImg(file, t.dataset.img === "logo" ? 256 : 1200); paintPrev(); }
      }
    } catch { flash("خواندن فایل ناموفق بود."); }
    t.value = "";
  };
  box.addEventListener("change", onFile); dlg.addEventListener("change", onFile);

  const submitAll = async e => {
    const f = e.target; e.preventDefault();
    const s = getS();
    if (f.id === "apForm") {
      const err = $("apErr"), v = k => f[k].value.trim(), nid = toEn(v("nid")), sheba = toEn(v("sheba")).toUpperCase().replace(/\s/g, "");
      if (v("name").length < 3 || !v("cat") || !v("address") || v("phone").length < 6) return void (err.textContent = "اطلاعات فروشگاه (نام، دسته، آدرس، تلفن) را کامل کنید.");
      if (v("fullname").length < 3) return void (err.textContent = "نام و نام خانوادگی صاحب فروشگاه را وارد کنید.");
      if (!nidOk(nid)) return void (err.textContent = "کد ملی معتبر نیست.");
      if (f.type.value === "legal" && !/^\d{11}$/.test(toEn(v("companyId")))) return void (err.textContent = "شناسه ملی شرکت باید ۱۱ رقم باشد.");
      if (!docs.idCard || !docs.selfie) return void (err.textContent = "تصویر کارت ملی و عکس سلفی همراه کارت ملی الزامی است.");
      if (!shebaOk(sheba)) return void (err.textContent = "شماره شبا معتبر نیست (IR و ۲۴ رقم).");
      if (v("shebaName").length < 3) return void (err.textContent = "نام صاحب حساب را وارد کنید.");
      if (!f.agree.checked) return void (err.textContent = "برای ادامه باید قوانین را بپذیرید.");
      const id = s ? s.id : "s" + Date.now().toString(36), th = themeFrom(s ? s.c : "#087cff"), phone = v("phone");
      const rec = { ...(s || { rate: 0, open: true, icon: "store", logo: "", cover: "", theme: { radius: "lg", banner: "" }, ...th }), id, owner: u.phone, ownerName: v("fullname"), name: v("name"), cat: v("cat"), area: v("area"), address: v("address"), phone: fd(phone), tel: "+98" + toEn(phone).replace(/\D/g, "").replace(/^0/, ""), hours: v("hours"), desc: v("desc"), status: "pending", rejectReason: "", createdAt: new Date().toISOString() };
      const K = kycAll(); K[id] = { fullname: v("fullname"), nid, type: f.type.value, companyId: toEn(v("companyId")), sheba, shebaName: v("shebaName"), docs, submittedAt: rec.createdAt };
      if (!sw(KYC_KEY, K) || !saveSeller(rec)) return;
      draw();
    } else if (f.id === "pForm") {
      const err = $("mErr"), name = f.name.value.trim(), base = num(f.price.value), disc = Math.min(90, num(f.disc.value));
      const all = _ls(SPROD_KEY, []), id = f.dataset.id;
      if (!name) return void (err.textContent = "نام محصول را وارد کنید.");
      if (products.some(p => p.name === name && p.id !== id) || all.some(p => p.name === name && p.id !== id)) return void (err.textContent = "محصولی با این نام وجود دارد.");
      if (!base) return void (err.textContent = "قیمت را وارد کنید.");
      if (!tmp.images.length) return void (err.textContent = "حداقل یک تصویر اضافه کنید.");
      const details = {}; f.details.value.split("\n").forEach(l => { const i = l.indexOf(":"); if (i > 0) details[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
      const p = id ? all.find(x => x.id === id) : { id: "sp" + Date.now().toString(36), shopId: s.id, rate: 0, cnt: 0, icon: "box" };
      Object.assign(p, { name, base, discount: disc, price: Math.round(base * (100 - disc) / 100), desc: f.desc.value.trim(), specs: f.specs.value.split("\n").map(x => x.trim()).filter(Boolean), details, images: [...tmp.images], stock: f.stock.value.trim() === "" ? null : num(f.stock.value), c: s.c, t1: s.t1, t2: s.t2 });
      if (disc) p.old = base; else delete p.old;
      if (!id) all.push(p);
      if (!sw(SPROD_KEY, all)) return;
      dlg.close(); draw(); flash("ذخیره شد.");
    } else if (f.id === "shipForm") {
      const err = $("mErr"), track = toEn(f.track.value).trim();
      if (!/^[A-Za-z0-9-]{5,30}$/.test(track)) return void (err.textContent = "کد رهگیری معتبر نیست (۵ تا ۳۰ حرف انگلیسی یا عدد).");
      orderShip(f.dataset.code, s.id, f.carrier.value, track);
      dlg.close(); draw(); flash("ارسال با کد رهگیری ثبت شد.");
    } else if (f.id === "bulkForm") {
      const pct = Math.min(90, num(f.pct.value)); if (!pct) return flash("درصد تخفیف را وارد کنید.");
      const all = _ls(SPROD_KEY, []);
      all.filter(p => p.shopId === s.id).forEach(p => { p.base = p.base || p.price; p.discount = pct; p.price = Math.round(p.base * (100 - pct) / 100); p.old = p.base; });
      sw(SPROD_KEY, all); draw(); flash(`تخفیف ${fa(pct)}٪ روی همه محصولات اعمال شد.`);
    } else if (f.id === "wdForm") {
      const err = $("wdErr"), amt = num(f.amount.value), st = getSettings(), K = kycAll()[s.id] || {};
      if (amt < st.minWithdraw) return void (err.textContent = `حداقل مبلغ برداشت ${fa(st.minWithdraw)} تومان است.`);
      if (amt > walletOf("store:" + s.id).balance) return void (err.textContent = "موجودی کافی نیست.");
      const fee = withdrawFee(amt), id = "wd" + Date.now().toString(36);
      if (!walletApply("store:" + s.id, -amt, "withdraw", `درخواست برداشت (کارمزد ${fee})`, "system", id)) return void (err.textContent = "ثبت نشد. دوباره تلاش کنید.");
      sw(WD_KEY, [..._ls(WD_KEY, []), { id, storeId: s.id, amount: amt, fee, net: amt - fee, sheba: K.sheba, shebaName: K.shebaName, date: new Date().toISOString(), status: "pending" }]);
      draw(); flash("درخواست برداشت ثبت شد؛ پس از واریز، وضعیت آن «واریز شد» می‌شود.");
    } else if (f.id === "thForm") {
      const err = $("thErr"), name = f.name.value.trim();
      if (name.length < 3) return void (err.textContent = "نام فروشگاه را وارد کنید.");
      const th = themeFrom(tmp.c), phone = f.phone.value.trim();
      Object.assign(s, th, { name, cat: f.cat.value.trim(), area: f.area.value.trim(), phone: fd(phone), tel: "+98" + toEn(phone).replace(/\D/g, "").replace(/^0/, ""), address: f.address.value.trim(), hours: f.hours.value.trim(), desc: f.desc.value.trim(), open: s.blocked ? s.open : f.open.checked, logo: tmp.logo, cover: tmp.cover, theme: { radius: f.radius.value, banner: f.banner.value.trim() } });
      const all = _ls(SPROD_KEY, []); all.filter(p => p.shopId === s.id).forEach(p => Object.assign(p, th));
      if (!saveSeller(s) || !sw(SPROD_KEY, all)) return;
      draw(); flash("تغییرات ذخیره شد.");
    }
  };
  box.addEventListener("submit", submitAll); dlg.addEventListener("submit", submitAll);
  box.addEventListener("change", e => { if (e.target.name === "color" && e.target.type === "color") { tmp.c = e.target.value; paintPrev(); } });
  draw();
};
