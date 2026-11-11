import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {ArrowRight, ArrowUpRight,Building2,Check, CheckCircle2, Clock3, Info,KeyRound, Mail,MapPin,Phone,Shield,ShieldCheck,UserRoundPlus,Users,Wrench,} from 'lucide-react';
import { motion } from 'motion/react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../../hooks/useAuth';
import { AnimatedContent } from '../../components/AnimatedContent';

type RegisterRole = 'landlord' | 'tenant';

type Status = 'paid' | 'due' | 'overdue' | 'invited';

const statusStyles: Record<Status, string> = {
  paid: 'bg-[#E7F0EA] text-[#397451]',
  due: 'bg-[#F6EBD6] text-[#95651D]',
  overdue: 'bg-[#F8E6E3] text-[#B44036]',
  invited: 'bg-[#EFE9DE] text-[#756B61]',
};

function StatusChip({ status, label }: { status: Status; label: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}

const units: {
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

const smoothEase = [0.22, 1, 0.36, 1] as const;

const revealUp = {
  hidden: { opacity: 0, y: 36 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: smoothEase },
  },
};

const revealLeft = {
  hidden: { opacity: 0, x: -35 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: smoothEase },
  },
};

const revealRight = {
  hidden: { opacity: 0, x: 35 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: smoothEase },
  },
};

const staggerChildren = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.13,
      delayChildren: 0.1,
    },
  },
};

const imageReveal = {
  hidden: { opacity: 0, scale: 1.08 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.2, ease: smoothEase },
  },
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const landlordItems = [
  ['Properties and units', 'Add each building and the units inside it, with the rent for each.'],
  ['Tenants and leases', 'Keep who lives where, and on what terms, next to the unit itself.'],
  ['Rent records', 'Log payments and see at a glance what is paid, due soon, or overdue.'],
  ['Maintenance', 'Follow a repair from the tenant’s request to the day it is done.'],
];

const steps = [
  ['Add the unit', 'Create the property and unit, and set the rent.'],
  ['Send an invite link', 'Each invite is a private link for one tenant.'],
  ['Tenant joins', 'They open the link and finish setting up their own account.'],
  ['Track the tenancy', 'Rent records, requests and messages stay on the unit.'],
];

const faqs = [
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

const propertyPhotos = [
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

function PropertyHeroImage() {
  return (
    <AnimatedContent className="relative" trigger="mount" distance={12} duration={0.45}>
      <figure className="relative min-h-[340px] overflow-hidden rounded-md bg-[#E8DDCC] sm:min-h-[480px] lg:min-h-[570px]">
        <img
          src={propertyPhotos[0].src}
          alt={propertyPhotos[0].alt}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute left-4 top-4 bg-white/95 px-4 py-2.5 text-xs font-semibold text-[#332D29] sm:left-6 sm:top-6">
          <MapPin className="mr-2 inline h-3.5 w-3.5 text-[#397451]" />
          Illustrative rental property
        </div>
        <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[#332D29] px-4 py-3 text-xs text-white sm:px-6">
          <span>Residential property</span>
          <span className="text-[#E8DDCC]">{propertyPhotos[0].location}</span>
        </figcaption>
      </figure>
    </AnimatedContent>
  );
}

export function Landing() {
  return (
    <div className="flex-1 overflow-hidden bg-[#FAF8F3] pb-20 md:pb-0">

      {/* HERO */}
      <section className="px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-12 lg:pt-20">
        <div className="mx-auto max-w-7xl">

          <div className="grid items-stretch gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex flex-col justify-between py-6 sm:py-9 lg:py-12"
            >
              <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#397451]">
                PropManage · Property operations
              </p>

              <h1 className="max-w-xl border-l-2 border-[#397451] pl-4 font-display text-[2.55rem] font-semibold leading-[1.05] text-[#332D29] sm:pl-6 sm:text-6xl lg:text-[3.8rem]">
                A steadier way to manage the work behind every home.
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-[#756B61] sm:text-lg sm:leading-8">
                Bring property records, tenants, payments, and maintenance into one clear workspace.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-[#5E554D]">
                {[
                  'Separate workspaces for landlords and tenants',
                  'Maintenance and property records together',
                  'Verification stays pending until actually checked',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#397451]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 max-w-md border-l-2 border-[#B9A58B] pl-3 text-xs leading-5 text-[#756B61]">
                Never send identity documents, deeds, or bank statements by email. Secure verification will be requested only through an approved provider flow.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="group inline-flex min-h-12 items-center gap-4 rounded-md bg-[#332D29] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#397451]"
                >
                  Get started
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/#features"
                  className="group inline-flex min-h-12 items-center gap-2 px-2 text-sm font-semibold text-[#332D29] transition-colors hover:text-[#397451]"
                >
                  Explore the workspace
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>

            </motion.div>

            <PropertyHeroImage />
          </div>
        </div>
      </section>

      {/* EDITORIAL INTRODUCTION */}
      <section className="border-y border-[#E8DDCC] bg-white px-5 py-9 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-sm text-sm leading-6 text-[#756B61]">
            A single workspace for the people, properties and responsibilities
            that keep a rental business moving.
          </p>

          <div className="grid grid-cols-3 gap-6 sm:gap-12">
            {[
              ['01', 'Properties'],
              ['02', 'Tenants'],
              ['03', 'Operations'],
            ].map(([number, label]) => (
              <div key={number}>
                <p className="font-display text-2xl text-[#397451]">{number}</p>
                <p className="mt-1 text-xs font-medium text-[#332D29]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FAF8F3] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.72fr_1.28fr] md:items-end md:gap-16">
          <div className="max-w-md">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#397451]">The people behind every property</p>
            <h2 className="font-display text-3xl font-semibold leading-tight text-[#332D29] sm:text-4xl">
              A tenancy is more than an address.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#756B61]">
              Keep the place and the day-to-day experience in view, from a tenant&apos;s first message to the maintenance follow-through.
            </p>
          </div>

          <div className="grid grid-cols-2 items-start gap-4 sm:gap-7">
            {propertyPhotos.slice(1).map((photo, index) => (
              <AnimatedContent key={photo.label} className={index === 1 ? 'mt-10 sm:mt-16' : ''} delay={index * 0.08} distance={12} duration={0.42}>
                <figure>
                  <div className="overflow-hidden rounded-md bg-[#E8DDCC]">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      className="aspect-[0.82] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                  </div>
                  <figcaption className="mt-3 border-t border-[#B9A58B] pt-3">
                    <span className="mr-2 text-[10px] font-semibold text-[#397451]">{photo.label}</span>
                    <span className="text-xs font-semibold text-[#332D29]">{photo.title}</span>
                    <span className="mt-1 block text-[10px] text-[#756B61]">{photo.location}</span>
                  </figcaption>
                </figure>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section id="features" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">

          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#397451]">
              The PropManage workspace
            </p>

            <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#332D29] sm:text-5xl">
              The details are where good management happens.
            </h2>

            <p className="mt-6 text-sm leading-7 text-[#756B61]">
              No more switching between notebooks, chats and disconnected
              spreadsheets to find out what is happening with a property.
            </p>

            <div className="mt-9 space-y-6">
              {landlordItems.map(([title, description]) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E7F0EA] text-[#397451]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#332D29]">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#756B61]">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="overflow-hidden rounded-2xl border border-[#E8DDCC] bg-[#FAF8F3] shadow-[0_25px_70px_rgba(51,45,41,0.09)]"
          >
            <div className="flex items-center justify-between border-b border-[#E8DDCC] bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="font-display text-lg font-semibold text-[#332D29]">
                  Adeniyi Court
                </p>
                <p className="mt-1 text-xs text-[#756B61]">Bodija, Ibadan</p>
              </div>
              <span className="border border-[#E8DDCC] px-3 py-1.5 text-[10px] text-[#756B61]">
                Sample data
              </span>
            </div>

            <div className="grid grid-cols-3 border-b border-[#E8DDCC] bg-white">
              {[
                ['Occupied', '3 of 4'],
                ['Outstanding', '₦2.15m'],
                ['Requests', '01'],
              ].map(([label, value]) => (
                <div key={label} className="border-r border-[#E8DDCC] px-3 py-5 last:border-0 sm:px-6">
                  <p className="text-[10px] text-[#756B61] sm:text-xs">{label}</p>
                  <p className="mt-2 font-display text-base font-semibold text-[#332D29] sm:text-xl">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 py-5 sm:px-7">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold text-[#332D29]">
                  Unit overview
                </p>
                <p className="text-[10px] text-[#756B61]">4 units</p>
              </div>

              <motion.div
                variants={listVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="divide-y divide-[#E8DDCC] border-y border-[#E8DDCC] bg-white"
              >
                {units.map((row) => (
                  <motion.div
                    key={row.unit}
                    variants={rowVariants}
                    className="flex items-center justify-between gap-3 px-3 py-4 sm:px-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#332D29]">
                        {row.unit}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[#756B61]">
                        {row.tenant}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusChip status={row.status} label={row.label} />
                      <p className="text-[10px] text-[#756B61]">{row.rent}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="mt-4 flex items-center gap-3 border border-[#E8DDCC] bg-white p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#F6EBD6] text-[#95651D]">
                  <Wrench className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#332D29]">
                    Maintenance request
                  </p>
                  <p className="mt-1 truncate text-[11px] text-[#756B61]">
                    Flat 3: leaking kitchen tap
                  </p>
                </div>
                <StatusChip status="due" label="In progress" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TENANT EXPERIENCE */}
      <section className="bg-[#E8DDCC]/45 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">

          <div className="relative">
            <div className="relative mx-auto max-w-md rounded-2xl border border-[#E8DDCC] bg-white p-6 shadow-[0_20px_60px_rgba(51,45,41,0.08)] sm:p-9">
              <div className="flex items-center justify-between border-b border-[#E8DDCC] pb-5">
                <div>
                  <p className="text-xs text-[#756B61]">Tenant workspace</p>
                  <p className="mt-1 font-display text-xl font-semibold text-[#332D29]">
                    Welcome back.
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F0EA] text-[#397451]">
                  <Building2 className="h-5 w-5" />
                </span>
              </div>

              <div className="py-6">
                <p className="text-xs text-[#756B61]">Your property</p>
                <p className="mt-1 font-display text-xl font-semibold text-[#332D29]">
                  Flat 2, Adeniyi Court
                </p>
                <p className="mt-1 text-xs text-[#756B61]">Bodija, Ibadan</p>
              </div>

              <div className="border border-[#E8DDCC] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-[#756B61]">Next rent due</p>
                  <StatusChip status="due" label="Due soon" />
                </div>
                <p className="mt-3 font-display text-3xl font-semibold text-[#332D29]">
                  ₦1,200,000
                </p>
                <p className="mt-2 text-xs text-[#756B61]">
                  Sample rent record
                </p>
              </div>

              <div className="mt-5 bg-[#FAF8F3] p-5">
                <p className="text-xs font-semibold text-[#332D29]">
                  A message from your landlord
                </p>
                <p className="mt-2 text-sm leading-6 text-[#756B61]">
                  The plumber is coming Thursday morning.
                </p>
              </div>

              <div className="mt-5 flex min-h-12 items-center justify-center bg-[#332D29] text-sm font-semibold text-white">
                Report a maintenance issue
              </div>

              <p className="mt-4 text-center text-[10px] text-[#756B61]">
                Illustrative tenant portal preview · Sample data
              </p>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#397451]">
              More than a landlord dashboard
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#332D29] sm:text-5xl">
              A better rental experience works both ways.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-[#756B61]">
              Tenants have their own dedicated workspace. They can keep track
              of rental information, communicate with their landlord and
              raise maintenance requests.
            </p>

            <div className="mt-8 border-t border-[#B9A58B] pt-6">
              <p className="font-display text-xl font-medium text-[#332D29]">
                Clear records. Clear communication. Fewer loose ends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section
        id="workflows"
        className="scroll-mt-24 bg-[#332D29] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B9A58B]">
                A simpler process
              </p>
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                Start with a property. Build from there.
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-7 text-[#E8DDCC]/70">
                Set up your units, invite tenants and keep the tenancy
                information organised as things happen.
              </p>
            </div>

            <ol className="grid gap-8 sm:grid-cols-2">
              {steps.map(([title, description], index) => (
                <li
                  key={title}
                  className="border-t border-white/20 pt-5"
                >
                  <p className="font-display text-4xl font-medium text-[#B9A58B]">
                    0{index + 1}
                  </p>
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#E8DDCC]/65">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* PRODUCT AVAILABILITY */}
      <section className="bg-[#FAF8F3] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">

          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#397451]">
              Built with transparency
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#332D29] sm:text-5xl">
              Know what is ready before you sign up.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#756B61]">
              We believe in being clear about what you can use today and what
              is still being developed.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="border-t-2 border-[#397451] pt-5">
              <p className="text-sm font-semibold text-[#332D29]">
                Available now
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  'Properties, units and tenants',
                  'Tenant invitations by private link',
                  'Rent status and due dates',
                  'Maintenance requests and messages',
                  'Separate landlord and tenant accounts',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#5E554D]">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#397451]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t-2 border-[#B9A58B] pt-5">
              <p className="text-sm font-semibold text-[#332D29]">
                Coming next
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  'Online rent payments',
                  'Identity and property verification',
                  'Phone number verification by OTP',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#5E554D]">
                    <Clock3 className="mt-1 h-4 w-4 shrink-0 text-[#95651D]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#397451]">
              Good to know
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#332D29] sm:text-5xl">
              Before you make yourself at home.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#756B61]">
              Still have a question?{' '}
              <Link
                to="/contact"
                className="font-semibold text-[#397451] underline underline-offset-4"
              >
                Talk to us.
              </Link>
            </p>
          </div>

          <div className="divide-y divide-[#E8DDCC] border-y border-[#E8DDCC]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#332D29] marker:hidden [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-xl font-normal text-[#8A7E72] transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pt-3 text-sm leading-7 text-[#756B61]">
                  {faq.answer || (
                    <>
                      We collect what is needed to run accounts and rental
                      workflows. Read the{' '}
                      <Link
                        to="/privacy"
                        className="font-semibold text-[#397451] underline underline-offset-4"
                      >
                        Privacy Policy
                      </Link>{' '}
                      for details.
                    </>
                  )}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#397451] px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">
              Your next chapter starts here
            </p>
            <h2 className="max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
              Make room for better property management.
            </h2>
          </div>

          <Link
            to="/login"
            className="group inline-flex min-h-14 shrink-0 items-center justify-center gap-8 bg-[#FAF8F3] px-7 text-sm font-semibold text-[#332D29] transition-all duration-300 hover:bg-[#E8DDCC]"
          >
            Create an account
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* MOBILE ACTION */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8DDCC] bg-[#FAF8F3]/95 p-3 backdrop-blur-md md:hidden">
        <Link
          to="/login"
          className="flex min-h-12 items-center justify-center gap-3 bg-[#332D29] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#397451]"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}

export function Pricing() {
  return (
   <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
  <div className="max-w-3xl">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#756B61]">
      Pricing
    </p>
    <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-[#332D29] sm:text-5xl">
      Start with the right setup.
    </h1>
    <p className="mt-5 max-w-2xl text-base leading-7 text-[#756B61]">
      Plans and payment-provider availability are being finalized. Tell us
      about your portfolio and we will confirm current access, included
      workflows, and pricing before you commit.
    </p>
    <Link
      to="/contact"
      className="mt-7 inline-flex min-h-12 items-center gap-3 bg-[#332D29] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A4039]"
    >
      Ask about pricing
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
</div>
  );
}

export function About() {
  return (
    <div className="py-16 sm:py-24 max-w-7xl mx-auto px-6 lg:px-8 bg-[#FAF8F3]">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#332D29] tracking-tight mb-4">Built by property managers, for property managers</h2>
        <p className="text-lg text-[#756B61]">PropManage brings property operations into one shared workspace, with clear roles for landlords, tenants, and platform administrators.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-12 mt-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#E7F0EA] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#397451]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#332D29] mb-3">Trust & Security</h3>
          <p className="text-[#756B61] leading-relaxed">Access is organized by account role. Identity and property verification are not yet active; do not upload sensitive documents until a secure provider flow is available.</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-[#E8DDCC] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#95651D]">
            <Clock3 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#332D29] mb-3">Efficiency First</h3>
          <p className="text-[#756B61] leading-relaxed">Property, unit, tenant, maintenance, and payment records are organized together to support a more consistent operating routine.</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-[#B9A58B]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#332D29]">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#332D29] mb-3">Better Tenant Experience</h3>
          <p className="text-[#756B61] leading-relaxed">Tenants can use a dedicated workspace for rental records, maintenance requests, and communication with their property manager.</p>
        </div>
      </div>
    </div>
  );
}

export function Contact() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('Sales & Pricing');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, reason, message }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data?.error || 'Unable to send your message.');
      navigate('/thank-you', { state: { source: 'contact' } });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-16 sm:py-24 max-w-7xl mx-auto px-6 lg:px-8 bg-[#FAF8F3]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#332D29] tracking-tight mb-4">Get in Touch</h2>
          <p className="text-lg text-[#756B61]">Have questions about our platform or pricing? We're here to help.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E8DDCC] overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Contact Info */}
            <div className="bg-[#E8DDCC]/60 p-8 sm:p-12 lg:p-16 border-b md:border-b-0 md:border-r border-[#E8DDCC]">
              <h3 className="text-2xl font-bold text-[#332D29] mb-8">Contact Information</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white p-2.5 rounded-lg border border-[#E8DDCC] text-[#397451] shadow-sm shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#332D29]">Email Us</h4>
                    <p className="text-[#756B61] mt-1 mb-2 text-sm">For support and general queries.</p>
                    <a href="mailto:michealeti2006@gmail.com" className="text-[#397451] font-medium hover:text-[#332D29]">michealeti2006@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white p-2.5 rounded-lg border border-[#E8DDCC] text-[#95651D] shadow-sm shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#332D29]">Call Us</h4>
                    <p className="text-[#756B61] mt-1 mb-2 text-sm">Mon-Fri from 8am to 5pm.</p>
                    <a href="tel:+2348117964140" className="text-[#95651D] font-medium hover:text-[#332D29]">+234 (811) 796 4140</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white p-2.5 rounded-lg border border-[#E8DDCC] text-[#332D29] shadow-sm shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#332D29]">Office</h4>
                    <p className="text-[#756B61] mt-1 text-sm leading-relaxed">
                      100 Property Lane<br/>
                      Suite 300<br/>
                      Calabar, CRS Nigeria
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="p-8 sm:p-12 lg:p-16">
              <form className="space-y-6" onSubmit={submitContact}>
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-[#332D29] mb-2">Name</label>
                  <input id="contact-name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} type="text" placeholder="Jane Doe" className="w-full px-4 py-3 border border-[#E8DDCC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20 focus:border-[#B9A58B] transition-colors shadow-sm" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-[#332D29] mb-2">Email Address</label>
                  <input id="contact-email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="jane@example.com" className="w-full px-4 py-3 border border-[#E8DDCC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20 focus:border-[#B9A58B] transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#332D29] mb-2" htmlFor="contact-phone">Phone Number</label>
                  <div className="rounded-lg border border-[#E8DDCC] bg-white px-4 py-3 shadow-sm transition-colors focus-within:border-[#B9A58B] focus-within:ring-2 focus-within:ring-[#B9A58B]/20">
                    <PhoneInput
                      id="contact-phone"
                      name="phone"
                      defaultCountry="NG"
                      international
                      countryCallingCodeEditable={false}
                      value={phone}
                      onChange={(value) => setPhone(value ?? '')}
                      placeholder="Enter phone number"
                      className="w-full text-sm"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-[#756B61]">Choose your country to use the correct dialing code.</p>
                </div>
                <div>
                  <label htmlFor="contact-reason" className="block text-sm font-medium text-[#332D29] mb-2">Reason for Inquiry</label>
                  <select id="contact-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="w-full px-4 py-3 border border-[#E8DDCC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20 focus:border-[#B9A58B] transition-colors shadow-sm text-[#332D29]">
                    <option>Sales & Pricing</option>
                    <option>Technical Support</option>
                    <option>Partnership inquiry</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-[#332D29] mb-2">Message</label>
                  <textarea id="contact-message" required maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="How can we help you?" className="w-full px-4 py-3 border border-[#E8DDCC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20 focus:border-[#B9A58B] transition-colors shadow-sm resize-none"></textarea>
                </div>
                <p className="text-sm text-[#756B61]">We aim to reply within one business day, Monday through Friday.</p>
                {error && <p role="alert" className="rounded-lg bg-[#F8E6E3] px-3 py-2 text-sm text-[#B44036]">{error}</p>}
                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-[#397451] text-white rounded-lg font-semibold hover:bg-[#332D29] disabled:cursor-not-allowed disabled:opacity-70 transition-colors shadow-sm">
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center bg-[#FAF8F3] px-6 py-16">
      <div className="mx-auto w-full max-w-6xl border-l-4 border-[#397451] bg-white px-6 py-10 sm:px-12 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#397451]">Page not found</p>
        <h1 className="mt-3 text-6xl font-bold text-[#332D29]">404</h1>
        <p className="mt-4 max-w-xl text-lg leading-7 text-[#756B61]">This address doesn&apos;t point to a page. Head back to the homepage or choose a useful place to continue.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#397451] px-5 py-2.5 font-semibold text-white hover:bg-[#332D29]">Homepage <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/pricing" className="inline-flex min-h-11 items-center rounded-lg border border-[#E8DDCC] bg-white px-5 py-2.5 font-semibold text-[#332D29] hover:bg-[#FAF8F3]">Pricing</Link>
          <Link to="/contact" className="inline-flex min-h-11 items-center rounded-lg border border-[#E8DDCC] bg-white px-5 py-2.5 font-semibold text-[#332D29] hover:bg-[#FAF8F3]">Contact</Link>
        </div>
      </div>
    </div>
  );
}

export function ThankYou() {
  const location = useLocation();
  if (location.state?.source !== 'contact') return <Navigate to="/contact" replace />;

  return (
    <section className="flex min-h-[65vh] items-center bg-[#E7F0EA] px-6 py-16">
      <div className="mx-auto w-full max-w-3xl border-t-4 border-[#397451] bg-white p-7 shadow-sm sm:p-10">
        <CheckCircle2 className="h-10 w-10 text-[#397451]" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-[#397451]">Message received</p>
        <h1 className="mt-2 text-3xl font-bold text-[#332D29]">Thank you for getting in touch.</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[#756B61]">Your inquiry has been recorded. We aim to respond within one business day, Monday through Friday.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/" className="rounded-lg bg-[#332D29] px-5 py-3 font-semibold text-white hover:bg-[#397451]">Back to homepage</Link>
          <Link to="/pricing" className="rounded-lg border border-[#E8DDCC] px-5 py-3 font-semibold text-[#332D29] hover:bg-[#FAF8F3]">Review pricing</Link>
        </div>
      </div>
    </section>
  );
}

export function PrivacyPolicy() {
  return (
    <article className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16 bg-[#FAF8F3]">
      <p className="text-sm font-semibold uppercase tracking-wider text-[#397451]">Privacy</p>
      <h1 className="mt-2 text-3xl font-bold text-[#332D29] sm:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-[#756B61]">Last updated: October 8, 2026</p>
      <p className="mt-6 border-l-4 border-[#B9A58B] bg-[#E8DDCC] p-4 text-sm leading-6 text-[#332D29]">This notice describes the information PropManage processes in the current service. Contact us with privacy requests or questions using the details on our <Link to="/contact" className="font-semibold underline text-[#397451]">contact page</Link>.</p>
      <div className="mt-9 space-y-8 text-sm leading-7 text-[#332D29]">
        <section><h2 className="text-xl font-bold text-[#332D29]">Information we process</h2><p className="mt-2">Depending on how you use the service, this may include account and contact details, role and sign-in information, property and unit records, tenant and lease details, payment records, maintenance requests, messages, documents, invitations, and reports submitted for review. Do not submit full identity-document numbers or sensitive personal information unless the service specifically requests it.</p></section>
        <section><h2 className="text-xl font-bold text-[#332D29]">Identity and property verification</h2><p className="mt-2">Verification statuses may be recorded separately from supporting documents. PropManage does not currently provide an upload flow for government IDs, deeds, bank statements, payslips, or other verification documents. Do not email or upload these materials. If a verified provider flow is introduced, we will explain what is collected, who verifies it, retention, and access before requesting consent.</p></section>
        <section><h2 className="text-xl font-bold text-[#332D29]">How information is used</h2><p className="mt-2">We use information to create and secure accounts, provide property-management workflows, route tenant invitations, display records to the appropriate account roles, respond to support requests, investigate reports, prevent misuse, and comply with applicable obligations.</p></section>
        <section><h2 className="text-xl font-bold text-[#332D29]">Who may receive information</h2><p className="mt-2">Information is available to the account holder and authorized people involved in the related rental workflow. We may use infrastructure and service providers needed to operate the product. We do not claim that payment processing, tenant screening, or third-party integrations are active unless they are configured and disclosed for your account.</p></section>
        <section><h2 className="text-xl font-bold text-[#332D29]">Security and retention</h2><p className="mt-2">We use access controls and technical safeguards intended to protect account information. No internet service can guarantee absolute security. Information is retained while needed to provide the service, address disputes, meet legal requirements, or protect the platform, then deleted or de-identified where practical.</p></section>
        <section><h2 className="text-xl font-bold text-[#332D29]">Your choices and requests</h2><p className="mt-2">You can request access, correction, or deletion of personal information, subject to legal and operational requirements. Some information may need to remain available for active leases, disputes, security, or compliance. Contact us through the <Link to="/contact" className="font-semibold text-[#397451] underline">contact form</Link> to make a request.</p></section>
        <section><h2 className="text-xl font-bold text-[#332D29]">Legal requests and disputes</h2><p className="mt-2">We do not disclose a person&apos;s hidden identity or private verification data directly to another user. Where disclosure is legally required or authorized, requests are reviewed and information is provided to the appropriate law-enforcement authority or court through lawful process, with access limited to what is required.</p></section>
        <section><h2 className="text-xl font-bold text-[#332D29]">Changes and questions</h2><p className="mt-2">We may update this notice as the service changes. The updated date above indicates the latest revision. Privacy rules differ by location; this page does not replace jurisdiction-specific legal advice.</p></section>
      </div>
    </article>
  );
}

export function LoginRegister() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = React.useState(true);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState<string>('');
  const [role, setRole] = React.useState<RegisterRole>('landlord');
  const [message, setMessage] = React.useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setMessage(null);
  }, [isLogin]);

  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email, password }
      : {
          firstName,
          lastName,
          email,
          password,
          role,
          phone,
        };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage({ type: 'error', text: data?.error || 'Unable to complete authentication.' });
        return;
      }

      login(data.user, data.token);
      const redirectPath = data.user.role === 'tenant' ? '/tenant' : data.user.role === 'landlord' ? '/landlord' : '/admin';
      navigate(redirectPath);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Network error while authenticating.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100svh-152px)] bg-[#FAF8F3]">
      <div className="mx-auto grid min-h-[calc(100svh-152px)] max-w-360 lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.92fr)]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#332D29] px-10 py-12 text-white lg:flex xl:px-16 xl:py-16">
          <div className="absolute inset-0 opacity-20" aria-hidden="true" style={{ backgroundImage: 'linear-gradient(135deg, transparent 0 49.7%, rgba(255,255,255,.18) 50%, transparent 50.3%), linear-gradient(45deg, transparent 0 49.7%, rgba(255,255,255,.12) 50%, transparent 50.3%)', backgroundSize: '52px 52px' }} />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90"><Building2 className="h-5 w-5 text-[#B9A58B]" /> PropManage</Link>
            <p className="mt-20 text-xs font-semibold uppercase tracking-[0.14em] text-[#B9A58B]">Property operations</p>
            <h2 className="mt-4 max-w-lg text-4xl font-bold leading-tight xl:text-5xl">A steadier way to manage the work behind every home.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#e2e9e1]">Bring property records, tenants, payments, and maintenance into one clear workspace.</p>
            <div className="mt-10 space-y-4 text-sm text-[#e2e9e1]">
              <div className="flex items-center gap-3"><Users className="h-4 w-4 text-[#B9A58B]" /> Separate workspaces for landlords and tenants</div>
              <div className="flex items-center gap-3"><Wrench className="h-4 w-4 text-[#B9A58B]" /> Maintenance and property records together</div>
              <div className="flex items-center gap-3"><Shield className="h-4 w-4 text-[#B9A58B]" /> Verification stays pending until actually checked</div>
            </div>
          </div>
          <p className="relative max-w-md text-xs leading-5 text-[#E8DDCC]">Never send identity documents, deeds, or bank statements by email. Secure verification will be requested only through an approved provider flow.</p>
        </aside>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md rounded-xl border border-[#E8DDCC] bg-white p-6 shadow-[0_4px_20px_rgba(51,45,41,0.04)] sm:p-8">
        <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#332D29] lg:hidden"><Building2 className="h-5 w-5 text-[#B9A58B]" /> PropManage</Link>
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#756B61]">{isLogin ? 'Account access' : 'Join your workspace'}</p>
        <h2 className="mb-6 text-center text-2xl font-bold text-[#332D29]">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

        <div className="relative mb-6 grid grid-cols-2 rounded-lg bg-[#E8DDCC] p-1">
          <span
            aria-hidden="true"
            className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-white shadow-[0_1px_4px_rgba(51,45,41,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${isLogin ? 'translate-x-0' : 'translate-x-full'}`}
          />
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            aria-pressed={isLogin}
            className={`relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isLogin ? 'text-[#332D29]' : 'text-slate-600 hover:text-[#332D29]'}`}
          >
            <KeyRound className="h-4 w-4" /> Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            aria-pressed={!isLogin}
            className={`relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${!isLogin ? 'text-[#332D29]' : 'text-slate-600 hover:text-[#332D29]'}`}
          >
            <UserRoundPlus className="h-4 w-4" /> Register
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">First Name</label>
                <input
                  type="text"
                  autoComplete="given-name"
                  required={!isLogin}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="John"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
                <input
                  type="text"
                  autoComplete="family-name"
                  required={!isLogin}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Doe"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="register-phone">Phone Number</label>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors focus-within:border-[#B9A58B] focus-within:ring-2 focus-within:ring-[#B9A58B]/20">
                <PhoneInput
                  id="register-phone"
                  value={phone}
                  onChange={(value) => setPhone(value ?? '')}
                  defaultCountry="NG"
                  international
                  countryCallingCodeEditable={false}
                  placeholder="Enter phone number"
                  className="w-full text-sm"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Phone verification remains pending until an OTP provider is connected.</p>
            </div>
          )}

          {!isLogin && (
            <div className="flex items-start gap-2 border-l-4 border-[#c79a4b] bg-[#fbf8ef] px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8d692b]" />
              <p className="text-xs leading-5 text-[#574a32]">Signup does not verify identity. Do not send ID images, deeds, bank statements, or payslips; secure checks will be requested only through an approved provider flow.</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">I am a...</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as RegisterRole)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20"
              >
                <option value="landlord">Landlord / Property Manager</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>
          )}

          {message && (
            <div role={message.type === 'error' ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#332D29] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#4A4039] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (isLogin ? 'Logging in…' : 'Creating account…') : isLogin ? 'Log In' : 'Create Account'}
          </button>

          <div className="text-sm text-slate-500 text-center">
            {isLogin ? (
              <button type="button" onClick={() => setIsLogin(false)} className="font-semibold text-[#332D29] underline decoration-[#B9A58B] underline-offset-4 hover:text-[#4A4039]">
                Create a new account
              </button>
            ) : (
              <button type="button" onClick={() => setIsLogin(true)} className="font-semibold text-[#332D29] underline decoration-[#B9A58B] underline-offset-4 hover:text-[#4A4039]">
                Already have an account? Log in
              </button>
            )}
          </div>
        </form>
      </div>
        </section>
      </div>
    </div>
  );
}