'use client';

// src/components/Button.tsx
import { jsx } from "react/jsx-runtime";
function Button({ children, onClick, variant = "primary" }) {
  return /* @__PURE__ */ jsx("button", { onClick, "data-variant": variant, children });
}

// src/components/StockBadge.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx2(
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
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function defaultFormatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}
function ProductCard({ product, formatPrice = defaultFormatPrice, onClick }) {
  const primaryImage = product.images[0];
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-testid": "product-card",
      onClick: () => onClick?.(product.id),
      role: "article",
      style: { cursor: onClick ? "pointer" : "default" },
      children: [
        primaryImage && /* @__PURE__ */ jsx3(
          "img",
          {
            src: primaryImage.url,
            alt: primaryImage.alt ?? product.name,
            style: { width: "100%", aspectRatio: "1", objectFit: "cover" }
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx3("h3", { children: product.name }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx3("span", { "data-testid": "product-price", children: formatPrice(product.price) }),
            product.compareAtPrice && /* @__PURE__ */ jsx3("span", { "data-testid": "compare-price", style: { textDecoration: "line-through", marginLeft: "8px", color: "#9ca3af" }, children: formatPrice(product.compareAtPrice) })
          ] }),
          /* @__PURE__ */ jsx3(StockBadge, { stockQuantity: product.stockQuantity })
        ] })
      ]
    }
  );
}

// src/components/CategoryPill.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
function CategoryPill({ category, isActive = false, onClick }) {
  return /* @__PURE__ */ jsx4(
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
import { useState, useEffect, useRef } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
function SearchBar({ value = "", onSearch, placeholder = "Search products...", debounceMs = 300 }) {
  const [inputValue, setInputValue] = useState(value);
  const timerRef = useRef(void 0);
  useEffect(() => {
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
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  return /* @__PURE__ */ jsx5(
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
export {
  Button,
  CategoryPill,
  ProductCard,
  SearchBar,
  StockBadge
};
