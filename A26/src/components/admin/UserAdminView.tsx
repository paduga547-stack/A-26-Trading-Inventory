import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount } from '../../types';
import { Modal } from '../common/Modal';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Lock,
  User,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const UserAdminView: React.FC = () => {
  const {
    users,
    currentUser,
    createUserAccount,
    deleteUserAccount,
    bulkDeleteUsers,
    resetUserPassword,
    showToast,
  } = useApp();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Form inputs
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserAccount['role']>('INVENTORY');

  // Reset Password State (Admin Only)
  const [resetTargetUser, setResetTargetUser] = useState<UserAccount | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      showToast('Please fill in username and password', 'error');
      return;
    }

    const success = createUserAccount({
      username: newUsername.trim(),
      password: newPassword.trim(),
      name: newName.trim() || newUsername.trim(),
      role: newRole,
    });

    if (success) {
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewRole('INVENTORY');
      setIsCreateOpen(false);
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedUserIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedUserIds(next);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      // Exclude master admin from bulk selection
      const deletables = users.filter((u) => u.username.toLowerCase() !== 'a26jaya').map((u) => u.id);
      setSelectedUserIds(new Set(deletables));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedUserIds.size === 0) return;
    bulkDeleteUsers(Array.from(selectedUserIds));
    setSelectedUserIds(new Set());
  };

  const handleDeleteSingle = (u: UserAccount) => {
    if (u.username.toLowerCase() === 'a26jaya') {
      showToast('The master admin account cannot be deleted!', 'error');
      return;
    }
    deleteUserAccount(u.id);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (currentUser?.role !== 'ADMIN') {
      showToast('Only Admin is authorized to reset account passwords!', 'error');
      return;
    }
    if (!newResetPassword.trim()) {
      showToast('New password cannot be empty', 'error');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      showToast('Passwords do not match! Please verify both fields.', 'error');
      return;
    }

    const success = resetUserPassword(resetTargetUser.id, newResetPassword.trim());
    if (success) {
      setResetTargetUser(null);
      setNewResetPassword('');
      setConfirmResetPassword('');
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span>User Accounts & Access Authorization</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Portal: Only administrator account <strong className="text-slate-800">A26Jaya</strong> is authorized to create accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedUserIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedUserIds.size})</span>
            </button>
          )}

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User Account</span>
          </button>
        </div>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs">
          <div className="font-bold text-purple-950 flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            <span>ADMIN (A26Jaya)</span>
          </div>
          <p className="text-[11px] text-purple-800">
            Full system authority: Creates user accounts, manages debt / accounts receivable, void invoices, settings, and bulk deletes.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 text-xs">
          <div className="font-bold text-sky-950 flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            <span>STOCKMAN (INVENTORY)</span>
          </div>
          <p className="text-[11px] text-sky-800">
            Dedicated warehouse access: Stock In, Stock Out, Stock Transfer, and physical count audit adjustments.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
          <div className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>CASHIER (SALES)</span>
          </div>
          <p className="text-[11px] text-emerald-800">
            Front desk point-of-sale register: Create sales, apply discounts/taxes, tender payments, and print receipts.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Registered Accounts ({users.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            Master Admin: <strong className="text-slate-700">A26Jaya</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      users.filter((u) => u.username.toLowerCase() !== 'a26jaya').length > 0 &&
                      selectedUserIds.size === users.filter((u) => u.username.toLowerCase() !== 'a26jaya').length
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="px-4 py-3">Account Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => {
                const isMasterAdmin = u.username.toLowerCase() === 'a26jaya';
                const isSelected = selectedUserIds.has(u.id);

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      {!isMasterAdmin ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelect(u.id, e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-300 font-mono">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isMasterAdmin && (
                          <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                            Master Admin
                          </span>
                        )}
                        {currentUser?.id === u.id && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">ID: {u.id}</div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      @{u.username}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'CASHIER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.role === 'INVENTORY'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {u.role === 'INVENTORY' ? 'STOCKMAN' : u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {isMasterAdmin ? '••••••••' : u.password || '123456789'}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {currentUser?.role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => {
                              setResetTargetUser(u);
                              setNewResetPassword('');
                              setConfirmResetPassword('');
                            }}
                            title="Reset Password (Admin Only)"
                            className="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer border border-amber-200"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>Reset Password</span>
                          </button>
                        )}
                        {!isMasterAdmin ? (
                          <button
                            onClick={() => handleDeleteSingle(u)}
                            className="px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold italic">
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Create New Account */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New User Account"
        subtitle="Only Admin A26Jaya can authorize and provision new staff logins."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Full Name / Staff Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Juan De La Cruz"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Login Username *
            </label>
            <div className="relative">
              <UserPlus className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. stockman_carlos"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Set password for user"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              System Role / Permissions *
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserAccount['role'])}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white"
            >
              <option value="INVENTORY">STOCKMAN (Stock In, Stock Out, Stock Transfer only)</option>
              <option value="CASHIER">CASHIER (Point of Sale, Billing & Receipts)</option>
              <option value="DISPATCHER">DISPATCHER (Logistics & Deliveries)</option>
              <option value="DRIVER">DELIVERY DRIVER (Mobile App & Dispatches)</option>
              <option value="ADMIN">ADMINISTRATOR (Full System Access)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal to Reset Password (Admin Only) */}
      <Modal
        isOpen={!!resetTargetUser}
        onClose={() => setResetTargetUser(null)}
        title={`Reset Password for @${resetTargetUser?.username}`}
        subtitle={`Admin Authorization: Set a new password for ${resetTargetUser?.name} (${resetTargetUser?.role})`}
        maxWidth="md"
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Admin Password Reset Authorization</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Only the administrator (<strong className="font-mono">A26Jaya</strong>) can reset passwords for staff and admin accounts.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Account Target
            </label>
            <div className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800">
              @{resetTargetUser?.username} — {resetTargetUser?.name} ({resetTargetUser?.role})
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter new password"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmResetPassword}
                onChange={(e) => setConfirmResetPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setResetTargetUser(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
