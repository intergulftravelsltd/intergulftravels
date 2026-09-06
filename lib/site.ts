/* ------------------------------------------------------------------ *
 *  Inter Gulf Travels Ltd — content source of truth
 *  Real company data sourced from the client's reference site.
 *  Admin-editable values (stats, etc.) are seeded here and can later be
 *  overridden from the dashboard `site_settings` table.
 * ------------------------------------------------------------------ */

export const siteConfig = {
  name: 'Inter Gulf Travels Ltd',
  shortName: 'Inter Gulf Travels',
  legalName: 'Inter Gulf Travels Ltd.',
  tagline: 'A reliable name of smooth travelling for Hajj & Umrah — since 2002.',
  description:
    'Inter Gulf Travels Ltd is one of the most trusted Hajj & Umrah agencies in Bangladesh. Government-licensed (Hajj License No. 071), we have guided pilgrims on the journey of a lifetime with honesty, comfort and care since 2002.',
  founded: 2002,
  license: 'Hajj License No. 071',
  url: 'https://intergulftravelsltd.com',
} as const;

export const contact = {
  phones: ['01711 358939', '01716 529232'],
  emails: ['intergulfg47@gmail.com', 'intergulf71@gmail.com'],
  whatsapp: '8801711358939',
  whatsappDisplay: '+880 1711 358939',
  address: {
    line1: '31, Purana Paltan, KR Plaza',
    line2: '5th Floor, Dhaka-1000',
    country: 'Bangladesh',
    full: '31, Purana Paltan, KR Plaza, 5th Floor, Dhaka-1000, Bangladesh',
    mapQuery: 'KR Plaza, Purana Paltan, Dhaka 1000',
  },
  hours: 'Saturday – Thursday · 10:00 AM – 8:00 PM',
} as const;

export const social = [
  { label: 'Facebook', href: 'https://facebook.com/', icon: 'facebook' },
  { label: 'Twitter', href: 'https://twitter.com/', icon: 'twitter' },
  { label: 'Instagram', href: 'https://instagram.com/', icon: 'instagram' },
  { label: 'Telegram', href: 'https://t.me/', icon: 'telegram' },
  { label: 'WhatsApp', href: `https://wa.me/${contact.whatsapp}`, icon: 'whatsapp' },
] as const;

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string; icon?: string; image?: string }[];
};

export const navigation: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Hajj',
    href: '/hajj',
    children: [
      { label: 'Benefit of Hajj', href: '/hajj/benefit', description: 'Why the fifth pillar transforms a life', icon: 'heart' },
      { label: 'Hajj Packages', href: '/hajj/packages', description: '2025–2026 economy to premium plans', icon: 'package' },
      { label: 'Hajj Guide', href: '/hajj/guide', description: 'Step-by-step rites of pilgrimage', icon: 'book' },
      { label: 'Hajj Guideline', href: '/hajj/guideline', description: 'Documents, dates & preparation', icon: 'clipboard' },
      { label: 'FAQ of Hajj', href: '/hajj/faq', description: 'Your questions, answered', icon: 'help' },
    ],
  },
  {
    label: 'Umrah',
    href: '/umrah',
    children: [
      { label: 'Benefit of Umrah', href: '/umrah/benefit', description: 'The reward of the lesser pilgrimage', icon: 'moon' },
      { label: 'Umrah Packages', href: '/umrah/packages', description: 'Year-round 10 to 21-day plans', icon: 'package' },
      { label: 'Umrah Guide', href: '/umrah/guide', description: 'How to perform Umrah correctly', icon: 'book' },
      { label: 'Umrah Guideline', href: '/umrah/guideline', description: 'Visa, travel & checklist', icon: 'clipboard' },
      { label: 'FAQ of Umrah', href: '/umrah/faq', description: 'Common queries explained', icon: 'help' },
    ],
  },
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Visa Service', href: '/services/visa', description: 'Saudi, UAE, Schengen & more', icon: 'stamp' },
      { label: 'Air Ticket', href: '/services/air-ticket', description: 'Worldwide fares, 40+ airlines', icon: 'plane' },
      { label: 'Hotel Booking', href: '/services/hotel-booking', description: 'Steps from the Haramain', icon: 'hotel' },
      { label: 'Tour Packages', href: '/services/tour', description: 'Curated holidays abroad', icon: 'globe' },
    ],
  },
  {
    label: 'Branches',
    href: '/branches',
    children: [
      { label: 'Inter Gulf Travels Ltd.', href: '/branches/inter-gulf-travels', description: 'Hajj License No. 071 · flagship', icon: 'company', image: '/branches/inter-gulf-travels.webp' },
      { label: 'Mokbul Hajj Overseas Service', href: '/branches/mokbul-hajj-overseas', description: 'Govt-approved Hajj & overseas', icon: 'kaaba', image: '/branches/mokbul-hajj-overseas.webp' },
      { label: 'Inter Gulf Air Travels', href: '/branches/inter-gulf-air-travels', description: 'Air tickets · tours · hotels', icon: 'plane', image: '/branches/inter-gulf-air-travels.webp' },
    ],
  },
  {
    label: 'Gallery',
    href: '/gallery',
    children: [
      { label: 'Photo Gallery', href: '/gallery', description: 'Moments from our journeys', icon: 'photo' },
      { label: 'Videos', href: '/videos', description: 'Watch our video guides', icon: 'video' },
    ],
  },
  {
    label: 'Blog',
    href: '/blog',
    children: [
      { label: 'Hajj & Umrah', href: '/blog?category=hajj-umrah', description: 'Guides & spiritual reflections', icon: 'moon' },
      { label: 'Others', href: '/blog?category=others', description: 'Travel tips & destinations', icon: 'newspaper' },
    ],
  },
  {
    label: 'About Us',
    href: '/about',
    children: [
      { label: 'About Us', href: '/about', description: 'Our story since 2002', icon: 'info' },
      { label: 'Business Associates', href: '/about/associates', description: 'Partners & affiliations', icon: 'handshake' },
      { label: 'Career Opportunity', href: '/about/career', description: 'Join the Inter Gulf family', icon: 'briefcase' },
      { label: 'Customer Reviews', href: '/about/reviews', description: 'Pilgrim experiences', icon: 'star' },
      { label: 'Awards & Affiliations', href: '/about/awards', description: 'Recognition & memberships', icon: 'award' },
      { label: 'Management Team', href: '/about/team', description: 'The people behind the journey', icon: 'users' },
    ],
  },
  { label: 'Contact Us', href: '/contact' },
];

export type Office = { label: string; address: string; phones: string[] };

export type Branch = {
  slug: string;
  name: string;
  role: string;
  tagline: string;
  established?: string;
  icon: string;
  logo: string;
  accent: 'emerald' | 'gold';
  summary: string;
  description: string[];
  services: string[];
  offices: Office[];
  email: string;
};

/** The Inter Gulf group of concerns — sourced from the company signboard & card. */
export const branches: Branch[] = [
  {
    slug: 'inter-gulf-travels',
    name: 'Inter Gulf Travels Ltd.',
    role: 'Hajj License No. 071 · Govt. Approved',
    tagline: 'Our flagship Hajj & Umrah company, guiding pilgrims since 2002.',
    established: '2002',
    icon: 'company',
    logo: '/branches/inter-gulf-travels.webp',
    accent: 'emerald',
    summary:
      'The founding company of the Inter Gulf group and a licensed Hajj agency (License No. 071), specialising in complete Hajj and Umrah management.',
    description: [
      'Inter Gulf Travels Ltd. is the flagship of the group and a government-licensed Hajj agency (Hajj License No. 071), a member of HAAB, ATAB and IATA. Since 2002 we have organised Hajj and Umrah journeys for thousands of pilgrims with honesty, comfort and care.',
      'From pre-registration and visa processing to flights, hotels near the Haram, full Ziyarat and Bangla-speaking guides, every part of the journey is managed in-house by our experienced team — so our pilgrims can focus entirely on their worship.',
    ],
    services: [
      'Hajj packages (economy to premium)',
      'Umrah packages year-round',
      'Hajj & Umrah visa processing',
      'Ziyarat & guided tours',
      'Pre-Hajj training workshops',
    ],
    offices: [
      {
        label: 'Head Office',
        address: '31, K.R. Plaza, 5th Floor, Purana Paltan, Dhaka-1000',
        phones: ['01711 358939', '01716 529232', '02-55112270'],
      },
    ],
    email: 'intergulfg47@gmail.com',
  },
  {
    slug: 'mokbul-hajj-overseas',
    name: 'Mokbul Hajj Overseas Service',
    role: 'Govt. Approved Travel Agency',
    tagline: 'Dedicated Hajj and overseas service within the Inter Gulf group.',
    icon: 'kaaba',
    logo: '/branches/mokbul-hajj-overseas.webp',
    accent: 'gold',
    summary:
      'A government-approved travel agency focused on Hajj processing and overseas pilgrim services, working hand-in-hand with our flagship company.',
    description: [
      'Mokbul Hajj Overseas Service is a government-approved member of the Inter Gulf group, dedicated to Hajj pre-registration, processing and overseas pilgrim support.',
      'Sharing the same office, team and standards as Inter Gulf Travels Ltd., it gives pilgrims a second trusted channel for Hajj management, visa processing and document support — with the personal khedmat the group is known for.',
    ],
    services: [
      'Hajj pre-registration & processing',
      'Overseas Hajj & Umrah service',
      'Visa processing & document support',
      'Ground assistance in Saudi Arabia',
    ],
    offices: [
      {
        label: 'Head Office',
        address: '31, K.R. Plaza (5th Floor), Purana Paltan, Dhaka',
        phones: ['01325699588', '01675431118'],
      },
      {
        label: 'Branch Office',
        address: 'Dowlashwar Masjid Market, Sanarpar, Demra, Dhaka',
        phones: [],
      },
    ],
    email: 'mokbuloverseas@gmail.com',
  },
  {
    slug: 'inter-gulf-air-travels',
    name: 'Inter Gulf Air Travels',
    role: 'Govt. Approved Travel Agency',
    tagline: 'Air ticketing, tour packages and hotel booking for the whole world.',
    icon: 'plane',
    logo: '/branches/inter-gulf-air-travels.webp',
    accent: 'emerald',
    summary:
      'The group’s air-ticketing and general travel arm — worldwide air tickets, tour packages, hotel booking and visa processing from Dhaka and Gazipur.',
    description: [
      'Inter Gulf Air Travels is the air-ticketing and general travel arm of the group, a government-approved agency issuing air tickets to every country in the world.',
      'Alongside Hajj & Umrah visa processing, we arrange tour packages and hotel bookings worldwide. With offices in both Purana Paltan, Dhaka and Joydebpur, Gazipur, we are always close to our travellers.',
    ],
    services: [
      'Worldwide air ticket issuance',
      'Hajj & Umrah visa processing',
      'Tour packages',
      'Hotel booking',
    ],
    offices: [
      {
        label: 'Head Office',
        address: '31, K.R. Plaza, 6th Floor, Purana Paltan, Dhaka-1000',
        phones: ['01716 529232', '02-55112270'],
      },
      {
        label: 'Gazipur Office',
        address:
          'Anowara Villa, Block No. I/229, Uttar Bilashpur Road, near Fish Market, Joydebpur Bazar, Gazipur City Corporation',
        phones: ['01976 529232', '01924 560716'],
      },
    ],
    email: 'intergulfg47@gmail.com',
  },
];

/**
 * Company header for a receipt/invoice, resolved to the branch that owns the
 * record. Branch logins get their own concern's name, office address, phones
 * and email; head office / unknown falls back to the group details.
 */
export function branchCompany(branch?: string | null): {
  name: string;
  address: string;
  phone: string;
  email: string;
  license: string;
  logo: string;
} {
  const b = branches.find((x) => x.slug === branch);
  if (b) {
    return {
      name: b.name,
      address: b.offices[0]?.address ?? contact.address.full,
      phone: (b.offices[0]?.phones ?? contact.phones).join(', '),
      email: b.email,
      license: b.role,
      logo: b.logo,
    };
  }
  return {
    name: siteConfig.name,
    address: contact.address.full,
    phone: contact.phones.join(', '),
    email: contact.emails[0],
    license: siteConfig.license,
    logo: branches[0].logo,
  };
}

export const footerLinks = {
  helpSupport: [
    { label: 'Hajj Packages', href: '/hajj/packages' },
    { label: 'Umrah Packages', href: '/umrah/packages' },
    { label: 'Our Branches', href: '/branches' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Blog', href: '/blog' },
    { label: 'About Us', href: '/about' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
  usefulLinks: [
    { label: 'BD Hajj Management', href: 'https://hajj.gov.bd' },
    { label: 'Ministry of Religious Affairs', href: 'https://mora.gov.bd' },
    { label: 'HAAB Bangladesh', href: 'https://haab.com.bd' },
    { label: 'ATAB', href: 'https://atab.org.bd' },
    { label: 'Saudi e-Hajj Portal', href: 'https://www.haj.gov.sa' },
    { label: 'Biman Bangladesh Airlines', href: 'https://www.biman-airlines.com' },
    { label: 'Saudia Airlines', href: 'https://www.saudia.com' },
    { label: 'Saudi e-Visa', href: 'https://visa.visitsaudi.com' },
  ],
} as const;

export const stats = [
  { value: 2002, suffix: '', label: 'Serving Pilgrims Since', plain: 'Since 2002' },
  { value: 12000, suffix: '+', label: 'Pilgrims Guided' },
  { value: 40, suffix: '+', label: 'Airline Partners' },
  { value: 100, suffix: '%', label: 'Government Licensed' },
] as const;

export type Service = {
  slug: string;
  title: string;
  icon: string;
  tagline: string;
  description: string;
  features: string[];
};

export const services: Service[] = [
  {
    slug: 'hajj',
    title: 'Hajj Packages',
    icon: 'kaaba',
    tagline: 'The journey of a lifetime',
    description:
      'Complete, government-approved Hajj packages with direct flights, hotels close to the Haram, full Ziyarat, experienced Bangla-speaking guides and pre-departure training workshops.',
    features: ['Direct Saudia / Biman flights', 'Hotels near the Haram', 'Full Ziyarat & guide', 'Pre-Hajj training workshop'],
  },
  {
    slug: 'umrah',
    title: 'Umrah Packages',
    icon: 'moon',
    tagline: 'Year-round spiritual journeys',
    description:
      'Flexible 10 to 21-day Umrah programmes throughout the year, with transparent pricing, comfortable accommodation and dedicated on-ground support from arrival to return.',
    features: ['10 / 14 / 21-day plans', 'Premium & economy tiers', 'Makkah–Madinah transfers', '24/7 ground assistance'],
  },
  {
    slug: 'visa',
    title: 'Visa Service',
    icon: 'passport',
    tagline: 'Borders made simple',
    description:
      'End-to-end visa processing for Saudi Arabia (Hajj, Umrah, work, business), UAE, Malaysia, Thailand and Schengen countries — handled by specialists who know the paperwork inside out.',
    features: ['Saudi Hajj & Umrah visas', 'UAE & Schengen tourist visas', 'Work & business visas', 'Document guidance'],
  },
  {
    slug: 'air-ticket',
    title: 'Air Ticket',
    icon: 'plane',
    tagline: 'Fly for less, worldwide',
    description:
      'Domestic, regional and international air tickets across 40+ airlines with competitive fares, instant issuance and the best routings to Jeddah, Madinah, Dubai and beyond.',
    features: ['40+ airlines', 'Best-fare guarantee', 'Instant e-ticket issuance', 'Group fares'],
  },
  {
    slug: 'hotel-booking',
    title: 'Hotel Booking',
    icon: 'building',
    tagline: 'Rest steps from the Haram',
    description:
      'Hand-picked hotels in Makkah and Madinah within walking distance of the Haramain, plus quality stays across Dubai, Kuala Lumpur, Istanbul and other destinations.',
    features: ['Walking distance to Haram', 'Verified properties', 'Best-rate booking', 'Worldwide hotels'],
  },
  {
    slug: 'tour',
    title: 'Tour Packages',
    icon: 'globe',
    tagline: 'See the world with us',
    description:
      'Curated holiday packages to Dubai, Turkey, Malaysia, Kashmir, the Maldives and more — thoughtfully planned, fairly priced and completely hassle-free.',
    features: ['Dubai · Turkey · Malaysia', 'Family & honeymoon tours', 'Custom itineraries', 'All-inclusive options'],
  },
];

export type Pkg = {
  id: string;
  type: 'hajj' | 'umrah';
  name: string;
  badge?: string;
  price: string;
  priceNote: string;
  duration: string;
  featured?: boolean;
  highlights: string[];
};

export const packages: Pkg[] = [
  {
    id: 'hajj-economy',
    type: 'hajj',
    name: 'Economy Hajj 2026',
    price: '৳4,83,000',
    priceNote: 'starting per person',
    duration: '40–42 days',
    highlights: [
      'Direct Saudia / Biman return flights',
      'Makkah & Madinah hotel accommodation',
      'Breakfast, lunch & dinner included',
      'Full Ziyarat, guide & da’ee',
      'Pre-Hajj training workshop',
    ],
  },
  {
    id: 'hajj-standard',
    type: 'hajj',
    name: 'Standard Hajj 2026',
    badge: 'Most chosen',
    featured: true,
    price: '৳5,95,000',
    priceNote: 'per person',
    duration: '30–35 days',
    highlights: [
      'Direct flights, premium routing',
      'Hotels within 700m of the Haram',
      'Full-board buffet meals',
      'Dedicated Bangla-speaking guide',
      'Complete Ziyarat in Makkah & Madinah',
      'Maktab service in Mina & Arafah',
    ],
  },
  {
    id: 'hajj-premium',
    type: 'hajj',
    name: 'Premium Hajj 2026',
    badge: 'VIP',
    price: '৳8,50,000',
    priceNote: 'per person',
    duration: '21–25 days',
    highlights: [
      'Shortest, most comfortable itinerary',
      '5-star hotels facing the Haram',
      'Premium meals & private transport',
      'Small group with senior guide',
      'VIP Mina tent (upgraded camp)',
    ],
  },
  {
    id: 'umrah-economy',
    type: 'umrah',
    name: 'Economy Umrah',
    price: '৳1,15,000',
    priceNote: 'starting per person',
    duration: '10–14 days',
    highlights: [
      'Return air ticket & Umrah visa',
      'Comfortable shared accommodation',
      'Makkah ⇄ Madinah transfers',
      'Group Ziyarat with guide',
    ],
  },
  {
    id: 'umrah-premium',
    type: 'umrah',
    name: 'Premium Umrah',
    badge: 'Best value',
    featured: true,
    price: '৳1,85,000',
    priceNote: 'per person',
    duration: '14 days',
    highlights: [
      'Return air ticket & fast-track visa',
      '4-star hotels near the Haramain',
      'Private AC transport throughout',
      'Daily breakfast & dinner',
      'Complete Ziyarat & dedicated guide',
    ],
  },
  {
    id: 'umrah-family',
    type: 'umrah',
    name: 'Family Umrah',
    price: '৳1,55,000',
    priceNote: 'per person (4+)',
    duration: '12–14 days',
    highlights: [
      'Designed for families & elders',
      'Connecting family rooms',
      'Wheelchair & special assistance',
      'Flexible departure dates',
    ],
  },
];

export const whyUs = [
  {
    icon: 'shield',
    title: 'Government Licensed',
    body: 'Fully approved by the Ministry of Religious Affairs (Hajj License No. 071) and a member of HAAB & ATAB — your journey is in safe, accountable hands.',
  },
  {
    icon: 'calendar',
    title: '24 Years of Trust',
    body: 'Since 2002 we have guided thousands of pilgrims with the same honesty and care we would give our own family.',
  },
  {
    icon: 'users',
    title: 'Bangla-speaking Guides',
    body: 'Experienced muallims who speak your language stay with you from departure to return, so you never feel lost.',
  },
  {
    icon: 'wallet',
    title: 'Transparent Pricing',
    body: 'No hidden charges, no surprises. Every package is clearly itemised so you know exactly what you are paying for.',
  },
  {
    icon: 'hotel',
    title: 'Close to the Haram',
    body: 'We secure hotels within walking distance of the Haramain so you spend less time travelling and more time in worship.',
  },
  {
    icon: 'headset',
    title: '24/7 On-ground Support',
    body: 'A dedicated support team in Saudi Arabia is reachable around the clock for anything you need during your journey.',
  },
];

export const processSteps = [
  { step: '01', title: 'Free Consultation', body: 'Talk to our advisors about your dates, budget and expectations — completely free.' },
  { step: '02', title: 'Choose Your Package', body: 'Pick from economy to premium plans, or let us tailor one perfectly to your needs.' },
  { step: '03', title: 'Visa & Documents', body: 'We handle visa processing, bookings and all paperwork while you prepare spiritually.' },
  { step: '04', title: 'Travel with Peace', body: 'Depart with a trusted guide and 24/7 support — and return with a journey to remember.' },
];

export const testimonials = [
  {
    name: 'Md. Abdur Rahman',
    role: 'Hajj 2024 · Dhaka',
    quote:
      'From the airport in Dhaka to standing before the Kaaba, every single step was organised. The hotel was minutes from the Haram and our guide treated us like his own family. Alhamdulillah.',
    rating: 5,
  },
  {
    name: 'Fatema Begum',
    role: 'Umrah · Chattogram',
    quote:
      'I travelled with my elderly mother and was nervous, but Inter Gulf arranged wheelchair support and everything we needed. Truly a smooth, worry-free journey.',
    rating: 5,
  },
  {
    name: 'Imam Hossain',
    role: 'Group Hajj Leader',
    quote:
      'I have led several groups and Inter Gulf is the most professional team I have worked with. Honest pricing, clear communication and outstanding on-ground service.',
    rating: 5,
  },
  {
    name: 'Nusrat Jahan',
    role: 'Family Umrah · Sylhet',
    quote:
      'Booking was simple, the visa came quickly and the hotels were exactly as promised. Our whole family felt cared for the entire time. Highly recommended.',
    rating: 5,
  },
  {
    name: 'Kazi Anwar',
    role: 'Premium Hajj 2023',
    quote:
      'The premium package was worth every taka — short itinerary, hotel facing the Haram, and a guide who anticipated our every need. JazakAllah khair.',
    rating: 5,
  },
];

export const partners = [
  'Biman Bangladesh Airlines',
  'Saudia',
  'Emirates',
  'Qatar Airways',
  'Turkish Airlines',
  'Etihad Airways',
  'Kuwait Airways',
  'Air Arabia',
  'Gulf Air',
  'flydubai',
];

export const affiliations = [
  { name: 'Ministry of Religious Affairs', short: 'MoRA' },
  { name: 'Hajj Agencies Association of Bangladesh', short: 'HAAB' },
  { name: 'Association of Travel Agents of Bangladesh', short: 'ATAB' },
  { name: 'International Air Transport Association', short: 'IATA' },
];

export const hajjFaqs = [
  {
    q: 'When does Hajj pre-registration for 2026 begin?',
    a: 'Pre-registration is open now. We recommend registering early, as both government and private Hajj quotas fill quickly. Contact us and we will complete your pre-registration the same day.',
  },
  {
    q: 'What is included in your Hajj package price?',
    a: 'Our packages include return air tickets, the Hajj visa, hotel accommodation in Makkah and Madinah, daily meals, all ground transport, complete Ziyarat, a Bangla-speaking guide and a pre-Hajj training workshop. The exact inclusions are clearly listed for each package tier.',
  },
  {
    q: 'How close are the hotels to the Haram?',
    a: 'Distance depends on the package you choose. Our Standard and Premium packages place you within 300–700 metres of the Haram, while Economy hotels are served by regular shuttle transport.',
  },
  {
    q: 'Do you provide a guide who speaks Bangla?',
    a: 'Yes. Every Inter Gulf group travels with an experienced Bangla-speaking muallim who stays with you throughout the journey to guide you through every rite of Hajj.',
  },
  {
    q: 'What documents do I need for Hajj?',
    a: 'You will need a passport valid for at least six months, recent passport-size photographs, a vaccination certificate (including the required meningitis vaccine) and your national ID. Our team prepares and submits everything else on your behalf.',
  },
];

export const umrahFaqs = [
  {
    q: 'Can I perform Umrah at any time of year?',
    a: 'Yes. Unlike Hajj, Umrah can be performed throughout the year. We run departures year-round — simply tell us your preferred dates and we will arrange the rest.',
  },
  {
    q: 'How long does the Umrah visa take?',
    a: 'With complete documents, the Umrah e-visa is typically issued within a few working days. Our premium packages include fast-track processing.',
  },
  {
    q: 'Can elderly family members travel comfortably?',
    a: 'Absolutely. We arrange wheelchair assistance, connecting family rooms, private transport and dedicated support so older pilgrims travel with comfort and dignity.',
  },
  {
    q: 'What is the difference between your Umrah tiers?',
    a: 'The main differences are hotel proximity to the Haram, star rating, meal plans and transport. Every tier includes your air ticket, visa, accommodation, transfers and guided Ziyarat.',
  },
];
