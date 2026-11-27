import React from 'react';
import NeatCheckbox from './NeatCheckbox';
import { PERMISSION_CONFIG } from './teamModalConstants';

export default function PermissionsSelector({ permissions = {}, onChange }) {
  return (
    <div className="form-group full-width">
      <div className="form-group-label-row">
        <label>Permissions & App Capabilities</label>
        <span className="role-hint">Define staff mobile app capabilities</span>
      </div>

      <div className="permissions-card">
        {PERMISSION_CONFIG.map((item) => {
          const isChecked = Boolean(permissions[item.key]);
          return (
            <NeatCheckbox
              key={item.key}
              id={`perm-${item.key}`}
              checked={isChecked}
              onChange={(e) => onChange(item.key, e.target.checked)}
              label={item.label}
              className={`permission-row ${isChecked ? 'permission-row-checked' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}
