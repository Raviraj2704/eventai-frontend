import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, Calendar, Settings, Lock, Shield, CheckCircle2,
  AlertCircle, Loader, Search, Filter, MoreVertical, Edit2, Trash2,
  Download, Plus, X
} from 'lucide-react';
import apiClient from '../services/apiClient';

const AdminRBACDashboard = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!userProfile?.is_admin) {
      setError('Admin access required');
      setLoading(false);
      return;
    }
    loadDashboardData();
  }, [userProfile?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, sessionsRes, rolesRes] = await Promise.all([
        apiClient.get('/admin/users?limit=100'),
        apiClient.get('/admin/sessions?limit=100'),
        apiClient.get('/admin/roles')
      ]);

      setUsers(usersRes.data || usersRes.users || []);
      setSessions(sessionsRes.data || sessionsRes.sessions || []);
      setRoles(rolesRes.data || rolesRes.roles || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await apiClient.put(`/admin/users/${userId}/role`, {
        role: newRole
      });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setShowRoleModal(false);
    } catch (err) {
      console.error('Role update error:', err);
      alert('Failed to update user role');
    }
  };

  const handleRevokeAccess = async (userId) => {
    if (!confirm('Are you sure you want to revoke access for this user?')) return;

    try {
      await apiClient.put(`/admin/users/${userId}/deactivate`);
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: false } : u));
    } catch (err) {
      console.error('Revoke error:', err);
      alert('Failed to revoke access');
    }
  };

  const handleApproveSession = async (sessionId) => {
    try {
      await apiClient.put(`/admin/sessions/${sessionId}/approve`);
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, is_approved: true } : s));
    } catch (err) {
      console.error('Approval error:', err);
      alert('Failed to approve session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      await apiClient.delete(`/admin/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete session');
    }
  };

  // Stats cards
  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
        </div>
        <Icon size={40} style={{ color }} className="opacity-20" />
      </div>
    </div>
  );

  // Filtered and searched users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (!userProfile?.is_admin) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Lock size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-slate-600 dark:text-slate-400">Admin access required to view this dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={32} />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-blue-100">Role-Based Access Control & Management</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} />
            <div>
              <p className="font-semibold">{error}</p>
              <button
                onClick={loadDashboardData}
                className="text-sm underline hover:no-underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stats Row */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={users.length}
              color="#3B82F6"
            />
            <StatCard
              icon={Calendar}
              label="Active Sessions"
              value={sessions.filter(s => s.is_approved).length}
              color="#10B981"
            />
            <StatCard
              icon={Lock}
              label="Pending Approval"
              value={sessions.filter(s => !s.is_approved).length}
              color="#F59E0B"
            />
            <StatCard
              icon={Users}
              label="Admins"
              value={users.filter(u => u.is_admin).length}
              color="#A78BFA"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users size={18} className="inline mr-2" />
            Users & Roles
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar size={18} className="inline mr-2" />
            Sessions
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock size={18} className="inline mr-2" />
            Permissions
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-center py-12">
            <Loader size={48} className="text-blue-500 mx-auto mb-4 animate-spin" />
            <p>Loading dashboard...</p>
          </div>
        ) : activeTab === 'overview' ? (
          // Users & Roles Tab
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="speaker">Speaker</option>
                <option value="user">User</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">User</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{user.full_name}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium capitalize">
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.is_active ? (
                            <>
                              <CheckCircle2 size={18} className="text-green-500" />
                              <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={18} className="text-red-500" />
                              <span className="text-sm text-red-600 dark:text-red-400">Inactive</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Edit role"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleRevokeAccess(user.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition-colors"
                            title="Revoke access"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'sessions' ? (
          // Sessions Tab
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Session</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Speaker</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white max-w-xs truncate">
                          {session.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{session.speaker_name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                        {new Date(session.start_time).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {session.is_approved ? (
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                            Approved
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {!session.is_approved && (
                            <button
                              onClick={() => handleApproveSession(session.id)}
                              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Permissions Tab
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Role Permissions Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-600">
                        <th className="text-left py-2">Permission</th>
                        <th className="text-center py-2">Admin</th>
                        <th className="text-center py-2">Moderator</th>
                        <th className="text-center py-2">Speaker</th>
                        <th className="text-center py-2">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                      {[
                        { name: 'View All Sessions', admin: true, mod: true, speaker: true, user: true },
                        { name: 'Create Session', admin: true, mod: true, speaker: true, user: false },
                        { name: 'Edit Own Session', admin: true, mod: true, speaker: true, user: false },
                        { name: 'Delete Session', admin: true, mod: true, speaker: false, user: false },
                        { name: 'Approve Sessions', admin: true, mod: true, speaker: false, user: false },
                        { name: 'Manage Users', admin: true, mod: false, speaker: false, user: false },
                        { name: 'View Analytics', admin: true, mod: true, speaker: false, user: false },
                        { name: 'Access Admin Panel', admin: true, mod: false, speaker: false, user: false },
                      ].map((perm, idx) => (
                        <tr key={idx}>
                          <td className="py-2 font-medium">{perm.name}</td>
                          <td className="text-center">
                            {perm.admin && <CheckCircle2 size={18} className="text-green-500 mx-auto" />}
                          </td>
                          <td className="text-center">
                            {perm.mod && <CheckCircle2 size={18} className="text-green-500 mx-auto" />}
                          </td>
                          <td className="text-center">
                            {perm.speaker && <CheckCircle2 size={18} className="text-green-500 mx-auto" />}
                          </td>
                          <td className="text-center">
                            {perm.user && <CheckCircle2 size={18} className="text-green-500 mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Change Role: {selectedUser.full_name}
            </h2>
            <div className="space-y-2 mb-6">
              {['user', 'speaker', 'moderator', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleUpdateUserRole(selectedUser.id, role)}
                  className={`w-full px-4 py-2 rounded-lg font-medium text-left transition-colors ${
                    selectedUser.role === role
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className="capitalize">{role}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRBACDashboard;