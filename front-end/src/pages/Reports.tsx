import React from 'react';
import ReportsLayout from './reports/ReportsLayout';
import ReportsFinancial from './reports/ReportsFinancial';
import ReportsManagerial from './reports/ReportsManagerial';
import ReportsOperational from './reports/ReportsOperational';
import { useReportsData } from './reports/useReportsData';

export default function Reports() {
  const data = useReportsData();

  const renderActiveView = () => {
    switch (data.activeTab) {
      case 'financial':
        return <ReportsFinancial data={data} />;
      case 'operational':
        return <ReportsOperational data={data} />;
      case 'managerial':
        return <ReportsManagerial data={data} />;
      default:
        return <ReportsFinancial data={data} />;
    }
  };

  return (
    <ReportsLayout
      activeTab={data.activeTab}
      onTabChange={data.setActiveTab}
      startDate={data.startDate}
      endDate={data.endDate}
      onStartDateChange={data.setStartDate}
      onEndDateChange={data.setEndDate}
      vehicleFilter={data.vehicleFilter}
      onVehicleFilterChange={data.setVehicleFilter}
      companyFilter={data.companyFilter}
      onCompanyFilterChange={data.setCompanyFilter}
      vehicles={data.vehicles}
      companies={data.companies}
      loading={data.loading}
      refreshing={data.refreshing}
      loadError={data.loadError}
      onRefresh={() => void data.loadReports('refresh')}
    >
      {renderActiveView()}
    </ReportsLayout>
  );
}
