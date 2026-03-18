import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

          {/* About Us */}
          <div>
            <h4 className="text-lg font-bold mb-4">About Us</h4>
            <p className="text-sm leading-relaxed mb-4">
              We empower local artisans across Tanzania by giving them a digital space to showcase and sell their handcrafted products to the world.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <a href="#" className="hover:text-green-500"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="hover:text-green-500"><i className="fab fa-twitter"></i></a>
              <a href="#" className="hover:text-green-500"><i className="fab fa-instagram"></i></a>
              <a href="#" className="hover:text-green-500"><i className="fab fa-youtube"></i></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-green-500">Home</Link></li>
              <li><Link to="/products" className="hover:text-green-500">Products</Link></li>
              {/* <li><Link to="/categories" className="hover:text-green-500">Categories</Link></li> */}
              <li><Link to="/seller-account" className="hover:text-green-500">Sell Your Craft</Link></li>
            </ul>
          </div>

          {/* Help Center */}
          <div>
            <h4 className="text-lg font-bold mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="#" className="hover:text-green-500">About Us</Link></li>
              <li><Link to="#" className="hover:text-green-500">Terms & Conditions</Link></li>
              <li><Link to="#" className="hover:text-green-500">FAQs</Link></li>
              <li><Link to="#" className="hover:text-green-500">Support</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-4">Contact</h4>
            <ul className="text-sm space-y-2">
              <li><i className="fas fa-map-marker-alt mr-2"></i> Dar es Salaam, Tanzania</li>
              <li><i className="fas fa-envelope mr-2"></i> support@handify.co.tz</li>
              <li><i className="fas fa-phone mr-2"></i> +255 712 345 678</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-700 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Handify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
