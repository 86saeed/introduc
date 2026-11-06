/* پنجره‌های پیام استایل‌دار (جایگزین alert / confirm / prompt مرورگر)
   UI.alert(msg, {title, tone})            → Promise<true>
   UI.confirm(msg, {title, ok, cancel, danger, html}) → Promise<boolean>
   UI.form({title, message, fields, ok, danger})      → Promise<{name: value}|null>
   UI.prompt(msg, {label, minLen, multiline, ...})    → Promise<string|null>
   field: {name, label, type:"text"|"textarea"|"select", options:[...], required, min, value, placeholder, dir, hint, validate(v)→"خطا"} */
const UI = (() => {
  const CSS = `
  .uidlg{ position:fixed; inset:0; margin:auto; height:fit-content; max-height:92vh; overflow-y:auto; width:min(430px,92vw); padding:26px 24px 22px;
    border:0; border-radius:24px; background:#fff; color:#0f1b2d; text-align:center; font-family:inherit; line-height:1.8;
    box-shadow:0 30px 80px rgba(15,27,45,.38); animation:uiPop .18s ease-out; }
  .uidlg::backdrop{ background:rgba(15,27,45,.5); -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px); }
  @keyframes uiPop{ from{ transform:scale(.94); opacity:0; } to{ transform:none; opacity:1; } }
  .uidlg .ui-ico{ width:62px; height:62px; margin:0 auto 10px; border-radius:50%; display:grid; place-items:center; font-size:26px; }
  .uidlg .ui-blue{ background:#e7f1ff; color:#087cff; } .uidlg .ui-red{ background:#ffe3e3; color:#e5484d; } .uidlg .ui-green{ background:#dcf7e6; color:#16a34a; } .uidlg .ui-amber{ background:#fff4d6; color:#b7791f; }
  .uidlg h3{ margin:0 0 6px; font-size:1.2rem; font-weight:800; }
  .uidlg .ui-msg{ margin:0 0 14px; color:#5d6b7e; font-size:14.5px; white-space:pre-line; overflow-wrap:anywhere; }
  .uidlg .ui-fields{ display:grid; gap:12px; text-align:right; margin-bottom:6px; }
  .uidlg label{ display:grid; gap:5px; font-size:13.5px; color:#5d6b7e; }
  .uidlg input,.uidlg select,.uidlg textarea{ width:100%; box-sizing:border-box; padding:11px 13px; border:1px solid #e3eaf3; border-radius:12px; font:inherit; color:#0f1b2d; background:#fff; }
  .uidlg input:focus,.uidlg select:focus,.uidlg textarea:focus{ outline:3px solid #cfe3ff; border-color:#087cff; }
  .uidlg .ui-hint{ font-size:12.5px; color:#8a97a8; }
  .uidlg .ui-err{ margin:6px 0 0; min-height:1.3em; color:#e5484d; font-size:13.5px; text-align:right; }
  .uidlg .ui-btns{ display:grid; gap:8px; margin-top:8px; }
  .uidlg button{ padding:12px 16px; border-radius:13px; font:inherit; font-weight:700; cursor:pointer; border:1px solid #e3eaf3; background:#fff; color:#0f1b2d; }
  .uidlg button:hover{ border-color:#087cff; color:#087cff; }
  .uidlg .ui-ok{ background:#087cff; border-color:#087cff; color:#fff; box-shadow:0 8px 20px rgba(8,124,255,.25); } .uidlg .ui-ok:hover{ background:#0064d9; color:#fff; }
  .uidlg .ui-ok.danger{ background:#e5484d; border-color:#e5484d; box-shadow:0 8px 20px rgba(229,72,77,.25); } .uidlg .ui-ok.danger:hover{ background:#c93a3f; color:#fff; }
  .uidlg button:focus-visible{ outline:3px solid #9cc8ff; outline-offset:2px; }
  @media (prefers-reduced-motion:reduce){ .uidlg{ animation:none; } }`;
  const esc = s => String(s).replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
  const toEn = s => String(s).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  function show(o) {
    if (!document.getElementById("ui-style")) { const st = document.createElement("style"); st.id = "ui-style"; st.textContent = CSS; document.head.appendChild(st); }
    return new Promise(res => {
      const d = document.createElement("dialog"), fields = o.fields || [], tone = o.tone || (o.danger ? "red" : "blue");
      const icon = o.icon || (tone === "red" ? "triangle-exclamation" : tone === "green" ? "circle-check" : tone === "amber" ? "circle-exclamation" : "circle-info");
      d.className = "uidlg";
      d.setAttribute("aria-labelledby", "ui-t");
      d.innerHTML = `<form novalidate><div class="ui-ico ui-${tone}" aria-hidden="true"><i class="fa-solid fa-${icon}"></i></div>
        <h3 id="ui-t">${esc(o.title || "پیام")}</h3>${o.message ? `<p class="ui-msg">${o.html ? o.message : esc(o.message)}</p>` : ""}
        ${fields.length ? `<div class="ui-fields">${fields.map(f => `<label>${esc(f.label || "")}${f.type === "textarea" ? `<textarea name="${f.name}" rows="3" placeholder="${esc(f.placeholder || "")}">${esc(f.value || "")}</textarea>`
          : f.type === "select" ? `<select name="${f.name}">${f.options.map(op => `<option>${esc(op)}</option>`).join("")}</select>`
          : `<input name="${f.name}" value="${esc(f.value || "")}" placeholder="${esc(f.placeholder || "")}" autocomplete="off" ${f.dir ? `dir="${f.dir}" style="text-align:right"` : ""}>`}${f.hint ? `<span class="ui-hint">${esc(f.hint)}</span>` : ""}</label>`).join("")}</div>` : ""}
        <p class="ui-err" role="alert"></p>
        <div class="ui-btns"><button type="submit" class="ui-ok ${o.danger ? "danger" : ""}">${esc(o.ok || "تأیید")}</button>${o.showCancel === false ? "" : `<button type="button" class="ui-cancel">${esc(o.cancel || "انصراف")}</button>`}</div></form>`;
      document.body.appendChild(d);
      const form = d.firstElementChild;
      const done = v => { d.close(); d.remove(); res(v); };
      form.addEventListener("submit", e => {
        e.preventDefault();
        const vals = {};
        for (const f of fields) {
          let v = (form.elements[f.name].value || "").trim();
          if (f.type !== "select" && f.dir === "ltr") v = toEn(v);
          if ((f.required || f.min) && !v) return void (d.querySelector(".ui-err").textContent = `«${f.label}» را وارد کنید.`);
          if (f.min && v.length < f.min) return void (d.querySelector(".ui-err").textContent = `«${f.label}» باید حداقل ${f.min} کاراکتر باشد.`);
          const bad = f.validate && f.validate(v);
          if (bad) return void (d.querySelector(".ui-err").textContent = bad);
          vals[f.name] = v;
        }
        done(fields.length ? vals : true);
      });
      const cancel = d.querySelector(".ui-cancel");
      if (cancel) cancel.addEventListener("click", () => done(fields.length ? null : false));
      d.addEventListener("cancel", e => { e.preventDefault(); done(fields.length ? null : (o.showCancel === false ? true : false)); });
      d.addEventListener("click", e => { if (e.target === d && o.showCancel !== false) done(fields.length ? null : false); });
      d.showModal();
      const first = form.querySelector("input,textarea,select") || form.querySelector(".ui-ok");
      if (first) first.focus();
    });
  }
  return {
    alert: (message, o = {}) => show({ title: "پیام", tone: "blue", ...o, message, ok: o.ok || "باشه", showCancel: false }),
    confirm: (message, o = {}) => show({ title: "مطمئنید؟", icon: o.danger ? "triangle-exclamation" : "circle-question", tone: o.danger ? "red" : "blue", ...o, message }),
    form: o => show(o),
    prompt: async (message, o = {}) => {
      const r = await show({ title: o.title || "لطفاً وارد کنید", ...o, message, fields: [{ name: "v", label: o.label || "", type: o.multiline ? "textarea" : "text", placeholder: o.placeholder, required: o.required !== false, min: o.minLen, value: o.value, dir: o.dir }] });
      return r ? r.v : null;
    }
  };
})();
