import React from 'react';

function Industries() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Industry Prototypes</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded shadow text-center">Personal Portfolios</div>
        <div className="bg-white p-6 rounded shadow text-center">Realtors</div>
        <div className="bg-white p-6 rounded shadow text-center">Gyms</div>
        <div className="bg-white p-6 rounded shadow text-center">Clinics & Salons</div>
      </div>
    </div>
  );
}

export default Industries;
