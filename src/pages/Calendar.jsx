// src/pages/Calendar.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaChevronLeft, FaChevronRight, FaMusic, FaRegCalendarAlt } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // 'month', 'quarter', 'year'
  
  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Get start and end of current month for query
        const start = currentDate.startOf('month').toISOString();
        const end = currentDate.endOf('month').toISOString();
        
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
            event_type,
            churches (name)
          `)
          .gte('start_time', start)
          .lte('start_time', end);
        
        if (error) throw error;
        
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [currentDate]);
  
  // Navigate to previous period
  const goToPrevious = () => {
    if (view === 'month') {
      setCurrentDate(currentDate.subtract(1, 'month'));
    } else if (view === 'quarter') {
      setCurrentDate(currentDate.subtract(3, 'month'));
    } else if (view === 'year') {
      setCurrentDate(currentDate.subtract(1, 'year'));
    }
  };
  
  // Navigate to next period
  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(currentDate.add(1, 'month'));
    } else if (view === 'quarter') {
      setCurrentDate(currentDate.add(3, 'month'));
    } else if (view === 'year') {
      setCurrentDate(currentDate.add(1, 'year'));
    }
  };
  
  // Generate days for the month view
  const generateDays = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');
    
    const days = [];
    let day = startDate;
    
    while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }
    
    return days;
  };
  
  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = dayjs(event.start_time);
      return eventDate.isSame(day, 'day');
    });
  };
  
  // Handle adding a new service
  const handleAddService = () => {
    navigate('/services/new');
  };
  
  // Handle clicking on a service
  const handleEventClick = (event) => {
    if (event.event_type === 'service') {
      navigate(`/services/${event.id}`);
    } else {
      // For other event types, could navigate to a general event view
      navigate(`/events/${event.id}`);
    }
  };
  
  // Render month view
  const renderMonthView = () => {
    const days = generateDays();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 border-b p-2">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 p-2">
          {days.map(day => {
            const isCurrentMonth = day.month() === currentDate.month();
            const isToday = day.isSame(dayjs(), 'day');
            const dayEvents = getEventsForDay(day);
            
            return (
              <div 
                key={day.valueOf()}
                className={`min-h-[80px] p-1 border rounded ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                } ${isToday ? 'border-blue-500' : 'border-gray-200'}`}
              >
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 inline-flex items-center justify-center' : ''
                  }`}>
                    {day.date()}
                  </span>
                </div>
                
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id}
                      className={`truncate text-xs rounded p-1 cursor-pointer ${
                        event.event_type === 'service' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}
                      title={event.title}
                      onClick={() => handleEventClick(event)}
                    >
                      {event.event_type === 'service' && <FaMusic className="inline mr-1" size={10} />}
                      {event.title}
                    </div>
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render quarter view
  const renderQuarterView = () => {
    // Implementation for quarterly view
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Quarterly view coming soon</p>
      </div>
    );
  };
  
  // Render year view
  const renderYearView = () => {
    // Implementation for yearly view
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Yearly view coming soon</p>
      </div>
    );
  };
  
  return (
    <div className="space-y-4 pb-16 md:pb-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        
        <div className="flex space-x-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow-sm flex items-center"
            title="Add new service"
            onClick={handleAddService}
          >
            <FaPlus className="mr-1" /> 
            <span className="hidden sm:inline">Add Service</span>
          </button>
        </div>
      </div>
      
      {/* Calendar navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevious}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Previous"
          >
            <FaChevronLeft />
          </button>
          
          <h2 className="text-lg font-medium">
            {view === 'month' && currentDate.format('MMMM YYYY')}
            {view === 'quarter' && `Q${Math.ceil((currentDate.month() + 1) / 3)} ${currentDate.year()}`}
            {view === 'year' && currentDate.format('YYYY')}
          </h2>
          
          <button
            onClick={goToNext}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Next"
          >
            <FaChevronRight />
          </button>
        </div>
        
        <div className="border rounded-md overflow-hidden">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 text-sm ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Month
          </button>
          <button
            onClick={() => setView('quarter')}
            className={`px-3 py-1 text-sm ${view === 'quarter' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Quarter
          </button>
          <button
            onClick={() => setView('year')}
            className={`px-3 py-1 text-sm ${view === 'year' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Year
          </button>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Calendar view */}
      {!loading && (
        <>
          {view === 'month' && renderMonthView()}
          {view === 'quarter' && renderQuarterView()}
          {view === 'year' && renderYearView()}
        </>
      )}
      
      {/* Legend */}
      <div className="flex items-center justify-end space-x-4 text-sm">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-blue-100 rounded mr-1"></span>
          <span className="text-gray-600">Services</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-green-100 rounded mr-1"></span>
          <span className="text-gray-600">Other Events</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
