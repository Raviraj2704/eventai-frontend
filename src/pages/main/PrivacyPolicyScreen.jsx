import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPolicyScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto pb-16 font-sans text-slate-800">
      <div className="sticky top-0 z-10 bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-2 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-700 hover:bg-slate-50 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[18px] font-bold tracking-tight">Privacy Policy</h1>
      </div>

      <div className="px-5 py-6 space-y-5 text-[14px] leading-relaxed">
        <div>
          <p className="font-bold text-slate-900">EVENT AI</p>
          <p className="text-slate-500 text-[12px]">Last updated: 18 November 2026</p>
          <p className="text-slate-500 text-[12px] mt-1">Contact: ravirajapanthulu@gmail.com</p>
        </div>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">1. Information we collect</h2>
          <p><strong>Account details:</strong> name, email address, and a password stored only as a secure hash.</p>
          <p><strong>Profile details you add:</strong> phone number, company, designation, location, bio, and profile photo.</p>
          <p><strong>Event activity:</strong> sessions you attend, bookmarks, ratings, feedback, connection requests, chat messages, and meetings.</p>
          <p><strong>Technical data:</strong> IP address (used to limit repeated login attempts), device and browser type, and basic error logs.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">2. How we use your information</h2>
          <p>We use it to run your account, show your schedule and networking matches, deliver chat and meetings, keep the service secure, and fix errors. We do not sell your personal data.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">3. Service providers</h2>
          <p>We share data only with providers that run parts of the service for us:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Neon (database) and Render (backend hosting)</li>
            <li>Vercel (website hosting)</li>
            <li>Cloudinary (profile and session images)</li>
            <li>Groq (AI features, such as session recommendations; prompts may include your profile interests)</li>
          </ul>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">4. How long we keep data</h2>
          <p>We keep your account while it is active. When you delete your account, we remove your personal data within 30 days, except records we must keep by law.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">5. Your rights</h2>
          <p>You can view and correct your profile in the app, and delete your account from the Profile screen. For any other request, email ravirajapanthulu@gmail.com. Indian users have rights under the Digital Personal Data Protection Act, 2023, and US users under applicable state laws. We respond within 30 days.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">6. Security</h2>
          <p>Passwords are hashed, database access is restricted, and API keys are kept on the server. No system is perfectly secure, so please use a strong, unique password.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">7. Children</h2>
          <p>EVENT AI is not for anyone under 18. If we learn that we hold a minor's data, we will delete it.</p>
        </section>

        <section className="space-y-1.5 bg-slate-50 p-4 rounded-[16px]">
          <h2 className="font-bold text-slate-900 text-[15px]">8. Changes</h2>
          <p>We will post updates on this page and change the date above.</p>
        </section>
      </div>
    </div>
  );
}