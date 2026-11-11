import { Clock3, ShieldCheck, Users } from 'lucide-react';

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
