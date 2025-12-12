// ------------------------
// Belagavi Organics - Master JS
// ------------------------

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  const HEADER_HEIGHT = header ? header.offsetHeight : 80;

  // 1. GLOBAL SMOOTH NAV SCROLLING
  document.querySelectorAll("nav a[href^='#']").forEach(link => {
    link.addEventListener("click", e => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;
      const y = target.getBoundingClientRect().top + window.pageYOffset - HEADER_HEIGHT;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });

  // 2. HERO BUTTONS
  const exploreBtn = document.querySelector(".hero-buttons .primary");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      const products = document.querySelector("#products");
      if (!products) return;
      const y = products.getBoundingClientRect().top + window.pageYOffset - HEADER_HEIGHT;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  }

  // 3. DOWNLOAD BUTTONS
  document.querySelectorAll(".download-btn").forEach(button => {
    button.addEventListener("click", e => {
      e.preventDefault();
      const file = button.dataset.file || "catalog/catalog.pdf";
      const filename = button.dataset.filename || "Belagavi_Organics_Catalog.pdf";
      const a = document.createElement("a");
      a.href = file;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  });

  // 4. Load offers from sheet (multiple boxes)
  loadOffersFromSheet();
});

// COMMON WHATSAPP FUNCTION
const WHATSAPP_NUMBER = "918884063030";
function openWhatsApp(message) {
  const encodedMessage = encodeURIComponent(message || "");
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  const baseUrl = isMobile ? "https://api.whatsapp.com/send?phone=" : "https://web.whatsapp.com/send?phone=";
  const url = baseUrl + WHATSAPP_NUMBER + "&text=" + encodedMessage;
  window.location.href = url;
}

// CATEGORY REDIRECT
function openCategory(page) {
  if (!page) return;
  window.location.href = page;
}

// SHEET CONSTANTS
const SHEET_ID = "1Bj8I0emuVaQ3UwhWdBdGrEgIgJRBM4GHjaYCjcPICmA";
const PRODUCTS_SHEET_NAME = "sheet 1";
const OFFERS_SHEET_NAME = "Offers";
const URL_PRODUCTS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(PRODUCTS_SHEET_NAME)}`;
const URL_OFFERS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(OFFERS_SHEET_NAME)}`;

// PRODUCTS loader (call loadProducts('pickels','productGrid') etc)
async function loadProducts(category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error("loadProducts: container not found:", containerId);
    return;
  }
  container.innerHTML = "<p style='text-align:center;'>Loading products...</p>";
  try {
    const res = await fetch(URL_PRODUCTS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const json = JSON.parse(jsonStr);
    const rows = json.table.rows || [];
    container.innerHTML = "";
    let count = 0;
    rows.forEach(row => {
      const c = row.c || [];
      if (!c[0] || !c[0].v) return;
      const rowCategory = String(c[0].v).trim().toLowerCase();
      if (rowCategory !== category.toLowerCase()) return;
      const name = c[1]?.v || "";
      const price = c[2]?.v || "";
      const unit = c[3]?.v || "";
      const desc = c[4]?.v || "";
      const img = c[5]?.v || "";
      const availability = (c[6]?.v || "Available").toString().toLowerCase();
      const isAvailable = availability !== "out of stock";
      const card = document.createElement("div");
      card.className = "product-card";
      const priceHtml = price ? `₹${price}${unit ? " / " + unit : ""}` : "Contact for price";
      card.innerHTML = `
        <img src="images/${img}" alt="${escapeHtml(name)}">
        <h3>${escapeHtml(name)}</h3>
        <div class="price">${escapeHtml(priceHtml)}</div>
        <p class="desc">${escapeHtml(desc)}</p>
        ${isAvailable ? '<button class="buy-btn">Buy Now</button>' : '<div class="out-of-stock">Out of Stock</div>'}
      `;
      if (isAvailable) {
        const btn = card.querySelector(".buy-btn");
        btn.addEventListener("click", () => {
          const pageHeading = document.querySelector("section h2")?.innerText || "Products";
          let message = `Namaste,\n\nI am interested in "${name}"`;
          if (price) message += ` (₹${price}${unit ? " / " + unit : ""})`;
          message += ` from Belagavi Organics (${pageHeading}).\n\nPlease share full product details.\nI will then confirm the quantity and share my delivery address.\n\nContact Person: Maruti Mellikeri`;
          openWhatsApp(message);
        });
      }
      container.appendChild(card);
      count++;
    });
    if (count === 0) container.innerHTML = "<p style='text-align:center;'>No products found for this category.</p>";
  } catch (err) {
    console.error("loadProducts error:", err);
    container.innerHTML = "<p style='text-align:center;color:red;'>Failed to load products. Please try again later.</p>";
  }
}

// OFFERS loader — creates one offer-box per active row
async function loadOffersFromSheet() {
  const container = document.getElementById("offers-container");
  if (!container) {
    // Backwards-compatible: if container not present, try existing static offer elements
    const staticImg = document.getElementById("offer-image");
    if (staticImg) {
      // still attempt to update the single static offer (optional)
      try {
        const res = await fetch(URL_OFFERS);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
        const json = JSON.parse(jsonStr);
        const rows = json.table.rows || [];
        // find first active row
        const active = rows.find(r => ((r.c?.[0]?.v || "").toString().trim().toLowerCase()) === "yes");
        if (!active) return;
        const c = active.c || [];
        const title = c[1]?.v || "";
        const desc = c[2]?.v || "";
        const img = c[3]?.v || "";
        const target = c[4]?.v || "";
        if (title) document.getElementById("offer-title").textContent = title;
        if (desc) document.getElementById("offer-desc").textContent = desc;
        if (img) {
          staticImg.src = "images/" + img;
          staticImg.alt = title || "Special Offer";
        }
        if (target) {
          // attach click to static button if present
          const btn = document.getElementById("offer-btn");
          if (btn) {
            btn.addEventListener("click", () => window.location.href = target);
          }
        }
      } catch (e) {
        console.error("loadOffersFromSheet (fallback) error:", e);
      }
    }
    return;
  }

  container.innerHTML = "<p style='text-align:center;'>Loading offers...</p>";

  try {
    const res = await fetch(URL_OFFERS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const json = JSON.parse(jsonStr);
    const rows = json.table.rows || [];
    container.innerHTML = "";
    let created = 0;

    rows.forEach(row => {
      const c = row.c || [];
      const active = (c[0]?.v || "").toString().trim().toLowerCase();
      if (active !== "yes") return;
      const title = c[1]?.v || "";
      const desc = c[2]?.v || "";
      const img = c[3]?.v || "";
      const target = c[4]?.v || "";

      const box = document.createElement("div");
      box.className = "offer-box";
      box.innerHTML = `
        <img src="images/${escapeHtml(img)}" alt="${escapeHtml(title) || "Offer"}">
        <div class="offer-content">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(desc)}</p>
          <button class="offer-btn">Grab Now</button>
        </div>
      `;
      const btn = box.querySelector(".offer-btn");
      btn.addEventListener("click", () => {
        if (target) window.location.href = target;
        else {
          const products = document.querySelector("#products");
          if (!products) return;
          const header = document.querySelector("header");
          const H = header ? header.offsetHeight : 80;
          const y = products.getBoundingClientRect().top + window.pageYOffset - H;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      });

      container.appendChild(box);
      created++;
    });

    if (created === 0) container.innerHTML = ""; // no active offers
  } catch (err) {
    console.error("loadOffersFromSheet error:", err);
    container.innerHTML = ""; // keep minimal fallback UI
  }
}

// small helper to escape text inserted into HTML (basic)
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
