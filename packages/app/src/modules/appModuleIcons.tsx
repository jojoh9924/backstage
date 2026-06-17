/*
 * Copyright 2026 The Backstage Authors
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

import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { IconBundleBlueprint } from '@backstage/plugin-app-react';
import SvgIcon from '@material-ui/core/SvgIcon';

function BadgeIcon(props: any) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12,1.5 13.7,3.3 16.1,2.8 16.5,5.3 18.7,6.3 17.5,8.5 18.7,10.7 16.5,11.7 16.1,14.2 13.7,13.7 12,15.5 10.3,13.7 7.9,14.2 7.5,11.7 5.3,10.7 6.5,8.5 5.3,6.3 7.5,5.3 7.9,2.8 10.3,3.3" />
        <circle cx="12" cy="8.5" r="3" />
        <polygon points="9.5,14 5,22 6.8,20 8.5,22.5 11.5,14" />
        <polygon points="14.5,14 12.5,14 15.5,22.5 17.2,20 19,22 14.5,14" />
      </g>
    </SvgIcon>
  );
}

export const appModuleIcons = createFrontendModule({
  pluginId: 'app',
  extensions: [
    IconBundleBlueprint.make({
      name: 'custom-icons',
      params: {
        icons: {
          badge: BadgeIcon,
        },
      },
    }),
  ],
});
