/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import { Link } from 'react-router-dom';
import SearchIcon from '@material-ui/icons/Search';
import MenuIcon from '@material-ui/icons/Menu';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { NotificationsSidebarItem } from '@backstage/plugin-notifications';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';
import { makeStyles } from '@material-ui/core/styles';
import rhdhLogo from '../assets/rhdh-logo.png';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
    textDecoration: 'none',
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();

  return (
    <div className={classes.root}>
      <Link to="/" className={classes.link} aria-label="Home">
        <img src={rhdhLogo} alt="Red Hat Developer Hub" style={{ height: 30 }} />
      </Link>
    </div>
  );
};

export const appModuleNav = createFrontendModule({
  pluginId: 'app',
  extensions: [
    NavContentBlueprint.make({
      params: {
        component: ({ navItems }) => {
          const nav = navItems.withComponent(item => (
            <SidebarItem
              icon={() => item.icon}
              to={item.href}
              text={item.title}
            />
          ));
          // Consume without rendering — these are handled by dedicated sidebar groups
          nav.take('page:home');
          nav.take('page:search');
          return (
            <Sidebar>
              <SidebarLogo />
              <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
                <SidebarSearchModal />
              </SidebarGroup>
              <SidebarDivider />
              <SidebarGroup label="Menu" icon={<MenuIcon />}>
                {nav.take('page:catalog')}
                {nav.take('page:scaffolder')}
                <SidebarDivider />
                <SidebarScrollWrapper>
                  {nav.rest({ sortBy: 'title' })}
                </SidebarScrollWrapper>
              </SidebarGroup>
              <SidebarDivider />
              <SidebarSpace />
              <SidebarDivider />
              <SidebarGroup
                label="Settings"
                icon={<UserSettingsSignInAvatar />}
                to="/settings"
              >
                <NotificationsSidebarItem />
                <SidebarItem
                  icon={TrendingUpIcon}
                  to="/adoption-insights"
                  text="Adoption Insights"
                />
                {nav.take('page:devtools')}
                {nav.take('page:user-settings')}
              </SidebarGroup>
            </Sidebar>
          );
        },
      },
    }),
  ],
});
