// Step3PaymentInfo.jsx
import React from "react";

const Step3PaymentInfo = ({ data, onChange }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Payment Information</h3>
      <input
        type="text"
        name="bank_account"
        placeholder="Bank Account Number"
        value={data.bank_account}
        onChange={(e) => onChange("bank_account", e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <input
        type="text"
        name="routing_number"
        placeholder="Routing Number"
        value={data.routing_number}
        onChange={(e) => onChange("routing_number", e.target.value)}
        className="w-full p-2 border rounded"
      />
    </div>
  );
};

export default Step3PaymentInfo;