import React from 'react';

function Home() {
  return (
    <div className="flex-grow">
      <section className="bg-gray-100 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Social Studio</h1>
        <p className="text-lg mb-8">Affordable digital marketing and web & app development services</p>
        <a href="/free-prototype" className="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition">
          Get a Free Prototype
        </a>
      </section>

      <section className="py-12 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-6">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold mb-2">Digital Marketing</h3>
            <p>SEO, SMM, content marketing, and more.</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold mb-2">Web Development</h3>
            <p>Responsive websites and web apps.</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold mb-2">Mobile Apps</h3>
            <p>iOS and Android app development.</p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-6">Industry Prototypes</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded shadow text-center">Personal Portfolios</div>
          <div className="bg-white p-4 rounded shadow text-center">Realtors</div>
          <div className="bg-white p-4 rounded shadow text-center">Gyms</div>
          <div className="bg-white p-4 rounded shadow text-center">Clinics & Salons</div>
        </div>
      </section>

      <section className="py-12 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-6">Testimonials</h2>
        <div className="overflow-x-auto whitespace-nowrap space-x-4">
          <div className="inline-block bg-white p-6 rounded shadow w-80">
            <p>"Social Studio helped us grow our online presence tremendously!"</p>
            <p className="mt-2 font-bold">- Client A</p>
          </div>
          <div className="inline-block bg-white p-6 rounded shadow w-80">
            <p>"Professional and affordable services."</p>
            <p className="mt-2 font-bold">- Client B</p>
          </div>
          <div className="inline-block bg-white p-6 rounded shadow w-80">
            <p>"Highly recommend for startups."</p>
            <p className="mt-2 font-bold">- Client C</p>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div>Contact us: info@socialstudio.com | +1 234 567 890</div>
          <div className="space-x-4 mt-2 md:mt-0">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:underline">Facebook</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:underline">Twitter</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
