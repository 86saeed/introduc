const products = [
  { id:"p1", images:["assets/products/p1-1.svg", "assets/products/p1-2.svg", "assets/products/p1-3.svg"], name:"گوشی سامسونگ Galaxy A55 ۲۵۶ گیگ", shopId:"digishahr", icon:"mobile-screen-button", c:"#087cff", t1:"#e7f1ff", t2:"#cfe3ff", price:21900000, rate:4.7, cnt:142,
    desc:"گوشی میان‌رده با نمایشگر روان و دوربین کم‌نویز، مناسب استفاده روزمره.", specs:["حافظه ۲۵۶ گیگابایت، رم ۸ گیگابایت","نمایشگر ۶٫۶ اینچ ۱۲۰ هرتز","باتری ۵۰۰۰ میلی‌آمپرساعت","گارانتی ۱۸ ماهه"], details:{"برند": "سامسونگ", "مدل": "Galaxy A55", "حافظه داخلی": "۲۵۶ گیگابایت", "رم": "۸ گیگابایت", "نمایشگر": "Super AMOLED ‏۶٫۶ اینچ، ۱۲۰ هرتز", "دوربین اصلی": "۵۰ مگاپیکسل", "باتری": "۵۰۰۰ میلی‌آمپرساعت", "گارانتی": "۱۸ ماه"} },
  { id:"p2", images:["assets/products/p2-1.svg", "assets/products/p2-2.svg", "assets/products/p2-3.svg"], name:"لپ‌تاپ ایسوس Vivobook 15", shopId:"parspc", icon:"laptop", c:"#5b4bdb", t1:"#efecff", t2:"#dcd6ff", price:38500000, old:41000000, rate:4.6, cnt:78,
    desc:"لپ‌تاپ سبک برای کار اداری، دانشجویی و برنامه‌های روزمره.", specs:["پردازنده Core i5 نسل ۱۳","رم ۱۶ گیگابایت، SSD ‏۵۱۲ گیگابایت","نمایشگر ۱۵٫۶ اینچ Full HD","گارانتی ۱۲ ماهه"], details:{"برند": "ایسوس", "مدل": "Vivobook 15", "پردازنده": "Core i5 نسل ۱۳", "رم": "۱۶ گیگابایت", "حافظه": "SSD ‏۵۱۲ گیگابایت", "نمایشگر": "۱۵٫۶ اینچ Full HD", "وزن": "۱٫۷ کیلوگرم", "گارانتی": "۱۲ ماه"} },
  { id:"p3", images:["assets/products/p3-1.svg", "assets/products/p3-2.svg", "assets/products/p3-3.svg"], name:"هدفون بی‌سیم با حذف نویز", shopId:"digishahr", icon:"headphones", c:"#0f1b2d", t1:"#e9edf3", t2:"#d3dae5", price:3200000, rate:4.5, cnt:205,
    desc:"هدفون روی‌گوش با حذف نویز فعال و صدای متعادل برای موسیقی و تماس.", specs:["بلوتوث ۵٫۳","تا ۳۰ ساعت شارژدهی","میکروفون دوگانه","گارانتی ۱۲ ماهه"], details:{"نوع": "روی‌گوش بی‌سیم", "اتصال": "بلوتوث ۵٫۳", "حذف نویز": "فعال (ANC)", "شارژدهی": "تا ۳۰ ساعت", "میکروفون": "دوگانه", "شارژ": "Type-C", "گارانتی": "۱۲ ماه"} },
  { id:"p4", images:["assets/products/p4-1.svg", "assets/products/p4-2.svg", "assets/products/p4-3.svg"], name:"ساعت هوشمند شیائومی Redmi Watch", shopId:"mobilesara", icon:"clock", c:"#e0541a", t1:"#fff0e8", t2:"#ffd8c4", price:2450000, rate:4.3, cnt:93,
    desc:"ساعت هوشمند سبک با پایش ضربان قلب، خواب و اعلان‌های گوشی.", specs:["نمایشگر ۱٫۸۳ اینچ","ضدآب ۵ اتمسفر","باتری تا ۱۲ روز","گارانتی ۱۲ ماهه"], details:{"برند": "شیائومی", "مدل": "Redmi Watch", "نمایشگر": "۱٫۸۳ اینچ", "مقاومت در برابر آب": "۵ اتمسفر", "سنسورها": "ضربان قلب، خواب، اکسیژن خون", "باتری": "تا ۱۲ روز", "گارانتی": "۱۲ ماه"} },
  { id:"p5", images:["assets/products/p5-1.svg", "assets/products/p5-2.svg", "assets/products/p5-3.svg"], name:"پاوربانک ۲۰۰۰۰ میلی‌آمپر انکر", shopId:"mobilesara", icon:"battery-full", c:"#1c8a55", t1:"#e2f8ec", t2:"#bfecd4", price:1350000, old:1500000, rate:4.8, cnt:310,
    desc:"پاوربانک شارژ سریع که گوشی را چند بار شارژ می‌کند.", specs:["ظرفیت ۲۰۰۰۰ میلی‌آمپرساعت","شارژ سریع ۲۲٫۵ وات","دو خروجی USB و یک Type-C","گارانتی ۱۸ ماهه"], details:{"برند": "انکر", "ظرفیت": "۲۰۰۰۰ میلی‌آمپرساعت", "شارژ سریع": "۲۲٫۵ وات", "خروجی‌ها": "دو USB و یک Type-C", "وزن": "۳۷۰ گرم", "گارانتی": "۱۸ ماه"} },
  { id:"p6", images:["assets/products/p6-1.svg", "assets/products/p6-2.svg", "assets/products/p6-3.svg"], name:"کیبورد و ماوس بی‌سیم لاجیتک", shopId:"parspc", icon:"keyboard", c:"#b8860b", t1:"#fff6dc", t2:"#fde9a8", price:1780000, rate:4.4, cnt:121,
    desc:"ست بی‌سیم با گیرنده یکپارچه، مناسب میز کار.", specs:["اتصال ۲٫۴ گیگاهرتز","باتری تا ۱۸ ماه","کلیدهای کم‌صدا","گارانتی ۱۲ ماهه"], details:{"برند": "لاجیتک", "نوع": "ست کیبورد و ماوس بی‌سیم", "اتصال": "گیرنده ۲٫۴ گیگاهرتز", "باتری": "تا ۱۸ ماه", "کلیدها": "کم‌صدا", "گارانتی": "۱۲ ماه"} }
];
const stores = [
  { id:"digishahr", logo:"assets/stores/digishahr-logo.svg", cover:"assets/stores/digishahr-cover.svg", name:"دیجی‌شهر", cat:"موبایل و هدفون", area:"خیابان امام", address:"بهشهر، خیابان امام، روبروی بانک ملی", phone:"۰۱۱-۳۵۲۴۱۱۱۱", tel:"+981135241111", hours:"هر روز ۹ صبح تا ۹ شب", rate:4.7, desc:"فروش موبایل و هدفون با گارانتی اصلی. مشاوره خرید رایگان در فروشگاه.", icon:"mobile-screen-button", c:"#087cff", t1:"#e7f1ff", t2:"#cfe3ff", open:true },
  { id:"parspc", logo:"assets/stores/parspc-logo.svg", cover:"assets/stores/parspc-cover.svg", name:"کامپیوتر پارس", cat:"لپ‌تاپ و کامپیوتر", area:"میدان شهدا", address:"بهشهر، میدان شهدا، پاساژ نور، طبقه اول", phone:"۰۱۱-۳۵۲۴۲۲۲۲", tel:"+981135242222", hours:"شنبه تا پنجشنبه ۱۰ صبح تا ۸ شب", rate:4.6, desc:"لپ‌تاپ، قطعات کامپیوتر و لوازم جانبی. خدمات نصب و تعمیر هم داریم.", icon:"laptop", c:"#5b4bdb", t1:"#efecff", t2:"#dcd6ff", open:true },
  { id:"mobilesara", logo:"assets/stores/mobilesara-logo.svg", cover:"assets/stores/mobilesara-cover.svg", name:"موبایل‌سرا", cat:"لوازم جانبی موبایل", area:"بلوار ساحلی", address:"بهشهر، بلوار ساحلی، نبش کوچه ۱۲", phone:"۰۱۱-۳۵۲۴۳۳۳۳", tel:"+981135243333", hours:"هر روز ۱۰ صبح تا ۱۰ شب", rate:4.4, desc:"شارژر، پاوربانک، ساعت هوشمند و انواع قاب و گلس.", icon:"battery-full", c:"#1c8a55", t1:"#e2f8ec", t2:"#bfecd4", open:false }
];
const storeOf = id => stores.find(s => s.id === id);

/* اگر مدیر از پنل ادمین فروشگاه یا محصولی را تغییر داده باشد، همان نسخه جایگزین می‌شود */
(function () {
  try {
    const s = JSON.parse(localStorage.getItem("shahrak_catalog"));
    if (s && Array.isArray(s.stores) && Array.isArray(s.products)) {
      stores.splice(0, stores.length, ...s.stores);
      products.splice(0, products.length, ...s.products);
    }
  } catch {}
  products.forEach(p => {
    if (!p.images || !p.images.length) p.images = ["assets/products/placeholder.svg"];
    p.details = p.details || {};
    p.specs = p.specs || [];
  });
  for (let i = products.length - 1; i >= 0; i--) if (!storeOf(products[i].shopId)) products.splice(i, 1);
})();

/* ---------- بخش مشترک: تنظیمات، کیف پول، برچسب‌ها ---------- */
const DEFAULT_SETTINGS = {
  supportPhone: "۰۱۱-۳۵۲۴۰۰۰۰", supportEmail: "info@shahrak.ir", supportHours: "هر روز ۹ صبح تا ۹ شب",
  address: "مازندران، بهشهر، خیابان امام", cardNumber: "", cardHolder: "", testMode: false, gatewayEnabled: false, gatewayName: "درگاه پرداخت", gatewayUrl: "", verifyUrl: "", minCharge: 50000, maxCharge: 50000000, autoConfirmDays: 7, returnDays: 7, returnAutoDays: 5, commissionRate: 5, withdrawFeeRate: 1, withdrawMinFee: 5000, minWithdraw: 100000
};
const T_CATS = { wallet: "پرداخت انجام شد ولی کیف پول شارژ نشد", order: "مشکل در سفارش", bug: "باگ یا خطا در سایت", other: "سایر موارد" };
const T_ST = { open: "باز", inprogress: "در حال بررسی", resolved: "حل شد", closed: "بسته" };
const PAY_ST = { pending: "در انتظار پرداخت", needs_review: "نیازمند بررسی", paid: "پرداخت‌شده", failed: "ناموفق" };
const TX_LABELS = { charge: "شارژ کیف پول", purchase: "پرداخت سفارش", refund: "بازگشت وجه", adjust: "اصلاح موجودی", sale: "فروش", withdraw: "برداشت", withdraw_refund: "بازگشت برداشت", hold: "امانت سفارش (غیرقابل برداشت)", pay: "پرداخت مدیر سایت", unhold: "برگشت امانت (لغو سفارش)" };
const _ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const getSettings = () => ({ ...DEFAULT_SETTINGS, ..._ls("shahrak_settings", {}) });
const walletOf = phone => _ls("shahrak_wallets", {})[phone] || { balance: 0, tx: [] };
/* amount مثبت = افزایش، منفی = کاهش. اگر موجودی کم باشد یا ذخیره نشود false برمی‌گرداند */
function walletApply(phone, amount, type, note, by = "system", ref = "") {
  const all = _ls("shahrak_wallets", {}), w = all[phone] || { balance: 0, tx: [] };
  if (!Number.isFinite(amount) || amount === 0 || w.balance + amount < 0) return false;
  w.balance += amount;
  w.tx.unshift({ id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type, amount, balance: w.balance, note, by, ref, date: new Date().toISOString() });
  w.tx = w.tx.slice(0, 300);
  all[phone] = w;
  try { localStorage.setItem("shahrak_wallets", JSON.stringify(all)); return true; } catch { return false; }
}
let AUDIT_ACTOR = "مدیر سایت";
function auditLog(action, detail = "") {
  const a = _ls("shahrak_audit", []);
  a.unshift({ date: new Date().toISOString(), action, detail, by: AUDIT_ACTOR });
  try { localStorage.setItem("shahrak_audit", JSON.stringify(a.slice(0, 500))); } catch {}
}

/* ---------- فروشندگان، امانت پول و کارمزد (فرانت؛ بک‌اند بعداً جایگزین می‌شود) ---------- */
const SELLERS_KEY = "shahrak_sellers", SPROD_KEY = "shahrak_sproducts", KYC_KEY = "shahrak_kyc", WD_KEY = "shahrak_withdrawals";
const SELLER_ST = { pending: "در انتظار بررسی", approved: "تأییدشده", rejected: "ردشده", suspended: "معلق" };
const WD_ST = { pending: "در انتظار واریز", paid: "واریز شد", rejected: "ردشده" };
const ORDER_ST = { pending: "در انتظار ارسال", shipped: "ارسال شد", delivered: "تحویل شد", canceled: "لغو شد", returned: "مرجوع شد" };
const RET_ST = { requested: "منتظر بررسی فروشنده", approved: "تأیید شد؛ منتظر ارسال کالا", shipped_back: "در راه فروشنده", rejected: "رد شد", escalated: "ارجاع به پشتیبانی", done: "تکمیل شد" };
const getSellers = () => _ls(SELLERS_KEY, {});
const sellerOf = phone => Object.values(getSellers()).find(s => s.owner === phone);
const _mix = (hex, k) => { const n = parseInt(hex.slice(1), 16); return "#" + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(v + (255 - v) * k).toString(16).padStart(2, "0")).join(""); };
const themeFrom = hex => ({ c: hex, t1: _mix(hex, 0.9), t2: _mix(hex, 0.78) });
const commissionOf = id => { const sel = getSellers()[id]; return sel && sel.commission != null ? sel.commission : getSettings().commissionRate; };
const withdrawFee = amount => { const S = getSettings(); return Math.max(S.withdrawMinFee, Math.round(amount * S.withdrawFeeRate / 100)); };

/* فروشگاه‌ها و محصولات تأییدشده‌ی فروشندگان به لیست سایت اضافه می‌شوند */
(function () {
  Object.values(getSellers()).filter(s => s.status === "approved").forEach(s => stores.push({ ...s, rate: s.rate || 0, _seller: true }));
  _ls(SPROD_KEY, []).forEach(p => { if (stores.some(s => s.id === p.shopId)) products.push({ ...p, _seller: true }); });
  products.forEach(p => {
    if (!p.images || !p.images.length) p.images = ["assets/products/placeholder.svg"];
    p.details = p.details || {}; p.specs = p.specs || [];
  });
})();

/* هر سفارش به «زیرسفارش» برای هر فروشگاه تقسیم می‌شود تا وضعیت و پول هر فروشنده جدا باشد */
function ensureSubs(o) {
  if (o.subs) return o;
  const subs = {};
  o.items.forEach(i => {
    if (!i.shopId) { const p = products.find(x => x.name === i.name); i.shopId = p ? p.shopId : "unknown"; }
    const s = subs[i.shopId] || (subs[i.shopId] = { status: o.status || "pending", total: 0, settled: o.status === "delivered", refunded: !!o.refunded });
    s.total += i.price * i.q;
  });
  o.subs = subs;
  return o;
}
const subStatus = subs => {
  const v = Object.values(subs).map(s => (s.status === "returned" ? "canceled" : s.status || "pending"));
  if (v.every(x => x === "canceled")) return "canceled";
  if (v.every(x => x === "delivered" || x === "canceled")) return "delivered";
  if (v.some(x => x === "shipped" || x === "delivered")) return "shipped";
  return "pending";
};
function walletHold(key, amount, note, ref) {
  const all = _ls("shahrak_wallets", {}), w = all[key] || { balance: 0, tx: [] };
  w.pending = (w.pending || 0) + amount;
  w.tx.unshift({ id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: "hold", amount, balance: w.balance, note, by: "system", ref, date: new Date().toISOString(), held: true });
  w.tx = w.tx.slice(0, 300); all[key] = w;
  try { localStorage.setItem("shahrak_wallets", JSON.stringify(all)); return true; } catch { return false; }
}
function walletUnhold(key, amount, note, ref, log) {
  const all = _ls("shahrak_wallets", {}), w = all[key] || { balance: 0, tx: [] };
  w.pending = Math.max(0, (w.pending || 0) - amount);
  if (log) w.tx.unshift({ id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: "unhold", amount: -amount, balance: w.balance, note, by: "system", ref, date: new Date().toISOString(), held: true });
  all[key] = w;
  try { localStorage.setItem("shahrak_wallets", JSON.stringify(all)); return true; } catch { return false; }
}
/* تسویه: مبلغ منهای کارمزد از امانت آزاد و به موجودی قابل برداشت فروشگاه می‌رود */
function _settle(o, id) {
  const s = o.subs[id], key = "store:" + id;
  if (s.settled || s.refunded) return false;
  if (o.pay === "wallet" && getSellers()[id]) {
    const rate = commissionOf(id), fee = Math.round(s.total * rate / 100), net = s.total - fee;
    if (!walletApply(key, net, "sale", `فروش سفارش ${o.code} (کارمزد ${rate}٪ = ${fee})`, "system", o.code)) return false;
    s.commission = fee; s.net = net; s.rate = rate;
    if (s.held) { walletUnhold(key, s.total, "", o.code, false); s.held = false; }
  }
  s.settled = true; s.settleAt = null;
  return true;
}
const returnDaysLeft = s => (s.settleAt ? Math.max(1, Math.ceil((new Date(s.settleAt).getTime() - Date.now()) / 864e5)) : 0);
/* مشتری تا پایان «مهلت مرجوعی» پس از تحویل می‌تواند مرجوع کند یا مشکل اعلام کند */
const returnEligible = s => s.status === "delivered" && !s.settled && !s.refunded && !s.ret && !!s.settleAt && Date.now() < new Date(s.settleAt).getTime();
const _activeRet = s => s.ret && ["requested", "approved", "shipped_back", "escalated"].includes(s.ret.status);
const blocksSettle = s => (s.dispute && s.dispute.status === "open") || _activeRet(s);
function _applySub(o, id, status, force) {
  const s = o.subs[id], key = "store:" + id;
  s.status = status;
  if (status === "shipped" && !s.shippedAt) s.shippedAt = new Date().toISOString();
  if (status === "delivered") {
    s.deliveredAt = new Date().toISOString();
    const days = getSettings().returnDays;
    /* با مهلت مرجوعی، پول تا پایان مهلت در امانت می‌ماند؛ ادمین می‌تواند فوری آزاد کند */
    if (force || !days) _settle(o, id); else if (!s.settled) s.settleAt = new Date(Date.now() + days * 864e5).toISOString();
  }
  /* لغو قبل از تحویل: پول به مشتری برمی‌گردد و امانت فروشگاه آزاد می‌شود */
  if (status === "canceled" && o.pay === "wallet" && !s.settled && !s.refunded && walletApply(o.user, s.total, "refund", `بازگشت وجه سفارش ${o.code}`, "system", o.code)) {
    s.refunded = true;
    if (s.held) { walletUnhold(key, s.total, `لغو سفارش ${o.code}`, o.code, true); s.held = false; }
  }
  if (s.dispute && s.dispute.status === "open" && (status === "delivered" || status === "canceled") && (force || status === "canceled")) s.dispute.status = "resolved";
  o.status = subStatus(o.subs);
}
function _saveOrders(all) { try { localStorage.setItem("shahrak_orders", JSON.stringify(all)); return true; } catch { return false; } }
function _mutate(code, id, fn) {
  const all = _ls("shahrak_orders", []), o = all.find(x => x.code === code);
  if (!o) return false;
  ensureSubs(o);
  if (!o.subs[id]) return false;
  const r = fn(o, o.subs[id]);
  if (r === false) return false;
  o.status = subStatus(o.subs);
  return _saveOrders(all);
}
function orderSetSub(code, storeId, status, force) { return _mutate(code, storeId, o => _applySub(o, storeId, status, force)); }
function orderSetStatus(code, status) {
  const all = _ls("shahrak_orders", []), o = all.find(x => x.code === code);
  if (!o) return false;
  ensureSubs(o);
  Object.keys(o.subs).forEach(id => _applySub(o, id, status, true));
  return _saveOrders(all);
}
function _ticket(o, msg) {
  const T = _ls("shahrak_tickets", []), U = _ls("shahrak_users", {});
  T.push({ id: String(Math.floor(100000 + Math.random() * 900000)), user: o.user, name: (U[o.user] || { name: "مشتری" }).name, cat: "order", amount: 0, ref: "", message: msg, date: new Date().toISOString(), status: "open", replies: [] });
  try { localStorage.setItem("shahrak_tickets", JSON.stringify(T)); } catch {}
}
/* مشتری مشکل را اعلام می‌کند (پیش از تحویل یا تا پایان مهلت مرجوعی): تسویه/تأیید خودکار متوقف و پشتیبانی مطلع می‌شود */
function orderOpenDispute(code, storeId, reason) {
  return _mutate(code, storeId, (o, s) => {
    if (!(s.status === "shipped" || (s.status === "delivered" && !s.settled && !s.refunded))) return false;
    s.dispute = { reason, date: new Date().toISOString(), status: "open" };
    _ticket(o, `اختلاف در سفارش ${o.code}: ${reason}`);
  });
}
/* ---- مرجوعی: درخواست مشتری → تأیید فروشنده → ارسال کالا با کد رهگیری → دریافت و بازگشت وجه ---- */
function orderRequestReturn(code, storeId, reason) {
  return _mutate(code, storeId, (o, s) => {
    if (!returnEligible(s)) return false;
    s.ret = { status: "requested", reason, date: new Date().toISOString() };
  });
}
function orderReturnDecide(code, storeId, decision, note) {
  return _mutate(code, storeId, (o, s) => {
    if (!s.ret || !["requested", "escalated"].includes(s.ret.status)) return false;
    if (decision === "approve") { s.ret.status = "approved"; s.ret.approvedAt = new Date().toISOString(); }
    else { s.ret.status = "rejected"; s.ret.rejectReason = note || ""; s.ret.rejectedAt = new Date().toISOString(); }
  });
}
function orderReturnShip(code, storeId, carrier, trackingCode) {
  return _mutate(code, storeId, (o, s) => {
    if (!s.ret || s.ret.status !== "approved") return false;
    s.ret.status = "shipped_back"; s.ret.tracking = { carrier, code: trackingCode }; s.ret.shippedBackAt = new Date().toISOString();
  });
}
function orderReturnEscalate(code, storeId) {
  return _mutate(code, storeId, (o, s) => {
    if (!s.ret || s.ret.status !== "rejected") return false;
    s.ret.status = "escalated";
    _ticket(o, `ارجاع مرجوعی سفارش ${o.code} به پشتیبانی (دلیل رد فروشنده: ${s.ret.rejectReason || "—"})`);
  });
}
/* دریافت مرجوعی توسط فروشنده (یا ادمین): پول به مشتری برمی‌گردد و امانت فروشگاه آزاد می‌شود */
function orderReturnReceive(code, storeId) {
  return _mutate(code, storeId, (o, s) => {
    if (!_activeRet(s) || s.settled) return false;
    if (o.pay === "wallet" && !s.refunded) {
      if (!walletApply(o.user, s.total, "refund", `بازگشت وجه مرجوعی سفارش ${o.code}`, "system", o.code)) return false;
      s.refunded = true;
      if (s.held) { walletUnhold("store:" + storeId, s.total, `مرجوعی سفارش ${o.code}`, o.code, true); s.held = false; }
    }
    s.ret.status = "done"; s.ret.doneAt = new Date().toISOString(); s.status = "returned";
  });
}
/* کارهای خودکار (در بک‌اند باید با یک کار زمان‌بندی‌شده روی سرور انجام شود):
   ۱) تأیید خودکار تحویل N روز پس از ارسال  ۲) پایان مهلت مرجوعی و آزادسازی پول فروشنده
   ۳) تأیید خودکار مرجوعی اگر فروشنده پاسخ ندهد یا کالای مرجوعی را تأیید نکند */
function autoReleaseDue() {
  const S = getSettings(), now = Date.now(), all = _ls("shahrak_orders", []);
  let n = 0;
  const recv = [];
  all.forEach(o => { if (o.subs) Object.entries(o.subs).forEach(([id, s]) => {
    const t = x => new Date(x).getTime();
    if (S.autoConfirmDays && s.status === "shipped" && s.shippedAt && !(s.dispute && s.dispute.status === "open") && now - t(s.shippedAt) >= S.autoConfirmDays * 864e5) { _applySub(o, id, "delivered"); s.auto = true; n++; }
    if (S.returnAutoDays && s.ret && s.ret.status === "requested" && now - t(s.ret.date) >= S.returnAutoDays * 864e5) { s.ret.status = "approved"; s.ret.approvedAt = new Date().toISOString(); s.ret.auto = true; n++; }
    if (S.returnAutoDays && s.ret && s.ret.status === "shipped_back" && now - t(s.ret.shippedBackAt) >= S.returnAutoDays * 864e5) recv.push([o.code, id]);
    if (s.status === "delivered" && !s.settled && !s.refunded && s.settleAt && now >= t(s.settleAt) && !blocksSettle(s)) { _settle(o, id); n++; }
  }); });
  if (n) _saveOrders(all);
  recv.forEach(([code, id]) => { if (orderReturnReceive(code, id)) n++; });   // تأیید خودکار دریافت مرجوعی
  return n;
}

/* فروشگاه فقط وقتی سفارش می‌پذیرد که «باز» و «مسدود‌نشده» باشد (مسدودی فقط از طرف ادمین) */
const storeSellable = s => !!s && s.open !== false && !s.blocked;
/* ثبت ارسال با کد رهگیری */
function orderShip(code, storeId, carrier, trackingCode) {
  const all = _ls("shahrak_orders", []), o = all.find(x => x.code === code);
  if (!o) return false;
  ensureSubs(o);
  if (!o.subs[storeId]) return false;
  o.subs[storeId].tracking = { carrier, code: trackingCode, date: new Date().toISOString() };
  _applySub(o, storeId, "shipped");
  return _saveOrders(all);
}
autoReleaseDue();
