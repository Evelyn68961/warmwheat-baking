# 部署說明 — 暖麥烘焙教室課程預約前端

本網站為多頁式純靜態前端(HTML / CSS / JavaScript),不需資料庫，不需後端環境。

---

## 一、頁面結構

| 檔案 | 頁面 | 對應案件說明 |
|---|---|---|
| `index.html` | 首頁 | 入口與導引 |
| `courses.html` | 課程總覽 | **課程查詢** |
| `course.html` | 課程內頁 | **課程理解** |
| `enroll.html` | 報名前評估 + 報名 | **報名前評估** |

四頁共用 `styles/` 與 `assets/`,頁首頁尾為各頁內嵌（靜態網站無樣板引擎）。

---

## 二、最快的方式：直接開啟

解壓縮後，用瀏覽器開啟 `index.html` 即可。所有路徑皆為相對路徑。

> 註：字體採用 Google Fonts,離線時自動退回系統中文字體，版面不受影響。

---

## 三、上傳至一般虛擬主機(FTP / cPanel)

將以下**全部內容**上傳至網站根目錄（`public_html` 或 `www`）：

```
index.html
courses.html
course.html
enroll.html
styles/
scripts/
assets/
```

不需額外設定。四個頁面為平行檔案，網址即 `/courses.html` 這種形式。

---

## 四、部署至免費靜態主機

**Netlify** — https://app.netlify.com/drop,把整個資料夾拖進去即可。
**Vercel** — 資料夾內執行 `npx vercel`。
**GitHub Pages** — 推上 `main` 分支根目錄，Settings → Pages 選 `main` / `root`。

三者皆免費且自動提供 HTTPS。

---

## 五、本機預覽（建議）

`courses.html` 會讀取網址參數（例如 `courses.html?cat=bread`），
以 `file://` 直接開啟功能正常，但仍建議用簡易伺服器預覽：

```bash
python -m http.server 8080     # 或 npx serve .
```

---

## 六、後續維護

| 需求 | 修改位置 |
|---|---|
| 調整顏色、字級、間距 | `styles/tokens.css`（所有樣式引用此檔變數） |
| 修改文案 | 各 `.html` |
| 新增課程 | `courses.html` 複製一組 `<article class="course-card">`,並設定 `data-cat` / `data-lv` / `data-time` / `data-price` / `data-seats` / `data-title` |
| 調整篩選選項 | `courses.html` 的 `.filters` 區塊 + `scripts/courses.js` 的 `LABELS`、`PRICE_BANDS` |
| 調整報名前評估邏輯 | `scripts/enroll.js` 的 `COURSE` 與 `evaluate()` |
| 更換圖片 | 覆蓋 `assets/images/` 同名檔案 |

### 新增課程時的 data 屬性對照

| 屬性 | 用途 | 可用值 |
|---|---|---|
| `data-cat` | 類型篩選 | bread / cake / cookie / tart / nobake / pro |
| `data-lv` | 難度篩選 | beginner / advanced / pro |
| `data-time` | 時段篩選 | wd-day / wd-night / weekend |
| `data-price` | 價格篩選與排序 | 數字，不含逗號 |
| `data-seats` | 「只看尚有名額」 | 數字，0 表示額滿 |
| `data-rank` / `data-new` | 排序用 | 數字 |
| `data-title` | 關鍵字搜尋比對 | 課名 + 別名，空白分隔 |

---

## 七、瀏覽器支援

已確認版面與功能正常：

- Chrome / Edge（最新版）
- Firefox（最新版）
- Safari（最新版）
- **設計基準：桌機 1440**（內容最大寬 1200）

網站使用 `URLSearchParams` 與 CSS `aspect-ratio`,不支援 Internet Explorer。

> **關於手機版：** 案件說明的範圍為桌機（「協助使用者在桌機能快速找到適合的
> 實體課程」），**未包含 RWD**。本站在 1024 以下有做基本的降級處理（單欄堆疊，
> 確保不破版），但這不是完整的手機版設計。若需要 RWD,需另行提供手機版設計稿
> 並重新報價。
