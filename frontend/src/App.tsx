import { useState, useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useSettingsContext } from 'providers/SettingsProvider';
import { REFRESH } from 'reducers/SettingsReducer';
import SettingPanelToggler from 'components/settings-panel/SettingPanelToggler';
import SettingsPanel from 'components/settings-panel/SettingsPanel';
import GlobalDim from 'components/GlobalDim';
import { setLoadingCallback } from 'api/client';

const App = () => {
  const { pathname } = useLocation();
  const { configDispatch } = useSettingsContext();
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    setLoadingCallback(setApiLoading);
    return () => setLoadingCallback(null);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useLayoutEffect(() => {
    configDispatch({ type: REFRESH });
  }, []);

  return (
    <>
      <GlobalDim visible={apiLoading} />
      <Outlet />
      <SettingsPanel />
      <SettingPanelToggler />
    </>
  );
};

export default App;
