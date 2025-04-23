// ScheduleForm.jsx
import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

export default function ScheduleForm() {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [employee, setEmployee] = useState('');

  // Mock data for employee dropdown
  const employees = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis'];

  // Mock function for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ employee, date, startTime, endTime });
    // Additional submission logic would go here
  };

  // Get day name from selected date
  const getFormattedDay = () => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="py-8 p-[29px_14px_30px_24px] my-8 shadow-[0px_0px_4px_1px_#0000004D] mx-8">
      <div className="flex items-center justify-between p-6 border-b">
        <h1 className="text-2xl font-bold">ADD SCHEDULE</h1>
        <a href="#" className="text-blue-700 font-medium">Schedule List</a>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Employee Section */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-medium mb-2">Employee</h2>
          <p className="text-gray-600 mb-4">Select employee to create schedule</p>
          
          <div className="mb-4">
            <label htmlFor="employee" className="block text-lg font-medium mb-2">Employee name</label>
            <select 
              id="employee"
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>select</option>
              {employees.map((emp) => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedule Date and Time Section */}
        <div className="p-6">
          <h2 className="text-xl font-medium mb-2">Schedule date and Time</h2>
          <p className="text-gray-600 mb-4">Select the date and time for the specified schedule</p>
          
          {/* Date Field */}
          <div className="mb-6">
            <label htmlFor="date" className="block text-lg font-medium mb-2">Date</label>
            <div className="relative">
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10"
                placeholder="DD/MM/YYYY"
              />
              <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
            </div>
          </div>
          
          {/* Time Selection */}
          <div className="mb-6">
            <label className="block text-lg font-medium mb-2">Select Time</label>
            
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/4 text-gray-700 mb-4 md:mb-0">
                <h3 className="text-sm text-gray-500 mb-2">Day</h3>
                <div className="font-medium">{getFormattedDay() || 'Wednesday, March 24, 2025'}</div>
              </div>
              
              <div className="w-full md:w-3/4">
                <h3 className="text-sm text-gray-500 mb-2">Schedule Time</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-center">
                    <span className="mr-2">Start:</span>
                    <div className="relative">
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="border rounded-lg p-2 pl-8 pr-8 w-full focus:ring-blue-500 focus:border-blue-500"
                      >
                        {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
                          '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <Clock className="absolute left-2 top-2.5 text-gray-400" size={16} />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="mr-2">Stop:</span>
                    <div className="relative">
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="border rounded-lg p-2 pl-8 pr-8 w-full focus:ring-blue-500 focus:border-blue-500"
                      >
                        {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
                          '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <Clock className="absolute left-2 top-2.5 text-gray-400" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Add Time Button */}
          <div className="mb-6">
            <button 
              type="button" 
              className="text-blue-700 font-medium"
              onClick={() => console.log('Add another time slot')}
            >
              Add Time
            </button>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="p-6 border-t flex justify-end space-x-4">
          <button
            type="button"
            className="px-8 py-3 border border-red-500 text-red-500 font-medium rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-900 text-white font-medium rounded-lg"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}