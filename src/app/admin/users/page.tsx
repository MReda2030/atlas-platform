'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { UserRole } from '@/lib/auth/roles-permissions';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId?: string;
  branchName?: string;
  agentNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface CreateUserData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: UserRole;
  branchId?: string;
  agentNumber?: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterBranch, setFilterBranch] = useState<string>('');

  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: UserRole.VIEWER,
    branchId: '',
    agentNumber: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      setUsers(result.data.users);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newUser.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          email: newUser.email.toLowerCase().trim(),
          password: newUser.password,
          name: newUser.name.trim(),
          role: newUser.role,
          branchId: newUser.branchId || undefined,
          agentNumber: newUser.agentNumber || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      // Reset form and refresh users
      setNewUser({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: UserRole.VIEWER,
        branchId: '',
        agentNumber: '',
      });
      setShowCreateForm(false);
      await fetchUsers();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      await fetchUsers();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const getAuthToken = (): string => {
    // In a real implementation, this would get the token from cookies or context
    return localStorage.getItem('auth-token') || '';
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      [UserRole.SUPER_ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
      [UserRole.ADMIN]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
      [UserRole.BRANCH_MANAGER]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
      [UserRole.MEDIA_BUYER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      [UserRole.SALES_AGENT]: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      [UserRole.ANALYST]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
      [UserRole.VIEWER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return colors[role] || colors[UserRole.VIEWER];
  };

  const formatRole = (role: UserRole) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesBranch = !filterBranch || user.branchId === filterBranch;
    
    return matchesSearch && matchesRole && matchesBranch;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              User Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage system users and their permissions
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            + Add New User
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-red-700 dark:text-red-200">{error}</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setError(null)}
              className="mt-2"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Create User Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>Add a new user to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repeat password"
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      id="role"
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      required
                    >
                      <option value={UserRole.VIEWER}>Viewer</option>
                      <option value={UserRole.SALES_AGENT}>Sales Agent</option>
                      <option value={UserRole.MEDIA_BUYER}>Media Buyer</option>
                      <option value={UserRole.ANALYST}>Analyst</option>
                      <option value={UserRole.BRANCH_MANAGER}>Branch Manager</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                      <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select
                      id="branch"
                      value={newUser.branchId}
                      onChange={(e) => setNewUser(prev => ({ ...prev, branchId: e.target.value }))}
                      placeholder="Select branch"
                    >
                      <option value="">No specific branch</option>
                      <option value="4seasons">4 Seasons</option>
                      <option value="amazonn">Amazonn</option>
                      <option value="fantastic">Fantastic</option>
                      <option value="skyline">Skyline</option>
                    </Select>
                  </div>
                </div>

                {newUser.role === UserRole.SALES_AGENT && (
                  <div className="space-y-2">
                    <Label htmlFor="agentNumber">Agent Number</Label>
                    <Input
                      id="agentNumber"
                      placeholder="e.g. 21, 22, 23..."
                      value={newUser.agentNumber}
                      onChange={(e) => setNewUser(prev => ({ ...prev, agentNumber: e.target.value }))}
                    />
                    <p className="text-sm text-gray-500">
                      Required for sales agents to link with sales reports
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterRole">Filter by Role</Label>
                <Select
                  id="filterRole"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  placeholder="All roles"
                >
                  <option value="">All Roles</option>
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterBranch">Filter by Branch</Label>
                <Select
                  id="filterBranch"
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  placeholder="All branches"
                >
                  <option value="">All Branches</option>
                  <option value="4seasons">4 Seasons</option>
                  <option value="amazonn">Amazonn</option>
                  <option value="fantastic">Fantastic</option>
                  <option value="skyline">Skyline</option>
                </Select>
              </div>

              <div className="space-y-2 flex items-end">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRole('');
                    setFilterBranch('');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Name</th>
                    <th className="text-left py-3 px-2">Email</th>
                    <th className="text-left py-3 px-2">Role</th>
                    <th className="text-left py-3 px-2">Branch</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Last Login</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          {user.agentNumber && (
                            <div className="text-sm text-gray-500">Agent {user.agentNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">{user.email}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="py-3 px-2">{user.branchName || '-'}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}