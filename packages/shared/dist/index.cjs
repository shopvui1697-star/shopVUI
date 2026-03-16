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
  findFirstImageUrl: () => findFirstImageUrl,
  formatCurrency: () => formatCurrency,
  isImageUrl: () => isImageUrl
});
module.exports = __toCommonJS(index_exports);

// src/utils/currency.ts
function formatCurrency(amount, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount / 100);
}

// src/utils/media.ts
var VIDEO_FILE_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov"];
var VIDEO_HOSTS = ["youtube.com", "youtu.be", "vimeo.com"];
function isImageUrl(url) {
  const lower = url.toLowerCase();
  const path = lower.split("?")[0];
  if (VIDEO_FILE_EXTENSIONS.some((ext) => path.endsWith(ext))) return false;
  if (VIDEO_HOSTS.some((host) => lower.includes(host))) return false;
  return true;
}
function findFirstImageUrl(images) {
  return images.find((img) => isImageUrl(img.url))?.url ?? null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  findFirstImageUrl,
  formatCurrency,
  isImageUrl
});
