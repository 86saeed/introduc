/* پنل مدیریت شهرک — نسخه‌ی مرورگری (داده‌ها در localStorage همین مرورگر) */
const $ = id => document.getElementById(id);
const fa = n => Number(n).toLocaleString("fa-IR");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
const toEn = s => String(s).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
const toFaDigits = s => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
/* حالت پنل: owner = مدیر سایت، staff = ادمین‌های سایت (staff.html) */
const MODE = document.body.dataset.mode || "owner", OWNER = MODE === "owner";
let ME = null;
const PERMS = { tickets: "پشتیبانی و تیکت‌ها", orders: "سفارش‌ها و اختلاف‌ها", sellers: "فروشندگان و برداشت‌ها", users: "کاربران", reviews: "نظرات", wallets: "کیف پول‌ها و شارژ", reports: "گزارش‌ها", catalog: "فروشگاه‌ها و محصولات" };
const VIEW_PERM = { users: "users", orders: "orders", wallets: "wallets", tickets: "tickets", sellers: "sellers", stores: "catalog", products: "catalog", reviews: "reviews", reports: "reports" };
const can = v => OWNER || (ME && ME.perms.includes(VIEW_PERM[v]));
const K = { staff: "shahrak_staff", payments: "shahrak_payments", wallets: "shahrak_wallets", topups: "shahrak_topups", tickets: "shahrak_tickets", settings: "shahrak_settings", audit: "shahrak_audit", users: "shahrak_users", orders: "shahrak_orders", reviews: "shahrak_reviews", avatars: "shahrak_avatars", catalog: "shahrak_catalog", admin: "shahrak_admin", session: "shahrak_user", cart: "shahrak_cart" };
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
function toast(m) { const t = $("toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2600); }
function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { toast("حافظه مرورگر پر است. تصاویر را کوچک‌تر یا کمتر کنید."); return false; } }
const fmtD = i => (i ? new Date(i).toLocaleDateString("fa-IR") : "نامشخص");
const fmtDT = i => (i ? new Date(i).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" }) : "—");
const STATUS = { pending: "در انتظار هماهنگی", shipped: "ارسال شد", delivered: "تحویل شد", canceled: "لغو شد" };
const stCls = { pending: "", shipped: "info", delivered: "ok", canceled: "bad" };
const PALETTES = { آبی: ["#087cff", "#e7f1ff", "#cfe3ff"], بنفش: ["#5b4bdb", "#efecff", "#dcd6ff"], سبز: ["#1c8a55", "#e2f8ec", "#bfecd4"], نارنجی: ["#e0541a", "#fff0e8", "#ffd8c4"], قرمز: ["#d6336c", "#ffe8f0", "#ffcfe0"] };
const saveCatalog = () => write(K.catalog, { stores: stores.filter(s => !s._seller), products: products.filter(p => !p._seller) });
const catStores = () => stores.filter(s => !s._seller), catProducts = () => products.filter(p => !p._seller);
const initial = n => esc((n || "؟").trim()[0] || "؟");

async function hash(p) {
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("shahrak-admin:" + p));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  }
  return "plain:" + p;
}
function imgToData(file, max) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const im = new Image();
      im.onerror = rej;
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/webp", 0.82));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

/* ---------- پنجره‌ها ---------- */
const modal = $("modal");
const openModal = html => { modal.innerHTML = html; modal.showModal(); };
modal.addEventListener("click", e => { if (e.target === modal || e.target.closest("[data-close]")) modal.close(); });
const ask = (msg, ok = "بله، انجام بده") => UI.confirm(msg, { html: true, ok, danger: true });

/* ---------- ورود مدیر ---------- */
function gate() {
  if (!OWNER) return gateStaff();
  const rec = read(K.admin, null), box = $("gate");
  if (rec && sessionStorage.getItem("shahrak_admin_ok") === "1") return start();
  box.hidden = false; $("app").hidden = true;
  box.innerHTML = `<form class="gate-card" id="gForm" novalidate>
    <h1><i class="fa-solid fa-shield-halved"></i> ${rec ? "ورود مدیر" : "ساخت رمز مدیر"}</h1>
    <p>${rec ? "رمز مدیر را وارد کنید." : "این اولین ورود است. یک رمز قوی (حداقل ۸ کاراکتر) برای پنل مدیریت انتخاب کنید."}</p>
    <label>رمز عبور<input type="password" name="p" autocomplete="${rec ? "current-password" : "new-password"}" required></label>
    ${rec ? "" : '<label>تکرار رمز<input type="password" name="p2" autocomplete="new-password" required></label>'}
    <p class="err" id="gErr" role="alert"></p>
    <button class="btn primary" type="submit" style="justify-content:center">${rec ? "ورود" : "ساخت و ورود"}</button>
  </form>`;
  $("gForm").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target, err = $("gErr"), p = f.p.value;
    if (rec) { if ((await hash(p)) !== rec.h) return void (err.textContent = "رمز اشتباه است."); }
    else {
      if (p.length < 8) return void (err.textContent = "رمز باید حداقل ۸ کاراکتر باشد.");
      if (p !== f.p2.value) return void (err.textContent = "رمز و تکرار آن یکسان نیستند.");
      write(K.admin, { h: await hash(p), created: new Date().toISOString() });
    }
    sessionStorage.setItem("shahrak_admin_ok", "1");
    start();
  });
}
$("outBtn").addEventListener("click", () => { sessionStorage.removeItem("shahrak_admin_ok"); sessionStorage.removeItem("shahrak_staff_ok"); location.reload(); });

/* ---------- ورود ادمین‌های سایت (جدا از مدیر سایت) ---------- */
function gateStaff() {
  const S = read(K.staff, {}), id = sessionStorage.getItem("shahrak_staff_ok"), box = $("gate");
  if (id && S[id] && S[id].active !== false) { ME = S[id]; AUDIT_ACTOR = "ادمین: " + ME.name; return start(); }
  box.hidden = false; $("app").hidden = true;
  box.innerHTML = `<form class="gate-card" id="sgForm" novalidate><h1><i class="fa-solid fa-user-shield"></i> ورود ادمین سایت</h1>
    <p>نام کاربری و رمزی که مدیر سایت برای شما ساخته را وارد کنید.</p>
    <label>نام کاربری یا شماره موبایل<input name="u" autocomplete="username" dir="ltr" style="text-align:right" required></label>
    <label>رمز عبور<input type="password" name="p" autocomplete="current-password" required></label>
    <p class="err" id="gErr" role="alert"></p><button class="btn primary" type="submit" style="justify-content:center">ورود</button></form>`;
  $("sgForm").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target, u = f.u.value.trim().toLowerCase(), ph = toEn(u), st = Object.values(read(K.staff, {})).find(x => (x.username && x.username === u) || (x.userPhone && x.userPhone === ph));
    let ok = false;
    if (st && st.active !== false) {
      if (st.userPhone) { const us = read(K.users, {})[st.userPhone]; ok = !!us && !us.blocked && us.h === await siteHash(f.p.value); }   // حساب موجود سایت: با رمز همان حساب
      else ok = st.h === await hash(f.p.value);
    }
    if (!ok) return void ($("gErr").textContent = "نام کاربری یا رمز اشتباه است (یا حساب غیرفعال است).");
    sessionStorage.setItem("shahrak_staff_ok", st.id); ME = st; AUDIT_ACTOR = "ادمین: " + ME.name; start();
  });
}
const SWD_KEY = "shahrak_staffwd";
const staffAvatar = s => s.avatar || (s.userPhone && read(K.avatars, {})[s.userPhone]) || "";
const actorReply = text => ({ by: "admin", text, date: new Date().toISOString(), name: OWNER ? "مدیر سایت" : ME.name, staffId: OWNER ? null : ME.id });
const shebaOk = s => { if (!/^IR\d{24}$/.test(s)) return false; const n = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => c.charCodeAt(0) - 55); let m = 0; for (const ch of n) m = (m * 10 + +ch) % 97; return m === 1; };
const maskSheba = s => (s ? s.slice(0, 4) + "••••••••••••••••" + s.slice(-4) : "");
const saveStaff = st => { const S = read(K.staff, {}); S[st.id] = st; return write(K.staff, S); };
function renderWho() {
  const w = $("whobar"); w.hidden = false;
  w.innerHTML = OWNER ? '<div class="who-in"><span class="av"><i class="fa-solid fa-crown"></i></span><div><b>مدیر سایت</b></div></div>'
    : `<div class="who-in"><span class="av">${staffAvatar(ME) ? `<img src="${staffAvatar(ME)}" alt="" style="width:100%;height:100%;object-fit:cover">` : initial(ME.name)}</span><div><b>${esc(ME.name)}</b><small>ادمین سایت</small></div>
       <button class="btn sm" data-v="profile"><i class="fa-solid fa-user"></i> پروفایل</button><button class="btn sm" data-v="mywallet"><i class="fa-solid fa-wallet"></i> ${fa(walletOf("staff:" + ME.id).balance)}</button></div>`;
}
$("whobar").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b) show(b.dataset.v); });

/* ---------- ناوبری ---------- */
const VIEWS = [["dash", "داشبورد", "gauge"], ["users", "کاربران", "users"], ["orders", "سفارش‌ها", "box"], ["wallets", "کیف پول‌ها", "wallet"], ["sellers", "فروشندگان", "store"], ["tickets", "پشتیبانی", "headset"], ["stores", "فروشگاه‌ها", "store"], ["products", "محصولات", "mobile-screen-button"], ["reviews", "نظرات", "comments"], ["reports", "گزارش‌ها", "chart-line"], ["logs", "گزارش فعالیت", "clipboard-list"], ["staff", "ادمین‌های سایت", "user-shield"], ["settings", "تنظیمات", "gear"]];
const STAFF_VIEWS = () => [["staffhome", "خانه", "house"], ...VIEWS.filter(([id]) => VIEW_PERM[id] && can(id)), ["profile", "پروفایل من", "user"], ["mywallet", "کیف پول من", "wallet"]];
const navViews = () => (OWNER ? VIEWS : STAFF_VIEWS());
const homeView = () => (OWNER ? "dash" : "staffhome");
let cur = "dash";
function start() {
  $("gate").hidden = true; $("app").hidden = false;
  renderWho();
  $("nav").innerHTML = navViews().map(([id, l, i]) => `<button type="button" data-v="${id}"><i class="fa-solid fa-${i}"></i>${l}<span class="bdg" id="bdg-${id}" hidden></span></button>`).join("");
  show(location.hash.slice(1) || homeView());
}
$("nav").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b) { show(b.dataset.v); setMenu(false); window.scrollTo(0, 0); } });
function show(v) {
  if (!OWNER) {   // وضعیت ادمین را تازه کن؛ اگر غیرفعال یا حذف شده بود، خارج شو
    const fresh = read(K.staff, {})[ME.id];
    if (!fresh || fresh.active === false) { sessionStorage.removeItem("shahrak_staff_ok"); return location.reload(); }
    ME = fresh;
  }
  if (!navViews().some(x => x[0] === v)) v = homeView();
  cur = v; location.hash = v;
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  $("view").innerHTML = ({ dash: vDash, users: vUsers, orders: vOrders, stores: vStores, products: vProducts, reviews: vReviews, settings: vSettings, wallets: vWallets, tickets: vTickets, reports: vReports, logs: vLogs, sellers: vSellers, staff: vStaff, staffhome: vStaffHome, profile: vProfile, mywallet: vMyWallet })[v]();
  navBadges();
  if (v === "users") paintUsers(); if (v === "orders") paintOrders();
}
const rerender = () => show(cur);

/* منوی همبرگری (موبایل) */
const side = $("side"), scrim = $("scrim"), menuBtn = $("menuBtn");
function setMenu(open) {
  side.classList.toggle("open", open);
  scrim.hidden = !open;
  document.body.classList.toggle("nolock", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "بستن منو" : "باز کردن منو");
  if (open) side.querySelector("button, a").focus();
}
menuBtn.addEventListener("click", () => setMenu(!side.classList.contains("open")));
scrim.addEventListener("click", () => setMenu(false));
document.addEventListener("keydown", e => { if (e.key === "Escape" && side.classList.contains("open")) { setMenu(false); menuBtn.focus(); } });
if (window.matchMedia) window.matchMedia("(min-width:821px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

/* ---------- داده‌ها ---------- */
const users = () => read(K.users, {}), orders = () => read(K.orders, []), reviews = () => read(K.reviews, {}), avatars = () => read(K.avatars, {});
const flatReviews = () => Object.entries(reviews()).flatMap(([pid, list]) => list.map(r => ({ ...r, pid })));
const prodName = id => (products.find(p => p.id === id) || { name: "(حذف‌شده)" }).name;
const storeName = id => (stores.find(s => s.id === id) || { name: "(حذف‌شده)" }).name;

/* ---------- داشبورد ---------- */
function vDash() {
  const U = Object.keys(users()), O = orders(), R = flatReviews();
  const rev = O.filter(o => o.status !== "canceled").reduce((s, o) => s + o.total, 0);
  const pend = O.filter(o => (o.status || "pending") === "pending").length;
  const st = (i, n, l) => `<div class="stat"><i class="fa-solid fa-${i}"></i><b>${fa(n)}</b><span>${l}</span></div>`;
  const recent = [...O].reverse().slice(0, 6);
  return `<h1>داشبورد</h1><div class="cards">
    ${st("users", U.length, "کاربر ثبت‌نام‌شده")}${st("box", O.length, "سفارش")}${st("clock", pend, "سفارش در انتظار")}
    ${st("money-bill-wave", rev, "فروش (تومان، بدون لغوشده‌ها)")}${st("store", stores.length, "فروشگاه")}${st("mobile-screen-button", products.length, "محصول")}${st("comments", R.length, "نظر")}${st("wallet", Object.values(read(K.wallets, {})).reduce((s, w) => s + w.balance, 0), "مجموع موجودی کیف پول‌ها (تومان)")}${st("headset", read(K.tickets, []).filter(t => t.status === "open").length, "درخواست پشتیبانی باز")}${st("hourglass-half", read(K.topups, []).filter(t => t.status === "pending").length, "درخواست شارژ در انتظار")}</div>
    <div class="panel"><h2>آخرین سفارش‌ها</h2>${recent.length ? `<div class="tw"><table><thead><tr><th>کد</th><th>مشتری</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th></tr></thead><tbody>${recent.map(o => `<tr><td>${toFaDigits(o.code)}</td><td>${esc(o.ship.name)}</td><td>${fa(o.total)}</td><td><span class="tag ${stCls[o.status || "pending"]}">${STATUS[o.status || "pending"]}</span></td><td>${fmtDT(o.date)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">هنوز سفارشی ثبت نشده است.</div>'}</div>
    <p class="note">داده‌ها در حافظه‌ی همین مرورگر ذخیره می‌شوند؛ کاربران دستگاه‌های دیگر در این پنل دیده نمی‌شوند. برای مدیریت واقعی همه‌ی کاربران به سرور و دیتابیس نیاز است.</p>`;
}

/* ---------- کاربران ---------- */
let uq = "";
function vUsers() { return `<h1>کاربران</h1><div class="bar"><input class="search" id="uq" placeholder="جستجوی نام یا موبایل…" value="${esc(uq)}"><span class="grow"></span></div><div class="tw" id="tbl"></div>`; }
function paintUsers() {
  const U = users(), O = orders(), A = avatars(), W = read(K.wallets, {});
  const rows = Object.entries(U).filter(([ph, u]) => !uq || (u.name + ph + toFaDigits(ph)).includes(uq));
  $("tbl").innerHTML = rows.length ? `<table><thead><tr><th>کاربر</th><th>موبایل</th><th>تاریخ عضویت</th><th>سفارش</th><th>مجموع خرید</th><th>کیف پول</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(([ph, u]) => {
    const my = O.filter(o => o.user === ph && o.status !== "canceled");
    return `<tr><td><div class="who"><span class="av">${A[ph] ? `<img src="${A[ph]}" alt="" style="width:100%;height:100%;object-fit:cover">` : initial(u.name)}</span>${esc(u.name)}</div></td>
      <td dir="ltr" style="text-align:right">${toFaDigits(ph)}</td><td>${fmtD(u.joined)}</td><td>${fa(O.filter(o => o.user === ph).length)}</td><td>${fa(my.reduce((s, o) => s + o.total, 0))}</td>
      <td><button class="btn sm" data-w="wmodal" data-id="${ph}">${fa((W[ph] || { balance: 0 }).balance)}</button></td>
      <td><span class="tag ${u.blocked ? "bad" : "ok"}">${u.blocked ? "مسدود" : "فعال"}</span></td>
      <td><div class="acts"><button class="btn sm" data-a="ublock" data-id="${ph}">${u.blocked ? "رفع مسدودی" : "مسدود"}</button>${OWNER ? `<button class="btn sm danger" data-a="udel" data-id="${ph}">حذف</button>` : ""}</div></td></tr>`;
  }).join("")}</tbody></table>` : '<div class="empty">کاربری پیدا نشد.</div>';
}

/* ---------- سفارش‌ها ---------- */
let of = "all";
function vOrders() { return `<h1>سفارش‌ها</h1><div class="bar"><select id="of" class="search"><option value="all">همه وضعیت‌ها</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${of === k ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="tw" id="tbl"></div>`; }
function paintOrders() {
  const list = [...orders()].reverse().filter(o => of === "all" || (o.status || "pending") === of);
  $("tbl").innerHTML = list.length ? `<table><thead><tr><th>کد</th><th>تاریخ</th><th>مشتری</th><th>مبلغ</th><th>وضعیت</th><th></th></tr></thead><tbody>${list.map(o => `<tr><td>${toFaDigits(o.code)}</td><td>${fmtDT(o.date)}</td><td>${esc(o.ship.name)}<br><small dir="ltr">${toFaDigits(o.ship.phone)}</small></td><td>${fa(o.total)}</td>
    <td>${Object.values(ensureSubs(o).subs).some(s => s.dispute && s.dispute.status === "open") ? '<span class="tag bad">اختلاف</span> ' : ""}${Object.values(o.subs).some(s => s.ret && ["requested", "approved", "shipped_back", "escalated"].includes(s.ret.status)) ? '<span class="tag info">مرجوعی</span> ' : ""}<br><select data-a="ostat" data-id="${o.code}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${(o.status || "pending") === k ? "selected" : ""}>${v}</option>`).join("")}</select></td>
    <td><div class="acts"><button class="btn sm" data-a="oview" data-id="${o.code}">جزئیات</button>${OWNER ? `<button class="btn sm danger" data-a="odel" data-id="${o.code}">حذف</button>` : ""}</div></td></tr>`).join("")}</tbody></table>` : '<div class="empty">سفارشی پیدا نشد.</div>';
}

/* ---------- فروشگاه‌ها ---------- */
function vStores() {
  return `<h1>فروشگاه‌ها</h1><div class="bar"><button class="btn primary" data-a="sedit" data-id=""><i class="fa-solid fa-plus"></i> فروشگاه جدید</button></div><div class="tw">${catStores().length ? `<table><thead><tr><th>فروشگاه</th><th>دسته</th><th>محصولات</th><th>وضعیت</th><th></th></tr></thead><tbody>${catStores().map(s => `<tr><td><div class="who">${s.logo ? `<img class="th" src="${s.logo}" alt="">` : '<span class="th"><i class="fa-solid fa-store"></i></span>'}<div>${esc(s.name)}<br><small>${esc(s.area || "")}</small></div></div></td><td>${esc(s.cat)}</td><td>${fa(products.filter(p => p.shopId === s.id).length)}</td><td><span class="tag ${s.open && !s.blocked ? "ok" : "bad"}">${s.blocked ? "مسدود" : s.open ? "باز" : "بسته"}</span></td><td><div class="acts"><button class="btn sm" data-a="sedit" data-id="${s.id}">ویرایش</button><button class="btn sm" data-x="cblock" data-id="${s.id}">${s.blocked ? "رفع مسدودی" : "مسدود"}</button><button class="btn sm danger" data-a="sdel" data-id="${s.id}">حذف</button></div></td></tr>`).join("")}</tbody></table>` : '<div class="empty">فروشگاهی وجود ندارد.</div>'}</div>`;
}
let tmp = {};
function storeForm(id) {
  const s = stores.find(x => x.id === id) || { open: true, rate: 4.5 };
  tmp = { logo: s.logo || "", cover: s.cover || "" };
  const pal = Object.entries(PALETTES).find(([, v]) => v[0] === s.c);
  openModal(`<form class="mf" id="sForm" data-id="${id}" novalidate><h2>${id ? "ویرایش" : "افزودن"} فروشگاه</h2>
    <div class="g2"><label>نام فروشگاه *<input name="name" value="${esc(s.name)}" required></label><label>دسته *<input name="cat" value="${esc(s.cat)}" required></label></div>
    <div class="g2"><label>محله<input name="area" value="${esc(s.area)}"></label><label>ساعت کاری<input name="hours" value="${esc(s.hours)}"></label></div>
    <label>آدرس<input name="address" value="${esc(s.address)}"></label>
    <div class="g2"><label>تلفن<input name="phone" value="${esc(s.phone)}" dir="ltr" style="text-align:right"></label><label>رنگ فروشگاه<select name="pal">${Object.keys(PALETTES).map(k => `<option ${pal && pal[0] === k ? "selected" : ""}>${k}</option>`).join("")}</select></label></div>
    <label>توضیح<textarea name="desc" rows="2">${esc(s.desc)}</textarea></label>
    <div class="g2"><label>امتیاز (۰ تا ۵)<input name="rate" value="${s.rate ?? ""}" inputmode="decimal"></label><label class="chk"><input type="checkbox" name="open" ${s.open ? "checked" : ""}> فروشگاه باز است</label></div>
    <label>لوگو<input type="file" accept="image/*" data-img="logo"></label><div id="pLogo"></div>
    <label>کاور (بنر)<input type="file" accept="image/*" data-img="cover"></label><div id="pCover"></div>
    <p class="err" id="mErr" role="alert"></p>
    <div class="mfoot"><button class="btn primary" type="submit">ذخیره</button><button class="btn" type="button" data-close>انصراف</button></div></form>`);
  paintStoreImgs();
}
function paintStoreImgs() {
  $("pLogo").innerHTML = tmp.logo ? `<div class="imgs"><div class="it"><img src="${tmp.logo}" alt=""><button type="button" data-a="rmimg" data-id="logo" aria-label="حذف">×</button></div></div>` : "";
  $("pCover").innerHTML = tmp.cover ? `<img class="cover-prev" src="${tmp.cover}" alt=""><br><button class="btn sm danger" type="button" data-a="rmimg" data-id="cover">حذف کاور</button>` : "";
}

/* ---------- محصولات ---------- */
function vProducts() {
  return `<h1>محصولات</h1><div class="bar"><button class="btn primary" data-a="pedit" data-id=""><i class="fa-solid fa-plus"></i> محصول جدید</button></div><div class="tw">${catProducts().length ? `<table><thead><tr><th>محصول</th><th>فروشگاه</th><th>قیمت (تومان)</th><th></th></tr></thead><tbody>${catProducts().map(p => `<tr><td><div class="who"><img class="th" src="${p.images[0]}" alt="">${esc(p.name)}</div></td><td>${esc(storeName(p.shopId))}</td><td>${fa(p.price)}</td><td><div class="acts"><button class="btn sm" data-a="pedit" data-id="${p.id}">ویرایش</button><button class="btn sm danger" data-a="pdel" data-id="${p.id}">حذف</button></div></td></tr>`).join("")}</tbody></table>` : '<div class="empty">محصولی وجود ندارد.</div>'}</div>`;
}
function productForm(id) {
  const p = products.find(x => x.id === id) || { images: [], specs: [], details: {} };
  tmp = { images: [...p.images].filter(x => !x.endsWith("placeholder.svg")) };
  openModal(`<form class="mf" id="pForm" data-id="${id}" novalidate><h2>${id ? "ویرایش" : "افزودن"} محصول</h2>
    <label>نام محصول *<input name="name" value="${esc(p.name)}" required></label>
    <div class="g2"><label>فروشگاه *<select name="shop">${catStores().map(s => `<option value="${s.id}" ${p.shopId === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>
      <label>قیمت (تومان) *<input name="price" value="${p.price ?? ""}" inputmode="numeric" required></label></div>
    <label>قیمت قبل از تخفیف (اختیاری)<input name="old" value="${p.old ?? ""}" inputmode="numeric"></label>
    <label>توضیح کوتاه<textarea name="desc" rows="2">${esc(p.desc)}</textarea></label>
    <label>ویژگی‌های مهم (هر خط یک مورد)<textarea name="specs" rows="3">${esc((p.specs || []).join("\n"))}</textarea></label>
    <label>مشخصات فنی (هر خط «عنوان: مقدار»)<textarea name="details" rows="4">${esc(Object.entries(p.details || {}).map(([k, v]) => k + ": " + v).join("\n"))}</textarea></label>
    <label>تصاویر (اولی عکس اصلی است؛ می‌توانید چندتا انتخاب کنید)<input type="file" accept="image/*" multiple data-img="prod"></label><div class="imgs" id="pImgs"></div>
    <p class="err" id="mErr" role="alert"></p>
    <div class="mfoot"><button class="btn primary" type="submit">ذخیره</button><button class="btn" type="button" data-close>انصراف</button></div></form>`);
  paintProdImgs();
}
const paintProdImgs = () => ($("pImgs").innerHTML = tmp.images.map((s, i) => `<div class="it"><img src="${s}" alt=""><button type="button" data-a="rmimg" data-id="${i}" aria-label="حذف">×</button></div>`).join(""));

/* ---------- نظرات ---------- */
function vReviews() {
  const R = flatReviews().sort((a, b) => b.date.localeCompare(a.date));
  return `<h1>نظرات</h1><div class="tw">${R.length ? `<table><thead><tr><th>محصول</th><th>کاربر</th><th>امتیاز</th><th>متن</th><th>تاریخ</th><th></th></tr></thead><tbody>${R.map(r => `<tr><td>${esc(prodName(r.pid))}</td><td>${esc(r.name)}</td><td class="stars">${"★".repeat(r.rate)}${"☆".repeat(5 - r.rate)}</td><td style="min-width:220px">${esc(r.text)}</td><td>${fmtD(r.date)}</td><td><button class="btn sm danger" data-a="rdel" data-id="${r.pid}" data-u="${r.user}">حذف</button></td></tr>`).join("")}</tbody></table>` : '<div class="empty">هنوز نظری ثبت نشده است.</div>'}</div>`;
}

/* ---------- تنظیمات ---------- */
function vSettings() {
  return `<h1>تنظیمات</h1>${settingsForm()}
  <div class="panel"><h2>تغییر رمز مدیر</h2><form id="pwForm" class="mf" style="padding:0;max-width:380px" novalidate>
    <label>رمز فعلی<input type="password" name="a" autocomplete="current-password"></label><label>رمز جدید (حداقل ۸ کاراکتر)<input type="password" name="b" autocomplete="new-password"></label><label>تکرار رمز جدید<input type="password" name="c" autocomplete="new-password"></label>
    <p class="err" id="pwErr" role="alert"></p><div><button class="btn primary" type="submit">تغییر رمز</button></div></form></div>
  <div class="panel"><h2>پشتیبان‌گیری</h2><p>از همه‌ی داده‌های سایت (کاربران، سفارش‌ها، نظرها، فروشگاه‌ها و محصولات) یک فایل بگیرید یا فایل قبلی را بازگردانید.</p>
    <div class="bar"><button class="btn" data-a="export"><i class="fa-solid fa-download"></i> دانلود پشتیبان</button><label class="btn" style="cursor:pointer"><i class="fa-solid fa-upload"></i> بازگردانی از فایل<input type="file" accept="application/json" data-img="import" hidden></label></div></div>
  <div class="panel"><h2>داده‌ی آزمایشی (فقط برای تست)</h2><p>یک فروشنده‌ی تأییدشده با فروشگاه و سه محصول، به‌همراه یک مشتری با کیف پول پر می‌سازد تا کل مسیر خرید، تحویل و برداشت را تست کنید. هر دو کاربر با رمز <b dir="ltr">test1234</b> وارد می‌شوند.</p>
    <div class="bar"><button class="btn primary" data-x="seed"><i class="fa-solid fa-flask"></i> ساخت فروشگاه و کاربران تستی</button><button class="btn danger" data-x="unseed">حذف داده‌ی تستی</button></div></div>
  <div class="panel"><h2>پاک‌سازی</h2><div class="bar">
    <button class="btn danger" data-a="resetcat">بازگشت فروشگاه‌ها و محصولات به حالت اولیه</button>
    <button class="btn danger" data-a="wipe">حذف همه‌ی کاربران، سفارش‌ها و نظرها</button></div></div>`;
}

/* ---------- ادمین‌های سایت (مدیریت توسط مدیر سایت) ---------- */
function vStaff() {
  const S = Object.values(read(K.staff, {})), W = read(K.wallets, {});
  return `<h1>ادمین‌های سایت</h1><p class="note">ادمین‌ها از صفحه‌ی جدای <b dir="ltr">staff.html</b> وارد می‌شوند و فقط به بخش‌هایی که شما اجازه می‌دهید دسترسی دارند. هر ادمین پروفایل و کیف پول مخصوص خودش را دارد.</p>
  <div class="bar"><button class="btn primary" data-x="stedit" data-id=""><i class="fa-solid fa-plus"></i> ادمین جدید</button></div>
  ${swdPanel()}
  <div class="tw">${S.length ? `<table><thead><tr><th>ادمین</th><th>دسترسی‌ها</th><th>کیف پول</th><th>وضعیت</th><th></th></tr></thead><tbody>${S.map(s => `<tr><td><div class="who"><span class="av">${staffAvatar(s) ? `<img src="${staffAvatar(s)}" alt="" style="width:100%;height:100%;object-fit:cover">` : initial(s.name)}</span><div>${esc(s.name)}<br><small dir="ltr">${s.userPhone ? toFaDigits(s.userPhone) + " (حساب کاربری سایت)" : esc(s.username)}</small></div></div></td><td>${s.perms.map(p => `<span class="tag info">${PERMS[p]}</span>`).join(" ") || "—"}</td><td><button class="btn sm" data-w="wmodal" data-id="staff:${s.id}">${fa((W["staff:" + s.id] || { balance: 0 }).balance)}</button></td><td><span class="tag ${s.active === false ? "bad" : "ok"}">${s.active === false ? "غیرفعال" : "فعال"}</span></td><td><div class="acts"><button class="btn sm" data-x="stedit" data-id="${s.id}">ویرایش</button><button class="btn sm danger" data-x="stdel" data-id="${s.id}">حذف</button></div></td></tr>`).join("")}</tbody></table>` : '<div class="empty">هنوز ادمینی تعریف نشده است.</div>'}</div>`;
}
function swdPanel() {
  const L = [...read(SWD_KEY, [])].reverse();
  return `<div class="panel"><h2>درخواست‌های برداشت ادمین‌ها</h2>${L.length ? `<div class="tw"><table><thead><tr><th>ادمین</th><th>مبلغ</th><th>شبا</th><th>تاریخ</th><th>وضعیت</th><th></th></tr></thead><tbody>${L.map(x => `<tr><td>${esc(x.name)}</td><td>${fa(x.amount)}</td><td dir="ltr" style="text-align:right">${esc(x.sheba)}<br><small>${esc(x.shebaName || "")}</small></td><td>${fmtDT(x.date)}</td><td><span class="tag ${x.status === "paid" ? "ok" : x.status === "rejected" ? "bad" : ""}">${WD_ST[x.status]}</span>${x.ref ? `<br><small>${esc(toFaDigits(x.ref))}</small>` : ""}</td><td>${x.status === "pending" ? `<div class="acts"><button class="btn sm primary" data-x="swpay" data-id="${x.id}">واریز شد</button><button class="btn sm danger" data-x="swno" data-id="${x.id}">رد و بازگشت</button></div>` : ""}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">درخواستی نیست.</div>'}</div>`;
}
function staffForm(id) {
  const s = read(K.staff, {})[id] || { perms: [], active: true };
  openModal(`<form class="mf" id="stForm" data-id="${id}" novalidate><h2>${id ? "ویرایش" : "افزودن"} ادمین</h2>
    <label>حساب کاربری<select name="link" ${id ? "disabled" : ""}><option value="">حساب جداگانه (نام کاربری و رمز مخصوص ادمین)</option>${Object.entries(read(K.users, {})).filter(([ph]) => ph === s.userPhone || !Object.values(read(K.staff, {})).some(x => x.userPhone === ph)).map(([ph, u]) => `<option value="${ph}" ${s.userPhone === ph ? "selected" : ""}>${esc(u.name)} — ${toFaDigits(ph)}</option>`).join("")}</select></label>
    <p class="note" style="margin:0">اگر یک حساب موجود را انتخاب کنید، همان شخص با موبایل و رمز فعلی‌اش از <b dir="ltr">staff.html</b> وارد می‌شود و عکس پروفایلش به مشتری‌ها نشان داده می‌شود.</p>
    <label>نام نمایشی *<input name="name" value="${esc(s.name)}"></label>
    <div id="stCred" ${s.userPhone ? "hidden" : ""}><div class="g2"><label>نام کاربری ورود *<input name="username" value="${esc(s.username)}" dir="ltr" style="text-align:right" placeholder="مثلاً ali.m"></label>
    <label>${id ? "رمز جدید (خالی = بدون تغییر)" : "رمز عبور * (حداقل ۸ کاراکتر)"}<input type="password" name="pass" autocomplete="new-password"></label></div></div>
    <fieldset class="perms"><legend>دسترسی‌ها</legend>${Object.entries(PERMS).map(([k, l]) => `<label class="chk"><input type="checkbox" name="perm" value="${k}" ${s.perms.includes(k) ? "checked" : ""}> ${l}</label>`).join("")}</fieldset>
    <label class="chk"><input type="checkbox" name="active" ${s.active !== false ? "checked" : ""}> حساب فعال است</label>
    <p class="err" id="mErr" role="alert"></p><div class="mfoot"><button class="btn primary" type="submit">ذخیره</button><button class="btn" type="button" data-close>انصراف</button></div></form>`);
}
function vStaffHome() {
  const st = (i, n, l) => `<div class="stat"><i class="fa-solid fa-${i}"></i><b>${fa(n)}</b><span>${l}</span></div>`, c = [];
  if (can("tickets")) c.push(st("headset", read(K.tickets, []).filter(t => t.status === "open").length, "درخواست پشتیبانی باز"));
  if (can("orders")) c.push(st("box", orders().filter(o => (o.status || "pending") === "pending").length, "سفارش در انتظار"), st("triangle-exclamation", orders().map(ensureSubs).filter(o => Object.values(o.subs).some(s => s.dispute && s.dispute.status === "open")).length, "اختلاف باز"));
  if (can("sellers")) c.push(st("store", Object.values(getSellers()).filter(s => s.status === "pending").length, "فروشنده‌ی در انتظار تأیید"), st("building-columns", read(WD_KEY, []).filter(w => w.status === "pending").length, "برداشت در انتظار واریز"));
  if (can("wallets")) c.push(st("hourglass-half", read(K.topups, []).filter(t => t.status === "pending").length + read(K.payments, []).filter(p => p.status === "needs_review").length, "شارژ در انتظار بررسی"));
  return `<h1>سلام ${esc(ME.name)}</h1><p class="note">از منوی کنار، بخش‌هایی را که برای شما فعال شده می‌بینید.</p><div class="cards">${c.join("") || '<div class="empty">فعلاً دسترسی‌ای برای شما تعریف نشده است. با مدیر سایت تماس بگیرید.</div>'}</div>`;
}
function vProfile() {
  return `<h1>پروفایل من</h1><div class="panel"><div class="who" style="margin-bottom:14px"><span class="av" style="width:64px;height:64px;font-size:24px">${staffAvatar(ME) ? `<img src="${staffAvatar(ME)}" alt="" style="width:100%;height:100%;object-fit:cover">` : initial(ME.name)}</span><div><b>${esc(ME.name)}</b><br><small dir="ltr">${esc(ME.username)}</small><br><small>عضو از ${fmtD(ME.created)}</small></div></div>
    <form id="spForm" class="mf" style="padding:0;max-width:420px" novalidate><label>نام نمایشی<input name="name" value="${esc(ME.name)}"></label><label>عکس پروفایل${ME.userPhone ? " (پیش‌فرض: عکس حساب کاربری شما)" : ""}<input type="file" accept="image/*" data-img="staffav"></label><label>شماره شبا (برای برداشت از کیف پول)<input name="sheba" value="${esc(ME.sheba || "")}" dir="ltr" style="text-align:right" placeholder="IR000000000000000000000000"></label><label>نام صاحب حساب<input name="shebaName" value="${esc(ME.shebaName || "")}"></label>
      <p class="err" id="spErr" role="alert"></p><div class="acts"><button class="btn primary" type="submit">ذخیره</button>${ME.avatar ? '<button class="btn danger" type="button" data-x="avdel">حذف عکس</button>' : ""}</div></form></div>
  <div class="panel"><h2>دسترسی‌های من</h2>${ME.perms.map(p => `<span class="tag info">${PERMS[p]}</span>`).join(" ") || "—"}</div>
  ${ME.userPhone ? '<div class="panel"><h2>رمز عبور</h2><p>این حساب به حساب کاربری سایت شما وصل است؛ رمز ورود همان رمز حساب کاربری است.</p></div>' : `<div class="panel"><h2>تغییر رمز</h2><form id="spwForm" class="mf" style="padding:0;max-width:380px" novalidate><label>رمز فعلی<input type="password" name="a" autocomplete="current-password"></label><label>رمز جدید (حداقل ۸ کاراکتر)<input type="password" name="b" autocomplete="new-password"></label><label>تکرار رمز جدید<input type="password" name="c" autocomplete="new-password"></label><p class="err" id="spwErr" role="alert"></p><div><button class="btn primary" type="submit">تغییر رمز</button></div></form></div>`}`;
}
function vMyWallet() {
  const w = walletOf("staff:" + ME.id), S = getSettings(), WD = read(SWD_KEY, []).filter(x => x.staffId === ME.id).reverse();
  return `<h1>کیف پول من</h1><div class="cards"><div class="stat"><i class="fa-solid fa-wallet"></i><b>${fa(w.balance)}</b><span>موجودی قابل برداشت (تومان)</span></div></div>
  <div class="panel"><h2>برداشت از کیف پول</h2>${ME.sheba ? `<form id="swForm" class="mf" style="padding:0;max-width:420px" novalidate><label>مبلغ برداشت (تومان) — حداقل ${fa(S.minWithdraw)}<input name="amount" inputmode="numeric" autocomplete="off"></label>
    <p class="note" style="margin:0">واریز به شبا: <b dir="ltr">${esc(maskSheba(ME.sheba))}</b> (${esc(ME.shebaName || "")}) — بدون کارمزد</p><p class="err" id="swErr" role="alert"></p><div><button class="btn primary" type="submit">ثبت درخواست برداشت</button></div></form>`
    : '<p class="note">برای برداشت، ابتدا شماره شبا را در پروفایل ثبت کنید.</p><button class="btn" data-v="profile">رفتن به پروفایل</button>'}</div>
  ${WD.length ? `<div class="panel"><h2>درخواست‌های برداشت من</h2><div class="tw"><table style="min-width:0"><tbody>${WD.map(x => `<tr><td>${fmtDT(x.date)}</td><td>${fa(x.amount)}</td><td><span class="tag ${x.status === "paid" ? "ok" : x.status === "rejected" ? "bad" : ""}">${WD_ST[x.status]}</span>${x.ref ? ` <small>${esc(toFaDigits(x.ref))}</small>` : ""}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
  <p class="note">واریزی‌ها توسط مدیر سایت به این کیف پول ثبت می‌شود.</p>
  <div class="tw">${w.tx.length ? `<table><thead><tr><th>تاریخ</th><th>نوع</th><th>مبلغ</th><th>مانده</th><th>توضیح</th></tr></thead><tbody>${w.tx.slice(0, 50).map(t => `<tr><td>${fmtDT(t.date)}</td><td>${WL[t.type] || "تراکنش"}</td><td class="${t.amount > 0 ? "pos" : "neg"}">${money(t.amount)}</td><td>${fa(t.balance)}</td><td>${esc(t.note || "")}</td></tr>`).join("")}</tbody></table>` : '<div class="empty">هنوز تراکنشی ندارید.</div>'}</div>`;
}
$("view").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b) show(b.dataset.v); });
/* ---------- نشان‌ها ---------- */
function navBadges() {
  const n = { tickets: read(K.tickets, []).filter(t => t.status === "open").length, wallets: read(K.topups, []).filter(t => t.status === "pending").length + read(K.payments, []).filter(p => p.status === "needs_review").length, orders: orders().filter(o => (o.status || "pending") === "pending").length, sellers: Object.values(getSellers()).filter(s => s.status === "pending").length + read(WD_KEY, []).filter(w => w.status === "pending").length, staff: read(SWD_KEY, []).filter(w => w.status === "pending").length };
  n.orders += orders().map(ensureSubs).filter(o => Object.values(o.subs).some(s => (s.dispute && s.dispute.status === "open") || (s.ret && s.ret.status === "escalated"))).length;
  Object.entries(n).forEach(([k, v]) => { const el = $("bdg-" + k); if (el) { el.textContent = fa(v); el.hidden = !v; } });
}
const WL = { charge: "شارژ", purchase: "خرید", refund: "بازگشت وجه", adjust: "اصلاح مدیر", sale: "فروش", withdraw: "برداشت", withdraw_refund: "بازگشت برداشت", hold: "امانت سفارش", unhold: "برگشت امانت" };
const money = n => (n > 0 ? "+" : n < 0 ? "−" : "") + fa(Math.abs(n));
const userName = ph => ph.startsWith("staff:") ? "ادمین " + ((read(K.staff, {})[ph.slice(6)] || {}).name || "") : ph.startsWith("store:") ? "فروشگاه " + ((getSellers()[ph.slice(6)] || {}).name || "") : (users()[ph] || { name: "(حذف‌شده)" }).name;

/* ---------- کیف پول‌ها ---------- */
function vWallets() {
  const W = read(K.wallets, {}), T = read(K.topups, []), U = users();
  const pend = T.filter(t => t.status === "pending"), P = read(K.payments, []);
  const total = Object.values(W).reduce((s, w) => s + w.balance, 0);
  const allTx = Object.entries(W).flatMap(([ph, w]) => w.tx.map(t => ({ ...t, ph }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
  return `<h1>کیف پول‌ها</h1>
  <div class="cards"><div class="stat"><i class="fa-solid fa-wallet"></i><b>${fa(total)}</b><span>مجموع موجودی (تومان)</span></div>
    <div class="stat"><i class="fa-solid fa-hourglass-half"></i><b>${fa(pend.length)}</b><span>درخواست شارژ در انتظار</span></div></div>
  <div class="panel"><h2>درخواست‌های شارژ</h2>${T.length ? `<div class="tw"><table><thead><tr><th>کاربر</th><th>مبلغ</th><th>پیگیری</th><th>تاریخ</th><th>وضعیت</th><th></th></tr></thead><tbody>${[...T].reverse().map(t => `<tr><td>${esc(t.name)}<br><small dir="ltr">${toFaDigits(t.user)}</small></td><td>${fa(t.amount)}</td><td>${esc(toFaDigits(t.ref))}</td><td>${fmtDT(t.date)}</td><td><span class="tag ${t.status === "approved" ? "ok" : t.status === "rejected" ? "bad" : ""}">${{ pending: "در انتظار", approved: "تأیید شد", rejected: "رد شد" }[t.status]}</span></td><td>${t.status === "pending" ? `<div class="acts"><button class="btn sm primary" data-w="topok" data-id="${t.id}">تأیید و شارژ</button><button class="btn sm danger" data-w="topno" data-id="${t.id}">رد</button></div>` : ""}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">درخواستی وجود ندارد.</div>'}</div>
  <div class="panel"><h2>پرداخت‌های درگاه</h2>${P.length ? `<div class="tw"><table><thead><tr><th>کد</th><th>کاربر</th><th>مبلغ</th><th>پیگیری</th><th>تاریخ</th><th>وضعیت</th><th></th></tr></thead><tbody>${[...P].reverse().map(p => `<tr><td dir="ltr">${esc(p.id)}</td><td>${esc(p.name)}<br><small dir="ltr">${toFaDigits(p.user)}</small></td><td>${fa(p.amount)}</td><td>${esc(toFaDigits(p.ref || "—"))}</td><td>${fmtDT(p.date)}</td><td><span class="tag ${p.status === "paid" ? "ok" : p.status === "failed" ? "bad" : p.status === "needs_review" ? "" : "info"}">${PAY_ST[p.status]}</span></td><td>${!p.credited && p.status !== "failed" ? `<div class="acts"><button class="btn sm primary" data-w="payok" data-id="${p.id}">تأیید و شارژ</button><button class="btn sm danger" data-w="payno" data-id="${p.id}">ناموفق</button></div>` : ""}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">هنوز پرداختی از درگاه ثبت نشده است.</div>'}</div>
  <div class="panel"><h2>کیف پول فروشگاه‌ها</h2>${Object.values(getSellers()).length ? `<div class="tw"><table><thead><tr><th>فروشگاه</th><th>قابل برداشت</th><th>در انتظار تحویل (امانت)</th></tr></thead><tbody>${Object.values(getSellers()).map(s => { const w = W["store:" + s.id] || { balance: 0 }; return `<tr><td>${esc(s.name)}</td><td>${fa(w.balance)}</td><td>${fa(w.pending || 0)}</td></tr>`; }).join("")}</tbody></table></div>` : '<div class="empty">فروشگاهی ثبت نشده است.</div>'}</div>
  <div class="panel"><h2>کیف پول کاربران</h2><div class="tw"><table><thead><tr><th>کاربر</th><th>موجودی</th><th>تراکنش‌ها</th><th></th></tr></thead><tbody>${Object.keys(U).map(ph => { const w = W[ph] || { balance: 0, tx: [] }; return `<tr><td>${esc(U[ph].name)}<br><small dir="ltr">${toFaDigits(ph)}</small></td><td>${fa(w.balance)}</td><td>${fa(w.tx.length)}</td><td><button class="btn sm" data-w="wmodal" data-id="${ph}">مدیریت</button></td></tr>`; }).join("") || '<tr><td colspan="4" class="empty">کاربری وجود ندارد.</td></tr>'}</tbody></table></div></div>
  <div class="panel"><h2>آخرین تراکنش‌ها</h2>${allTx.length ? `<div class="tw"><table><thead><tr><th>تاریخ</th><th>کاربر</th><th>نوع</th><th>مبلغ</th><th>مانده</th><th>توضیح</th></tr></thead><tbody>${allTx.map(t => `<tr><td>${fmtDT(t.date)}</td><td>${esc(userName(t.ph))}</td><td>${WL[t.type] || t.type}</td><td class="${t.amount > 0 ? "pos" : "neg"}">${money(t.amount)}</td><td>${fa(t.balance)}</td><td>${esc(t.note || "")}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">تراکنشی ثبت نشده است.</div>'}</div>`;
}
function walletModal(ph) {
  const w = walletOf(ph);
  openModal(`<div class="mf"><h2>کیف پول ${esc(userName(ph))}</h2><p>موجودی فعلی: <b>${fa(w.balance)}</b> تومان</p>
    ${!OWNER ? "" : `<form id="wForm" data-ph="${ph}" class="mf" style="padding:0" novalidate>
      <div class="g2"><label>عملیات<select name="op"><option value="add">افزایش موجودی</option><option value="sub">کاهش موجودی</option></select></label><label>مبلغ (تومان)<input name="amount" inputmode="numeric"></label></div>
      <label>دلیل (برای سوابق الزامی است)<input name="reason"></label><p class="err" id="mErr" role="alert"></p>
      <div><button class="btn primary" type="submit">ثبت</button></div></form>`}
    <h2 style="font-size:1rem">تاریخچه</h2>${w.tx.length ? `<div class="tw"><table style="min-width:0"><tbody>${w.tx.slice(0, 20).map(t => `<tr><td>${fmtD(t.date)}</td><td>${WL[t.type] || ""}</td><td class="${t.amount > 0 ? "pos" : "neg"}">${money(t.amount)}</td><td>${esc(t.note || "")}</td></tr>`).join("")}</tbody></table></div>` : "<p>تراکنشی ندارد.</p>"}
    <div class="mfoot"><button class="btn" data-close>بستن</button></div></div>`);
}

/* ---------- پشتیبانی ---------- */
let tf = "all";
function vTickets() {
  const T = read(K.tickets, []).filter(t => tf === "all" || t.status === tf).sort((a, b) => b.date.localeCompare(a.date));
  return `<h1>پشتیبانی و تیکت‌ها</h1><div class="bar"><select id="tf" class="search"><option value="all">همه</option>${Object.entries(T_ST).map(([k, v]) => `<option value="${k}" ${tf === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
  <div class="tw">${T.length ? `<table><thead><tr><th>کد</th><th>کاربر</th><th>موضوع</th><th>مبلغ</th><th>تاریخ</th><th>وضعیت</th><th></th></tr></thead><tbody>${T.map(t => `<tr><td>${toFaDigits(t.id)}</td><td>${esc(t.name)}<br><small dir="ltr">${toFaDigits(t.user)}</small></td><td>${T_CATS[t.cat]}</td><td>${t.amount ? fa(t.amount) : "—"}</td><td>${fmtDT(t.date)}</td><td><span class="tag ${t.status === "resolved" ? "ok" : t.status === "closed" ? "bad" : t.status === "inprogress" ? "info" : ""}">${T_ST[t.status]}</span></td><td><button class="btn sm" data-w="tview" data-id="${t.id}">بررسی</button></td></tr>`).join("")}</tbody></table>` : '<div class="empty">درخواستی وجود ندارد.</div>'}</div>`;
}
function ticketModal(id) {
  const t = read(K.tickets, []).find(x => x.id === id);
  openModal(`<div class="mf"><h2>درخواست ${toFaDigits(t.id)}</h2>
    <dl class="kv"><dt>کاربر</dt><dd>${esc(t.name)} — <span dir="ltr">${toFaDigits(t.user)}</span></dd><dt>موضوع</dt><dd>${T_CATS[t.cat]}</dd>${t.amount ? `<dt>مبلغ</dt><dd>${fa(t.amount)} تومان</dd>` : ""}${t.ref ? `<dt>پیگیری بانکی</dt><dd>${esc(toFaDigits(t.ref))}</dd>` : ""}<dt>تاریخ</dt><dd>${fmtDT(t.date)}</dd></dl>
    <div class="msg user"><b>${esc(t.name)}</b><p>${esc(t.message)}</p></div>
    ${t.replies.map(r => `<div class="msg ${r.by}"><b>${r.by === "admin" ? esc(r.name || "پشتیبانی") : esc(t.name)}</b><p>${esc(r.text)}</p><small>${fmtDT(r.date)}</small></div>`).join("")}
    ${t.cat === "wallet" && t.amount ? (t.credited ? `<p class="note" style="background:#dcf7e6;color:#0f7a3a">مبلغ ${fa(t.credited)} تومان به کیف پول کاربر برگشت داده شده است.</p>` : `<div class="panel" style="margin:0"><h2 style="font-size:1rem">جبران شارژ ناموفق</h2><p>پس از اطمینان از واریز واقعی، مبلغ را به کیف پول کاربر اضافه کنید.</p><div class="bar"><input id="crAmt" value="${t.amount}" inputmode="numeric" style="max-width:200px"><button class="btn primary" type="button" data-w="tcredit" data-id="${t.id}">شارژ کیف پول و حل تیکت</button></div></div>`) : ""}
    <form id="tForm" data-id="${t.id}" class="mf" style="padding:0" novalidate><label>پاسخ مدیر<textarea name="text" rows="3"></textarea></label>
      <label>وضعیت<select name="st">${Object.entries(T_ST).map(([k, v]) => `<option value="${k}" ${t.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <div class="mfoot"><button class="btn primary" type="submit">ثبت</button><button class="btn" type="button" data-close>بستن</button></div></form></div>`);
}

/* ---------- گزارش‌ها ---------- */
let rng = 30;
function csv(rows, name) {
  const body = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const l = document.createElement("a");
  l.href = URL.createObjectURL(new Blob(["\ufeff" + body], { type: "text/csv;charset=utf-8" }));
  l.download = name + ".csv"; l.click();
}
function vReports() {
  const cut = rng ? Date.now() - rng * 864e5 : 0, inR = d => new Date(d).getTime() >= cut;
  const O = orders().filter(o => inR(o.date)), V = O.filter(o => o.status !== "canceled");
  const rev = V.reduce((s, o) => s + o.total, 0), U = users();
  const newU = Object.values(U).filter(u => u.joined && inR(u.joined)).length;
  const tx = Object.values(read(K.wallets, {})).flatMap(w => w.tx).filter(t => inR(t.date));
  const sum = f => tx.filter(f).reduce((s, t) => s + t.amount, 0);
  const days = Math.min(rng || 30, 30), byDay = {};
  for (let i = days - 1; i >= 0; i--) byDay[new Date(Date.now() - i * 864e5).toLocaleDateString("fa-IR")] = 0;
  V.forEach(o => { const k = new Date(o.date).toLocaleDateString("fa-IR"); if (k in byDay) byDay[k] += o.total; });
  const mx = Math.max(1, ...Object.values(byDay));
  const prod = {}; V.forEach(o => o.items.forEach(i => { (prod[i.name] = prod[i.name] || { q: 0, r: 0 }); prod[i.name].q += i.q; prod[i.name].r += i.q * i.price; }));
  const topP = Object.entries(prod).sort((a, b) => b[1].r - a[1].r).slice(0, 5);
  const cus = {}; V.forEach(o => (cus[o.user] = (cus[o.user] || 0) + o.total));
  const topC = Object.entries(cus).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const byS = Object.keys(STATUS).map(k => [STATUS[k], O.filter(o => (o.status || "pending") === k).length]);
  const tks = read(K.tickets, []).filter(t => inR(t.date));
  const commIncome = orders().filter(o => inR(o.date)).map(ensureSubs).flatMap(o => Object.values(o.subs)).filter(s => s.settled && s.commission).reduce((a, s) => a + s.commission, 0);
  const wdFees = read(WD_KEY, []).filter(w => w.status === "paid" && inR(w.date)).reduce((a, w) => a + w.fee, 0);
  const st = (i, n, l) => `<div class="stat"><i class="fa-solid fa-${i}"></i><b>${fa(n)}</b><span>${l}</span></div>`;
  return `<h1>گزارش‌ها</h1><div class="bar"><select id="rng" class="search">${[[7, "۷ روز اخیر"], [30, "۳۰ روز اخیر"], [90, "۹۰ روز اخیر"], [0, "کل زمان"]].map(([v, l]) => `<option value="${v}" ${rng === v ? "selected" : ""}>${l}</option>`).join("")}</select><span class="grow"></span>
    <button class="btn" data-w="csv" data-id="orders"><i class="fa-solid fa-file-csv"></i> سفارش‌ها</button><button class="btn" data-w="csv" data-id="users"><i class="fa-solid fa-file-csv"></i> کاربران</button><button class="btn" data-w="csv" data-id="tx"><i class="fa-solid fa-file-csv"></i> تراکنش‌های کیف پول</button></div>
  <div class="cards">${st("box", O.length, "سفارش")}${st("money-bill-wave", rev, "فروش (تومان)")}${st("receipt", V.length ? Math.round(rev / V.length) : 0, "میانگین هر سفارش")}${st("ban", O.length - V.length, "سفارش لغوشده")}${st("user-plus", newU, "کاربر جدید")}
    ${st("arrow-down", sum(t => t.type === "charge"), "شارژ کیف پول")}${st("cart-shopping", -sum(t => t.type === "purchase"), "خرید از کیف پول")}${st("rotate-left", sum(t => t.type === "refund"), "بازگشت وجه")}${st("headset", tks.length, "درخواست پشتیبانی")}${st("percent", commIncome, "درآمد کارمزد فروش (تومان)")}${st("building-columns", wdFees, "درآمد کارمزد برداشت (تومان)")}</div>
  <div class="panel"><h2>فروش روزانه (تومان)</h2><div class="chart">${Object.entries(byDay).map(([d, v]) => `<div class="bar-c" title="${d}: ${fa(v)}"><span style="height:${Math.max(2, v / mx * 100)}%"></span><small>${d.split("/").slice(1).join("/")}</small></div>`).join("")}</div></div>
  <div class="g2"><div class="panel"><h2>پرفروش‌ترین محصولات</h2>${topP.length ? `<table style="min-width:0"><tbody>${topP.map(([n, v]) => `<tr><td>${esc(n)}</td><td>${fa(v.q)} عدد</td><td>${fa(v.r)}</td></tr>`).join("")}</tbody></table>` : '<div class="empty">داده‌ای نیست.</div>'}</div>
  <div class="panel"><h2>بهترین مشتری‌ها</h2>${topC.length ? `<table style="min-width:0"><tbody>${topC.map(([p, v]) => `<tr><td>${esc(userName(p))}</td><td>${fa(v)}</td></tr>`).join("")}</tbody></table>` : '<div class="empty">داده‌ای نیست.</div>'}</div></div>
  <div class="panel"><h2>سفارش‌ها بر اساس وضعیت</h2><div class="acts">${byS.map(([l, n]) => `<span class="tag">${l}: ${fa(n)}</span>`).join("")}</div></div>`;
}

/* ---------- گزارش فعالیت ---------- */
function vLogs() {
  const L = read(K.audit, []);
  return `<h1>گزارش فعالیت‌های مدیر</h1><div class="tw">${L.length ? `<table><thead><tr><th>زمان</th><th>توسط</th><th>عملیات</th><th>جزئیات</th></tr></thead><tbody>${L.map(l => `<tr><td>${fmtDT(l.date)}</td><td>${esc(l.by || "مدیر سایت")}</td><td>${esc(l.action)}</td><td>${esc(l.detail)}</td></tr>`).join("")}</tbody></table>` : '<div class="empty">هنوز فعالیتی ثبت نشده است.</div>'}</div>`;
}

/* ---------- تنظیمات سایت ---------- */
function settingsForm() {
  const S = getSettings();
  return `<div class="panel"><h2>اطلاعات تماس و کیف پول</h2><form id="setForm" class="mf" style="padding:0" novalidate>
    <div class="g2"><label>شماره تلفن پشتیبانی<input name="supportPhone" value="${esc(S.supportPhone)}" dir="ltr" style="text-align:right"></label><label>ایمیل<input name="supportEmail" value="${esc(S.supportEmail)}" dir="ltr" style="text-align:right"></label></div>
    <div class="g2"><label>ساعت پاسخگویی<input name="supportHours" value="${esc(S.supportHours)}"></label><label>آدرس<input name="address" value="${esc(S.address)}"></label></div>
    <div class="g2"><label>شماره کارت دریافت شارژ<input name="cardNumber" value="${esc(S.cardNumber)}" inputmode="numeric" dir="ltr" style="text-align:right" placeholder="۱۶ رقم"></label><label>نام صاحب کارت<input name="cardHolder" value="${esc(S.cardHolder)}"></label></div>
    <div class="g2"><label>حداقل مبلغ شارژ (تومان)<input name="minCharge" value="${S.minCharge}" inputmode="numeric"></label><label>حداکثر مبلغ شارژ (تومان)<input name="maxCharge" value="${S.maxCharge}" inputmode="numeric"></label></div>
    <div class="note">اتصال درگاه: آدرس بازگشت (callback) را در پنل درگاه خود ثبت کنید: <b dir="ltr" style="user-select:all">${esc(new URL("payment-result.html", location.href).href)}</b><br>در آدرس درگاه می‌توانید از {paymentId} ‏{amount} ‏{callback} ‏{phone} استفاده کنید. برای تست مسیر می‌توانید <b dir="ltr">gateway-demo.html?paymentId={paymentId}&amp;amount={amount}&amp;callback={callback}</b> را بگذارید.</div>
    <div class="g2"><label>تأیید خودکار تحویل پس از چند روز از ارسال (۰ = خاموش)<input name="autoConfirmDays" value="${S.autoConfirmDays}" inputmode="numeric"></label><label>مهلت مرجوعی پس از تحویل (روز؛ ۰ = پرداخت فوری به فروشنده)<input name="returnDays" value="${S.returnDays}" inputmode="numeric"></label></div>
    <label>پاسخ‌دهی فروشنده به مرجوعی و تأیید دریافت کالا (روز؛ پس از آن خودکار تأیید می‌شود)<input name="returnAutoDays" value="${S.returnAutoDays}" inputmode="numeric" style="max-width:200px"></label>
    <div class="g2"><label>کارمزد فروش پلتفرم (٪)<input name="commissionRate" value="${S.commissionRate}" inputmode="decimal"></label><label>کارمزد برداشت فروشنده (٪)<input name="withdrawFeeRate" value="${S.withdrawFeeRate}" inputmode="decimal"></label></div>
    <div class="g2"><label>حداقل کارمزد برداشت (تومان)<input name="withdrawMinFee" value="${S.withdrawMinFee}" inputmode="numeric"></label><label>حداقل مبلغ برداشت (تومان)<input name="minWithdraw" value="${S.minWithdraw}" inputmode="numeric"></label></div>
    <label class="chk"><input type="checkbox" name="gatewayEnabled" ${S.gatewayEnabled ? "checked" : ""}> پرداخت آنلاین (درگاه) فعال باشد</label>
    <div class="g2"><label>نام درگاه (نمایش به کاربر)<input name="gatewayName" value="${esc(S.gatewayName)}"></label><label>آدرس درگاه (شروع پرداخت)<input name="gatewayUrl" value="${esc(S.gatewayUrl)}" dir="ltr" style="text-align:right" placeholder="https://example.com/pay/start?paymentId={paymentId}&amp;amount={amount}"></label></div>
    <label>آدرس تأیید پرداخت در سرور شما (اختیاری ولی توصیه‌شده)<input name="verifyUrl" value="${esc(S.verifyUrl)}" dir="ltr" style="text-align:right" placeholder="https://example.com/api/verify  ← پاسخ: {&quot;ok&quot;:true}"></label>
    <label class="chk"><input type="checkbox" name="testMode" ${S.testMode ? "checked" : ""}> حالت آزمایشی: شارژ کیف پول بدون پرداخت واقعی و فوری انجام شود (فقط برای تست)</label>
    <p class="err" id="setErr" role="alert"></p><div><button class="btn primary" type="submit">ذخیره تنظیمات</button></div></form></div>`;
}

/* ---------- رویدادها ---------- */
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-a]");
  if (!b || b.tagName === "SELECT") return;
  const a = b.dataset.a, id = b.dataset.id;
  if (a === "ublock") { const U = users(); U[id].blocked = !U[id].blocked; auditLog(U[id].blocked ? "مسدودسازی کاربر" : "رفع مسدودی کاربر", U[id].name); write(K.users, U); paintUsers(); toast(U[id].blocked ? "کاربر مسدود شد." : "مسدودی برداشته شد."); }
  else if (a === "udel") {
    if (!await ask("حساب این کاربر، عکس و نظرهایش حذف می‌شود. سفارش‌های ثبت‌شده برای سوابق باقی می‌مانند.")) return;
    const U = users(), A = avatars(), R = reviews();
    auditLog("حذف کاربر", U[id].name); delete U[id]; delete A[id];
    Object.keys(R).forEach(p => (R[p] = R[p].filter(r => r.user !== id)));
    write(K.users, U); write(K.avatars, A); write(K.reviews, R); paintUsers(); toast("کاربر حذف شد.");
  }
  else if (a === "oview") {
    const o = orders().find(x => x.code === id);
    openModal(`<div class="mf"><h2>سفارش ${toFaDigits(o.code)}</h2><dl class="kv"><dt>تاریخ</dt><dd>${fmtDT(o.date)}</dd><dt>وضعیت</dt><dd>${STATUS[o.status || "pending"]}</dd><dt>گیرنده</dt><dd>${esc(o.ship.name)} — <span dir="ltr">${toFaDigits(o.ship.phone)}</span></dd><dt>آدرس</dt><dd>${esc(o.ship.city)}، ${esc(o.ship.address)}</dd><dt>کد پستی</dt><dd>${o.ship.zip ? toFaDigits(o.ship.zip) : "—"}</dd><dt>پرداخت</dt><dd>${o.pay === "wallet" ? "از کیف پول (پرداخت‌شده)" : "پرداخت در محل"}</dd></dl>
      <div class="panel" style="margin:0"><h2 style="font-size:1rem">وضعیت و پول هر فروشگاه</h2>${Object.entries(ensureSubs(o).subs).map(([sid, sb]) => `<div class="msg ${sb.dispute && sb.dispute.status === "open" ? "user" : ""}" style="margin-bottom:8px"><b>${esc(storeName(sid))}</b> — ${ORDER_ST[sb.status || "pending"]} — ${fa(sb.total)} تومان${sb.commission != null ? ` (کارمزد ${fa(sb.commission)})` : ""}${sb.held ? " — در امانت" : ""}${sb.auto ? " — تأیید خودکار" : ""}${sb.tracking ? ` — ${esc(sb.tracking.carrier)}، کد رهگیری <b dir="ltr">${esc(toFaDigits(sb.tracking.code))}</b>` : ""}${sb.dispute ? `<p>اختلاف (${sb.dispute.status === "open" ? "باز" : "حل‌شده"}): ${esc(sb.dispute.reason)}</p>` : ""}${sb.ret ? `<p><b>مرجوعی: ${RET_ST[sb.ret.status]}</b> — ${esc(sb.ret.reason)}${sb.ret.tracking ? ` — ${esc(sb.ret.tracking.carrier)}، کد رهگیری <b dir="ltr">${esc(toFaDigits(sb.ret.tracking.code))}</b>` : ""}${sb.ret.rejectReason ? ` — دلیل رد فروشنده: ${esc(sb.ret.rejectReason)}` : ""}</p>${["requested", "escalated"].includes(sb.ret.status) ? `<div class="acts"><button class="btn sm" data-x="retok" data-code="${o.code}" data-id="${sid}">تأیید مرجوعی</button><button class="btn sm danger" data-x="retno" data-code="${o.code}" data-id="${sid}">رد مرجوعی</button></div>` : ""}${["approved", "shipped_back", "escalated", "requested"].includes(sb.ret.status) ? `<div class="acts"><button class="btn sm primary" data-x="retrecv" data-code="${o.code}" data-id="${sid}">بازگشت وجه به مشتری (دریافت مرجوعی)</button></div>` : ""}` : ""}${sb.settleAt && !sb.settled ? `<p><small>پایان مهلت مرجوعی: ${fmtDT(sb.settleAt)}</small></p>` : ""}${(!["delivered", "canceled", "returned"].includes(sb.status || "pending") || (sb.status === "delivered" && !sb.settled && !sb.refunded)) ? `<div class="acts"><button class="btn sm primary" data-x="subdel" data-code="${o.code}" data-id="${sid}">تحویل‌شده (آزادسازی پول به فروشنده)</button><button class="btn sm danger" data-x="subcan" data-code="${o.code}" data-id="${sid}">لغو و بازگشت وجه به مشتری</button></div>` : ""}</div>`).join("")}</div>
      <div class="tw"><table style="min-width:0"><thead><tr><th>کالا</th><th>تعداد</th><th>مبلغ</th></tr></thead><tbody>${o.items.map(i => `<tr><td>${esc(i.name)}</td><td>${fa(i.q)}</td><td>${fa(i.price * i.q)}</td></tr>`).join("")}</tbody></table></div>
      <b>جمع کل: ${fa(o.total)} تومان</b><div class="mfoot"><button class="btn" data-close>بستن</button></div></div>`);
  }
  else if (a === "odel") { if (!await ask("این سفارش برای همیشه حذف می‌شود.")) return; auditLog("حذف سفارش", toFaDigits(id)); write(K.orders, orders().filter(o => o.code !== id)); paintOrders(); toast("سفارش حذف شد."); }
  else if (a === "sedit") storeForm(id);
  else if (a === "sdel") {
    const n = products.filter(p => p.shopId === id).length;
    if (!await ask(`فروشگاه «${esc(storeName(id))}» و ${fa(n)} محصول آن حذف می‌شود.`)) return;
    const R = reviews();
    products.filter(p => p.shopId === id).forEach(p => delete R[p.id]);
    for (let i = products.length - 1; i >= 0; i--) if (products[i].shopId === id) products.splice(i, 1);
    auditLog("حذف فروشگاه", storeName(id)); stores.splice(stores.findIndex(s => s.id === id), 1);
    saveCatalog(); write(K.reviews, R); rerender(); toast("فروشگاه حذف شد.");
  }
  else if (a === "pedit") { if (!catStores().length) return toast("ابتدا یک فروشگاه بسازید."); productForm(id); }
  else if (a === "pdel") {
    if (!await ask(`محصول «${esc(prodName(id))}» و نظرهای آن حذف می‌شود.`)) return;
    auditLog("حذف محصول", prodName(id)); products.splice(products.findIndex(p => p.id === id), 1);
    const R = reviews(); delete R[id];
    saveCatalog(); write(K.reviews, R); rerender(); toast("محصول حذف شد.");
  }
  else if (a === "rdel") {
    if (!await ask("این نظر حذف شود؟")) return;
    auditLog("حذف نظر", prodName(id)); const R = reviews(); R[id] = (R[id] || []).filter(r => r.user !== b.dataset.u);
    write(K.reviews, R); rerender(); toast("نظر حذف شد.");
  }
  else if (a === "rmimg") {
    if (id === "logo" || id === "cover") { tmp[id] = ""; paintStoreImgs(); } else { tmp.images.splice(+id, 1); paintProdImgs(); }
  }
  else if (a === "export") {
    const dump = {};
    Object.keys(localStorage).filter(k => k.startsWith("shahrak_") && k !== K.session).forEach(k => (dump[k] = localStorage.getItem(k)));
    const l = document.createElement("a");
    l.href = URL.createObjectURL(new Blob([JSON.stringify(dump)], { type: "application/json" }));
    l.download = "shahrak-backup-" + new Date().toISOString().slice(0, 10) + ".json"; l.click();
  }
  else if (a === "resetcat") { if (!await ask("همه‌ی تغییرات فروشگاه‌ها و محصولات برمی‌گردد و موارد افزوده‌شده حذف می‌شوند.")) return; localStorage.removeItem(K.catalog); location.reload(); }
  else if (a === "wipe") {
    if (!await ask("همه‌ی کاربران، سفارش‌ها، نظرها و عکس‌های پروفایل پاک می‌شوند. این کار قابل بازگشت نیست.")) return;
    [K.users, K.orders, K.reviews, K.avatars, K.cart, K.session].forEach(k => localStorage.removeItem(k)); rerender(); toast("پاک شد.");
  }
});
document.addEventListener("input", e => { if (e.target.id === "uq") { uq = e.target.value.trim(); paintUsers(); } });
document.addEventListener("change", async e => {
  const t = e.target;
  if (t.id === "of") { of = t.value; return paintOrders(); }
  if (t.dataset.a === "ostat") {
    const code = t.dataset.id;
    orderSetStatus(code, t.value);
    auditLog("تغییر وضعیت سفارش", `${toFaDigits(code)} → ${STATUS[t.value]}`);
    paintOrders(); return toast("وضعیت به‌روز شد (پول مشتری/فروشنده طبق وضعیت تسویه شد).");
  }
  const kind = t.dataset.img;
  if (!kind) return;
  const err = $("mErr");
  try {
    if (kind === "import") {
      const f = t.files[0]; if (!f) return;
      const d = JSON.parse(await f.text());
      if (!await ask("داده‌های فعلی با فایل پشتیبان جایگزین می‌شوند.", "بازگردانی")) return;
      Object.entries(d).forEach(([k, v]) => k.startsWith("shahrak_") && k !== K.admin && localStorage.setItem(k, v));
      return location.reload();
    }
    for (const f of [...t.files]) {
      if (!f.type.startsWith("image/")) { err.textContent = "فقط فایل تصویر قابل قبول است."; continue; }
      if (kind === "prod") { tmp.images.push(await imgToData(f, 800)); paintProdImgs(); }
      else { tmp[kind] = await imgToData(f, kind === "logo" ? 256 : 1200); paintStoreImgs(); }
    }
    err.textContent = "";
  } catch { (err || { }).textContent = "این فایل خوانده نشد."; toast("خواندن فایل ناموفق بود."); }
  t.value = "";
});
document.addEventListener("submit", async e => {
  const f = e.target; e.preventDefault();
  if (f.id === "pwForm") {
    const err = $("pwErr"), rec = read(K.admin, null);
    if ((await hash(f.a.value)) !== rec.h) return void (err.textContent = "رمز فعلی اشتباه است.");
    if (f.b.value.length < 8) return void (err.textContent = "رمز جدید باید حداقل ۸ کاراکتر باشد.");
    if (f.b.value !== f.c.value) return void (err.textContent = "رمز جدید و تکرار آن یکسان نیستند.");
    write(K.admin, { ...rec, h: await hash(f.b.value) }); f.reset(); err.textContent = ""; return toast("رمز تغییر کرد.");
  }
  const err = $("mErr");
  if (f.id === "sForm") {
    const id = f.dataset.id, name = f.name.value.trim(), cat = f.cat.value.trim(), rate = +toEn(f.rate.value || "0");
    if (!name || !cat) return void (err.textContent = "نام و دسته فروشگاه را وارد کنید.");
    if (!(rate >= 0 && rate <= 5)) return void (err.textContent = "امتیاز باید بین ۰ تا ۵ باشد.");
    const [c, t1, t2] = PALETTES[f.pal.value], phone = toFaDigits(f.phone.value.trim());
    const s = id ? stores.find(x => x.id === id) : { id: "s" + Date.now().toString(36), icon: "store" };
    Object.assign(s, { name, cat, area: f.area.value.trim(), address: f.address.value.trim(), phone, tel: "+98" + toEn(phone).replace(/\D/g, "").replace(/^0/, ""), hours: f.hours.value.trim(), desc: f.desc.value.trim(), rate, open: f.open.checked, c, t1, t2, logo: tmp.logo, cover: tmp.cover });
    if (!id) stores.push(s);
    if (!saveCatalog()) return;
  } else if (f.id === "pForm") {
    const id = f.dataset.id, name = f.name.value.trim(), price = +toEn(f.price.value).replace(/[^\d]/g, ""), old = +toEn(f.old.value).replace(/[^\d]/g, "");
    if (!name) return void (err.textContent = "نام محصول را وارد کنید.");
    if (products.some(p => p.name === name && p.id !== id)) return void (err.textContent = "محصولی با این نام وجود دارد.");
    if (!price) return void (err.textContent = "قیمت را (به عدد) وارد کنید.");
    if (old && old <= price) return void (err.textContent = "قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد.");
    if (!tmp.images.length) return void (err.textContent = "حداقل یک تصویر اضافه کنید.");
    const st = stores.find(x => x.id === f.shop.value);
    const details = {}; f.details.value.split("\n").forEach(l => { const i = l.indexOf(":"); if (i > 0) details[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
    const p = id ? products.find(x => x.id === id) : { id: "p" + Date.now().toString(36), rate: 0, cnt: 0 };
    Object.assign(p, { name, shopId: st.id, price, desc: f.desc.value.trim(), specs: f.specs.value.split("\n").map(x => x.trim()).filter(Boolean), details, images: [...tmp.images], icon: st.icon || "box", c: st.c, t1: st.t1, t2: st.t2 });
    if (old) p.old = old; else delete p.old;
    if (!id) products.push(p);
    if (!saveCatalog()) return;
  } else return;
  auditLog(f.id === "sForm" ? "ذخیره فروشگاه" : "ذخیره محصول", f.name.value.trim());
  modal.close(); rerender(); toast("ذخیره شد.");
});

/* ---------- فروشندگان ---------- */
function vSellers() {
  const S = Object.values(getSellers()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), W = read(K.wallets, {}), WD = read(WD_KEY, []), SP = read(SPROD_KEY, []);
  const tg = st => `<span class="tag ${st === "approved" ? "ok" : st === "pending" ? "" : "bad"}">${SELLER_ST[st]}</span>`;
  return `<h1>فروشندگان</h1><div class="panel"><h2>فروشگاه‌ها و درخواست‌ها</h2>${S.length ? `<div class="tw"><table><thead><tr><th>فروشگاه</th><th>مالک</th><th>وضعیت</th><th>محصولات</th><th>موجودی</th><th>کارمزد</th><th></th></tr></thead><tbody>${S.map(s => `<tr><td>${esc(s.name)}<br><small>${new Date(s.createdAt).toLocaleDateString("fa-IR")}</small></td><td>${esc(s.ownerName)}<br><small dir="ltr">${toFaDigits(s.owner)}</small></td><td>${tg(s.status)}${s.blocked ? ' <span class="tag bad">مسدود</span>' : ""}</td><td>${fa(SP.filter(p => p.shopId === s.id).length)}</td><td>${fa((W["store:" + s.id] || { balance: 0 }).balance)}</td><td>${fa(commissionOf(s.id))}٪${s.commission != null ? " (اختصاصی)" : ""}</td><td><button class="btn sm" data-x="sview" data-id="${s.id}">بررسی</button></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">هنوز درخواستی ثبت نشده است.</div>'}</div>
  <div class="panel"><h2>درخواست‌های برداشت</h2>${WD.length ? `<div class="tw"><table><thead><tr><th>فروشگاه</th><th>مبلغ</th><th>کارمزد</th><th>واریزی</th><th>شبا</th><th>تاریخ</th><th>وضعیت</th><th></th></tr></thead><tbody>${[...WD].reverse().map(w => `<tr><td>${esc((getSellers()[w.storeId] || { name: "(حذف‌شده)" }).name)}</td><td>${fa(w.amount)}</td><td>${fa(w.fee)}</td><td><b>${fa(w.net)}</b></td><td dir="ltr" style="text-align:right">${esc(w.sheba)}<br><small>${esc(w.shebaName)}</small></td><td>${fmtDT(w.date)}</td><td><span class="tag ${w.status === "paid" ? "ok" : w.status === "rejected" ? "bad" : ""}">${WD_ST[w.status]}</span>${w.ref ? `<br><small>${esc(toFaDigits(w.ref))}</small>` : ""}</td><td>${w.status === "pending" ? `<div class="acts"><button class="btn sm primary" data-x="wdpay" data-id="${w.id}">واریز شد</button><button class="btn sm danger" data-x="wdno" data-id="${w.id}">رد و بازگشت</button></div>` : ""}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">درخواستی نیست.</div>'}</div>`;
}
function sellerModal(id) {
  const s = getSellers()[id], k = read(KYC_KEY, {})[id] || {}, d = k.docs || {};
  openModal(`<div class="mf"><h2>${esc(s.name)} <span class="tag ${s.status === "approved" ? "ok" : s.status === "pending" ? "" : "bad"}">${SELLER_ST[s.status]}</span></h2>
    <dl class="kv"><dt>دسته</dt><dd>${esc(s.cat)}</dd><dt>آدرس</dt><dd>${esc(s.address)} — ${esc(s.phone)}</dd><dt>صاحب</dt><dd>${esc(k.fullname || s.ownerName)} — <span dir="ltr">${toFaDigits(s.owner)}</span></dd><dt>کد ملی</dt><dd dir="ltr" style="text-align:right">${toFaDigits(k.nid || "—")}</dd><dt>نوع</dt><dd>${k.type === "legal" ? "حقوقی — شناسه ملی " + toFaDigits(k.companyId || "") : "حقیقی"}</dd><dt>شبا</dt><dd dir="ltr" style="text-align:right">${esc(k.sheba || "—")}</dd><dt>صاحب حساب</dt><dd>${esc(k.shebaName || "—")}</dd></dl>
    <div class="imgs" style="gap:12px">${[["idCard", "کارت ملی"], ["selfie", "سلفی"], ["license", "مجوز"]].map(([n, l]) => d[n] ? `<figure style="margin:0;text-align:center"><img src="${d[n]}" alt="${l}" style="width:190px;max-height:170px;object-fit:contain;border:1px solid var(--line);border-radius:12px;background:#fff"><figcaption><small>${l}</small></figcaption></figure>` : `<small>${l}: ندارد</small>`).join("")}</div>
    ${s.rejectReason ? `<p class="note">دلیل قبلی: ${esc(s.rejectReason)}</p>` : ""}
    <label>دلیل (برای رد یا تعلیق الزامی)<textarea id="sReason" rows="2"></textarea></label>
    ${OWNER ? `<label>کارمزد اختصاصی این فروشگاه (٪) — خالی = نرخ پیش‌فرض<input id="sComm" value="${s.commission ?? ""}" inputmode="decimal" style="max-width:160px"></label>` : ""}
    <p class="err" id="mErr" role="alert"></p>
    <div class="mfoot" style="flex-wrap:wrap">${s.status !== "approved" ? `<button class="btn primary" data-x="sapprove" data-id="${id}">تأیید فروشگاه</button>` : `<button class="btn danger" data-x="ssusp" data-id="${id}">تعلیق</button>`}${s.status === "pending" || s.status === "suspended" ? `<button class="btn danger" data-x="sreject" data-id="${id}">رد درخواست</button>` : ""}${OWNER ? `<button class="btn" data-x="scomm" data-id="${id}">ذخیره کارمزد</button>` : ""}${s.status === "approved" ? (s.blocked ? `<button class="btn" data-x="sunblock" data-id="${id}">رفع مسدودی فروشگاه</button>` : `<button class="btn danger" data-x="sblock" data-id="${id}">مسدود کردن فروشگاه</button>`) : ""}<button class="btn" data-close>بستن</button></div></div>`);
}

/* ---------- رویدادهای کیف پول، پشتیبانی، گزارش ---------- */
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-w]");
  if (!b) return;
  const w = b.dataset.w, id = b.dataset.id;
  if (w === "wmodal") walletModal(id);
  else if (w === "topok" || w === "topno") {
    const T = read(K.topups, []), t = T.find(x => x.id === id);
    if (w === "topok") {
      if (!await ask(`مبلغ ${fa(t.amount)} تومان به کیف پول ${esc(t.name)} اضافه شود؟`, "تأیید و شارژ")) return;
      if (!walletApply(t.user, t.amount, "charge", "شارژ تأییدشده (پیگیری " + toFaDigits(t.ref) + ")", "admin", t.ref)) return toast("ثبت تراکنش انجام نشد.");
      t.status = "approved"; auditLog("تأیید درخواست شارژ", `${t.name} — ${fa(t.amount)}`);
    } else { if (!await ask("این درخواست شارژ رد شود؟", "رد کن")) return; t.status = "rejected"; auditLog("رد درخواست شارژ", `${t.name} — ${fa(t.amount)}`); }
    write(K.topups, T); rerender();
  }
  else if (w === "payok" || w === "payno") {
    const P = read(K.payments, []), p = P.find(x => x.id === id);
    if (w === "payok") {
      if (!await ask(`مبلغ ${fa(p.amount)} تومان به کیف پول ${esc(p.name)} اضافه شود؟ (فقط پس از بررسی واریز واقعی)`, "تأیید و شارژ")) return;
      if (!walletApply(p.user, p.amount, "charge", "شارژ دستی پرداخت درگاه (" + p.id + ")", "admin", p.id)) return toast("ثبت تراکنش انجام نشد.");
      p.credited = true; p.status = "paid"; auditLog("تأیید دستی پرداخت درگاه", `${p.name} — ${fa(p.amount)} — ${p.id}`);
    } else { if (!await ask("این پرداخت ناموفق علامت بخورد؟", "بله")) return; p.status = "failed"; auditLog("رد پرداخت درگاه", `${p.name} — ${p.id}`); }
    write(K.payments, P); rerender();
  }
  else if (w === "tview") ticketModal(id);
  else if (w === "tcredit") {
    const T = read(K.tickets, []), t = T.find(x => x.id === id), amt = +toEn($("crAmt").value).replace(/\D/g, "");
    if (!amt) return toast("مبلغ را وارد کنید.");
    if (!await ask(`مبلغ ${fa(amt)} تومان به کیف پول ${esc(t.name)} اضافه می‌شود. (فقط وقتی تأیید کنید که واریز واقعی را بررسی کرده‌اید.)`, "شارژ کن")) return;
    if (!walletApply(t.user, amt, "charge", "جبران شارژ ناموفق (درخواست " + toFaDigits(t.id) + ")", "admin", t.ref)) return toast("ثبت تراکنش انجام نشد.");
    t.credited = amt; t.status = "resolved";
    t.replies.push(actorReply(`مبلغ ${fa(amt)} تومان به کیف پول شما اضافه شد. از صبوری شما سپاسگزاریم.`));
    write(K.tickets, T); auditLog("جبران شارژ از تیکت", `${t.name} — ${fa(amt)} — ${toFaDigits(t.id)}`);
    modal.close(); rerender(); toast("کیف پول کاربر شارژ و درخواست حل شد.");
  }
  else if (w === "csv") {
    const d = new Date().toISOString().slice(0, 10);
    if (id === "orders") csv([["کد", "تاریخ", "مشتری", "موبایل", "شهر", "آدرس", "کد پستی", "مبلغ", "وضعیت", "پرداخت"], ...orders().map(o => [o.code, o.date, o.ship.name, o.ship.phone, o.ship.city, o.ship.address, o.ship.zip, o.total, STATUS[o.status || "pending"], o.pay === "wallet" ? "کیف پول" : "درب منزل"])], "orders-" + d);
    if (id === "users") csv([["نام", "موبایل", "تاریخ عضویت", "وضعیت", "موجودی کیف پول"], ...Object.entries(users()).map(([p, u]) => [u.name, p, u.joined || "", u.blocked ? "مسدود" : "فعال", walletOf(p).balance])], "users-" + d);
    if (id === "tx") csv([["تاریخ", "کاربر", "موبایل", "نوع", "مبلغ", "مانده", "توضیح"], ...Object.entries(read(K.wallets, {})).flatMap(([p, wl]) => wl.tx.map(t => [t.date, userName(p), p, WL[t.type] || t.type, t.amount, t.balance, t.note]))], "wallet-" + d);
  }
});
document.addEventListener("change", e => {
  if (e.target.id === "tf") { tf = e.target.value; rerender(); }
  if (e.target.id === "rng") { rng = +e.target.value; rerender(); }
});
document.addEventListener("submit", async e => {
  const f = e.target;
  if (f.id === "wForm") {
    e.preventDefault();
    const amt = +toEn(f.amount.value).replace(/\D/g, ""), reason = f.reason.value.trim(), err = $("mErr"), ph = f.dataset.ph;
    if (!amt) return void (err.textContent = "مبلغ را وارد کنید.");
    if (reason.length < 3) return void (err.textContent = "دلیل را بنویسید.");
    const sub = f.op.value === "sub";
    if (!walletApply(ph, sub ? -amt : amt, "adjust", reason, "admin")) return void (err.textContent = "ثبت نشد؛ موجودی کافی نیست یا حافظه پر است.");
    auditLog(sub ? "کاهش موجودی کیف پول" : "افزایش موجودی کیف پول", `${userName(ph)} — ${fa(amt)} — ${reason}`);
    modal.close(); rerender(); toast("موجودی به‌روز شد.");
  } else if (f.id === "tForm") {
    e.preventDefault();
    const T = read(K.tickets, []), t = T.find(x => x.id === f.dataset.id), txt = f.text.value.trim();
    if (txt) t.replies.push(actorReply(txt));
    t.status = f.st.value; write(K.tickets, T);
    auditLog("پاسخ/تغییر وضعیت درخواست", `${toFaDigits(t.id)} → ${T_ST[t.status]}`);
    modal.close(); rerender(); toast("ثبت شد.");
  } else if (f.id === "setForm") {
    e.preventDefault();
    const err = $("setErr"), num = v => +toEn(v).replace(/\D/g, ""), clean = v => v.replace(/[,،٬]/g, "").trim();   // ویرگول در شماره‌ها حذف می‌شود
    const S = { supportPhone: clean(f.supportPhone.value), supportEmail: f.supportEmail.value.trim(), supportHours: f.supportHours.value.trim(), address: f.address.value.trim(), cardNumber: toEn(f.cardNumber.value).replace(/\D/g, ""), cardHolder: f.cardHolder.value.trim(), minCharge: num(f.minCharge.value), maxCharge: num(f.maxCharge.value), testMode: f.testMode.checked, autoConfirmDays: num(f.autoConfirmDays.value), returnDays: num(f.returnDays.value), returnAutoDays: num(f.returnAutoDays.value), commissionRate: +toEn(f.commissionRate.value) || 0, withdrawFeeRate: +toEn(f.withdrawFeeRate.value) || 0, withdrawMinFee: num(f.withdrawMinFee.value), minWithdraw: num(f.minWithdraw.value), gatewayEnabled: f.gatewayEnabled.checked, gatewayName: f.gatewayName.value.trim() || "درگاه پرداخت", gatewayUrl: f.gatewayUrl.value.trim(), verifyUrl: f.verifyUrl.value.trim() };
    if (!/^[\d۰-۹+\-\s]{6,20}$/.test(S.supportPhone)) return void (err.textContent = "شماره تلفن معتبر نیست (فقط عدد و خط تیره).");
    if (S.commissionRate < 0 || S.commissionRate > 50 || S.withdrawFeeRate < 0 || S.withdrawFeeRate > 20) return void (err.textContent = "درصد کارمزد معتبر نیست (فروش حداکثر ۵۰٪ و برداشت حداکثر ۲۰٪).");
    if (S.returnDays > 60 || S.returnAutoDays > 30) return void (err.textContent = "مهلت مرجوعی حداکثر ۶۰ روز و پاسخ‌دهی حداکثر ۳۰ روز.");
    if (S.autoConfirmDays > 60) return void (err.textContent = "تأیید خودکار حداکثر ۶۰ روز.");
    if (!S.minWithdraw) return void (err.textContent = "حداقل مبلغ برداشت را وارد کنید.");
    if (S.gatewayUrl && !/^(https?:\/\/\S+|[\w./-]+\.html(\?\S*)?)$/.test(S.gatewayUrl)) return void (err.textContent = "آدرس درگاه باید با https:// یا http:// شروع شود.");
    if (S.verifyUrl && !/^(https?:\/\/\S+|\/\S*)$/.test(S.verifyUrl)) return void (err.textContent = "آدرس تأیید باید با https:// یا / شروع شود.");
    if (S.gatewayEnabled && !S.gatewayUrl) return void (err.textContent = "برای فعال‌سازی درگاه، آدرس درگاه را وارد کنید.");
    if (S.cardNumber && S.cardNumber.length !== 16) return void (err.textContent = "شماره کارت باید ۱۶ رقم باشد.");
    if (!S.minCharge || S.maxCharge < S.minCharge) return void (err.textContent = "حداقل و حداکثر شارژ درست نیست.");
    if (write(K.settings, S)) { auditLog("ذخیره تنظیمات", S.testMode ? "حالت آزمایشی روشن" : ""); toast("تنظیمات ذخیره شد."); }
  }
});

/* ---------- داده‌ی آزمایشی ---------- */
const DEMO = { seller: "09100000001", buyer: "09100000002", store: "sdemo" };
async function siteHash(p) {
  if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("shahrak:" + p)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  return "plain:" + p;
}
async function seedDemo() {
  const now = new Date().toISOString(), h = await siteHash("test1234"), U = users(), th = themeFrom("#0f766e");
  U[DEMO.seller] = { name: "فروشنده آزمایشی", h, joined: now, demo: true };
  U[DEMO.buyer] = { name: "مشتری آزمایشی", h, joined: now, demo: true };
  const S = getSellers();
  S[DEMO.store] = { id: DEMO.store, owner: DEMO.seller, ownerName: "فروشنده آزمایشی", name: "فروشگاه تستی شهرک", cat: "لوازم دیجیتال", area: "مرکز شهر", address: "بهشهر، خیابان امام، پلاک ۱۲", phone: "۰۱۱-۳۵۲۴۱۲۳۴", tel: "+981135241234", hours: "هر روز ۹ تا ۲۱", desc: "فروشگاه آزمایشی برای تست پنل فروشنده.", rate: 0, open: true, icon: "store", logo: "", cover: "", theme: { radius: "lg", banner: "تخفیف ویژه‌ی تستی ۲۰٪" }, ...th, status: "approved", rejectReason: "", createdAt: now, approvedAt: now, demo: true };
  const K2 = read(KYC_KEY, {}), fake = t => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250"><rect width="400" height="250" fill="#eef2f8"/><text x="200" y="135" font-size="26" text-anchor="middle" fill="#64748b">${t}</text></svg>`);
  K2[DEMO.store] = { fullname: "فروشنده آزمایشی", nid: "1234567891", type: "real", companyId: "", sheba: "IR000000000000000000000000", shebaName: "فروشنده آزمایشی", docs: { idCard: fake("TEST ID"), selfie: fake("TEST SELFIE") }, submittedAt: now };
  const mk = (id, name, base, disc, stock, img, desc) => ({ id, shopId: DEMO.store, name, base, discount: disc, price: Math.round(base * (100 - disc) / 100), ...(disc ? { old: base } : {}), stock, desc, specs: ["گارانتی آزمایشی", "ارسال سریع"], details: { برند: "آزمایشی", گارانتی: "۱۲ ماه" }, images: [img], icon: "box", rate: 0, cnt: 0, ...th });
  const P = read(SPROD_KEY, []).filter(p => p.shopId !== DEMO.store);
  P.push(mk("spdemo1", "هدفون آزمایشی", 1200000, 20, 10, "assets/products/p3-1.svg", "هدفون نمونه برای تست."), mk("spdemo2", "پاوربانک آزمایشی", 900000, 0, 25, "assets/products/p5-1.svg", "پاوربانک نمونه برای تست."), mk("spdemo3", "ساعت هوشمند آزمایشی", 2500000, 10, null, "assets/products/p4-1.svg", "ساعت نمونه برای تست."));
  const Wl = read(K.wallets, {});
  if (!Wl[DEMO.buyer]) Wl[DEMO.buyer] = { balance: 5000000, tx: [{ id: "tdemo", type: "charge", amount: 5000000, balance: 5000000, note: "اعتبار آزمایشی", by: "admin", ref: "", date: now }] };
  return write(K.users, U) && write(SELLERS_KEY, S) && write(KYC_KEY, K2) && write(SPROD_KEY, P) && write(K.wallets, Wl);
}
function unseedDemo() {
  const U = users(), S = getSellers(), Wl = read(K.wallets, {});
  [DEMO.seller, DEMO.buyer].forEach(p => { delete U[p]; delete Wl[p]; });
  delete S[DEMO.store]; delete Wl["store:" + DEMO.store];
  const K2 = read(KYC_KEY, {}); delete K2[DEMO.store];
  write(K.users, U); write(SELLERS_KEY, S); write(KYC_KEY, K2); write(SPROD_KEY, read(SPROD_KEY, []).filter(p => p.shopId !== DEMO.store)); write(K.wallets, Wl);
}

/* ---------- رویدادهای فروشندگان ---------- */
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-x]");
  if (!b) return;
  const x = b.dataset.x, id = b.dataset.id, S = getSellers();
  const reason = () => ($("sReason") ? $("sReason").value.trim() : "");
  const done = msg => { write(SELLERS_KEY, S); modal.close(); rerender(); toast(msg); };
  if (x === "retok") { orderReturnDecide(b.dataset.code, id, "approve"); auditLog("تأیید مرجوعی", `${toFaDigits(b.dataset.code)} — ${storeName(id)}`); modal.close(); rerender(); toast("مرجوعی تأیید شد."); }
  else if (x === "retno") { const v = await UI.form({ title: "رد مرجوعی", tone: "red", icon: "ban", danger: true, ok: "رد مرجوعی", fields: [{ name: "why", label: "دلیل رد", type: "textarea", min: 5 }] }); if (!v) return; orderReturnDecide(b.dataset.code, id, "reject", v.why); auditLog("رد مرجوعی", `${toFaDigits(b.dataset.code)} — ${v.why}`); modal.close(); rerender(); toast("مرجوعی رد شد."); }
  else if (x === "retrecv") { if (!await ask("مبلغ به کیف پول مشتری برمی‌گردد و از امانت فروشنده خارج می‌شود.", "بازگشت وجه")) return; const ok = orderReturnReceive(b.dataset.code, id); auditLog("بازگشت وجه مرجوعی", `${toFaDigits(b.dataset.code)} — ${storeName(id)}`); modal.close(); rerender(); toast(ok ? "مبلغ به مشتری برگشت." : "انجام نشد."); }
  else if (x === "subdel" || x === "subcan") {
    if (!await ask(x === "subdel" ? "پول این فروشگاه (منهای کارمزد) آزاد و به کیف پول فروشنده منتقل می‌شود." : "سفارش این فروشگاه لغو و مبلغ به کیف پول مشتری برمی‌گردد.", x === "subdel" ? "آزادسازی" : "لغو و بازگشت")) return;
    orderSetSub(b.dataset.code, id, x === "subdel" ? "delivered" : "canceled", true);
    auditLog(x === "subdel" ? "آزادسازی پول سفارش" : "لغو سفارش و بازگشت وجه", `${toFaDigits(b.dataset.code)} — ${storeName(id)}`);
    modal.close(); rerender(); toast("انجام شد.");
  }
  else if (x === "seed") { if (await seedDemo()) { auditLog("ساخت داده‌ی آزمایشی"); toast("ساخته شد: فروشنده 09100000001 و مشتری 09100000002 — رمز test1234"); UI.alert("فروشنده: ۰۹۱۰۰۰۰۰۰۰۱\nمشتری: ۰۹۱۰۰۰۰۰۰۰۲\nرمز هر دو: test1234\n\nمشتری ۵ میلیون تومان اعتبار دارد. با فروشنده وارد پنل فروشگاه شوید یا با مشتری از فروشگاه تستی بخرید.", { title: "داده‌ی آزمایشی ساخته شد", tone: "green" }); } }
  else if (x === "unseed") { if (!await ask("کاربران، فروشگاه و محصولات تستی حذف می‌شوند.", "حذف کن")) return; unseedDemo(); auditLog("حذف داده‌ی آزمایشی"); rerender(); toast("حذف شد."); }
  else if (x === "sview") sellerModal(id);
  else if (x === "sapprove") { S[id].status = "approved"; S[id].rejectReason = ""; S[id].approvedAt = new Date().toISOString(); auditLog("تأیید فروشگاه", S[id].name); done("فروشگاه تأیید شد و در سایت نمایش داده می‌شود."); }
  else if (x === "sreject" || x === "ssusp") {
    if (reason().length < 3) return void ($("mErr").textContent = "دلیل را بنویسید.");
    S[id].status = x === "sreject" ? "rejected" : "suspended"; S[id].rejectReason = reason();
    auditLog(x === "sreject" ? "رد فروشگاه" : "تعلیق فروشگاه", `${S[id].name} — ${reason()}`); done(x === "sreject" ? "درخواست رد شد." : "فروشگاه معلق شد.");
  }
  else if (x === "scomm") {
    const v = $("sComm").value.trim();
    if (v === "") delete S[id].commission; else { const n = +toEn(v); if (!(n >= 0 && n <= 50)) return void ($("mErr").textContent = "درصد بین ۰ تا ۵۰ باشد."); S[id].commission = n; }
    auditLog("تغییر کارمزد فروشگاه", `${S[id].name} → ${v === "" ? "پیش‌فرض" : v + "٪"}`); done("ذخیره شد.");
  }
  else if (x === "wdpay" || x === "wdno") {
    const WD = read(WD_KEY, []), w = WD.find(y => y.id === id);
    if (x === "wdpay") {
      const rv = await UI.form({ title: "ثبت واریز", message: "پس از واریز به حساب فروشنده، شماره پیگیری بانکی را (اختیاری) وارد کنید.", tone: "green", ok: "واریز شد", fields: [{ name: "ref", label: "شماره پیگیری", dir: "ltr" }] });
      if (!rv) return;
      const ref = rv.ref;
      w.status = "paid"; w.ref = toEn(ref).trim(); w.paidAt = new Date().toISOString(); auditLog("واریز برداشت فروشنده", `${(S[w.storeId] || {}).name} — ${fa(w.net)}`);
    } else {
      if (!await ask("درخواست رد می‌شود و کل مبلغ به کیف پول فروشگاه برمی‌گردد.", "رد و بازگشت")) return;
      if (!walletApply("store:" + w.storeId, w.amount, "withdraw_refund", "بازگشت برداشت ردشده", "admin", w.id)) return toast("ثبت نشد.");
      w.status = "rejected"; auditLog("رد برداشت فروشنده", `${(S[w.storeId] || {}).name} — ${fa(w.amount)}`);
    }
    write(WD_KEY, WD); rerender();
  }
});

/* ---------- رویدادهای ادمین‌ها و مسدودی ---------- */
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-x]");
  if (!b) return;
  const x = b.dataset.x, id = b.dataset.id;
  if (x === "stedit" && OWNER) staffForm(id);
  else if (x === "stdel" && OWNER) {
    const S = read(K.staff, {}), bal = walletOf("staff:" + id).balance;
    if (bal > 0) return toast("ابتدا موجودی کیف پول این ادمین را صفر کنید.");
    if (!await ask(`ادمین «${esc(S[id].name)}» حذف شود؟`)) return;
    auditLog("حذف ادمین", S[id].name); delete S[id]; write(K.staff, S); rerender();
  }
  else if ((x === "swpay" || x === "swno") && OWNER) {
    const L = read(SWD_KEY, []), w = L.find(y => y.id === id);
    if (x === "swpay") {
      const v = await UI.form({ title: "ثبت واریز به ادمین", message: "پس از واریز به حساب ادمین، شماره پیگیری بانکی را (اختیاری) وارد کنید.", tone: "green", ok: "واریز شد", fields: [{ name: "ref", label: "شماره پیگیری", dir: "ltr" }] });
      if (!v) return;
      w.status = "paid"; w.ref = v.ref; w.paidAt = new Date().toISOString(); auditLog("واریز برداشت ادمین", `${w.name} — ${fa(w.amount)}`);
    } else {
      if (!await ask("درخواست رد می‌شود و مبلغ به کیف پول ادمین برمی‌گردد.", "رد و بازگشت")) return;
      if (!walletApply("staff:" + w.staffId, w.amount, "withdraw_refund", "بازگشت برداشت ردشده", "admin", w.id)) return toast("ثبت نشد.");
      w.status = "rejected"; auditLog("رد برداشت ادمین", `${w.name} — ${fa(w.amount)}`);
    }
    write(SWD_KEY, L); rerender();
  }
  else if (x === "avdel" && !OWNER) { delete ME.avatar; saveStaff(ME); renderWho(); rerender(); }
  else if (x === "sblock" || x === "sunblock") {
    const S = getSellers(), why = $("sReason") ? $("sReason").value.trim() : "";
    if (x === "sblock") { if (why.length < 3) return void ($("mErr").textContent = "دلیل مسدودی را بنویسید."); S[id].blocked = true; S[id].blockReason = why; }
    else { S[id].blocked = false; S[id].blockReason = ""; }
    auditLog(x === "sblock" ? "مسدود کردن فروشگاه" : "رفع مسدودی فروشگاه", `${S[id].name}${why ? " — " + why : ""}`);
    write(SELLERS_KEY, S); modal.close(); rerender(); toast(x === "sblock" ? "فروشگاه مسدود شد؛ فروشنده نمی‌تواند آن را باز کند." : "مسدودی برداشته شد.");
  }
  else if (x === "cblock") {
    const s = stores.find(y => y.id === id && !y._seller);
    if (!s) return;
    if (!s.blocked) { const v = await UI.form({ title: "مسدود کردن فروشگاه", message: "فروشگاه مسدود دیگر سفارش نمی‌پذیرد و فقط ادمین می‌تواند آن را باز کند.", tone: "red", icon: "ban", danger: true, ok: "مسدود کن", fields: [{ name: "why", label: "دلیل", type: "textarea", min: 3 }] }); if (!v) return; s.blocked = true; s.blockReason = v.why; }
    else { s.blocked = false; s.blockReason = ""; }
    auditLog(s.blocked ? "مسدود کردن فروشگاه" : "رفع مسدودی فروشگاه", s.name); saveCatalog(); rerender();
  }
});
document.addEventListener("submit", async e => {
  const f = e.target;
  if (f.id === "stForm" && OWNER) {
    e.preventDefault();
    const err = $("mErr"), id = f.dataset.id, S = read(K.staff, {}), name = f.name.value.trim(), username = f.username.value.trim().toLowerCase(), pass = f.pass.value;
    if (name.length < 3) return void (err.textContent = "نام را وارد کنید.");
    const link = id ? S[id].userPhone || "" : f.elements["link"].value;
    if (!link) {
      if (!/^[a-z0-9_.-]{3,20}$/.test(username)) return void (err.textContent = "نام کاربری: ۳ تا ۲۰ حرف انگلیسی، عدد یا . _ -");
      if (Object.values(S).some(x => x.username === username && x.id !== id)) return void (err.textContent = "این نام کاربری قبلاً استفاده شده است.");
      if ((!id || pass) && pass.length < 8) return void (err.textContent = "رمز باید حداقل ۸ کاراکتر باشد.");
    }
    const st = id ? S[id] : { id: "st" + Date.now().toString(36), created: new Date().toISOString() };
    if (link) { st.userPhone = link; st.username = ""; delete st.h; }
    Object.assign(st, { name, ...(link ? {} : { username }), active: f.active.checked, perms: [...f.querySelectorAll("input[name=perm]:checked")].map(i => i.value) });
    if (pass && !link) st.h = await hash(pass);
    S[st.id] = st;
    if (!write(K.staff, S)) return;
    auditLog(id ? "ویرایش ادمین" : "افزودن ادمین", name); modal.close(); rerender(); toast("ذخیره شد.");
  } else if (f.id === "swForm" && !OWNER) {
    e.preventDefault();
    const err = $("swErr"), S2 = getSettings(), amt = +toEn(f.amount.value).replace(/\D/g, "");
    if (amt < S2.minWithdraw) return void (err.textContent = `حداقل مبلغ برداشت ${fa(S2.minWithdraw)} تومان است.`);
    if (amt > walletOf("staff:" + ME.id).balance) return void (err.textContent = "موجودی کافی نیست.");
    const wid = "sw" + Date.now().toString(36);
    if (!walletApply("staff:" + ME.id, -amt, "withdraw", "درخواست برداشت", "system", wid)) return void (err.textContent = "ثبت نشد.");
    write(SWD_KEY, [...read(SWD_KEY, []), { id: wid, staffId: ME.id, name: ME.name, amount: amt, sheba: ME.sheba, shebaName: ME.shebaName, date: new Date().toISOString(), status: "pending" }]);
    renderWho(); rerender(); toast("درخواست برداشت ثبت شد.");
  } else if (f.id === "spForm" && !OWNER) {
    e.preventDefault();
    const n = f.name.value.trim(), sh = f.sheba.value.trim().toUpperCase().replace(/\s/g, "");
    if (n.length < 3) return void ($("spErr").textContent = "نام را وارد کنید.");
    if (sh && !shebaOk(sh)) return void ($("spErr").textContent = "شماره شبا معتبر نیست (IR و ۲۴ رقم).");
    ME.sheba = sh; ME.shebaName = f.shebaName.value.trim(); ME.name = n; saveStaff(ME); AUDIT_ACTOR = "ادمین: " + n; renderWho(); toast("ذخیره شد.");
  } else if (f.id === "spwForm" && !OWNER) {
    e.preventDefault();
    const err = $("spwErr");
    if (ME.h !== await hash(f.a.value)) return void (err.textContent = "رمز فعلی اشتباه است.");
    if (f.b.value.length < 8) return void (err.textContent = "رمز جدید باید حداقل ۸ کاراکتر باشد.");
    if (f.b.value !== f.c.value) return void (err.textContent = "رمز جدید و تکرار آن یکسان نیستند.");
    ME.h = await hash(f.b.value); saveStaff(ME); f.reset(); err.textContent = ""; toast("رمز تغییر کرد.");
  }
});
document.addEventListener("change", async e => {
  if (e.target.name === "link" && $("stCred")) {
    const ph = e.target.value, u = read(K.users, {})[ph];
    $("stCred").hidden = !!ph;
    if (u && $("stForm") && !$("stForm").elements["name"].value) $("stForm").elements["name"].value = u.name;
  }
  if (e.target.dataset.img === "staffav" && !OWNER && e.target.files[0]) {
    try { ME.avatar = await imgToData(e.target.files[0], 256); saveStaff(ME); renderWho(); rerender(); } catch { toast("خواندن تصویر ناموفق بود."); }
  }
});

gate();
