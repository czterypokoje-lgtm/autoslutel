import React from 'react';

export default function AccountPage() {
  return (
    <div className="container section">
      <div className="section-header centered">
        <span className="section-eyebrow">Mijn Account</span>
        <h1 className="section-title">Bestelgeschiedenis</h1>
      </div>
      
      <div className="card max-w-3xl mx-auto">
        <p className="text-center text-gray-600 mb-4">
          Hier kunt u inloggen om uw eerdere bestellingen te bekijken en met 1 klik opnieuw te bestellen.
        </p>
        <div className="text-center">
          <button className="btn btn-primary">Inloggen</button>
        </div>
      </div>
    </div>
  );
}
