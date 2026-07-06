import type { Locale } from '@/lib/i18n';

/**
 * Self-contained dictionary for the Care-of / affiliate feature: the management
 * page, the AffiliateForm + AffiliateRowActions, the CareOfSelect and
 * DocStatusSelect controls used on both the Hajj and Umrah entry forms, and the
 * document-status column + filters on the pilgrim lists.
 */
const dict = {
  en: {
    // ---- Management page ----
    pageTitle: 'Care of / Affiliates',
    pageSubtitle:
      'Marketers and introducers who bring in pilgrims. Assign a Care-of to each pilgrim so you always know who referred them.',
    newAffiliate: 'New Care-of',
    total: (n: number) => `${n} care-of ${n === 1 ? 'record' : 'records'}`,

    // ---- Form labels ----
    formTitle: 'New Care-of',
    editTitle: 'Edit Care-of',
    name: 'Name',
    namePlaceholder: 'Full name',
    phone: 'Phone',
    phonePlaceholder: '01XXXXXXXXX',
    address: 'Address',
    addressPlaceholder: 'Village / road, upazila, district',
    type: 'Type',
    typeAgent: 'Agent',
    typeFamily: 'Family',
    code: 'ID / Code',
    codeHint: 'Auto-generated (e.g. CO-0001) if left blank — or set your own.',
    note: 'Note',
    branch: 'Branch',
    create: 'Add Care-of',
    saving: 'Saving…',
    cancel: 'Cancel',
    saveChanges: 'Save changes',
    edit: 'Edit',
    remove: 'Remove',
    close: 'Close',

    // ---- Table ----
    thCode: 'ID',
    thName: 'Name',
    thType: 'Type',
    thPhone: 'Phone',
    thAddress: 'Address',
    thBranch: 'Branch',
    thManage: 'Manage',
    emptyTitle: 'No Care-of records yet',
    emptyHint: 'Add your first marketer / introducer to start tagging pilgrims.',

    // ---- Toasts / errors ----
    created: 'Care-of added.',
    updated: 'Care-of updated.',
    removed: 'Care-of removed.',
    errName: 'A name is required.',
    errCreate: 'Could not save the care-of.',
    errUpdate: 'Could not update the care-of.',
    errRemove: 'Could not remove the care-of.',
    confirmRemove: (name: string) =>
      `Remove "${name}"? Pilgrims already tagged keep their record; the care-of just stops appearing in the list.`,
    networkError: 'Network error. Please try again.',

    // ---- CareOfSelect (on the pilgrim form) ----
    careOf: 'Care of',
    careOfHint: 'Who is bringing this pilgrim? Search by name, phone or ID — or add a new one.',
    searchPlaceholder: 'Search name / phone / ID…',
    noneSelected: 'No Care-of',
    selectPrompt: 'Select or search a Care-of',
    addNew: 'Add new Care-of',
    addNewTitle: 'New Care-of',
    saveAndSelect: 'Save & select',
    clearSelection: 'Clear',
    noMatches: 'No match found.',

    // ---- DocStatusSelect (on the pilgrim form) ----
    docStatus: 'Document status',
    docStatusHint: 'Tick every document that is done — used for status filtering on the list.',
    docDone: (n: number, total: number) => `${n}/${total} done`,

    // ---- List column + filters ----
    thDocs: 'Docs',
    filterAllCare: 'All Care-of',
    filterNoCare: 'No Care-of',
    filterAllDocs: 'All documents',
    filterDocsComplete: 'All documents done',
    filterDocsIncomplete: 'Documents pending',

    // ---- Group / family ledger detail page ----
    backToList: 'Back to Care-of list',
    membersCount: (n: number) => `${n} ${n === 1 ? 'passenger' : 'passengers'}`,
    totalPackage: 'Total Package',
    totalPaid: 'Total Paid',
    totalDue: 'Total Due',
    thMember: 'Passenger',
    thProgram: 'Program',
    thMemberPackage: 'Package',
    thCharged: 'Package amount',
    thPaid: 'Paid',
    thDue: 'Due',
    programHajj: 'Hajj',
    programUmrah: 'Umrah',
    noMembers: 'No passengers under this Care-of yet',
    noMembersHint: 'Assign this Care-of on a Hajj or Umrah passenger and they will appear here together as a group.',
  },

  bn: {
    // ---- Management page ----
    pageTitle: 'কেয়ার অফ / অ্যাফিলিয়েট',
    pageSubtitle:
      'যারা যাত্রী নিয়ে আসেন সেই মার্কেটার/রেফারার। প্রতিটি যাত্রীর সাথে একজন কেয়ার অফ যুক্ত করুন যাতে কে রেফার করেছে তা সবসময় জানা থাকে।',
    newAffiliate: 'নতুন কেয়ার অফ',
    total: (n: number) => `${n} টি কেয়ার অফ`,

    // ---- Form labels ----
    formTitle: 'নতুন কেয়ার অফ',
    editTitle: 'কেয়ার অফ সম্পাদনা',
    name: 'নাম',
    namePlaceholder: 'পূর্ণ নাম',
    phone: 'ফোন',
    phonePlaceholder: '01XXXXXXXXX',
    address: 'ঠিকানা',
    addressPlaceholder: 'গ্রাম / রোড, উপজেলা, জেলা',
    type: 'ধরন',
    typeAgent: 'এজেন্ট',
    typeFamily: 'পরিবার',
    code: 'আইডি / কোড',
    codeHint: 'খালি রাখলে স্বয়ংক্রিয় (যেমন CO-0001) — অথবা নিজে দিন।',
    note: 'নোট',
    branch: 'শাখা',
    create: 'কেয়ার অফ যোগ করুন',
    saving: 'সংরক্ষণ হচ্ছে…',
    cancel: 'বাতিল',
    saveChanges: 'পরিবর্তন সংরক্ষণ করুন',
    edit: 'সম্পাদনা',
    remove: 'সরান',
    close: 'বন্ধ করুন',

    // ---- Table ----
    thCode: 'আইডি',
    thName: 'নাম',
    thType: 'ধরন',
    thPhone: 'ফোন',
    thAddress: 'ঠিকানা',
    thBranch: 'শাখা',
    thManage: 'ব্যবস্থাপনা',
    emptyTitle: 'এখনও কোনো কেয়ার অফ নেই',
    emptyHint: 'যাত্রীদের ট্যাগ করা শুরু করতে প্রথম মার্কেটার / রেফারার যোগ করুন।',

    // ---- Toasts / errors ----
    created: 'কেয়ার অফ যোগ হয়েছে।',
    updated: 'কেয়ার অফ আপডেট হয়েছে।',
    removed: 'কেয়ার অফ সরানো হয়েছে।',
    errName: 'নাম আবশ্যক।',
    errCreate: 'কেয়ার অফ সংরক্ষণ করা যায়নি।',
    errUpdate: 'কেয়ার অফ আপডেট করা যায়নি।',
    errRemove: 'কেয়ার অফ সরানো যায়নি।',
    confirmRemove: (name: string) =>
      `"${name}" সরাবেন? যেসব যাত্রী আগে ট্যাগ করা আছে তাদের রেকর্ড থাকবে; শুধু তালিকা থেকে সরে যাবে।`,
    networkError: 'নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।',

    // ---- CareOfSelect ----
    careOf: 'কেয়ার অফ',
    careOfHint: 'এই যাত্রীকে কে নিয়ে আসছেন? নাম, ফোন বা আইডি দিয়ে খুঁজুন — অথবা নতুন যোগ করুন।',
    searchPlaceholder: 'নাম / ফোন / আইডি খুঁজুন…',
    noneSelected: 'কোনো কেয়ার অফ নেই',
    selectPrompt: 'কেয়ার অফ বাছাই বা খুঁজুন',
    addNew: 'নতুন কেয়ার অফ যোগ করুন',
    addNewTitle: 'নতুন কেয়ার অফ',
    saveAndSelect: 'সংরক্ষণ করে নির্বাচন',
    clearSelection: 'মুছুন',
    noMatches: 'কোনো মিল পাওয়া যায়নি।',

    // ---- DocStatusSelect ----
    docStatus: 'ডকুমেন্ট স্ট্যাটাস',
    docStatusHint: 'যেসব ডকুমেন্ট সম্পন্ন হয়েছে তা টিক দিন — তালিকায় স্ট্যাটাস ফিল্টারে ব্যবহৃত হয়।',
    docDone: (n: number, total: number) => `${n}/${total} সম্পন্ন`,

    // ---- List column + filters ----
    thDocs: 'ডকুমেন্ট',
    filterAllCare: 'সব কেয়ার অফ',
    filterNoCare: 'কেয়ার অফ নেই',
    filterAllDocs: 'সব ডকুমেন্ট',
    filterDocsComplete: 'সব ডকুমেন্ট সম্পন্ন',
    filterDocsIncomplete: 'ডকুমেন্ট বাকি',

    // ---- Group / family ledger detail page ----
    backToList: 'কেয়ার অফ তালিকায় ফিরুন',
    membersCount: (n: number) => `${n} জন যাত্রী`,
    totalPackage: 'মোট প্যাকেজ',
    totalPaid: 'মোট পরিশোধিত',
    totalDue: 'মোট বকেয়া',
    thMember: 'যাত্রী',
    thProgram: 'প্রোগ্রাম',
    thMemberPackage: 'প্যাকেজ',
    thCharged: 'প্যাকেজ পরিমাণ',
    thPaid: 'পরিশোধিত',
    thDue: 'বকেয়া',
    programHajj: 'হজ',
    programUmrah: 'উমরাহ',
    noMembers: 'এই কেয়ার অফের অধীনে এখনও কোনো যাত্রী নেই',
    noMembersHint: 'হজ বা উমরাহ যাত্রীতে এই কেয়ার অফ যুক্ত করলে তারা এখানে একসাথে গ্রুপ হিসেবে দেখা যাবে।',
  },
};

export function getDict(locale: Locale) {
  return dict[locale];
}
