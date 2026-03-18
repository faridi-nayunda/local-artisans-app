// Step6Review.jsx
import React from "react";

const Step6Review = ({ data }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Review Your Info</h3>
      <ul className="space-y-2 text-sm">
        <li><strong>Legal Name:</strong> {data.legal_name}</li>
        <li><strong>Business Name:</strong> {data.business_name}</li>
        <li><strong>Phone:</strong> {data.phone_number}</li>
        <li><strong>Business Address:</strong> {data.business_address}</li>
        <li><strong>Store Name:</strong> {data.store_name}</li>
        <li><strong>Store Description:</strong> {data.store_description}</li>
        <li><strong>Bank Account:</strong> {data.bank_account}</li>
        <li><strong>Routing Number:</strong> {data.routing_number}</li>
        <li><strong>Shipping Address:</strong> {data.ship_from_address}</li>
        <li><strong>Store Logo:</strong> {data.store_logo?.name}</li>
        <li><strong>Govt ID:</strong> {data.government_id?.name}</li>
      </ul>
    </div>
  );
};

export default Step6Review;
