'use client';
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Button: () => Button,
  CategoryPill: () => CategoryPill,
  ProductCard: () => ProductCard,
  SearchBar: () => SearchBar,
  StockBadge: () => StockBadge
});
module.exports = __toCommonJS(index_exports);

// src/components/Button.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function Button({ children, onClick, variant = "primary" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick, "data-variant": variant, children });
}

// src/components/StockBadge.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function StockBadge({ stockQuantity }) {
  let label;
  let color;
  if (stockQuantity === 0) {
    label = "Out of Stock";
    color = "#dc2626";
  } else if (stockQuantity <= 5) {
    label = "Low Stock";
    color = "#d97706";
  } else {
    label = "In Stock";
    color = "#16a34a";
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "span",
    {
      "data-testid": "stock-badge",
      style: {
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#fff",
        backgroundColor: color
      },
      children: label
    }
  );
}

// src/components/ProductCard.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function defaultFormatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}
function ProductCard({ product, formatPrice = defaultFormatPrice, onClick }) {
  const primaryImage = product.images[0];
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      "data-testid": "product-card",
      onClick: () => onClick?.(product.id),
      role: "article",
      style: { cursor: onClick ? "pointer" : "default" },
      children: [
        primaryImage && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "img",
          {
            src: primaryImage.url,
            alt: primaryImage.alt ?? product.name,
            style: { width: "100%", aspectRatio: "1", objectFit: "cover" }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: product.name }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { "data-testid": "product-price", children: formatPrice(product.price) }),
            product.compareAtPrice && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { "data-testid": "compare-price", style: { textDecoration: "line-through", marginLeft: "8px", color: "#9ca3af" }, children: formatPrice(product.compareAtPrice) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(StockBadge, { stockQuantity: product.stockQuantity })
        ] })
      ]
    }
  );
}

// src/components/CategoryPill.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function CategoryPill({ category, isActive = false, onClick }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "button",
    {
      "data-testid": "category-pill",
      "aria-pressed": isActive,
      onClick: () => onClick?.(category.id),
      style: {
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "9999px",
        fontSize: "0.875rem",
        fontWeight: 500,
        border: "1px solid #d1d5db",
        backgroundColor: isActive ? "#1f2937" : "#fff",
        color: isActive ? "#fff" : "#374151",
        cursor: "pointer"
      },
      children: category.name
    }
  );
}

// src/components/SearchBar.tsx
var import_react = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
function SearchBar({ value = "", onSearch, placeholder = "Search products...", debounceMs = 300 }) {
  const [inputValue, setInputValue] = (0, import_react.useState)(value);
  const timerRef = (0, import_react.useRef)(void 0);
  (0, import_react.useEffect)(() => {
    setInputValue(value);
  }, [value]);
  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onSearch(newValue);
    }, debounceMs);
  };
  (0, import_react.useEffect)(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "input",
    {
      "data-testid": "search-bar",
      type: "search",
      value: inputValue,
      onChange: handleChange,
      placeholder,
      style: {
        width: "100%",
        padding: "8px 12px",
        borderRadius: "8px",
        border: "1px solid #d1d5db",
        fontSize: "0.875rem"
      }
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Button,
  CategoryPill,
  ProductCard,
  SearchBar,
  StockBadge
});
