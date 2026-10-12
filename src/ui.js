export function renderDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exa — MCP Load-Balancing Proxy & Key Pool</title>
  <link rel="icon" href="https://exa.ai/images/favicon-32x32.png" />
  <link rel="preload" href="https://exa.ai/fonts/ABCArizonaFlare-Regular.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href="https://exa.ai/fonts/ABCDiatype-Regular.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href="https://exa.ai/fonts/ABCDiatype-Medium.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href="https://exa.ai/fonts/GeistMono-Regular.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
  <style>
    @font-face {
      font-family: "Arizona";
      font-weight: 400;
      font-style: normal;
      src: url("https://exa.ai/fonts/ABCArizonaFlare-Regular.woff2") format("woff2");
      font-display: swap;
    }
    @font-face {
      font-family: "Arizona";
      font-weight: 300;
      font-style: normal;
      src: url("https://exa.ai/fonts/ABCArizonaFlare-Light.woff2") format("woff2");
      font-display: swap;
    }
    @font-face {
      font-family: "ABCDiatype";
      font-weight: 400;
      font-style: normal;
      src: url("https://exa.ai/fonts/ABCDiatype-Regular.woff2") format("woff2");
      font-display: swap;
    }
    @font-face {
      font-family: "ABCDiatype";
      font-weight: 500;
      font-style: normal;
      src: url("https://exa.ai/fonts/ABCDiatype-Medium.woff2") format("woff2");
      font-display: swap;
    }
    @font-face {
      font-family: "ABCDiatype";
      font-weight: 700;
      font-style: normal;
      src: url("https://exa.ai/fonts/ABCDiatype-Bold.woff2") format("woff2");
      font-display: swap;
    }
    @font-face {
      font-family: "GeistMono";
      font-weight: 400;
      font-style: normal;
      src: url("https://exa.ai/fonts/GeistMono-Regular.woff2") format("woff2");
      font-display: swap;
    }
    @font-face {
      font-family: "GeistMono";
      font-weight: 500;
      font-style: normal;
      src: url("https://exa.ai/fonts/GeistMono-Medium.woff2") format("woff2");
      font-display: swap;
    }
    @font-face {
      font-family: "GeistMono";
      font-weight: 600;
      font-style: normal;
      src: url("https://exa.ai/fonts/GeistMono-SemiBold.woff2") format("woff2");
      font-display: swap;
    }

    :root {
      /* Official Exa.ai Design Tokens */
      --cream: #faf9f7;
      --cream-darker: #f0ece8;
      --blog-cards-hover: #f2f0e9;
      --greige-lightest: #c2bfbb;
      --greige-light: #787572;
      --greige: #58544e;
      --charcoal: #111111;
      --ink: #101321;
      --muted-ink: rgba(16, 19, 33, 0.62);
      --hairline: rgba(16, 19, 33, 0.12);
      --hairline-strong: rgba(16, 19, 33, 0.22);

      --brand-default: #1f40ed;
      --brand-logo: #0143d9;
      --brand-fainter: #e7ebfd;
      --brand-faint: #c6cfff;
      --brand-subtle: #a1aff7;
      --brand-muted: #4d87e7;
      --brand-dark: #0d2189;
      --brand-darker: #000a40;

      --white: #ffffff;
      --accent-darkgreen-light: #d1fae5;
      --accent-darkgreen-dark: #065f46;
      --accent-yellow-light: #fef3c7;
      --accent-yellow-dark: #92400e;
      --accent-maroon-light: #fee2e2;
      --accent-maroon-dark: #991b1b;
      --accent-skyblue-light: #dbeafe;
      --accent-skyblue-dark: #1e40af;

      --font-serif: "Arizona", Georgia, Cambria, "Times New Roman", serif;
      --font-sans: "ABCDiatype", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "GeistMono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: var(--cream);
      color: var(--ink);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Subtle architectural grid background inspired by exa.ai */
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      background-image:
        linear-gradient(to right, rgba(16, 19, 33, 0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(16, 19, 33, 0.035) 1px, transparent 1px);
      background-size: 64px 64px;
      mask-image: radial-gradient(ellipse at 50% 0%, #000 35%, transparent 85%);
      -webkit-mask-image: radial-gradient(ellipse at 50% 0%, #000 35%, transparent 85%);
    }

    /* Top Sticky Navigation */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(250, 249, 247, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--hairline);
    }
    .topbar-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 14px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .exa-logo {
      height: 22px;
      width: auto;
      display: block;
    }
    .brand-divider {
      width: 1px;
      height: 18px;
      background: var(--hairline-strong);
    }
    .index-tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 7px;
      border-radius: 2px;
      background: var(--brand-default);
      color: var(--white);
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 400;
      letter-spacing: 0.04em;
      line-height: 1;
      text-transform: uppercase;
    }
    .index-tag--muted {
      background: var(--cream-darker);
      color: var(--greige);
      border: 1px solid var(--hairline);
    }

    .container {
      position: relative;
      z-index: 1;
      max-width: 1280px;
      margin: 0 auto;
      padding: 36px 24px 72px;
    }

    /* Hero Editorial Header */
    .hero {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 28px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--hairline);
    }
    .hero-copy h1 {
      margin: 8px 0 8px;
      font-family: var(--font-serif);
      font-size: clamp(28px, 3.2vw, 40px);
      font-weight: 400;
      letter-spacing: -0.03em;
      line-height: 1.1;
      color: var(--ink);
    }
    .hero-copy p {
      margin: 0;
      color: var(--muted-ink);
      font-size: 15px;
      max-width: 600px;
    }

    /* Controls & Inputs */
    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    input, select, textarea {
      font-family: var(--font-sans);
      font-size: 13.5px;
      color: var(--ink);
      background: var(--white);
      border: 1px solid var(--hairline-strong);
      border-radius: 4px;
      padding: 7px 11px;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    input::placeholder, textarea::placeholder {
      color: var(--greige-light);
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--brand-default);
      box-shadow: 0 0 0 3px var(--brand-fainter);
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 34px;
      padding: 0 13px;
      border-radius: 4px;
      border: 1px solid var(--hairline-strong);
      background: var(--white);
      color: var(--ink);
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    button:hover {
      background: var(--cream-darker);
      border-color: var(--greige);
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .btn-primary {
      background: var(--brand-default);
      border-color: var(--brand-default);
      color: var(--white);
    }
    .btn-primary:hover {
      background: var(--brand-dark);
      border-color: var(--brand-dark);
    }
    .btn-ink {
      background: var(--ink);
      border-color: var(--ink);
      color: var(--white);
    }
    .btn-ink:hover {
      background: #252b42;
      border-color: #252b42;
    }
    .btn-sm {
      height: 26px;
      padding: 0 8px;
      font-size: 11.5px;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      border-radius: 3px;
    }
    .btn-danger {
      color: var(--accent-maroon-dark);
      border-color: rgba(153, 27, 27, 0.25);
    }
    .btn-danger:hover {
      background: var(--accent-maroon-light);
      border-color: rgba(153, 27, 27, 0.45);
    }

    /* Auth Bar */
    .auth-bar {
      background: var(--white);
      border: 1px solid var(--hairline);
      border-left: 3px solid var(--brand-default);
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .auth-bar-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13.5px;
    }

    /* Exa Architectural Stat Grid (.research-scale__stats style) */
    .grid-kpi {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      padding: 20px 18px 16px;
      border: 1px solid var(--hairline);
      border-radius: 4px;
      background: var(--white);
      transition: border-color 0.15s ease;
    }
    .stat-card:hover {
      border-color: var(--brand-subtle);
    }
    .stat-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--greige);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .stat-value {
      font-family: var(--font-serif);
      font-size: 34px;
      font-weight: 400;
      letter-spacing: -0.03em;
      line-height: 1.05;
      color: var(--ink);
    }
    .stat-sub {
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: var(--greige-light);
      padding-top: 8px;
      border-top: 1px solid rgba(16, 19, 33, 0.06);
    }

    /* Content Sections */
    .section {
      background: var(--white);
      border: 1px solid var(--hairline);
      border-radius: 4px;
      margin-bottom: 22px;
      overflow: hidden;
    }
    .section-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 15px 20px;
      background: var(--cream);
      border-bottom: 1px solid var(--hairline);
    }
    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title {
      margin: 0;
      font-family: var(--font-serif);
      font-size: 20px;
      font-weight: 400;
      letter-spacing: -0.02em;
      color: var(--ink);
    }
    .section-body {
      padding: 20px;
    }

    /* Add Key Grid */
    .add-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 860px) {
      .add-grid {
        grid-template-columns: 1fr;
      }
    }
    .field-label {
      font-family: var(--font-mono);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--greige);
      margin-bottom: 8px;
      display: block;
    }

    /* Tables */
    .table-wrap {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th, td {
      padding: 11px 16px;
      border-bottom: 1px solid var(--hairline);
      vertical-align: middle;
    }
    th {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--greige);
      background: rgba(240, 236, 232, 0.45);
    }
    tr:last-child td {
      border-bottom: none;
    }
    tbody tr {
      transition: background-color 0.12s ease;
    }
    tbody tr:hover td {
      background-color: var(--blog-cards-hover);
    }

    /* Status & Tool Badges (Exa 2px rectangular mono pills) */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 7px;
      border-radius: 2px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.03em;
      line-height: 1.1;
      text-transform: uppercase;
    }
    .badge::before {
      content: "";
      width: 5px;
      height: 5px;
      border-radius: 50%;
      display: inline-block;
    }
    .badge-active {
      background: var(--accent-darkgreen-light);
      color: var(--accent-darkgreen-dark);
    }
    .badge-active::before {
      background: #10b981;
    }
    .badge-cooldown {
      background: var(--accent-yellow-light);
      color: var(--accent-yellow-dark);
    }
    .badge-cooldown::before {
      background: #f59e0b;
    }
    .badge-exhausted, .badge-invalid {
      background: var(--accent-maroon-light);
      color: var(--accent-maroon-dark);
    }
    .badge-exhausted::before, .badge-invalid::before {
      background: #ef4444;
    }
    .badge-disabled {
      background: var(--cream-darker);
      color: var(--greige);
    }
    .badge-disabled::before {
      background: var(--greige-light);
    }
    .badge-tool {
      background: var(--brand-fainter);
      color: var(--brand-dark);
      border: 1px solid var(--brand-faint);
      text-transform: none;
    }
    .badge-tool::before {
      display: none;
    }

    /* Progress Bar */
    .bar-wrap {
      width: 84px;
      height: 6px;
      background: var(--cream-darker);
      border-radius: 2px;
      overflow: hidden;
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
    }
    .bar-fill {
      height: 100%;
      background: var(--brand-default);
      transition: width 0.25s ease;
    }

    .mono {
      font-family: var(--font-mono);
      font-size: 12.5px;
    }
    .muted {
      color: var(--muted-ink);
    }
    .query-cell {
      max-width: 360px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .err-text {
      color: var(--accent-maroon-dark);
      font-family: var(--font-mono);
      font-size: 11.5px;
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .log-row {
      cursor: pointer;
    }
    .log-detail-row td {
      background: var(--cream);
      padding: 14px 20px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--ink);
      border-bottom: 1px solid var(--hairline-strong);
    }
    .log-detail-box {
      display: grid;
      gap: 6px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    pre {
      margin: 0;
      padding: 16px;
      background: var(--ink);
      color: var(--cream);
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 12.5px;
      line-height: 1.6;
      overflow-x: auto;
    }

    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--ink);
      color: var(--white);
      border-left: 3px solid var(--brand-default);
      padding: 11px 16px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 12px;
      box-shadow: 0 12px 28px rgba(16, 19, 33, 0.18);
      display: none;
      z-index: 999;
    }
  </style>
</head>
<body>
  <nav class="topbar">
    <div class="topbar-inner">
      <div class="brand-group">
        <svg class="exa-logo" viewBox="0 0 413 129" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Exa">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M106.417 9.30741C106.417 9.57392 106.324 9.83227 106.155 10.0388L61.5395 64.5L106.155 118.96C106.324 119.166 106.417 119.425 106.417 119.691V127.843C106.417 128.482 105.897 129 105.255 129H1.16175C0.520132 129 0 128.482 0 127.843V1.15695C0 0.517982 0.520131 0 1.16174 0H105.255C105.897 0 106.417 0.517984 106.417 1.15695V9.30741ZM19.0364 116.382H87.6921L53.363 74.4795L19.0364 116.382ZM12.6699 104.192L40.1426 70.6585H12.6699V104.192ZM12.6699 58.0409H39.8964L12.6699 24.8064V58.0409ZM53.363 54.5193L87.6921 12.6176H19.0364L53.363 54.5193Z" fill="#0143D9"/>
          <path d="M176.198 117.65C166.094 117.65 157.323 115.553 149.886 111.36C142.589 107.167 136.905 101.017 132.835 92.9109C128.906 84.8045 126.941 75.0208 126.941 63.5599C126.941 53.3569 128.976 44.2022 133.046 36.0957C137.256 27.9892 143.01 21.6298 150.307 17.0175C157.744 12.4052 166.024 10.099 175.146 10.099C185.109 10.099 193.599 10.099 200.616 16.8078C207.633 21.1406 212.965 27.3602 216.614 35.4667C220.263 43.4334 222.087 52.8677 222.087 63.7695V66.1766C222.087 66.8156 221.567 67.3336 220.925 67.3336H145.044C145.185 74.881 146.588 81.3802 149.254 86.8311C152.061 92.282 155.78 96.475 160.411 99.4101C165.182 102.205 170.515 103.603 176.409 103.603C183.285 103.603 189.179 102.066 194.091 98.9908C198.779 95.9225 201.741 91.008 202.977 84.2471C203.08 83.6853 203.565 83.267 204.139 83.267H219.737C220.429 83.267 220.969 83.8669 220.871 84.5494C220.038 90.3376 217.988 95.6406 214.72 100.458C211.211 105.63 206.159 109.823 199.564 113.037C193.108 116.112 185.32 117.65 176.198 117.65ZM202.721 54.5449C202.721 45.3203 200.265 37.9825 195.354 32.5316C190.582 27.0807 183.846 24.3552 175.146 24.3552C166.866 24.3552 160.06 27.2205 154.727 32.9509C149.395 38.6814 146.377 45.8794 146.676 54.5449H202.721Z" fill="#101321"/>
          <path d="M364.585 117.65C358.13 117.65 352.236 116.392 346.903 113.876C341.571 111.36 337.361 107.796 334.273 103.184C331.186 98.4317 329.642 92.9808 329.642 86.8311C329.642 77.7462 332.73 70.688 338.904 65.6564C345.219 60.485 353.359 57.0607 363.322 55.3835L385.004 52.0291C387.67 51.6098 389.705 51.0507 391.108 50.3519C392.652 49.5133 393.704 48.465 394.266 47.2071C394.967 45.8095 395.318 44.0624 395.318 41.9659C395.318 36.515 393.424 32.2521 389.635 29.1772C385.846 25.9626 380.934 24.3552 374.9 24.3552C367.322 24.3552 361.498 26.2421 357.428 30.0158C353.595 33.4387 351.443 38.1016 350.971 44.0046C350.922 44.622 350.412 45.1106 349.79 45.1106H334.014C333.353 45.1106 332.823 44.5605 332.872 43.9032C333.312 38.0771 335.042 32.6792 338.062 27.7096C341.29 22.3985 345.921 18.1356 351.955 14.921C358.13 11.7063 365.287 10.099 373.426 10.099C381.706 10.099 388.793 11.6364 394.687 14.7113C400.721 17.7862 405.282 22.1888 408.369 27.9193C411.456 33.6497 413 40.4284 413 48.2554V113.348C413 113.987 412.48 114.505 411.838 114.505H396.901C396.259 114.505 395.739 113.987 395.739 113.348V109.473C395.739 108.076 395.739 106.678 395.739 105.28C395.739 103.743 395.739 102.275 395.739 100.878C393.213 106.189 389.214 110.312 383.741 113.247C378.408 116.182 372.023 117.65 364.585 117.65ZM367.111 103.603C372.444 103.603 377.215 102.485 381.425 100.249C385.775 97.8727 389.143 94.6581 391.529 90.6048C394.055 86.4118 395.318 81.6597 395.318 76.3486V61.4634C394.757 62.302 393.564 63.0707 391.74 63.7695C389.915 64.4684 387.389 65.1672 384.162 65.866L369.427 68.5915C362.971 69.8494 357.849 71.9459 354.06 74.881C350.271 77.8161 348.377 81.7995 348.377 86.8311C348.377 91.8627 350.131 95.916 353.639 98.9908C357.288 102.066 361.779 103.603 367.111 103.603Z" fill="#101321"/>
          <path d="M285.673 62.9573L325.127 112.948C325.726 113.707 325.183 114.82 324.213 114.82H305.929C305.572 114.82 305.235 114.657 305.015 114.378L275.053 76.414L245.093 114.378C244.872 114.657 244.536 114.82 244.179 114.82H225.893C224.924 114.82 224.381 113.707 224.98 112.948L264.433 62.9573L227.177 15.7512C226.578 14.9921 227.121 13.8793 228.091 13.8793H246.375C246.732 13.8793 247.068 14.0423 247.289 14.3214L275.053 49.5006L302.818 14.3214C303.038 14.0423 303.375 13.8793 303.731 13.8793H322.016C322.985 13.8793 323.528 14.9921 322.929 15.7512L285.673 62.9573Z" fill="#101321"/>
        </svg>
        <div class="brand-divider"></div>
        <span class="index-tag">MCP PROXY // POOL</span>
        <span id="connBadge" class="badge badge-disabled">Connecting</span>
      </div>
      <div class="controls">
        <span class="mono muted" style="font-size:11px;text-transform:uppercase">Routing:</span>
        <select id="strategySelect" onchange="updateStrategy(this.value)">
          <option value="least_used">Least Used (Balanced Quota)</option>
          <option value="round_robin">Round Robin (Sequential)</option>
        </select>
        <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer" class="mono muted">
          <input type="checkbox" id="autoRefreshToggle" checked onchange="toggleAutoRefresh(this.checked)" style="margin:0" />
          5S LIVE
        </label>
        <button onclick="loadOverview()">↻ Refresh</button>
      </div>
    </div>
  </nav>

  <main class="container">
    <section class="hero">
      <div class="hero-copy">
        <span class="index-tag index-tag--muted">STREAMABLE HTTP // LOAD BALANCER</span>
        <h1>Neural search at research scale.</h1>
        <p>Multi-key quota pooling, SSE-aware automatic failover, and real-time cost telemetry for Exa MCP.</p>
      </div>
      <div class="controls">
        <button onclick="resetAllStats()">Reset Counters</button>
        <button class="btn-ink" onclick="testAllKeys()" id="btnTestAll">Verify All Active Keys</button>
      </div>
    </section>

    <div class="auth-bar">
      <div class="auth-bar-label">
        <span class="index-tag">AUTH</span>
        <span><strong>Proxy API Key</strong> — authenticates both <code>/mcp</code> clients and this console.</span>
      </div>
      <div class="controls">
        <input type="password" id="proxyKeyInput" placeholder="Enter PROXY_API_KEY..." style="width:260px" class="mono" />
        <button class="btn-primary" onclick="saveProxyKey()">Connect</button>
      </div>
    </div>

    <div class="grid-kpi">
      <div class="stat-card">
        <div class="stat-meta">
          <span>01 // KEY POOL</span>
          <span class="index-tag index-tag--muted">ACTIVE</span>
        </div>
        <div class="stat-value" id="kpiKeys">- / -</div>
        <div class="stat-sub" id="kpiKeysSub">Healthy keys in rotation</div>
      </div>

      <div class="stat-card">
        <div class="stat-meta">
          <span>02 // THROUGHPUT</span>
          <span class="index-tag index-tag--muted">CALLS</span>
        </div>
        <div class="stat-value" id="kpiToolCalls">-</div>
        <div class="stat-sub" id="kpiTotalReq">Total MCP RPCs: -</div>
      </div>

      <div class="stat-card">
        <div class="stat-meta">
          <span>03 // CREDIT LEDGER</span>
          <span class="index-tag">USD</span>
        </div>
        <div class="stat-value" id="kpiCost">$- / $-</div>
        <div class="stat-sub" id="kpiRemaining">Est. Remaining: $-</div>
      </div>

      <div class="stat-card">
        <div class="stat-meta">
          <span>04 // RELIABILITY</span>
          <span class="index-tag index-tag--muted">SLA</span>
        </div>
        <div class="stat-value" id="kpiSuccessRate">-</div>
        <div class="stat-sub" id="kpiFailovers">Auto-failovers: 0</div>
      </div>

      <div class="stat-card">
        <div class="stat-meta">
          <span>05 // LATENCY</span>
          <span class="index-tag index-tag--muted">MEAN</span>
        </div>
        <div class="stat-value" id="kpiLatency">-</div>
        <div class="stat-sub">Upstream mcp.exa.ai</div>
      </div>
    </div>

    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap">
          <span class="index-tag index-tag--muted">PROVISION</span>
          <h2 class="section-title">Add Exa API Keys</h2>
        </div>
        <span class="mono muted" style="font-size:11.5px">~$0.007 / auto search · ~$0.012–$0.015 / deep search</span>
      </div>
      <div class="section-body">
        <div class="add-grid">
          <div>
            <span class="field-label">Single Key Provisioning</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <input type="text" id="singleLabel" placeholder="Label (e.g. Account-1)" style="flex:1;min-width:110px" />
              <input type="text" id="singleKey" placeholder="Exa API Key (UUID)" style="flex:2;min-width:190px" class="mono" />
              <input type="number" id="singleQuota" value="10" step="1" min="1" title="Initial/Monthly Quota ($ USD)" style="width:76px" class="mono" />
              <button class="btn-primary" onclick="addSingleKey()">Add Key</button>
            </div>
            <div class="muted" style="font-size:12.5px;margin-top:8px">
              Set budget ($10 monthly free tier or $20 signup credit). Keys failing with 401/402 are auto-isolated and retried on the next key.
            </div>
          </div>
          <div>
            <span class="field-label">Batch Import (<code>label | key | quotaUsd</code> or raw <code>key</code> per line)</span>
            <div style="display:flex;gap:8px">
              <textarea id="batchKeysInput" rows="2" placeholder="acct-1 | a1b2c3d4-... | 10&#10;acct-2 | e5f6g7h8-... | 20" style="flex:1" class="mono"></textarea>
              <button class="btn-ink" onclick="addBatchKeys()" style="height:auto">Import Batch</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap">
          <span class="index-tag">POOL</span>
          <h2 class="section-title">API Key Pool & Load Distribution</h2>
        </div>
        <div class="controls">
          <span class="mono muted" id="poolSummaryText" style="font-size:11.5px;margin-right:6px">0 keys configured</span>
          <button class="btn-sm" onclick="exportKeys()">Export Keys</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Label</th>
              <th>Masked Key</th>
              <th>Status</th>
              <th>Load Share</th>
              <th>Calls (OK / Err)</th>
              <th>Spend / Quota (Est. Left)</th>
              <th>Last Used</th>
              <th>Last Error</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="keysTableBody">
            <tr><td colspan="10" class="muted" style="text-align:center;padding:28px">Enter PROXY_API_KEY above to inspect key pool.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap">
          <span class="index-tag index-tag--muted">TELEMETRY</span>
          <h2 class="section-title">Recent MCP Call Logs</h2>
          <span class="mono muted" style="font-size:11px">(Click row to expand)</span>
        </div>
        <div class="controls">
          <button class="btn-sm btn-danger" onclick="clearLogs()">Clear Logs</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Tool / Method</th>
              <th>Query / Target Preview</th>
              <th>Key Used</th>
              <th>Status</th>
              <th>Cost</th>
              <th>Latency</th>
              <th>Note / Error</th>
            </tr>
          </thead>
          <tbody id="logsTableBody">
            <tr><td colspan="8" class="muted" style="text-align:center;padding:28px">No call logs recorded yet.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap">
          <span class="index-tag index-tag--muted">CONFIG</span>
          <h2 class="section-title">Pi <code>~/.pi/agent/mcp.json</code> Integration</h2>
        </div>
        <button class="btn-sm btn-primary" onclick="copyMcpConfig()">Copy JSON</button>
      </div>
      <div class="section-body">
        <pre id="mcpConfigPre"></pre>
      </div>
    </section>
  </main>

  <div class="toast" id="toast"></div>

  <script>
    let refreshTimer = null;
    const expandedLogIds = new Set();

    function toggleLogDetail(id) {
      const row = document.getElementById('log-detail-' + id);
      if (!row) return;
      if (expandedLogIds.has(id)) {
        expandedLogIds.delete(id);
        row.style.display = 'none';
      } else {
        expandedLogIds.add(id);
        row.style.display = 'table-row';
      }
    }

    async function exportKeys() {
      try {
        const res = await apiFetch('/api/keys/export');
        if (!res.text) return showToast('No keys to export');
        await navigator.clipboard.writeText(res.text);
        showToast('Copied ' + res.count + ' key(s) (label | key | quota) to clipboard');
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    function showToast(msg) {
      const el = document.getElementById('toast');
      el.textContent = msg;
      el.style.display = 'block';
      clearTimeout(el._t);
      el._t = setTimeout(() => { el.style.display = 'none'; }, 3000);
    }

    function getProxyKey() {
      return localStorage.getItem('exa_proxy_api_key') || '';
    }

    function saveProxyKey() {
      const val = document.getElementById('proxyKeyInput').value.trim();
      localStorage.setItem('exa_proxy_api_key', val);
      showToast('Proxy API Key saved');
      renderMcpSnippet();
      loadOverview();
    }

    function renderMcpSnippet() {
      const origin = window.location.origin;
      const snippet = {
        mcpServers: {
          exa: {
            url: origin + "/mcp?tools=web_search_exa,web_fetch_exa,web_search_advanced_exa,deep_search_exa",
            headers: {
              "x-api-key": getProxyKey() || "\${EXA_PROXY_API_KEY}"
            },
            exposure: "codemode",
            toolExposure: {
              web_search_exa: "direct"
            },
            description: "Real-time web search, advanced search, deep research, and content extraction via Exa LB Proxy"
          }
        }
      };
      document.getElementById('mcpConfigPre').textContent = JSON.stringify(snippet, null, 2);
    }

    async function apiFetch(path, options = {}) {
      const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
      const key = getProxyKey();
      if (key) headers['x-api-key'] = key;
      const res = await fetch(path, Object.assign({}, options, { headers }));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || ('HTTP ' + res.status));
      }
      return data;
    }

    function statusBadge(key) {
      if (!key.enabled) return '<span class="badge badge-disabled">Disabled</span>';
      if (key.status === 'cooldown' && key.cooldown_until > Date.now()) {
        const secs = Math.ceil((key.cooldown_until - Date.now()) / 1000);
        return '<span class="badge badge-cooldown">Cooldown ' + secs + 's</span>';
      }
      if (key.status === 'exhausted') return '<span class="badge badge-exhausted">Exhausted</span>';
      if (key.status === 'invalid') return '<span class="badge badge-invalid">Invalid</span>';
      return '<span class="badge badge-active">Active</span>';
    }

    function logStatusBadge(status) {
      if (status === 'ok') return '<span class="badge badge-active">OK</span>';
      if (status === 'retried') return '<span class="badge badge-cooldown">Retry</span>';
      return '<span class="badge badge-invalid">Error</span>';
    }

    function fmtTime(iso) {
      if (!iso) return '-';
      const d = new Date(iso);
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 60) return diffSec + 's ago';
      if (diffSec < 3600) return Math.floor(diffSec / 60) + 'm ago';
      if (diffSec < 86400) return Math.floor(diffSec / 3600) + 'h ago';
      return d.toISOString().slice(0, 16).replace('T', ' ');
    }

    function esc(s) {
      return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    async function loadOverview() {
      const badge = document.getElementById('connBadge');
      try {
        const data = await apiFetch('/api/overview');
        badge.className = 'badge badge-active';
        badge.textContent = 'ONLINE v' + (data.version || '1.2');

        const cost = Number(data.stats.totalCostUsd || 0);
        const quota = Number(data.stats.totalQuotaUsd || 0);
        const rem = Math.max(0, quota - cost);

        document.getElementById('strategySelect').value = data.stats.strategy || 'least_used';
        document.getElementById('kpiKeys').textContent = data.stats.activeKeys + ' / ' + data.stats.totalKeys;
        document.getElementById('kpiToolCalls').textContent = data.stats.totalToolCalls;
        document.getElementById('kpiTotalReq').textContent = 'Total MCP RPCs: ' + data.stats.totalRequests;
        document.getElementById('kpiCost').textContent = '$' + cost.toFixed(3) + ' / $' + quota.toFixed(0);
        document.getElementById('kpiRemaining').textContent = 'Est. Remaining: $' + rem.toFixed(3);
        document.getElementById('kpiSuccessRate').textContent = data.stats.successRate + '%';
        document.getElementById('kpiFailovers').textContent = 'Auto-failovers: ' + data.stats.totalFailovers;
        document.getElementById('kpiLatency').textContent = data.stats.avgLatencyMs ? (data.stats.avgLatencyMs + ' ms') : '-';
        document.getElementById('poolSummaryText').textContent =
          data.stats.activeKeys + ' ACTIVE OF ' + data.stats.totalKeys + ' KEYS // STRATEGY: ' + String(data.stats.strategy).toUpperCase();

        const totalKeyCalls = data.keys.reduce((acc, k) => acc + (k.total_calls || 0), 0);
        const kb = document.getElementById('keysTableBody');
        if (!data.keys.length) {
          kb.innerHTML = '<tr><td colspan="10" class="muted" style="text-align:center;padding:28px">No Exa API keys in pool yet. Add one above.</td></tr>';
        } else {
          kb.innerHTML = data.keys.map(k => {
            const pct = totalKeyCalls > 0 ? Math.round((k.total_calls / totalKeyCalls) * 100) : 0;
            const kCost = Number(k.total_cost_usd || 0);
            const kQuota = Number(k.quota_usd || 10);
            const kLeft = Math.max(0, kQuota - kCost);
            return '<tr>' +
              '<td class="mono muted">#' + k.id + '</td>' +
              '<td><strong>' + esc(k.label) + '</strong></td>' +
              '<td class="mono muted">' + esc(k.masked_key) + '</td>' +
              '<td>' + statusBadge(k) + '</td>' +
              '<td><div class="bar-wrap"><div class="bar-fill" style="width:' + pct + '%"></div></div><span class="mono">' + pct + '%</span></td>' +
              '<td class="mono">' + k.total_calls + ' <span class="muted">(' + k.success_calls + ' / ' + k.error_calls + ')</span></td>' +
              '<td class="mono">$' + kCost.toFixed(3) + ' / $' + kQuota.toFixed(2) + ' <span class="muted">($' + kLeft.toFixed(2) + ')</span></td>' +
              '<td class="mono muted" title="' + esc(k.last_used_at || '') + '">' + fmtTime(k.last_used_at) + '</td>' +
              '<td class="err-text" title="' + esc(k.last_error || '') + '">' + esc(k.last_error || '-') + '</td>' +
              '<td><div style="display:flex;gap:4px">' +
                '<button class="btn-sm" onclick="testKey(' + k.id + ', this)">Test</button>' +
                '<button class="btn-sm" onclick="editQuota(' + k.id + ', ' + kQuota + ')">Quota</button>' +
                '<button class="btn-sm" onclick="toggleKey(' + k.id + ', ' + (!k.enabled) + ')">' + (k.enabled ? 'Disable' : 'Enable') + '</button>' +
                ((k.status !== 'active' || k.last_error) ? '<button class="btn-sm" onclick="resetKey(' + k.id + ')">Reset</button>' : '') +
                '<button class="btn-sm btn-danger" onclick="deleteKey(' + k.id + ')">Del</button>' +
              '</div></td>' +
            '</tr>';
          }).join('');
        }

        const lb = document.getElementById('logsTableBody');
        if (!data.logs.length) {
          lb.innerHTML = '<tr><td colspan="8" class="muted" style="text-align:center;padding:28px">No tool calls recorded yet.</td></tr>';
        } else {
          lb.innerHTML = data.logs.map(l => {
            const c = Number(l.cost_usd || 0);
            const isOpen = expandedLogIds.has(l.id);
            return '<tr class="log-row" onclick="toggleLogDetail(' + l.id + ')">' +
              '<td class="muted mono" title="' + esc(l.timestamp) + '">' + fmtTime(l.timestamp) + '</td>' +
              '<td><span class="badge badge-tool">' + esc(l.tool_name || l.method) + '</span></td>' +
              '<td class="query-cell" title="' + esc(l.query_preview || '') + '">' + esc(l.query_preview || '-') + '</td>' +
              '<td class="mono">' + (l.key_label ? (esc(l.key_label) + ' <span class="muted">(' + esc(l.masked_key) + ')</span>') : '-') + '</td>' +
              '<td>' + logStatusBadge(l.status) + '</td>' +
              '<td class="mono">' + (c > 0 ? ('$' + c.toFixed(3)) : '-') + '</td>' +
              '<td class="mono">' + (l.latency_ms != null ? (l.latency_ms + ' ms') : '-') + '</td>' +
              '<td class="err-text" title="' + esc(l.error_message || '') + '">' + esc(l.error_message || '-') + '</td>' +
            '</tr>' +
            '<tr class="log-detail-row" id="log-detail-' + l.id + '" style="display:' + (isOpen ? 'table-row' : 'none') + '">' +
              '<td colspan="8"><div class="log-detail-box">' +
                '<div><strong>Log #' + l.id + '</strong> · ' + esc(l.timestamp) + ' · HTTP ' + esc(l.http_status) + ' · Key: ' + esc(l.key_label || '-') + ' (' + esc(l.masked_key || '-') + ')</div>' +
                '<div><strong>Query / Payload:</strong> ' + esc(l.query_preview || '-') + '</div>' +
                (l.error_message ? ('<div style="color:var(--accent-maroon-dark)"><strong>Note / Error:</strong> ' + esc(l.error_message) + '</div>') : '') +
              '</div></td>' +
            '</tr>';
          }).join('');
        }
      } catch (err) {
        badge.className = 'badge badge-invalid';
        badge.textContent = err.message;
      }
    }

    async function addSingleKey() {
      const label = document.getElementById('singleLabel').value.trim();
      const apiKey = document.getElementById('singleKey').value.trim();
      const quotaUsd = Number(document.getElementById('singleQuota').value) || 10;
      if (!apiKey) return showToast('Please enter an Exa API key');
      try {
        const res = await apiFetch('/api/keys', {
          method: 'POST',
          body: JSON.stringify({ keys: [{ label, apiKey, quotaUsd }] })
        });
        document.getElementById('singleLabel').value = '';
        document.getElementById('singleKey').value = '';
        showToast('Added ' + res.added + ' key(s)');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function addBatchKeys() {
      const rawText = document.getElementById('batchKeysInput').value.trim();
      if (!rawText) return showToast('Paste at least one key');
      try {
        const res = await apiFetch('/api/keys', {
          method: 'POST',
          body: JSON.stringify({ rawText })
        });
        document.getElementById('batchKeysInput').value = '';
        showToast('Imported ' + res.added + ' key(s)');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function editQuota(id, curQuota) {
      const input = prompt('Enter quota budget in USD for Key #' + id + ' (e.g. 10 for monthly free tier, 20 for new signup):', String(curQuota));
      if (input === null) return;
      const quotaUsd = Number(input);
      if (!(quotaUsd > 0)) return showToast('Invalid quota amount');
      try {
        await apiFetch('/api/keys/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ quotaUsd })
        });
        showToast('Updated Key #' + id + ' quota to $' + quotaUsd.toFixed(2));
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function resetAllStats() {
      if (!confirm('Reset all key call counts and tracked spend to 0?')) return;
      try {
        await apiFetch('/api/keys/reset-stats', { method: 'POST' });
        showToast('All key counters reset to 0');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function toggleKey(id, enabled) {
      try {
        await apiFetch('/api/keys/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ enabled })
        });
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function resetKey(id) {
      try {
        await apiFetch('/api/keys/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ enabled: true, status: 'active', resetError: true })
        });
        showToast('Key #' + id + ' reset to active');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function testKey(id, btn) {
      const orig = btn.textContent;
      btn.textContent = '...';
      btn.disabled = true;
      try {
        const res = await apiFetch('/api/keys/' + id + '/test', { method: 'POST' });
        showToast(res.ok ? ('Key #' + id + ' OK (' + res.latencyMs + 'ms)') : ('Key #' + id + ' Failed: ' + res.error));
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      } finally {
        btn.textContent = orig;
        btn.disabled = false;
      }
    }

    async function testAllKeys() {
      const btn = document.getElementById('btnTestAll');
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      try {
        const res = await apiFetch('/api/keys/test-all', { method: 'POST' });
        showToast('Verified ' + res.tested + ' keys (' + res.healthy + ' healthy)');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Verify All Active Keys';
      }
    }

    async function deleteKey(id) {
      if (!confirm('Remove key #' + id + ' from pool?')) return;
      try {
        await apiFetch('/api/keys/' + id, { method: 'DELETE' });
        showToast('Deleted key #' + id);
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function updateStrategy(strategy) {
      try {
        await apiFetch('/api/settings', {
          method: 'POST',
          body: JSON.stringify({ strategy })
        });
        showToast('Strategy updated to ' + strategy);
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    async function clearLogs() {
      try {
        await apiFetch('/api/logs', { method: 'DELETE' });
        showToast('Call logs cleared');
        loadOverview();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }

    function copyMcpConfig() {
      const text = document.getElementById('mcpConfigPre').textContent;
      navigator.clipboard.writeText(text);
      showToast('Copied mcp.json snippet');
    }

    function toggleAutoRefresh(enabled) {
      clearInterval(refreshTimer);
      if (enabled) {
        refreshTimer = setInterval(loadOverview, 5000);
      }
    }

    document.getElementById('proxyKeyInput').value = getProxyKey();
    renderMcpSnippet();
    loadOverview();
    toggleAutoRefresh(true);
  </script>
</body>
</html>`;
}
