<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gilbert Cipher — 图像空间填充混淆工具</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --bg: #faf9f6;
            --surface: #ffffff;
            --surface-2: #f4f2ec;
            --surface-3: #eae7df;
            --border: #e2ded6;
            --border-light: #d4d0c8;
            --accent: #059669;
            --accent-hover: #047857;
            --accent-dim: rgba(5,150,105,0.06);
            --accent-mid: rgba(5,150,105,0.16);
            --secondary: #dc2626;
            --secondary-hover: #b91c1c;
            --secondary-dim: rgba(220,38,38,0.06);
            --text: #1c1917;
            --text-bright: #0c0a09;
            --text-muted: #78716c;
            --font-display: 'Syne', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
            --radius: 12px;
            --radius-sm: 8px;
        }

        html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

        body {
            font-family: var(--font-mono);
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            line-height: 1.65;
            font-size: 13px;
        }

        body::after {
            content: '';
            position: fixed; inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
            opacity: 0.018;
            pointer-events: none;
            z-index: 10000;
        }

        .app {
            max-width: 1080px;
            margin: 0 auto;
            padding: 2.5rem 1.5rem 3rem;
        }

        header {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 2.5rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--border);
        }

        .logo-mark {
            width: 42px; height: 42px;
            background: linear-gradient(135deg, var(--accent), #0891b2);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(5,150,105,0.2);
        }

        .logo-mark::after {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2));
        }

        .logo-mark svg { position: relative; z-index: 1; }

        h1 {
            font-family: var(--font-display);
            font-weight: 800;
            font-size: 1.6rem;
            letter-spacing: -0.03em;
            line-height: 1.2;
            color: var(--text-bright);
        }

        .subtitle {
            font-size: 0.72rem;
            color: var(--text-muted);
            font-weight: 400;
            letter-spacing: 0.04em;
            margin-top: 0.25rem;
        }

        .upload-zone {
            border: 2px dashed var(--border);
            border-radius: var(--radius);
            padding: 3.5rem 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.35s ease;
            background: var(--surface);
            position: relative;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .upload-zone::before {
            content: '';
            position: absolute; inset: 0;
            background: radial-gradient(ellipse at 50% 80%, var(--accent-dim), transparent 70%);
            opacity: 0;
            transition: opacity 0.35s ease;
        }

        .upload-zone:hover, .upload-zone.dragover {
            border-color: var(--accent);
            background: var(--surface-2);
            box-shadow: 0 2px 12px rgba(5,150,105,0.08);
        }

        .upload-zone:hover::before, .upload-zone.dragover::before { opacity: 1; }
        .upload-zone.dragover { transform: scale(1.005); }

        .upload-icon {
            color: var(--text-muted);
            margin-bottom: 1rem;
            transition: color 0.3s ease;
        }

        .upload-zone:hover .upload-icon { color: var(--accent); }

        .upload-text {
            font-size: 0.85rem;
            color: var(--text);
            position: relative;
        }

        .upload-text .accent { color: var(--accent); font-weight: 500; }

        .upload-hint {
            font-size: 0.68rem;
            color: var(--text-muted);
            margin-top: 0.6rem;
            position: relative;
        }

        .workspace {
            display: none;
            animation: fadeSlideIn 0.5s ease forwards;
        }

        .workspace.active { display: block; }

        @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .canvas-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
            margin-bottom: 1.25rem;
        }

        .canvas-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 0.85rem;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .canvas-card:hover {
            border-color: var(--border-light);
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .canvas-label {
            font-family: var(--font-display);
            font-size: 0.65rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--text-muted);
            margin-bottom: 0.65rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .canvas-label .tag {
            font-family: var(--font-mono);
            font-size: 0.58rem;
            font-weight: 500;
            padding: 0.15em 0.5em;
            border-radius: 4px;
            background: var(--accent-dim);
            color: var(--accent);
            letter-spacing: 0.05em;
            text-transform: none;
        }

        .canvas-wrap {
            position: relative;
            background: #f0ede6;
            border-radius: var(--radius-sm);
            overflow: hidden;
            border: 1px solid var(--border);
        }

        .canvas-wrap canvas {
            display: block;
            width: 100%;
            height: auto;
            border-radius: var(--radius-sm);
        }

        .canvas-meta {
            font-size: 0.65rem;
            color: var(--text-muted);
            margin-top: 0.5rem;
            font-weight: 300;
        }

        .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
            align-items: center;
            margin-bottom: 1.25rem;
            padding: 1rem;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .btn-group { display: flex; gap: 0.5rem; }

        .btn {
            font-family: var(--font-mono);
            font-size: 0.75rem;
            font-weight: 500;
            padding: 0.55rem 1.1rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            background: var(--surface);
            color: var(--text);
            cursor: pointer;
            transition: all 0.2s ease;
            letter-spacing: 0.02em;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            white-space: nowrap;
            user-select: none;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }

        .btn:hover {
            border-color: var(--accent);
            color: var(--accent);
            background: var(--accent-dim);
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        }

        .btn:active { transform: scale(0.96); }

        .btn.primary {
            background: var(--accent);
            color: #ffffff;
            border-color: var(--accent);
            font-weight: 700;
            box-shadow: 0 2px 8px rgba(5,150,105,0.2);
        }

        .btn.primary:hover {
            background: var(--accent-hover);
            border-color: var(--accent-hover);
            box-shadow: 0 3px 12px rgba(5,150,105,0.28);
            color: #ffffff;
        }

        .btn.secondary {
            background: var(--secondary-dim);
            color: var(--secondary);
            border-color: rgba(220,38,38,0.2);
        }

        .btn.secondary:hover {
            background: rgba(220,38,38,0.1);
            border-color: var(--secondary);
            box-shadow: 0 2px 8px rgba(220,38,38,0.12);
            color: var(--secondary);
        }

        .btn:disabled {
            opacity: 0.35;
            cursor: not-allowed;
            pointer-events: none;
        }

        .btn-icon { font-size: 0.85em; }

        .divider {
            width: 1px; height: 26px;
            background: var(--border);
            flex-shrink: 0;
        }

        .spacer { flex: 1; }

        .rounds-control {
            display: flex;
            align-items: center;
            gap: 0.6rem;
        }

        .rounds-label {
            font-size: 0.65rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 500;
        }

        .rounds-value {
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--accent);
            min-width: 2.2ch;
            text-align: center;
            font-variant-numeric: tabular-nums;
        }

        input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            width: 100px;
            height: 4px;
            background: var(--border);
            border-radius: 2px;
            outline: none;
            cursor: pointer;
        }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px; height: 14px;
            border-radius: 50%;
            background: var(--accent);
            cursor: pointer;
            box-shadow: 0 0 0 3px rgba(5,150,105,0.12), 0 1px 4px rgba(0,0,0,0.15);
            transition: box-shadow 0.2s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
            box-shadow: 0 0 0 5px rgba(5,150,105,0.18), 0 2px 6px rgba(0,0,0,0.2);
        }

        input[type="range"]::-moz-range-thumb {
            width: 14px; height: 14px;
            border: none;
            border-radius: 50%;
            background: var(--accent);
            cursor: pointer;
        }

        .curve-section {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            margin-bottom: 1.25rem;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .curve-title {
            padding: 0.85rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            user-select: none;
            list-style: none;
            transition: background 0.2s ease;
        }

        .curve-title::-webkit-details-marker { display: none; }
        .curve-title:hover { background: var(--surface-2); }

        .curve-title-text {
            font-family: var(--font-display);
            font-size: 0.65rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--text-muted);
        }

        .curve-title-hint {
            font-size: 0.62rem;
            color: var(--text-muted);
            opacity: 0.5;
            transition: opacity 0.2s ease;
        }

        .curve-section[open] .curve-title-hint { opacity: 0; }

        .curve-title::after {
            content: '\25B8';
            font-size: 0.7rem;
            color: var(--text-muted);
            transition: transform 0.25s ease;
            margin-left: 0.5rem;
        }

        .curve-section[open] .curve-title::after { transform: rotate(90deg); }

        .curve-body { padding: 0 1rem 1.25rem; }

        .curve-canvas-wrap {
            display: flex;
            justify-content: center;
            background: #0c1020;
            border-radius: var(--radius-sm);
            padding: 1.25rem;
            margin-bottom: 0.85rem;
        }

        .curve-canvas-wrap canvas {
            display: block;
            border-radius: 4px;
            image-rendering: pixelated;
        }

        .curve-desc {
            font-size: 0.7rem;
            color: var(--text-muted);
            line-height: 1.7;
            font-weight: 300;
            max-width: 680px;
        }

        .curve-desc strong { color: var(--text); font-weight: 500; }

        .status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.65rem 0.9rem;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            font-size: 0.7rem;
            color: var(--text-muted);
            font-weight: 300;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .status-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
            background: var(--text-muted);
            transition: all 0.3s ease;
        }

        .status-dot.ready { background: var(--accent); box-shadow: 0 0 6px var(--accent-mid); }
        .status-dot.busy {
            background: #d97706;
            box-shadow: 0 0 6px rgba(217,119,6,0.35);
            animation: pulse 1s ease infinite;
        }
        .status-dot.done { background: var(--accent); box-shadow: 0 0 6px var(--accent-mid); }
        .status-dot.error { background: var(--secondary); box-shadow: 0 0 6px rgba(220,38,38,0.3); }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
        }

        footer {
            margin-top: 2.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border);
            text-align: center;
            font-size: 0.65rem;
            color: var(--text-muted);
            font-weight: 300;
            letter-spacing: 0.03em;
        }

        @media (max-width: 720px) {
            .app { padding: 1.5rem 1rem 2rem; }
            header { margin-bottom: 1.5rem; padding-bottom: 1.25rem; }
            h1 { font-size: 1.3rem; }
            .canvas-grid { grid-template-columns: 1fr; }
            .controls { gap: 0.5rem; }
            .spacer { display: none; }
            .rounds-control { width: 100%; justify-content: center; margin-top: 0.25rem; }
            .divider { display: none; }
            .upload-zone { padding: 2.5rem 1.5rem; }
        }
    </style>
</head>
<body>
    <div class="app">
        <header>
            <div class="logo-mark">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="4 17 10 11 4 5"></polyline>
                    <line x1="12" y1="19" x2="20" y2="19"></line>
                </svg>
            </div>
            <div>
                <h1>Gilbert Cipher</h1>
                <p class="subtitle">基于 Gilbert 空间填充曲线的图像混淆 / 解混淆工具</p>
            </div>
        </header>

        <main>
            <div class="upload-zone" id="uploadZone">
                <div class="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="6" y="6" width="36" height="36" rx="6" stroke-dasharray="4 3"/>
                        <path d="M24 18v12M18 24h12" stroke-linecap="round"/>
                    </svg>
                </div>
                <p class="upload-text">拖放图片到此处，或 <span class="accent">点击选择文件</span></p>
                <p class="upload-hint">支持 JPG / PNG / WebP &middot; 纯前端处理，图片不会上传至服务器</p>
            </div>
            <input type="file" id="fileInput" accept="image/*" hidden>

            <div class="workspace" id="workspace">
                <div class="canvas-grid">
                    <div class="canvas-card">
                        <div class="canvas-label">原始图像</div>
                        <div class="canvas-wrap"><canvas id="cvsOriginal"></canvas></div>
                        <div class="canvas-meta" id="metaOriginal"></div>
                    </div>
                    <div class="canvas-card">
                        <div class="canvas-label" id="lblResult">处理结果</div>
                        <div class="canvas-wrap"><canvas id="cvsResult"></canvas></div>
                        <div class="canvas-meta" id="metaResult"></div>
                    </div>
                </div>

                <div class="controls">
                    <div class="btn-group">
                        <button class="btn primary" id="btnScramble"><span class="btn-icon">&#9670;</span> 混淆</button>
                        <button class="btn secondary" id="btnUnscramble"><span class="btn-icon">&#9671;</span> 解混淆</button>
                    </div>
                    <div class="divider"></div>
                    <div class="btn-group">
                        <button class="btn" id="btnDownload">&#8595; 下载</button>
                        <button class="btn" id="btnReset">&#8634; 重置</button>
                        <button class="btn" id="btnChange">&#8644; 更换图片</button>
                    </div>
                    <div class="spacer"></div>
                    <div class="rounds-control">
                        <span class="rounds-label">轮次</span>
                        <input type="range" id="rngRounds" min="1" max="20" value="1">
                        <span class="rounds-value" id="valRounds">1</span>
                    </div>
                </div>

                <details class="curve-section" id="curveDetails" open>
                    <summary class="curve-title">
                        <span class="curve-title-text">Gilbert 曲线可视化</span>
                        <span class="curve-title-hint">空间填充路径</span>
                    </summary>
                    <div class="curve-body">
                        <div class="curve-canvas-wrap"><canvas id="cvsCurve"></canvas></div>
                        <p class="curve-desc">
                            <strong>Gilbert 曲线</strong>是一种能以连续路径遍历任意矩形网格中所有像素的空间填充曲线。
                            本工具采用基于<strong>黄金分割比例</strong>的循环位移算法：沿曲线方向将像素按
                            <code>offset = round((&#8730;5&#8722;1)/2 &times; N)</code> 步长进行循环移位，
                            使空间相邻像素被分散到图像各处。由于位移是循环的，解混淆使用相同偏移量的逆向映射即可精确还原。
                            增加<strong>轮次</strong>可叠加位移效果，需使用相同轮次才能正确还原。
                        </p>
                    </div>
                </details>

                <div class="status">
                    <span class="status-dot ready" id="statusDot"></span>
                    <span id="statusText">就绪 — 请上传图片</span>
                </div>
            </div>
        </main>

        <footer>
            <p>Gilbert Curve Image Scrambler &middot; 纯前端实现 &middot; 所有处理在浏览器中完成</p>
        </footer>
    </div>

    <script>
    /* ================================================================
       Gilbert Curve Image Scrambler
       Algorithm: circular shift along Gilbert space-filling curve
       Offset:    round((sqrt(5)-1)/2 * N)  — golden ratio conjugate
    ================================================================ */

    // ===== GILBERT CURVE GENERATION =====
    //
    // Generalized Hilbert ('gilbert') space-filling curve for arbitrary-sized
    // 2D rectangular grids. Returns an Int32Array of linear pixel indices
    // (y * width + x) in the order the curve visits each cell.

    function gilbert2d(width, height) {
        const N = width * height;
        if (N <= 0) return new Int32Array(0);

        const coordinates = new Int32Array(N);
        let idx = 0;

        function generate2d(x, y, ax, ay, bx, by) {
            const w = Math.abs(ax + ay);
            const h = Math.abs(bx + by);

            const dax = Math.sign(ax), day = Math.sign(ay);
            const dbx = Math.sign(bx), dby = Math.sign(by);

            if (h === 1) {
                for (let i = 0; i < w; i++) {
                    coordinates[idx++] = y * width + x;
                    x += dax; y += day;
                }
                return;
            }

            if (w === 1) {
                for (let i = 0; i < h; i++) {
                    coordinates[idx++] = y * width + x;
                    x += dbx; y += dby;
                }
                return;
            }

            let ax2 = Math.floor(ax / 2), ay2 = Math.floor(ay / 2);
            let bx2 = Math.floor(bx / 2), by2 = Math.floor(by / 2);

            const w2 = Math.abs(ax2 + ay2);
            const h2 = Math.abs(bx2 + by2);

            if (2 * w > 3 * h) {
                if ((w2 % 2) && (w > 2)) {
                    ax2 += dax; ay2 += day;
                }
                generate2d(x, y, ax2, ay2, bx, by);
                generate2d(x + ax2, y + ay2, ax - ax2, ay - ay2, bx, by);
            } else {
                if ((h2 % 2) && (h > 2)) {
                    bx2 += dbx; by2 += dby;
                }
                generate2d(x, y, bx2, by2, ax2, ay2);
                generate2d(x + bx2, y + by2, ax, ay, bx - bx2, by - by2);
                generate2d(
                    x + (ax - dax) + (bx2 - dbx),
                    y + (ay - day) + (by2 - dby),
                    -bx2, -by2,
                    -(ax - ax2), -(ay - ay2)
                );
            }
        }

        if (width >= height) {
            generate2d(0, 0, width, 0, 0, height);
        } else {
            generate2d(0, 0, 0, height, width, 0);
        }

        return coordinates;
    }

    // ===== IMAGE PROCESSING =====
    //
    // Scramble:   for each i, pixel at curve[i] -> curve[(i + offset) % N]
    // Unscramble: equivalent to encrypt with offset (N - offset) % N
    //
    // Multiple rounds: r rounds of base offset O equals single shift of (r * O) % N.

    function processImage(imageData, width, height, rounds, inverse) {
        const N = width * height;
        const curve = gilbert2d(width, height);
        const baseOffset = Math.round((Math.sqrt(5) - 1) / 2 * N);

        let offset;
        if (inverse) {
            offset = (N - (rounds * baseOffset) % N) % N;
        } else {
            offset = (rounds * baseOffset) % N;
        }

        // Identity transform — no work needed
        if (offset === 0) {
            return new ImageData(new Uint8ClampedArray(imageData.data), width, height);
        }

        const src = imageData.data;
        const dst = new Uint8ClampedArray(src.length);

        for (let i = 0; i < N; i++) {
            const sp = 4 * curve[i];
            const dp = 4 * curve[(i + offset) % N];
            dst[dp]     = src[sp];
            dst[dp + 1] = src[sp + 1];
            dst[dp + 2] = src[sp + 2];
            dst[dp + 3] = src[sp + 3];
        }

        return new ImageData(dst, width, height);
    }

    // ===== CURVE VISUALIZATION =====

    function generateGilbertPoints(width, height) {
        const curve = gilbert2d(width, height);
        const pts = [];
        for (let i = 0; i < curve.length; i++) {
            pts.push(curve[i] % width, Math.floor(curve[i] / width));
        }
        return pts;
    }

    let curveAnimFrame = null;

    function drawCurve(canvas, gridW, gridH) {
        if (curveAnimFrame) { cancelAnimationFrame(curveAnimFrame); curveAnimFrame = null; }

        const pts = generateGilbertPoints(gridW, gridH);
        const total = pts.length / 2;
        const maxPx = 480;
        const cell = Math.max(3, Math.min(Math.floor(maxPx / gridW), Math.floor(maxPx / gridH)));
        const pad = Math.max(0.5, cell * 0.12);

        canvas.width = gridW * cell;
        canvas.height = gridH * cell;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0c1020';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#151d35';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= gridW; x++) {
            ctx.beginPath(); ctx.moveTo(x * cell + 0.5, 0); ctx.lineTo(x * cell + 0.5, canvas.height); ctx.stroke();
        }
        for (let y = 0; y <= gridH; y++) {
            ctx.beginPath(); ctx.moveTo(0, y * cell + 0.5); ctx.lineTo(canvas.width, y * cell + 0.5); ctx.stroke();
        }

        const batchSize = Math.max(1, Math.ceil(total / 200));
        let cur = 0;

        function frame() {
            const end = Math.min(cur + batchSize, total);
            for (let i = cur; i < end; i++) {
                const t = i / Math.max(1, total - 1);
                const px = pts[i * 2], py = pts[i * 2 + 1];
                const hue = 165 * (1 - t * 0.95);
                const sat = 80 + t * 20;
                const lum = 38 + t * 25;
                ctx.fillStyle = `hsla(${hue},${sat}%,${lum}%,0.88)`;
                ctx.fillRect(px * cell + pad, py * cell + pad, cell - pad * 2, cell - pad * 2);

                if (i > 0) {
                    const ppx = pts[(i - 1) * 2] * cell + cell / 2;
                    const ppy = pts[(i - 1) * 2 + 1] * cell + cell / 2;
                    const cx = px * cell + cell / 2;
                    const cy = py * cell + cell / 2;
                    ctx.strokeStyle = `hsla(${hue},${sat}%,${lum + 18}%,0.35)`;
                    ctx.lineWidth = Math.max(0.8, cell * 0.12);
                    ctx.beginPath(); ctx.moveTo(ppx, ppy); ctx.lineTo(cx, cy); ctx.stroke();
                }
            }
            if (end < total && end > 0) {
                const tipX = pts[(end - 1) * 2] * cell + cell / 2;
                const tipY = pts[(end - 1) * 2 + 1] * cell + cell / 2;
                const tTip = (end - 1) / Math.max(1, total - 1);
                const hueTip = 165 * (1 - tTip * 0.95);
                const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, cell * 2.5);
                grad.addColorStop(0, `hsla(${hueTip},100%,65%,0.5)`);
                grad.addColorStop(1, `hsla(${hueTip},100%,65%,0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(tipX - cell * 3, tipY - cell * 3, cell * 6, cell * 6);
            }
            cur = end;
            if (cur < total) curveAnimFrame = requestAnimationFrame(frame);
            else curveAnimFrame = null;
        }

        curveAnimFrame = requestAnimationFrame(frame);
    }

    // ===== APPLICATION STATE =====

    const state = {
        original: null,
        current: null,
        width: 0,
        height: 0,
        depth: 0
    };

    // ===== DOM REFERENCES =====

    const $ = id => document.getElementById(id);

    const dom = {
        uploadZone:   $('uploadZone'),
        fileInput:    $('fileInput'),
        workspace:    $('workspace'),
        cvsOriginal:  $('cvsOriginal'),
        cvsResult:    $('cvsResult'),
        cvsCurve:     $('cvsCurve'),
        metaOriginal: $('metaOriginal'),
        metaResult:   $('metaResult'),
        lblResult:    $('lblResult'),
        btnScramble:  $('btnScramble'),
        btnUnscramble:$('btnUnscramble'),
        btnDownload:  $('btnDownload'),
        btnReset:     $('btnReset'),
        btnChange:    $('btnChange'),
        rngRounds:    $('rngRounds'),
        valRounds:    $('valRounds'),
        statusDot:    $('statusDot'),
        statusText:   $('statusText'),
        curveDetails: $('curveDetails')
    };

    // ===== HELPERS =====

    function setStatus(type, text) {
        dom.statusDot.className = 'status-dot ' + type;
        dom.statusText.textContent = text;
    }

    function displayImage(canvas, imageData) {
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        canvas.getContext('2d').putImageData(imageData, 0, 0);
    }

    function getCurveGridSize(imgW, imgH) {
        const maxDim = 48;
        const aspect = imgW / imgH;
        let gw, gh;
        if (aspect >= 1) { gw = maxDim; gh = Math.max(6, Math.round(gw / aspect)); }
        else              { gh = maxDim; gw = Math.max(6, Math.round(gh * aspect)); }
        return { w: gw, h: gh };
    }

    function formatSize(w, h) {
        return `${w} \u00d7 ${h} px \u00b7 ${(w * h / 1e6).toFixed(2)} MP`;
    }

    function updateResultLabel() {
        if (state.depth === 0) {
            dom.lblResult.innerHTML = '\u5904\u7406\u7ed3\u679c';
            dom.metaResult.textContent = '\u4e0e\u539f\u59cb\u56fe\u50cf\u76f8\u540c';
        } else {
            dom.lblResult.innerHTML = '\u5904\u7406\u7ed3\u679c <span class="tag">\u5df2\u6df7\u6dc6 \u00d7' + state.depth + '</span>';
        }
    }

    function disableButtons(v) {
        dom.btnScramble.disabled = v;
        dom.btnUnscramble.disabled = v;
    }

    // ===== FILE HANDLING =====

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;

        const img = new Image();
        img.onload = function() {
            let w = img.naturalWidth, h = img.naturalHeight;

            const MAX_PIXELS = 8000000;
            if (w * h > MAX_PIXELS) {
                const scale = Math.sqrt(MAX_PIXELS / (w * h));
                w = Math.round(w * scale);
                h = Math.round(h * scale);
            }

            state.width = w;
            state.height = h;
            state.depth = 0;

            const offscreen = document.createElement('canvas');
            offscreen.width = w;
            offscreen.height = h;
            offscreen.getContext('2d').drawImage(img, 0, 0, w, h);

            state.original = offscreen.getContext('2d').getImageData(0, 0, w, h);
            state.current = new ImageData(
                new Uint8ClampedArray(state.original.data), w, h
            );

            displayImage(dom.cvsOriginal, state.original);
            displayImage(dom.cvsResult, state.current);

            dom.metaOriginal.textContent = formatSize(w, h);
            updateResultLabel();

            dom.uploadZone.style.display = 'none';
            dom.workspace.classList.add('active');

            const gSize = getCurveGridSize(w, h);
            drawCurve(dom.cvsCurve, gSize.w, gSize.h);

            setStatus('ready', '\u5df2\u52a0\u8f7d ' + w + '\u00d7' + h + ' \u56fe\u50cf \u2014 \u51c6\u5907\u5c31\u7eea');
            URL.revokeObjectURL(img.src);
        };
        img.onerror = function() {
            setStatus('error', '\u56fe\u50cf\u52a0\u8f7d\u5931\u8d25');
            URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
    }

    // ===== OPERATIONS =====

    async function doScramble() {
        const rounds = parseInt(dom.rngRounds.value);
        setStatus('busy', '\u6b63\u5728\u6df7\u6dc6 (' + state.width + '\u00d7' + state.height + ', ' + rounds + ' \u8f6e)...');
        disableButtons(true);
        await new Promise(r => setTimeout(r, 20));

        try {
            const t0 = performance.now();
            state.current = processImage(state.current, state.width, state.height, rounds, false);
            const elapsed = (performance.now() - t0).toFixed(0);

            state.depth += rounds;
            displayImage(dom.cvsResult, state.current);
            updateResultLabel();
            dom.metaResult.textContent = rounds + ' \u8f6e\u6df7\u6dc6 \u00b7 \u8017\u65f6 ' + elapsed + 'ms';
            setStatus('done', '\u6df7\u6dc6\u5b8c\u6210 \u2014 \u6df6\u5ea6 ' + state.depth + ', ' + elapsed + 'ms');
        } catch (e) {
            setStatus('error', '\u6df7\u6dc6\u5931\u8d25: ' + e.message);
        }
        disableButtons(false);
    }

    async function doUnscramble() {
        const rounds = parseInt(dom.rngRounds.value);
        setStatus('busy', '\u6b63\u5728\u89e3\u6df7\u6dc6 (' + state.width + '\u00d7' + state.height + ', ' + rounds + ' \u8f6e)...');
        disableButtons(true);
        await new Promise(r => setTimeout(r, 20));

        try {
            const t0 = performance.now();
            state.current = processImage(state.current, state.width, state.height, rounds, true);
            const elapsed = (performance.now() - t0).toFixed(0);

            state.depth = Math.max(0, state.depth - rounds);
            displayImage(dom.cvsResult, state.current);
            updateResultLabel();
            dom.metaResult.textContent = rounds + ' \u8f6e\u89e3\u6df7\u6dc6 \u00b7 \u8017\u65f6 ' + elapsed + 'ms';
            setStatus('done', '\u89e3\u6df7\u6dc6\u5b8c\u6210 \u2014 \u6df6\u5ea6 ' + state.depth + ', ' + elapsed + 'ms');
        } catch (e) {
            setStatus('error', '\u89e3\u6df7\u6dc6\u5931\u8d25: ' + e.message);
        }
        disableButtons(false);
    }

    function doDownload() {
        dom.cvsResult.toBlob(function(blob) {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const tag = state.depth > 0 ? '_scrambled' : '_original';
            a.download = 'gilbert' + tag + '_' + state.width + 'x' + state.height + '.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    function doReset() {
        if (!state.original) return;
        state.current = new ImageData(
            new Uint8ClampedArray(state.original.data), state.width, state.height
        );
        state.depth = 0;
        displayImage(dom.cvsResult, state.current);
        updateResultLabel();
        dom.metaResult.textContent = '\u4e0e\u539f\u59cb\u56fe\u50cf\u76f8\u540c';
        setStatus('ready', '\u5df2\u91cd\u7f6e\u4e3a\u539f\u59cb\u56fe\u50cf');
    }

    function doChangeImage() {
        dom.fileInput.value = '';
        dom.fileInput.click();
    }

    // ===== EVENT LISTENERS =====

    dom.uploadZone.addEventListener('click', () => dom.fileInput.click());

    dom.fileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    });

    dom.uploadZone.addEventListener('dragover', e => {
        e.preventDefault();
        dom.uploadZone.classList.add('dragover');
    });

    dom.uploadZone.addEventListener('dragleave', () => {
        dom.uploadZone.classList.remove('dragover');
    });

    dom.uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        dom.uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => {
        e.preventDefault();
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f && f.type && f.type.startsWith('image/')) handleFile(f);
    });

    document.addEventListener('paste', e => {
        const items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                handleFile(item.getAsFile());
                return;
            }
        }
    });

    dom.btnScramble.addEventListener('click', doScramble);
    dom.btnUnscramble.addEventListener('click', doUnscramble);
    dom.btnDownload.addEventListener('click', doDownload);
    dom.btnReset.addEventListener('click', doReset);
    dom.btnChange.addEventListener('click', doChangeImage);

    dom.rngRounds.addEventListener('input', () => {
        dom.valRounds.textContent = dom.rngRounds.value;
    });

    document.addEventListener('keydown', e => {
        if (!state.original || e.target.tagName === 'INPUT') return;
        switch (e.key.toLowerCase()) {
            case 's': e.preventDefault(); doScramble(); break;
            case 'u': e.preventDefault(); doUnscramble(); break;
            case 'd': e.preventDefault(); doDownload(); break;
            case 'r': e.preventDefault(); doReset(); break;
        }
    });

    dom.curveDetails.addEventListener('toggle', () => {
        if (dom.curveDetails.open && state.width > 0) {
            const gSize = getCurveGridSize(state.width, state.height);
            drawCurve(dom.cvsCurve, gSize.w, gSize.h);
        }
    });

    </script>
</body>
</html>
