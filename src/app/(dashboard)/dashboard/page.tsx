
import { NextPage } from 'next';
// import Head from 'next/head';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatCard from '@/components/dashboard/StatCard';
import { AllOrgIcon, DeactivateUserIcon, InactiveUserIcon, UserIcon } from '@/components/icons/icon';
import AppointmentsChart from '@/components/dashboard/AppointmentsChart';
import EmployeeSection from '@/components/dashboard/EmployeeSection';
import PatientsDonut from '@/components/dashboard/PatientsDonut';
import OrganizationList from '@/components/dashboard/OrganizationList';
// import OrganizationStatus from '@/components/dashboard/OrganizationStatus';
// import { Organization, Employee, Patient } from '@/lib/types';

const DashboardPage: NextPage = () => {

  const stats = {
    allOrganizations: { count: 490, growth: null, icon: <AllOrgIcon/> },
    activeOrganizations: { count: 250, growth: 2.45, icon: <UserIcon/> },
    inactiveOrganizations: { count: 100, growth: 2.45, icon: <InactiveUserIcon/> },
    deactivatedOrganizations: { count: 140, growth: -2.45, icon: <DeactivateUserIcon/> },
  };
  
  const appointmentsData = {
    clinic: 'Raven Heights Clinic',
    weeklyGrowth: 5.45,
    appointmentsByDay: [
      { day: 'Mon', male: 20, female: 15 },
      { day: 'Tue', male: 35, female: 25 },
      { day: 'Wed', male: 60, female: 40 },
      { day: 'Thu', male: 45, female: 30 },
      { day: 'Fri', male: 20, female: 10 },
      { day: 'Sat', male: 50, female: 30 },
      { day: 'Sun', male: 40, female: 25 },
    ],
  };
  
  const patientData = {
    totalPatients: 124450,
    ageDistribution: [
      { range: 'Below 30 years', percentage: 25, color: '#0A3161' },
      { range: '30-45 years', percentage: 25, color: '#E63946' },
      { range: '45-59 years', percentage: 35, color: '#FFD700' },
      { range: 'Above 70 years', percentage: 15, color: '#D3D3D3' },
    ],
  };
  
  const employees = [
    {
      id: 1,
      name: 'Denise Hampton',
      role: 'Doctor',
      organization: 'Orlando Medical Center',
      description: 'Lorem ipsum dolor sit amet consectetur. Cursus nec amet ipsum a. Faucibus volutpat quis cras aliquam a sed.',
      image: '/assets/images/profilepic.png',
    },
    {
      id: 2,
      name: 'Jenifer Gloria',
      role: 'Nurse',
      organization: 'Bridgeton Clinic',
      image: '/assets/images/profilepic.png',
    },
    {
      id: 3,
      name: 'Cole Joshua',
      role: 'Doctor',
      organization: 'Raven Heights Clinic',
      image: '/assets/images/profilepic.png',
    },
  ];
  
  const organizations = [
    { id: 1, name: 'JON-KEN Hospital', location: 'Lagos, Nigeria', status: 'Active', image: '/assets/images/profilepic.png' },
    { id: 2, name: 'Raven Heights Clinic', location: 'Abuja, Nigeria', status: 'Active', image: '/assets/images/profilepic.png' },
    { id: 3, name: 'Bridgeton Clinic', location: 'Abuja, Nigeria', status: 'Deactivated', image: '/assets/images/profilepic.png' },
    { id: 4, name: 'John Hopkins Clinic', location: 'Abuja, Nigeria', status: 'Inactive', image: '/assets/images/profilepic.png' },
  ];
  
  const organizationStats = {
    totalCount: 490,
    activeCount: 250,
    inactiveCount: 100,
    deactivatedCount: 140,
    completionPercentage: 99,
  };

  return (
    <div className="min-h-screen w-full">
      
      <DashboardHeader username="Daniel James" role="Admin" />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[20px] font-medium text-[#595959]">Welcome</h1>
          <h2 className="text-[24px] font-bold text-[#003465]">Daniel James!</h2>
          <span className="text-[#737373] text-[12px]">Here are your important tasks, updates and alerts.</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            title="All Organizations" 
            value={stats.allOrganizations.count} 
            growth={stats.allOrganizations.growth}
            color="blue" 
            icon={stats.allOrganizations.icon}
          />
          <StatCard 
            title="Active Organizations" 
            value={stats.activeOrganizations.count} 
            growth={stats.activeOrganizations.growth}
            color="green" 
            icon={stats.activeOrganizations.icon}

          />
          <StatCard 
            title="Inactive Organizations" 
            value={stats.inactiveOrganizations.count} 
            growth={stats.inactiveOrganizations.growth}
            color="yellow" 
            icon={stats.inactiveOrganizations.icon}

          />
          <StatCard 
            title="Deactived Organizations" 
            value={stats.deactivatedOrganizations.count} 
            growth={stats.deactivatedOrganizations.growth}
            color="red" 
            icon={stats.deactivatedOrganizations.icon}

          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AppointmentsChart data={appointmentsData} />
          <EmployeeSection employees={employees} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PatientsDonut data={patientData} />
          <div className="grid grid-cols-1 gap-6">
            <OrganizationList organizations={organizations} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrganizationList organizations={organizations} />
          {/* <OrganizationStatus data={organizationStats} /> */}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;