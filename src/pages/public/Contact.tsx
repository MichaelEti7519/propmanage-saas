import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

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
                      100 Property Lane<br />
                      Suite 300<br />
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
