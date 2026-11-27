import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiUsers, 
  FiUserPlus, 
  FiSearch, 
  FiEye, 
  FiEyeOff, 
  FiEdit2, 
  FiTrash2, 
  FiShield, 
  FiPhone, 
  FiHome, 
  FiCheckCircle, 
  FiLock,
  FiXCircle,
  FiCopy,
  FiMessageCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from './teamApi';
import AddStaffModal from './modals/AddStaffModal';
import EditStaffModal from './modals/EditStaffModal';
import './Team.css';

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Password visibility map { [memberId]: boolean }
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTeamMembers();
      setMembers(data || []);
    } catch (err) {
      console.error('Failed to load team members:', err);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddMember = async (payload) => {
    try {
      await createTeamMember(payload);
      toast.success('Team member created successfully!');
      loadMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to create team member');
      throw err;
    }
  };

  const handleUpdateMember = async (id, payload) => {
    try {
      await updateTeamMember(id, payload);
      toast.success('Staff details updated successfully!');
      loadMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to update team member');
      throw err;
    }
  };

  const handleToggleStatus = async (member) => {
    const newStatus = member.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateTeamMember(member.id, { status: newStatus });
      toast.success(`Account status set to ${newStatus}`);
      loadMembers();
    } catch (err) {
      toast.error(err?.message || 'Failed to update account status');
    }
  };

  const handleDeleteMember = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from your team?`)) {
      try {
        await deleteTeamMember(id);
        toast.success(`Removed ${name} from team.`);
        loadMembers();
      } catch (err) {
        toast.error(err?.message || 'Failed to delete team member');
      }
    }
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
  };

  // Filtered staff list
  const filteredMembers = members.filter((member) => {
    const matchesSearch = 
      (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.mobileNumber || '').includes(searchTerm);
    
    let matchesRole = true;
    if (roleFilter === 'Property Manager') {
      matchesRole = member.role === 'Property Manager';
    } else if (roleFilter === 'Caretaker / Ground Staff') {
      matchesRole = member.role?.toLowerCase().includes('caretaker') || member.role === 'Housekeeper' || member.role === 'Cook/Chef';
    }

    return matchesSearch && matchesRole;
  });

  // Summary Metrics
  const totalStaff = members.length;
  const managerCount = members.filter((m) => m.role === 'Property Manager').length;
  const caretakerCount = members.filter((m) => m.role?.toLowerCase().includes('caretaker') || m.role === 'Housekeeper' || m.role === 'Cook/Chef').length;
  const activeCount = members.filter((m) => m.status === 'Active').length;

  const getRoleBadgeClass = (role) => {
    if (role === 'Property Manager') {
      return 'role-badge badge-manager';
    }
    return 'role-badge badge-caretaker';
  };

  const handleCopyCredentials = (member) => {
    const pin = member.pin || member.password;
    const text = `StayOps Login Credentials:\nName: ${member.name}\nRole: ${member.role}\nMobile: +91 ${member.mobileNumber}\nAccess PIN: ${pin}`;
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${member.name}'s login credentials!`);
  };

  const handleWhatsAppShare = (member) => {
    const pin = member.pin || member.password;
    const msg = `Hello ${member.name},\nHere are your StayOps login credentials:\n• Role: ${member.role}\n• Mobile: +91 ${member.mobileNumber}\n• Access PIN: ${pin}\n\nPlease log in to access your assigned properties.`;
    window.open(`https://wa.me/91${member.mobileNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="team-page-container">
      {/* Page Header */}
      <div className="team-page-header">
        <div className="team-header-title-box">
          <h1 className="team-page-title">
            <FiUsers className="title-icon" /> Team & Staff Management
          </h1>
          <p className="team-page-subtitle">
            Configure staff mobile logins, set access PINs, assign properties & manage operational responsibilities.
          </p>
        </div>

        <button className="add-staff-btn" onClick={() => setIsAddModalOpen(true)}>
          <FiUserPlus /> Add Staff Member
        </button>
      </div>


      {/* Summary Metrics Banner */}
      <div className="team-stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-cyan">
            <FiUsers />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Staff</span>
            <span className="stat-value">{totalStaff}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-purple">
            <FiShield />
          </div>
          <div className="stat-info">
            <span className="stat-label">Property Managers</span>
            <span className="stat-value">{managerCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-green">
            <FiHome />
          </div>
          <div className="stat-info">
            <span className="stat-label">Caretakers & Ground Staff</span>
            <span className="stat-value">{caretakerCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-emerald">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Logins</span>
            <span className="stat-value">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="team-controls-bar">
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="role-filter">Filter Role:</label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles ({totalStaff})</option>
            <option value="Property Manager">Property Managers ({managerCount})</option>
            <option value="Caretaker / Ground Staff">Caretakers / Ground Staff ({caretakerCount})</option>
          </select>
        </div>
      </div>

      {/* Staff Roster Content */}
      {loading ? (
        <div className="team-loading">Loading team members...</div>
      ) : filteredMembers.length === 0 ? (
        <div className="team-empty-state">
          <FiUsers className="empty-icon" />
          <h3>No team members found</h3>
          <p>
            {searchTerm || roleFilter !== 'All'
              ? 'Try adjusting your search query or role filter.'
              : 'Add your property managers and caretakers to start granting mobile access.'}
          </p>
          {!(searchTerm || roleFilter !== 'All') && (
            <button className="add-staff-btn" onClick={() => setIsAddModalOpen(true)}>
              <FiUserPlus /> Add First Staff Member
            </button>
          )}
        </div>
      ) : (
        <div className="team-roster-card">
          <div className="team-table-responsive">
            <table className="team-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Mobile Number (Login ID)</th>
                  <th>Access PIN</th>
                  <th>Assigned Properties</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const isPinVisible = !!visiblePasswords[member.id];
                  const pinValue = member.pin || member.password;
                  const initials = (member.name || 'Staff')
                    .trim()
                    .split(/\s+/)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'ST';

                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="staff-user-cell">
                          <div className="avatar-circle">{initials}</div>
                          <div className="staff-user-info">
                            <span className="staff-name">{member.name}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={getRoleBadgeClass(member.role)}>
                          {member.role === 'Caretaker' ? 'Caretaker / Ground Staff' : member.role}
                        </span>
                      </td>

                      <td>
                        <div className="mobile-cell">
                          <FiPhone className="cell-icon" />
                          <span>+91 {member.mobileNumber}</span>
                        </div>
                      </td>

                      <td>
                        <div className="password-cell">
                          <FiLock className="cell-icon" />
                          <span className="password-text pin-display">
                            {isPinVisible ? pinValue : '••••'}
                          </span>
                          <button
                            type="button"
                            className="toggle-pw-btn"
                            onClick={() => togglePasswordVisibility(member.id)}
                            title={isPinVisible ? 'Hide PIN' : 'Show PIN'}
                          >
                            {isPinVisible ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                          </button>
                          <button
                            type="button"
                            className="toggle-pw-btn copy-btn"
                            onClick={() => handleCopyCredentials(member)}
                            title="Copy PIN & Credentials"
                          >
                            <FiCopy size={13} />
                          </button>
                        </div>
                      </td>

                      <td>
                        <div className="properties-cell">
                          {member.assignedPropertyNames && member.assignedPropertyNames.length > 0 ? (
                            member.assignedPropertyNames.map((pName, idx) => (
                              <span key={idx} className="property-pill">
                                <FiHome className="pill-icon" /> {pName}
                              </span>
                            ))
                          ) : (
                            <span className="property-pill fallback">All Properties</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`status-badge ${member.status === 'Active' ? 'status-active' : 'status-inactive'}`}
                          onClick={() => handleToggleStatus(member)}
                          title="Click to toggle status"
                        >
                          {member.status === 'Active' ? <FiCheckCircle /> : <FiXCircle />}
                          {member.status}
                        </button>
                      </td>

                      <td className="text-right">
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            onClick={() => handleOpenEdit(member)}
                            title="Edit Staff Member"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            type="button"
                            className="action-btn wa-share-btn"
                            onClick={() => handleWhatsAppShare(member)}
                            title="Share Credentials via WhatsApp"
                          >
                            <FiMessageCircle /> WhatsApp
                          </button>
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            title="Remove Staff Member"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddMember}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        isOpen={isEditModalOpen}
        member={editingMember}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleUpdateMember}
      />
    </div>
  );
}
