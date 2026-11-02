// Vanilla JS UI. All data comes from the REST API under /api.
const app = document.getElementById("app");
const searchInput = document.getElementById("q");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path) {
  const res = await fetch("/api" + path);
  if (!res.ok) {
    let detail = res.statusText;
    try { const body = await res.json(); detail = typeof body.detail === "string" ? body.detail : "Invalid request"; } catch {}
    const err = new Error(detail); err.status = res.status; throw err;
  }
  return res.json();
}

function stockTag(p) {
  if (!p.in_stock) return '<span class="tag out">Out of stock</span>';
  if (p.stock <= 10) return `<span class="tag low">Only ${p.stock} left</span>`;
  return '<span class="tag ok">In stock</span>';
}

// ---- Listing view -------------------------------------------------------
// Filter state lives in the URL hash (#/?q=lamp&category=desk) so views are linkable.
function listParams() {
  const qs = location.hash.split("?")[1] || "";
  return new URLSearchParams(qs);
}

async function renderList() {
  const params = listParams();
  searchInput.value = params.get("q") || "";
  app.innerHTML = '<div class="state">Loading products…</div>';
  try {
    const query = new URLSearchParams(params);
    query.set("page_size", "8");
    const [cats, data] = await Promise.all([api("/categories"), api("/products?" + query)]);
    const page = data.page;
    const sort = params.get("sort") || "name";
    const cat = params.get("category") || "";
    const title = cat ? cats.find((c) => c.slug === cat)?.name || "Products" : "All products";

    app.innerHTML = `
      <div class="layout">
        <form class="filters" id="filters" aria-label="Filters">
          <h2>Filter</h2>
          <fieldset><legend>Category</legend>
            <label><span><input type="radio" name="category" value="" ${cat ? "" : "checked"}> All</span></label>
            ${cats.map((c) => `<label><span><input type="radio" name="category" value="${esc(c.slug)}" ${cat === c.slug ? "checked" : ""}> ${esc(c.name)}</span><span class="count">${c.product_count}</span></label>`).join("")}
          </fieldset>
          <fieldset><legend>Price (USD)</legend>
            <div class="range">
              <input type="number" min="0" step="1" name="min_price" placeholder="Min" aria-label="Minimum price" value="${esc(params.get("min_price") || "")}">
              <input type="number" min="0" step="1" name="max_price" placeholder="Max" aria-label="Maximum price" value="${esc(params.get("max_price") || "")}">
            </div>
          </fieldset>
          <fieldset><label><span><input type="checkbox" name="in_stock" value="true" ${params.get("in_stock") ? "checked" : ""}> In stock only</span></label></fieldset>
          <button type="button" class="linkbtn" id="clear">Clear filters</button>
        </form>
        <section>
          <div class="bar">
            <h1>${esc(title)} <span class="tag" style="color:var(--muted)">(${data.total})</span></h1>
            <label>Sort <select id="sort">
              ${[["name", "Name"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"], ["newest", "Newest"]]
                .map(([v, l]) => `<option value="${v}" ${sort === v ? "selected" : ""}>${l}</option>`).join("")}
            </select></label>
          </div>
          ${data.items.length ? `<div class="grid">${data.items.map(card).join("")}</div>` : emptyState()}
          ${data.total_pages > 1 ? `<nav class="pager" aria-label="Pagination">
            <button class="btn" id="prev" ${page <= 1 ? "disabled" : ""}>Previous</button>
            <span>Page ${page} of ${data.total_pages}</span>
            <button class="btn" id="next" ${page >= data.total_pages ? "disabled" : ""}>Next</button></nav>` : ""}
        </section>
      </div>`;
    wireList(params, page);
  } catch (e) {
    showError(e);
  }
}

const card = (p) => `
  <a class="card" href="#/product/${p.id}">
    <img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">
    <div class="body">
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.description)}</p>
      ${stockTag(p)}
      <div class="price">${money.format(p.price)}</div>
    </div>
  </a>`;

const emptyState = () => `<div class="state"><h2>No products match</h2><p>Try a different search, or clear the filters.</p></div>`;

function wireList(params, page) {
  const form = document.getElementById("filters");
  const apply = () => {
    const p = new URLSearchParams(params);
    p.delete("page");
    const fd = new FormData(form);
    for (const k of ["category", "min_price", "max_price", "in_stock"]) {
      const v = fd.get(k);
      v ? p.set(k, v) : p.delete(k);
    }
    location.hash = "#/?" + p;
  };
  form.addEventListener("change", apply);
  form.addEventListener("submit", (e) => { e.preventDefault(); apply(); });
  document.getElementById("clear").onclick = () => {
    const p = new URLSearchParams(); if (params.get("q")) p.set("q", params.get("q"));
    location.hash = "#/?" + p;
  };
  document.getElementById("sort").onchange = (e) => {
    const p = new URLSearchParams(params); p.delete("page"); p.set("sort", e.target.value);
    location.hash = "#/?" + p;
  };
  const go = (n) => { const p = new URLSearchParams(params); p.set("page", n); location.hash = "#/?" + p; };
  document.getElementById("prev")?.addEventListener("click", () => go(page - 1));
  document.getElementById("next")?.addEventListener("click", () => go(page + 1));
}

// ---- Detail view --------------------------------------------------------
async function renderDetail(id) {
  app.innerHTML = '<div class="state">Loading product…</div>';
  try {
    const p = await api("/products/" + encodeURIComponent(id));
    document.title = `${p.name} · Hearth & Desk`;
    app.innerHTML = `
      <p class="crumbs"><a href="#/">All products</a> / <a href="#/?category=${esc(p.category.slug)}">${esc(p.category.name)}</a> / ${esc(p.name)}</p>
      <article class="detail">
        <img src="${esc(p.image_url)}" alt="${esc(p.name)}">
        <div>
          <h1>${esc(p.name)}</h1>
          <div class="price">${money.format(p.price)}</div>
          ${stockTag(p)}
          <p>${esc(p.description)}</p>
          <dl class="facts">
            <dt>Category</dt><dd>${esc(p.category.name)}</dd>
            <dt>Availability</dt><dd>${p.in_stock ? p.stock + " units" : "Currently unavailable"}</dd>
            <dt>Product ID</dt><dd>#${p.id}</dd>
          </dl>
          <a href="#/" class="linkbtn">← Back to all products</a>
        </div>
      </article>`;
  } catch (e) {
    showError(e);
  }
}

function showError(e) {
  const notFound = e.status === 404;
  app.innerHTML = `<div class="state"><h2>${notFound ? "Product not found" : "Something went wrong"}</h2>
    <p>${esc(notFound ? "That product doesn't exist or was removed." : e.message)}</p><p><a href="#/">Back to all products</a></p></div>`;
}

// ---- Router -------------------------------------------------------------
function route() {
  document.title = "Hearth & Desk";
  const m = location.hash.match(/^#\/product\/(\d+)/);
  m ? renderDetail(m[1]) : renderList();
}
document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const p = listParams(); p.delete("page");
  searchInput.value.trim() ? p.set("q", searchInput.value.trim()) : p.delete("q");
  location.hash = "#/?" + p;
});
window.addEventListener("hashchange", route);
route();
