import ActionButtons from "./ActionButtons";
import LanguageSelector from "./LanguageSelector";
import UserProfile from "./UserProfile";

const NavbarActions = () => {
  return (
    <div className="navbar-actions">
      <ActionButtons />
      <LanguageSelector />
      <UserProfile />
    </div>
  );
};

export default NavbarActions;