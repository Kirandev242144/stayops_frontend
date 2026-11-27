import { useState } from "react";
import Reservations from "./Reservations/Reservations";
import DashboardLayout from "../../components/dashboard/layout/DashboardLayout";

import Overview from "./Overview/Overview";
import Frontdesk from "./Frontdesk/Frontdesk";
import Properties from "./Properties/Properties";
import Settings from "./Settings/Settings";
import Calendar from "./Calendar/Calendar";
import PettyCash from "./PettyCash/PettyCash";
import StorefrontStudio from "./StorefrontStudio/StorefrontStudio";
import Team from "./Team/Team";
import Housekeeping from "./Housekeeping/Housekeeping";
import Reports from "./Reports/Reports";

const Dashboard = () => {

  const [activePage, setActivePage] = useState("overview");

  return (
    <DashboardLayout
      activePage={activePage}
      setActivePage={setActivePage}
    >

      {activePage === "overview" && <Overview />}
      {activePage === "frontdesk" && <Frontdesk onNavigate={setActivePage} />}
      {activePage === "reservations" && <Reservations onNavigate={setActivePage} />}
      {activePage === "housekeeping" && (<Housekeeping onBack={() => setActivePage("frontdesk")} />)}
      {activePage === "properties" && (<Properties />)}
      {activePage === "storefront" && (<StorefrontStudio />)}
      {activePage === "settings" && (<Settings />)}
      {activePage === "calendar" && (<Calendar onNavigate={setActivePage} />)}
      {activePage === "pettycash" && (<PettyCash />)}
      {activePage === "team" && (<Team />)}
      {activePage === "reports" && (<Reports />)}

    </DashboardLayout>
  );
};
export default Dashboard;