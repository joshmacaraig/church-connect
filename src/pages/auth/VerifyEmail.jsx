// src/pages/auth/VerifyEmail.jsx
import { Link } from 'react-router-dom'
import { FaEnvelope, FaCheck } from 'react-icons/fa'

const VerifyEmail = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Church Connect</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Verify your email</h2>
        </div>
        
        <div className="bg-white p-8 shadow rounded-lg text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FaEnvelope className="text-2xl text-blue-600" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">Check your inbox</h3>
          
          <p className="text-gray-600 mb-6">
            We sent a verification link to your email address. Please click the link to verify your account.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-1">Next steps:</h4>
              <ul className="text-sm text-gray-600 text-left space-y-2">
                <li className="flex items-start">
                  <FaCheck className="mt-1 mr-2 text-green-500 flex-shrink-0" />
                  <span>Check your email inbox (and spam folder)</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="mt-1 mr-2 text-green-500 flex-shrink-0" />
                  <span>Click the verification link in the email</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="mt-1 mr-2 text-green-500 flex-shrink-0" />
                  <span>Return to Church Connect and sign in</span>
                </li>
              </ul>
            </div>
            
            <Link
              to="/login"
              className="block w-full py-3 px-4 text-center border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Login
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            Didn't receive an email? Check your spam folder or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              try again
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
