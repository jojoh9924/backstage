/*
 * Copyright 2024 The Backstage Authors
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

import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  authProvidersExtensionPoint,
  createProxyAuthProviderFactory,
} from '@backstage/plugin-auth-node';
import { guestAuthenticator } from '@backstage/plugin-auth-backend-module-guest-provider';

export default createBackendModule({
  pluginId: 'auth',
  moduleId: 'guest-provider',
  register(reg) {
    reg.registerInit({
      deps: { providers: authProvidersExtensionPoint },
      async init({ providers }) {
        providers.registerProvider({
          providerId: 'guest',
          factory: createProxyAuthProviderFactory({
            authenticator: guestAuthenticator,
            async signInResolver(_, ctx) {
              return ctx.issueToken({
                claims: {
                  sub: 'user:development/guest',
                  ent: [
                    'user:development/guest',
                    'group:default/team-a',
                  ],
                },
              });
            },
          }),
        });
      },
    });
  },
});
