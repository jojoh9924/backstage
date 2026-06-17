/*
 * Copyright 2023 The Backstage Authors
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
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { createRouter } from './service/router';
import { createNotificationsActions } from './actions';
import { signalsServiceRef } from '@backstage/plugin-signals-node';
import {
  NotificationProcessor,
  NotificationRecipientResolver,
  notificationsProcessingExtensionPoint,
  NotificationsProcessingExtensionPoint,
} from '@backstage/plugin-notifications-node';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { DatabaseNotificationsStore } from './database';
import { NotificationCleaner } from './service/NotificationCleaner.ts';

class NotificationsProcessingExtensionPointImpl
  implements NotificationsProcessingExtensionPoint
{
  #processors = new Array<NotificationProcessor>();
  #recipientResolver: NotificationRecipientResolver | undefined = undefined;

  addProcessor(
    ...processors: Array<NotificationProcessor | Array<NotificationProcessor>>
  ): void {
    this.#processors.push(...processors.flat());
  }

  get processors() {
    return this.#processors;
  }

  setNotificationRecipientResolver(
    resolver: NotificationRecipientResolver,
  ): void {
    if (this.#recipientResolver) {
      throw new Error(
        'Notification recipient resolver is already set. You can only set it once.',
      );
    }
    this.#recipientResolver = resolver;
  }

  get recipientResolver() {
    return this.#recipientResolver;
  }
}

/**
 * Notifications backend plugin
 *
 * @public
 */
export const notificationsPlugin = createBackendPlugin({
  pluginId: 'notifications',
  register(env) {
    const processingExtensions =
      new NotificationsProcessingExtensionPointImpl();
    env.registerExtensionPoint(
      notificationsProcessingExtensionPoint,
      processingExtensions,
    );

    env.registerInit({
      deps: {
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        userInfo: coreServices.userInfo,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        database: coreServices.database,
        signals: signalsServiceRef,
        config: coreServices.rootConfig,
        catalog: catalogServiceRef,
        scheduler: coreServices.scheduler,
        actionsRegistry: actionsRegistryServiceRef,
      },
      async init({
        auth,
        httpAuth,
        userInfo,
        httpRouter,
        logger,
        database,
        signals,
        config,
        catalog,
        scheduler,
        actionsRegistry,
      }) {
        const store = await DatabaseNotificationsStore.create({ database });

        const db = await database.getClient();
        const obsoleteIds = [
          'demo-time-saved-team-v1',
          'demo-time-saved-team-v2',
          'demo-time-saved-personal-v4',
        ];
        for (const oldId of obsoleteIds) {
          await db('notification').where('id', oldId).delete();
        }

        const demoBroadcasts = [
          {
            id: 'demo-broadcast-personal-v1',
            title:
              'You completed 5 self-service actions this month, saving an estimated 30 hours of time.',
          },
          {
            id: 'demo-broadcast-team-v1',
            title:
              'Your team Red Hat Desktop completed 24 self-service actions this month, saving an estimated 5 days of time.',
            link: '/engineering-insights',
          },
        ];
        for (const n of demoBroadcasts) {
          const exists = await db('broadcast').where('id', n.id).first();
          if (!exists) {
            await store.saveBroadcast({
              id: n.id,
              user: null,
              created: new Date(),
              origin: 'scaffolder',
              payload: {
                title: n.title,
                severity: 'normal',
                topic: 'scaffolder',
                icon: 'badge',
                ...('link' in n && n.link ? { link: n.link } : {}),
              },
            });
          }
        }

        httpRouter.use(
          await createRouter({
            auth,
            httpAuth,
            userInfo,
            logger,
            config,
            store,
            catalog,
            signals,
            processors: processingExtensions.processors,
            recipientResolver: processingExtensions.recipientResolver,
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        const cleaner = new NotificationCleaner(
          config,
          scheduler,
          logger,
          store,
        );
        await cleaner.initTaskRunner();

        createNotificationsActions({ actionsRegistry, auth, store });
      },
    });
  },
});
