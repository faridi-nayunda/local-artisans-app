import React, { useState, useContext } from "react";
import AuthContext from "../../context/AuthContext";
import { Link } from "react-router-dom";

const CustomerRegistrationForm = () => {
    const { registerUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({ 
        first_name: "", 
        last_name: "", 
        email: "", 
        phone_number: "",
        password: "" 
    });
    const [passwordError, setPasswordError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        if (name === 'password') {
            validatePasswordStrength(value);
        }
    };

    const validatePasswordStrength = (password) => {
        let strength = 0;
        let messages = [];
        
        // Length check
        if (password.length < 8) {
            messages.push("Password must be at least 8 characters long");
        } else {
            strength += 1;
        }
        
        // Uppercase check
        if (!/[A-Z]/.test(password)) {
            messages.push("Include at least one uppercase letter");
        } else {
            strength += 1;
        }
        
        // Lowercase check
        if (!/[a-z]/.test(password)) {
            messages.push("Include at least one lowercase letter");
        } else {
            strength += 1;
        }
        
        // Number check
        if (!/[0-9]/.test(password)) {
            messages.push("Include at least one number");
        } else {
            strength += 1;
        }
        
        // Special character check
        if (!/[^A-Za-z0-9]/.test(password)) {
            messages.push("Include at least one special character");
        } else {
            strength += 1;
        }
        
        setPasswordStrength(strength);
        setPasswordError(messages.length > 0 ? messages.join(". ") : "");
    };

    const getPasswordStrengthColor = () => {
        switch(passwordStrength) {
            case 0:
            case 1:
                return "bg-red-500";
            case 2:
                return "bg-yellow-500";
            case 3:
                return "bg-blue-500";
            case 4:
            case 5:
                return "bg-green-500";
            default:
                return "bg-gray-300";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwordError) {
            return;
        }
        await registerUser(formData.first_name, formData.last_name, formData.email, formData.phone_number, formData.password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
            >
                <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">Create an Account</h2>

                <input
                    type="text"
                    name="first_name"
                    placeholder="First name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="text"
                    name="last_name"
                    placeholder="Last name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="tel"
                    name="phone_number"
                    placeholder="Phone"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 mb-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Password strength meter */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                        className={`h-2 rounded-full ${getPasswordStrengthColor()}`} 
                        style={{ width: `${(passwordStrength/5)*100}%` }}
                    ></div>
                </div>
                
                {passwordError && (
                    <p className="text-red-500 text-sm mb-4">{passwordError}</p>
                )}
                
                {/* <div className="text-xs text-gray-500 mb-4">
                    Password must contain at least:
                    <ul className="list-disc pl-5 mt-1">
                        <li>8 characters</li>
                        <li>1 uppercase letter</li>
                        <li>1 lowercase letter</li>
                        <li>1 number</li>
                        <li>1 special character</li>
                    </ul>
                </div> */}

                <button
                    type="submit"
                    disabled={passwordError}
                    className={`w-full ${passwordError ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 rounded-md transition duration-200`}
                >
                    Register
                </button>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>
                        Already have an account?{" "}
                        <Link to="/login" className="text-blue-600 hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default CustomerRegistrationForm;