# KeyForCars OpenClaw demo

The OpenClaw gateway and Chromium run as the dedicated kfc-claw service user. Gateway, browser control and CDP listen on loopback. The CRM checks liveness and runs its own deterministic sample-order replies. Gateway carries no model or channel credentials.

Use the pinned npm manifests in this folder with npm ci. Install Chromium using Playwright with PLAYWRIGHT_BROWSERS_PATH=/srv/keyforcars-openclaw/browsers. On Ubuntu install the Chromium runtime libraries and load the included AppArmor profile for this specific Chrome executable. Preserve Chromium sandboxing. Generate a fresh random token in state/openclaw.json based on openclaw.example.json. Restrict that file to the service account and keep browser state out of Git.

Install and verify the systemd gateway unit, then install the browser service and timer. The timer reopens the demo login page when it is absent. If the host is low on available RAM, explicitly size swap and measure peak gateway plus browser memory before enabling either service at boot. Confirm that ports 18789, 18791 and 18800 are never published through the firewall or reverse proxy.

Live WhatsApp, e-mail, site chat, telephony and model credentials are omitted. A successful health check only establishes the local gateway or browser is reachable.
