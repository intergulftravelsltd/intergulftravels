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
    version: '1.6.2',
    date: '2026-10-22',
    items: [
      {
        en: 'Group statement rebuilt as the leader’s document: package price × members = total package, total paid and total due in the summary; the leader (bold) then every member serially; and a payment statement that starts at the total package and comes down with each payment date-wise (voucher under the date, no charge column). "Print receipt" for anyone in a group now opens this statement instead of the person’s own ledger.',
        bn: 'গ্রুপ বিবরণী এখন লিডারের ডকুমেন্ট: সারসংক্ষেপে প্যাকেজের দাম × সদস্য = মোট প্যাকেজ, মোট পরিশোধ ও মোট বকেয়া; লিডার (বোল্ড) তারপর ক্রমানুসারে সদস্যরা; আর পেমেন্ট বিবরণী মোট প্যাকেজ থেকে শুরু হয়ে প্রতিটি পেমেন্টে তারিখ অনুযায়ী কমে আসে (তারিখের নিচে ভাউচার, চার্জ কলাম নেই)। গ্রুপের যে কারও "রসিদ প্রিন্ট" এখন নিজের লেজারের বদলে এই বিবরণী খোলে।',
      },
      {
        en: 'Signatures on every receipt, statement, print and PDF: two identical blocks — the uploaded signature above the line, the name under it — "Prepared by" on the left and "Authorized Signature" on the right.',
        bn: 'প্রতিটি রসিদ, বিবরণী, প্রিন্ট ও PDF-এ স্বাক্ষর: একই রকম দুটি ব্লক — রেখার উপরে আপলোড করা স্বাক্ষর, নিচে নাম — বামে "প্রস্তুতকারী", ডানে "অনুমোদিত স্বাক্ষর"।',
      },
      {
        en: 'Company Profile → Signatures: upload a photo or scan of a signature on white paper; the paper background is removed automatically and only the ink is kept as a transparent PNG. Names for both signatories are saved alongside.',
        bn: 'কোম্পানি প্রোফাইল → স্বাক্ষর: সাদা কাগজে করা স্বাক্ষরের ছবি/স্ক্যান আপলোড করুন; কাগজের সাদা ব্যাকগ্রাউন্ড নিজে থেকে মুছে শুধু কালিটুকু স্বচ্ছ PNG হিসেবে থাকে। দুই স্বাক্ষরকারীর নামও সংরক্ষিত হয়।',
      },
    ],
  },
  {
    version: '1.6.1',
    date: '2026-10-22',
    items: [
      {
        en: 'Receipts and statements redesigned as a compact one-page A4 document: the title with receipt no / date / branch sits beside the letterhead, the account holder and a Summary box (total package, total paid, balance due) sit side by side, ruled tables with a double-ruled total, the logo watermark is never covered, and the admin sidebar / top bar no longer take space on the printed page.',
        bn: 'রসিদ ও বিবরণী নতুন এক-পৃষ্ঠার A4 ডিজাইনে: শিরোনামসহ রসিদ নং / তারিখ / শাখা লেটারহেডের পাশে, হিসাবধারী ও সারসংক্ষেপ বক্স (মোট প্যাকেজ, মোট পরিশোধ, বাকি) পাশাপাশি, রেখা টানা টেবিল ও ডাবল-রুল মোট, লোগোর জলছাপ কখনো ঢাকা পড়ে না, আর প্রিন্টে অ্যাডমিনের সাইডবার / টপবার জায়গা নেয় না।',
      },
      {
        en: 'Statement tables: the voucher number (and the hand-written number) now sit under the date in one column.',
        bn: 'বিবরণীর টেবিলে ভাউচার নং (ও ম্যানুয়াল নং) এখন তারিখের নিচে এক কলামে।',
      },
      {
        en: 'Package charge repair: if a passenger has a package but its charge was never posted (due reads 0), the profile shows a warning and a "Post package charge" button; the group card and group statement flag such members as "Charge not posted". Creating a passenger whose charge fails now warns instead of silently skipping.',
        bn: 'প্যাকেজ খরচ মেরামত: কোনো যাত্রীর প্যাকেজ থাকলেও খরচ পোস্ট না হলে (বকেয়া ০ দেখালে) প্রোফাইলে সতর্কবার্তা ও "প্যাকেজ খরচ পোস্ট করুন" বাটন; গ্রুপ কার্ড ও গ্রুপ বিবরণীতে এমন সদস্যে "খরচ পোস্ট হয়নি" চিহ্ন। নতুন যাত্রী যোগের সময় খরচ ব্যর্থ হলে এখন নীরবে বাদ না গিয়ে সতর্ক করে।',
      },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-10-22',
    items: [
      {
        en: 'New SMS section: send one message to any single passenger, to everyone, to chosen or all care-of / group leaders, or to typed numbers — through the agency’s khudebarta.com masking gateway. {name}, {due}, {paid}, {package} fill in per recipient; live SMS-part count and preview; batch sending with progress and retry; an SMS History page; per-agency SMS Settings with a test send (migration 0013 for the log).',
        bn: 'নতুন এসএমএস সেকশন: একজন যাত্রী, সবাই, নির্দিষ্ট বা সব কেয়ার অফ / গ্রুপ লিডার, কিংবা লেখা নম্বরে — এজেন্সির khudebarta.com মাস্কিং গেটওয়ে দিয়ে বার্তা পাঠান। {name}, {due}, {paid}, {package} প্রতি প্রাপকের জন্য বসে যায়; লাইভ এসএমএস সংখ্যা ও প্রিভিউ; প্রগ্রেস ও রিট্রাইসহ ব্যাচে পাঠানো; এসএমএস ইতিহাস পেজ; এজেন্সিভিত্তিক এসএমএস সেটিংস ও টেস্ট পাঠানো (লগের জন্য মাইগ্রেশন 0013)।',
      },
      {
        en: 'Printed / PDF / Excel passenger and pilgrim lists: a group member now shows "Group with <head>" under Paid with a bold amber name (the head in bold green with the member count), so single and grouped people read apart at a glance; the title / printed-on / record-count block moved top-right beside the letterhead so the table starts higher; a ruled Total line for Paid and Due under every list.',
        bn: 'প্রিন্ট / PDF / Excel যাত্রী ও হাজী তালিকা: গ্রুপের সদস্যের পরিশোধ কলামে এখন “গ্রুপ: <প্রধান>” ও বোল্ড হলুদ নাম (প্রধান বোল্ড সবুজে, সদস্য সংখ্যাসহ) — কে একা আর কে গ্রুপে তা এক নজরে বোঝা যায়; শিরোনাম / প্রিন্টের তারিখ / রেকর্ড সংখ্যা লেটারহেডের পাশে উপরে ডানে — টেবিল উপর থেকে শুরু হয়; প্রতিটি তালিকার নিচে রেখা টানা মোট পরিশোধ ও বকেয়া।',
      },
      {
        en: 'Hajj and Umrah lists: the five Manage buttons are now one “⋯” menu per row — Print receipt, Shareable form link, Document checklist, Send SMS, Edit, Remove.',
        bn: 'হজ ও উমরাহ তালিকা: ম্যানেজ কলামের পাঁচটি বাটন এখন প্রতি সারিতে একটি “⋯” মেনু — রসিদ প্রিন্ট, শেয়ারযোগ্য ফরম লিংক, ডকুমেন্ট চেকলিস্ট, এসএমএস পাঠান, সম্পাদনা, সরান।',
      },
      {
        en: 'Bangla typeface switched to Noto Sans Bengali across the whole site (Bangla version, Bangla text on the English version, and print windows).',
        bn: 'পুরো সাইটের বাংলা ফন্ট এখন Noto Sans Bengali (বাংলা ভার্সন, ইংরেজি ভার্সনের বাংলা লেখা ও প্রিন্ট উইন্ডো)।',
      },
    ],
  },
  {
    version: '1.5.3',
    date: '2026-09-07',
    items: [
      {
        en: 'Pagination on every long list — Hajj, Umrah, Care-of, Vouchers, Account Heads, Ledger, Cash Book, Customer Dues, Expenses, Receipts and Activity: choose 10 / 25 / 50 / 100 per page, jump with Prev · 1 2 3 · Next. Exports still include every row.',
        bn: 'সব লম্বা তালিকায় পেজিনেশন — হজ, উমরাহ, কেয়ার অফ, ভাউচার, হিসাব খাত, লেজার, ক্যাশ বই, গ্রাহক বকেয়া, ব্যয়, রসিদ ও কার্যকলাপ: প্রতি পাতায় ১০ / ২৫ / ৫০ / ১০০, আগের · ১ ২ ৩ · পরের দিয়ে যাওয়া যায়। এক্সপোর্টে সব সারি থাকে।',
      },
      {
        en: 'Hajj list: the year is now a dropdown inside the filter bar, plus a Sort option (newest, name, tracking no., due, paid); Umrah gets sort by newest, name, due, paid or passport expiry.',
        bn: 'হজ তালিকা: সাল এখন ফিল্টার বারের ভেতরে ড্রপডাউন, সাথে সাজানোর অপশন (নতুন, নাম, ট্র্যাকিং নং, বকেয়া, পরিশোধ); উমরাহতে নতুন, নাম, বকেয়া, পরিশোধ বা পাসপোর্ট মেয়াদ অনুযায়ী সাজানো যায়।',
      },
    ],
  },
  {
    version: '1.5.2',
    date: '2026-09-07',
    items: [
      {
        en: 'Searchable account-head pickers on Daily Entry (Journal, Expense, Income, Cash ⇄ Bank), the Expenses form and voucher edit: click to see the whole list, type a name, mobile number or code to filter, scroll or use the arrow keys, Enter to pick.',
        bn: 'দৈনিক এন্ট্রি (জার্নাল, ব্যয়, আয়, নগদ ⇄ ব্যাংক), ব্যয় ফর্ম ও ভাউচার সম্পাদনায় খোঁজার সুবিধাসহ হিসাব খাত পিকার: ক্লিক করলেই পুরো তালিকা, নাম, মোবাইল নম্বর বা কোড লিখলে ফিল্টার, স্ক্রল বা অ্যারো কি দিয়ে বাছাই, Enter দিয়ে নির্বাচন।',
      },
    ],
  },
  {
    version: '1.5.1',
    date: '2026-09-06',
    items: [
      {
        en: 'Packages can be removed again: "Remove package" on a Hajj or Umrah profile clears the package and reverses its charge in the ledger (payments stay). Changing to a different package reverses the old charge and posts the new price.',
        bn: 'প্যাকেজ বাদ দেওয়া যায়: হজ বা উমরাহ প্রোফাইলে "প্যাকেজ বাদ দিন" দিলে প্যাকেজ সরে যায় এবং লেজার থেকে তার খরচ reverse হয় (পেমেন্ট থাকে)। অন্য প্যাকেজ দিলে আগের খরচ reverse হয়ে নতুন দাম বসে।',
      },
      {
        en: 'Registration type is never changed automatically — assigning a package keeps the pilgrim Pre-registered until staff change it.',
        bn: 'নিবন্ধনের ধরন কখনো নিজে থেকে বদলায় না — প্যাকেজ দিলেও হাজী প্রাক-নিবন্ধিত থাকে, স্টাফ বদলালে তবেই বদলায়।',
      },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-09-06',
    items: [
      {
        en: 'Group Fund accounts: a Care-of / group leader can be switched to "Group Fund" — bulk money they send is credited to their own ledger head and every package assigned to a pilgrim under them is debited from it, so the leader\'s statement shows total received, package charges and advance / due. Pilgrims under a Group Fund carry no individual due.',
        bn: 'গ্রুপ ফান্ড অ্যাকাউন্ট: কেয়ার অফ / গ্রুপ লিডারকে "Group Fund" মোডে দিলে তার পাঠানো টাকা তার নিজের লেজার হেডে জমা হয় এবং তার আন্ডারের হাজীকে প্যাকেজ দিলে সেই খরচ ওই হেড থেকে কাটা হয়; লিডারের বিবরণীতে মোট জমা, প্যাকেজ খরচ ও অগ্রিম/পাওনা দেখা যায়। ওই হাজীদের আলাদা কোনো বকেয়া থাকে না।',
      },
      {
        en: 'Care-of lists now live inside each section: Hajj → Care of (Hajj), Umrah → Care of (Umrah). Each record is tagged Hajj, Umrah or both.',
        bn: 'কেয়ার অফ তালিকা এখন প্রতিটি সেকশনের ভেতরে: হজ → কেয়ার অফ (হজ), উমরাহ → কেয়ার অফ (উমরাহ)। প্রতিটি রেকর্ড হজ, উমরাহ বা উভয় হিসেবে ট্যাগ করা।',
      },
      {
        en: 'Male / Female filter on the Hajj and Umrah lists (Umrah passengers get a gender field), gender column in exports, and a single-row filter bar with a compact search box.',
        bn: 'হজ ও উমরাহ তালিকায় পুরুষ / মহিলা ফিল্টার (উমরাহ যাত্রীতে লিঙ্গ ফিল্ড), এক্সপোর্টে লিঙ্গ কলাম এবং ছোট সার্চ বক্সসহ এক লাইনের ফিল্টার বার।',
      },
    ],
  },
  {
    version: '1.4.1',
    date: '2026-09-06',
    items: [
      {
        en: 'Choose what to print: every Excel / PDF / Print export now has a Columns picker — tick only the columns you need (e.g. Name, Phone, Tracking No.), add a serial-number column, and the choice is remembered per list.',
        bn: 'কী প্রিন্ট হবে বেছে নিন: প্রতিটি Excel / PDF / Print এক্সপোর্টে এখন কলাম পিকার — শুধু দরকারি কলাম টিক দিন (যেমন নাম, ফোন, ট্র্যাকিং নং), ক্রমিক নং কলাম যোগ করুন; পছন্দ প্রতিটি তালিকার জন্য মনে রাখা হয়।',
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-09-06',
    items: [
      {
        en: 'Multi-tenant letterhead: every ledger, statement, receipt and Excel/PDF/Print export now carries the signed-in agency’s own name, logo, Head Office, Branch Office, mobile and email — editable under Company Profile.',
        bn: 'মাল্টি-টেন্যান্ট লেটারহেড: প্রতিটি লেজার, বিবরণী, রসিদ ও Excel/PDF/Print এক্সপোর্টে এখন লগইন করা এজেন্সির নিজের নাম, লোগো, প্রধান কার্যালয়, শাখা কার্যালয়, মোবাইল ও ইমেইল — কোম্পানি প্রোফাইল থেকে সম্পাদনযোগ্য।',
      },
      {
        en: 'Logo watermark (~16 %) centred on every printed page, "Statement for the period" line, and a Prepared by / Authorized Signature footer on all statements.',
        bn: 'প্রতিটি প্রিন্ট পৃষ্ঠার মাঝখানে লোগো জলছাপ (~১৬%), “বিবরণীর সময়কাল” লাইন এবং সব বিবরণীতে প্রস্তুতকারী / অনুমোদিত স্বাক্ষর ফুটার।',
      },
      {
        en: 'Manual Voucher / Receipt No. field on every entry form (daily entry, expense, loan, payments, group payment) — stored separately (migration 0011) and printed in ledgers, the voucher register and statements.',
        bn: 'প্রতিটি এন্ট্রি ফর্মে ম্যানুয়াল ভাউচার / রসিদ নং ফিল্ড — আলাদা কলামে সংরক্ষিত (মাইগ্রেশন 0011) এবং লেজার, ভাউচার রেজিস্টার ও বিবরণীতে প্রিন্ট হয়।',
      },
      {
        en: 'Account-head ledger got a date filter, a full Narration column next to "Against", and a brought-forward opening for the chosen period.',
        bn: 'হিসাব খাতের লেজারে তারিখ ফিল্টার, “বিপরীতে”-র পাশে পূর্ণ বিবরণ কলাম এবং নির্বাচিত সময়কালের পূর্বের জের।',
      },
      {
        en: 'Hajj pilgrims now stay Pre-registered until staff change them; Hajj/Umrah list exports moved into one compact Export menu.',
        bn: 'হজ হাজী এখন স্টাফ পরিবর্তন না করা পর্যন্ত প্রাক-নিবন্ধিত থাকে; হজ/উমরাহ তালিকার এক্সপোর্ট একটি সংক্ষিপ্ত এক্সপোর্ট মেনুতে।',
      },
    ],
  },
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
