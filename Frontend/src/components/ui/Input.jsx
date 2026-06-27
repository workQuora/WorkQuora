import React from 'react';

const Input = ({ label, error, ...props }) => (
  <div className="w-full mb-4">
    {label && <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-700'} text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-all`}
      {...props} 
    />
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

export default Input;