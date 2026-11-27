export function exportGuestsToCsv(guestsList = []) {
  const csvRows = [
    ['ID', 'Name', 'Phone', 'Email', 'Stays', 'Total Revenue', 'Last Stay', 'Aadhaar Verified'],
    ...guestsList.map(g => [
      g.id,
      g.name,
      g.phone,
      g.email,
      g.totalStays,
      g.totalRevenue,
      g.lastStay,
      g.aadhaarNo ? 'Yes' : 'No'
    ])
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `StayOps_Guest_CRM_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
