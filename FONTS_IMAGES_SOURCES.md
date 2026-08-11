# 使用字體與圖片來源對照表 — 暖麥烘焙教室

> ⚠️ **目前為 mock 版本。** 所有圖片皆為本專案自製的 SVG 佔位圖，
> 待甲方提供正式 Figma 設計稿後，逐列替換為實際匯出檔案並更新本表。
> 交件前本表不得留有「佔位」「待換」字樣。

---

## 一、字體

| 字體 | 用途 | 來源 | 授權 | 費用 |
|---|---|---|---|---|
| Noto Sans TC | 內文、表單、課程卡、篩選欄 | [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+TC) | SIL Open Font License 1.1 | 免費，可商用 |

**退回字體：** 襯線 Songti TC / PMingLiU / Georgia;無襯線 PingFang TC / Microsoft JhengHei。

> **待確認：** 若甲方 Figma 指定付費中文字型，需由甲方提供授權證明或另行採購，
> 本專案不代為承擔授權責任。

---

## 二、圖片

所有圖片皆為自行繪製的 SVG 向量檔，無第三方素材、無授權疑慮。

| 檔案 | 用途 | 比例 | 來源 | 授權 |
|---|---|---|---|---|
| `assets/brand/logo.svg` | Logo（麥穗標誌） | 1:1 | 自製佔位 | 待換為甲方正式 Logo |
| `assets/images/hero.svg` | 首頁主視覺 | 3:2 | 自製佔位 | 待換為 Figma 匯出 |
| `assets/images/course-main.svg` | 課程內頁主圖 | 16:9 | 自製佔位 | 待換為 Figma 匯出 |
| `assets/images/course-1.svg` | 課程縮圖：麵包 / 吐司 | 4:3 | 自製佔位 | 待換為 Figma 匯出 |
| `assets/images/course-2.svg` | 課程縮圖：蛋糕 | 4:3 | 自製佔位 | 待換為 Figma 匯出 |
| `assets/images/course-3.svg` | 課程縮圖：餅乾 | 4:3 | 自製佔位 | 待換為 Figma 匯出 |
| `assets/images/course-4.svg` | 課程縮圖：塔派 | 4:3 | 自製佔位 | 待換為 Figma 匯出 |
| `assets/images/course-5.svg` | 課程縮圖：可頌 / 千層 | 4:3 | 自製佔位 | 待換為 Figma 匯出 |
| `assets/images/course-6.svg` | 課程縮圖：免烤甜點 | 4:3 | 自製佔位 | 待換為 Figma 匯出 |
| `assets/images/instructor.svg` | 講師頭像 | 1:1 | 自製佔位 | **需甲方提供真實照片與肖像使用同意** |

> **注意：** 講師頭像涉及肖像權。正式版若使用真人照片，需由甲方確認已取得
> 講師本人的網路公開使用同意。

---

## 三、圖示(Icon)

| 位置 | 數量 | 來源 | 授權 |
|---|---|---|---|
| 首頁分類快選 | 6 | 自製 inline SVG(24×24,stroke 1.7) | 自製，無限制 |
| 首頁教室特色 | 4 | 自製 inline SVG | 自製，無限制 |
| 篩選欄搜尋圖示 | 1 | 自製 inline SVG | 自製，無限制 |

全部為自行繪製的線條圖示，未使用任何第三方圖示庫（未引入 Font Awesome、
Material Icons 等），因此無需標註出處或遵守額外授權條款。

---

## 四、替換流程（收到正式 Figma 後）

1. Figma 匯出：照片類 2x JPG、Logo 與圖示 Copy as SVG
2. 以**相同檔名**放入 `assets/` 對應資料夾（副檔名不同時同步修改各 HTML 的 `src`）
3. 每張圖在 HTML 中皆已標註 `width` / `height` 與 `alt`,版面不需調整
4. 課程縮圖在四個頁面重複使用，替換時請以全域搜尋確認全部更新：
   - `course-1.svg` 出現於 `index.html`、`courses.html`(×2)、`course.html`
   - `course-2.svg` 出現於 `index.html`、`courses.html`(×2)
   - `course-5.svg` 出現於 `index.html`、`courses.html`(×2)、`course.html`
5. 逐列更新本表的「來源」與「授權」欄位
6. 確認無「佔位」「待換」字樣後再交件
