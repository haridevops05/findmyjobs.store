# WorldMap Patch — 3 edits to App.jsx

## Step 1 — Add import (line 1, after existing imports)

Find this line at the TOP of App.jsx:
```
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
```

Add this line DIRECTLY below it:
```
import WorldMap from "./WorldMap";
```

---

## Step 2 — Add tab to TABS array

Find this block inside App.jsx (around line 390):
```js
  const TABS=[
    {k:"live",l:"📡 Live Jobs",b:filteredJobs.length,gw:fresh.size>0},
```

Add `{k:"worldmap",l:"🌍 World Map"}` as the SECOND item:
```js
  const TABS=[
    {k:"live",l:"📡 Live Jobs",b:filteredJobs.length,gw:fresh.size>0},
    {k:"worldmap",l:"🌍 World Map"},                                    // ← ADD THIS
    {k:"portals",l:"📋 All Portals",b:PL.length},
```

---

## Step 3 — Add tab panel render

Find this comment block inside the return() JSX (search for it):
```jsx
        {/* ═══ LIVE JOBS ═══════════════════════════════════════════ */}
        {tab==="live"&&<div style={{animation:"fu .2s"}}>
```

Add this block DIRECTLY ABOVE it:
```jsx
        {/* ═══ WORLD MAP ══════════════════════════════════════════ */}
        {tab==="worldmap"&&<div style={{animation:"fu .2s"}}>
          <WorldMap darkMode={darkMode}/>
        </div>}
```

---

## That's it. No other changes needed.

WorldMap.jsx is fully self-contained:
- Zero new npm packages needed (pure JS projection, no D3)
- Uses CORS proxy already in App.jsx (same allorigins.win)
- Reads darkMode from App and applies matching theme tokens
- Auto-fetches live jobs on every open, caches for 30 min
- Works offline with 50 seed roles
