export type Status = 'paid' | 'due' | 'overdue' | 'invited';

export const units: {
  unit: string;
  tenant: string;
  rent: string;
  status: Status;
  label: string;
}[] = [
  { unit: 'Flat 1', tenant: 'Tolu Adebayo', rent: '₦1,200,000 / year', status: 'paid', label: 'Paid' },
  { unit: 'Flat 2', tenant: 'Chika Okafor', rent: '₦1,200,000 / year', status: 'due', label: 'Due in 3 days' },
  { unit: 'Flat 3', tenant: 'Musa Bello', rent: '₦950,000 / year', status: 'overdue', label: 'Overdue' },
  { unit: 'Flat 4', tenant: 'Vacant', rent: '₦950,000 / year', status: 'invited', label: 'Invite sent' },
];

export const landlordItems = [
  ['Properties and units', 'Add each building and the units inside it, with the rent for each.'],
  ['Tenants and leases', 'Keep who lives where, and on what terms, next to the unit itself.'],
  ['Rent records', 'Log payments and see at a glance what is paid, due soon, or overdue.'],
  ['Maintenance', 'Follow a repair from the tenant’s request to the day it is done.'],
];

export const steps = [
  ['Add the unit', 'Create the property and unit, and set the rent.'],
  ['Send an invite link', 'Each invite is a private link for one tenant.'],
  ['Tenant joins', 'They open the link and finish setting up their own account.'],
  ['Track the tenancy', 'Rent records, requests and messages stay on the unit.'],
];

export const faqs = [
  {
    question: 'Who is PropManage for?',
    answer:
      'Landlords and property managers who want properties, units, tenants, rent records and maintenance in one place. Tenants get their own portal for rent, requests and messages.',
  },
  {
    question: 'Can tenants join without creating an account first?',
    answer:
      'Yes. A landlord creates an invitation, and the tenant follows the private link to complete onboarding.',
  },
  {
    question: 'Does PropManage collect rent online?',
    answer:
      'Not yet. Today it records payment status and due dates. Online rent payments are on the roadmap and will be announced once they are live.',
  },
  {
    question: 'Is my identity or property verified?',
    answer:
      'Not yet. Verification statuses stay pending until a real check is completed, and we do not ask for ID, deeds or bank documents by upload or email.',
  },
  {
    question: 'How is personal information handled?',
    answer: '',
  },
  {
    question: 'How quickly will support reply?',
    answer:
      'We aim to reply within one business day, Monday to Friday. For urgent safety issues, contact local emergency services.',
  },
];

export const propertyPhotos = [
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
    alt: 'Contemporary family home with a shaded garden terrace',
    label: '01',
    title: 'The property',
    location: 'Illustrative imagery',
  },
  {
    src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85',
    alt: 'Daylit living room in a contemporary rental home',
    label: '02',
    title: 'The tenant experience',
    location: 'Illustrative imagery',
  },
  {
    src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85',
    alt: 'Warm, modern apartment interior with a connected dining and living area',
    label: '03',
    title: 'The everyday details',
    location: 'Illustrative imagery',
  },
];
