import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield,
  Palette,
  Bell,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useNotifications } from '../contexts/NotificationContext';

const AdminSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const { success, error } = useNotifications();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  // Form states
  const [organizationName, setOrganizationName] = useState('');
  const [organizationLogo, setOrganizationLogo] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Load user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setOrganizationName(user.organizationName || '');
      
      // Check for dark mode
      const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                          document.documentElement.classList.contains('dark');
      setDarkMode(isDarkMode);
    }
  }, [user]);
  
  const toggleSidebar = () => {
    setIsSidebarVisible(prevState => !prevState);
  };
  
  // Toggle dark mode
  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
    
    toast({
      title: `${newDarkMode ? 'Dark' : 'Light'} mode activated`,
      description: `Interface switched to ${newDarkMode ? 'dark' : 'light'} mode`,
    });
  };
  
  // Handle organization settings update
  const handleOrganizationUpdate = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      success('Organization settings updated successfully');
      setLoading(false);
    }, 1000);
  };
  
  // Handle profile update
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      success('Profile updated successfully');
      setLoading(false);
    }, 1000);
  };
  
  // Handle password change
  const handlePasswordChange = (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      setLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    }, 1000);
  };
  
  // Handle notification settings update
  const handleNotificationSettingsUpdate = () => {
    // Simulate API call
    success('Notification settings updated');
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative w-64 z-10 transition-transform duration-300 ease-in-out lg:translate-x-0 h-screen`}>
        <AdminSidebar activePage="settings" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          title="Settings" 
          toggleSidebar={toggleSidebar} 
          isSidebarVisible={isSidebarVisible}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your account and organization preferences
            </p>
          </div>
          
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="mb-8 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
              <TabsTrigger value="account" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="organization" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <Shield className="h-4 w-4 mr-2" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="appearance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>
            
            {/* Account Settings */}
            <TabsContent value="account">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                  <div className="flex items-center mb-6">
                    <User className="h-5 w-5 text-violet-600 dark:text-violet-400 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                  </div>
                  
                  <form onSubmit={handleProfileUpdate}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)}
                            className="mt-1" 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)}
                            className="mt-1" 
                            required 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-1" 
                          required 
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                  <div className="flex items-center mb-6">
                    <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Password</h2>
                  </div>
                  
                  <form onSubmit={handlePasswordChange}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password" 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="mt-1" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1" 
                          required 
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                        {loading ? 'Changing...' : 'Change Password'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </TabsContent>
            
            {/* Organization Settings */}
            <TabsContent value="organization">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-6">
                  <Globe className="h-5 w-5 text-violet-600 dark:text-violet-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Organization Details</h2>
                </div>
                
                <form onSubmit={handleOrganizationUpdate}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input 
                        id="orgName" 
                        value={organizationName} 
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="mt-1" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="orgLogo">Organization Logo</Label>
                      <div className="mt-1 flex items-center">
                        <div className="h-16 w-16 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 mr-4">
                          {organizationLogo ? (
                            <img 
                              src={URL.createObjectURL(organizationLogo)} 
                              alt="Organization logo" 
                              className="h-full w-full object-cover rounded-md" 
                            />
                          ) : (
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <Input
                          id="orgLogoInput"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => setOrganizationLogo(e.target.files[0])}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => document.getElementById('orgLogoInput').click()}
                        >
                          Change Logo
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="orgDescription">Description</Label>
                      <Textarea
                        id="orgDescription"
                        placeholder="Briefly describe your organization"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                    <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Organization Settings'}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
            
            {/* Appearance Settings */}
            <TabsContent value="appearance">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-6">
                  <Palette className="h-5 w-5 text-violet-600 dark:text-violet-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Use dark theme for reduced eye strain in low-light environments</p>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={handleDarkModeToggle}
                    />
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Theme Colors</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div 
                        className="h-12 rounded-md cursor-pointer border-2 border-violet-500 bg-violet-600"
                        title="Violet (Default)"
                      ></div>
                      <div 
                        className="h-12 rounded-md cursor-pointer border border-gray-200 dark:border-gray-700 bg-blue-600"
                        title="Blue"
                      ></div>
                      <div 
                        className="h-12 rounded-md cursor-pointer border border-gray-200 dark:border-gray-700 bg-green-600"
                        title="Green"
                      ></div>
                      <div 
                        className="h-12 rounded-md cursor-pointer border border-gray-200 dark:border-gray-700 bg-amber-600"
                        title="Amber"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Notification Settings */}
            <TabsContent value="notifications">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-6">
                  <Bell className="h-5 w-5 text-violet-600 dark:text-violet-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Settings</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications about task assignments and updates</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={(checked) => {
                        setEmailNotifications(checked);
                        handleNotificationSettingsUpdate();
                      }}
                    />
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive browser notifications for important events</p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={(checked) => {
                        setPushNotifications(checked);
                        handleNotificationSettingsUpdate();
                      }}
                    />
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Notification Types</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Task assignments</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Task status updates</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">New team members</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Due date reminders</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">System updates</span>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
