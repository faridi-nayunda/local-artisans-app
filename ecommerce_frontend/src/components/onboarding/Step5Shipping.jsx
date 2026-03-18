// Step5Shipping.jsx
import React from "react";

const Step5Shipping = ({ data, onChange }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Shipping Address</h3>
      <textarea
        name="ship_from_address"
        placeholder="Ship From Address"
        value={data.ship_from_address}
        onChange={(e) => onChange("ship_from_address", e.target.value)}
        className="w-full p-2 border rounded"
      ></textarea>
    </div>
  );
};

export default Step5Shipping;