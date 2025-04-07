// src/pages/Services.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaCalendarAlt, FaEye, FaEdit } from 'react-icons/fa';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabase';

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        // Filter for service type events only
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            start_time,
            end_time,
            location,
            church_id,
            team_id,
            churches (name)
          `)
          .eq('event_type', 'service')
          .order('start_time', { ascending: false });
        
        if (error) throw error;
        
        setServices(data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);
  
  // Filter services based on search query
  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (service.churches?.name && service.churches.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleAddService = () => {
    navigate('/services/new');
  };
  
  const handleViewService = (id) => {
    navigate(`/services/${id}`);
  };
  
  const handleEditService = (id, e) => {
    e.stopPropagation(); // Prevent triggering the view service action
    navigate(`/services/edit/${id}`);
  };
  
  return (
    <div className="space-y-4 pb-16 md:pb-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-sm"
          title="Add new service"
          onClick={handleAddService}
        >
          <FaPlus />
        </button>
      </div>
      
      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search services by title, description, or church..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Services list */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredServices.length === 0 ? (
            <div className="p-6 text-center">
              <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'No services match your search criteria.' : 'Get started by adding a new service.'}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleAddService}
                >
                  <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                  Add Service
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredServices.map(service => (
                <li 
                  key={service.id} 
                  className="px-4 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewService(service.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
                      <p className="text-sm text-gray-500">
                        {dayjs(service.start_time).format('dddd, MMMM D, YYYY • h:mm A')}
                      </p>
                      {service.churches?.name && (
                        <p className="text-sm text-gray-600 mt-1">
                          {service.churches.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => handleViewService(service.id)}
                        className="text-gray-500 hover:text-blue-600"
                        title="View service"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={(e) => handleEditService(service.id, e)}
                        className="text-gray-500 hover:text-blue-600"
                        title="Edit service"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Services;
