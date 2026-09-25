const fs = require('fs');

let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');

const gtmScriptStr = `<Script id="gtm-script">
          {\`
            if (window.location.hostname === 'www.autosleutel24.nl' || window.location.hostname === 'autosleutel24.nl') {
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-PRT75SWX');
            }
          \`}
        </Script>`;

const gtagAdsScript = `
        {/* Google Ads Standalone gtag.js (AW-18315813515) - Added to guarantee conversions bypassing GTM complexity */}
        <Script id="google-ads-script" strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=AW-18315813515" />
        <Script id="google-ads-config">
          {\`
            if (window.location.hostname === 'www.autosleutel24.nl' || window.location.hostname === 'autosleutel24.nl') {
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              // Prevent duplicate pageviews if GA4 in GTM already tracks them
              gtag('config', 'AW-18315813515', { send_page_view: false });
            }
          \`}
        </Script>`;

// insert gtagAdsScript after gtmScriptStr
layout = layout.replace(gtmScriptStr, gtmScriptStr + '\n' + gtagAdsScript);

fs.writeFileSync('src/app/layout.tsx', layout);
