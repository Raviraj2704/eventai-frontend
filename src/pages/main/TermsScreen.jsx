import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TermsScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-16 font-sans text-slate-800">
      <div className="sticky top-0 z-10 bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-2 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-700 hover:bg-slate-50 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[18px] font-bold tracking-tight">Terms of Service</h1>
      </div>

      <div className="px-5 py-6 space-y-5 text-[14px] leading-relaxed">
        <div>
          <p className="font-bold text-slate-900">EVENT AI</p>
          <p className="text-slate-500 text-[12px]">Last updated: 18 November 2026</p>
        </div>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">1. Using the service</h2>
          <p>You must be 18 or older and provide accurate information. You are responsible for keeping your login secure.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">2. Acceptable use</h2>
          <p>Do not harass others, post unlawful or misleading content, scrape data, attempt to access other accounts or admin areas, or disrupt the service.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">3. Your content</h2>
          <p>You keep ownership of what you post or upload. You give us permission to display it within the app. You must have the right to share any photo or text you upload.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">4. AI features</h2>
          <p>AI recommendations and summaries are suggestions only. They may be inaccurate, so verify important information.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">5. Events and third parties</h2>
          <p>EVENT AI connects attendees, speakers, and partners. We are not responsible for the conduct of other users or the quality of third-party offers.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">6. Suspension and termination</h2>
          <p>We may suspend accounts that break these terms. You may delete your account at any time.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">7. Disclaimers and liability</h2>
          <p>The service is provided "as is." To the extent the law allows, our total liability is limited to the amount you paid us in the 12 months before a claim, or INR 1,000 if you paid nothing.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">8. Governing law</h2>
          <p>These terms are governed by the laws of India. Disputes fall under the courts of Hyderabad, Telangana.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">9. Changes</h2>
          <p>We may update these terms. Continued use after an update means you accept it.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">10. Contact</h2>
          <p>ravirajapanthulu@gmail.com</p>
        </section>
      </div>
    </div>
  );
}