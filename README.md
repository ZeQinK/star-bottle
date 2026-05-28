# ✨ Star Bottle 🌟

A premium, highly interactive, and mobile-optimized digital love note jar. Write beautiful decorated letters, fold them into dynamic SVG stars, and collect them in a majestic star-shaped glass bottle. Your boyfriend can click the bottle to catch and reveal one sweet message per day, with an built-in daily lock limit!

This website is designed completely with vanilla modern web technologies (HTML5, CSS3, ES6 JS) and has **zero dependencies**. It runs fully out-of-the-box and is optimized for instant hosting on **Vercel** or **GitHub Pages**.

---

## 📸 Core Features

*   **🏺 Glass Star Bottle**: Detailed glossy SVG star-shaped glass bottle featuring wood corking and hanging tags. Dynamically filled with colorful mini-stars representing your saved letters!
*   **☀️/🌙 Dynamic Day & Night Aura**: 
    *   *Cozy Day Mode (7:00 AM – 6:00 PM)*: Warm, comfy cream/yellowish background, soft terracotta details, and double rose-gold glass terrarium frames.
    *   *Magical Night Mode (6:00 PM – 7:00 AM)*: Fades into deep space colors with a neon-purple glowing bottle and a **2D Canvas background starry particle system** rendering twinkling, drifting stars.
    *   *Dev Toggle Overlay*: SUN/MOON floating selector to easily switch and test modes anytime!
*   **💌 Customizable Note Folders**:
    *   **Shapes**: Card 💌, Scalloped Border 💮, Scroll 📜, Heart Outlines 💖.
    *   **Patterns**: Cozy Plain, School Grid, Sweet Dots, Soft Stripes, Tiny Hearts.
    *   **Color Palettes**: Soft Pastels (Pinks, Peaches, Lilacs, Lavenders, Custards, Mint Greens) with automatic text color contrast balancing.
    *   **Emoji Frames**: Hearts 💖, Flowers 🌸, Space 🌌, Cozy Cafe ☕, Teddy Bears 🧸.
*   **🔒 Reading Rules & Limits**:
    *   Restricts boyfriend to a **maximum of 3 star notes per calendar day** using `localStorage`.
    *   Friendly cute block warnings if he exceeds the limit.
    *   Dev button in the drawer to reset reading limits for simple verification.
*   **🗝️ Locked Writer's Desk**:
    *    Discreet locking drawer at the bottom right.
    *   Enter secret passcode **`iloveyou`** to open the desk.
    *   **Live Preview Screen**: Watch your customized letters, shapes, borders, and emojis render in real-time as you write!
    *   **Star Manager**: Edit, update, refold, or burn (delete) stars.

---

## 🚀 Instant Deployment Guide

This project is fully structured for serverless deployments. You can put it online in under a minute!

### Option A: Deploying to Vercel (Recommended)
1. Push your folder to a new repository (public or private) on your **GitHub** account.
2. Go to [Vercel](https://vercel.com/) and log in (or create a free account).
3. Click **Add New** > **Project** and import your `star-bottle` repository.
4. Vercel will automatically recognize the static structure. Leave all settings at default (no build commands needed!).
5. Click **Deploy**! In seconds, your website will be online with a secure, custom HTTPS link you can share with your boyfriend.

### Option B: Deploying to GitHub Pages
1. Push the code to a **public** repository on GitHub.
2. In your repository page, go to **Settings** > **Pages** (in the left sidebar).
3. Under *Build and deployment* > *Source*, select **Deploy from a branch**.
4. Choose the `main` or `master` branch and the `/ (root)` folder.
5. Click **Save**. Within 1–2 minutes, your website will be published at `https://<YOUR_GITHUB_USERNAME>.github.io/<REPO_NAME>/`.
