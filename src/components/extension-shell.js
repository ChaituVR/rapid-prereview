import React from 'react';
import PropTypes from 'prop-types';
import HTML5Backend from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import { BrowserRouter as Router } from 'react-router-dom';
import Shell from './shell';
import ShellContent from './shell-content';
import { UserProvider } from '../contexts/user-context';
import { StoresProvider } from '../contexts/store-context';

export default function ExtensionShell({
  defaultTab = 'read',
  preprint,
  user,
  preprintsWithActionsStore,
  roleStore
}) {
  return (
    <Router>
      <DndProvider backend={HTML5Backend}>
        <StoresProvider
          preprintsWithActionsStore={preprintsWithActionsStore}
          roleStore={roleStore}
        >
          <UserProvider user={user}>
            <div className="extension-shell">
              <Shell>
                {onRequireScreen => (
                  <ShellContent
                    onRequireScreen={onRequireScreen}
                    preprint={preprint}
                    defaultTab={defaultTab}
                  />
                )}
              </Shell>
            </div>
          </UserProvider>
        </StoresProvider>
      </DndProvider>
    </Router>
  );
}

ExtensionShell.propTypes = {
  defaultTab: PropTypes.oneOf(['read', 'review', 'request']),
  preprint: PropTypes.object.isRequired,
  preprintsWithActionsStore: PropTypes.object.isRequired,
  roleStore: PropTypes.object.isRequired,
  user: PropTypes.object // only present if logged in
};
