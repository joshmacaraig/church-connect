// src/components/events/TeamMembersSelector.jsx
import { useState, useEffect } from 'react';
import { FaUserPlus, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';

const TeamMembersSelector = ({ teamId, eventId, churchId, onMembersChange }) => {
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([
    'Worship Leader', 'Vocals', 'Acoustic Guitar', 'Electric Guitar', 
    'Bass', 'Drums', 'Keys', 'Piano', 'Violin', 'Cello', 
    'Flute', 'Saxophone', 'Trumpet', 'Trombone', 
    'Sound', 'Projection', 'Video', 'Lighting'
  ]);
  const [error, setError] = useState(null);

  // Fetch team members when teamId changes
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch members from the selected team
        const { data, error } = await supabase
          .from('team_members')
          .select(`
            id,
            role,
            user_id,
            profiles:user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('team_id', teamId);
        
        if (error) throw error;
        
        setTeamMembers(data || []);
      } catch (error) {
        console.error('Error fetching team members:', error);
        setError('Failed to load team members. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamMembers();
  }, [teamId]);
  
  // Load existing member assignments if eventId is provided (edit mode)
  useEffect(() => {
    const fetchExistingAssignments = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('service_team_members')
          .select(`
            id,
            user_id,
            role,
            notes,
            is_confirmed,
            profiles:user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('event_id', eventId);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setSelectedMembers(data.map(item => ({
            id: item.id,
            userId: item.user_id,
            role: item.role,
            notes: item.notes || '',
            isConfirmed: item.is_confirmed,
            memberName: item.profiles?.full_name || 'Unknown',
            avatarUrl: item.profiles?.avatar_url
          })));
        }
      } catch (error) {
        console.error('Error fetching existing team assignments:', error);
        setError('Failed to load existing team assignments. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExistingAssignments();
  }, [eventId]);
  
  // Update parent component when selected members change
  useEffect(() => {
    if (onMembersChange) {
      onMembersChange(selectedMembers);
    }
  }, [selectedMembers, onMembersChange]);
  
  const handleAddMember = (userId) => {
    // Find the member in the team members list
    const member = teamMembers.find(m => m.user_id === userId);
    if (!member) return;
    
    // Check if member is already selected
    if (selectedMembers.some(m => m.userId === userId)) {
      setError('This team member is already assigned to the service.');
      return;
    }
    
    // Add the member to selected list
    const newMember = {
      userId: member.user_id,
      role: member.role || 'Team Member', // Use their team role as default
      notes: '',
      isConfirmed: false,
      memberName: member.profiles?.full_name || 'Unknown',
      avatarUrl: member.profiles?.avatar_url
    };
    
    setSelectedMembers(prev => [...prev, newMember]);
    setError(null);
  };
  
  const handleRemoveMember = (index) => {
    setSelectedMembers(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleRoleChange = (index, role) => {
    setSelectedMembers(prev => 
      prev.map((member, i) => 
        i === index ? { ...member, role: role } : member
      )
    );
  };
  
  const handleNotesChange = (index, notes) => {
    setSelectedMembers(prev => 
      prev.map((member, i) => 
        i === index ? { ...member, notes: notes } : member
      )
    );
  };
  
  // Filter out already selected members
  const availableMembers = teamMembers.filter(
    member => !selectedMembers.some(m => m.userId === member.user_id)
  );
  
  if (!teamId && !eventId) {
    return (
      <div className="text-gray-500 italic p-4 text-center">
        Please select a team first to assign members.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {/* Add Members Select */}
      {availableMembers.length > 0 && (
        <div className="flex space-x-2">
          <select 
            className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            defaultValue=""
            onChange={(e) => e.target.value && handleAddMember(e.target.value)}
          >
            <option value="" disabled>Add team member...</option>
            {availableMembers.map(member => (
              <option key={member.user_id} value={member.user_id}>
                {member.profiles?.full_name || 'Unknown'}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
            title="Add team member"
            onClick={() => document.getElementById('member-select').focus()}
          >
            <FaUserPlus />
          </button>
        </div>
      )}
      
      {/* No available members message */}
      {availableMembers.length === 0 && teamMembers.length > 0 && selectedMembers.length > 0 && (
        <div className="bg-gray-100 p-3 rounded text-center text-gray-600">
          All team members have been assigned roles.
        </div>
      )}
      
      {/* No team members message */}
      {teamMembers.length === 0 && !loading && (
        <div className="bg-gray-100 p-3 rounded text-center text-gray-600">
          This team has no members. Please add members to the team first.
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Selected Members List */}
      {selectedMembers.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Assigned Team Members</h3>
          <div className="space-y-3">
            {selectedMembers.map((member, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md border shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    {member.avatarUrl ? (
                      <img 
                        src={member.avatarUrl} 
                        alt={member.memberName} 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                        {member.memberName.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium">{member.memberName}</span>
                    
                    {/* Confirmation status */}
                    {member.isConfirmed ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                        <FaCheck className="mr-1" size={10} />
                        Confirmed
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                        <FaTimes className="mr-1" size={10} />
                        Pending
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveMember(index)}
                    title="Remove member"
                  >
                    <FaTrash />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Role selector */}
                  <div>
                    <label htmlFor={`role-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      id={`role-${index}`}
                      value={member.role}
                      onChange={(e) => handleRoleChange(index, e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {availableRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  {/* Notes field */}
                  <div>
                    <label htmlFor={`notes-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      id={`notes-${index}`}
                      value={member.notes}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      placeholder="Optional notes"
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembersSelector;
