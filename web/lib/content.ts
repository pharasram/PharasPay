export const faqs = [
  {
    question: 'What will my loan cost?',
    answer:
      'Interest is 8%–12% per annum on a reducing balance. The processing fee is 1%–2% of the loan amount plus applicable GST. Your Key Facts Statement shows the personalised APR and every charge before acceptance.',
  },
  {
    question: 'How much can I borrow?',
    answer:
      'Choose ₹10,000 to ₹10,00,000 with a repayment tenure of 6 to 60 months, subject to eligibility and the lender’s assessment.',
  },
  {
    question: 'Does checking eligibility guarantee approval?',
    answer:
      'No. Approval depends on verification and affordability checks. Every decision must include understandable reasons; submitting an application does not guarantee a loan.',
  },
  {
    question: 'Can I repay early?',
    answer:
      'You can request prepayment. Any applicable terms and charges must be disclosed in your Key Facts Statement and comply with current lender policy and RBI directions.',
  },
  {
    question: 'How is my information protected?',
    answer:
      'Production services must use TLS 1.2+, KMS encryption, limited access, and India-region storage. This local demo uses fictional information and does not perform real KYC or lending.',
  },
  {
    question: 'What happens if I change my mind?',
    answer:
      'The lender must provide the cooling-off period and exit terms in your Key Facts Statement. Review these before signing.',
  },
];
export const products = [
  {
    slug: 'personal',
    title: 'Personal loan',
    tag: 'FOR LIFE’S NEXT STEP',
    description:
      'Make room for the things that matter. Education, home improvements, or an unexpected expense.',
    icon: 'personal',
    available: true,
  },
  {
    slug: 'business',
    title: 'Business loan',
    tag: 'FOR YOUR NEXT CHAPTER',
    description:
      'Plan working capital, new equipment, or your next milestone with a predictable monthly EMI.',
    icon: 'business',
    available: true,
  },
  {
    slug: 'credit-line',
    title: 'Credit line',
    tag: 'ON THE ROADMAP',
    description:
      'Flexible access to credit is being explored. Availability and terms will be published before launch.',
    icon: 'credit',
    available: false,
  },
] as const;
export const articles = [
  {
    slug: 'understanding-your-emi',
    title: 'A little clarity goes a long way: understanding your EMI',
    category: 'BORROWING BASICS',
    minutes: 4,
    date: '2026-10-05',
    intro: 'Know what you repay each month and how interest changes over time.',
    paragraphs: [
      'An EMI combines principal and interest. With a reducing-balance loan, interest is calculated on the outstanding principal, so more of each payment goes towards principal as the balance falls.',
      'A longer tenure can lower the monthly EMI while increasing total interest. Compare both the monthly payment and the total repayment before choosing.',
      'Our calculator is an illustration. Your final offer and Key Facts Statement determine the actual cash flows, APR, and terms.',
    ],
  },
  {
    slug: 'fees-and-apr',
    title: 'Interest rate, processing fee, APR. What’s the difference?',
    category: 'MONEY EXPLAINED',
    minutes: 5,
    date: '2026-10-05',
    intro: 'See the whole borrowing cost before you make a decision.',
    paragraphs: [
      'The annual interest rate describes interest on the outstanding principal. Processing fees and applicable GST are additional upfront costs.',
      'APR expresses the borrowing cost using the loan’s actual cash flows. If fees are deducted at disbursal, the amount you receive is lower than the principal you repay.',
      'Compare personalised Key Facts Statements. An interest rate alone does not describe every cost, and no undisclosed charge should be added to your offer.',
    ],
  },
  {
    slug: 'safe-digital-borrowing',
    title: 'Your checklist for a safer digital loan',
    category: 'YOUR FINANCIAL WELLBEING',
    minutes: 3,
    date: '2026-10-05',
    intro: 'Simple habits that help you borrow with confidence.',
    paragraphs: [
      'Verify the regulated lender and understand the platform’s role. Read the privacy policy, grievance contact, and Key Facts Statement before accepting.',
      'Never share an OTP with a caller. Use the lender’s verified payment instructions and keep copies of your agreement and statements.',
      'Borrow only what your budget can support. Seek help early if repayment becomes difficult and use the published grievance process when needed.',
    ],
  },
] as const;
