import { useState } from "react";
import Step1BusinessInfo from "./../onboarding/Step1BusinessInfo";
import Step2StoreInfo from "./../onboarding/Step2StoreInfo";
import Step3PaymentInfo from "./../onboarding/Step3PaymentInfo";
import Step4IDVerification from "./../onboarding/Step4IDVerification";
import Step5Shipping from "./../onboarding/Step5Shipping";
import Step6Review from "./../onboarding/Step6Review";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import { useContext } from "react";
import AuthContext from "../../context/AuthContext";

const SellerOnboarding = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { authTokens } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    legal_name: '',
    business_name: '',
    phone_number: '',
    business_address: '',
    store_name: '',
    store_logo: null,
    store_description: '',
    bank_account: '',
    routing_number: '',
    government_id: null,
    ship_from_address: '',
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files[0] }));
  };

  const handleSubmit = async () => {
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });

    try {
      const response = await API.post("seller-profile/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authTokens?.access}`,
        },
      });

      if (response.status === 201) {
        alert("Profile submitted successfully!");
        navigate("/seller");
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data || error);
      alert("Error submitting profile.");
    }
  };

  const stepComponents = {
    1: <Step1BusinessInfo data={formData} onChange={handleChange} />,
    2: <Step2StoreInfo data={formData} onChange={handleChange} onFileChange={handleFileChange} />,
    3: <Step3PaymentInfo data={formData} onChange={handleChange} />,
    4: <Step4IDVerification data={formData} onFileChange={handleFileChange} />,
    5: <Step5Shipping data={formData} onChange={handleChange} />,
    6: <Step6Review data={formData} />
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-md shadow">
      <h2 className="text-2xl font-semibold mb-4">Seller Onboarding</h2>
      <div className="mb-6">{stepComponents[step]}</div>

      <div className="flex justify-between">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Back
          </button>
        )}
        {step < 6 ? (
          <button
            onClick={handleNext}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default SellerOnboarding;
