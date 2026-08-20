/* ------------------------------------------------------------------ *
 *  Release history — every version since the first deployment.
 *  Scheme: patch runs 0→10, then the minor bumps (1.0.10 → 1.1.0).
 *  Newest first. APP_VERSION (the badge in the sidebar) is entry #0.
 * ------------------------------------------------------------------ */

export type ChangelogItem = { en: string; bn: string };
export type ChangelogEntry = {
  version: string;
  /** YYYY-MM-DD */
  date: string;
  items: ChangelogItem[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.3.3',
    date: '2026-08-20',
    items: [
      {
        en: 'Dashboard redesign: animated KPI tiles, 12-month cash-flow towers, money-mix donut and count-up figures with a LIVE badge.',
        bn: 'ড্যাশবোর্ড নতুন রূপে: অ্যানিমেটেড KPI টাইল, ১২ মাসের ক্যাশ-ফ্লো টাওয়ার, মানি-মিক্স ডোনাট ও কাউন্ট-আপ সংখ্যা, সাথে LIVE ব্যাজ।',
      },
      {
        en: 'Date filters became one clean dropdown; the sidebar moved to a bright white theme with a bold selected state.',
        bn: 'ডেট ফিল্টার এখন একটাই পরিচ্ছন্ন ড্রপডাউন; সাইডবার সাদা থিমে, নির্বাচিত মেনু স্পষ্ট হাইলাইটে।',
      },
      {
        en: 'This changelog page itself — full version history from day one.',
        bn: 'এই চেঞ্জলগ পেজটিও নতুন — প্রথম দিন থেকে পূর্ণ ভার্সন ইতিহাস।',
      },
    ],
  },
  {
    version: '1.3.2',
    date: '2026-08-18',
    items: [
      {
        en: 'Speed overhaul shipped: the whole admin now answers from one round-trip per screen wherever possible.',
        bn: 'স্পিড ওভারহল রিলিজ: অ্যাডমিনের প্রতিটি স্ক্রিন যেখানে সম্ভব এক রাউন্ড-ট্রিপেই উত্তর দেয়।',
      },
      {
        en: 'New database migration (0009) with the one-call dashboard summary and hot-path indexes.',
        bn: 'নতুন ডাটাবেস মাইগ্রেশন (0009): এক-কলে ড্যাশবোর্ড সামারি ও দ্রুতগতির ইনডেক্স।',
      },
    ],
  },
  {
    version: '1.3.1',
    date: '2026-08-16',
    items: [
      {
        en: 'Admin loaders parallelized; videos and partner logos now served from cache instead of live queries.',
        bn: 'অ্যাডমিন লোডারগুলো প্যারালাল; ভিডিও ও পার্টনার লোগো এখন লাইভ কোয়েরির বদলে ক্যাশ থেকে আসে।',
      },
      {
        en: 'Both-language dictionaries left the browser bundle — pages load lighter.',
        bn: 'দুই ভাষার ডিকশনারি ব্রাউজার বান্ডেল থেকে বাদ — পেজ এখন হালকা।',
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-08-14',
    items: [
      {
        en: 'One-call dashboard: balances, period sums, counts and recent activity computed inside the database.',
        bn: 'এক-কলের ড্যাশবোর্ড: ব্যালেন্স, সময়ভিত্তিক যোগফল, সংখ্যা ও সাম্প্রতিক কার্যক্রম ডাটাবেসের ভেতরেই হিসাব হয়।',
      },
      {
        en: 'Hot-path indexes added across transactions, heads, pilgrims, payments and loans.',
        bn: 'লেনদেন, খাত, হাজী, পেমেন্ট ও ঋণে দ্রুতগতির ইনডেক্স যুক্ত হলো।',
      },
    ],
  },
  {
    version: '1.2.10',
    date: '2026-08-12',
    items: [
      {
        en: 'Request-cached authentication: one auth lookup per request instead of four to five.',
        bn: 'রিকোয়েস্ট-ক্যাশড অথেনটিকেশন: প্রতি রিকোয়েস্টে চার-পাঁচবারের বদলে একবারই অথ যাচাই।',
      },
    ],
  },
  {
    version: '1.2.9',
    date: '2026-08-10',
    items: [
      {
        en: 'Airlines–visa exports and the consolidated cash book: every bank plus hand cash in one running statement.',
        bn: 'এয়ারলাইনস-ভিসা এক্সপোর্ট ও সমন্বিত ক্যাশ বই: সব ব্যাংক আর হাতে নগদ এক চলমান হিসাবে।',
      },
    ],
  },
  {
    version: '1.2.8',
    date: '2026-08-08',
    items: [
      {
        en: 'Program-aware document checklist and a printable document matrix report.',
        bn: 'প্রোগ্রাম-সচেতন ডকুমেন্ট চেকলিস্ট ও প্রিন্টযোগ্য ডকুমেন্ট ম্যাট্রিক্স রিপোর্ট।',
      },
    ],
  },
  {
    version: '1.2.7',
    date: '2026-08-06',
    items: [
      {
        en: 'Group statements labelled by cash/bank source; multi-page printing fixed.',
        bn: 'গ্রুপ স্টেটমেন্টে নগদ/ব্যাংক উৎসের লেবেল; মাল্টি-পেজ প্রিন্ট ঠিক হলো।',
      },
    ],
  },
  {
    version: '1.2.6',
    date: '2026-08-04',
    items: [
      {
        en: 'Group accounts: member dues roll up under the head with netting, plus a date-wise combined statement.',
        bn: 'গ্রুপ অ্যাকাউন্ট: সদস্যদের পাওনা প্রধানের অধীনে নেটিংসহ একত্রে, সাথে তারিখ-ভিত্তিক সম্মিলিত স্টেটমেন্ট।',
      },
      {
        en: 'Group summaries stay in sync everywhere the member appears.',
        bn: 'সদস্য যেখানেই দেখা যাক, গ্রুপ সারসংক্ষেপ সব জায়গায় মিলে থাকে।',
      },
    ],
  },
  {
    version: '1.2.5',
    date: '2026-08-02',
    items: [
      {
        en: 'Permanent family groups: assign a head and member accounts roll into one combined, printable statement.',
        bn: 'স্থায়ী পারিবারিক গ্রুপ: প্রধান নির্ধারণ করলে সদস্যদের হিসাব এক সম্মিলিত প্রিন্টযোগ্য স্টেটমেন্টে আসে।',
      },
    ],
  },
  {
    version: '1.2.4',
    date: '2026-08-01',
    items: [
      {
        en: 'English became the default language; Bangla moved to /bn with old links redirected.',
        bn: 'ইংরেজি এখন ডিফল্ট ভাষা; বাংলা /bn ঠিকানায়, পুরোনো লিংক স্বয়ংক্রিয়ভাবে রিডাইরেক্ট হয়।',
      },
      {
        en: 'Receipt No now follows the auto voucher number; softer centred watermark and translucent boxes for clean printing.',
        bn: 'রসিদ নম্বর এখন অটো ভাউচার নম্বর অনুযায়ী; নরম কেন্দ্রীয় ওয়াটারমার্ক ও স্বচ্ছ বক্সে পরিষ্কার প্রিন্ট।',
      },
    ],
  },
  {
    version: '1.2.3',
    date: '2026-07-31',
    items: [
      {
        en: 'Faster public pages: cached loaders and lighter payloads across the website.',
        bn: 'পাবলিক পেজ আরও দ্রুত: ক্যাশড লোডার ও হালকা পেলোড পুরো ওয়েবসাইট জুড়ে।',
      },
    ],
  },
  {
    version: '1.2.2',
    date: '2026-07-29',
    items: [
      {
        en: 'Watermarked receipts rolled out across every print view.',
        bn: 'সব প্রিন্ট ভিউতে ওয়াটারমার্কযুক্ত রসিদ চালু হলো।',
      },
    ],
  },
  {
    version: '1.2.1',
    date: '2026-07-27',
    items: [
      {
        en: 'Shareable pilgrim forms went live with secure tokenized links.',
        bn: 'শেয়ারযোগ্য হাজী ফর্ম চালু — নিরাপদ টোকেন লিংকসহ।',
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-07-25',
    items: [
      {
        en: 'The 14-item per-pilgrim document checklist shipped.',
        bn: 'হাজীপ্রতি ১৪-ধাপের ডকুমেন্ট চেকলিস্ট চালু হলো।',
      },
    ],
  },
  {
    version: '1.1.10',
    date: '2026-07-23',
    items: [
      {
        en: 'Hardening pass: strict input validation on every admin API.',
        bn: 'নিরাপত্তা ধাপ: প্রতিটি অ্যাডমিন API-তে কড়া ইনপুট যাচাই।',
      },
    ],
  },
  {
    version: '1.1.9',
    date: '2026-07-21',
    items: [
      {
        en: 'Public pages speed pass: right-sized images and fewer blocking assets.',
        bn: 'পাবলিক পেজ গতি-পর্ব: সঠিক মাপের ছবি, ব্লকিং অ্যাসেট কমানো।',
      },
    ],
  },
  {
    version: '1.1.8',
    date: '2026-07-19',
    items: [
      {
        en: 'Receipt watermark polish for faithful print output.',
        bn: 'প্রিন্টে নিখুঁত ফল পেতে রসিদের ওয়াটারমার্ক ঘষামাজা।',
      },
    ],
  },
  {
    version: '1.1.7',
    date: '2026-07-17',
    items: [
      {
        en: 'Group payment flow: one payment run posts vouchers across many members.',
        bn: 'গ্রুপ পেমেন্ট ফ্লো: এক দফাতেই বহু সদস্যের ভাউচার পোস্ট হয়।',
      },
    ],
  },
  {
    version: '1.1.6',
    date: '2026-07-15',
    items: [
      {
        en: 'Custom discounts as pure double-entry — the due drops and the discount shows as its own ledger line.',
        bn: 'কাস্টম ডিসকাউন্ট বিশুদ্ধ ডাবল-এন্ট্রিতে — পাওনা কমে, ডিসকাউন্ট লেজারে আলাদা লাইনে দেখায়।',
      },
    ],
  },
  {
    version: '1.1.5',
    date: '2026-07-13',
    items: [
      {
        en: 'Shareable pilgrim profile forms took shape (tokenized links, print-friendly).',
        bn: 'শেয়ারযোগ্য হাজী প্রোফাইল ফর্মের কাঠামো দাঁড়াল (টোকেন লিংক, প্রিন্ট-বান্ধব)।',
      },
    ],
  },
  {
    version: '1.1.4',
    date: '2026-07-11',
    items: [
      {
        en: 'Per-pilgrim document tracker designed — the 14-step checklist drafted.',
        bn: 'হাজীপ্রতি ডকুমেন্ট ট্র্যাকারের নকশা — ১৪-ধাপের চেকলিস্টের খসড়া।',
      },
    ],
  },
  {
    version: '1.1.3',
    date: '2026-07-09',
    items: [
      {
        en: 'Receipt layout refinements: numbering, spacing and print margins.',
        bn: 'রসিদ লেআউট পরিমার্জন: নম্বরিং, ফাঁকা জায়গা ও প্রিন্ট মার্জিন।',
      },
    ],
  },
  {
    version: '1.1.2',
    date: '2026-07-07',
    items: [
      {
        en: 'Umrah paid figures now read from the ledger; clean Bangla glyphs with Hind Siliguri.',
        bn: 'উমরাহর পরিশোধ এখন লেজার থেকে আসে; হিন্দ শিলিগুড়িতে ঝকঝকে বাংলা হরফ।',
      },
    ],
  },
  {
    version: '1.1.1',
    date: '2026-07-06',
    items: [
      {
        en: 'All account heads unlocked for editing; clickable dashboard cards.',
        bn: 'সব হিসাব খাত সম্পাদনার জন্য উন্মুক্ত; ড্যাশবোর্ড কার্ডে ক্লিক করা যায়।',
      },
      {
        en: 'Customer ledger grouping and the care-of group ledger with in-depth statement receipts.',
        bn: 'গ্রাহক লেজার গ্রুপিং ও কেয়ার-অফ গ্রুপ লেজার, বিস্তারিত স্টেটমেন্ট রসিদসহ।',
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-07-04',
    items: [
      {
        en: 'Care-of / affiliate registry with per-pilgrim document status.',
        bn: 'কেয়ার-অফ / এফিলিয়েট রেজিস্ট্রি, হাজীপ্রতি ডকুমেন্ট স্ট্যাটাসসহ।',
      },
      {
        en: 'Voucher money receipts; bank overdraft split out from bank balance.',
        bn: 'ভাউচার মানি রসিদ; ব্যাংক ব্যালেন্স থেকে ওভারড্রাফট আলাদা।',
      },
    ],
  },
  {
    version: '1.0.10',
    date: '2026-07-02',
    items: [
      {
        en: 'Money receipts: per-payment printable invoice plus a bulk receipts page, branch-branded.',
        bn: 'মানি রসিদ: প্রতিটি পেমেন্টের প্রিন্টযোগ্য ইনভয়েস ও একসাথে বাল্ক রসিদ পেজ, শাখা-ব্র্যান্ডেড।',
      },
      {
        en: 'Same-named people disambiguated; bank overdrafts allowed.',
        bn: 'একই নামের ব্যক্তি আলাদা করে চেনা যায়; ব্যাংক ওভারড্রাফটের অনুমতি।',
      },
    ],
  },
  {
    version: '1.0.9',
    date: '2026-07-01',
    items: [
      {
        en: 'Website package CMS with itemised costing, profit and seat-progress cards.',
        bn: 'ওয়েবসাইট প্যাকেজ CMS — খরচের খাতওয়ারি হিসাব, লাভ ও সিট-অগ্রগতি কার্ডসহ।',
      },
      {
        en: 'Date-range filters and snappier navigation across the admin.',
        bn: 'ডেট-রেঞ্জ ফিল্টার ও পুরো অ্যাডমিনে আরও ক্ষিপ্র নেভিগেশন।',
      },
    ],
  },
  {
    version: '1.0.8',
    date: '2026-06-30',
    items: [
      {
        en: 'Fully bilingual: the entire website and the whole admin/ERP in Bangla and English, with an instant toggle.',
        bn: 'পুরোপুরি দ্বিভাষিক: পুরো ওয়েবসাইট ও সম্পূর্ণ অ্যাডমিন/ERP বাংলা-ইংরেজিতে, সাথে তাৎক্ষণিক টগল।',
      },
    ],
  },
  {
    version: '1.0.7',
    date: '2026-06-28',
    items: [
      {
        en: 'Branch data isolation hardened; staff management polish with safer deletes.',
        bn: 'শাখার ডেটা বিভাজন আরও মজবুত; নিরাপদ ডিলিটসহ স্টাফ ব্যবস্থাপনার ঘষামাজা।',
      },
    ],
  },
  {
    version: '1.0.6',
    date: '2026-06-26',
    items: [
      {
        en: 'Branch admins received the full toolset while their data stays branch-locked; /admin became the single login.',
        bn: 'শাখা অ্যাডমিনরা পেলেন পূর্ণ টুলসেট, ডেটা শাখাতেই সীমাবদ্ধ; /admin এখন একমাত্র লগইন।',
      },
      {
        en: 'Staff & Roles: edit name/phone/password and delete.',
        bn: 'স্টাফ ও ভূমিকা: নাম/ফোন/পাসওয়ার্ড সম্পাদনা ও ডিলিট।',
      },
    ],
  },
  {
    version: '1.0.5',
    date: '2026-06-25',
    items: [
      {
        en: 'Secure Vault for credentials and an account editor.',
        bn: 'পাসওয়ার্ড-তথ্যের জন্য সিকিউর ভল্ট ও অ্যাকাউন্ট এডিটর।',
      },
      {
        en: 'Branch-scoped staff with per-branch system heads so balances never mix.',
        bn: 'শাখাভিত্তিক স্টাফ, শাখাপ্রতি আলাদা সিস্টেম খাত — ব্যালেন্স কখনও মেশে না।',
      },
    ],
  },
  {
    version: '1.0.4',
    date: '2026-06-23',
    items: [
      {
        en: 'Edit and remove on every management record — pilgrims, heads, loans and more.',
        bn: 'প্রতিটি ম্যানেজমেন্ট রেকর্ডে সম্পাদনা ও মুছে ফেলা — হাজী, খাত, ঋণ সবকিছুতে।',
      },
      {
        en: 'Voucher edit & delete with ledger-safe re-posting.',
        bn: 'ভাউচার সম্পাদনা ও ডিলিট, লেজার-নিরাপদ পুনঃপোস্টিংসহ।',
      },
    ],
  },
  {
    version: '1.0.3',
    date: '2026-06-22',
    items: [
      {
        en: 'Blog pagination, RSS feed, image blur placeholders and fixed share previews.',
        bn: 'ব্লগ পেজিনেশন, RSS ফিড, ছবির ব্লার প্লেসহোল্ডার ও শেয়ার প্রিভিউ ঠিক।',
      },
      {
        en: 'Custom confirm dialogs and instant gallery revalidation.',
        bn: 'কাস্টম কনফার্ম ডায়ালগ ও গ্যালারির তাৎক্ষণিক রিফ্রেশ।',
      },
    ],
  },
  {
    version: '1.0.2',
    date: '2026-06-20',
    items: [
      {
        en: 'Media library and gallery manager polish; SEO metadata fine-tuning.',
        bn: 'মিডিয়া লাইব্রেরি ও গ্যালারি ম্যানেজারের ঘষামাজা; SEO মেটাডেটা সূক্ষ্ম টিউনিং।',
      },
    ],
  },
  {
    version: '1.0.1',
    date: '2026-06-18',
    items: [
      {
        en: 'Management ERP foundation, video gallery, partner affiliations, menu builder and a full SEO/performance pass.',
        bn: 'ম্যানেজমেন্ট ERP-র ভিত্তি, ভিডিও গ্যালারি, পার্টনার এফিলিয়েশন, মেনু বিল্ডার ও পূর্ণ SEO/পারফরম্যান্স পর্ব।',
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-06-16',
    items: [
      {
        en: 'First release 🎉 — the Inter Gulf Travels website and management platform went live: Hajj & Umrah pages, packages, blog, gallery and the admin foundation.',
        bn: 'প্রথম রিলিজ 🎉 — ইন্টার গালফ ট্রাভেলস ওয়েবসাইট ও ম্যানেজমেন্ট প্ল্যাটফর্ম চালু: হজ ও উমরাহ পেজ, প্যাকেজ, ব্লগ, গ্যালারি এবং অ্যাডমিনের ভিত্তি।',
      },
    ],
  },
];

/** The version badge shown at the bottom of the admin sidebar. */
export const APP_VERSION = CHANGELOG[0].version;
