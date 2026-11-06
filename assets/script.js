
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");

    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "بستن منو" : "باز کردن منو"
    );
});

// بستن منو بعد از کلیک روی لینک
navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "باز کردن منو");
    });
});



/* =============shop============= */
const $ = id => document.getElementById(id);
const fa = n => Number(n).toLocaleString("fa-IR");
const fd = s => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);   // اعداد فارسی بدون ویرگول (تلفن، کد)
const cardFmt = s => fd(String(s).replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 "));
const esc = s => String(s).replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
const tint = o => `--c:${o.c};--t1:${o.t1};--t2:${o.t2}`;
const discount = p => p.old ? `<span class="badge">${fa(Math.round((1 - p.price / p.old) * 100))}٪ تخفیف</span>` : "";
const priceHtml = p => `${p.old ? `<span class="old">${fa(p.old)}</span>` : ""}${fa(p.price)}<small>تومان</small>`;
const rateHtml = p => p.cnt ? `<i class="fa-solid fa-star"></i>${fa(p.rate)} (${fa(p.cnt)} نظر)` : "بدون نظر";
const addLabel = '<i class="fa-solid fa-cart-plus"></i>افزودن';
const storeLogo = s => s.logo ? `<img src="${s.logo}" alt="">` : `<i class="fa-solid fa-${s.icon}"></i>`;
const autoLeft = sb => { const d = getSettings().autoConfirmDays; return d && sb.shippedAt ? Math.max(1, Math.ceil((new Date(sb.shippedAt).getTime() + d * 864e5 - Date.now()) / 864e5)) : 0; };
const blockedLabel = p => { const s = storeOf(p.shopId); return !storeSellable(s) ? (s && s.blocked ? "مسدود" : "فروشگاه بسته") : p.stock === 0 ? "ناموجود" : ""; };
const shopName = p => (storeOf(p.shopId) || {}).name || "";
const page = document.body.dataset.page;
const qs = new URLSearchParams(location.search);

/* ---- ذخیره‌سازی و حساب کاربری (نسخه نمایشی، فقط در مرورگر) ---- */
const USERS_KEY = "shahrak_users", SESSION_KEY = "shahrak_user", CART_KEY = "shahrak_cart", ORDERS_KEY = "shahrak_orders", AVATAR_KEY = "shahrak_avatars", REVIEWS_KEY = "shahrak_reviews", TOPUPS_KEY = "shahrak_topups", TICKETS_KEY = "shahrak_tickets";
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const session = () => {
  const s = read(SESSION_KEY, null);
  if (!s) return null;
  const u = read(USERS_KEY, {})[s.phone];          // کاربر حذف یا مسدود شده از پنل ادمین
  if (!u || u.blocked) { localStorage.removeItem(SESSION_KEY); return null; }
  return s;
};
const STATUS = { pending: "در انتظار هماهنگی", shipped: "ارسال شد", delivered: "تحویل شد", canceled: "لغو شد" };
const avatarOf = phone => read(AVATAR_KEY, {})[phone] || "";
const toEn = s => String(s).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
async function hash(p) {
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("shahrak:" + p));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  }
  return "plain:" + p;
}
const here = () => (location.pathname.split("/").pop() || "index.html") + location.search;
const safeNext = n => /^(?!login|register)[\w-]+\.html(\?[\w=&%.-]*)?$/.test(n || "") ? n : "index.html";
const loginUrl = (next, need) => "login.html?next=" + encodeURIComponent(next) + (need ? "&need=1" : "");
const goLogin = (need = true) => { location.href = loginUrl(here(), need); };

function renderAuth() {
  const u = session(), box = $("authBtns");
  box.innerHTML = u
    ? (avatarOf(u.phone)
        ? `<a class="action-btn prof-btn has-av" href="profile.html" title="پروفایل" aria-label="پروفایل"><img class="hd-av" src="${avatarOf(u.phone)}" alt=""></a>`
        : `<a class="action-btn prof-btn" href="profile.html" title="پروفایل" aria-label="پروفایل"><i class="fa-solid fa-user"></i></a>`)
    : `<a class="action-btn" href="${loginUrl(["login.html","register.html"].some(x => here().startsWith(x)) ? "index.html" : here())}"><i class="fa-solid fa-right-to-bracket"></i>ثبت‌نام / ورود</a>`;
}
renderAuth();

/* ---- سبد خرید ---- */
let cart = read(CART_KEY, {});
const cartCount = $("cartCount"), cartDlg = $("cartDialog");
const cartItems = () => Object.entries(cart).map(([name, q]) => ({ p: products.find(x => x.name === name), q })).filter(x => x.p);
const cartTotal = items => items.reduce((s, x) => s + x.p.price * x.q, 0);
const saveCart = () => write(CART_KEY, cart);

function renderCart() {
  const items = cartItems(), count = items.reduce((s, x) => s + x.q, 0);
  cartCount.textContent = fa(count);
  cartCount.hidden = count === 0;
  $("cartList").innerHTML = items.length ? items.map(({ p, q }) => `
    <li style="${tint(p)}">
      <img class="ci-ico" src="${p.images[0]}" alt="">
      <div class="ci-main"><strong>${p.name}</strong><span class="card-shop">${shopName(p)}</span>
        <span class="ci-price">${fa(p.price * q)} تومان</span>${storeSellable(storeOf(p.shopId)) ? "" : `<small class="neg">${(storeOf(p.shopId) || {}).blocked ? "فروشگاه مسدود است" : "فروشگاه بسته است"} — این کالا قابل سفارش نیست</small>`}</div>
      <div class="qty" data-n="${p.name}">
        <button type="button" data-act="inc" aria-label="افزایش">+</button><b>${fa(q)}</b>
        <button type="button" data-act="dec" aria-label="کاهش">−</button></div>
      <button class="ci-del" type="button" data-n="${p.name}" data-act="del" aria-label="حذف"><i class="fa-solid fa-trash-can"></i></button>
    </li>`).join("") : '<li class="empty">سبد خرید شما خالی است.</li>';
  $("cartTotal").innerHTML = items.length ? `جمع کل: <b>${fa(cartTotal(items))}</b> تومان` : "";
  $("cartFoot").hidden = !items.length;
}
function addToCart(btn, p) {
  if (!session()) return goLogin();           // بدون ورود نمی‌شود به سبد اضافه کرد
  const bl = blockedLabel(p);
  if (bl) { btn.textContent = bl; return; }   // فروشگاه بسته/مسدود یا ناموجود
  if (p.stock != null && (cart[p.name] || 0) >= p.stock) { btn.textContent = p.stock ? "حداکثر موجودی" : "ناموجود"; return; }
  cart[p.name] = (cart[p.name] || 0) + 1;
  saveCart(); renderCart();
  const orig = btn.innerHTML;
  btn.classList.add("done");
  btn.innerHTML = '<i class="fa-solid fa-check"></i>اضافه شد';
  setTimeout(() => { btn.classList.remove("done"); btn.innerHTML = orig; }, 1400);
}
$("cartBtn").addEventListener("click", e => { e.preventDefault(); renderCart(); cartDlg.showModal(); });
$("cartClose").addEventListener("click", () => cartDlg.close());
cartDlg.addEventListener("click", e => { if (e.target === cartDlg) cartDlg.close(); });
$("orderBtn").addEventListener("click", e => {
  if (!session()) { e.preventDefault(); location.href = loginUrl("checkout.html", true); }
});
$("cartList").addEventListener("click", e => {
  const b = e.target.closest("button[data-act]");
  if (!b) return;
  const n = b.dataset.n || b.parentElement.dataset.n;
  if (b.dataset.act === "inc") cart[n]++;
  else if (b.dataset.act === "dec") { cart[n]--; if (cart[n] < 1) delete cart[n]; }
  else delete cart[n];
  saveCart(); renderCart();
});
window.addEventListener("storage", e => { if (e.key === CART_KEY) { cart = read(CART_KEY, {}); renderCart(); } });
renderCart();

/* ---- کارت محصول و پنجره مشاهده سریع ---- */
const productCard = (p, i) => `
  <article class="card product" style="${tint(p)}" data-i="${i}" tabindex="0" role="button" aria-label="مشاهده ${p.name}">
    <div class="card-media">${discount(p)}<img src="${p.images[0]}" alt="" loading="lazy"></div>
    <div class="card-body">
      <span class="card-shop">${shopName(p)}</span>
      <h3 class="card-title">${p.name}</h3>
      <span class="rating">${rateHtml(p)}</span>
      <div class="price-row">
        <span class="price">${priceHtml(p)}</span>
        <button class="add-btn" type="button" data-i="${i}" ${blockedLabel(p) ? "disabled" : ""}>${blockedLabel(p) || addLabel}</button>
      </div>
    </div>
  </article>`;

const productGrid = $("productGrid"), dlg = $("pDialog");
if (dlg) {
  let current = null;
  const openProduct = i => {
    const p = current = products[i];
    dlg.style.cssText = tint(p);
    $("pdMedia").innerHTML = `${discount(p)}<img src="${p.images[0]}" alt="${esc(p.name)}">`;
    $("pdShop").innerHTML = page === "store" ? shopName(p) : `<a href="store.html?id=${p.shopId}">${shopName(p)}</a>`;
    $("pdTitle").textContent = p.name;
    $("pdRate").innerHTML = rateHtml(p);
    $("pdDesc").textContent = p.desc;
    $("pdSpecs").innerHTML = p.specs.map(x => `<li>${x}</li>`).join("");
    $("pdPrice").innerHTML = priceHtml(p);
    $("pdMore").href = "product.html?id=" + p.id;
    const lbl = blockedLabel(p);
    $("pdAdd").disabled = !!lbl;
    $("pdAdd").innerHTML = lbl || '<i class="fa-solid fa-cart-plus"></i>افزودن به سبد';
    dlg.showModal();
  };
  productGrid.addEventListener("click", e => {
    const btn = e.target.closest(".add-btn");
    if (btn) return addToCart(btn, products[btn.dataset.i]);
    const card = e.target.closest(".product");
    if (card) openProduct(card.dataset.i);
  });
  productGrid.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("product")) {
      e.preventDefault(); openProduct(e.target.dataset.i);
    }
  });
  $("pdAdd").addEventListener("click", () => addToCart($("pdAdd"), current));
  $("pdClose").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
}

/* ---- صفحه اصلی ---- */
function renderHome() {
  productGrid.innerHTML = products.map(productCard).join("");
  $("storeGrid").innerHTML = stores.map(s => `
    <a class="card store" style="${tint(s)}" href="store.html?id=${s.id}" aria-label="ورود به صفحه ${s.name}">
      <div class="store-top">
        <span class="store-ico" aria-hidden="true">${storeLogo(s)}</span>
        <div><h3 class="card-title">${s.name}</h3><span class="card-shop">${s.cat}</span></div>
      </div>
      <div class="store-meta">
        <span><i class="fa-solid fa-location-dot"></i> ${s.area}</span>
        <span>${fa(products.filter(p => p.shopId === s.id).length)} محصول</span>
        <span class="${storeSellable(s) ? "open" : "shut"}">${s.blocked ? "مسدود" : s.open ? "باز است" : "بسته است"}</span>
      </div>
      <span class="store-go">ورود به فروشگاه <i class="fa-solid fa-arrow-left"></i></span>
    </a>`).join("");
  const showTab = name => {
    document.querySelectorAll(".panel").forEach(p => (p.hidden = p.id !== "panel-" + name));
    document.querySelectorAll(".tabs .tab").forEach(t => {
      const on = t.dataset.tab === name;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on);
    });
  };
  document.querySelectorAll("a[data-tab]").forEach(a =>
    a.addEventListener("click", e => {
      e.preventDefault();
      showTab(a.dataset.tab);
      history.replaceState(null, "", "#" + a.dataset.tab);
      if (!a.classList.contains("tab")) $("content").scrollIntoView();
    })
  );
  showTab(location.hash === "#stores" ? "stores" : "products");
  if (location.hash === "#stores") $("content").scrollIntoView();
}

/* ---- صفحه فروشگاه ---- */
function renderStore() {
  const s = storeOf(qs.get("id")), box = $("storeHero");
  if (!s) {
    box.innerHTML = '<div class="shop-wrap"><h1>این فروشگاه پیدا نشد</h1><p><a class="about-cta" href="index.html#stores">بازگشت به فروشگاه‌ها</a></p></div>';
    $("storeProducts").hidden = true;
    return;
  }
  document.title = s.name + " | شهرک";
  box.style.cssText = tint(s);
  const list = products.map((p, i) => [p, i]).filter(([p]) => p.shopId === s.id);
  box.innerHTML = `<div class="shop-wrap">
    <a class="back" href="index.html#stores"><i class="fa-solid fa-arrow-right"></i> همه فروشگاه‌ها</a>
    ${s.cover ? `<img class="sh-cover" src="${s.cover}" alt="">` : ""}
    <div class="sh-main">
      <span class="store-ico big" aria-hidden="true">${storeLogo(s)}</span>
      <div>
        <h1>${s.name}</h1>
        <p class="sh-cat">${s.cat}${s.rate ? ` · <i class="fa-solid fa-star" style="color:#f5a524"></i> ${fa(s.rate)}` : ""}
          <span class="${storeSellable(s) ? "open" : "shut"}">${s.blocked ? "مسدود" : s.open ? "باز است" : "بسته است"}</span></p>
        <p class="sh-desc">${s.desc}</p>
      </div>
    </div>
    <ul class="sh-info">
      <li><i class="fa-solid fa-location-dot"></i>${s.address}</li>
      <li><i class="fa-solid fa-phone"></i><a href="tel:${s.tel}" dir="ltr">${s.phone}</a></li>
      <li><i class="fa-solid fa-clock"></i>${s.hours}</li>
    </ul></div>`;
  const sec = $("storeProducts"), r = (s.theme && s.theme.radius) || "lg";
  sec.style.cssText = `--blue:${s.c};--blue-soft:${s.t1}`;
  sec.dataset.r = r; box.dataset.r = r;
  if (!storeSellable(s)) box.insertAdjacentHTML("beforeend", `<div class="shop-wrap"><div class="sh-banner bad"><i class="fa-solid fa-${s.blocked ? "ban" : "door-closed"}"></i> ${s.blocked ? "این فروشگاه توسط مدیریت مسدود شده و سفارش نمی‌پذیرد." : "این فروشگاه فعلاً بسته است؛ امکان ثبت سفارش وجود ندارد."}</div></div>`);
  if (s.theme && s.theme.banner) box.insertAdjacentHTML("beforeend", `<div class="shop-wrap"><div class="sh-banner"><i class="fa-solid fa-bullhorn"></i> ${esc(s.theme.banner)}</div></div>`);
  $("storeCount").textContent = `${fa(list.length)} محصول از ${s.name}`;
  productGrid.innerHTML = list.map(([p, i]) => productCard(p, i)).join("");
}

/* ---- کروسل تصاویر ---- */
function setupGallery(n) {
  const track = $("carTrack"), slides = [...track.children], thumbs = [...document.querySelectorAll(".car-thumb")];
  let cur = 0;
  const mark = i => {
    cur = i;
    thumbs.forEach((t, k) => { t.classList.toggle("on", k === i); t.toggleAttribute("aria-current", k === i); });
    $("carCount").textContent = `${fa(i + 1)} / ${fa(n)}`;
  };
  const go = i => { i = (i + n) % n; slides[i].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" }); mark(i); };
  $("carPrev").addEventListener("click", () => go(cur - 1));
  $("carNext").addEventListener("click", () => go(cur + 1));
  thumbs.forEach(t => t.addEventListener("click", () => go(+t.dataset.i)));
  track.addEventListener("keydown", e => {
    // صفحه راست‌به‌چپ است: فلش چپ = بعدی
    if (e.key === "ArrowLeft") { e.preventDefault(); go(cur + 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(cur - 1); }
  });
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) mark(slides.indexOf(en.target)); }), { root: track, threshold: 0.6 });
  slides.forEach(s => io.observe(s));
  mark(0);
}

/* ---- نظرات ---- */
const starsHtml = n => [1, 2, 3, 4, 5].map(i => `<i class="fa-${i <= n ? "solid" : "regular"} fa-star"></i>`).join("");
function setupReviews(p) {
  const box = $("reviewsBox");
  const all = () => read(REVIEWS_KEY, {});
  const render = (draftRate = 0, draftText = "") => {
    const list = all()[p.id] || [], u = session();
    const mine = u && list.find(r => r.user === u.phone);
    const rate = draftRate || (mine ? mine.rate : 0), text = draftText || (mine ? mine.text : "");
    const avg = list.length ? list.reduce((s, r) => s + r.rate, 0) / list.length : 0;
    box.dataset.rate = rate;
    box.innerHTML = `<h2>نظرات کاربران</h2>
      <div class="rv-sum">${list.length
        ? `<b>${fa(avg.toFixed(1))}</b><span class="rv-stars">${starsHtml(Math.round(avg))}</span><span>از ${fa(list.length)} نظر</span>`
        : "<span>هنوز نظری ثبت نشده است. اولین نفر باشید!</span>"}</div>
      ${u ? `<form class="rv-form" id="rvForm" novalidate>
          <div class="rv-pick" role="group" aria-label="امتیاز شما">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="rv-star ${i <= rate ? "on" : ""}" data-v="${i}" aria-label="${fa(i)} ستاره" aria-pressed="${i === rate}"><i class="fa-${i <= rate ? "solid" : "regular"} fa-star"></i></button>`).join("")}</div>
          <textarea name="text" rows="3" maxlength="500" placeholder="تجربه خود را از این محصول بنویسید…" aria-label="متن نظر">${esc(text)}</textarea>
          <p class="form-err" id="rvErr" role="alert"></p>
          <div class="rv-actions"><button class="add-btn big primary" type="submit">${mine ? "ویرایش نظر" : "ثبت نظر"}</button>
            ${mine ? '<button class="av-del rv-del" type="button" id="rvDel">حذف نظر من</button>' : ""}</div>
        </form>`
        : `<p class="rv-login"><a class="about-cta" href="${loginUrl(here(), true)}">برای ثبت نظر وارد شوید</a></p>`}
      <ul class="rv-list">${list.map(r => `<li class="rv-item">
          <span class="rv-av">${avatarOf(r.user) ? `<img src="${avatarOf(r.user)}" alt="">` : esc(r.name.trim()[0] || "؟")}</span>
          <div class="rv-body"><div class="rv-head"><strong>${esc(r.name)}</strong><span class="rv-date">${new Date(r.date).toLocaleDateString("fa-IR")}</span></div>
            <span class="rv-stars" aria-label="${fa(r.rate)} از ۵">${starsHtml(r.rate)}</span>
            <p>${esc(r.text)}</p></div></li>`).join("")}</ul>`;
  };
  box.addEventListener("click", e => {
    const s = e.target.closest(".rv-star");
    if (s) return render(+s.dataset.v, box.querySelector("textarea").value);
    if (e.target.closest("#rvDel")) {
      const a = all(), u = session();
      a[p.id] = (a[p.id] || []).filter(r => r.user !== u.phone);
      write(REVIEWS_KEY, a); render();
    }
  });
  box.addEventListener("submit", e => {
    e.preventDefault();
    const u = session(), rate = +box.dataset.rate, text = box.querySelector("textarea").value.trim(), err = $("rvErr");
    if (!u) return goLogin();
    if (!rate) return void (err.textContent = "لطفاً امتیاز بدهید.");
    if (text.length < 5) return void (err.textContent = "متن نظر را کمی کامل‌تر بنویسید.");
    const a = all();
    a[p.id] = [{ user: u.phone, name: u.name, rate, text, date: new Date().toISOString() }, ...(a[p.id] || []).filter(r => r.user !== u.phone)];
    write(REVIEWS_KEY, a); render();
  });
  render();
}

/* ---- صفحه جزئیات محصول ---- */
function renderProductPage() {
  const p = products.find(x => x.id === qs.get("id")), box = $("productView");
  if (!p) {
    box.innerHTML = '<div class="shop-wrap"><h1>این محصول پیدا نشد</h1><p><a class="about-cta" href="index.html#products">بازگشت به محصولات</a></p></div>';
    $("relatedBox").hidden = true;
    return;
  }
  const s = storeOf(p.shopId);
  document.title = p.name + " | شهرک";
  box.style.cssText = tint(p);
  box.innerHTML = `<div class="shop-wrap">
    <nav class="crumbs" aria-label="مسیر"><a href="index.html">خانه</a> › <a href="index.html#products">محصولات</a> › <span>${p.name}</span></nav>
    <div class="pv-grid">
      <div class="pv-gallery" role="group" aria-roledescription="کروسل" aria-label="تصاویر ${esc(p.name)}">
        <div class="car-wrap">
          ${discount(p)}
          <div class="car-track" id="carTrack" tabindex="0" aria-live="polite">${p.images.map((s, i) => `<figure class="car-slide" aria-label="تصویر ${fa(i + 1)} از ${fa(p.images.length)}"><img src="${s}" alt="${esc(p.name)} - تصویر ${fa(i + 1)}"></figure>`).join("")}</div>
          <button class="car-btn prev" id="carPrev" type="button" aria-label="تصویر قبلی"><i class="fa-solid fa-chevron-right"></i></button>
          <button class="car-btn next" id="carNext" type="button" aria-label="تصویر بعدی"><i class="fa-solid fa-chevron-left"></i></button>
          <span class="car-count" id="carCount"></span>
        </div>
        <div class="car-thumbs">${p.images.map((s, i) => `<button type="button" class="car-thumb" data-i="${i}" aria-label="نمایش تصویر ${fa(i + 1)}"><img src="${s}" alt=""></button>`).join("")}</div>
      </div>
      <div class="pv-info">
        <a class="card-shop pv-shop" href="store.html?id=${s.id}"><i class="fa-solid fa-store"></i> ${s.name}</a>
        <h1>${p.name}</h1>
        <span class="rating">${rateHtml(p)}</span>
        <p class="pv-desc">${p.desc}</p>
        <ul class="specs">${p.specs.map(x => `<li>${x}</li>`).join("")}</ul>
        <div class="pv-buy">
          <span class="price big">${priceHtml(p)}</span>
          <button class="add-btn big" id="pvAdd" type="button"><i class="fa-solid fa-cart-plus"></i>افزودن به سبد</button>
        </div>
        <ul class="pv-perks">
          <li><i class="fa-solid fa-shield-halved"></i>گارانتی اصلی</li>
          <li><i class="fa-solid fa-truck-fast"></i>ارسال همان روز در بهشهر</li>
          <li><i class="fa-solid fa-rotate-left"></i>هفت روز ضمانت بازگشت</li>
        </ul>
      </div>
    </div>
    ${Object.keys(p.details).length ? `<section class="pv-specs"><h2>مشخصات فنی</h2>
      <table><tbody>${Object.entries(p.details).map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join("")}</tbody></table>
    </section>` : ""}
    <section class="pv-reviews" id="reviewsBox" aria-label="نظرات کاربران"></section></div>`;
  $("pvAdd").addEventListener("click", e => addToCart(e.currentTarget, p));
  if (blockedLabel(p)) { $("pvAdd").disabled = true; $("pvAdd").textContent = blockedLabel(p); }
  setupGallery(p.images.length);
  setupReviews(p);
  const rel = products.map((x, i) => [x, i]).filter(([x]) => x.id !== p.id)
    .sort((a, b) => (b[0].shopId === p.shopId) - (a[0].shopId === p.shopId)).slice(0, 3);
  productGrid.innerHTML = rel.map(([x, i]) => productCard(x, i)).join("");
}

/* ---- صفحه ثبت سفارش ---- */
function renderCheckout() {
  const u = session(), box = $("checkoutView");
  if (!u) return void (location.href = loginUrl("checkout.html", true));
  const items = cartItems(), total = cartTotal(items), bal = walletOf(u.phone).balance, canWallet = bal >= total;
  if (!items.length) {
    box.innerHTML = '<div class="shop-wrap co-empty"><i class="fa-solid fa-cart-shopping"></i><h1>سبد خرید شما خالی است</h1><p><a class="about-cta" href="index.html#products">دیدن محصولات</a></p></div>';
    return;
  }
  box.innerHTML = `<div class="shop-wrap"><h1 class="co-title">ثبت سفارش</h1>
    <div class="co-grid">
      <form id="coForm" class="co-card" novalidate>
        <h2>اطلاعات ارسال</h2>
        <label>نام و نام خانوادگی<input name="fullname" autocomplete="name" required></label>
        <label>شماره موبایل<input name="phone" inputmode="tel" autocomplete="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" required></label>
        <label>شهر<input name="city" value="بهشهر" required></label>
        <label>آدرس کامل<textarea name="address" rows="3" required></textarea></label>
        <label>کد پستی (۱۰ رقمی)<input name="zip" inputmode="numeric" maxlength="10" placeholder="۱۲۳۴۵۶۷۸۹۰" required></label>
        <h2>روش پرداخت</h2>
        <label class="pay"><input type="radio" name="pay" value="cod" checked>پرداخت در محل (نقدی یا کارت‌خوان)</label>
        <label class="pay ${canWallet ? "" : "off"}"><input type="radio" name="pay" value="wallet" ${canWallet ? "" : "disabled"}>پرداخت با کیف پول (موجودی: ${fa(bal)} تومان)${canWallet ? "" : ' — <a href="profile.html">شارژ کیف پول</a>'}</label>
        <label class="pay off"><input type="radio" name="pay" value="online" disabled>پرداخت آنلاین با درگاه بانکی (به‌زودی)</label>
        <p class="form-err" id="coErr" role="alert"></p>
      </form>
      <aside class="co-card">
        <h2>خلاصه سفارش</h2>
        <ul class="co-items">${items.map(({ p, q }) => `<li><span>${p.name} × ${fa(q)}</span><b>${fa(p.price * q)}</b></li>`).join("")}</ul>
        <div class="co-row"><span>جمع کالاها</span><b>${fa(total)} تومان</b></div>
        <div class="co-row"><span>هزینه ارسال</span><b class="free">رایگان</b></div>
        <div class="co-row total"><span>مبلغ قابل پرداخت</span><b>${fa(total)} تومان</b></div>
        <button class="btn-green wide" type="submit" form="coForm"><i class="fa-solid fa-check"></i> ثبت نهایی سفارش</button>
      </aside></div></div>`;
  const f = $("coForm");
  f.fullname.value = u.name; f.phone.value = u.phone;
  f.addEventListener("submit", e => {
    e.preventDefault();
    const phone = toEn(f.phone.value).trim(), err = $("coErr");
    if (f.fullname.value.trim().length < 3) err.textContent = "نام و نام خانوادگی را وارد کنید.";
    else if (!/^09\d{9}$/.test(phone)) err.textContent = "شماره موبایل معتبر نیست (مثل ۰۹۱۲۳۴۵۶۷۸۹).";
    else if (f.address.value.trim().length < 10) err.textContent = "آدرس را کامل‌تر بنویسید.";
    else if (!/^\d{10}$/.test(toEn(f.zip.value).trim())) err.textContent = "کد پستی باید ۱۰ رقم باشد.";
    else {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const pay = f.querySelector("input[name=pay]:checked").value;
      const bad = items.find(({ p }) => !storeSellable(storeOf(p.shopId)));
      if (bad) return void (err.textContent = `فروشگاه «${shopName(bad.p)}» فعلاً سفارش نمی‌پذیرد؛ «${bad.p.name}» را از سبد حذف کنید.`);
      const short = items.find(({ p, q }) => p.stock != null && p.stock < q);
      if (short) return void (err.textContent = `موجودی «${short.p.name}» کافی نیست.`);
      if (pay === "wallet" && !walletApply(u.phone, -total, "purchase", "پرداخت سفارش " + fd(code), "system", code))
        return void (err.textContent = "موجودی کیف پول کافی نیست.");
      const orders = read(ORDERS_KEY, []);
      orders.push({ code, date: new Date().toISOString(), user: u.phone, total, pay, paid: pay === "wallet", status: "pending",
        ship: { name: f.fullname.value.trim(), phone, city: f.city.value.trim(), address: f.address.value.trim(), zip: toEn(f.zip.value).trim() },
        items: items.map(({ p, q }) => ({ name: p.name, price: p.price, q, shopId: p.shopId })), subs: items.reduce((m, { p, q }) => { (m[p.shopId] = m[p.shopId] || { status: "pending", total: 0, settled: false, refunded: false, held: pay === "wallet" && !!getSellers()[p.shopId] }).total += p.price * q; return m; }, {}) });
      const sp = read(SPROD_KEY, []);
      items.forEach(({ p, q }) => { const x = sp.find(y => y.id === p.id); if (x && x.stock != null) x.stock = Math.max(0, x.stock - q); });
      write(SPROD_KEY, sp);
      write(ORDERS_KEY, orders);
      /* پول فروشنده‌ها: «در انتظار تحویل» و غیرقابل برداشت */
      Object.entries(orders[orders.length - 1].subs).forEach(([sid, sb]) => { if (sb.held) walletHold("store:" + sid, sb.total, "امانت سفارش " + fd(code), code); });
      cart = {}; saveCart(); renderCart();
      box.innerHTML = `<div class="shop-wrap co-done"><i class="fa-solid fa-circle-check"></i>
        <h1>سفارش شما ثبت شد</h1><p>کد پیگیری: <b>${fd(code)}</b></p>
        <p>${pay === "wallet" ? `مبلغ ${fa(total)} تومان از کیف پول شما کسر شد.` : `مبلغ ${fa(total)} تومان هنگام تحویل پرداخت می‌شود.`} فروشگاه برای هماهنگی ارسال با شما تماس می‌گیرد.</p>
        <a class="about-cta" href="index.html">بازگشت به فروشگاه</a></div>`;
      window.scrollTo(0, 0);
    }
  });
}

/* ---- وضعیت و دکمه‌های هر فروشگاه در سفارش مشتری (تحویل، مشکل، مرجوعی) ---- */
const RET_REASONS = ["کالا معیوب یا آسیب‌دیده است", "با توضیحات فروشگاه تفاوت دارد", "کالای اشتباه ارسال شده", "از خرید پشیمان شدم", "سایر"];
const subCls = st => (st === "delivered" ? "delivered" : st === "canceled" || st === "returned" ? "canceled" : st === "shipped" ? "shipped" : "pending");
function subBlock(o, sid, sb) {
  const btn = (cls, label) => ` <button class="add-btn ${cls}" type="button" data-code="${o.code}" data-sid="${sid}">${label}</button>`;
  const r = sb.ret, disputed = sb.dispute && sb.dispute.status === "open";
  let act = "";
  if (sb.status === "shipped") act = disputed ? " <small>— مشکل شما در حال بررسی پشتیبانی است</small>" : btn("conf", "تحویل گرفتم") + btn("disp", "مشکل دارم") + (autoLeft(sb) ? `<br><small>اگر تا ${fa(autoLeft(sb))} روز دیگر اقدامی نکنید، تحویل به‌صورت خودکار تأیید می‌شود.</small>` : "");
  else if (sb.status === "delivered" && !sb.settled && !sb.refunded) {
    if (!r) act = `<br><small>مهلت مرجوعی و گزارش مشکل: ${fa(returnDaysLeft(sb))} روز دیگر</small>` + (returnEligible(sb) ? btn("retreq", "درخواست مرجوعی") : "") + (disputed ? " <small>— مشکل شما در حال بررسی است</small>" : btn("disp", "مشکل دارم"));
    else if (r.status === "requested") act = "<br><small>درخواست مرجوعی شما ثبت شد و منتظر بررسی فروشنده است.</small>";
    else if (r.status === "approved") act = `<br><small>مرجوعی تأیید شد. کالا را برای فروشنده ارسال کنید و کد رهگیری را ثبت کنید.</small>${btn("retship", "ثبت کد رهگیری مرجوعی")}`;
    else if (r.status === "shipped_back") act = `<br><small>کالای مرجوعی در راه فروشنده است — ${esc(r.tracking.carrier)}، کد رهگیری <b dir="ltr">${esc(fd(r.tracking.code))}</b>. پس از دریافت، پول به کیف پول شما برمی‌گردد.</small>`;
    else if (r.status === "rejected") act = `<br><small>فروشنده مرجوعی را رد کرد: ${esc(r.rejectReason || "—")}</small>${btn("retesc", "ارجاع به پشتیبانی")}`;
    else if (r.status === "escalated") act = "<br><small>درخواست شما برای تصمیم نهایی نزد پشتیبانی است.</small>";
  } else if (sb.status === "returned") act = "<br><small>کالا مرجوع شد و مبلغ به کیف پول شما برگشت.</small>";
  return `<p class="o-ship"><i class="fa-solid fa-store"></i> ${esc((storeOf(sid) || { name: "فروشگاه" }).name)}: <span class="o-state st-${subCls(sb.status)}">${ORDER_ST[sb.status || "pending"]}</span>${sb.tracking ? ` <small>کد رهگیری: <b dir="ltr">${esc(fd(sb.tracking.code))}</b> (${esc(sb.tracking.carrier)})</small>` : ""}${act}</p>`;
}

/* ---- صفحه پروفایل ---- */
function renderProfile() {
  const u = session(), box = $("profileView");
  if (!u) return void (location.href = loginUrl("profile.html", true));
  const orders = read(ORDERS_KEY, []).filter(o => o.user === u.phone).reverse().map(ensureSubs);
  const mySel = sellerOf(u.phone);
  const spent = orders.reduce((s, o) => s + o.total, 0);
  const inCart = cartItems().reduce((s, x) => s + x.q, 0);
  const w = walletOf(u.phone), pendTop = read(TOPUPS_KEY, []).filter(t => t.user === u.phone && t.status === "pending").length;
  const sign = n => (n > 0 ? "+" : "−") + fa(Math.abs(n));
  box.innerHTML = `<div class="shop-wrap">
    <section class="wallet-hero" aria-label="کیف پول">
      <div class="glass wallet-glass">
        <div class="wl-top"><span class="wl-title"><i class="fa-solid fa-wallet"></i> کیف پول من</span>
          <a class="wl-help" href="support.html"><i class="fa-solid fa-headset"></i> مشکل در شارژ؟ پشتیبانی</a></div>
        <div class="wl-bal"><span>موجودی</span><b>${fa(w.balance)}</b><small>تومان</small></div>
        ${pendTop ? `<p class="wl-note"><i class="fa-solid fa-hourglass-half"></i> ${fa(pendTop)} درخواست شارژ در انتظار تأیید مدیر است.</p>` : ""}
        <div class="wl-actions"><button class="wl-charge" id="chargeBtn" type="button"><i class="fa-solid fa-plus"></i> شارژ کیف پول</button></div>
        <details class="wl-tx"><summary>تاریخچه تراکنش‌ها (${fa(w.tx.length)})</summary>
          ${w.tx.length ? `<ul>${w.tx.slice(0, 15).map(t => `<li><div><b>${TX_LABELS[t.type] || "تراکنش"}</b><small>${esc(t.note || "")} · ${new Date(t.date).toLocaleDateString("fa-IR")}</small></div><span class="${t.amount > 0 ? "plus" : "minus"}">${sign(t.amount)}</span></li>`).join("")}</ul>` : "<p>هنوز تراکنشی ندارید.</p>"}
        </details>
      </div>
    </section>
    <div class="pf-grid">
      <aside class="co-card pf-card">
        <div class="pf-avatar-box">
          <span class="pf-avatar" id="pfAvatar"></span>
          <div class="pf-av-btns">
            <label class="av-btn"><i class="fa-solid fa-camera"></i><span id="avLabel">افزودن عکس</span><input type="file" id="avInput" accept="image/*" hidden></label>
            <button type="button" class="av-del" id="avDel" hidden>حذف عکس</button>
          </div>
          <p class="form-err" id="avErr" role="alert"></p>
        </div>
        <h1>${esc(u.name)}</h1>
        <p class="pf-phone" dir="ltr">${fd(u.phone)}</p>
        <ul class="pf-stats">
          <li><b>${fa(orders.length)}</b><span>سفارش</span></li>
          <li><b>${fa(inCart)}</b><span>در سبد</span></li>
        </ul>
        <div class="pf-spent">مجموع خرید: <b>${fa(spent)}</b> تومان</div>
        <a class="btn-more" style="width:100%" href="seller.html"><i class="fa-solid fa-store"></i> ${mySel ? "پنل فروشگاه من" : "ساخت فروشگاه"}</a>
        <button class="btn-logout" id="logoutBtn" type="button"><i class="fa-solid fa-right-from-bracket"></i> خروج از حساب</button>
      </aside>
      <section>
        <h2 class="pf-h">سفارش‌های من</h2>
        ${orders.length ? orders.map(o => `
          <details class="order">
            <summary>
              <span>سفارش <b>${fd(o.code)}</b></span>
              <span class="o-date">${new Date(o.date).toLocaleDateString("fa-IR")}</span>
              <span class="o-state st-${o.status || "pending"}">${STATUS[o.status || "pending"]}</span>
              <b>${fa(o.total)} تومان</b>
            </summary>
            <ul class="co-items">${o.items.map(x => `<li><span>${esc(x.name)} × ${fa(x.q)}</span><b>${fa(x.price * x.q)}</b></li>`).join("")}</ul>
            <p class="o-ship"><i class="fa-solid fa-location-dot"></i> ${esc(o.ship.name)} · ${esc(o.ship.city)}، ${esc(o.ship.address)}${o.ship.zip ? ` · کد پستی ${fd(o.ship.zip)}` : ""}</p>
            ${Object.entries(o.subs).map(([sid, sb]) => subBlock(o, sid, sb)).join("")}
            <p class="o-ship"><i class="fa-solid fa-money-bill"></i> ${o.pay === "wallet" ? "پرداخت از کیف پول" : "پرداخت در محل"}</p>
          </details>`).join("") : '<div class="co-card pf-empty"><i class="fa-solid fa-box-open"></i><p>هنوز سفارشی ثبت نکرده‌اید.</p><a class="about-cta" href="index.html#products">دیدن محصولات</a></div>'}
      </section>
    </div></div>`;
  const paintAvatar = () => {
    const av = avatarOf(u.phone);
    $("pfAvatar").innerHTML = av ? `<img src="${av}" alt="عکس پروفایل">` : esc(u.name.trim()[0] || "؟");
    $("avLabel").textContent = av ? "تغییر عکس" : "افزودن عکس";
    $("avDel").hidden = !av;
    renderAuth();
  };
  const toAvatar = file => new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const im = new Image();
      im.onerror = rej;
      im.onload = () => {
        const s = 256, c = document.createElement("canvas"), m = Math.min(im.width, im.height);
        c.width = c.height = s;
        c.getContext("2d").drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, s, s);
        res(c.toDataURL("image/jpeg", 0.85));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
  $("avInput").addEventListener("change", async e => {
    const f = e.target.files[0], err = $("avErr");
    err.textContent = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return void (err.textContent = "فقط فایل تصویر قابل قبول است.");
    if (f.size > 8 * 1024 * 1024) return void (err.textContent = "حجم تصویر باید کمتر از ۸ مگابایت باشد.");
    try {
      const all = read(AVATAR_KEY, {});
      all[u.phone] = await toAvatar(f);
      write(AVATAR_KEY, all);
      paintAvatar();
    } catch { err.textContent = "این تصویر خوانده نشد. تصویر دیگری انتخاب کنید."; }
    e.target.value = "";
  });
  $("avDel").addEventListener("click", () => {
    const all = read(AVATAR_KEY, {});
    delete all[u.phone];
    write(AVATAR_KEY, all);
    paintAvatar();
  });
  paintAvatar();
  const act = (sel, fn) => box.querySelectorAll(sel).forEach(b => b.addEventListener("click", () => fn(b.dataset.code, b.dataset.sid)));
  const days = getSettings().returnDays;
  act(".conf", async (code, sid) => {
    const ok = await UI.confirm(`آیا کالا را تحویل گرفته‌اید؟${days ? `\n\nپس از تأیید تا ${fa(days)} روز می‌توانید در صورت مشکل کالا را مرجوع کنید. پول فروشنده بعد از پایان این مهلت پرداخت می‌شود.` : "\n\nپس از تأیید، مبلغ به فروشنده پرداخت می‌شود."}`, { title: "تأیید تحویل کالا", ok: "بله، تحویل گرفتم", icon: "box-open" });
    if (ok) { orderSetSub(code, sid, "delivered"); renderProfile(); }
  });
  act(".disp", async (code, sid) => {
    const v = await UI.form({ title: "گزارش مشکل", message: "مشکل را شرح دهید. تا بررسی پشتیبانی، پول به فروشنده پرداخت نمی‌شود.", icon: "circle-exclamation", tone: "amber", ok: "ثبت مشکل",
      fields: [{ name: "why", label: "شرح مشکل", type: "textarea", min: 5, placeholder: "مثلاً: کالا نرسید یا آسیب دیده است" }] });
    if (v) { orderOpenDispute(code, sid, v.why); renderProfile(); }
  });
  act(".retreq", async (code, sid) => {
    const v = await UI.form({ title: "درخواست مرجوعی", message: "دلیل مرجوعی را انتخاب کنید. پس از تأیید فروشنده، کالا را ارسال و کد رهگیری را ثبت می‌کنید.", icon: "rotate-left", ok: "ثبت درخواست مرجوعی",
      fields: [{ name: "why", label: "دلیل مرجوعی", type: "select", options: RET_REASONS }, { name: "more", label: "توضیحات (اختیاری)", type: "textarea" }] });
    if (v) { orderRequestReturn(code, sid, v.more ? `${v.why} — ${v.more}` : v.why); renderProfile(); }
  });
  act(".retship", async (code, sid) => {
    const v = await UI.form({ title: "ثبت کد رهگیری مرجوعی", message: "کالا را بسته‌بندی و با پست یا پیک برای فروشنده بفرستید، سپس کد رهگیری مرسوله را وارد کنید.", icon: "truck-fast", ok: "ثبت ارسال مرجوعی",
      fields: [{ name: "carrier", label: "روش ارسال", type: "select", options: ["پست پیشتاز", "تیپاکس", "پیک موتوری", "باربری", "سایر"] },
        { name: "code", label: "کد رهگیری مرسوله", dir: "ltr", required: true, validate: v => (/^[A-Za-z0-9-]{5,30}$/.test(v) ? "" : "کد رهگیری معتبر نیست (۵ تا ۳۰ حرف انگلیسی یا عدد).") }] });
    if (v) { orderReturnShip(code, sid, v.carrier, v.code); renderProfile(); }
  });
  act(".retesc", async (code, sid) => {
    if (await UI.confirm("درخواست شما برای تصمیم نهایی به پشتیبانی ارجاع داده می‌شود.", { title: "ارجاع به پشتیبانی", ok: "ارجاع بده", icon: "headset" })) { orderReturnEscalate(code, sid); renderProfile(); }
  });
  /* شارژ کیف پول */
  const cd = $("chargeDlg");
  $("chargeBtn").addEventListener("click", () => {
    const S = getSettings(), hasCard = S.cardNumber.replace(/\D/g, "").length >= 16, gw = Payment.enabled();
    cd.innerHTML = `<form id="chForm" novalidate><h3><i class="fa-solid fa-wallet"></i> شارژ کیف پول</h3>
      <label class="chl">مبلغ (تومان)<input name="amount" inputmode="numeric" placeholder="${fa(S.minCharge)}" autocomplete="off"></label>
      <div class="presets">${[100000, 200000, 500000, 1000000].map(v => `<button type="button" data-v="${v}">${fa(v)}</button>`).join("")}</div>
      ${gw ? `<p class="ch-note" style="background:var(--blue-soft);color:#0a4fa3">با زدن دکمه‌ی پرداخت به ${esc(S.gatewayName)} منتقل می‌شوید و پس از پرداخت، کیف پول شارژ می‌شود.</p>`
        : S.testMode ? '<p class="ch-note">حالت آزمایشی فعال است؛ شارژ بدون پرداخت واقعی و فوراً انجام می‌شود.</p>'
        : hasCard ? `<div class="cardbox"><span>مبلغ را به این کارت واریز کنید:</span><b dir="ltr">${cardFmt(S.cardNumber)}</b>${S.cardHolder ? `<small>به نام ${esc(S.cardHolder)}</small>` : ""}</div>
          <label class="chl">شماره پیگیری یا ۴ رقم آخر کارت مبدأ<input name="ref" autocomplete="off"></label>`
        : '<p class="ch-note">شارژ آنلاین فعلاً فعال نیست. لطفاً با پشتیبانی تماس بگیرید.</p>'}
      <p class="form-err" id="chErr" role="alert"></p>
      <div class="lg-btns">${gw || S.testMode || hasCard ? `<button class="add-btn big primary" type="submit">${gw ? "پرداخت آنلاین" : S.testMode ? "شارژ فوری (آزمایشی)" : "ثبت درخواست شارژ"}</button>` : '<a class="add-btn big primary" href="support.html">تماس با پشتیبانی</a>'}
        <button class="add-btn big" type="button" id="chNo">انصراف</button></div></form>`;
    const f = $("chForm");
    $("chNo").addEventListener("click", () => cd.close());
    f.querySelector(".presets").addEventListener("click", e => { const b = e.target.closest("button"); if (b) f.amount.value = b.dataset.v; });
    f.addEventListener("submit", ev => {
      ev.preventDefault();
      const amt = +toEn(f.amount.value).replace(/\D/g, ""), err = $("chErr");
      if (!amt || amt < S.minCharge || amt > S.maxCharge) return void (err.textContent = `مبلغ باید بین ${fa(S.minCharge)} تا ${fa(S.maxCharge)} تومان باشد.`);
      if (gw) { if (!Payment.start(amt, u)) err.textContent = "انتقال به درگاه انجام نشد. دوباره تلاش کنید."; return; }
      if (S.testMode) {
        if (!walletApply(u.phone, amt, "charge", "شارژ آزمایشی", "system")) return void (err.textContent = "ثبت تراکنش انجام نشد.");
        cd.close(); return renderProfile();
      }
      const ref = toEn(f.ref.value).trim();
      if (ref.length < 4) return void (err.textContent = "شماره پیگیری یا ۴ رقم آخر کارت را وارد کنید.");
      const t = read(TOPUPS_KEY, []);
      t.push({ id: "w" + Date.now().toString(36), user: u.phone, name: u.name, amount: amt, ref, date: new Date().toISOString(), status: "pending" });
      write(TOPUPS_KEY, t);
      cd.innerHTML = '<i class="fa-solid fa-circle-check lg-ico" style="color:#16a34a"></i><h3>درخواست ثبت شد</h3><p>پس از بررسی و تأیید مدیر، موجودی کیف پول شما شارژ می‌شود. اگر مشکلی بود از بخش پشتیبانی پیگیری کنید.</p><div class="lg-btns"><button class="add-btn big primary" id="chOk" type="button">باشه</button></div>';
      $("chOk").addEventListener("click", () => { cd.close(); renderProfile(); });
    });
    cd.showModal();
  });
  cd.addEventListener("click", e => { if (e.target === cd) cd.close(); });
  const ld = $("logoutDlg");
  $("logoutBtn").addEventListener("click", () => ld.showModal());
  $("logoutNo").addEventListener("click", () => ld.close());
  $("logoutYes").addEventListener("click", () => { localStorage.removeItem(SESSION_KEY); location.href = "index.html"; });
  ld.addEventListener("click", e => { if (e.target === ld) ld.close(); });
}

/* ---- صفحه‌های ورود و ثبت‌نام ---- */
function setupAuthPage(kind) {
  const next = safeNext(qs.get("next"));
  if (session()) return void location.replace(next);
  if (qs.get("need") && $("authNote")) $("authNote").hidden = false;
  document.querySelectorAll("a[data-auth-link]").forEach(a => (a.href = a.getAttribute("href") + location.search));
  const f = $("authForm"), err = $("authErr");
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const phone = toEn(f.phone.value).trim(), pass = f.password.value, users = read(USERS_KEY, {});
    if (!/^09\d{9}$/.test(phone)) return void (err.textContent = "شماره موبایل معتبر نیست (مثل ۰۹۱۲۳۴۵۶۷۸۹).");
    if (kind === "register") {
      const name = f.fullname.value.trim();
      if (name.length < 3) return void (err.textContent = "نام و نام خانوادگی را وارد کنید.");
      if (pass.length < 6) return void (err.textContent = "رمز عبور باید حداقل ۶ کاراکتر باشد.");
      if (pass !== f.password2.value) return void (err.textContent = "رمز عبور و تکرار آن یکسان نیستند.");
      if (users[phone]) return void (err.textContent = "با این شماره قبلاً ثبت‌نام شده است. وارد شوید.");
      users[phone] = { name, h: await hash(pass), joined: new Date().toISOString() };
      write(USERS_KEY, users);
      write(SESSION_KEY, { name, phone });
    } else {
      const u = users[phone];
      if (u && u.blocked) return void (err.textContent = "این حساب مسدود شده است.");
      if (!u || u.h !== await hash(pass)) return void (err.textContent = "شماره موبایل یا رمز عبور اشتباه است.");
      write(SESSION_KEY, { name: u.name, phone });
    }
    location.href = next;
  });
}

/* ---- صفحه پشتیبانی ---- */
function renderSupport() {
  const S = getSettings(), u = session(), box = $("supportView");
  const tel = "tel:+98" + toEn(S.supportPhone).replace(/\D/g, "").replace(/^0/, "");
  const tickets = () => read(TICKETS_KEY, []).filter(t => u && t.user === u.phone).sort((a, b) => b.date.localeCompare(a.date));
  const draw = () => {
    box.innerHTML = `<div class="shop-wrap"><h1 class="co-title">پشتیبانی</h1><div class="co-grid">
      <div class="sp-main">
        ${u ? `<form class="co-card" id="tkForm" novalidate><h2>ثبت درخواست پشتیبانی</h2>
          <p class="sp-hint">اگر پول از حساب شما کسر شده ولی کیف پول شارژ نشده، گزینه‌ی اول را انتخاب کنید و شماره پیگیری بانکی را بنویسید.</p>
          <label>موضوع<select name="cat">${Object.entries(T_CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
          <label id="tkAmt">مبلغ پرداخت‌شده (تومان)<input name="amount" inputmode="numeric"></label>
          <label id="tkRef">شماره پیگیری بانکی<input name="ref" autocomplete="off"></label>
          <label>شرح مشکل<textarea name="message" rows="4" maxlength="1000"></textarea></label>
          <p class="form-err" id="tkErr" role="alert"></p>
          <button class="add-btn big primary" type="submit">ارسال درخواست</button></form>`
        : `<div class="co-card"><h2>ثبت درخواست پشتیبانی</h2><p class="sp-hint">برای ثبت و پیگیری درخواست، ابتدا وارد حساب خود شوید.</p><a class="about-cta" href="${loginUrl(here(), true)}">ورود / ثبت‌نام</a></div>`}
        ${u ? `<h2 class="pf-h" style="margin-top:26px">درخواست‌های من</h2>${tickets().length ? tickets().map(t => `<details class="order"><summary><span>${fd(t.id)}</span><span>${T_CATS[t.cat]}</span><span class="o-state st-${t.status === "resolved" ? "delivered" : t.status === "closed" ? "canceled" : "pending"}">${T_ST[t.status]}</span></summary>
            <p class="o-ship">${esc(t.message)}${t.amount ? `<br>مبلغ: ${fa(t.amount)} تومان` : ""}${t.ref ? ` · پیگیری: ${esc(fd(t.ref))}` : ""}</p>
            ${t.replies.map(r => { const st = r.staffId ? read("shahrak_staff", {})[r.staffId] : null, av = st ? (st.avatar || (st.userPhone && avatarOf(st.userPhone)) || "") : "", nm = r.by === "admin" ? (r.name || (st && st.name) || "پشتیبانی") : "شما";
          return r.by === "admin" ? `<div class="tk-r admin"><div class="tk-who"><span class="tk-av">${av ? `<img src="${av}" alt="">` : esc(nm.trim()[0] || "پ")}</span><div><b>${esc(nm)}</b><small>ادمین پشتیبانی · ${new Date(r.date).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}</small></div></div><p>${esc(r.text)}</p></div>`
            : `<div class="tk-r user"><b>شما</b><p>${esc(r.text)}</p><small>${new Date(r.date).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}</small></div>`; }).join("")}
            ${t.status !== "closed" ? `<form class="tk-reply" data-id="${t.id}"><textarea rows="2" placeholder="پاسخ یا توضیح بیشتر…"></textarea><button class="add-btn" type="submit">ارسال</button></form>` : ""}</details>`).join("") : '<div class="co-card pf-empty"><p>هنوز درخواستی ثبت نکرده‌اید.</p></div>'}` : ""}
      </div>
      <aside class="co-card"><h2>تماس با پشتیبانی</h2>
        <ul class="sp-contact">
          <li><i class="fa-solid fa-phone"></i><a href="${tel}" dir="ltr">${esc(S.supportPhone)}</a></li>
          <li><i class="fa-solid fa-envelope"></i><a href="mailto:${esc(S.supportEmail)}" dir="ltr">${esc(S.supportEmail)}</a></li>
          <li><i class="fa-solid fa-clock"></i>${esc(S.supportHours)}</li>
          <li><i class="fa-solid fa-location-dot"></i>${esc(S.address)}</li></ul>
        <p class="sp-hint">در صورت بروز باگ یا اشکال در شارژ، درخواست را ثبت کنید تا مدیر بررسی و جبران کند.</p>
      </aside></div></div>`;
    const f = $("tkForm");
    if (f) {
      const sync = () => { const w = f.cat.value === "wallet"; $("tkAmt").hidden = !w; $("tkRef").hidden = !w; };
      f.cat.addEventListener("change", sync); sync();
    }
  };
  box.addEventListener("submit", e => {
    e.preventDefault();
    if (e.target.id === "tkForm") {
      const f = e.target, err = $("tkErr"), amount = +toEn(f.amount.value || "0").replace(/\D/g, ""), msg = f.message.value.trim();
      if (f.cat.value === "wallet" && !amount) return void (err.textContent = "مبلغ پرداخت‌شده را وارد کنید.");
      if (msg.length < 10) return void (err.textContent = "مشکل را کمی کامل‌تر شرح دهید.");
      const all = read(TICKETS_KEY, []);
      all.push({ id: String(Math.floor(100000 + Math.random() * 900000)), user: u.phone, name: u.name, cat: f.cat.value, amount: f.cat.value === "wallet" ? amount : 0, ref: toEn(f.ref.value || "").trim(), message: msg, date: new Date().toISOString(), status: "open", replies: [] });
      write(TICKETS_KEY, all); draw();
    } else if (e.target.classList.contains("tk-reply")) {
      const txt = e.target.querySelector("textarea").value.trim();
      if (!txt) return;
      const all = read(TICKETS_KEY, []), t = all.find(x => x.id === e.target.dataset.id);
      t.replies.push({ by: "user", text: txt, date: new Date().toISOString() });
      if (t.status === "resolved") t.status = "open";
      write(TICKETS_KEY, all); draw();
    }
  });
  draw();
}

/* ---- اطلاعات فوتر از تنظیمات مدیر ---- */
(function () {
  if (!localStorage.getItem("shahrak_settings")) return;
  const S = getSettings(), tel = "+98" + toEn(S.supportPhone).replace(/\D/g, "").replace(/^0/, "");
  const li = document.querySelector(".site-footer .contact li");
  if (li) li.innerHTML = li.querySelector("i").outerHTML + esc(S.address);
  const p = $("fsPhone"), m = $("fsMail"), h = $("fsHours");
  if (p) { p.href = "tel:" + tel; p.textContent = S.supportPhone; }
  if (m) { m.href = "mailto:" + S.supportEmail; m.textContent = S.supportEmail; }
  if (h) h.textContent = S.supportHours;
})();

({ home: renderHome, store: renderStore, product: renderProductPage, checkout: renderCheckout, profile: renderProfile, support: renderSupport, seller: () => window.renderSeller && window.renderSeller(), payresult: () => Payment.renderResult($("payView")),
   login: () => setupAuthPage("login"), register: () => setupAuthPage("register") })[page]();
