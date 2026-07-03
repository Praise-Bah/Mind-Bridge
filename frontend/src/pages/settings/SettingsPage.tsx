import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  User, Bell, Shield, Palette, Monitor, AlertTriangle, 
  Moon, Sun, Laptop, Eye, Mail, MessageSquare
} from 'lucide-react'
import { RootState } from '@/store'
import { logout } from '@/store/slices/authSlice'
import { userService } from '@/services/userService'

export default function SettingsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  
  const [activeTab, setActiveTab] = useState('account')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  
  // Form states
  const [accountData, setAccountData] = useState({
    email: user?.email || '',
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    timezone: user?.timezone || 'UTC',
    old_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const [privacyData, setPrivacyData] = useState({
    anonymous_mode: (user as any)?.anonymous_mode || false,
    profile_visibility: (user as any)?.profile_visibility || 'public',
    allow_messages_from: (user as any)?.allow_messages_from || 'everyone'
  })
  
  const [appearanceData, setAppearanceData] = useState({
    theme: (user as any)?.theme || 'system',
    text_size: (user as any)?.text_size || 'medium'
  })
  
  const [notificationData, setNotificationData] = useState({
    daily_notification_time: (user as any)?.daily_notification_time || '09:00',
    email_notifications_enabled: (user as any)?.email_notifications_enabled !== false,
    push_notifications_enabled: (user as any)?.push_notifications_enabled !== false
  })

  const handleSave = async (section: string, data: any) => {
    setLoading(true)
    setSuccess('')
    
    try {
      let endpoint = ''
      switch (section) {
        case 'account':
          if (data.new_password) {
            await userService.changePassword({
              old_password: data.old_password,
              new_password: data.new_password
            })
          }
          await userService.updateProfile({
            username: data.username,
            first_name: data.first_name,
            last_name: data.last_name,
            bio: data.bio,
            timezone: data.timezone
          })
          break
        case 'privacy':
          endpoint = '/users/settings/privacy/'
          await userService.updateSettings(endpoint, data)
          break
        case 'appearance':
          endpoint = '/users/settings/appearance/'
          await userService.updateSettings(endpoint, data)
          break
        case 'notifications':
          endpoint = '/users/settings/notifications/'
          await userService.updateSettings(endpoint, data)
          break
      }
      
      setSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleDeactivate = async () => {
    setLoading(true)
    try {
      await userService.deactivateAccount({
        password: accountData.old_password,
        confirmation: 'deactivate'
      })
      dispatch(logout())
      navigate('/login')
    } catch (error) {
      console.error('Failed to deactivate account:', error)
    } finally {
      setLoading(false)
      setShowDeactivateModal(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await userService.deleteAccount({
        password: accountData.old_password,
        confirmation: 'delete my account'
      })
      dispatch(logout())
      navigate('/login')
    } catch (error) {
      console.error('Failed to delete account:', error)
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
    }
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'sessions', label: 'Sessions', icon: Monitor },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account preferences and settings</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
          {success}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:space-y-1 lg:overflow-visible lg:pb-0 lg:w-64 lg:shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-colors lg:w-full ${
                activeTab === tab.id
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Account Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={accountData.email}
                      disabled
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                    <input
                      type="text"
                      value={accountData.username}
                      onChange={(e) => setAccountData({...accountData, username: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                      <input
                        type="text"
                        value={accountData.first_name}
                        onChange={(e) => setAccountData({...accountData, first_name: e.target.value})}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={accountData.last_name}
                        onChange={(e) => setAccountData({...accountData, last_name: e.target.value})}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={accountData.bio}
                      onChange={(e) => setAccountData({...accountData, bio: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                    <select
                      value={accountData.timezone}
                      onChange={(e) => setAccountData({...accountData, timezone: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleSave('account', accountData)}
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={accountData.old_password}
                      onChange={(e) => setAccountData({...accountData, old_password: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={accountData.new_password}
                      onChange={(e) => setAccountData({...accountData, new_password: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={accountData.confirm_password}
                      onChange={(e) => setAccountData({...accountData, confirm_password: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleSave('account', {
                      old_password: accountData.old_password,
                      new_password: accountData.new_password
                    })}
                    disabled={loading || !accountData.old_password || !accountData.new_password}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Notification Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail size={18} className="text-gray-400" />
                        <span className="text-gray-300">Daily email digest</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationData.email_notifications_enabled}
                        onChange={(e) => setNotificationData({...notificationData, email_notifications_enabled: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare size={18} className="text-gray-400" />
                        <span className="text-gray-300">New message notifications</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationData.email_notifications_enabled}
                        onChange={(e) => setNotificationData({...notificationData, email_notifications_enabled: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                    </label>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell size={18} className="text-gray-400" />
                        <span className="text-gray-300">Enable push notifications</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationData.push_notifications_enabled}
                        onChange={(e) => setNotificationData({...notificationData, push_notifications_enabled: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Daily Digest Time</label>
                  <input
                    type="time"
                    value={notificationData.daily_notification_time}
                    onChange={(e) => setNotificationData({...notificationData, daily_notification_time: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleSave('notifications', notificationData)}
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Privacy Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Profile Visibility</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye size={18} className="text-gray-400" />
                        <div>
                          <span className="text-gray-300">Anonymous mode</span>
                          <p className="text-xs text-gray-500 mt-0.5">All your community posts and comments will use a unique pseudonym instead of your real name</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyData.anonymous_mode}
                        onChange={(e) => setPrivacyData({...privacyData, anonymous_mode: e.target.checked})}
                        className="w-5 h-5 rounded flex-shrink-0"
                      />
                    </label>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Profile visibility</label>
                      <select
                        value={privacyData.profile_visibility}
                        onChange={(e) => setPrivacyData({...privacyData, profile_visibility: e.target.value as 'public' | 'friends' | 'private'})}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Message Settings</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Who can message me</label>
                    <select
                      value={privacyData.allow_messages_from}
                      onChange={(e) => setPrivacyData({...privacyData, allow_messages_from: e.target.value as 'everyone' | 'friends' | 'nobody'})}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleSave('privacy', privacyData)}
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Appearance Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Theme</h3>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <button
                      onClick={() => setAppearanceData({...appearanceData, theme: 'light'})}
                      className={`p-4 rounded-lg border ${appearanceData.theme === 'light' ? 'border-indigo-500 bg-indigo-500/20' : 'border-white/10 bg-white/5'}`}
                    >
                      <Sun size={24} className="mx-auto mb-2 text-yellow-400" />
                      <span className="text-sm text-gray-300">Light</span>
                    </button>
                    
                    <button
                      onClick={() => setAppearanceData({...appearanceData, theme: 'dark'})}
                      className={`p-4 rounded-lg border ${appearanceData.theme === 'dark' ? 'border-indigo-500 bg-indigo-500/20' : 'border-white/10 bg-white/5'}`}
                    >
                      <Moon size={24} className="mx-auto mb-2 text-blue-400" />
                      <span className="text-sm text-gray-300">Dark</span>
                    </button>
                    
                    <button
                      onClick={() => setAppearanceData({...appearanceData, theme: 'system'})}
                      className={`p-4 rounded-lg border ${appearanceData.theme === 'system' ? 'border-indigo-500 bg-indigo-500/20' : 'border-white/10 bg-white/5'}`}
                    >
                      <Monitor size={24} className="mx-auto mb-2 text-gray-400" />
                      <span className="text-sm text-gray-300">System</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Text Size</h3>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <button
                      onClick={() => setAppearanceData({...appearanceData, text_size: 'small'})}
                      className={`p-4 rounded-lg border ${appearanceData.text_size === 'small' ? 'border-indigo-500 bg-indigo-500/20' : 'border-white/10 bg-white/5'}`}
                    >
                      <span className="text-sm text-gray-300">Small</span>
                    </button>
                    
                    <button
                      onClick={() => setAppearanceData({...appearanceData, text_size: 'medium'})}
                      className={`p-4 rounded-lg border ${appearanceData.text_size === 'medium' ? 'border-indigo-500 bg-indigo-500/20' : 'border-white/10 bg-white/5'}`}
                    >
                      <span className="text-gray-300">Medium</span>
                    </button>
                    
                    <button
                      onClick={() => setAppearanceData({...appearanceData, text_size: 'large'})}
                      className={`p-4 rounded-lg border ${appearanceData.text_size === 'large' ? 'border-indigo-500 bg-indigo-500/20' : 'border-white/10 bg-white/5'}`}
                    >
                      <span className="text-lg text-gray-300">Large</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleSave('appearance', appearanceData)}
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Active Sessions</h2>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <Laptop size={20} className="text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white font-medium">Current Device</p>
                      <p className="text-gray-400 text-sm truncate">Chrome on Windows • {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto shrink-0 px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">Current</span>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Sign Out Everywhere
                </button>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-2">Danger Zone</h2>
                <p className="text-gray-400 mb-6">These actions are irreversible. Please proceed with caution.</p>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/5 rounded-lg">
                    <div className="min-w-0">
                      <h3 className="text-white font-medium">Deactivate Account</h3>
                      <p className="text-gray-400 text-sm">Temporarily disable your account. You can reactivate it later.</p>
                    </div>
                    <button
                      onClick={() => setShowDeactivateModal(true)}
                      className="self-start sm:self-auto shrink-0 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                    >
                      Deactivate
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="min-w-0">
                      <h3 className="text-red-400 font-medium">Delete Account</h3>
                      <p className="text-gray-400 text-sm">Permanently delete your account and all data. This cannot be undone.</p>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="self-start sm:self-auto shrink-0 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Deactivate Account</h3>
            <p className="text-gray-400 mb-6">Are you sure you want to deactivate your account? You can reactivate it later by logging back in.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Enter your password</label>
              <input
                type="password"
                value={accountData.old_password}
                onChange={(e) => setAccountData({...accountData, old_password: e.target.value})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="Enter password"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={loading || !accountData.old_password}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
              >
                {loading ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-red-400 mb-4">Delete Account</h3>
            <p className="text-gray-400 mb-6">This action cannot be undone. All your data will be permanently deleted.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Enter your password</label>
              <input
                type="password"
                value={accountData.old_password}
                onChange={(e) => setAccountData({...accountData, old_password: e.target.value})}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="Enter password"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Type "delete my account" to confirm</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="delete my account"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || !accountData.old_password}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
