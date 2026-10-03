# RA7-minigames
-- حقوق RA7-DEV <https://discord.gg/Sq8MErX8J>
-- حقوق RA7-DEV <https://discord.gg/Sq8MErX8J>
Ra7-Dev
⚠️ تنبيه مهم
>
هذا السكربت يتم نشره وتوفيره حصريًا من خلال Ra7-Dev، وهو غير منشور بشكل عام.

---

🛒 النشر والتوفير
هذا السكربت غير متاح للنشر العام، ويتم توفيره من خلال Ra7-Dev فقط.

يُمنع منعًا باتًا:

إعادة نشر السكربت بدون الحقوق.
إعادة بيع السكربت.
رفع السكربت على أي متجر أو منصة أخرى مع مسح الحقوق او عدم ذكرها.
إزالة أو تعديل حقوق Ra7-Dev الموجودة داخل الملفات.
نسب نشر السكربت إلى جهة أو شخص آخر.

---

💜 الناشر
Publisher: Ra7-Dev

Developer: MOHX

Discord:

https://discord.gg/Sq8MErX8J

---

© حقوق النشر والتوزيع
جميع حقوق النشر والتوزيع محفوظة لـ Ra7-Dev

© 2026 Ra7-Dev

🚫 يُمنع إزالة الحقوق أو إعادة نشر أو توزيع هذا السكربت بدون إذن مسبق من Ra7-Dev.
-- حقوق RA7-DEV <https://discord.gg/Sq8MErX8J>

## Install

1. Put the `minigame` folder inside `resources/`.
2. Add this line to `server.cfg`:

```
ensure minigame
```
## Usage
```lua
-- Blocking (inside a thread / command / event handler)
local success, reason = exports.minigame:Start('stack', { difficulty = 'hard' })
-- Callback
exports.minigame:StartCb('defuse', { difficulty = 'normal' }, function(ok, reason) end)
-- Event
TriggerEvent('minigame:start', 'laser', { difficulty = 'easy' }, function(ok) end)
-- Random game
exports.minigame:Start('random', { games = { 'stack', 'tiles', 'match' } })
exports.minigame:IsActive()
exports.minigame:Stop()
```
Games: `stack`, `stopwatch`, `tracker`, `whack`, `laser`, `digits`, `match`, `rings`, `tiles`, `defuse`

Options: `difficulty` (`'easy'` / `'normal'` / `'hard'`), `position`, `accent`, `scale`, `cancelable`

-- حقوق RA7-DEV <https://discord.gg/Sq8MErX8J>
-- حقوق RA7-DEV <https://discord.gg/Sq8MErX8J>
